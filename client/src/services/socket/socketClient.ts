import { io, Socket } from 'socket.io-client';
import { env } from '../../config/env';
import { REALTIME_CONFIG } from '../../config/constants';
import { logger } from '../../lib/logger';
import {
  SocketEvents,
  SocketConnectionState,
  BusPositionPayload,
  BusStatusPayload,
  BusNextStopPayload,
  BusEtaPayload,
  BusStopEventPayload,
  SubscriptionAckPayload,
  SubscriptionErrorPayload,
  UnsubscriptionAckPayload
} from '../../types/realtime';

export type StateListener = (state: SocketConnectionState) => void;
export type ReconcileListener = () => void;

interface ActiveSubscription {
  type: 'bus' | 'route' | 'fleet';
  id?: string;
  options?: any;
}

class SocketClientManager {
  private socket: Socket | null = null;
  private connectionState: SocketConnectionState = 'DISCONNECTED';
  private stateListeners: Set<StateListener> = new Set();
  private reconcileListeners: Set<ReconcileListener> = new Set();
  private tokenProvider: (() => string | null) | null = null;
  private activeSubscriptions: Map<string, ActiveSubscription> = new Map();
  private hasConnectedBefore = false;

  public setTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  public getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  public onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onReconcile(listener: ReconcileListener): () => void {
    this.reconcileListeners.add(listener);
    return () => {
      this.reconcileListeners.delete(listener);
    };
  }

  private triggerReconciliation(): void {
    for (const listener of this.reconcileListeners) {
      try {
        listener();
      } catch (err) {
        logger.error('Error in socket reconciliation listener', err);
      }
    }
  }

