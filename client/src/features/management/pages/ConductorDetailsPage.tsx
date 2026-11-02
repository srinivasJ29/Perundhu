import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Cpu,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  CrewMemberDto,
  AssignmentRecordDto,
  CrewAvailabilityStatus
} from '../../../services/api/fleetStaffDevice.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const ConductorDetailsPage: React.FC = () => {
  const { conductorId } = useParams<{ conductorId: string }>();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [conductor, setConductor] = useState<CrewMemberDto | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRecordDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<CrewAvailabilityStatus>('AVAILABLE');
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);

  const fetchConductorData = async () => {
    if (!conductorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [conductorData, historyData] = await Promise.all([
        fleetStaffDeviceService.getConductorById(conductorId),
        fleetStaffDeviceService.getConductorAssignments(conductorId)
      ]);
      setConductor(conductorData);
      setAssignments(historyData);
      setNewStatus(conductorData.status);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conductor details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConductorData();
  }, [conductorId]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductorId) return;
    setIsSavingStatus(true);
    try {
      await fleetStaffDeviceService.updateConductorStatus(conductorId, newStatus);
      setIsStatusModalOpen(false);
      fetchConductorData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update conductor status');
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mgmt-page-container app-container">
        <ManagementNav />
        <div className="mgmt-empty-state">
          <Users size={36} className="mgmt-empty-icon animate-pulse" />
          <p>{isTa ? 'விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading conductor profile...'}</p>
        </div>
      </div>
    );
  }

  if (error || !conductor) {
    return (
      <div className="mgmt-page-container app-container">
        <ManagementNav />
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{isTa ? 'நடத்துநர் கிடைக்கவில்லை' : 'Conductor Not Found'}</h2>
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>{error || 'Unable to load profile.'}</p>
          <Link to="/operations/conductors" className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            {isTa ? 'நடத்துநர்கள் பட்டியலுக்கு திரும்பு' : 'Back to Conductors'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <Link
          to="/operations/conductors"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4B5563', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
        >
          <ArrowLeft size={14} />
          <span>{isTa ? 'நடத்துநர்கள் பட்டியலுக்கு திரும்பு' : 'Back to Conductors'}</span>
        </Link>

        <div className="mgmt-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="mgmt-title font-shining-title">{conductor.fullName}</h1>
              <span className="mgmt-badge" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '14px', fontWeight: 800 }}>
                {conductor.employeeId}
              </span>
              <span className="mgmt-badge mgmt-badge-active" style={{ fontSize: '12px' }}>
                Badge: {conductor.badgeNumber}
              </span>
              <span className="mgmt-badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '12px', fontWeight: 700 }}>
                {conductor.status}
              </span>
            </div>
            <p className="mgmt-subtitle">
              {conductor.depot?.nameEn || 'Depot'} • Shift: {conductor.shiftPreference || 'ROTATING'}
            </p>
          </div>

          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="btn btn-primary"
          >
            {isTa ? 'பணி நிலை மாற்று' : 'Update Availability'}
          </button>
        </div>
      </div>

      <ManagementNav />

      {/* Profile & Paired ETM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="mgmt-card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#EAB308" />
            <span>{isTa ? 'பணியாளர் விவரக்குறிப்புகள்' : 'Conductor Profile'}</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பணியாளர் எண்' : 'Employee ID'}</div>
              <div style={{ fontWeight: 700 }}>{conductor.employeeId}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பேட்ஜ் எண்' : 'Badge Number'}</div>
              <div style={{ fontWeight: 700 }}>{conductor.badgeNumber}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பணிமனை' : 'Depot'}</div>
              <div style={{ fontWeight: 700 }}>{conductor.depot?.nameEn || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பணி முறை' : 'Shift'}</div>
              <div style={{ fontWeight: 700 }}>{conductor.shiftPreference || 'ROTATING'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'தொடர்பு தொலைபேசி' : 'Phone'}</div>
              <div style={{ fontWeight: 700 }}>{conductor.contactNumber || 'Hidden (Admin Only)'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பதிவு தேதி' : 'Joined On'}</div>
              <div style={{ fontWeight: 600 }}>{new Date(conductor.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Paired ETM Machine */}
        <div className="mgmt-card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#EAB308" />
            <span>{isTa ? 'ஒதுக்கப்பட்ட டிக்கெட் இயந்திரம் (ETM)' : 'Paired Electronic Ticketing Machine'}</span>
          </h2>
          {conductor.assignedEtm ? (
            <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: '12px', border: '1px solid var(--color-cream-300)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900 }}>
                  {conductor.assignedEtm.deviceId}
                </div>
                <span className={`mgmt-badge ${
                  conductor.assignedEtm.gpsAvailabilityStatus === 'VERIFIED_AVAILABLE' ? 'mgmt-badge-active' :
                  conductor.assignedEtm.gpsAvailabilityStatus === 'UNKNOWN' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                }`}>
                  GPS: {conductor.assignedEtm.gpsAvailabilityStatus}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
                Model: <strong>{conductor.assignedEtm.deviceModel}</strong>
              </div>
              <Link to={`/operations/etms/${conductor.assignedEtm.id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                {isTa ? 'ETM கருவி விவரம் பார்க்க' : 'View ETM Profile'}
              </Link>
            </div>
          ) : (
            <div className="mgmt-empty-state" style={{ padding: '24px 0' }}>
              <Cpu size={32} className="mgmt-empty-icon" />
              <p>{isTa ? 'ETM சாதனம் எதுவும் தற்போது ஒதுக்கப்படவில்லை' : 'No ticketing machine is currently paired to this conductor'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Ledger */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#EAB308" />
            <span>{isTa ? 'ETM சாதன ஒதுக்கீட்டு வரலாறு' : 'ETM Device Assignment History'}</span>
          </h2>
        </div>

        {assignments.length === 0 ? (
          <div className="mgmt-empty-state">
            <p>{isTa ? 'ஒதுக்கீட்டு வரலாறு எதுவும் இல்லை' : 'No prior device pairings found'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'சாதன எண்' : 'Device ID'}</th>
                  <th>{isTa ? 'வகை' : 'Category'}</th>
                  <th>{isTa ? 'நிலை' : 'Status'}</th>
                  <th>{isTa ? 'துவக்கம்' : 'Assigned At'}</th>
                  <th>{isTa ? 'முடிவு' : 'Unassigned At'}</th>
                  <th>{isTa ? 'ஒதுக்கியவர்' : 'Assigned By'}</th>
                  <th>{isTa ? 'குறிப்பு' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 800 }}>
                      {rec.deviceId ? `${rec.deviceId.deviceId} (${rec.deviceId.deviceModel})` : '—'}
                    </td>
                    <td>{rec.deviceId?.deviceCategory || 'ETM'}</td>
                    <td>
                      <span className={`mgmt-badge ${rec.status === 'ACTIVE' ? 'mgmt-badge-active' : 'mgmt-badge-inactive'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{new Date(rec.assignedAt).toLocaleString()}</td>
                    <td style={{ fontSize: '12px' }}>{rec.unassignedAt ? new Date(rec.unassignedAt).toLocaleString() : 'Active'}</td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>{rec.assignedBy}</td>
                    <td style={{ fontSize: '12px', color: '#4B5563' }}>{rec.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{isTa ? 'நடத்துநர் நிலை மாற்றம்' : 'Update Availability Status'}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleStatusChange}>
              <div className="mgmt-modal-body">
                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'புதிய நிலை' : 'Availability Status *'}</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="mgmt-form-input"
                  >
                    <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                    <option value="ASSIGNED">ASSIGNED (Paired to ETM / duty)</option>
                    <option value="ON_DUTY">ON_DUTY (Operating active trip)</option>
                    <option value="OFF_DUTY">OFF_DUTY (Rest shift)</option>
                    <option value="ON_LEAVE">ON_LEAVE (Scheduled leave)</option>
                    <option value="INACTIVE">INACTIVE (Not available)</option>
                  </select>
                </div>
              </div>
              <div className="mgmt-modal-footer">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="btn btn-secondary" disabled={isSavingStatus}>
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingStatus}>
                  {isSavingStatus ? (isTa ? 'சேமிக்கிறது...' : 'Saving...') : (isTa ? 'சேமி' : 'Save Status')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
