import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bus,
  ArrowLeft,
  Building2,
  Fuel,
  Cpu,
  Radio,
  UserCheck,
  Users,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  FleetBusDto,
  AssignmentRecordDto
} from '../../../services/api/fleetStaffDevice.service';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const BusDetailsPage: React.FC = () => {
  const { busId } = useParams<{ busId: string }>();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [bus, setBus] = useState<FleetBusDto | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRecordDto[]>([]);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Depot Assignment Modal
  const [isDepotModalOpen, setIsDepotModalOpen] = useState<boolean>(false);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [depotNotes, setDepotNotes] = useState<string>('');
  const [isSavingDepot, setIsSavingDepot] = useState<boolean>(false);

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE'>('IN_SERVICE');
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);

  const fetchBusData = async () => {
    if (!busId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [busData, historyData, depotRes] = await Promise.all([
        fleetStaffDeviceService.getBusById(busId),
        fleetStaffDeviceService.getBusAssignments(busId),
        managementService.listDepots({ limit: 100 })
      ]);
      setBus(busData);
      setAssignments(historyData);
      setDepots(depotRes.data || []);
      setNewStatus(busData.status);
      setSelectedDepotId(busData.depotId || depotRes.data?.[0]?._id || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load bus details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusData();
  }, [busId]);

  const handleDepotReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !selectedDepotId) return;
    setIsSavingDepot(true);
    try {
      await fleetStaffDeviceService.assignBusDepot(busId, selectedDepotId, depotNotes);
      setIsDepotModalOpen(false);
      setDepotNotes('');
      fetchBusData();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign depot');
    } finally {
      setIsSavingDepot(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId) return;
    setIsSavingStatus(true);
    try {
      await fleetStaffDeviceService.updateBusStatus(busId, newStatus);
      setIsStatusModalOpen(false);
      fetchBusData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update bus status');
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mgmt-page-container app-container">
        <ManagementNav />
        <div className="mgmt-empty-state">
          <Bus size={36} className="mgmt-empty-icon animate-pulse" />
          <p>{isTa ? 'பேருந்து விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading bus details...'}</p>
        </div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="mgmt-page-container app-container">
        <ManagementNav />
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{isTa ? 'பேருந்து கிடைக்கவில்லை' : 'Bus Not Found'}</h2>
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>{error || 'Unable to retrieve vehicle profile.'}</p>
          <Link to="/operations/fleet" className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            {isTa ? 'பேருந்துகள் பட்டியலுக்கு திரும்பு' : 'Back to Fleet Registry'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <Link
          to="/operations/fleet"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4B5563', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}
        >
          <ArrowLeft size={14} />
          <span>{isTa ? 'கடற்படைப் பட்டியலுக்கு திரும்பு' : 'Back to Fleet Registry'}</span>
        </Link>

        <div className="mgmt-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="mgmt-title font-shining-title">{bus.registrationNumber}</h1>
              <span className="mgmt-badge" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '14px', fontWeight: 800 }}>
                {bus.fleetNumber}
              </span>
              <span className={`mgmt-badge ${
                bus.status === 'IN_SERVICE' ? 'mgmt-badge-active' :
                bus.status === 'MAINTENANCE' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
              }`}>
                {bus.status.replace('_', ' ')}
              </span>
              {bus.isReserveFleet && (
                <span className="mgmt-badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  <Shield size={12} style={{ marginRight: '4px' }} />
                  {isTa ? 'ரிசர்வ் கடற்படை' : 'Reserve Fleet'}
                </span>
              )}
            </div>
            <p className="mgmt-subtitle">
              {bus.depot?.nameEn || bus.depotName || 'Depot'} • {bus.vehicleType.replace(/_/g, ' ')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="btn btn-secondary"
            >
              {isTa ? 'நிலை மாற்று' : 'Update Status'}
            </button>
            <button
              onClick={() => setIsDepotModalOpen(true)}
              className="btn btn-primary"
            >
              <Building2 size={15} style={{ marginRight: '6px' }} />
              {isTa ? 'பணிமனை மாற்று' : 'Assign Depot'}
            </button>
          </div>
        </div>
      </div>

      <ManagementNav />

      {/* Grid: Vehicle Profile & Assigned Resources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Specifications Card */}
        <div className="mgmt-card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bus size={18} color="#EAB308" />
            <span>{isTa ? 'வாகன விவரக்குறிப்புகள்' : 'Vehicle Specifications'}</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'உற்பத்தியாளர்' : 'Manufacturer'}</div>
              <div style={{ fontWeight: 700 }}>{bus.manufacturer || 'Ashok Leyland'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'மாடல்' : 'Model'}</div>
              <div style={{ fontWeight: 700 }}>{bus.vehicleModel || 'Viking BS6'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'எரிபொருள்' : 'Fuel Type'}</div>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Fuel size={13} color="#EAB308" />
                {bus.fuelType || 'DIESEL'}
              </div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'இருக்கைகள்' : 'Capacity'}</div>
              <div style={{ fontWeight: 700 }}>{bus.seatingCapacity ?? 45} Seats</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'சேஸிஸ் எண்' : 'Chassis No'}</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bus.chassisNumber || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'என்ஜின் எண்' : 'Engine No'}</div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bus.engineNumber || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பணிமனை' : 'Depot'}</div>
              <div style={{ fontWeight: 700 }}>{bus.depot?.nameEn || bus.depotName || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{isTa ? 'பதிவு தேதி' : 'Registered On'}</div>
              <div style={{ fontWeight: 600 }}>{bus.registrationDate ? new Date(bus.registrationDate).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </div>

        {/* Assigned Crew & Telematics */}
        <div className="mgmt-card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#EAB308" />
            <span>{isTa ? 'ஒதுக்கப்பட்ட பணியாளர்கள் & சாதனங்கள்' : 'Assigned Crew & Telematics'}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Driver */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={18} color="#166534" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {bus.assignedDriverId ? bus.assignedDriverId.fullName : (isTa ? 'ஓட்டுநர் ஒதுக்கப்படவில்லை' : 'No Driver Assigned')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    {bus.assignedDriverId ? `Emp #${bus.assignedDriverId.employeeId} • Badge ${bus.assignedDriverId.badgeNumber}` : 'Pending assignment'}
                  </div>
                </div>
              </div>
              {bus.assignedDriverId && (
                <span className="mgmt-badge mgmt-badge-active" style={{ fontSize: '11px' }}>
                  {bus.assignedDriverId.status}
                </span>
              )}
            </div>

            {/* Conductor */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#2563EB" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {bus.assignedConductorId ? bus.assignedConductorId.fullName : (isTa ? 'நடத்துநர் ஒதுக்கப்படவில்லை' : 'No Conductor Assigned')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    {bus.assignedConductorId ? `Emp #${bus.assignedConductorId.employeeId} • Badge ${bus.assignedConductorId.badgeNumber}` : 'Pending assignment'}
                  </div>
                </div>
              </div>
              {bus.assignedConductorId && (
                <span className="mgmt-badge mgmt-badge-active" style={{ fontSize: '11px' }}>
                  {bus.assignedConductorId.status}
                </span>
              )}
            </div>

            {/* GPS Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={18} color="#059669" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {bus.assignedGpsTrackerId ? `GPS: ${bus.assignedGpsTrackerId.deviceId}` : (isTa ? 'ஜிபிஎஸ் கருவி ஒதுக்கப்படவில்லை' : 'Dedicated GPS Tracker: None')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    {bus.assignedGpsTrackerId ? `Model ${bus.assignedGpsTrackerId.deviceModel} • Hardware GNSS` : 'No hardware tracker attached'}
                  </div>
                </div>
              </div>
              {bus.assignedGpsTrackerId && (
                <span className="mgmt-badge mgmt-badge-active" style={{ fontSize: '11px' }}>
                  {bus.assignedGpsTrackerId.gpsAvailabilityStatus}
                </span>
              )}
            </div>

            {/* ETM Machine */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="#7C3AED" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {bus.assignedEtmDeviceId ? `ETM: ${bus.assignedEtmDeviceId.deviceId}` : (isTa ? 'டிக்கெட் இயந்திரம் ஒதுக்கப்படவில்லை' : 'ETM Machine: None')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    {bus.assignedEtmDeviceId ? `Model ${bus.assignedEtmDeviceId.deviceModel}` : 'Electronic ticketing terminal'}
                  </div>
                </div>
              </div>
              {bus.assignedEtmDeviceId && (
                <span className={`mgmt-badge ${
                  bus.assignedEtmDeviceId.gpsAvailabilityStatus === 'VERIFIED_AVAILABLE' ? 'mgmt-badge-active' :
                  bus.assignedEtmDeviceId.gpsAvailabilityStatus === 'UNKNOWN' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                }`} style={{ fontSize: '11px' }}>
                  GPS: {bus.assignedEtmDeviceId.gpsAvailabilityStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment History Ledger */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#EAB308" />
            <span>{isTa ? 'ஒதுக்கீடு மற்றும் வரலாற்று பதிவு' : 'Immutable Assignment Ledger'}</span>
          </h2>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            {assignments.length} {isTa ? 'பதிவுகள்' : 'records logged'}
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="mgmt-empty-state">
            <p>{isTa ? 'ஒதுக்கீட்டு வரலாறு எதுவும் இல்லை' : 'No assignment history records found for this vehicle'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'வகை' : 'Assignment Type'}</th>
                  <th>{isTa ? 'ஒதுக்கப்பட்ட விவரம்' : 'Assigned Resource'}</th>
                  <th>{isTa ? 'நிலை' : 'Status'}</th>
                  <th>{isTa ? 'துவக்கம்' : 'Assigned At'}</th>
                  <th>{isTa ? 'ஒதுக்கியவர்' : 'Assigned By'}</th>
                  <th>{isTa ? 'குறிப்பு' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 700 }}>
                      <span className="mgmt-badge" style={{ backgroundColor: '#F3F4F6', color: '#1F2937' }}>
                        {rec.assignmentType}
                      </span>
                    </td>
                    <td>
                      {rec.assignmentType === 'BUS_DEPOT' && rec.depotId && (
                        <span>Depot: <strong>{rec.depotId.nameEn}</strong> ({rec.depotId.code})</span>
                      )}
                      {(rec.assignmentType === 'BUS_ETM' || rec.assignmentType === 'BUS_GPS') && rec.deviceId && (
                        <span>Device: <strong>{rec.deviceId.deviceId}</strong> ({rec.deviceId.deviceCategory} - {rec.deviceId.deviceModel})</span>
                      )}
                      {rec.assignmentType === 'DRIVER_BUS' && rec.crewId && (
                        <span>Driver: <strong>{rec.crewId.fullName}</strong> (#{rec.crewId.employeeId})</span>
                      )}
                    </td>
                    <td>
                      <span className={`mgmt-badge ${
                        rec.status === 'ACTIVE' ? 'mgmt-badge-active' : 'mgmt-badge-inactive'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(rec.assignedAt).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>
                      {rec.assignedBy}
                    </td>
                    <td style={{ fontSize: '12px', color: '#4B5563' }}>
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Depot Reassignment Modal */}
      {isDepotModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{isTa ? 'பணிமனை மாற்றம்' : 'Assign Bus to Depot'}</h3>
              <button onClick={() => setIsDepotModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleDepotReassignment}>
              <div className="mgmt-modal-body">
                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'இலக்குப் பணிமனை' : 'Target Depot *'}</label>
                  <select
                    required
                    value={selectedDepotId}
                    onChange={e => setSelectedDepotId(e.target.value)}
                    className="mgmt-form-input"
                  >
                    {depots.map(d => (
                      <option key={d._id} value={d._id}>{d.nameEn} ({d.code}) - {d.depotType}</option>
                    ))}
                  </select>
                </div>
                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'காரணம் / குறிப்புகள்' : 'Reassignment Notes'}</label>
                  <textarea
                    rows={3}
                    placeholder={isTa ? 'மாற்றத்திற்கான காரணத்தை உள்ளிடவும்...' : 'e.g. Seasonal route optimization or maintenance reassignment'}
                    value={depotNotes}
                    onChange={e => setDepotNotes(e.target.value)}
                    className="mgmt-form-textarea"
                  />
                </div>
              </div>
              <div className="mgmt-modal-footer">
                <button type="button" onClick={() => setIsDepotModalOpen(false)} className="btn btn-secondary" disabled={isSavingDepot}>
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingDepot}>
                  {isSavingDepot ? (isTa ? 'சேமிக்கிறது...' : 'Updating...') : (isTa ? 'மாற்று' : 'Confirm Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{isTa ? 'செயல்பாட்டு நிலை புதுப்பிப்பு' : 'Update Operational Status'}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleStatusChange}>
              <div className="mgmt-modal-body">
                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'புதிய நிலை' : 'Operational Status *'}</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="mgmt-form-input"
                  >
                    <option value="IN_SERVICE">IN_SERVICE (In Revenue Service)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Workshop / Repairs)</option>
                    <option value="OFFLINE">OFFLINE (Decommissioned / Standby)</option>
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
