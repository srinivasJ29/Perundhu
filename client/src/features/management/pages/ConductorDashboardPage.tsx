import React, { useState, useEffect } from 'react';
import {
  Users,
  Bus,
  MapPin,
  Clock,
  Cpu,
  ShieldAlert,
  Battery,
  Radio,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';
import { ConductorDashboardData } from '../../../types/domain';
import '../styles/operations-dashboards.css';

export const ConductorDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [data, setData] = useState<ConductorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConductorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await operationsService.getConductorDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conductor duty details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = isTa
      ? 'நடத்துநர் பணித் தளம் — PERUNDHU'
      : 'Conductor Duty Console — PERUNDHU';

    fetchConductorData();
  }, [isTa]);

  return (
    <div className="driver-portal-wrapper">
      {/* Mobile Top Header */}
      <header className="driver-header">
        <div className="driver-header-inner">
          <div className="driver-profile-pill">
            <Users size={18} className="text-teal" />
            <div>
              <div className="driver-name">{data?.conductor.fullName || (isTa ? 'நடத்துநர்' : 'Conductor')}</div>
              <div className="driver-badge">{data?.conductor.badgeNumber} • {data?.conductor.depotName}</div>
            </div>
          </div>

          <button
            type="button"
            className="driver-refresh-btn"
            onClick={fetchConductorData}
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
            <span>{isTa ? 'நடத்துநர் பணி மற்றும் ETM கருவி சரிபார்க்கப்படுகிறது...' : 'Verifying conductor assignment and paired ETM terminal...'}</span>
          </div>
        )}

        {error && (
          <div className="op-error-banner" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>{isTa ? 'பணி ஒதுக்கீட்டுப் பிழை' : 'Duty Notice'}</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* 1. Paired ETM Device Card with Battery & Live Status */}
            <section className="driver-card etm-card">
              <div className="driver-card-header">
                <span className="driver-card-tag info">
                  <Cpu size={14} />
                  <span>{isTa ? 'இணைக்கப்பட்ட ETM டிக்கெட் இயந்திரம்' : 'Paired Electronic Ticket Machine (ETM)'}</span>
                </span>
                <span className="status-badge success">
                  <Radio size={11} style={{ marginRight: '4px' }} />
                  {data.etmDevice.connectionStatus}
                </span>
              </div>

              <div className="etm-details-grid">
                <div>
                  <div className="text-xs text-muted">{isTa ? 'சாதன மாதிரி:' : 'Model:'}</div>
                  <strong>{data.etmDevice.deviceModel}</strong>
                  <div className="text-xs font-mono text-muted">{data.etmDevice.deviceId}</div>
                </div>

                <div className="etm-battery-box">
                  <Battery size={18} className="text-teal" />
                  <span><strong>{data.etmDevice.batteryLevelPercent}%</strong></span>
                </div>
              </div>

              {/* Data Integrity Notice: Clearly shows ETM passenger telemetry is pending live integration */}
              <div className="etm-integrity-notice" data-testid="etm-telemetry-notice">
                <ShieldAlert size={16} className="text-warning flex-shrink-0" />
                <span>{data.etmDevice.telemetryNotice}</span>
              </div>
            </section>

            {/* 2. Assigned Trip Details & Fare Stages */}
            {data.assignedTrip ? (
              <section className="driver-card trip-card">
                <div className="driver-card-header">
                  <span className="driver-card-tag">
                    <Clock size={14} />
                    <span>{isTa ? 'தற்போதைய திட்டமிட்ட பயணம்' : 'Assigned Trip & Fare Stages'}</span>
                  </span>
                  <span className={`status-badge ${data.assignedTrip.status === 'IN_TRANSIT' ? 'info' : 'success'}`}>
                    {data.assignedTrip.status}
                  </span>
                </div>

                <div className="driver-trip-body">
                  <div className="trip-route-badge">
                    <span>{isTa ? 'வழித்தடம்' : 'Route'}</span>
                    <strong>{data.assignedTrip.routeNumber}</strong>
                  </div>

                  <div className="trip-corridor-path">
                    <div className="corridor-stop origin">
                      <span className="dot dot-teal" />
                      <div>
                        <div className="stop-role">{isTa ? 'தொடக்க இடம்' : 'Origin'} ({data.assignedTrip.departureTime})</div>
                        <div className="stop-name">{data.assignedTrip.originStopName}</div>
                      </div>
                    </div>

                    <div className="corridor-line" />

                    <div className="corridor-stop destination">
                      <span className="dot dot-gold" />
                      <div>
                        <div className="stop-role">{isTa ? 'சேருமிடம்' : 'Destination'} ({data.assignedTrip.arrivalTime})</div>
                        <div className="stop-name">{data.assignedTrip.destinationStopName}</div>
                      </div>
                    </div>
                  </div>

                  {data.assignedTrip.busRegistration && (
                    <div className="assigned-bus-strip">
                      <Bus size={14} className="text-teal" />
                      <span>{isTa ? 'பேருந்து எண்:' : 'Bus:'} <strong>{data.assignedTrip.busRegistration}</strong></span>
                    </div>
                  )}
                </div>

                {/* Ordered Stops & Fare Stage List */}
                <div className="driver-stops-timeline">
                  <h4 className="stops-title">
                    <MapPin size={16} className="text-teal" />
                    <span>{isTa ? 'கட்டணக் கட்டங்கள் & நிறுத்தங்கள்' : 'Fare Stages & Route Stops'}</span>
                  </h4>

                  <ol className="stops-sequence-list">
                    {data.assignedTrip.orderedStops.map((stop) => (
                      <li key={stop.stopId} className="stop-seq-item">
                        <span className="stop-index">{stop.sequence}</span>
                        <div className="stop-info">
                          <span className="stop-title">{isTa ? stop.nameTa : stop.nameEn}</span>
                          <span className="stop-sched">{stop.scheduledTime}</span>
                        </div>
                        {stop.fareStage && (
                          <span className="fare-stage-tag">{stop.fareStage}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            ) : (
              <div className="driver-card empty-card">
                <CheckCircle2 size={32} className="text-teal" />
                <h3>{isTa ? 'தற்போது திட்டமிட்ட பயணங்கள் இல்லை' : 'No Active Trip Assigned'}</h3>
                <p>{isTa ? 'அடுத்த பயணப் புறப்பாட்டிற்குப் பணிமனைப் பொறுப்பாளரை அணுகவும்.' : 'Check back with your depot dispatcher for your next scheduled service.'}</p>
              </div>
            )}

            {/* Operational Notices */}
            {data.operationalNotices.length > 0 && (
              <section className="driver-card notice-card">
                <h4 className="stops-title">
                  <FileText size={16} className="text-teal" />
                  <span>{isTa ? 'நடத்துநர் சேவை அறிவிப்புகள்' : 'Conductor Service Advisories'}</span>
                </h4>
                <div className="notices-list">
                  {data.operationalNotices.map((n) => (
                    <div key={n.id} className="notice-item">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
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

