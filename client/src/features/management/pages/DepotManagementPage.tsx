import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Eye, Power, X } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const DepotManagementPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [primaryDepots, setPrimaryDepots] = useState<DepotDto[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameTa: '',
    organizationId: '',
    depotType: 'PRIMARY' as 'PRIMARY' | 'SECONDARY' | 'BACKUP',
    primaryDepotId: '',
    latitude: 9.9252,
    longitude: 78.1198,
    address: '',
    contactPhone: '',
    totalCapacity: 50,
    serviceBaysCount: 4,
    fuelPumpsAvailable: true
  });

  const fetchDepots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.depotType = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await managementService.listDepots(params);
      setDepots(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);

      // Filter primary depots for the modal dropdown
      const primaries = (res.data || []).filter((d: DepotDto) => d.depotType === 'PRIMARY');
      setPrimaryDepots(primaries);
      if (primaries.length > 0 && !formData.organizationId) {
        setFormData(prev => ({ ...prev, organizationId: primaries[0].organizationId }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load depots');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepots();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDepots();
  };

  const handleToggleStatus = async (depot: DepotDto) => {
    const nextStatus = depot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await managementService.updateDepotStatus(depot._id, nextStatus);
      fetchDepots();
    } catch (err: any) {
      alert(err?.message || 'Failed to update depot status');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (formData.depotType === 'BACKUP' && !formData.primaryDepotId) {
        throw new Error('A backup depot must reference a valid primary depot');
      }

      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        nameEn: formData.nameEn.trim(),
        nameTa: formData.nameTa.trim(),
        organizationId: formData.organizationId || (primaryDepots[0]?.organizationId ?? ''),
        depotType: formData.depotType,
        location: {
          type: 'Point',
          coordinates: [Number(formData.longitude), Number(formData.latitude)]
        },
        address: formData.address.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        totalCapacity: Number(formData.totalCapacity),
        serviceBaysCount: Number(formData.serviceBaysCount),
        fuelPumpsAvailable: Boolean(formData.fuelPumpsAvailable)
      };

      if (formData.depotType === 'BACKUP' && formData.primaryDepotId) {
        payload.primaryDepotId = formData.primaryDepotId;
      }

      await managementService.createDepot(payload);
      setIsModalOpen(false);
      setFormData({
        code: '',
        nameEn: '',
        nameTa: '',
        organizationId: '',
        depotType: 'PRIMARY',
        primaryDepotId: '',
        latitude: 9.9252,
        longitude: 78.1198,
        address: '',
        contactPhone: '',
        totalCapacity: 50,
        serviceBaysCount: 4,
        fuelPumpsAvailable: true
      });
      fetchDepots();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create depot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <div>
            <h1 className="mgmt-title font-shining-title">
              {isTa ? 'பணிமனை மேலாண்மை' : 'Depot Fleet Management'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'முதன்மை, இரண்டாம் நிலை மற்றும் காப்புப் பணிமனைகளின் கட்டமைப்பு'
                : 'Primary, secondary and backup depot nodes, operational status, and fleet allocations'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய பணிமனை சேர்' : 'Register Depot'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {/* Controls / Filter Bar */}
      <div className="mgmt-controls-bar">
        <form onSubmit={handleSearchSubmit} className="mgmt-filter-group">
          <input
            type="text"
            className="mgmt-search-input"
            placeholder={isTa ? 'குறியீடு அல்லது பெயர் தேடு...' : 'Search code or name...'}
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
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Depot Types'}</option>
            <option value="PRIMARY">PRIMARY (முதன்மை)</option>
            <option value="SECONDARY">SECONDARY (இரண்டாம் நிலை)</option>
            <option value="BACKUP">BACKUP (காப்பு பணிமனை)</option>
          </select>

          <select
            className="mgmt-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
            <option value="ACTIVE">{isTa ? 'இயக்கத்தில்' : 'Active'}</option>
            <option value="INACTIVE">{isTa ? 'செயலற்றது' : 'Inactive'}</option>
            <option value="UNDER_MAINTENANCE">{isTa ? 'பராமரிப்பில்' : 'Under Maintenance'}</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Depots Table */}
      <div className="mgmt-table-wrapper">
        <table className="mgmt-table">
          <thead>
            <tr>
              <th>{isTa ? 'குறியீடு' : 'Code'}</th>
              <th>{isTa ? 'பணிமனை பெயர்' : 'Depot Name'}</th>
              <th>{isTa ? 'வகை' : 'Type'}</th>
              <th>{isTa ? 'நிலை' : 'Status'}</th>
              <th>{isTa ? 'கொள்ளளவு' : 'Capacity'}</th>
              <th>{isTa ? 'பராமரிப்பு தளங்கள்' : 'Service Bays'}</th>
              <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்கள்' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  {isTa ? 'பணிமனைகள் ஏற்றப்படுகின்றன...' : 'Loading depots...'}
                </td>
              </tr>
            ) : depots.length === 0 ? (
              <tr>
                <td colSpan={7} className="mgmt-empty-state">
                  <Building2 size={36} className="mgmt-empty-icon" />
                  <p>{isTa ? 'பணிமனைகள் எதுவும் காணப்படவில்லை' : 'No depots found'}</p>
                </td>
              </tr>
            ) : (
              depots.map(depot => (
                <tr key={depot._id}>
                  <td style={{ fontWeight: 800, color: '#000' }}>{depot.code}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{isTa ? depot.nameTa : depot.nameEn}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {isTa ? depot.nameEn : depot.nameTa}
                    </div>
                  </td>
                  <td>
                    <span className={`mgmt-pill mgmt-pill-${depot.depotType.toLowerCase()}`}>
                      {depot.depotType}
                    </span>
                  </td>
                  <td>
                    <span className={`mgmt-pill mgmt-pill-${depot.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {depot.status}
                    </span>
                  </td>
                  <td>{depot.totalCapacity} {isTa ? 'பேருந்துகள்' : 'buses'}</td>
                  <td>{depot.serviceBaysCount} {isTa ? 'தளங்கள்' : 'bays'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/operations/depots/${depot._id}`}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        title={isTa ? 'விவரங்களைக் காண்க' : 'View Details & Fleet'}
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} />
                        {isTa ? 'விவரம்' : 'Details'}
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(depot)}
                        className={`btn ${depot.status === 'ACTIVE' ? 'btn-ghost' : 'btn-secondary'}`}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        title={depot.status === 'ACTIVE' ? 'Deactivate Depot' : 'Activate Depot'}
                      >
                        <Power size={13} style={{ marginRight: '4px' }} />
                        {depot.status === 'ACTIVE' ? (isTa ? 'நிறுத்து' : 'Disable') : (isTa ? 'இயக்கு' : 'Enable')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
        {isTa ? `மொத்த பணிமனைகள்: ${total}` : `Total Depots: ${total}`}
      </div>

      {/* Modal: Register Depot */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'புதிய பணிமனை பதிவு' : 'Register New Depot'}
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

            <form onSubmit={handleCreateSubmit}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'குறியீடு' : 'Depot Code *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MDU-DEP-04"
                      className="mgmt-form-input"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஆங்கில பெயர்' : 'Name (English) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Madurai South Central Depot"
                      className="mgmt-form-input"
                      value={formData.nameEn}
                      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'தமிழ் பெயர்' : 'Name (Tamil) *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. மதுரை தெற்கு மத்திய பணிமனை"
                    className="mgmt-form-input"
                    value={formData.nameTa}
                    onChange={e => setFormData({ ...formData, nameTa: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பணிமனை வகை' : 'Depot Type *'}</label>
                    <select
                      className="mgmt-select"
                      value={formData.depotType}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          depotType: e.target.value as 'PRIMARY' | 'SECONDARY' | 'BACKUP'
                        })
                      }
                    >
                      <option value="PRIMARY">PRIMARY (முதன்மை)</option>
                      <option value="SECONDARY">SECONDARY (இரண்டாம் நிலை)</option>
                      <option value="BACKUP">BACKUP (காப்பு பணிமனை)</option>
                    </select>
                  </div>

                  {formData.depotType === 'BACKUP' && (
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'முதன்மை பணிமனை' : 'Primary Depot Link *'}</label>
                      <select
                        required
                        className="mgmt-select"
                        value={formData.primaryDepotId}
                        onChange={e => setFormData({ ...formData, primaryDepotId: e.target.value })}
                      >
                        <option value="">{isTa ? '-- முதன்மை பணிமனையைத் தேர்ந்தெடு --' : '-- Select Primary Depot --'}</option>
                        {primaryDepots.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.code} - {p.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'அட்சரேகை (Latitude)' : 'Latitude'}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="mgmt-form-input"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'தீர்க்கரேகை (Longitude)' : 'Longitude'}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="mgmt-form-input"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'கொள்ளளவு (பேருந்துகள்)' : 'Capacity (Buses)'}</label>
                    <input
                      type="number"
                      min="1"
                      className="mgmt-form-input"
                      value={formData.totalCapacity}
                      onChange={e => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பராமரிப்பு தளங்கள்' : 'Service Bays'}</label>
                    <input
                      type="number"
                      min="0"
                      className="mgmt-form-input"
                      value={formData.serviceBaysCount}
                      onChange={e => setFormData({ ...formData, serviceBaysCount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'முகவரி' : 'Address'}</label>
                  <input
                    type="text"
                    placeholder="e.g. Bypass Road, Madurai"
                    className="mgmt-form-input"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                  {isSubmitting ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'பணிமனை உருவாக்கு' : 'Create Depot')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
