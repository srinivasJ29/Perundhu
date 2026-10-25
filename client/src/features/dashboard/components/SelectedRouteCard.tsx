/**
 * PERUNDHU (பேருந்து) — Selected District and Route Card
 * Displays the chosen route's verified metrics, start and destination stops,
 * stop count from sequence data, and buttons to view details or open tracking map.
 * Shows an honest prompt if no route has been chosen yet.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route,
  Clock,
  Compass,
  ListOrdered,
  Radio,
  ExternalLink,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { DashboardDistrictInfo, DashboardRouteSummary } from '../types';
import { AnimatedBusCorridor } from './AnimatedBusCorridor';

interface SelectedRouteCardProps {
  district: DashboardDistrictInfo;
  selectedRoute: DashboardRouteSummary | null;
  isLoading: boolean;
  onOpenTimetable: () => void;
}

export const SelectedRouteCard: React.FC<SelectedRouteCardProps> = ({
  district,
  selectedRoute,
  isLoading,
  onOpenTimetable
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // If district is not pilot (e.g. non-Madurai)
  if (!district.isPilot) {
    return (
      <div className="selected-route-container">
        <div className="selected-route-card unsupported">
          <div className="selected-route-empty-icon">
            <HelpCircle size={28} color="var(--color-sage)" />
          </div>
          <div className="selected-route-empty-content">
            <h3 className="selected-route-empty-title">
              {language === 'ta'
                ? `${district.nameTa} மாவட்டத்தில் சேவைகள் விரிவாக்கத்தில் உள்ளன`
                : `Corridor Scheduled for Statewide Expansion`}
            </h3>
            <p className="selected-route-empty-desc">
              {language === 'ta'
                ? 'தற்போதைய முதல் கட்ட முன்னோடித் திட்டம் மதுரை மாவட்டத்தில் செயல்படுகிறது. வழித்தடங்களைக் காண மதுரையைத் தேர்ந்தெடுக்கவும்.'
                : 'Pilot transit operations and live telemetry are currently active in Madurai district. Please switch to Madurai to explore routes.'}
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/districts')}
            >
              <span>{t('districts.title')}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no route has been chosen yet
  if (!selectedRoute) {
    return (
      <div className="selected-route-container">
        <div className="selected-route-card empty">
          <div className="selected-route-empty-icon">
            <Route size={28} color="var(--color-primary-teal)" />
          </div>
          <div className="selected-route-empty-content">
            <h3 className="selected-route-empty-title">
              {t('dashboard.select_route_prompt')}
            </h3>
            <p className="selected-route-empty-desc">
              {language === 'ta'
                ? 'மதுரை மாட்டுத்தாவணி மற்றும் பெரியார் பேருந்து நிலையங்களை இணைக்கும் தடம் 70 மற்றும் தடம் 77 தயார் நிலையில் உள்ளன.'
                : 'Explore verified Town Service corridors connecting Mattuthavani, Periyar, and Thirumangalam.'}
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(`/districts/${district.code.toLowerCase()}/routes`)}
              icon={<Route size={16} />}
            >
              <span>{t('dashboard.choose_route_btn')}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const primaryTitle =
    language === 'ta' ? selectedRoute.displayTitleTa : selectedRoute.displayTitleEn;
  const secondaryTitle =
    language === 'ta' ? selectedRoute.displayTitleEn : selectedRoute.displayTitleTa;

  const originStopName =
    language === 'ta' ? selectedRoute.originNameTa : selectedRoute.originNameEn;
  const destStopName =
    language === 'ta' ? selectedRoute.destinationNameTa : selectedRoute.destinationNameEn;

  const handleOpenLiveTracking = () => {
    navigate(
      `/routes/${selectedRoute.id}?directionId=${selectedRoute.activeDirectionId}&routeNumber=${selectedRoute.routeNumber}&district=${district.code.toLowerCase()}`
    );
  };

  const handleViewRouteDetails = () => {
    navigate(`/districts/${district.code.toLowerCase()}/routes`);
  };

  return (
    <div className="selected-route-container">
      <article className="selected-route-card active" aria-labelledby="selected-route-heading">
        {/* Top Header Row */}
        <div className="selected-route-header-row">
          <div className="selected-route-badge-box">
            <div className="selected-route-number-pill">
              <span className="selected-route-pill-prefix">
                {language === 'ta' ? 'தடம்' : 'Route'}
              </span>
              <span className="selected-route-pill-num">{selectedRoute.routeNumber}</span>
            </div>

            <Badge variant="neutral">
              <span>{selectedRoute.serviceCategory.replace('_', ' ')}</span>
            </Badge>

            <Badge variant="info">
              <Compass size={12} style={{ marginRight: '4px' }} />
              <span>
                {selectedRoute.directionCode === 'OUTBOUND'
                  ? t('routes.direction_outbound')
                  : t('routes.direction_inbound')}
              </span>
            </Badge>
          </div>

          <Badge variant="success">
            <Radio size={12} style={{ marginRight: '4px' }} />
            <span>{language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Active Selection'}</span>
          </Badge>
        </div>

        {/* Title & Corridor */}
        <div className="selected-route-titles">
          <h3 id="selected-route-heading" className="selected-route-title">
            {primaryTitle}
          </h3>
          <div className="selected-route-subtitle">{secondaryTitle}</div>
        </div>

        {/* Living Animated Transit Corridor */}
        <AnimatedBusCorridor
          originStopName={originStopName}
          destStopName={destStopName}
          routeNumber={selectedRoute.routeNumber}
          language={language}
          directionCode={selectedRoute.directionCode}
          totalDistanceKm={selectedRoute.totalDistanceKm}
          estimatedDurationMins={selectedRoute.estimatedDurationMins}
        />

        {/* Metrics Grid */}
        <div className="selected-route-metrics-grid">
          <div className="selected-route-metric">
            <div className="metric-icon-box">
              <ListOrdered size={16} />
            </div>
            <div className="metric-content">
              <span className="metric-label">{t('routes.stops_count_label')}</span>
              <strong className="metric-val">
                {isLoading ? '...' : `${selectedRoute.stopsCount} ${language === 'ta' ? 'நிறுத்தங்கள்' : 'Stops'}`}
              </strong>
            </div>
          </div>

          <div className="selected-route-metric">
            <div className="metric-icon-box">
              <Compass size={16} />
            </div>
            <div className="metric-content">
              <span className="metric-label">{t('routes.distance_label')}</span>
              <strong className="metric-val">{selectedRoute.totalDistanceKm} km</strong>
            </div>
          </div>

          <div className="selected-route-metric">
            <div className="metric-icon-box">
              <Clock size={16} />
            </div>
            <div className="metric-content">
              <span className="metric-label">{t('routes.duration_label')}</span>
              <strong className="metric-val">{selectedRoute.estimatedDurationMins} mins</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="selected-route-actions-row">
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenLiveTracking}
            icon={<Radio size={16} />}
          >
            <span>{t('dashboard.open_live_tracking')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onOpenTimetable}
            icon={<Calendar size={16} />}
          >
            <span>{t('dashboard.card_timetable_title')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleViewRouteDetails}
            icon={<ExternalLink size={16} />}
          >
            <span>{t('dashboard.view_route_details')}</span>
          </Button>
        </div>
      </article>
    </div>
  );
};
