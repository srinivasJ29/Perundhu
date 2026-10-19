/**
 * PERUNDHU (பேருந்து) — Real-Time Bus Vehicle Leaflet Map Marker
 * Features heading-aligned compass rotation, SIMULATED vs LIVE GPS truthfulness labels,
 * kinematic speed display, and temporal freshness status.
 */

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LiveBusMarkerData, SelectedMapEntity } from '../types';
import { createBusLocationIcon } from '../utils/mapIcons';
import { useLanguage } from '../../../hooks/useLanguage';
import { Bus, Compass, Gauge, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface BusLocationMarkerProps {
  bus: LiveBusMarkerData;
  isSelected: boolean;
  onSelect: (entity: SelectedMapEntity) => void;
}

export const BusLocationMarker: React.FC<BusLocationMarkerProps> = ({
  bus,
  isSelected,
  onSelect
}) => {
  const { t, language } = useLanguage();

  if (
    typeof bus.lat !== 'number' ||
    typeof bus.lng !== 'number' ||
    isNaN(bus.lat) ||
    isNaN(bus.lng)
  ) {
    return null;
  }

  const icon = createBusLocationIcon(
    bus.fleetNumber || 'TNSTC Bus',
    bus.heading || 0,
    bus.isSimulated,
    isSelected
  );

  // Freshness check: if last recorded timestamp is older than 2 minutes (120,000ms) or trackingStatus indicates stale
  const isStale =
    bus.trackingStatus === 'STALE' ||
    bus.trackingStatus === 'UNAVAILABLE' ||
    (bus.recordedAt && Date.now() - new Date(bus.recordedAt).getTime() > 120000);

  const isDelayed = bus.trackingStatus === 'DELAYED' || Boolean(bus.isDelayed);
  const isDeviated = bus.trackingStatus === 'DEVIATED' || Boolean(bus.isDeviated);

  const handleMarkerClick = () => {
    onSelect({
      type: 'BUS',
      id: bus.busId,
      lat: bus.lat,
      lng: bus.lng,
      titleEn: bus.fleetNumber || `Bus ${bus.routeNumber || ''}`,
      titleTa: bus.fleetNumber || `பேருந்து ${bus.routeNumber || ''}`,
      subtitleEn: bus.isSimulated ? 'Simulated Telemetry' : 'Live Hardware GPS',
      subtitleTa: bus.isSimulated ? 'மாதிரி இயக்கம்' : 'நேரலை ஜிபிஎஸ்',
      data: bus
    });
  };

  const formattedTime = bus.recordedAt
    ? new Date(bus.recordedAt).toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '--:--:--';

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={icon}
      eventHandlers={{
        click: handleMarkerClick
      }}
    >
      <Popup className="perundhu-leaflet-popup" minWidth={250}>
        <div className="map-popup-card">
          <div className="map-popup-header">
            <div
              className={`map-popup-icon-box bus ${bus.isSimulated ? 'simulated' : 'live'}`}
              aria-hidden="true"
            >
              <Bus size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="map-popup-seq-tag">
                  {language === 'ta' ? `தடம் ${bus.routeNumber || '70'}` : `Route ${bus.routeNumber || '70'}`}
                </span>
                {bus.isSimulated ? (
                  <Badge variant="warning">
                    <span>{t('map.simulated_badge')}</span>
                  </Badge>
                ) : (
                  <Badge variant="success">
                    <span>{t('map.live_gps_badge')}</span>
                  </Badge>
                )}
                {isStale && (
                  <Badge variant="neutral">
                    <span>{t('map.stale_badge')}</span>
                  </Badge>
                )}
                {isDelayed && (
                  <Badge variant="warning">
                    <span>{t('map.delayed_badge')}</span>
                  </Badge>
                )}
                {isDeviated && (
                  <Badge variant="error">
                    <span>{t('map.deviated_badge')}</span>
                  </Badge>
                )}
              </div>
              <h4 className="map-popup-title">
                {bus.fleetNumber || 'TNSTC Fleet Bus'}
              </h4>
              {bus.registrationNumber && (
                <p className="map-popup-subtitle">{bus.registrationNumber}</p>
              )}
            </div>
          </div>

          <div className="map-popup-details">
            <div className="map-popup-row">
              <Gauge size={14} className="map-popup-row-icon" />
              <span>
                <strong>{t('map.speed_label')}:</strong> {Math.round(bus.speedKmph || 0)} {t('map.kmph')}
              </span>
            </div>
            <div className="map-popup-row">
              <Compass size={14} className="map-popup-row-icon" />
              <span>
                <strong>{t('map.heading_label')}:</strong> {Math.round(bus.heading || 0)}°
              </span>
            </div>
            <div className="map-popup-row">
              <Clock size={14} className="map-popup-row-icon" />
              <span>
                <strong>{t('map.last_update')}:</strong> {formattedTime} IST
              </span>
            </div>
          </div>

          <div
            className={`map-telemetry-notice ${bus.isSimulated ? 'simulated' : 'live'}`}
          >
            {bus.isSimulated ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t('map.simulated_desc')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{language === 'ta' ? 'அங்கீகரிக்கப்பட்ட நேரலை ஜிபிஎஸ் தரவு' : 'Authorized Real Hardware GPS Telemetry'}</span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
