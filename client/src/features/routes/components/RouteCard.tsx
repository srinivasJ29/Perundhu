/**
 * PERUNDHU (பேருந்து) — Reusable Route Card Component
 * Displays verified route details, direction selector, and interactive stops explorer
 */

import React, { useState } from 'react';
import { RouteListItem } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { useRouteDirection } from '../hooks/useRouteDirection';
import { RouteStopList } from './RouteStopList';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  Compass,
  ArrowLeftRight
} from 'lucide-react';

interface RouteCardProps {
  route: RouteListItem;
  isSelected?: boolean;
  onSelectRoute: (route: RouteListItem, directionId: string) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected = false,
  onSelectRoute
}) => {
  const { t, language } = useLanguage();

  // Selected direction within this route (default to first available direction)
  const defaultDir = route.directions[0];
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>(
    defaultDir ? defaultDir.id : ''
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Active direction metadata
  const activeDirection =
    route.directions.find((d) => d.id === selectedDirectionId) || defaultDir;

  // On-demand fetch of detailed stop sequence when expanded
  const { data: directionDetails, isLoading: isLoadingStops } = useRouteDirection(
    isExpanded ? route.id : undefined,
    isExpanded ? activeDirection?.id : undefined
  );

  const primaryTitle = language === 'ta' ? route.displayTitleTa : route.displayTitleEn;
  const secondaryTitle = language === 'ta' ? route.displayTitleEn : route.displayTitleTa;

  const handleSelectDirection = (dirId: string) => {
    setSelectedDirectionId(dirId);
  };

  const handleTrackLive = () => {
    if (activeDirection) {
      onSelectRoute(route, activeDirection.id);
    }
  };

  return (
    <article
      className={`route-card ${isSelected ? 'route-card-selected' : ''}`}
      data-testid={`route-card-${route.routeNumber}`}
      aria-labelledby={`route-title-${route.id}`}
    >
      {/* Route Card Header */}
      <div className="route-card-header">
        <div className="route-badge-group">
          <div className="route-number-pill" aria-label={`Route ${route.routeNumber}`}>
            <span className="route-number-prefix">{language === 'ta' ? 'தடம்' : 'Route'}</span>
            <span className="route-number-val">{route.routeNumber}</span>
          </div>

          <Badge variant="neutral">
            <span>{language === 'ta' ? 'நகரப் பேருந்து' : 'Town Service'}</span>
          </Badge>

          <Badge variant="success">
            <Radio size={10} style={{ marginRight: '4px' }} />
            <span>{language === 'ta' ? 'செயலில் உள்ள முன்னோட்டம்' : 'Active Pilot'}</span>
          </Badge>
        </div>
      </div>

      {/* Route Title & Corridor */}
      <div className="route-card-body">
        <h2 id={`route-title-${route.id}`} className="route-card-title">
          {primaryTitle}
        </h2>

        {secondaryTitle && secondaryTitle !== primaryTitle && (
          <p className="route-card-secondary-title">{secondaryTitle}</p>
        )}

        {/* Direction Switcher (OUTBOUND ⇄ INBOUND) */}
        {route.directions.length > 0 && (
          <div className="route-directions-bar" role="radiogroup" aria-label="Route direction">
            <div className="route-directions-label">
              <Compass size={14} aria-hidden="true" />
              <span>{t('routes.direction_label')}:</span>
            </div>

            <div className="route-directions-tabs">
              {route.directions.map((dir) => {
                const isActive = dir.id === selectedDirectionId;
                const isOutbound = dir.directionCode === 'OUTBOUND';
                const label = isOutbound
                  ? t('routes.direction_outbound')
                  : t('routes.direction_inbound');

                return (
                  <button
                    key={dir.id}
                    type="button"
                    className={`route-dir-tab ${isActive ? 'route-dir-tab-active' : ''}`}
                    onClick={() => handleSelectDirection(dir.id)}
                    role="radio"
                    aria-checked={isActive}
                  >
                    <span>{label}</span>
                    <span className="dir-tab-stats">
                      ({dir.totalDistanceKm} km • ~{dir.estimatedDurationMins}m)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Serving Terminals Summary */}
        <div className="route-terminals-strip">
          <div className="route-terminal-item">
            <span className="terminal-label">{language === 'ta' ? 'தொடக்கம்:' : 'Origin:'}</span>
            <span className="terminal-name">
              {activeDirection?.directionCode === 'OUTBOUND'
                ? route.servingBusStands[0] || 'Mattuthavani'
                : route.servingBusStands[route.servingBusStands.length - 1] || 'Terminus'}
            </span>
          </div>

          <ArrowRight size={14} className="route-terminal-arrow" aria-hidden="true" />

          <div className="route-terminal-item">
            <span className="terminal-label">{language === 'ta' ? 'சேருமிடம்:' : 'Destination:'}</span>
            <span className="terminal-name">
              {activeDirection?.directionCode === 'OUTBOUND'
                ? route.servingBusStands[route.servingBusStands.length - 1] || 'Terminus'
                : route.servingBusStands[0] || 'Mattuthavani'}
            </span>
          </div>
        </div>

        {/* Metrics Strip */}
        {activeDirection && (
          <div className="route-metrics-row">
            <div className="route-metric">
              <span className="metric-label">{t('routes.distance_label')}</span>
              <span className="metric-value">{activeDirection.totalDistanceKm} km</span>
            </div>

            <span className="metric-divider">|</span>

            <div className="route-metric">
              <span className="metric-label">{t('routes.duration_label')}</span>
              <span className="metric-value">
                <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                ~{activeDirection.estimatedDurationMins} mins
              </span>
            </div>

            <span className="metric-divider">|</span>

            <div className="route-metric">
              <span className="metric-label">{t('routes.frequency_label')}</span>
              <span className="metric-value">15-20 mins</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="route-card-actions">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        >
          <span>{isExpanded ? t('routes.hide_details') : t('routes.view_details')}</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleTrackLive}
          icon={<Radio size={14} />}
        >
          <span>{t('routes.select_action')}</span>
        </Button>
      </div>

      {/* Expandable Ordered Stop Sequence Panel */}
      {isExpanded && (
        <div className="route-card-expanded-panel">
          <div className="expanded-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ArrowLeftRight size={16} color="var(--color-primary-teal)" />
              <h3 className="expanded-panel-title">
                {language === 'ta'
                  ? 'நிறுத்தங்களின் அதிகாரப்பூர்வ வரிசைமுறை'
                  : 'Verified Stop Sequence & Timings'}
              </h3>
            </div>
            <span className="expanded-panel-subtitle">
              {activeDirection?.directionCode === 'OUTBOUND'
                ? t('routes.direction_outbound')
                : t('routes.direction_inbound')}
            </span>
          </div>

          {isLoadingStops && (
            <div className="route-stops-loading">
              <div className="loading-spinner-sm" aria-hidden="true" />
              <span>{t('routes.loading_stops')}</span>
            </div>
          )}

          {!isLoadingStops && directionDetails?.direction.stops && (
            <RouteStopList
              stops={directionDetails.direction.stops}
              originStopId={directionDetails.direction.originStopId}
              destinationStopId={directionDetails.direction.destinationStopId}
              totalDistanceKm={directionDetails.direction.totalDistanceKm}
              estimatedDurationMins={directionDetails.direction.estimatedDurationMins}
            />
          )}
        </div>
      )}
    </article>
  );
};
