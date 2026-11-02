import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Eye, Cpu, X } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  CrewMemberDto,
  CreateCrewPayload,
  CrewAvailabilityStatus
} from '../../../services/api/fleetStaffDevice.service';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const ConductorManagementPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [conductors, setConductors] = useState<CrewMemberDto[]>([]);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [depotFilter, setDepotFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCrewPayload>({
    employeeId: '',
    badgeNumber: '',
    fullName: '',
    organizationId: '',
    assignedDepotId: '',
    contactNumber: '',
    shiftPreference: 'ROTATING'
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (depotFilter) params.depotId = depotFilter;

      const [conductorRes, depotRes] = await Promise.all([
        fleetStaffDeviceService.listConductors(params),
        managementService.listDepots({ limit: 100 })
      ]);

      setConductors(conductorRes.data || []);
      setTotal(conductorRes.pagination?.total ?? conductorRes.data?.length ?? 0);
      setDepots(depotRes.data || []);
      if (depotRes.data && depotRes.data.length > 0 && !formData.assignedDepotId) {
        setFormData(prev => ({
          ...prev,
          assignedDepotId: depotRes.data[0]._id,
          organizationId: depotRes.data[0].organizationId
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load conductors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, depotFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const selectedDepot = depots.find(d => d._id === formData.assignedDepotId);
      const payload: CreateCrewPayload = {
        ...formData,
        employeeId: formData.employeeId.toUpperCase().trim(),
        badgeNumber: formData.badgeNumber.toUpperCase().trim(),
        fullName: formData.fullName.trim(),
        organizationId: selectedDepot?.organizationId || formData.organizationId || (depots[0]?.organizationId ?? '')
      };

      await fleetStaffDeviceService.createConductor(payload);
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        badgeNumber: '',
        fullName: '',
        organizationId: depots[0]?.organizationId || '',
        assignedDepotId: depots[0]?._id || '',
        contactNumber: '',
        shiftPreference: 'ROTATING'
      });
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to register conductor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: CrewAvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return 'mgmt-badge-active';
      case 'ON_DUTY':
        return 'mgmt-badge-secondary';
      case 'ASSIGNED':
        return 'mgmt-badge';
      case 'ON_LEAVE':
      case 'OFF_DUTY':
      case 'INACTIVE':
      case 'SUSPENDED':
      default:
        return 'mgmt-badge-inactive';
    }
  };

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <div>
            <h1 className="mgmt-title font-shining-title">
              {isTa ? 'நடத்துநர்கள் மேலாண்மை' : 'Conductor Management'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'நடத்துநர்களின் விவரக்குறிப்புகள், பணிமனைகள் மற்றும் டிக்கெட் இயந்திர (ETM) ஒதுக்கீடு'
                : 'Manage TNSTC conductors, shift rosters, depot affiliations, and paired electronic ticketing machines'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய நடத்துநர் பதிவு' : 'Register Conductor'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="mgmt-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder={isTa ? 'பெயர், எண் அல்லது பேட்ஜ் தேடுக...' : 'Search conductor name, employee ID, badge...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mgmt-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
            </div>
            <button type="submit" className="btn btn-secondary">
              {isTa ? 'தேடு' : 'Search'}
            </button>
          </form>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Availability'}</option>
              <option value="AVAILABLE">{isTa ? 'கிடைக்கிறார்' : 'AVAILABLE'}</option>
              <option value="ASSIGNED">{isTa ? 'ஒதுக்கப்பட்டுள்ளது' : 'ASSIGNED'}</option>
              <option value="ON_DUTY">{isTa ? 'பணியில் உள்ளார்' : 'ON_DUTY'}</option>
              <option value="OFF_DUTY">{isTa ? 'பணி நேரம் முடிந்தது' : 'OFF_DUTY'}</option>
              <option value="ON_LEAVE">{isTa ? 'விடுப்பில்' : 'ON_LEAVE'}</option>
              <option value="INACTIVE">{isTa ? 'முடக்கம்' : 'INACTIVE'}</option>
            </select>

            <select
              value={depotFilter}
              onChange={e => setDepotFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்துப் பணிமனைகள்' : 'All Depots'}</option>
              {depots.map(d => (
                <option key={d._id} value={d._id}>{d.nameEn} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conductor Table */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            {isTa ? 'பதிவு செய்யப்பட்ட நடத்துநர்கள்' : 'Registered Conductors'} ({total})
          </h2>
        </div>

        {isLoading ? (
          <div className="mgmt-empty-state">
            <Users size={36} className="mgmt-empty-icon animate-pulse" />
            <p>{isTa ? 'நடத்துநர்கள் ஏற்றப்படுகிறார்கள்...' : 'Loading conductors...'}</p>
          </div>
        ) : conductors.length === 0 ? (
          <div className="mgmt-empty-state">
            <Users size={36} className="mgmt-empty-icon" />
            <p>{isTa ? 'நடத்துநர்கள் எதுவும் கிடைக்கவில்லை' : 'No conductors found matching criteria'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'நடத்துநர் பெயர்' : 'Conductor Name'}</th>
                  <th>{isTa ? 'பணியாளர் எண்' : 'Employee ID'}</th>
                  <th>{isTa ? 'பேட்ஜ் எண்' : 'Badge'}</th>
                  <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
                  <th>{isTa ? 'ஒதுக்கப்பட்ட ETM' : 'Assigned ETM'}</th>
                  <th>{isTa ? 'பணி விருப்பம்' : 'Shift'}</th>
                  <th>{isTa ? 'நிலை' : 'Availability'}</th>
                  <th style={{ textAlign: 'right' }}>{isTa ? 'நடவடிக்கை' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {conductors.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-black-900)' }}>
                        {c.fullName}
                      </div>
                      {c.contactNumber && (
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          Phone: {c.contactNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.employeeId}</td>
                    <td>{c.badgeNumber}</td>
                    <td>{c.depot?.nameEn || '—'}</td>
                    <td>
                      {c.assignedEtm ? (
                        <span className="mgmt-badge" style={{ backgroundColor: '#E0E7FF', color: '#3730A3', fontSize: '12px', fontWeight: 700 }}>
                          <Cpu size={12} style={{ marginRight: '4px' }} />
                          {c.assignedEtm.deviceId}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{isTa ? 'ஒதுக்கப்படவில்லை' : 'None'}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>{c.shiftPreference || 'ROTATING'}</td>
                    <td>
                      <span className={`mgmt-badge ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/operations/conductors/${c.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} />
                        <span>{isTa ? 'விவரம்' : 'Profile'}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Conductor Modal */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'புதிய நடத்துநர் பதிவு' : 'Register New Conductor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }}>
                    {formError}
                  </div>
                )}

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'முழுப் பெயர்' : 'Full Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Arumugam"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="mgmt-form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பணியாளர் எண்' : 'Employee ID *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CND-MDU-2001"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பேட்ஜ் எண்' : 'Badge Number *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BDG-9102"
                      value={formData.badgeNumber}
                      onChange={e => setFormData({ ...formData, badgeNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பணிமனை' : 'Assigned Depot *'}</label>
                    <select
                      required
                      value={formData.assignedDepotId}
                      onChange={e => setFormData({ ...formData, assignedDepotId: e.target.value })}
                      className="mgmt-form-input"
                    >
                      {depots.map(d => (
                        <option key={d._id} value={d._id}>{d.nameEn} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பணி முறை' : 'Shift Preference'}</label>
                    <select
                      value={formData.shiftPreference}
                      onChange={e => setFormData({ ...formData, shiftPreference: e.target.value as any })}
                      className="mgmt-form-input"
                    >
                      <option value="MORNING">Morning Shift</option>
                      <option value="EVENING">Evening Shift</option>
                      <option value="NIGHT">Night Shift</option>
                      <option value="ROTATING">Rotating Shift</option>
                    </select>
                  </div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'தொடர்பு தொலைபேசி' : 'Contact Phone'}</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9842109876"
                    value={formData.contactNumber || ''}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="mgmt-form-input"
                  />
                </div>
              </div>

              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (isTa ? 'பதிவாகிறது...' : 'Registering...') : (isTa ? 'பதிவு செய்' : 'Register Conductor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

