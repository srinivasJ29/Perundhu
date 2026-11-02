import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  X
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  managementService,
  WorkshopDto,
  DepotDto
} from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

const AVAILABLE_CAPABILITIES = [
  'ROUTINE_SERVICE',
  'PREVENTIVE_MAINTENANCE',
  'ENGINE_OVERHAUL',
  'TRANSMISSION',
  'ELECTRICAL',
  'HVAC_AC',
  'TYRE_RETREADING',
  'BODY_REPAIR',
  'ACCIDENT_REPAIR'
];

export const WorkshopManagementPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [workshops, setWorkshops] = useState<WorkshopDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Depots for association
  const [depots, setDepots] = useState<DepotDto[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameTa: '',
    organizationId: '',
    depotId: '',
    workshopType: 'DEPOT_PIT_LANE' as 'DEPOT_PIT_LANE' | 'REGIONAL_CENTRAL_WORKSHOP',
    totalBays: 6,
    activeBaysOccupied: 1,
    capabilities: ['ROUTINE_SERVICE', 'PREVENTIVE_MAINTENANCE'],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'FULL_CAPACITY',
    contactPhone: '',
    latitude: 9.9252,
    longitude: 78.1198
  });

  const fetchWorkshops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.workshopType = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const [res, depotsRes] = await Promise.all([
        managementService.listWorkshops(params),
        managementService.listDepots()
      ]);

      setWorkshops(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setDepots(depotsRes.data || []);

      if (depotsRes.data && depotsRes.data.length > 0 && !formData.organizationId) {
        setFormData(prev => ({ ...prev, organizationId: depotsRes.data[0].organizationId }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load workshops');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkshops();
  };

  const handleOpenCreateModal = () => {
    setEditingWorkshop(null);
    setFormData({
      code: '',
      nameEn: '',
      nameTa: '',
      organizationId: depots[0]?.organizationId || '',
      depotId: '',
      workshopType: 'DEPOT_PIT_LANE',
      totalBays: 6,
      activeBaysOccupied: 0,
      capabilities: ['ROUTINE_SERVICE', 'PREVENTIVE_MAINTENANCE'],
      status: 'ACTIVE',
      contactPhone: '',
      latitude: 9.9252,
      longitude: 78.1198
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ws: WorkshopDto) => {
    setEditingWorkshop(ws);
    setFormData({
      code: ws.code,
      nameEn: ws.nameEn,
      nameTa: ws.nameTa,
      organizationId: ws.organizationId,
      depotId: ws.depotId || '',
      workshopType: ws.workshopType,
      totalBays: ws.totalBays,
      activeBaysOccupied: ws.activeBaysOccupied,
      capabilities: ws.capabilities || [],
      status: ws.status,
      contactPhone: ws.contactPhone || '',
      latitude: ws.location.coordinates[1],
      longitude: ws.location.coordinates[0]
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const toggleCapability = (cap: string) => {
    if (formData.capabilities.includes(cap)) {
      setFormData({
        ...formData,
        capabilities: formData.capabilities.filter(c => c !== cap)
      });
    } else {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, cap]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingWorkshop) {
        // Update
        await managementService.updateWorkshop(editingWorkshop._id, {
          nameEn: formData.nameEn.trim(),
          nameTa: formData.nameTa.trim(),
          totalBays: Number(formData.totalBays),
          activeBaysOccupied: Number(formData.activeBaysOccupied),
          capabilities: formData.capabilities,
          status: formData.status,
          contactPhone: formData.contactPhone.trim() || undefined
        });
      } else {
        // Create
        await managementService.createWorkshop({
          code: formData.code.toUpperCase().trim(),
          nameEn: formData.nameEn.trim(),
          nameTa: formData.nameTa.trim(),
          organizationId: formData.organizationId || depots[0]?.organizationId,
          depotId: formData.depotId || undefined,
          workshopType: formData.workshopType,
          location: {
            type: 'Point',
            coordinates: [Number(formData.longitude), Number(formData.latitude)]
          },
          totalBays: Number(formData.totalBays),
          activeBaysOccupied: Number(formData.activeBaysOccupied),
          capabilities: formData.capabilities,
          status: formData.status,
          contactPhone: formData.contactPhone.trim() || undefined
        });
      }

      setIsModalOpen(false);
      fetchWorkshops();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save workshop');
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
              {isTa ? 'பணிமனைப் பட்டறைகள்' : 'Maintenance Workshops'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'பணிமனை மற்றும் மண்டல பட்டறைகளின் பராமரிப்பு தளங்கள், திறன்கள் மற்றும் பணிச்சுமை'
                : 'Depot pit lanes and regional workshops, bay occupancy, and heavy repair capabilities'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய பட்டறை பதிவு' : 'Register Workshop'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {/* Filter bar */}
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
            <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Workshop Types'}</option>
            <option value="DEPOT_PIT_LANE">DEPOT_PIT_LANE (பணிமனை தளம்)</option>
            <option value="REGIONAL_CENTRAL_WORKSHOP">REGIONAL_CENTRAL_WORKSHOP (மண்டல மத்திய பட்டறை)</option>
          </select>

          <select
            className="mgmt-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
            <option value="ACTIVE">{isTa ? 'இயக்கத்தில்' : 'Active'}</option>
            <option value="FULL_CAPACITY">{isTa ? 'முழு கொள்ளளவு' : 'Full Capacity'}</option>
            <option value="INACTIVE">{isTa ? 'செயலற்றது' : 'Inactive'}</option>
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
              <th>{isTa ? 'குறியீடு' : 'Code'}</th>
              <th>{isTa ? 'பட்டறை பெயர்' : 'Workshop Name'}</th>
              <th>{isTa ? 'வகை' : 'Type'}</th>
              <th>{isTa ? 'தள கொள்ளளவு' : 'Bay Occupancy'}</th>
              <th>{isTa ? 'திறன்கள்' : 'Capabilities'}</th>
              <th>{isTa ? 'நிலை' : 'Status'}</th>
              <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  {isTa ? 'பட்டறைகள் ஏற்றப்படுகின்றன...' : 'Loading workshops...'}
                </td>
              </tr>
            ) : workshops.length === 0 ? (
              <tr>
                <td colSpan={7} className="mgmt-empty-state">
                  <Wrench size={36} className="mgmt-empty-icon" />
                  <p>{isTa ? 'பட்டறைகள் எதுவும் காணப்படவில்லை' : 'No workshops found'}</p>
                </td>
              </tr>
            ) : (
              workshops.map(ws => {
                const occupancyPct = Math.round((ws.activeBaysOccupied / ws.totalBays) * 100);
                return (
                  <tr key={ws._id}>
                    <td style={{ fontWeight: 800, color: '#000' }}>{ws.code}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{isTa ? ws.nameTa : ws.nameEn}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{isTa ? ws.nameEn : ws.nameTa}</div>
                    </td>
                    <td>
                      <span className="mgmt-pill mgmt-pill-secondary">
                        {ws.workshopType === 'DEPOT_PIT_LANE' ? 'PIT LANE' : 'REGIONAL CENTRAL'}
                      </span>
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span><strong>{ws.activeBaysOccupied}</strong> / {ws.totalBays} bays</span>
                        <span>{occupancyPct}%</span>
                      </div>
                      <div style={{ background: '#E4E4E7', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            background: occupancyPct >= 90 ? '#DC2626' : occupancyPct >= 70 ? '#F59E0B' : '#10B981',
                            height: '100%',
                            width: `${Math.min(100, occupancyPct)}%`
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                        {(ws.capabilities || []).slice(0, 3).map((cap, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              background: '#F4F4F5',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #E4E4E7'
                            }}
                          >
                            {cap}
                          </span>
                        ))}
                        {(ws.capabilities?.length || 0) > 3 && (
                          <span style={{ fontSize: '10px', color: '#888' }}>
                            +{(ws.capabilities?.length || 0) - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`mgmt-pill ${
                          ws.status === 'ACTIVE'
                            ? 'mgmt-pill-active'
                            : ws.status === 'FULL_CAPACITY'
                            ? 'mgmt-pill-breakdown'
                            : 'mgmt-pill-inactive'
                        }`}
                      >
                        {ws.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditModal(ws)}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Edit2 size={13} style={{ marginRight: '4px' }} />
                        {isTa ? 'திருத்து' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
        {isTa ? `மொத்த பட்டறைகள்: ${total}` : `Total Workshops: ${total}`}
      </div>

      {/* Modal: Create / Edit Workshop */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {editingWorkshop
                  ? (isTa ? 'பட்டறை விவரங்களைத் திருத்து' : 'Edit Workshop Details')
                  : (isTa ? 'புதிய பட்டறை பதிவு' : 'Register New Workshop')}
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

            <form onSubmit={handleSubmit}>
              <div className="mgmt-modal-body">
                {modalError && (
                  <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px' }}>
                    {modalError}
                  </div>
                )}

                {!editingWorkshop && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'குறியீடு' : 'Code *'}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MDU-WS-01"
                        className="mgmt-form-input"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'பட்டறை வகை' : 'Type *'}</label>
                      <select
                        className="mgmt-select"
                        value={formData.workshopType}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            workshopType: e.target.value as any
                          })
                        }
                      >
                        <option value="DEPOT_PIT_LANE">DEPOT_PIT_LANE (பணிமனை தளம்)</option>
                        <option value="REGIONAL_CENTRAL_WORKSHOP">REGIONAL_CENTRAL_WORKSHOP (மத்திய பட்டறை)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஆங்கில பெயர்' : 'Name (English) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Madurai Central Heavy Workshop"
                      className="mgmt-form-input"
                      value={formData.nameEn}
                      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'தமிழ் பெயர்' : 'Name (Tamil) *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. மதுரை மத்திய கனரக பட்டறை"
                      className="mgmt-form-input"
                      value={formData.nameTa}
                      onChange={e => setFormData({ ...formData, nameTa: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'மொத்த தளங்கள்' : 'Total Bays *'}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="mgmt-form-input"
                      value={formData.totalBays}
                      onChange={e => setFormData({ ...formData, totalBays: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஆக்கிரமிக்கப்பட்டவை' : 'Occupied Bays *'}</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="mgmt-form-input"
                      value={formData.activeBaysOccupied}
                      onChange={e => setFormData({ ...formData, activeBaysOccupied: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'நிலை' : 'Status *'}</label>
                    <select
                      className="mgmt-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="FULL_CAPACITY">FULL_CAPACITY</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'பராமரிப்பு திறன்கள்' : 'Capabilities *'}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {AVAILABLE_CAPABILITIES.map(cap => {
                      const isSelected = formData.capabilities.includes(cap);
                      return (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleCapability(cap)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: isSelected ? '1px solid #CA8A04' : '1px solid #D4D4D8',
                            background: isSelected ? '#FEF08A' : '#fff',
                            color: isSelected ? '#854D0E' : '#52525B',
                            cursor: 'pointer'
                          }}
                        >
                          {cap}
                        </button>
                      );
                    })}
                  </div>
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
                  {isSubmitting ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'பட்டறை சேமி' : 'Save Workshop')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
