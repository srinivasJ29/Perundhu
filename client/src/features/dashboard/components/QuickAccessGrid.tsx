/**
 * PERUNDHU (பேருந்து) — Quick-Access Cards Grid Component
 * Direct passenger shortcuts for:
 * 1. Live Bus Tracking
 * 2. Routes & Stops
 * 3. Bus Stands
 * 4. Timetables
 * 5. Help & Accessibility
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Route,
  Building2,
  Calendar,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { DashboardRouteSummary } from '../types';

interface QuickAccessGridProps {
  selectedRoute: DashboardRouteSummary | null;
  districtCode: string;
  onOpenTimetable: () => void;
  onBrowseBusStands: () => void;
  onScrollToGuidance: () => void;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({
  selectedRoute,
  districtCode,
  onOpenTimetable,
  onBrowseBusStands,
  onScrollToGuidance
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleOpenLiveTracking = () => {
    if (selectedRoute) {
      navigate(
        `/routes/${selectedRoute.id}?directionId=${selectedRoute.activeDirectionId}&routeNumber=${selectedRoute.routeNumber}&district=${districtCode.toLowerCase()}`
      );
    } else {
      navigate(`/map?district=${districtCode.toLowerCase()}`);
    }
  };

  const handleOpenRoutes = () => {
    navigate(`/districts/${districtCode.toLowerCase()}/routes`);
  };

  return (
    <section className="quick-access-section" aria-labelledby="quick-access-title">
      <h2 id="quick-access-title" className="quick-access-section-title">
        {t('dashboard.quick_access_title')}
      </h2>

      <div className="quick-access-grid">
        {/* Card 1: Live Bus Tracking */}
        <button
          type="button"
          className="quick-card"
          onClick={handleOpenLiveTracking}
          aria-label={t('dashboard.card_live_title')}
        >
          <div className="quick-card-top">
            <div className="quick-card-icon tracking">
              <Radio size={22} />
            </div>
            <Badge variant="success">Step 7</Badge>
          </div>
          <h3 className="quick-card-title">{t('dashboard.card_live_title')}</h3>
          <p className="quick-card-desc">{t('dashboard.card_live_desc')}</p>
          <div className="quick-card-action">
            <span>{language === 'ta' ? 'தொடங்குக' : 'Open Map'}</span>
            <ArrowRight size={14} />
          </div>
        </button>

        {/* Card 2: Routes and Stops */}
        <button
          type="button"
          className="quick-card"
          onClick={handleOpenRoutes}
          aria-label={t('dashboard.card_routes_title')}
        >
          <div className="quick-card-top">
            <div className="quick-card-icon routes">
              <Route size={22} />
            </div>
            <Badge variant="neutral">Verified</Badge>
          </div>
          <h3 className="quick-card-title">{t('dashboard.card_routes_title')}</h3>
          <p className="quick-card-desc">{t('dashboard.card_routes_desc')}</p>
          <div className="quick-card-action">
            <span>{language === 'ta' ? 'வழித்தடங்கள்' : 'View Routes'}</span>
            <ArrowRight size={14} />
          </div>
        </button>

        {/* Card 3: Bus Stands */}
        <button
          type="button"
          className="quick-card"
          onClick={onBrowseBusStands}
          aria-label={t('dashboard.card_stands_title')}
        >
          <div className="quick-card-top">
            <div className="quick-card-icon stands">
              <Building2 size={22} />
            </div>
            <Badge variant="neutral">Madurai</Badge>
          </div>
          <h3 className="quick-card-title">{t('dashboard.card_stands_title')}</h3>
          <p className="quick-card-desc">{t('dashboard.card_stands_desc')}</p>
          <div className="quick-card-action">
            <span>{language === 'ta' ? 'நிலையங்கள்' : 'Browse Stands'}</span>
            <ArrowRight size={14} />
          </div>
        </button>

        {/* Card 4: Timetables */}
        <button
          type="button"
          className="quick-card"
          onClick={onOpenTimetable}
          aria-label={t('dashboard.card_timetable_title')}
        >
          <div className="quick-card-top">
            <div className="quick-card-icon timetable">
              <Calendar size={22} />
            </div>
            <Badge variant="info">TNSTC</Badge>
          </div>
          <h3 className="quick-card-title">{t('dashboard.card_timetable_title')}</h3>
          <p className="quick-card-desc">{t('dashboard.card_timetable_desc')}</p>
          <div className="quick-card-action">
            <span>{language === 'ta' ? 'நேர அட்டவணை' : 'Check Times'}</span>
            <ArrowRight size={14} />
          </div>
        </button>

        {/* Card 5: Help and Accessibility */}
        <button
          type="button"
          className="quick-card"
          onClick={onScrollToGuidance}
          aria-label={t('dashboard.card_help_title')}
        >
          <div className="quick-card-top">
            <div className="quick-card-icon help">
              <HelpCircle size={22} />
            </div>
            <Badge variant="neutral">5 Steps</Badge>
          </div>
          <h3 className="quick-card-title">{t('dashboard.card_help_title')}</h3>
          <p className="quick-card-desc">{t('dashboard.card_help_desc')}</p>
          <div className="quick-card-action">
            <span>{language === 'ta' ? 'வழிகாட்டி' : 'Read Guide'}</span>
            <ArrowRight size={14} />
          </div>
        </button>
      </div>
    </section>
  );
};
