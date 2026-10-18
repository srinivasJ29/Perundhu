/**
 * PERUNDHU (பேருந்து) — Live Bus Overview Component
 * Ground-truth telemetry monitor querying verified /trips/active and /buses endpoints.
 * Displays honest empty state when 0 buses are actively reporting, and clearly differentiates
 * between simulated feeds and real-world GPS tracking.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Bus,
  Activity,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LiveBusOverviewState, DashboardRouteSummary } from '../types';

interface LiveBusOverviewProps {
  overviewState: LiveBusOverviewState;
  selectedRoute: DashboardRouteSummary | null;
  onRefresh: () => void;
}

export const LiveBusOverview: React.FC<LiveBusOverviewProps> = ({
  overviewState,
  selectedRoute,
  onRefresh
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleOpenTrackingHandoff = () => {
    if (selectedRoute) {
      navigate(
        `/routes/${selectedRoute.id}?directionId=${selectedRoute.activeDirectionId}&routeNumber=${selectedRoute.routeNumber}`
      );
    } else {
      navigate('/map');
    }
  };

  return (
    <section className="live-overview-card" aria-labelledby="live-overview-title">
      <div className="live-overview-header">
        <div className="live-overview-title-group">
          <div className="live-telemetry-status-badge">
            <Radio
              size={14}
              className={overviewState.reportingBusesCount > 0 ? 'pulse' : ''}
              color={
                overviewState.reportingBusesCount > 0
                  ? 'var(--color-status-success)'
                  : 'var(--color-text-muted)'
              }
            />
            <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
              {overviewState.reportingBusesCount > 0 ? t('common.live') : 'STANDBY'}
            </span>
          </div>

          <div>
            <h2 id="live-overview-title" className="live-overview-title">
              {t('dashboard.live_overview_title')}
            </h2>
            <div className="live-overview-last-update">
              <Clock size={12} />
              <span>
                {language === 'ta' ? 'கடைசியாகச் சோதிக்கப்பட்டது: ' : 'Last checked: '}
                {overviewState.lastCheckedTime}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="btn btn-outline live-refresh-btn"
          aria-label={t('common.refresh')}
          title={t('common.refresh')}
        >
          <RefreshCw size={14} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Telemetry Source & Depot Fleet Status Row */}
      <div className="live-overview-stats-grid">
        {/* Metric 1: Currently Reporting Buses (Strictly Ground Truth) */}
        <div className="live-stat-card">
          <span className="live-stat-label">
            {language === 'ta' ? 'நேரலை பேருந்துகள்' : 'Reporting Live Buses'}
          </span>
          <div className="live-stat-val-group">
            <span className="live-stat-val">{overviewState.reportingBusesCount}</span>
            <span className="live-stat-unit">
              {language === 'ta' ? 'பேருந்துகள்' : 'reporting'}
            </span>
          </div>
        </div>

        {/* Metric 2: Registered Depot Fleet */}
        <div className="live-stat-card">
          <span className="live-stat-label">
            {language === 'ta' ? 'பதிவுசெய்யப்பட்ட பேருந்துகள்' : 'Registered Fleet'}
          </span>
          <div className="live-stat-val-group">
            <span className="live-stat-val">{overviewState.registeredFleetCount}</span>
            <span className="live-stat-unit">
              {language === 'ta' ? 'பணிமனையில்' : 'in depot'}
            </span>
          </div>
        </div>

        {/* Metric 3: Telemetry Mode */}
        <div className="live-stat-card">
          <span className="live-stat-label">{t('dashboard.telemetry_source')}</span>
          <div style={{ marginTop: 'var(--space-1)' }}>
            {overviewState.isSimulatedSource ? (
              <Badge variant="warning">
                <Activity size={12} style={{ marginRight: '4px' }} />
                <span>{t('dashboard.telemetry_simulated')}</span>
              </Badge>
            ) : (
              <Badge variant="neutral">
                <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                <span>{t('dashboard.telemetry_gps_standby')}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Honest Empty State When No Buses Are Reporting */}
      {overviewState.reportingBusesCount === 0 && (
        <div className="live-overview-empty-box" role="status">
          <AlertCircle size={22} color="var(--color-sage)" />
          <div className="live-overview-empty-content">
            <strong className="live-overview-empty-title">
              {t('dashboard.no_live_buses')}
            </strong>
            <p className="live-overview-empty-desc">
              {language === 'ta'
                ? 'அரசுப் பேருந்துகள் தங்கள் பயணத்தைத் தொடங்கியவுடன் ஜிபிஎஸ் இருப்பிடங்கள் தானாகவே திரையில் தோன்றும். படி 7-ல் முழுமையான ஊடாடும் நேரலை வரைபடம் இணைக்கப்படும்.'
                : 'As buses depart their terminals and transmit telemetry, real-time GPS locations will stream to this dashboard. Full WebSocket live tracking is scheduled for Step 7.'}
            </p>
          </div>
        </div>
      )}

      {/* Depot Fleet Manifest Snippet (3 Real Buses from Backend) */}
      {overviewState.buses.length > 0 && (
        <div className="live-depot-manifest">
          <div className="live-depot-manifest-header">
            <Bus size={14} color="var(--color-primary-teal)" />
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              {language === 'ta'
                ? 'மதுரை பணிமனை பேருந்து விவரங்கள் (அரசுப் போக்குவரத்து)'
                : 'Madurai Depot Registered Vehicles (TNSTC)'}
            </span>
          </div>
          <div className="live-depot-chips-row">
            {overviewState.buses.map((bus) => (
              <div key={bus.id} className="live-bus-chip">
                <span className="live-bus-chip-reg">{bus.registrationNumber}</span>
                <span className="live-bus-chip-fleet">({bus.fleetNumber})</span>
                <span className="live-bus-chip-depot">{bus.depotName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Map Link / Handoff Button */}
      <div className="live-overview-footer">
        <Button
          type="button"
          variant="primary"
          onClick={handleOpenTrackingHandoff}
          icon={<Radio size={16} />}
        >
          <span>{t('dashboard.open_live_tracking')}</span>
        </Button>
      </div>
    </section>
  );
};
