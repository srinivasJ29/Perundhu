import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bus,
  Clock,
  Radio,
  UserCheck,
  Cpu,
  AlertCircle,
  Download,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';
import { DepotManagerDashboardData } from '../../../types/domain';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { TripAssignmentModal } from '../components/TripAssignmentModal';
import { ReportExportModal } from '../components/ReportExportModal';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/operations-dashboards.css';

export const DepotManagerDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [data, setData] = useState<DepotManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment Modal State
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await operationsService.getDepotManagerDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load depot operational data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = isTa
      ? 'பணிமனை மேலாளர் செயல்பாட்டுக் களம் — PERUNDHU'
      : 'Depot Manager Command Centre — PERUNDHU';

    fetchDashboardData();
  }, [isTa]);

  return (
    <div className="op-dashboard-page">
      <ManagementNav />

      {/* Header with Depot Context */}
      <header className="op-dashboard-header">
        <div className="op-header-title-group">
          <div className="op-badge-row">
            <span className="op-role-pill">
              <Building2 size={13} />
              <span>{isTa ? 'பணிமனை மேலாளர்' : 'Depot Operations Manager'}</span>
            </span>
            {data?.depot && (
              <span className="op-status-pill info">
                <span>{data.depot.code} • {isTa ? data.depot.nameTa : data.depot.nameEn}</span>
              </span>
            )}
          </div>
          <h1 className="op-page-title">
            {isTa
              ? `${data?.depot ? data.depot.nameTa : 'பணிமனை'} — நேரலை செயல்பாட்டு மேலாண்மை`
              : `${data?.depot ? data.depot.nameEn : 'Depot'} — Operational Fleet & Dispatch Console`}
          </h1>
          <p className="op-page-subtitle">
            {isTa
              ? 'பணிமனைப் பேருந்துகள், ஓட்டுநர்-நடத்துநர் ஒதுக்கீடுகள், புறப்பாடுகள் மற்றும் சாதனங்களின் நிலை'
              : 'Depot fleet allocation, trip-to-bus assignments, staff roster verification, and device telemetry'}
          </p>
        </div>

        <div className="op-header-actions">
          <button
            type="button"
            className="op-btn-outline"
            onClick={fetchDashboardData}
            title={isTa ? 'புதுப்பி' : 'Refresh'}
          >
            <RefreshCw size={15} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="op-btn-primary"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download size={16} />
            <span>{isTa ? 'அறிக்கை பதிவிறக்கு' : 'Export Depot Report'}</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="op-loading-state" role="status">
          <div className="op-spinner" />
          <span>{isTa ? 'பணிமனைத் தரவுகள் ஏற்றப்படுகின்றன...' : 'Loading depot fleet roster and schedules...'}</span>
        </div>
      )}

      {error && (
        <div className="op-error-banner" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>{isTa ? 'அணுகல் பிழை' : 'Access / Load Error'}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && data && (
        <main className="op-dashboard-content">
          {/* 1. Fleet & Departure KPI Cards */}
          <section className="op-kpi-grid">
            <DashboardKpiCard
              title={isTa ? 'பணிமனைப் பேருந்துகள்' : 'Depot Fleet Strength'}
              value={data.fleetSummary.total}
              subtitle={isTa ? `இயக்கத்தில்: ${data.fleetSummary.active} • இருப்பு: ${data.fleetSummary.reserve}` : `Active: ${data.fleetSummary.active} • Reserve: ${data.fleetSummary.reserve}`}
              icon={<Bus size={22} />}
              badge={{
                text: `${data.fleetSummary.inTransit} ${isTa ? 'பயணத்தில்' : 'In Transit'}`,
                variant: 'info'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'இன்றைய திட்டமிட்ட புறப்பாடுகள்' : 'Scheduled Departures'}
              value={data.departures.length}
              subtitle={isTa ? `தாமதமான புறப்பாடுகள்: ${data.departures.filter((d) => d.isDelayed).length}` : `Delayed: ${data.departures.filter((d) => d.isDelayed).length}`}
              icon={<Clock size={22} />}
              badge={{
                text: `${data.departures.filter((d) => d.status === 'COMPLETED').length} ${isTa ? 'நிறைவு' : 'Completed'}`,
                variant: 'success'
              }}
            />

            <DashboardKpiCard
              title={isTa ? 'ஓட்டுநர்கள் இருப்பு' : 'Driver Staff Availability'}
              value={`${data.staffSummary.availableDrivers} / ${data.staffSummary.totalDrivers}`}
              subtitle={isTa ? `பணியில்: ${data.staffSummary.assignedDrivers} • விடுப்பில்: ${data.staffSummary.onLeaveDrivers}` : `Assigned: ${data.staffSummary.assignedDrivers} • On Leave: ${data.staffSummary.onLeaveDrivers}`}
              icon={<UserCheck size={22} />}
              badge={{ text: isTa ? 'தயார்' : 'Roster Active', variant: 'success' }}
            />

            <DashboardKpiCard
              title={isTa ? 'டிக்கெட் & ஜிபிஎஸ் கருவிகள்' : 'ETMs & Trackers Online'}
              value={`${data.devicesSummary.onlineEtms} ETMs`}
              subtitle={isTa ? `ஜிபிஎஸ்: ${data.devicesSummary.onlineGpsTrackers} • பேட்டரி குறைவு: ${data.devicesSummary.lowBatteryEtms}` : `GPS Trackers: ${data.devicesSummary.onlineGpsTrackers} • Low Battery: ${data.devicesSummary.lowBatteryEtms}`}
              icon={<Cpu size={22} />}
              badge={{ text: isTa ? 'சாதனங்கள் நன்று' : 'Devices Healthy', variant: 'neutral' }}
            />
          </section>

          {/* 2. Scheduled Departures & Assignment Table */}
          <section className="op-table-section">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} className="text-teal" />
                <div>
                  <h3 className="table-title">
                    {isTa ? 'பயண புறப்பாடுகள் மற்றும் வாகன ஒதுக்கீடு' : 'Active Scheduled Departures & Roster Assignment'}
                  </h3>
                  <p className="table-subtitle">
                    {isTa ? 'பயணங்களுக்கு பேருந்து, ஓட்டுநர் மற்றும் நடத்துநர்களை ஒதுக்குங்கள்' : 'Verify duty assignments and assign buses or certified crew to departures'}
                  </p>
                </div>
              </div>
            </div>

            <div className="op-table-container">
              <table className="op-data-table">
                <thead>
                  <tr>
                    <th>{isTa ? 'பயண குறியீடு' : 'Trip Code'}</th>
                    <th>{isTa ? 'வழித்தடம்' : 'Route'}</th>
                    <th>{isTa ? 'புறப்பாடு / வருகை' : 'Dep / Arr'}</th>
                    <th>{isTa ? 'ஒதுக்கப்பட்ட பேருந்து' : 'Assigned Bus'}</th>
                    <th>{isTa ? 'ஓட்டுநர் & நடத்துநர்' : 'Driver & Conductor'}</th>
                    <th>{isTa ? 'நிலை' : 'Status'}</th>
                    <th>{isTa ? 'செயல்பாடு' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.departures.map((trip) => (
                    <tr key={trip.id} className={trip.isDelayed ? 'row-delayed' : ''}>
                      <td>
                        <span className="code-badge">{trip.tripCode}</span>
                      </td>
                      <td>
                        <strong>{trip.routeNumber}</strong>
                        <div className="text-xs text-muted">{trip.origin} → {trip.destination}</div>
                      </td>
                      <td>
                        <strong>{trip.departureTime}</strong> - {trip.arrivalTime}
                        {trip.isDelayed && (
                          <div className="text-xs text-alert font-bold">
                            +{trip.delayMins}m {isTa ? 'தாமதம்' : 'delay'}
                          </div>
                        )}
                      </td>
                      <td>
                        {trip.assignedBusNumber ? (
                          <span className="status-badge success">{trip.assignedBusNumber}</span>
                        ) : (
                          <span className="status-badge alert">{isTa ? 'ஒதுக்கப்படவில்லை' : 'Unassigned'}</span>
                        )}
                      </td>
                      <td>
                        <div className="text-xs">
                          <div><strong>{isTa ? 'ஓ:' : 'D:'}</strong> {trip.assignedDriverName || (isTa ? 'இல்லை' : 'None')}</div>
                          <div><strong>{isTa ? 'ந:' : 'C:'}</strong> {trip.assignedConductorName || (isTa ? 'இல்லை' : 'None')}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${trip.status === 'IN_TRANSIT' ? 'info' : trip.status === 'COMPLETED' ? 'success' : 'neutral'}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="op-table-action-btn"
                          onClick={() => {
                            setSelectedTrip(trip);
                            setIsAssignmentModalOpen(true);
                          }}
                          data-testid={`assign-trip-${trip.tripCode.toLowerCase()}`}
                        >
                          <PlusCircle size={13} />
                          <span>{isTa ? 'ஒதுக்கு' : 'Assign'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Depot Assigned Fleet Roster */}
          <section className="op-table-section">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bus size={20} className="text-teal" />
                <div>
                  <h3 className="table-title">
                    {isTa ? 'பணிமனைப் பேருந்துகளின் நேரலை நிலை' : 'Depot Bus Fleet & Telemetry Health'}
                  </h3>
                  <p className="table-subtitle">
                    {isTa ? 'ஜிபிஎஸ் சிக்னல் தரம் மற்றும் இருப்பு வாகன விவரங்கள்' : 'GPS telemetry freshness and operational readiness per vehicle'}
                  </p>
                </div>
              </div>
            </div>

            <div className="op-table-container">
              <table className="op-data-table">
                <thead>
                  <tr>
                    <th>{isTa ? 'பதிவு எண்' : 'Reg Number'}</th>
                    <th>{isTa ? 'வாகன மாதிரி' : 'Vehicle Type'}</th>
                    <th>{isTa ? 'நிலை' : 'Status'}</th>
                    <th>{isTa ? 'இருப்புப் பேருந்து' : 'Reserve'}</th>
                    <th>{isTa ? 'தற்போதைய பயணம்' : 'Current Trip'}</th>
                    <th>{isTa ? 'ஜிபிஎஸ் நிலை' : 'GPS Freshness'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buses.map((bus) => (
                    <tr key={bus.id}>
                      <td>
                        <strong>{bus.registrationNumber}</strong>
                        <div className="text-xs text-muted">{bus.fleetNumber}</div>
                      </td>
                      <td>{bus.vehicleType.replace(/_/g, ' ')}</td>
                      <td>
                        <span className={`status-badge ${bus.status === 'IN_SERVICE' ? 'success' : bus.status === 'MAINTENANCE' ? 'alert' : 'neutral'}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td>
                        {bus.isReserve ? (
                          <span className="status-badge warning">{isTa ? 'இருப்பு' : 'Reserve'}</span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {bus.currentTripCode ? (
                          <span className="code-badge">{bus.currentTripCode}</span>
                        ) : (
                          <span className="text-muted text-xs">{isTa ? 'பயணமில்லை' : 'Idle'}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${bus.gpsFreshness === 'CONNECTED' ? 'success' : bus.gpsFreshness === 'STALE' ? 'warning' : 'neutral'}`}>
                          <Radio size={11} style={{ marginRight: '4px' }} />
                          {bus.gpsFreshness}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {/* Trip Assignment Modal */}
      {data && (
        <TripAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setSelectedTrip(null);
          }}
          trip={selectedTrip}
          availableBuses={data.buses.filter((b) => b.status === 'IN_SERVICE' || b.status === 'AVAILABLE')}
          availableDrivers={[]}
          availableConductors={[]}
          onAssignmentSuccess={fetchDashboardData}
        />
      )}

      {/* CSV Export Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        depotId={data?.depot?.id}
      />
    </div>
  );
};

