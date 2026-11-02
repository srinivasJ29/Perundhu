import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  managementService,
  ReserveBusDto,
  DepotDto
} from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const ReserveFleetPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [buses, setBuses] = useState<ReserveBusDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [targetBus, setTargetBus] = useState<ReserveBusDto | null>(null);
  const [newReserveState, setNewReserveState] = useState<boolean>(true);
  const [reserveReason, setReserveReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchReserveFleet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDepotId) params.depotId = selectedDepotId;
      if (availabilityFilter === 'AVAILABLE') params.isAvailableOnly = true;

      const [res, depotsRes] = await Promise.all([
        managementService.getReserveFleet(params),
        managementService.listDepots()
      ]);

      let items = res.data || [];
      if (availabilityFilter === 'UNAVAILABLE') {
        items = items.filter((b: ReserveBusDto) => !b.isAvailableForDispatch);
      }
      setBuses(items);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setDepots(depotsRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reserve fleet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReserveFleet();
  }, [selectedDepotId, availabilityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReserveFleet();
  };

  const handleOpenToggleModal = (bus: ReserveBusDto) => {
    setTargetBus(bus);
    setNewReserveState(!bus.isReserveFleet);
    setReserveReason('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBus) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      await managementService.setBusReserveStatus(targetBus._id, newReserveState, reserveReason.trim() || undefined);
      setIsModalOpen(false);
      fetchReserveFleet();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update reserve status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCount = buses.filter(b => b.isAvailableForDispatch).length;
  const unavailableCount = buses.filter(b => !b.isAvailableForDispatch).length;

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <div>
            <h1 className="mgmt-title font-shining-title">
              {isTa ? 'ரிசர்வ் கடற்படை மேலாண்மை' : 'Reserve Fleet Dispatch'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'அவசர மாற்றீட்டிற்கான பேருந்து தயார்நிலை மற்றும் பணி ஒதுக்கீட்டு ஆய்வு'
                : 'Emergency fleet reserve staging, dispatch eligibility verification, and telematics health'}
            </p>
          </div>
          <button
            onClick={fetchReserveFleet}
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

      {/* KPI mini-cards */}
      <div className="mgmt-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'மொத்த ரிசர்வ் கடற்படை' : 'Total Reserve'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value">{isLoading ? '...' : total}</div>
          <div className="mgmt-stat-desc">{isTa ? 'ஒதுக்கப்பட்ட மொத்த ரிசர்வ் பேருந்துகள்' : 'Staged reserve fleet units'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'உடனடி தயார் நிலையில்' : 'Ready for Dispatch'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#166534' }}>
            {isLoading ? '...' : availableCount}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'பயணங்களில் இல்லாத & நல்ல நிலையிலுள்ளவை' : 'Free from active trips & maintenance'}</div>
        </div>

        <div className="mgmt-stat-card">
          <div className="mgmt-stat-header">
            <span className="mgmt-stat-label">{isTa ? 'பயன்படுத்த இயலாதவை' : 'Currently Ineligible'}</span>
            <div className="mgmt-stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mgmt-stat-value" style={{ color: '#92400E' }}>
            {isLoading ? '...' : unavailableCount}
          </div>
          <div className="mgmt-stat-desc">{isTa ? 'பயணத்தில் அல்லது பராமரிப்பில் உள்ளவை' : 'Operating trips or in workshop repair'}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mgmt-controls-bar">
        <form onSubmit={handleSearchSubmit} className="mgmt-filter-group">
          <input
            type="text"
            className="mgmt-search-input"
            placeholder={isTa ? 'பதிவு அல்லது கடற்படை எண் தேடு...' : 'Search reg or fleet number...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px' }}>
            <Search size={14} />
          </button>
        </form>

        <div className="mgmt-filter-group">
          <select
            className="mgmt-select"
            value={availabilityFilter}
            onChange={e => setAvailabilityFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து தயார்நிலைகள்' : 'All Availability'}</option>
            <option value="AVAILABLE">{isTa ? 'தயார் நிலையில் உள்ளவை மட்டும்' : 'Ready for Dispatch'}</option>
            <option value="UNAVAILABLE">{isTa ? 'பயன்படுத்த இயலாதவை' : 'Currently Unavailable'}</option>
          </select>

          <select
            className="mgmt-select"
            value={selectedDepotId}
            onChange={e => setSelectedDepotId(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து பணிமனைகள்' : 'All Depots'}</option>
            {depots.map(d => (
              <option key={d._id} value={d._id}>
                {d.code} - {isTa ? d.nameTa : d.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="mgmt-table-wrapper">
        <table className="mgmt-table">
          <thead>
            <tr>
              <th>{isTa ? 'பதிவு எண்' : 'Reg Number'}</th>
              <th>{isTa ? 'கடற்படை எண்' : 'Fleet No'}</th>
              <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
              <th>{isTa ? 'வாகன வகை' : 'Vehicle Type'}</th>
              <th>{isTa ? 'தயார்நிலை' : 'Dispatch Readiness'}</th>
              <th>{isTa ? 'சாதனங்கள்' : 'GPS / ETM'}</th>
              <th>{isTa ? 'காரணம் / நிலை' : 'Notes / Status'}</th>
              <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  {isTa ? 'ரிசர்வ் கடற்படை ஏற்றப்படுகிறது...' : 'Loading reserve fleet...'}
                </td>
              </tr>
            ) : buses.length === 0 ? (
              <tr>
                <td colSpan={8} className="mgmt-empty-state">
                  <ShieldAlert size={36} className="mgmt-empty-icon" />
                  <p>{isTa ? 'ரிசர்வ் பேருந்துகள் எதுவும் காணப்படவில்லை' : 'No reserve buses match the criteria'}</p>
                </td>
              </tr>
            ) : (
              buses.map(bus => (
                <tr key={bus._id}>
                  <td style={{ fontWeight: 800, color: '#000' }}>{bus.registrationNumber}</td>
                  <td style={{ fontWeight: 700 }}>{bus.fleetNumber}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{bus.depotId?.nameEn || bus.depotName || 'Depot'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{bus.depotId?.code || ''}</div>
                  </td>
                  <td>{bus.vehicleType}</td>
                  <td>
                    {bus.isAvailableForDispatch ? (
                      <span className="mgmt-pill mgmt-pill-ready">
                        <CheckCircle2 size={12} style={{ marginRight: '3px' }} />
                        {isTa ? 'தயார் நிலை' : 'READY'}
                      </span>
                    ) : (
                      <span className="mgmt-pill mgmt-pill-inactive">
                        <AlertTriangle size={12} style={{ marginRight: '3px' }} />
                        {isTa ? 'தயாரில்லை' : 'UNAVAILABLE'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Radio size={11} color={bus.assignedGpsTrackerId ? '#166534' : '#991B1B'} />
                        <span>GPS: {bus.assignedGpsTrackerId ? 'ONLINE' : 'NONE'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Radio size={11} color={bus.assignedEtmDeviceId ? '#166534' : '#888'} />
                        <span>ETM: {bus.assignedEtmDeviceId ? 'PAIRED' : 'NONE'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {bus.ineligibilityReason ? (
                      <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: 600 }}>
                        {bus.ineligibilityReason}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#166534' }}>
                        {isTa ? 'உடனடி ஒதுக்கீட்டிற்கு தயார்' : 'Clear for dispatch'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenToggleModal(bus)}
                      className="btn btn-outline"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <SlidersHorizontal size={13} style={{ marginRight: '4px' }} />
                      {isTa ? 'மாற்று' : 'Toggle'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Toggle Reserve Status */}
      {isModalOpen && targetBus && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'ரிசர்வ் நிலையை மாற்று' : 'Modify Reserve Fleet Designation'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleToggleSubmit}>
              <div className="mgmt-modal-body">
                {modalError && (
                  <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px' }}>
                    {modalError}
                  </div>
                )}

                <div style={{ background: 'var(--color-bg-subtle)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{targetBus.registrationNumber}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Fleet: {targetBus.fleetNumber} • Depot: {targetBus.depotName}</div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'புதிய ரிசர்வ் நிலை' : 'New Reserve Status *'}</label>
                  <select
                    className="mgmt-select"
                    value={newReserveState ? 'true' : 'false'}
                    onChange={e => setNewReserveState(e.target.value === 'true')}
                  >
                    <option value="true">{isTa ? 'ரிசர்வ் கடற்படையில் சேர் (RESERVE)' : 'Mark as Reserve Fleet'}</option>
                    <option value="false">{isTa ? 'வழக்கமான கடற்படைக்கு மாற்று (REGULAR)' : 'Remove from Reserve Fleet'}</option>
                  </select>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'காரணம் / குறிப்பு' : 'Operational Reason / Note'}</label>
                  <textarea
                    rows={3}
                    placeholder={isTa ? 'எ.கா. அவசர சேவைக்கு தயார்நிலை ஒதுக்கீடு' : 'e.g. Staged for peak morning route relief'}
                    className="mgmt-form-textarea"
                    value={reserveReason}
                    onChange={e => setReserveReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                >
                  {isTa ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'நிலையை உறுதிசெய்' : 'Confirm Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
