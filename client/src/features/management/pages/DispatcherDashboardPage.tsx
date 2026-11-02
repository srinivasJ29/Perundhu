import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Clock,
  AlertTriangle,
  Bus,
  RefreshCw,
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';
import { DispatcherDashboardData } from '../../../types/domain';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/operations-dashboards.css';

export const DispatcherDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [data, setData] = useState<DispatcherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeSimulated, setIncludeSimulated] = useState(false);

  const fetchDispatcherData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await operationsService.getDispatcherDashboard(undefined, includeSimulated);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dispatcher live telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = isTa
      ? 'நேரலை இயக்கக் கட்டுப்பாட்டாளர் களம் — PERUNDHU'
      : 'Dispatcher Live Operations Console — PERUNDHU';

    fetchDispatcherData();
    const interval = setInterval(fetchDispatcherData, 15000); // Poll telemetry every 15s
    return () => clearInterval(interval);
  }, [isTa, includeSimulated]);

  return (
    <div className="op-dashboard-page">
      <ManagementNav />

      {/* Header with Live Dispatcher Context */}
      <header className="op-dashboard-header">
        <div className="op-header-title-group">
          <div className="op-badge-row">
            <span className="op-role-pill">
              <Navigation size={13} />
              <span>{isTa ? 'இயக்கக் கட்டுப்பாட்டாளர்' : 'Fleet Dispatcher'}</span>
            </span>
            <span className="op-status-pill success">
              <Radio size={12} className="radar-pulse" />
              <span>{isTa ? 'நிகழ்நேர கண்காணிப்பு (15 விநாடி)' : 'Live Telemetry Radar (15s)'}</span>
            </span>
          </div>
          <h1 className="op-page-title">
            {isTa
              ? 'நேரலை பேருந்து இயக்கக் கண்காணிப்பு மற்றும் புறப்பாடு மையம்'
              : 'Live Fleet Dispatch Console & Corridor Radar'}
          </h1>
          <p className="op-page-subtitle">
            {isTa
              ? 'உண்மையான வன்பொருள் ஜிபிஎஸ் மற்றும் உருவகப்படுத்தப்பட்ட தரவுகளைத் துல்லியமாகப் பிரித்துக் காட்டும் தளம்'
              : 'Real-time telemetry tracking with strict provenance separation between certified hardware and simulator data'}
          </p>
        </div>

        <div className="op-header-actions">
          <label className="op-toggle-label">
            <input
              type="checkbox"
              checked={includeSimulated}
              onChange={(e) => setIncludeSimulated(e.target.checked)}
            />
            <span>{isTa ? 'உருவகப்படுத்திய பேருந்துகளைக் காட்டு' : 'Include Simulator Data'}</span>
          </label>

          <button type="button" className="op-btn-outline" onClick={fetchDispatcherData}>
            <RefreshCw size={15} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {isLoading && !data && (
        <div className="op-loading-state" role="status">
          <div className="op-spinner" />
          <span>{isTa ? 'நேரலை இயக்கத் தரவுகள் சேகரிக்கப்படுகின்றன...' : 'Syncing live bus positions and active trips...'}</span>
        </div>
      )}

      {error && (
        <div className="op-error-banner" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>{isTa ? 'கண்காணிப்பு பிழை' : 'Dispatcher Feed Error'}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && data && (
        <main className="op-dashboard-content">
          {/* Top Quick Status KPIs */}
          <section className="op-kpi-grid">
            <DashboardKpiCard
              title={isTa ? 'தற்போது இயங்கும் பேருந்துகள்' : 'Operating Fleet on Map'}
              value={data.operatingBuses.length}
              subtitle={isTa ? `வன்பொருள் ஜிபிஎஸ்: ${data.operatingBuses.filter((b) => !b.isSimulated).length}` : `Certified Hardware: ${data.operatingBuses.filter((b) => !b.isSimulated).length}`}
              icon={<Bus size={22} />}
              badge={{
                text: `${data.operatingBuses.filter((b) => b.isSimulated).length} ${isTa ? 'உருவகப்படுத்தப்பட்டது' : 'Simulated'}`,
                variant: 'neutral'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'நடைபெறும் பயணங்கள்' : 'Active Corridor Trips'}
              value={data.activeTrips.length}
              subtitle={isTa ? 'வழித்தடத்தில் இயங்கும் பேருந்துகள்' : 'Buses currently in-transit on scheduled routes'}
              icon={<Activity size={22} />}
              badge={{ text: isTa ? 'செயல்பாட்டில்' : 'In Transit', variant: 'info' }}
            />

            <DashboardKpiCard
              title={isTa ? 'தாமதமான பயணங்கள்' : 'Delayed Departures Alert'}
              value={data.delayedTrips.length}
              subtitle={isTa ? '10 நிமிடங்களுக்கும் மேல் தாமதமானவை' : 'Departures delayed > 10 mins beyond schedule'}
              icon={<Clock size={22} />}
              badge={{
                text: data.delayedTrips.length > 0 ? (isTa ? 'கவனம் தேவை' : 'Action Required') : (isTa ? 'சரியான நேரம்' : 'On Time'),
                variant: data.delayedTrips.length > 0 ? 'alert' : 'success'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'அடுத்த 2 மணிநேரப் புறப்பாடுகள்' : 'Upcoming Departures (2h)'}
              value={data.upcomingDepartures.length}
              subtitle={isTa ? `வாகனம் ஒதுக்கப்பட்டவை: ${data.upcomingDepartures.filter((u) => u.busAssigned).length}` : `Bus Assigned: ${data.upcomingDepartures.filter((u) => u.busAssigned).length}`}
              icon={<CheckCircle2 size={22} />}
              badge={{ text: isTa ? 'தயார்' : 'Scheduled', variant: 'success' }}
            />
          </section>

          {/* Provenance Integrity Notice */}
          <section className="op-provenance-callout">
            <Radio size={18} className="text-teal" />
            <div>
              <strong>{isTa ? 'தரவு நேர்மை மற்றும் உறுதிப்படுத்தல்:' : 'Data Provenance & Telemetry Integrity:'}</strong>{' '}
              <span>
                {isTa
                  ? 'உண்மையான ஏஐஎஸ்-140/ETM வன்பொருள் ஜிபிஎஸ் பேருந்துகள் மட்டுமே பச்சை நிறத்திலும், உருவகப்படுத்தப்பட்ட சோதனைக் கருவிகள் தனித்த மஞ்சள் அடையாளத்துடனும் காட்டப்படுகின்றன.'
                  : 'Certified hardware GPS observations are strictly separated from simulated feeds. Simulator data is never passed as real-world bus positions.'}
              </span>
            </div>
          </section>

          {/* Active Operating Buses List */}
          <section className="op-table-section">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bus size={20} className="text-teal" />
                <div>
                  <h3 className="table-title">
                    {isTa ? 'இயங்கும் பேருந்துகளின் நேரலை தொலைவு & வேகம்' : 'Operating Buses — Live GPS Coordinates & Telemetry'}
                  </h3>
                  <p className="table-subtitle">
                    {isTa ? 'அட்சரேகை/தீர்க்கரேகை, வேகம், சிக்னல் புதுப்பிப்பு மற்றும் மூல வகை' : 'Real-time latitude, longitude, speed, freshness, and certified source provenance'}
                  </p>
                </div>
              </div>
            </div>

            <div className="op-table-container">
              <table className="op-data-table">
                <thead>
                  <tr>
                    <th>{isTa ? 'பேருந்து எண்' : 'Bus Reg'}</th>
                    <th>{isTa ? 'வழித்தடம்' : 'Route'}</th>
                    <th>{isTa ? 'வேகம் / திசை' : 'Speed / Heading'}</th>
                    <th>{isTa ? 'இருப்பிடம் (WGS84)' : 'Coordinates'}</th>
                    <th>{isTa ? 'சிக்னல் நிலை' : 'Freshness'}</th>
                    <th>{isTa ? 'மூல வகை' : 'Source Provenance'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operatingBuses.map((bus) => (
                    <tr key={bus.busId}>
                      <td>
                        <strong>{bus.registrationNumber}</strong>
                        <div className="text-xs text-muted">{bus.fleetNumber}</div>
                      </td>
                      <td>
                        <span className="code-badge">{bus.routeNumber || 'CORRIDOR'}</span>
                      </td>
                      <td>
                        <strong>{bus.currentSpeed} km/h</strong>
                        <div className="text-xs text-muted">{bus.heading}° deg</div>
                      </td>
                      <td>
                        <code className="coords-code">
                          {bus.coordinates[1].toFixed(4)}°N, {bus.coordinates[0].toFixed(4)}°E
                        </code>
                      </td>
                      <td>
                        <span className={`status-badge ${bus.freshnessCategory === 'FRESH' ? 'success' : bus.freshnessCategory === 'RECENT' ? 'info' : 'warning'}`}>
                          {bus.freshnessCategory}
                        </span>
                      </td>
                      <td>
                        {bus.isSimulated ? (
                          <span className="status-badge neutral" title="Test Simulator feed — Not real hardware">
                            {isTa ? 'சோதனை உருவகப்படுத்தல்' : 'SIMULATOR'}
                          </span>
                        ) : (
                          <span className="status-badge success" title="Certified Government Transport Telemetry">
                            <Radio size={11} style={{ marginRight: '4px' }} />
                            {bus.sourceProvenance}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Active Trips & Delayed Departures Row */}
          <div className="op-two-column-grid">
            <section className="op-table-section">
              <div className="table-header">
                <Clock size={18} className="text-teal" />
                <h3 className="table-title">{isTa ? 'அடுத்து புறப்படும் பேருந்துகள்' : 'Upcoming Departures'}</h3>
              </div>
              <div className="op-table-container">
                <table className="op-data-table">
                  <thead>
                    <tr>
                      <th>{isTa ? 'பயணம்' : 'Trip'}</th>
                      <th>{isTa ? 'வழித்தடம்' : 'Route'}</th>
                      <th>{isTa ? 'புறப்படும் நேரம்' : 'Dep Time'}</th>
                      <th>{isTa ? 'ஒதுக்கீடு' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcomingDepartures.slice(0, 6).map((dep) => (
                      <tr key={dep.tripId}>
                        <td><span className="code-badge">{dep.tripCode}</span></td>
                        <td><strong>{dep.routeNumber}</strong></td>
                        <td>{dep.departureTime} ({dep.timeUntilDepartureMins}m)</td>
                        <td>
                          {dep.busAssigned && dep.driverAssigned ? (
                            <span className="status-badge success">{isTa ? 'தயார்' : 'Ready'}</span>
                          ) : (
                            <span className="status-badge warning">{isTa ? 'ஒதுக்கீடில்லை' : 'Pending Staff'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="op-table-section">
              <div className="table-header">
                <AlertTriangle size={18} className="text-alert" />
                <h3 className="table-title">{isTa ? 'தாமதமான பயணங்கள்' : 'Delayed Departures'}</h3>
              </div>
              <div className="op-table-container">
                {data.delayedTrips.length === 0 ? (
                  <div className="op-empty-card">
                    <CheckCircle2 size={24} className="text-success" />
                    <p>{isTa ? 'தாமதமான பயணங்கள் ஏதுமில்லை. அனைத்துப் புறப்பாடுகளும் சரியான நேரத்தில் உள்ளன.' : 'No delayed trips. All scheduled departures operating on time.'}</p>
                  </div>
                ) : (
                  <table className="op-data-table">
                    <thead>
                      <tr>
                        <th>{isTa ? 'பயணம்' : 'Trip'}</th>
                        <th>{isTa ? 'நேரம்' : 'Time'}</th>
                        <th>{isTa ? 'தாமதம்' : 'Delay'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.delayedTrips.map((del) => (
                        <tr key={del.tripId} className="row-delayed">
                          <td><span className="code-badge">{del.tripCode}</span></td>
                          <td>{del.departureTime}</td>
                          <td><strong className="text-alert">+{del.scheduledVsActualDiffMins}m</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
};

