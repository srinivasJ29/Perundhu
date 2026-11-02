import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Bus,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  Play,
  CheckSquare,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  History
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';
import { DriverDashboardData } from '../../../types/domain';
import '../styles/operations-dashboards.css';

export const DriverDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [data, setData] = useState<DriverDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDriverData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await operationsService.getDriverDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load driver duty roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = isTa
      ? 'ஓட்டுநர் பணித் தளம் — PERUNDHU'
      : 'Driver Duty Console — PERUNDHU';

    fetchDriverData();
  }, [isTa]);

  // Action Handlers
  const handleConfirmReady = async () => {
    if (!data?.activeTrip) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      await operationsService.driverConfirmReady(data.activeTrip.id);
      setActionSuccess(isTa ? 'பயணத் தயார்நிலை உறுதிப்படுத்தப்பட்டது!' : 'Pre-trip readiness confirmed!');
      await fetchDriverData();
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm readiness');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!data?.activeTrip) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      await operationsService.driverStartTrip(data.activeTrip.id);
      setActionSuccess(isTa ? 'பயணம் தொடங்கப்பட்டது! பாதுகாப்புடன் இயக்கவும்.' : 'Trip started! Drive safely.');
      await fetchDriverData();
    } catch (err: any) {
      setError(err?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!data?.activeTrip) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      await operationsService.driverCompleteTrip(data.activeTrip.id);
      setActionSuccess(isTa ? 'பயணம் வெற்றிகரமாக நிறைவு செய்யப்பட்டது!' : 'Trip successfully completed!');
      await fetchDriverData();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="driver-portal-wrapper">
      {/* Mobile Top Header */}
      <header className="driver-header">
        <div className="driver-header-inner">
          <div className="driver-profile-pill">
            <UserCheck size={18} className="text-teal" />
            <div>
              <div className="driver-name">{data?.driver.fullName || (isTa ? 'ஓட்டுநர்' : 'Driver')}</div>
              <div className="driver-badge">{data?.driver.badgeNumber} • {data?.driver.depotName}</div>
            </div>
          </div>

          <button
            type="button"
            className="driver-refresh-btn"
            onClick={fetchDriverData}
            title={isTa ? 'புதுப்பி' : 'Refresh'}
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="driver-main-container">
        {isLoading && (
          <div className="op-loading-state" role="status">
            <div className="op-spinner" />
            <span>{isTa ? 'ஓட்டுநர் பணி விவரங்கள் சரிபார்க்கப்படுகின்றன...' : 'Verifying driver schedule and bus assignment...'}</span>
          </div>
        )}

        {error && (
          <div className="op-error-banner" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>{isTa ? 'பணி ஒதுக்கீட்டுப் பிழை' : 'Roster Notice'}</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="driver-success-banner" role="status">
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* 1. Assigned Bus Card */}
            <section className="driver-card bus-card">
              <div className="driver-card-header">
                <span className="driver-card-tag">
                  <Bus size={14} />
                  <span>{isTa ? 'ஒதுக்கப்பட்ட அரசுப் பேருந்து' : 'Assigned Government Bus'}</span>
                </span>
                {data.assignedBus ? (
                  <span className="status-badge success">{isTa ? 'தயார்' : 'Assigned'}</span>
                ) : (
                  <span className="status-badge warning">{isTa ? 'ஒதுக்கீடில்லை' : 'Pending'}</span>
                )}
              </div>

              {data.assignedBus ? (
                <div className="driver-bus-details">
                  <div className="driver-bus-reg">{data.assignedBus.registrationNumber}</div>
                  <div className="driver-bus-fleet">{data.assignedBus.fleetNumber} • {data.assignedBus.vehicleType.replace(/_/g, ' ')}</div>
                  <div className="driver-bus-livery">{data.assignedBus.livery}</div>
                </div>
              ) : (
                <p className="text-muted text-sm" style={{ margin: '8px 0 0' }}>
                  {isTa ? 'இன்று உங்களுக்கான பேருந்து பணிமனையால் இன்னும் ஒதுக்கப்படவில்லை.' : 'No bus has been assigned by depot manager for this shift yet.'}
                </p>
              )}
            </section>

            {/* 2. Active Scheduled Trip Card */}
            {data.activeTrip ? (
              <section className="driver-card trip-card">
                <div className="driver-card-header">
                  <span className="driver-card-tag info">
                    <Clock size={14} />
                    <span>{isTa ? 'இன்றைய திட்டமிட்ட பயணம்' : 'Active Scheduled Trip'}</span>
                  </span>
                  <span className={`status-badge ${data.activeTrip.status === 'IN_TRANSIT' ? 'info' : 'success'}`}>
                    {data.activeTrip.status}
                  </span>
                </div>

                <div className="driver-trip-body">
                  <div className="trip-route-badge">
                    <span>{isTa ? 'வழித்தடம்' : 'Route'}</span>
                    <strong>{data.activeTrip.routeNumber}</strong>
                  </div>

                  <div className="trip-corridor-path">
                    <div className="corridor-stop origin">
                      <span className="dot dot-teal" />
                      <div>
                        <div className="stop-role">{isTa ? 'புறப்படும் இடம்' : 'Departure'} ({data.activeTrip.departureTime})</div>
                        <div className="stop-name">{data.activeTrip.originStopName}</div>
                      </div>
                    </div>

                    <div className="corridor-line" />

                    <div className="corridor-stop destination">
                      <span className="dot dot-gold" />
                      <div>
                        <div className="stop-role">{isTa ? 'சேருமிடம்' : 'Arrival'} ({data.activeTrip.arrivalTime})</div>
                        <div className="stop-name">{data.activeTrip.destinationStopName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Status Strip (Read-Only) */}
                  <div className="driver-telemetry-strip">
                    <div className="telem-item">
                      <Radio size={14} className="text-teal" />
                      <span>{isTa ? 'ஜிபிஎஸ் சிக்னல்:' : 'GPS Fix:'} <strong>{data.activeTrip.gpsStatus.connected ? (isTa ? 'இணைக்கப்பட்டுள்ளது' : 'Connected') : 'Offline'}</strong></span>
                    </div>
                    <div className="telem-item">
                      <ShieldCheck size={14} className="text-teal" />
                      <span>{isTa ? 'நடத்துநர்:' : 'Conductor:'} <strong>{data.activeTrip.etmStatus.conductorName || (isTa ? 'இணைக்கப்படவில்லை' : 'Not paired')}</strong></span>
                    </div>
                  </div>

                  {/* 3. Action Lifecycle Buttons */}
                  <div className="driver-actions-container">
                    {!data.activeTrip.isReady && data.activeTrip.status === 'SCHEDULED' && (
                      <button
                        type="button"
                        className="driver-action-btn ready"
                        onClick={handleConfirmReady}
                        disabled={actionLoading}
                        data-testid="driver-confirm-ready-btn"
                      >
                        <CheckSquare size={20} />
                        <span>{actionLoading ? (isTa ? 'உறுதிப்படுத்துகிறது...' : 'Confirming...') : (isTa ? 'பயணத் தயார்நிலையை உறுதிசெய்' : '1. Confirm Pre-Trip Readiness')}</span>
                      </button>
                    )}

                    {data.activeTrip.isReady && data.activeTrip.status === 'SCHEDULED' && (
                      <button
                        type="button"
                        className="driver-action-btn start"
                        onClick={handleStartTrip}
                        disabled={actionLoading}
                        data-testid="driver-start-trip-btn"
                      >
                        <Play size={20} />
                        <span>{actionLoading ? (isTa ? 'தொடங்குகிறது...' : 'Starting...') : (isTa ? '2. பயணத்தைத் தொடங்கு' : '2. Start Trip Now')}</span>
                      </button>
                    )}

                    {data.activeTrip.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        className="driver-action-btn complete"
                        onClick={handleCompleteTrip}
                        disabled={actionLoading}
                        data-testid="driver-complete-trip-btn"
                      >
                        <CheckCircle2 size={20} />
                        <span>{actionLoading ? (isTa ? 'நிறைவு செய்கிறது...' : 'Completing...') : (isTa ? '3. பயண நிறைவை உறுதிசெய்' : '3. Complete Trip (Arrival)')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordered Stop List Timeline */}
                <div className="driver-stops-timeline">
                  <h4 className="stops-title">
                    <MapPin size={16} className="text-teal" />
                    <span>{isTa ? 'வழித்தட நிறுத்தங்கள் வரிசை' : 'Ordered Route Stops'}</span>
                  </h4>

                  <ol className="stops-sequence-list">
                    {data.activeTrip.orderedStops.map((stop) => (
                      <li key={stop.stopId} className={`stop-seq-item ${stop.isPassed ? 'passed' : ''}`}>
                        <span className="stop-index">{stop.sequence}</span>
                        <div className="stop-info">
                          <span className="stop-title">{isTa ? stop.nameTa : stop.nameEn}</span>
                          <span className="stop-sched">{stop.scheduledTime}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            ) : (
              <div className="driver-card empty-card">
                <CheckCircle2 size={32} className="text-teal" />
                <h3>{isTa ? 'தற்போது திட்டமிட்ட பயணங்கள் இல்லை' : 'No Active Trip Scheduled'}</h3>
                <p>{isTa ? 'அடுத்த பயண ஒதுக்கீட்டிற்குப் பணிமனைப் பொறுப்பாளரை அணுகவும்.' : 'Check back shortly or verify duty schedule with depot dispatcher.'}</p>
              </div>
            )}

            {/* Recent Trips History */}
            {data.recentTrips.length > 0 && (
              <section className="driver-card history-card">
                <h4 className="stops-title">
                  <History size={16} className="text-teal" />
                  <span>{isTa ? 'சமீபத்தில் முடித்த பயணங்கள்' : 'Recent Completed Trips'}</span>
                </h4>
                <div className="history-list">
                  {data.recentTrips.map((hist) => (
                    <div key={hist.id} className="history-item">
                      <div>
                        <strong>{hist.tripCode}</strong> • {isTa ? 'வழித்தடம்' : 'Route'} {hist.routeNumber}
                        <div className="text-xs text-muted">{hist.departureTime} - {hist.arrivalTime}</div>
                      </div>
                      <span className="status-badge success">{hist.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

