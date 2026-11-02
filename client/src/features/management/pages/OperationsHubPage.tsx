import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building2,
  Wrench,
  ArrowLeftRight,
  Navigation,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { managementService, OperationalStatsDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const OperationsHubPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [stats, setStats] = useState<OperationalStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await managementService.getGlobalStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load operational statistics');
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
              {isTa ? 'போக்குவரத்து செயல்பாட்டு மையம்' : 'Transit Operations Hub'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'பணிமனைகள், ரிசர்வ் கடற்படை, பட்டறைகள் மற்றும் இடமாற்றங்களின் நேரலை மேலாண்மை'
                : 'Real-time monitoring of depots, backup relationships, reserve fleet, workshops, and transfers'}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="mgmt-stats-grid">
        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'மொத்த பேருந்துகள்' : 'Total Fleet'}</span>
            <div className="mgmt-stat-icon"><Bus size={18} /></div>
          </div>
          <div className="mgmt-stat-value">{isLoading ? '...' : stats?.fleet.totalRegisteredBuses ?? 0}</div>
          <div className="mgmt-stat-desc">{isTa ? 'பதிவு செய்யப்பட்ட மொத்த பேருந்துகள்' : 'All registered fleet vehicles'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'நேரலை சேவையில்' : 'In Active Service'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#166534' }}>
            {isLoading ? '...' : stats?.fleet.busesInService ?? 0}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'தற்போது வழித்தடத்தில் இயங்குபவை' : 'Buses currently operating on trips'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'தயார் நிலையில்' : 'Ready for Dispatch'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#FEF08A', color: '#854D0E' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value">
            {isLoading ? '...' : stats?.fleet.availableBuses ?? 0}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'பயணங்களுக்கு உடனடியாக தயாராக உள்ளவை' : 'Available for immediate assignment'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'ரிசர்வ் கடற்படை' : 'Reserve Fleet'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#6B21A8' }}>
            {isLoading ? '...' : stats?.fleet.reserveBuses ?? 0}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'அவசர மாற்றீட்டிற்கு ஒதுக்கப்பட்டவை' : 'Designated backup / reserve buses'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'பராமரிப்பில்' : 'Under Maintenance'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <Wrench size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#92400E' }}>
            {isLoading ? '...' : (stats?.fleet.busesUnderMaintenance ?? 0) + (stats?.fleet.breakdownBuses ?? 0)}
          </div>
          <div className="mgmt-stat-desc">
            {isTa
              ? `${stats?.fleet.breakdownBuses ?? 0} பழுதானவை + ${stats?.fleet.busesUnderMaintenance ?? 0} ஆய்வில்`
              : `${stats?.fleet.breakdownBuses ?? 0} breakdown + ${stats?.fleet.busesUnderMaintenance ?? 0} scheduled`}
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'நடப்பு இடமாற்றங்கள்' : 'Active Transfers'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#3730A3' }}>
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#3730A3' }}>
            {isLoading ? '...' : stats?.operations.activeTransfers ?? 0}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'பணிமனை இடமாற்ற விண்ணப்பங்கள்' : 'Ongoing inter-depot transfers'}</div>
        </div>
      </div>

      {/* Quick Action Navigation Modules */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '32px', marginBottom: '16px' }}>
        {isTa ? 'செயல்பாட்டு தொகுதிகள்' : 'Operations Modules'}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}
      >
        <Link
          to="/operations/depots"
          style={{
            textDecoration: 'none',
            background: 'var(--color-white)',
            border: '1px solid var(--color-cream-300)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
          className="hover:border-yellow-400"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="mgmt-stat-icon"><Building2 size={20} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                {isTa ? 'பணிமனை மேலாண்மை' : 'Depots Management'}
              </h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {stats?.operations.totalDepots ?? 0} {isTa ? 'பணிமனைகள்' : 'Depots'}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
            {isTa
              ? 'முதன்மை, இரண்டாம் நிலை மற்றும் காப்பு பணிமனைகள், கொள்ளளவு, பணியாளர் நிலை.'
              : 'Primary, secondary, and backup depot nodes with capacity tracking and bus stand links.'}
          </p>
        </Link>

        <Link
          to="/operations/reserve-fleet"
          style={{
            textDecoration: 'none',
            background: 'var(--color-white)',
            border: '1px solid var(--color-cream-300)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#FEF08A' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                {isTa ? 'ரிசர்வ் கடற்படை தயார்நிலை' : 'Reserve Fleet Dispatch'}
              </h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {stats?.fleet.reserveBuses ?? 0} {isTa ? 'பேருந்துகள்' : 'Buses'}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
            {isTa
              ? 'அவசர மாற்றீட்டிற்கான பேருந்து தயார்நிலை, ஜிபிஎஸ் & இடிஎம் சாதன நிலைகள்.'
              : 'Emergency fleet readiness, trip conflict verification, and rapid replacement status.'}
          </p>
        </Link>

        <Link
          to="/operations/workshops"
          style={{
            textDecoration: 'none',
            background: 'var(--color-white)',
            border: '1px solid var(--color-cream-300)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#FEF3C7' }}>
              <Wrench size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                {isTa ? 'பணிமனைப் பட்டறைகள்' : 'Maintenance Workshops'}
              </h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {stats?.workshops.activeWorkshops ?? 0} {isTa ? 'பட்டறைகள்' : 'Workshops'}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
            {isTa
              ? 'பராமரிப்பு தளங்கள், என்ஜின் சீரமைப்பு, டயர் ரி-டிரெடிங் மற்றும் பணிச்சுமை.'
              : 'Depot pit lanes and regional workshops, bay occupancy, and maintenance capabilities.'}
          </p>
        </Link>

        <Link
          to="/operations/bus-stands"
          style={{
            textDecoration: 'none',
            background: 'var(--color-white)',
            border: '1px solid var(--color-cream-300)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="mgmt-stat-icon">
              <Navigation size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                {isTa ? 'பேருந்து நிலையங்கள்' : 'Bus Stands & Terminals'}
              </h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {isTa ? 'முனையங்கள் & நடைமேடைகள்' : 'Terminals & Platforms'}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
            {isTa
              ? 'பேருந்து நிலையங்கள், நடைமேடைகள், புவியியல் ஆயத்தொலைவுகள், வழித்தட இணைப்புகள்.'
              : 'Intercity and mofussil terminals, platform assignments, and geo-coordinates.'}
          </p>
        </Link>

        <Link
          to="/operations/transfers"
          style={{
            textDecoration: 'none',
            background: 'var(--color-white)',
            border: '1px solid var(--color-cream-300)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#E0E7FF' }}>
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                {isTa ? 'பணிமனை இடமாற்றங்கள்' : 'Depot Transfers'}
              </h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {stats?.operations.activeTransfers ?? 0} {isTa ? 'நிலுவையில்' : 'Active'}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
            {isTa
              ? 'பணிமனைகளுக்கு இடையிலான பேருந்து இடமாற்ற விண்ணப்பங்கள், ஒப்புதல்கள், போக்குவரத்து நிலை.'
              : 'Inter-depot transfer requests, lifecycle state machine, and atomic fleet reassignment.'}
          </p>
        </Link>
      </div>
    </div>
  );
};

