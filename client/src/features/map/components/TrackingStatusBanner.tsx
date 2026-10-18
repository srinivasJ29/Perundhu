/**
 * PERUNDHU (பேருந்து) — Real-Time Telemetry Status Banner
 * Visibly surfaces Socket.IO connection state, active broadcast channel, and honest source indicators.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { SocketConnectionState } from '../../../types/realtime';

interface TrackingStatusBannerProps {
  socketStatus: SocketConnectionState;
  subscribedRoom: string | null;
  activeBusesCount: number;
  hasSimulatedBuses: boolean;
  routeNumber?: string;
}

export const TrackingStatusBanner: React.FC<TrackingStatusBannerProps> = ({
  socketStatus,
  subscribedRoom,
  activeBusesCount,
  hasSimulatedBuses,
  routeNumber
}) => {
  const { t, language } = useLanguage();

  const isConnected = socketStatus === 'CONNECTED';
  const isConnecting = socketStatus === 'CONNECTING' || socketStatus === 'RECONNECTING';

  return (
    <div
      className="map-tracking-status-pill"
      role="status"
      aria-live="polite"
      title={subscribedRoom ? t('map.realtime_room').replace('{room}', subscribedRoom) : undefined}
    >
      <div className="map-status-indicator-box">
        {isConnected ? (
          <span className="map-status-dot connected" aria-hidden="true" />
        ) : isConnecting ? (
          <Loader2 size={12} className="spinner" style={{ color: 'var(--color-sage)' }} />
        ) : (
          <span className="map-status-dot disconnected" aria-hidden="true" />
        )}
        <span className="map-status-text">
          {isConnected
            ? t('map.realtime_connected')
            : isConnecting
            ? t('map.realtime_connecting')
            : t('map.realtime_disconnected')}
        </span>
      </div>

      {routeNumber && (
        <span className="map-status-divider">•</span>
      )}

      {routeNumber && (
        <span className="map-status-route-tag">
          {language === 'ta' ? `தடம் ${routeNumber}` : `Route ${routeNumber}`}
        </span>
      )}

      {activeBusesCount > 0 && (
        <>
          <span className="map-status-divider">•</span>
          <span className="map-status-count-tag">
            {activeBusesCount} {language === 'ta' ? 'பேருந்துகள்' : 'Buses'}
          </span>
          {hasSimulatedBuses && (
            <span className="map-status-sim-badge">
              {t('map.simulated_badge')}
            </span>
          )}
        </>
      )}
    </div>
  );
};
