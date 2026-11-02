import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus, Route, LatestBusPosition } from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';
import { initSocketServer, closeSocketServer } from '../../src/modules/realtime/socket.server';
import { RealtimeEvents } from '../../src/modules/realtime/realtime.types';
import { locationPipelineService } from '../../src/modules/location/locationPipeline.service';
import { locationRepository } from '../../src/modules/location/location.repository';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Socket.IO Real-Time Tracking Server (Integration)', () => {
  let httpServer: http.Server;
  let serverPort: number;
  let clientSockets: ClientSocket[] = [];

  const mockAdminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@tnstc.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const mockPassengerToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'passenger@example.com',
    role: 'PASSENGER',
    sessionId: new Types.ObjectId().toString()
  });

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
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);
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

  // ---------------------------------------------------------------------------
  // 1. Connection & Authentication
  // ---------------------------------------------------------------------------
  describe('Connection & Authentication Policy', () => {
    it('should allow public passenger connection without credentials', async () => {
      const client = await createClient();
      expect(client.connected).toBe(true);
    });

    it('should allow authenticated connection with valid JWT in handshake auth', async () => {
      const client = await createClient({ token: mockPassengerToken });
      expect(client.connected).toBe(true);
    });

    it('should allow authenticated connection with ADMIN JWT', async () => {
      const client = await createClient({ token: mockAdminToken });
      expect(client.connected).toBe(true);
    });

    it('should reject connection when invalid token is provided', async () => {
      await expect(createClient({ token: 'invalid-expired-jwt-token' })).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Bus Subscriptions & Room Controls
  // ---------------------------------------------------------------------------
  describe('Bus Room Subscriptions (subscribe:bus)', () => {
    it('should return MALFORMED_PAYLOAD when busId is invalid format', async () => {
      const client = await createClient();

      const errorPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => resolve(err));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: 'not-a-valid-hex-id' });
      const err = await errorPromise;

      expect(err.code).toBe('MALFORMED_PAYLOAD');
      expect(err.error).toContain('ObjectId');
    });

    it('should return RESOURCE_NOT_FOUND when bus does not exist in database', async () => {
      const nonExistentBusId = new Types.ObjectId().toString();
      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const client = await createClient();

      const errorPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => resolve(err));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: nonExistentBusId });
      const err = await errorPromise;

      expect(err.code).toBe('RESOURCE_NOT_FOUND');
      expect(err.channel).toBe(`bus:${nonExistentBusId}`);
    });

    it('should successfully subscribe to valid bus and receive snapshot in ack', async () => {
      const busId = new Types.ObjectId();
      const mockBus = {
        _id: busId,
        fleetNumber: 'MDU-MGR-084',
        registrationNumber: 'TN-58-N-2144'
      };

      const mockLatest = {
        busId,
        location: { type: 'Point', coordinates: [78.1158, 9.9178] },
        heading: 180,
        speedKmph: 45,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        recordedAt: new Date(),
        receivedAt: new Date()
      };

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBus)
      } as any);

      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockLatest)
      } as any);

      const client = await createClient();

      const ackPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, (ack) => resolve(ack));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: busId.toString() });
      const ack = await ackPromise;

      expect(ack.status).toBe('SUBSCRIBED');
      expect(ack.channel).toBe(`bus:${busId.toString()}`);
      expect(ack.snapshot).not.toBeNull();
      expect(ack.snapshot.busId).toBe(busId.toString());
      expect(ack.snapshot.fleetNumber).toBe('MDU-MGR-084');
      expect(ack.snapshot.speedKmph).toBe(45);
    });

    it('should allow unsubscribing from bus room', async () => {
      const busId = new Types.ObjectId().toString();
      const client = await createClient();

      const unackPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.UNSUBSCRIPTION_ACK, (res) => resolve(res));
      });

      client.emit(RealtimeEvents.UNSUBSCRIBE_BUS, { busId });
      const res = await unackPromise;

      expect(res.status).toBe('UNSUBSCRIBED');
      expect(res.channel).toBe(`bus:${busId}`);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Route Subscriptions (subscribe:route)
  // ---------------------------------------------------------------------------
  describe('Route Room Subscriptions (subscribe:route)', () => {
    it('should return RESOURCE_NOT_FOUND when route does not exist', async () => {
      const routeId = new Types.ObjectId().toString();
      vi.spyOn(Route, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const client = await createClient();

      const errorPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => resolve(err));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_ROUTE, { routeId });
      const err = await errorPromise;

      expect(err.code).toBe('RESOURCE_NOT_FOUND');
      expect(err.channel).toBe(`route:${routeId}`);
    });

    it('should subscribe to route and receive active buses snapshot in ack', async () => {
      const routeId = new Types.ObjectId();
      const busId = new Types.ObjectId();

      vi.spyOn(Route, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: routeId, routeNumber: '70' })
      } as any);

      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            busId,
            routeId,
            location: { type: 'Point', coordinates: [78.1158, 9.9178] },
            heading: 90,
            speedKmph: 35,
            trackingStatus: 'SIMULATED',
            source: 'SIMULATOR',
            recordedAt: new Date(),
            receivedAt: new Date()
          }
        ])
      } as any);

      const client = await createClient();

      const ackPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, (ack) => resolve(ack));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_ROUTE, { routeId: routeId.toString() });
      const ack = await ackPromise;

      expect(ack.status).toBe('SUBSCRIBED');
      expect(ack.channel).toBe(`route:${routeId.toString()}`);
      expect(ack.snapshot.routeId).toBe(routeId.toString());
      expect(ack.snapshot.activeBusesCount).toBe(1);
      expect(ack.snapshot.buses[0].busId).toBe(busId.toString());
    });

    it('should allow unsubscribing from route room', async () => {
      const routeId = new Types.ObjectId().toString();
      const client = await createClient();

      const unackPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.UNSUBSCRIPTION_ACK, (res) => resolve(res));
      });

      client.emit(RealtimeEvents.UNSUBSCRIBE_ROUTE, { routeId });
      const res = await unackPromise;

      expect(res.status).toBe('UNSUBSCRIBED');
      expect(res.channel).toBe(`route:${routeId}`);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Rate Limiting Protection
  // ---------------------------------------------------------------------------
  describe('Subscription Rate Limiting', () => {
    it('should throttle and return RATE_LIMITED error when client floods subscription requests', async () => {
      const client = await createClient();
      const busId = new Types.ObjectId().toString();

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: busId })
      } as any);
      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      let rateLimitHit = false;

      client.on(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => {
        if (err.code === 'RATE_LIMITED') {
          rateLimitHit = true;
        }
      });

      // Rapidly fire 25 subscription requests (limit is 20)
      for (let i = 0; i < 25; i++) {
        client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId });
      }

      await new Promise((r) => setTimeout(r, 200));
      expect(rateLimitHit).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. End-to-End Pipeline to Socket Broadcast
  // ---------------------------------------------------------------------------
  describe('Pipeline-to-Socket Live Broadcast Integration', () => {
    it('should broadcast position update to subscribed client when pipeline accepts observation', async () => {
      const busId = new Types.ObjectId();
      const routeId = new Types.ObjectId();

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: busId, registrationNumber: 'TN-58-N-TEST' })
      } as any);
      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const client = await createClient();

      // Subscribe client to bus room
      await new Promise<void>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, () => resolve());
        client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: busId.toString() });
      });

      // Prepare listener for incoming position broadcast
      const broadcastPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.BUS_POSITION, (pos) => resolve(pos));
      });

      // Feed valid observation through the universal location pipeline
      const observation: LocationObservation = {
        busId,
        routeId,
        location: { type: 'Point', coordinates: [78.1158, 9.9178] },
        heading: 120,
        speedKmph: 42,
        accuracyMeters: 4,
        source: 'SIMULATOR',
        trackingStatus: 'SIMULATED',
        validationStatus: 'VALID',
        recordedAt: new Date(),
        receivedAt: new Date()
      };

      const result = await locationPipelineService.processObservation(observation);
      expect(result.accepted).toBe(true);

      const broadcastedPos = await broadcastPromise;

      expect(broadcastedPos.busId).toBe(busId.toString());
      expect(broadcastedPos.routeId).toBe(routeId.toString());
      expect(broadcastedPos.speedKmph).toBe(42);
      expect(broadcastedPos.heading).toBe(120);
      expect(broadcastedPos.trackingStatus).toBe('SIMULATED');
      expect(broadcastedPos.source).toBe('SIMULATOR');
    });

    it('should NOT broadcast when observation is rejected by location pipeline', async () => {
      const busId = new Types.ObjectId();

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: busId })
      } as any);
      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const client = await createClient();

      await new Promise<void>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, () => resolve());
        client.emit(RealtimeEvents.SUBSCRIBE_BUS, { busId: busId.toString() });
      });

      let receivedEvent = false;
      client.on(RealtimeEvents.BUS_POSITION, () => {
        receivedEvent = true;
      });

      // Feed invalid observation (out of Tamil Nadu bounds / latitude > 90)
      const invalidObservation: LocationObservation = {
        busId,
        location: { type: 'Point', coordinates: [78.1158, 195.0] }, // Impossible latitude
        heading: 120,
        speedKmph: 42,
        accuracyMeters: 4,
        source: 'SIMULATOR',
        trackingStatus: 'SIMULATED',
        recordedAt: new Date(),
        receivedAt: new Date()
      };

      const result = await locationPipelineService.processObservation(invalidObservation);
      expect(result.accepted).toBe(false);

      // Wait 150ms to verify no socket message is dispatched
      await new Promise((r) => setTimeout(r, 150));
      expect(receivedEvent).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Fleet Subscriptions & Permissions
  // ---------------------------------------------------------------------------
  describe('Fleet Subscriptions (subscribe:fleet)', () => {
    it('should acknowledge general fleet subscription and return active buses snapshot', async () => {
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            busId: new Types.ObjectId(),
            location: { coordinates: [78.1198, 9.9252] },
            heading: 90,
            speedKmph: 30,
            trackingStatus: 'LIVE',
            source: 'VEHICLE_HARDWARE_GPS',
            recordedAt: new Date(),
            receivedAt: new Date()
          }
        ])
      } as any);

      const client = await createClient();

      const ackPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, (ack) => resolve(ack));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_FLEET, {});
      const ack = await ackPromise;

      expect(ack.channel).toBe('fleet:all');
      expect(ack.status).toBe('SUBSCRIBED');
      expect(ack.snapshot).toBeDefined();
      expect(ack.snapshot.totalBusesCount).toBe(1);
    });

    it('should reject unauthenticated client attempting restricted fleet subscription with UNAUTHORIZED', async () => {
      const client = await createClient(); // unauthenticated anonymous

      const errorPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ERROR, (err) => resolve(err));
      });

      client.emit(RealtimeEvents.SUBSCRIBE_FLEET, { includeRestricted: true });
      const err = await errorPromise;

      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.error).toContain('Administrator');
    });

    it('should permit authenticated ADMIN client to subscribe to restricted fleet data', async () => {
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const adminClient = await createClient({ token: mockAdminToken });

      const ackPromise = new Promise<any>((resolve) => {
        adminClient.on(RealtimeEvents.SUBSCRIPTION_ACK, (ack) => resolve(ack));
      });

      adminClient.emit(RealtimeEvents.SUBSCRIBE_FLEET, { includeRestricted: true });
      const ack = await ackPromise;

      expect(ack.channel).toBe('fleet:all');
      expect(ack.status).toBe('SUBSCRIBED');
    });

    it('should broadcast accepted bus positions to fleet subscribers', async () => {
      const busId = new Types.ObjectId();

      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const client = await createClient();

      await new Promise<void>((resolve) => {
        client.on(RealtimeEvents.SUBSCRIPTION_ACK, () => resolve());
        client.emit(RealtimeEvents.SUBSCRIBE_FLEET, {});
      });

      const positionPromise = new Promise<any>((resolve) => {
        client.on(RealtimeEvents.BUS_POSITION, (pos) => resolve(pos));
      });

      const obs: LocationObservation = {
        busId,
        location: { type: 'Point', coordinates: [78.1198, 9.9252] },
        heading: 90,
        speedKmph: 45,
        source: 'VEHICLE_HARDWARE_GPS',
        trackingStatus: 'LIVE',
        recordedAt: new Date(),
        receivedAt: new Date()
      };

      await locationPipelineService.processObservation(obs);
      const received = await positionPromise;

      expect(received.busId).toBe(busId.toString());
      expect(received.source).toBe('VEHICLE_HARDWARE_GPS');
    });
  });
});
