import { useState, useEffect, useCallback } from 'react';
import { socketClientManager } from '../services/socket/socketClient';
import {
  SocketConnectionState,
  BusPositionPayload,
  BusNextStopPayload,
  BusEtaPayload
} from '../types/realtime';

export function useSocket() {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    socketClientManager.getConnectionState()
  );

  useEffect(() => {
    const unbind = socketClientManager.onStateChange((state) => {
      setConnectionState(state);
    });
    return () => {
      unbind();
    };
  }, []);

  const connect = useCallback(() => {
    return socketClientManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketClientManager.disconnect();
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    isConnecting: connectionState === 'CONNECTING' || connectionState === 'RECONNECTING',
    connect,
    disconnect
  };
}

/**
 * Reusable hook to subscribe to a bus's real-time position with automatic cleanup on unmount.
 */
export function useBusTrackingSubscription(
  busId: string | null | undefined,
  callbacks?: {
    onPosition?: (payload: BusPositionPayload) => void;
    onNextStop?: (payload: BusNextStopPayload) => void;
    onEta?: (payload: BusEtaPayload) => void;
  }
) {
  const { isConnected, connectionState } = useSocket();

  useEffect(() => {
    if (!busId) return;

    socketClientManager.connect();
    socketClientManager.subscribeBus(busId);

    const unbinds: (() => void)[] = [];

    if (callbacks?.onPosition) {
      unbinds.push(
        socketClientManager.onBusPosition((payload) => {
          if (payload.busId === busId) {
            callbacks.onPosition?.(payload);
          }
        })
      );
    }

    if (callbacks?.onNextStop) {
      unbinds.push(
        socketClientManager.onBusNextStop((payload) => {
          if (payload.busId === busId) {
            callbacks.onNextStop?.(payload);
          }
        })
      );
    }

    if (callbacks?.onEta) {
      unbinds.push(
        socketClientManager.onBusEta((payload) => {
          if (payload.busId === busId) {
            callbacks.onEta?.(payload);
          }
        })
      );
    }

    return () => {
      for (const unbind of unbinds) {
        unbind();
      }
      socketClientManager.unsubscribeBus(busId);
    };
  }, [busId, callbacks]);

  return {
    isConnected,
    connectionState
  };
}
