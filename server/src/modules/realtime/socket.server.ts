import http from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { env } from '../../config/env';
import { logger } from '../../common/logger';
import { Bus, Route, LatestBusPosition } from '../../models';
import { verifyAccessToken } from '../auth/auth.tokens';
import { UserRole } from '../../types';
import {
  RealtimeEvents,
  getBusRoom,
  getRouteRoom,
  SubscribeBusPayload,
  SubscribeRoutePayload,
  SubscriptionAckPayload,
  SubscriptionErrorPayload,
  UnsubscriptionAckPayload,
  BusPositionBroadcastPayload,
  RouteTrackingSnapshot
} from './realtime.types';
import {
  subscribeBusSchema,
  subscribeRouteSchema,
  unsubscribeBusSchema,
  unsubscribeRouteSchema
} from './realtime.validation';
import { realtimeTrackingService } from './realtime.service';

// Global Socket.IO Server singleton
let ioInstance: Server | null = null;

export interface SocketUserData {
  userId: string;
  email: string;
  role: UserRole;
}

export interface SocketData {
  user: SocketUserData | null;
  subscribedRooms: Set<string>;
}

/**
 * Per-socket rate limiter preventing subscription flooding or enumeration.
 */
class SocketRateLimiter {
  private timestamps: number[] = [];
  constructor(
    private readonly maxRequests: number = 20,
    private readonly windowMs: number = 10000
  ) {}

  public isAllowed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }
}

/**
 * Maximum concurrent room subscriptions permitted per socket connection.
 * Guards against memory exhaustion and channel hoarding.
 */
export const MAX_ROOMS_PER_SOCKET = 15;

/**
 * Formats a raw LatestBusPosition document into a clean, safe public broadcast payload.
 */
function formatPositionSnapshot(doc: any): BusPositionBroadcastPayload {
  const recordedAt =
    doc.recordedAt instanceof Date
      ? doc.recordedAt.toISOString()
      : new Date(doc.recordedAt).toISOString();
  const receivedAt =
    doc.receivedAt instanceof Date
      ? doc.receivedAt.toISOString()
      : new Date(doc.receivedAt).toISOString();

  let trackingStatus = doc.trackingStatus ?? 'SIMULATED';
  if (doc.source === 'SIMULATOR') {
    trackingStatus = doc.trackingStatus === 'DEVIATED' ? 'DEVIATED' : 'SIMULATED';
  }

  return {
    busId: doc.busId.toString(),
    tripId: doc.tripId?.toString(),
    routeId: doc.routeId?.toString(),
    directionId: doc.directionId?.toString(),
    coordinates: doc.location?.coordinates ?? [0, 0],
    snappedCoordinates: doc.snappedLocation?.coordinates,
    heading: doc.heading ?? 0,
    speedKmph: doc.speedKmph ?? 0,
    progressRatio: doc.progressRatio,
    distanceAlongRouteMeters: doc.distanceAlongRouteMeters,
    totalRouteDistanceMeters: doc.totalRouteDistanceMeters,
    trackingStatus,
    source: doc.source ?? 'SIMULATOR',
    validationStatus: doc.validationStatus ?? 'VALID',
    recordedAt,
    receivedAt
  };
}

/**
 * Initializes and binds the Socket.IO server to the HTTP server instance.
 */