  private setConnectionState(newState: SocketConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      for (const listener of this.stateListeners) {
        try {
          listener(newState);
        } catch (err) {
          logger.error('Error in socket state listener', err);
        }
      }
    }
  }

  /**
   * Initializes or returns the shared Socket.IO client instance.
   */
  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.socket) {
      const token = this.tokenProvider ? this.tokenProvider() : null;

      this.setConnectionState('CONNECTING');
      logger.info(`Connecting to Socket.IO real-time server at ${env.VITE_SOCKET_URL}`);

      this.socket = io(env.VITE_SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
        reconnectionAttempts: REALTIME_CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: REALTIME_CONFIG.RECONNECT_INTERVAL_MS,
        timeout: REALTIME_CONFIG.PING_TIMEOUT_MS
      });

      this.socket.on('connect', () => {
        logger.info(`Socket.IO connected [socketId: ${this.socket?.id}]`);
        this.setConnectionState('CONNECTED');

        // Handle auto-resubscription and state reconciliation on reconnect
        if (this.hasConnectedBefore) {
          logger.info('Socket reconnected: resubscribing and triggering reconciliation');
          for (const sub of this.activeSubscriptions.values()) {
            if (sub.type === 'bus' && sub.id) {
              this.socket?.emit(SocketEvents.SUBSCRIBE_BUS, { busId: sub.id });
            } else if (sub.type === 'route' && sub.id) {
              this.socket?.emit(SocketEvents.SUBSCRIBE_ROUTE, { routeId: sub.id });
            } else if (sub.type === 'fleet') {
              this.socket?.emit(SocketEvents.SUBSCRIBE_FLEET, sub.options || {});
            }
          }
          this.triggerReconciliation();
        }
        this.hasConnectedBefore = true;
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn(`Socket.IO disconnected: ${reason}`);
        this.setConnectionState('DISCONNECTED');
      });

      this.socket.on('connect_error', (err) => {
        logger.error(`Socket.IO connection error: ${err.message}`);
        this.setConnectionState('ERROR');
      });

      this.socket.io.on('reconnect_attempt', () => {
        this.setConnectionState('RECONNECTING');
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  /**
   * Disconnects the socket and cleans up state.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState('DISCONNECTED');
      this.activeSubscriptions.clear();
      logger.info('Socket.IO connection explicitly closed');
    }
  }

  // ===========================================================================
  // Subscription Control Operations
  // ===========================================================================

  public subscribeBus(busId: string): void {
    const s = this.connect();
    this.activeSubscriptions.set(`bus:${busId}`, { type: 'bus', id: busId });
    s.emit(SocketEvents.SUBSCRIBE_BUS, { busId });
    logger.debug(`Emitted ${SocketEvents.SUBSCRIBE_BUS} for bus ${busId}`);
  }

  public unsubscribeBus(busId: string): void {
    this.activeSubscriptions.delete(`bus:${busId}`);
    if (this.socket && this.socket.connected) {
      this.socket.emit(SocketEvents.UNSUBSCRIBE_BUS, { busId });
      logger.debug(`Emitted ${SocketEvents.UNSUBSCRIBE_BUS} for bus ${busId}`);
    }
  }

  public subscribeRoute(routeId: string): void {
    const s = this.connect();
    this.activeSubscriptions.set(`route:${routeId}`, { type: 'route', id: routeId });
    s.emit(SocketEvents.SUBSCRIBE_ROUTE, { routeId });
    logger.debug(`Emitted ${SocketEvents.SUBSCRIBE_ROUTE} for route ${routeId}`);
  }

  public unsubscribeRoute(routeId: string): void {
    this.activeSubscriptions.delete(`route:${routeId}`);
    if (this.socket && this.socket.connected) {
      this.socket.emit(SocketEvents.UNSUBSCRIBE_ROUTE, { routeId });
      logger.debug(`Emitted ${SocketEvents.UNSUBSCRIBE_ROUTE} for route ${routeId}`);
    }
  }

  public subscribeFleet(options?: { depotId?: string; includeRestricted?: boolean }): void {
    const s = this.connect();
    const key = options?.depotId ? `fleet:${options.depotId}` : 'fleet:all';
    this.activeSubscriptions.set(key, { type: 'fleet', options });
    s.emit(SocketEvents.SUBSCRIBE_FLEET, options || {});
    logger.debug(`Emitted ${SocketEvents.SUBSCRIBE_FLEET} with options`, options);
  }

  public unsubscribeFleet(options?: { depotId?: string }): void {
    const key = options?.depotId ? `fleet:${options.depotId}` : 'fleet:all';
    this.activeSubscriptions.delete(key);
    if (this.socket && this.socket.connected) {
      this.socket.emit(SocketEvents.UNSUBSCRIBE_FLEET, options || {});
      logger.debug(`Emitted ${SocketEvents.UNSUBSCRIBE_FLEET} with options`, options);
    }
  }

  // ===========================================================================
  // Event Listeners (Returns cleanup unbind function)
  // ===========================================================================

  public onBusPosition(callback: (payload: BusPositionPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.BUS_POSITION, callback);
    return () => {
      s.off(SocketEvents.BUS_POSITION, callback);
    };
  }

  public onBusStatus(callback: (payload: BusStatusPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.BUS_STATUS, callback);
    return () => {
      s.off(SocketEvents.BUS_STATUS, callback);
    };
  }

  public onBusNextStop(callback: (payload: BusNextStopPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.BUS_NEXT_STOP, callback);
    return () => {
      s.off(SocketEvents.BUS_NEXT_STOP, callback);
    };
  }

  public onBusEta(callback: (payload: BusEtaPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.BUS_ETA, callback);
    return () => {
      s.off(SocketEvents.BUS_ETA, callback);
    };
  }

  public onBusStopEvent(callback: (payload: BusStopEventPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.BUS_STOP_EVENT, callback);
    return () => {
      s.off(SocketEvents.BUS_STOP_EVENT, callback);
    };
  }

  public onSubscriptionAck(callback: (payload: SubscriptionAckPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.SUBSCRIPTION_ACK, callback);
    return () => {
      s.off(SocketEvents.SUBSCRIPTION_ACK, callback);
    };
  }

  public onUnsubscriptionAck(callback: (payload: UnsubscriptionAckPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.UNSUBSCRIPTION_ACK, callback);
    return () => {
      s.off(SocketEvents.UNSUBSCRIPTION_ACK, callback);
    };
  }

  public onSubscriptionError(callback: (payload: SubscriptionErrorPayload) => void): () => void {
    const s = this.connect();
    s.on(SocketEvents.SUBSCRIPTION_ERROR, callback);
    return () => {
      s.off(SocketEvents.SUBSCRIPTION_ERROR, callback);
    };
  }
}

export const socketClientManager = new SocketClientManager();
