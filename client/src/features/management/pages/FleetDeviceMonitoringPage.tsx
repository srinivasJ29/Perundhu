import React, { useEffect, useState } from 'react';
import {
  Gauge,
  Bus,
  UserCheck,
  Users,
  Radio,
  Cpu,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  FleetAndDeviceStatsDto
} from '../../../services/api/fleetStaffDevice.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const FleetDeviceMonitoringPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [stats, setStats] = useState<FleetAndDeviceStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fleetStaffDeviceService.getFleetAndDeviceStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load telemetry and operational statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <div>
            <h1 className="mgmt-title font-shining-title">
              {isTa ? 'கடற்படை, பணியாளர்கள் & டெலிமெட்ரி கண்காணிப்பு' : 'Fleet, Crew & Telematics Monitoring'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'நேரலை பேருந்து நிலவரம், ஓட்டுநர்/நடத்துநர் இருப்பு மற்றும் சாதனங்களின் தொடர்பு ஆரோக்கியம்'
                : 'Real-time aggregated health of fleet vehicles, crew availability, ETM telematics, and dedicated GPS trackers'}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {isLoading && !stats ? (
        <div className="mgmt-empty-state">
          <Activity size={36} className="mgmt-empty-icon animate-pulse" />
          <p>{isTa ? 'கண்காணிப்புத் தரவு சேகரிக்கப்படுகிறது...' : 'Aggregating fleet telemetry statistics...'}</p>
        </div>
      ) : stats ? (
        <>
          {/* Section 1: Fleet Readiness */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bus size={20} color="#EAB308" />
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                {isTa ? 'கடற்படை மற்றும் வாகன நிலவரம்' : 'Fleet & Vehicle Operational Status'}
              </h2>
            </div>

            <div className="mgmt-stats-grid">
              <div className="mgmt-stat-card">
                <div className="mgmt-stat-header">
                  <span className="mgmt-stat-label">{isTa ? 'மொத்தப் பேருந்துகள்' : 'Total Fleet'}</span>
                  <Bus size={18} color="#4B5563" />
                </div>
                <div className="mgmt-stat-value font-shining-title">{stats.fleet.total}</div>
                <div className="mgmt-stat-desc">
                  {stats.fleet.withGps} with GPS • {stats.fleet.withEtm} with ETM
                </div>
              </div>

              <div className="mgmt-stat-card">
                <div className="mgmt-stat-header">
                  <span className="mgmt-stat-label">{isTa ? 'சேவையில் உள்ளவை' : 'In Revenue Service'}</span>
                  <CheckCircle2 size={18} color="#166534" />
                </div>
                <div className="mgmt-stat-value" style={{ color: '#166534' }}>{stats.fleet.inService}</div>
                <div className="mgmt-stat-desc">{isTa ? 'பயணிகள் சேவை இயங்குகிறது' : 'Active passenger routes'}</div>
              </div>

              <div className="mgmt-stat-card">
                <div className="mgmt-stat-header">
                  <span className="mgmt-stat-label">{isTa ? 'ரிசர்வ் கடற்படை' : 'Reserve Fleet'}</span>
                  <ShieldCheck size={18} color="#854D0E" />
                </div>
                <div className="mgmt-stat-value" style={{ color: '#854D0E' }}>{stats.fleet.reserveFleet}</div>
                <div className="mgmt-stat-desc">{isTa ? 'அவசர மாற்றத்திற்கு தயார்' : 'Standby for contingencies'}</div>
              </div>

              <div className="mgmt-stat-card">
                <div className="mgmt-stat-header">
                  <span className="mgmt-stat-label">{isTa ? 'பராமரிப்பில்' : 'Under Maintenance'}</span>
                  <AlertTriangle size={18} color="#DC2626" />
                </div>
                <div className="mgmt-stat-value" style={{ color: '#DC2626' }}>{stats.fleet.maintenance}</div>
                <div className="mgmt-stat-desc">{isTa ? 'பணிமனைப் பட்டறைகளில்' : 'In workshop bays'}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Crew Staff Availability */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Users size={20} color="#EAB308" />
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                {isTa ? 'ஓட்டுநர் & நடத்துநர் பணி இருப்பு' : 'Crew Staffing & Shift Availability'}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Drivers Card */}
              <div className="mgmt-card">
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#166534" />
                  <span>{isTa ? 'ஓட்டுநர்கள் இருப்பு' : 'Driver Availability'} ({stats.crew.totalDrivers})</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>{stats.crew.availableDrivers}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'கிடைப்பவர்கள்' : 'Available'}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E40AF' }}>{stats.crew.assignedDrivers}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'ஒதுக்கப்பட்டவர்கள்' : 'Assigned'}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#854D0E' }}>{stats.crew.onDutyDrivers}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'பணியில்' : 'On Duty'}</div>
                  </div>
                </div>
              </div>

              {/* Conductors Card */}
              <div className="mgmt-card">
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#2563EB" />
                  <span>{isTa ? 'நடத்துநர்கள் இருப்பு' : 'Conductor Availability'} ({stats.crew.totalConductors})</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>{stats.crew.availableConductors}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'கிடைப்பவர்கள்' : 'Available'}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E40AF' }}>{stats.crew.assignedConductors}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'ஒதுக்கப்பட்டவர்கள்' : 'Assigned'}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#854D0E' }}>{stats.crew.onDutyConductors}</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 700 }}>{isTa ? 'பணியில்' : 'On Duty'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Telematics & ETM Health */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={20} color="#EAB308" />
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                  {isTa ? 'சாதனத் தொடர்பு ஆரோக்கியம் & ஜிபிஎஸ் நிலை' : 'Device Telemetry Health & GNSS Status'}
                </h2>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} />
                <span>{isTa ? `தொடர்பு வரம்பு: ${stats.devices.communicationThresholdMinutes} நிமிடங்கள்` : `Online Pulse Threshold: ${stats.devices.communicationThresholdMinutes} mins`}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* ETM Telematics Card */}
              <div className="mgmt-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={18} color="#7C3AED" />
                    <span>ETM Ticketing Machines</span>
                  </h3>
                  <span className="mgmt-badge" style={{ backgroundColor: '#F3F4F6', color: '#1F2937', fontWeight: 800 }}>
                    {stats.devices.totalEtms} Devices
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wifi size={14} color="#166534" />
                      <span>{isTa ? 'ஆன்லைனில் உள்ளவை' : 'Active Heartbeat Pulse'}</span>
                    </span>
                    <strong style={{ color: '#166534' }}>{stats.devices.etmsOnline} / {stats.devices.totalEtms}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#166534" />
                      <span>{isTa ? 'ஜிபிஎஸ் உறுதிசெய்யப்பட்டது' : 'Verified GPS Hardware'}</span>
                    </span>
                    <strong style={{ color: '#166534' }}>{stats.devices.etmsWithGpsVerified}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#854D0E" />
                      <span>{isTa ? 'ஜிபிஎஸ் உறுதிசெய்யப்படவில்லை (UNKNOWN)' : 'GPS Unconfirmed (UNKNOWN)'}</span>
                    </span>
                    <strong style={{ color: '#854D0E' }}>{stats.devices.etmsGpsUnknown}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <WifiOff size={14} color="#6B7280" />
                      <span>{isTa ? 'ஜிபிஎஸ் இல்லை' : 'Verified No GPS'}</span>
                    </span>
                    <strong style={{ color: '#6B7280' }}>{stats.devices.etmsGpsUnavailable}</strong>
                  </div>
                </div>
              </div>

              {/* Dedicated GPS Trackers Card */}
              <div className="mgmt-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={18} color="#059669" />
                    <span>Dedicated Vehicle GPS Trackers</span>
                  </h3>
                  <span className="mgmt-badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
                    {stats.devices.totalGpsTrackers} Units
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wifi size={14} color="#166534" />
                      <span>{isTa ? 'நேரலை சிக்னல் அனுப்புபவை' : 'Active Live Pulse'}</span>
                    </span>
                    <strong style={{ color: '#166534' }}>{stats.devices.gpsTrackersOnline} / {stats.devices.totalGpsTrackers}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bus size={14} color="#2563EB" />
                      <span>{isTa ? 'பேருந்துகளில் பொருத்தப்பட்டவை' : 'Mounted on Fleet Buses'}</span>
                    </span>
                    <strong style={{ color: '#2563EB' }}>{stats.devices.installedGpsTrackers}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#166534" />
                      <span>{isTa ? 'ஜிபிஎஸ் நம்பகத்தன்மை' : 'Hardware Telemetry Quality'}</span>
                    </span>
                    <strong style={{ color: '#166534' }}>100% Dedicated GNSS</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