export function initSocketServer(
  httpServer: http.Server,
  options?: Partial<ServerOptions>
): Server {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB payload limit
    transports: ['websocket', 'polling'],
    ...options
  });

  // ---------------------------------------------------------------------------
  // Connection Authentication Middleware
  // ---------------------------------------------------------------------------
  io.use((socket: Socket, next) => {
    try {
      // Sockets can supply auth token via handshake auth or Authorization header
      const authHeader =
        socket.handshake.auth?.token || socket.handshake.headers.authorization;

      if (!authHeader) {
        // Public passenger access allowed (read-only tracking)
        socket.data.user = null;
        socket.data.subscribedRooms = new Set<string>();
        return next();
      }

      const rawToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      const payload = verifyAccessToken(rawToken);
      socket.data.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role
      };
      socket.data.subscribedRooms = new Set<string>();
      return next();
    } catch (err: any) {
      // If an explicit token was provided but failed verification, reject connection
      logger.warn(
        { ip: socket.handshake.address, reason: err?.message },
        'Socket.IO connection rejected: invalid authentication token'
      );
      return next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  // ---------------------------------------------------------------------------
  // Connection & Event Handlers
  // ---------------------------------------------------------------------------
  io.on('connection', (socket: Socket) => {
    const rateLimiter = new SocketRateLimiter(20, 10000);
    logger.debug(
      { socketId: socket.id, user: socket.data.user?.email ?? 'anonymous' },
      'Socket.IO client connected'
    );

    // =========================================================================
    // 1. subscribe:bus
    // =========================================================================
    socket.on(RealtimeEvents.SUBSCRIBE_BUS, async (rawPayload: unknown) => {
      if (!rateLimiter.isAllowed()) {
        const errorPayload: SubscriptionErrorPayload = {
          error: 'Rate limit exceeded for subscription requests. Please throttle.',
          code: 'RATE_LIMITED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const parseResult = subscribeBusSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        const errorPayload: SubscriptionErrorPayload = {
          error: parseResult.error.errors.map((e) => e.message).join('; '),
          code: 'MALFORMED_PAYLOAD',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const { busId } = parseResult.data as SubscribeBusPayload;
      const room = getBusRoom(busId);

      // Enforce per-socket concurrent subscription limit
      if ((socket.data.subscribedRooms?.size ?? 0) >= MAX_ROOMS_PER_SOCKET) {
        const errorPayload: SubscriptionErrorPayload = {
          channel: room,
          error: `Maximum subscriptions limit (${MAX_ROOMS_PER_SOCKET}) exceeded for this connection.`,
          code: 'MAX_SUBSCRIPTIONS_EXCEEDED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      try {
        const bus = await Bus.findById(busId).lean();
        if (!bus) {
          const errorPayload: SubscriptionErrorPayload = {
            channel: room,
            error: `Bus with ID '${busId}' was not found`,
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          };
          socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
          return;
        }

        await socket.join(room);
        socket.data.subscribedRooms?.add(room);

        // Fetch current position snapshot
        const latestDoc = await LatestBusPosition.findOne({ busId }).lean();
        const snapshot = latestDoc
          ? {
              ...formatPositionSnapshot(latestDoc),
              fleetNumber: bus.fleetNumber,
              registrationNumber: bus.registrationNumber
            }
          : null;

        const ackPayload: SubscriptionAckPayload = {
          channel: room,
          status: 'SUBSCRIBED',
          timestamp: new Date().toISOString(),
          snapshot
        };

        socket.emit(RealtimeEvents.SUBSCRIPTION_ACK, ackPayload);
      } catch (err) {
        logger.error({ err, busId }, 'Error handling subscribe:bus');
        const errorPayload: SubscriptionErrorPayload = {
          channel: room,
          error: 'Internal server error processing bus subscription',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
      }
    });

    // =========================================================================
    // 2. unsubscribe:bus
    // =========================================================================
    socket.on(RealtimeEvents.UNSUBSCRIBE_BUS, async (rawPayload: unknown) => {
      if (!rateLimiter.isAllowed()) {
        const errorPayload: SubscriptionErrorPayload = {
          error: 'Rate limit exceeded for requests. Please throttle.',
          code: 'RATE_LIMITED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const parseResult = unsubscribeBusSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        const errorPayload: SubscriptionErrorPayload = {
          error: parseResult.error.errors.map((e) => e.message).join('; '),
          code: 'MALFORMED_PAYLOAD',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const { busId } = parseResult.data;
      const room = getBusRoom(busId);

      await socket.leave(room);
      socket.data.subscribedRooms?.delete(room);

      const ack: UnsubscriptionAckPayload = {
        channel: room,
        status: 'UNSUBSCRIBED',
        timestamp: new Date().toISOString()
      };
      socket.emit(RealtimeEvents.UNSUBSCRIPTION_ACK, ack);
    });

    // =========================================================================
    // 3. subscribe:route
    // =========================================================================
    socket.on(RealtimeEvents.SUBSCRIBE_ROUTE, async (rawPayload: unknown) => {
      if (!rateLimiter.isAllowed()) {
        const errorPayload: SubscriptionErrorPayload = {
          error: 'Rate limit exceeded for subscription requests. Please throttle.',
          code: 'RATE_LIMITED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const parseResult = subscribeRouteSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        const errorPayload: SubscriptionErrorPayload = {
          error: parseResult.error.errors.map((e) => e.message).join('; '),
          code: 'MALFORMED_PAYLOAD',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const { routeId } = parseResult.data as SubscribeRoutePayload;
      const room = getRouteRoom(routeId);

      // Enforce per-socket concurrent subscription limit
      if ((socket.data.subscribedRooms?.size ?? 0) >= MAX_ROOMS_PER_SOCKET) {
        const errorPayload: SubscriptionErrorPayload = {
          channel: room,
          error: `Maximum subscriptions limit (${MAX_ROOMS_PER_SOCKET}) exceeded for this connection.`,
          code: 'MAX_SUBSCRIPTIONS_EXCEEDED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      try {
        const route = await Route.findById(routeId).lean();
        if (!route) {
          const errorPayload: SubscriptionErrorPayload = {
            channel: room,
            error: `Route with ID '${routeId}' was not found`,
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          };
          socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
          return;
        }

        await socket.join(room);
        socket.data.subscribedRooms?.add(room);

        // Fetch active buses on this route
        const activeDocs = await LatestBusPosition.find({
          routeId,
          trackingStatus: { $ne: 'OFFLINE' }
        }).lean();

        const activeBuses = activeDocs.map(formatPositionSnapshot);

        const routeSnapshot: RouteTrackingSnapshot = {
          routeId,
          activeBusesCount: activeBuses.length,
          buses: activeBuses,
          timestamp: new Date().toISOString()
        };

        const ackPayload: SubscriptionAckPayload<RouteTrackingSnapshot> = {
          channel: room,
          status: 'SUBSCRIBED',
          timestamp: new Date().toISOString(),
          snapshot: routeSnapshot
        };

        socket.emit(RealtimeEvents.SUBSCRIPTION_ACK, ackPayload);
      } catch (err) {
        logger.error({ err, routeId }, 'Error handling subscribe:route');
        const errorPayload: SubscriptionErrorPayload = {
          channel: room,
          error: 'Internal server error processing route subscription',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
      }
    });

    // =========================================================================
    // 4. unsubscribe:route
    // =========================================================================
    socket.on(RealtimeEvents.UNSUBSCRIBE_ROUTE, async (rawPayload: unknown) => {
      if (!rateLimiter.isAllowed()) {
        const errorPayload: SubscriptionErrorPayload = {
          error: 'Rate limit exceeded for requests. Please throttle.',
          code: 'RATE_LIMITED',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const parseResult = unsubscribeRouteSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        const errorPayload: SubscriptionErrorPayload = {
          error: parseResult.error.errors.map((e) => e.message).join('; '),
          code: 'MALFORMED_PAYLOAD',
          timestamp: new Date().toISOString()
        };
        socket.emit(RealtimeEvents.SUBSCRIPTION_ERROR, errorPayload);
        return;
      }

      const { routeId } = parseResult.data;
      const room = getRouteRoom(routeId);

      await socket.leave(room);
      socket.data.subscribedRooms?.delete(room);

      const ack: UnsubscriptionAckPayload = {
        channel: room,
        status: 'UNSUBSCRIBED',
        timestamp: new Date().toISOString()
      };
      socket.emit(RealtimeEvents.UNSUBSCRIPTION_ACK, ack);
    });

    // =========================================================================
    // 5. disconnect
    // =========================================================================
    socket.on('disconnect', (reason) => {
      logger.debug(
        { socketId: socket.id, reason },
        'Socket.IO client disconnected'
      );
      socket.data.subscribedRooms?.clear();
    });
  });

  // Attach io instance to the realtime tracking service
  realtimeTrackingService.attachServer(io);

  ioInstance = io;
  return io;
}

/**
 * Returns active Socket.IO server instance if initialized.
 */
export function getSocketServer(): Server | null {
  return ioInstance;
}

/**
 * Gracefully terminates the Socket.IO server and disconnects active clients.
 */
export async function closeSocketServer(): Promise<void> {
  if (!ioInstance) {
    return;
  }

  logger.info('Closing Socket.IO real-time server...');
  realtimeTrackingService.detachServer();

  await new Promise<void>((resolve) => {
    ioInstance?.close(() => {
      logger.info('Socket.IO real-time server closed successfully');
      resolve();
    });
  });

  ioInstance = null;
}
