/**
 * PERUNDHU (பேருந்து) — Ordered Route Stop Sequence List
 * Strictly preserves backend sequence order. Never sorts alphabetically.
 */

import React from 'react';
import { DirectionStopSequenceDto } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { MapPin, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface RouteStopListProps {
  stops: DirectionStopSequenceDto[];
  originStopId?: string;
  destinationStopId?: string;
  totalDistanceKm?: number;
  estimatedDurationMins?: number;
}

export const RouteStopList: React.FC<RouteStopListProps> = ({
  stops,
  totalDistanceKm,
  estimatedDurationMins
}) => {
  const { t, language } = useLanguage();

  if (!stops || stops.length === 0) {
    return (
      <div className="route-stops-empty">
        <p>{t('routes.no_stops_available')}</p>
      </div>
    );
  }

  return (
    <div className="route-stops-container">
      {/* Route Journey Overview Header */}
      <div className="route-stops-overview">
        <div className="route-overview-stat">
          <Navigation size={14} className="route-stat-icon" />
          <span>
            {t('routes.distance_label')}:{' '}
            <strong>
              {totalDistanceKm ?? stops[stops.length - 1].distanceFromOriginKm} km
            </strong>
          </span>
        </div>
        <span className="route-stat-divider">•</span>
        <div className="route-overview-stat">
          <Clock size={14} className="route-stat-icon" />
          <span>
            {t('routes.duration_label')}:{' '}
            <strong>
              ~{estimatedDurationMins ?? stops[stops.length - 1].cumulativeDurationMinutes} mins
            </strong>
          </span>
        </div>
        <span className="route-stat-divider">•</span>
        <div className="route-overview-stat">
          <MapPin size={14} className="route-stat-icon" />
          <span>
            {t('routes.stops_count_label')}: <strong>{stops.length}</strong>
          </span>
        </div>
      </div>

      {/* Ordered Stop Timeline */}
      <ol className="route-timeline" aria-label="Ordered bus stops sequence">
        {stops.map((item, index) => {
          const isOrigin = index === 0;
          const isDestination = index === stops.length - 1;
          const primaryName = language === 'ta' ? item.stop.nameTa : item.stop.nameEn;
          const secondaryName = language === 'ta' ? item.stop.nameEn : item.stop.nameTa;

          return (
            <li
              key={`${item.stop.id}-${item.sequenceOrder}`}
              className={`route-timeline-item ${isOrigin ? 'timeline-origin' : ''} ${isDestination ? 'timeline-destination' : ''}`}
            >
              {/* Timeline marker with sequence order */}
              <div className="timeline-marker-col" aria-hidden="true">
                <span className={`timeline-dot ${isOrigin || isDestination ? 'timeline-dot-terminal' : ''}`}>
                  {item.sequenceOrder}
                </span>
                {!isDestination && <div className="timeline-line" />}
              </div>

              {/* Stop Information Content */}
              <div className="timeline-content">
                <div className="timeline-stop-header">
                  <span className="timeline-stop-title">{primaryName}</span>

                  <div className="timeline-badges">
                    {isOrigin && (
                      <Badge variant="success">
                        <span>{language === 'ta' ? 'தொடக்க முனையம்' : 'Origin Terminal'}</span>
                      </Badge>
                    )}
                    {isDestination && (
                      <Badge variant="info">
                        <span>{language === 'ta' ? 'சேருமிடம்' : 'Destination Terminal'}</span>
                      </Badge>
                    )}
                    {item.isFareStage && !isOrigin && !isDestination && (
                      <Badge variant="neutral">
                        <ShieldCheck size={11} style={{ marginRight: '3px' }} />
                        <span>{t('routes.fare_stage')}</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {secondaryName && secondaryName !== primaryName && (
                  <span className="timeline-stop-secondary">{secondaryName}</span>
                )}

                {item.stop.landmark && (
                  <span className="timeline-stop-landmark">
                    {language === 'ta' ? 'அடையாளம்: ' : 'Landmark: '}
                    {item.stop.landmark}
                  </span>
                )}

                {/* Telemetry metadata: distance & cumulative time */}
                <div className="timeline-stop-meta">
                  <span>{item.distanceFromOriginKm.toFixed(1)} km</span>
                  <span className="meta-sep">•</span>
                  <span>+{item.cumulativeDurationMinutes} mins</span>
                  <span className="meta-sep">•</span>
                  <span className="timeline-stop-code">{item.stop.code}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
