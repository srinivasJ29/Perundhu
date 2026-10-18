/**
 * PERUNDHU (பேருந்து) — Route Stop Leaflet Map Marker
 * Renders ordered route stops with sequence badges, fare stage indicators, and accessible popups.
 */

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DirectionStopSequenceDto } from '../../../types/domain';
import { createBusStopIcon } from '../utils/mapIcons';
import { useLanguage } from '../../../hooks/useLanguage';
import { SelectedMapEntity } from '../types';
import { MapPin, Milestone, Clock } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface BusStopMarkerProps {
  stopSeq: DirectionStopSequenceDto;
  isSelected: boolean;
  routeNumber?: string;
  onSelect: (entity: SelectedMapEntity) => void;
}

export const BusStopMarker: React.FC<BusStopMarkerProps> = ({
  stopSeq,
  isSelected,
  routeNumber = '',
  onSelect
}) => {
  const { t, language } = useLanguage();

  if (
    !stopSeq.stop ||
    !stopSeq.stop.location ||
    !stopSeq.stop.location.coordinates ||
    stopSeq.stop.location.coordinates.length < 2
  ) {
    return null;
  }

  const lat = stopSeq.stop.location.coordinates[1];
  const lng = stopSeq.stop.location.coordinates[0];
  const icon = createBusStopIcon(stopSeq.sequenceOrder, isSelected, stopSeq.isFareStage);

  const title = language === 'ta' ? stopSeq.stop.nameTa : stopSeq.stop.nameEn;
  const secondaryTitle = language === 'ta' ? stopSeq.stop.nameEn : stopSeq.stop.nameTa;

  const handleMarkerClick = () => {
    onSelect({
      type: 'BUS_STOP',
      id: stopSeq.stop.id,
      lat,
      lng,
      titleEn: stopSeq.stop.nameEn,
      titleTa: stopSeq.stop.nameTa,
      subtitleEn: `Stop #${stopSeq.sequenceOrder} • Route ${routeNumber}`,
      subtitleTa: `நிறுத்தம் #${stopSeq.sequenceOrder} • தடம் ${routeNumber}`,
      data: stopSeq
    });
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: handleMarkerClick
      }}
    >
      <Popup className="perundhu-leaflet-popup" minWidth={220}>
        <div className="map-popup-card">
          <div className="map-popup-header">
            <div className="map-popup-icon-box stop" aria-hidden="true">
              <MapPin size={16} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span className="map-popup-seq-tag">#{stopSeq.sequenceOrder}</span>
                {stopSeq.isFareStage && (
                  <Badge variant="warning">
                    <span>{t('map.fare_stage')}</span>
                  </Badge>
                )}
              </div>
              <h4 className="map-popup-title">{title}</h4>
              <p className="map-popup-subtitle">{secondaryTitle}</p>
            </div>
          </div>

          <div className="map-popup-details">
            <div className="map-popup-row">
              <Milestone size={14} className="map-popup-row-icon" />
              <span>
                {t('map.distance_km').replace('{km}', String(stopSeq.distanceFromOriginKm || 0))}
              </span>
            </div>
            {stopSeq.cumulativeDurationMinutes > 0 && (
              <div className="map-popup-row">
                <Clock size={14} className="map-popup-row-icon" />
                <span>
                  ~{t('map.duration_mins').replace('{mins}', String(stopSeq.cumulativeDurationMinutes))}
                </span>
              </div>
            )}
            {stopSeq.stop.landmark && (
              <p className="map-popup-landmark">
                <strong>{language === 'ta' ? 'அடையாளம்:' : 'Landmark:'}</strong>{' '}
                {stopSeq.stop.landmark}
              </p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
