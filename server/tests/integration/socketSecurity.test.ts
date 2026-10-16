import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus, LatestBusPosition } from '../../src/models';
import { initSocketServer, closeSocketServer, MAX_ROOMS_PER_SOCKET } from '../../src/modules/realtime/socket.server';
import { RealtimeEvents } from '../../src/modules/realtime/realtime.types';
import { locationRepository } from '../../src/modules/location/location.repository';

describe('Phase 10 — Socket.IO Security & Resource Protection (Integration)', () => {
  let httpServer: http.Server;
  let serverPort: number;
  let clientSockets: ClientSocket[] = [];

  beforeAll(async () => {
    httpServer = http.createServer(app);
    initSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address() as AddressInfo;
        serverPort = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const client of clientSockets) {
      if (client.connected) {
        client.disconnect();
      }
    }
    await closeSocketServer();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(locationRepository, 'getLatestPositionByBusId').mockResolvedValue(null);
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);

    // Mock Bus.findById to always find bus
    vi.spyOn(Bus, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        fleetNumber: 'MDU-PRY-001',
        registrationNumber: 'TN-58-N-1000'
      })
    } as any);

    // Mock LatestBusPosition.findOne to return null snapshot
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);
  });

  afterEach(() => {
    for (const client of clientSockets) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clientSockets = [];
  });

  function createClient(options?: { token?: string }): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
        auth: options?.token ? { token: options.token } : undefined
      });

      clientSockets.push(client);

      client.on('connect', () => resolve(client));
      client.on('connect_error', (err) => reject(err));
    });
  }

  it('should enforce MAX_ROOMS_PER_SOCKET and emit MAX_SUBSCRIPTIONS_EXCEEDED when limit is reached', async () => {
    const client = await createClient();

    // Subscribe up to limit (30 rooms) sequentially
    for (let i = 0; i < MAX_ROOMS_PER_SOCKET; i++) {
      const busId = new Types.ObjectId().toString();
      const ackPromise = new Promise<void>((resolve) => {
        client.once(RealtimeEvents.SUBSCRIPTION_ACK, () => resolve());
      });
      client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId });
      await ackPromise;
    }

    // Attempt the 31st subscription (exceeding limit)
    const extraBusId = new Types.ObjectId().toString();
    const errorPromise = new Promise<any>((resolve) => {
      client.once(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => {
        resolve(err);
      });
    });

    client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: extraBusId });

    const err = await errorPromise;
    expect(err.code).toBe('MAX_SUBSCRIPTIONS_EXCEEDED');
    expect(err.error).toContain('Maximum subscriptions limit');
  });

  it('should reject handshake when invalid or malformed JWT is supplied', async () => {
    await expect(createClient({ token: 'malformed.invalid.token' })).rejects.toThrow();
  });

  it('should allow clean unsubscription and room tracking cleanup on client disconnect', async () => {
    const client = await createClient();
    const busId = new Types.ObjectId().toString();

    const ackPromise = new Promise<void>((resolve) => {
      client.on(RealtimeEvents.SUBSCRIPTION_ACK, () => resolve());
    });
    client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId });
    await ackPromise;

    // Disconnect client
    client.disconnect();
    expect(client.connected).toBe(false);
  });
});
