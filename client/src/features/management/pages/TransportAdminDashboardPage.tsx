import React, { useState, useEffect } from 'react';
import {
  Bus,
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Building2,
  Users,
  Compass,
  Cpu
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';
import { TransportAdminDashboardData } from '../../../types/domain';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { ReportExportModal } from '../components/ReportExportModal';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/operations-dashboards.css';

export const TransportAdminDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [data, setData] = useState<TransportAdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    document.title = isTa
      ? 'போக்குவரத்து நிர்வாகக் கட்டுப்பாட்டு மையம் — PERUNDHU'
      : 'Transport Administrator Command Centre — PERUNDHU';

    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await operationsService.getTransportAdminDashboard();
        setData(res);
      } catch (err: any) {
        setError(err?.message || 'Failed to load transport admin metrics');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isTa]);

  return (
    <div className="op-dashboard-page">
      <ManagementNav />

      <header className="op-dashboard-header">
        <div className="op-header-title-group">
          <div className="op-badge-row">
            <span className="op-role-pill">
              <ShieldCheck size={13} />
              <span>{isTa ? 'மாநிலத் தலைமை நிர்வாகி' : 'Transport Administrator'}</span>
            </span>
            <span className="op-status-pill success">
              <Radio size={12} className="radar-pulse" />
              <span>{isTa ? 'நேரலைத் தரவுத்தளம்' : 'Live Persistent DB Feed'}</span>
            </span>
          </div>
          <h1 className="op-page-title">
            {isTa
              ? 'தமிழ்நாடு அரசுப் போக்குவரத்து — தலைமை செயல்பாட்டுக் கட்டுப்பாட்டு மையம்'
              : 'Tamil Nadu State Transport — Executive Operations Command Centre'}
          </h1>
          <p className="op-page-subtitle">
            {isTa
              ? 'மாநில அளவிலான பேருந்துகள், பணிமனைகள், நிகழ்நேர ஜிபிஎஸ் கருவிகள் மற்றும் பயணங்களின் நேரலை நிலை'
              : 'Statewide fleet distribution, depot capacities, telemetry freshness, and scheduled trip execution'}
          </p>
        </div>

        <div className="op-header-actions">
          <button
            type="button"
            className="op-btn-primary"
            onClick={() => setIsExportModalOpen(true)}
            data-testid="export-report-btn"
          >
            <Download size={16} />
            <span>{isTa ? 'அறிக்கை பதிவிறக்கு (CSV)' : 'Export Report (CSV)'}</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="op-loading-state" role="status">
          <div className="op-spinner" />
          <span>{isTa ? 'தரவுத்தள புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன...' : 'Querying verified database telemetry...'}</span>
        </div>
      )}

      {error && (
        <div className="op-error-banner" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>{isTa ? 'தரவு ஏற்றுவதில் பிழை' : 'Telemetry Load Error'}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && data && (
        <main className="op-dashboard-content">
          {/* 1. Top Enterprise KPI Metrics Grid */}
          <section className="op-kpi-grid" aria-label="Executive Operations KPIs">
            <DashboardKpiCard
              title={isTa ? 'பதிவு செய்யப்பட்ட பேருந்துகள்' : 'Total Fleet Strength'}
              value={data.metrics.totalRegisteredBuses}
              subtitle={isTa ? `இயக்கத்தில்: ${data.metrics.activeBuses} • இருப்பு: ${data.metrics.reserveBuses}` : `Active: ${data.metrics.activeBuses} • Reserve: ${data.metrics.reserveBuses}`}
              icon={<Bus size={22} />}
              badge={{
                text: `${data.metrics.fleetUtilizationPercent}% ${isTa ? 'பயன்பாடு' : 'Utilized'}`,
                variant: 'success'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'தற்போது இயங்கும் பேருந்துகள்' : 'Buses Operating In-Transit'}
              value={data.metrics.busesInTransit}
              subtitle={isTa ? 'நேரலை பயண வழித்தடங்களில் உள்ளவை' : 'Currently active on assigned corridor trips'}
              icon={<Activity size={22} />}
              badge={{ text: isTa ? 'செயல்பாட்டில்' : 'In Service', variant: 'info' }}
            />

            <DashboardKpiCard
              title={isTa ? 'ஜிபிஎஸ் நேரலை கருவிகள்' : 'GPS Connected Trackers'}
              value={data.metrics.gpsConnectedBuses}
              subtitle={isTa ? `தாமதம்: ${data.metrics.gpsStaleBuses} • ஆஃப்லைன்: ${data.metrics.gpsOfflineBuses}` : `Stale (<30m): ${data.metrics.gpsStaleBuses} • Offline: ${data.metrics.gpsOfflineBuses}`}
              icon={<Radio size={22} />}
              badge={{
                text: `${Math.round((data.metrics.gpsConnectedBuses / Math.max(1, data.metrics.totalRegisteredBuses)) * 100)}% Online`,
                variant: 'success'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'இன்றைய திட்டமிட்ட பயணங்கள்' : 'Total Trips Scheduled'}
              value={data.metrics.totalTripsToday}
              subtitle={isTa ? `நிறைவு: ${data.metrics.completedTrips} • தாமதம்: ${data.metrics.delayedTrips}` : `Completed: ${data.metrics.completedTrips} • Delayed: ${data.metrics.delayedTrips}`}
              icon={<Clock size={22} />}
              badge={{
                text: `${data.metrics.completedTrips} ${isTa ? 'நிறைவு' : 'Done'}`,
                variant: 'neutral'
              }}
            />
          </section>

          {/* 2. Secondary Staff & System Status Strip */}
          <section className="op-status-strip">
            <div className="op-strip-card">
              <div className="strip-header">
                <Users size={18} className="text-teal" />
                <h4>{isTa ? 'ஓட்டுநர்கள் இருப்பு' : 'Driver Duty Availability'}</h4>
              </div>
              <div className="strip-stats">
                <div className="stat-pill">
                  <span className="dot dot-success" />
                  <span>{isTa ? 'தயார்:' : 'Available:'} <strong>{data.metrics.driverAvailability.available}</strong></span>
                </div>
                <div className="stat-pill">
                  <span className="dot dot-info" />
                  <span>{isTa ? 'பணியில்:' : 'On Duty:'} <strong>{data.metrics.driverAvailability.onDuty}</strong></span>
                </div>
                <div className="stat-pill">
                  <span className="dot dot-warning" />
                  <span>{isTa ? 'விடுப்பில்:' : 'On Leave:'} <strong>{data.metrics.driverAvailability.onLeave}</strong></span>
                </div>
              </div>
            </div>

            <div className="op-strip-card">
              <div className="strip-header">
                <Users size={18} className="text-teal" />
                <h4>{isTa ? 'நடத்துநர்கள் இருப்பு' : 'Conductor Duty Availability'}</h4>
              </div>
              <div className="strip-stats">
                <div className="stat-pill">
                  <span className="dot dot-success" />
                  <span>{isTa ? 'தயார்:' : 'Available:'} <strong>{data.metrics.conductorAvailability.available}</strong></span>
                </div>
                <div className="stat-pill">
                  <span className="dot dot-info" />
                  <span>{isTa ? 'பணியில்:' : 'On Duty:'} <strong>{data.metrics.conductorAvailability.onDuty}</strong></span>
                </div>
                <div className="stat-pill">
                  <span className="dot dot-warning" />
                  <span>{isTa ? 'விடுப்பில்:' : 'On Leave:'} <strong>{data.metrics.conductorAvailability.onLeave}</strong></span>
                </div>
              </div>
            </div>

            <div className="op-strip-card">
              <div className="strip-header">
                <Cpu size={18} className="text-teal" />
                <h4>{isTa ? 'AI வருகை கணிப்பு நிலை' : 'AI/ML ETA Service Status'}</h4>
              </div>
              <div className="strip-stats">
                <span className="op-badge-tag success">
                  {data.etaServiceStatus.status}
                </span>
                <span className="text-xs text-muted">
                  {data.etaServiceStatus.activeModel} ({Math.round(data.etaServiceStatus.confidence * 100)}% {isTa ? 'துல்லியம்' : 'Confidence'})
                </span>
              </div>
            </div>
          </section>

          {/* 3. Depot-wise Fleet Distribution Table */}
          <section className="op-table-section">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} className="text-teal" />
                <div>
                  <h3 className="table-title">
                    {isTa ? 'பணிமனை வாரியான பேருந்து ஒதுக்கீடுகள்' : 'Depot-wise Fleet Strength & Live Rotation'}
                  </h3>
                  <p className="table-subtitle">
                    {isTa ? 'ஒவ்வொரு பணிமனையிலும் உள்ள மொத்த மற்றும் இயங்கும் பேருந்துகளின் விவரம்' : 'Distribution of active fleet, reserves, and vehicles in transit across certified depots'}
                  </p>
                </div>
              </div>
            </div>

            <div className="op-table-container">
              <table className="op-data-table">
                <thead>
                  <tr>
                    <th>{isTa ? 'பணிமனை குறியீடு' : 'Depot Code'}</th>
                    <th>{isTa ? 'பணிமனை பெயர்' : 'Depot Name'}</th>
                    <th>{isTa ? 'மொத்தப் பேருந்துகள்' : 'Total Fleet'}</th>
                    <th>{isTa ? 'இயக்கத்தில் உள்ளவை' : 'Active'}</th>
                    <th>{isTa ? 'பயணத்தில் உள்ளவை' : 'In Transit'}</th>
                    <th>{isTa ? 'இருப்புப் பேருந்துகள்' : 'Reserve Fleet'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.depotFleetSummary.map((depot) => (
                    <tr key={depot.depotId}>
                      <td>
                        <span className="code-badge">{depot.depotCode}</span>
                      </td>
                      <td>
                        <strong>{isTa ? depot.depotNameTa : depot.depotNameEn}</strong>
                      </td>
                      <td>{depot.totalBuses}</td>
                      <td>
                        <span className="status-badge success">{depot.activeBuses}</span>
                      </td>
                      <td>
                        <span className="status-badge info">{depot.inTransitBuses}</span>
                      </td>
                      <td>
                        <span className="status-badge warning">{depot.reserveBuses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Division Operational Overview */}
          <section className="op-division-grid">
            <h3 className="section-title">
              <Compass size={18} className="text-teal" />
              <span>{isTa ? 'கோட்ட வாரியான செயல்பாட்டு கண்ணோட்டம்' : 'Divisional Operational Overview'}</span>
            </h3>

            <div className="division-cards-row">
              {data.divisionOverview.map((div) => (
                <div key={div.divisionId} className="division-card">
                  <div className="div-card-top">
                    <span className="code-badge">{div.divisionCode}</span>
                    <span className="div-tag">{isTa ? `${div.depotCount} பணிமனைகள்` : `${div.depotCount} Depots`}</span>
                  </div>
                  <h4 className="div-title">{isTa ? div.nameTa : div.nameEn}</h4>
                  <div className="div-meta-row">
                    <span>{isTa ? 'பேருந்துகள்:' : 'Buses:'} <strong>{div.busCount}</strong></span>
                    <span>{isTa ? 'நாளாந்த பயணங்கள்:' : 'Daily Trips:'} <strong>{div.tripCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Role-Authorized Export Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

