import React, { useEffect, useState } from 'react';
import {
  Navigation,
  Search,
  Plus,
  Edit2,
  X
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  managementService,
  BusStandManagementDto
} from '../../../services/api/management.service';
import { districtsService } from '../../../services/api/districts.service';
import { DistrictDto } from '../../../types/domain';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const BusStandManagementPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [stands, setStands] = useState<BusStandManagementDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [standTypeFilter, setStandTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [districts, setDistricts] = useState<DistrictDto[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStand, setEditingStand] = useState<BusStandManagementDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    districtId: '',
    code: '',
    nameEn: '',
    nameTa: '',
    standType: 'MOFUSSIL' as 'INTERCITY_TERMINAL' | 'MOFUSSIL' | 'TOWN_STAND',
    totalPlatforms: 12,
    latitude: 9.9252,
    longitude: 78.1198,
    isActive: true
  });

  const fetchStands = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (standTypeFilter) params.standType = standTypeFilter;
      if (statusFilter !== '') params.isActive = statusFilter === 'true';

      const [res, distRes] = await Promise.all([
        managementService.listBusStands(params),
        districtsService.getDistricts()
      ]);

      setStands(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setDistricts(distRes.data || []);

      if (distRes.data && distRes.data.length > 0 && !formData.districtId) {
        setFormData(prev => ({ ...prev, districtId: distRes.data[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load bus stands');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStands();
  }, [standTypeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStands();
  };

  const handleOpenCreateModal = () => {
    setEditingStand(null);
    setFormData({
      districtId: districts[0]?.id || '',
      code: '',
      nameEn: '',
      nameTa: '',
      standType: 'MOFUSSIL',
      totalPlatforms: 12,
      latitude: 9.9252,
      longitude: 78.1198,
      isActive: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stand: BusStandManagementDto) => {
    setEditingStand(stand);
    const distId = typeof stand.districtId === 'object' ? stand.districtId._id : stand.districtId;
    setFormData({
      districtId: distId,
      code: stand.code,
      nameEn: stand.nameEn,
      nameTa: stand.nameTa,
      standType: stand.standType,
      totalPlatforms: stand.totalPlatforms,
      latitude: stand.location.coordinates[1],
      longitude: stand.location.coordinates[0],
      isActive: stand.isActive
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingStand) {
        await managementService.updateBusStand(editingStand._id, {
          nameEn: formData.nameEn.trim(),
          nameTa: formData.nameTa.trim(),
          totalPlatforms: Number(formData.totalPlatforms),
          standType: formData.standType,
          isActive: formData.isActive
        });
      } else {
        await managementService.createBusStand({
          districtId: formData.districtId,
          code: formData.code.toUpperCase().trim(),
          nameEn: formData.nameEn.trim(),
          nameTa: formData.nameTa.trim(),
          standType: formData.standType,
          totalPlatforms: Number(formData.totalPlatforms),
          location: {
            type: 'Point',
            coordinates: [Number(formData.longitude), Number(formData.latitude)]
          },
          isActive: formData.isActive
        });
      }

      setIsModalOpen(false);
      fetchStands();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save bus stand');
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
              {isTa ? 'பேருந்து நிலையங்கள் மேலாண்மை' : 'Bus Terminals & Stands'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'நகர, புறநகர் மற்றும் இடைநகர பேருந்து நிலையங்கள், நடைமேடைகள் மற்றும் புவியியல் தகவல்கள்'
                : 'Intercity and mofussil terminals, platform assignments, and geo-coordinates'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய நிலையம் சேர்' : 'Create Bus Stand'}</span>
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
            value={standTypeFilter}
            onChange={e => setStandTypeFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Stand Types'}</option>
            <option value="INTERCITY_TERMINAL">INTERCITY_TERMINAL (இடைநகர முனையம்)</option>
            <option value="MOFUSSIL">MOFUSSIL (புறநகர் நிலையம்)</option>
            <option value="TOWN_STAND">TOWN_STAND (நகர பேருந்து நிலையம்)</option>
          </select>

          <select
            className="mgmt-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
            <option value="true">{isTa ? 'செயலில்' : 'Active'}</option>
            <option value="false">{isTa ? 'செயலற்றது' : 'Inactive'}</option>
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
              <th>{isTa ? 'நிலைய பெயர்' : 'Stand Name'}</th>
              <th>{isTa ? 'வகை' : 'Type'}</th>
              <th>{isTa ? 'நடைமேடைகள்' : 'Platforms'}</th>
              <th>{isTa ? 'ஆயத்தொலைவுகள்' : 'Coordinates (Lng, Lat)'}</th>
              <th>{isTa ? 'நிலை' : 'Status'}</th>
              <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  {isTa ? 'பேருந்து நிலையங்கள் ஏற்றப்படுகின்றன...' : 'Loading bus stands...'}
                </td>
              </tr>
            ) : stands.length === 0 ? (
              <tr>
                <td colSpan={7} className="mgmt-empty-state">
                  <Navigation size={36} className="mgmt-empty-icon" />
                  <p>{isTa ? 'பேருந்து நிலையங்கள் எதுவும் காணப்படவில்லை' : 'No bus stands found'}</p>
                </td>
              </tr>
            ) : (
              stands.map(stand => (
                <tr key={stand._id}>
                  <td style={{ fontWeight: 800, color: '#000' }}>{stand.code}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{isTa ? stand.nameTa : stand.nameEn}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{isTa ? stand.nameEn : stand.nameTa}</div>
                  </td>
                  <td>
                    <span className="mgmt-pill mgmt-pill-secondary">
                      {stand.standType}
                    </span>
                  </td>
                  <td>
                    <strong>{stand.totalPlatforms}</strong> {isTa ? 'மேடைகள்' : 'platforms'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {stand.location?.coordinates?.[0]?.toFixed(4)}, {stand.location?.coordinates?.[1]?.toFixed(4)}
                  </td>
                  <td>
                    <span className={`mgmt-pill ${stand.isActive ? 'mgmt-pill-active' : 'mgmt-pill-inactive'}`}>
                      {stand.isActive ? (isTa ? 'இயக்கத்தில்' : 'ACTIVE') : (isTa ? 'செயலற்றது' : 'INACTIVE')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEditModal(stand)}
                      className="btn btn-outline"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <Edit2 size={13} style={{ marginRight: '4px' }} />
                      {isTa ? 'திருத்து' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
        {isTa ? `மொத்த நிலையங்கள்: ${total}` : `Total Bus Stands: ${total}`}
      </div>

      {/* Modal: Create / Edit Bus Stand */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {editingStand
                  ? (isTa ? 'நிலைய விவரங்களைத் திருத்து' : 'Edit Bus Stand')
                  : (isTa ? 'புதிய பேருந்து நிலையம்' : 'Create Bus Stand')}
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

                {!editingStand && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'குறியீடு' : 'Code *'}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MDU-STAND-04"
                        className="mgmt-form-input"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'மாவட்டம்' : 'District *'}</label>
                      <select
                        className="mgmt-select"
                        value={formData.districtId}
                        onChange={e => setFormData({ ...formData, districtId: e.target.value })}
                      >
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.nameEn} ({d.nameTa})
                          </option>
                        ))}
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
                      placeholder="e.g. Mattuthavani Integrated Bus Terminal"
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
                      placeholder="e.g. மாட்டுத்தாவணி பேருந்து நிலையம்"
                      className="mgmt-form-input"
                      value={formData.nameTa}
                      onChange={e => setFormData({ ...formData, nameTa: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'வகை' : 'Stand Type *'}</label>
                    <select
                      className="mgmt-select"
                      value={formData.standType}
                      onChange={e => setFormData({ ...formData, standType: e.target.value as any })}
                    >
                      <option value="INTERCITY_TERMINAL">INTERCITY_TERMINAL (இடைநகர முனையம்)</option>
                      <option value="MOFUSSIL">MOFUSSIL (புறநகர் நிலையம்)</option>
                      <option value="TOWN_STAND">TOWN_STAND (நகர பேருந்து நிலையம்)</option>
                    </select>
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'நடைமேடைகள் எண்ணிக்கை' : 'Total Platforms *'}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="mgmt-form-input"
                      value={formData.totalPlatforms}
                      onChange={e => setFormData({ ...formData, totalPlatforms: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {!editingStand && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="mgmt-form-group">
                      <label className="mgmt-form-label">{isTa ? 'அட்சரேகை (Latitude)' : 'Latitude *'}</label>
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
                      <label className="mgmt-form-label">{isTa ? 'தீர்க்கரேகை (Longitude)' : 'Longitude *'}</label>
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
                )}

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'நிலை' : 'Status'}</label>
                  <select
                    className="mgmt-select"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">{isTa ? 'இயக்கத்தில் (Active)' : 'Active'}</option>
                    <option value="false">{isTa ? 'செயலற்றது (Inactive)' : 'Inactive'}</option>
                  </select>
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
                  {isSubmitting ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'நிலையம் சேமி' : 'Save Bus Stand')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
