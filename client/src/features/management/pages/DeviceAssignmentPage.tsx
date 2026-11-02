import React, { useEffect, useState } from 'react';
import {
  Link2,
  Cpu,
  Radio,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  FleetBusDto,
  CrewMemberDto,
  DeviceRegistryDto,
  AssignmentRecordDto
} from '../../../services/api/fleetStaffDevice.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const DeviceAssignmentPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [buses, setBuses] = useState<FleetBusDto[]>([]);
  const [drivers, setDrivers] = useState<CrewMemberDto[]>([]);
  const [conductors, setConductors] = useState<CrewMemberDto[]>([]);
  const [etms, setEtms] = useState<DeviceRegistryDto[]>([]);
  const [trackers, setTrackers] = useState<DeviceRegistryDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecordDto[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: BUS_GPS | BUS_ETM | CONDUCTOR_ETM | DRIVER_BUS
  const [activeTab, setActiveTab] = useState<'BUS_GPS' | 'BUS_ETM' | 'CONDUCTOR_ETM' | 'DRIVER_BUS'>('BUS_GPS');

  // Form State
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedCrewId, setSelectedCrewId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [busRes, drvRes, cndRes, etmRes, trkRes, asgnRes] = await Promise.all([
        fleetStaffDeviceService.listBuses({ limit: 100 }),
        fleetStaffDeviceService.listDrivers({ limit: 100 }),
        fleetStaffDeviceService.listConductors({ limit: 100 }),
        fleetStaffDeviceService.listEtms({ limit: 100 }),
        fleetStaffDeviceService.listGpsTrackers({ limit: 100 }),
        fleetStaffDeviceService.listAssignments({ limit: 50 })
      ]);

      setBuses(busRes.data || []);
      setDrivers(drvRes.data || []);
      setConductors(cndRes.data || []);
      setEtms(etmRes.data || []);
      setTrackers(trkRes.data || []);
      setAssignments(asgnRes.data || []);

      if (busRes.data?.length) setSelectedBusId(busRes.data[0].id);
      if (trkRes.data?.length) setSelectedDeviceId(trkRes.data[0].id);
      if (drvRes.data?.length) setSelectedCrewId(drvRes.data[0].id);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assignment resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      if (activeTab === 'BUS_GPS') {
        if (!selectedBusId) throw new Error('Please select a bus');
        await fleetStaffDeviceService.assignBusGps(selectedBusId, selectedDeviceId || undefined, notes);
        setActionSuccess('Bus to GPS Tracker assignment saved successfully.');
      } else if (activeTab === 'BUS_ETM') {
        if (!selectedBusId) throw new Error('Please select a bus');
        await fleetStaffDeviceService.assignBusEtm(selectedBusId, selectedDeviceId || undefined, notes);
        setActionSuccess('Bus to ETM pairing saved successfully.');
      } else if (activeTab === 'CONDUCTOR_ETM') {
        if (!selectedCrewId) throw new Error('Please select a conductor');
        await fleetStaffDeviceService.assignConductorEtm(selectedCrewId, selectedDeviceId || undefined, notes);
        setActionSuccess('Conductor to ETM machine pairing saved successfully.');
      } else if (activeTab === 'DRIVER_BUS') {
        if (!selectedCrewId) throw new Error('Please select a driver');
        await fleetStaffDeviceService.assignDriverBus(selectedCrewId, selectedBusId || undefined, notes);
        setActionSuccess('Driver to Bus duty assignment saved successfully.');
      }

      setNotes('');
      fetchResources();
    } catch (err: any) {
      setActionError(err?.message || 'Assignment failed due to conflict');
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
              {isTa ? 'சாதனம் மற்றும் பணியாளர் ஒதுக்கீட்டு மையம்' : 'Device & Crew Assignment Console'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'பேருந்து, ஜிபிஎஸ், ETM, ஓட்டுநர் மற்றும் நடத்துநர்களை முறைப்படி இணைத்தல் மற்றும் மாற்றங்களை நிர்வகித்தல்'
                : 'Atomic pairing and unpairing of GPS trackers, ETM machines, drivers, and conductors with complete audit history'}
            </p>
          </div>
          <button
            onClick={fetchResources}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Assignment Type Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('BUS_GPS'); setSelectedDeviceId(trackers[0]?.id || ''); }}
          className={`btn ${activeTab === 'BUS_GPS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Radio size={16} />
          <span>{isTa ? 'பேருந்து ↔ ஜிபிஎஸ்' : 'Bus ↔ GPS Tracker'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('BUS_ETM'); setSelectedDeviceId(etms[0]?.id || ''); }}
          className={`btn ${activeTab === 'BUS_ETM' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Cpu size={16} />
          <span>{isTa ? 'பேருந்து ↔ ETM' : 'Bus ↔ ETM Terminal'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('CONDUCTOR_ETM'); setSelectedCrewId(conductors[0]?.id || ''); setSelectedDeviceId(etms[0]?.id || ''); }}
          className={`btn ${activeTab === 'CONDUCTOR_ETM' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={16} />
          <span>{isTa ? 'நடத்துநர் ↔ ETM' : 'Conductor ↔ ETM'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('DRIVER_BUS'); setSelectedCrewId(drivers[0]?.id || ''); }}
          className={`btn ${activeTab === 'DRIVER_BUS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <UserCheck size={16} />
          <span>{isTa ? 'ஓட்டுநர் ↔ பேருந்து' : 'Driver ↔ Bus'}</span>
        </button>
      </div>

      {/* Pairing Console Card */}
      <div className="mgmt-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link2 size={20} color="#EAB308" />
          <span>
            {activeTab === 'BUS_GPS' && (isTa ? 'பேருந்திற்கு ஜிபிஎஸ் கருவி ஒதுக்கீடு' : 'Pair Dedicated GPS Tracker to Fleet Bus')}
            {activeTab === 'BUS_ETM' && (isTa ? 'பேருந்திற்கு ETM இயந்திரம் ஒதுக்கீடு' : 'Pair ETM Terminal to Fleet Bus')}
            {activeTab === 'CONDUCTOR_ETM' && (isTa ? 'நடத்துநருக்கு ETM இயந்திரம் வழங்குதல்' : 'Issue ETM Terminal to Conductor')}
            {activeTab === 'DRIVER_BUS' && (isTa ? 'ஓட்டுநருக்கு பேருந்து ஒதுக்கீடு' : 'Assign Bus to Driver')}
          </span>
        </h2>

        {actionSuccess && (
          <div style={{ padding: '10px 14px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div style={{ padding: '10px 14px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handlePairSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Primary Target Field */}
            {(activeTab === 'BUS_GPS' || activeTab === 'BUS_ETM') && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'பேருந்து தேர்வு செய்க' : 'Select Target Bus *'}</label>
                <select
                  required
                  value={selectedBusId}
                  onChange={e => setSelectedBusId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- Choose Bus --</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.registrationNumber} ({b.fleetNumber}) - {b.depotName} [{b.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'CONDUCTOR_ETM' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'நடத்துநர் தேர்வு செய்க' : 'Select Conductor *'}</label>
                <select
                  required
                  value={selectedCrewId}
                  onChange={e => setSelectedCrewId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- Choose Conductor --</option>
                  {conductors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (#{c.employeeId}) - {c.depot?.nameEn || 'Depot'} [{c.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'DRIVER_BUS' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'ஓட்டுநர் தேர்வு செய்க' : 'Select Driver *'}</label>
                <select
                  required
                  value={selectedCrewId}
                  onChange={e => setSelectedCrewId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} (#{d.employeeId}) - {d.depot?.nameEn || 'Depot'} [{d.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Second Field */}
            {activeTab === 'BUS_GPS' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'ஜிபிஎஸ் சாதனம்' : 'GPS Tracker (Leave blank to unassign)'}</label>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- None (Unassign Tracker) --</option>
                  {trackers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.deviceId} - {t.deviceModel} ({t.manufacturer}) [{t.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'BUS_ETM' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'ETM சாதனம்' : 'ETM Terminal (Leave blank to unassign)'}</label>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- None (Unassign ETM) --</option>
                  {etms.map(etm => (
                    <option key={etm.id} value={etm.id}>
                      {etm.deviceId} - {etm.deviceModel} [GPS: {etm.gpsAvailabilityStatus}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'CONDUCTOR_ETM' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'ETM சாதனம்' : 'ETM Terminal (Leave blank to unassign)'}</label>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- None (Return ETM) --</option>
                  {etms.map(etm => (
                    <option key={etm.id} value={etm.id}>
                      {etm.deviceId} - {etm.deviceModel} ({etm.depot?.nameEn || 'Depot'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'DRIVER_BUS' && (
              <div className="mgmt-form-group">
                <label className="mgmt-form-label">{isTa ? 'பேருந்து' : 'Fleet Bus (Leave blank to unassign)'}</label>
                <select
                  value={selectedBusId}
                  onChange={e => setSelectedBusId(e.target.value)}
                  className="mgmt-form-input"
                >
                  <option value="">-- None (Unassign Bus) --</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.registrationNumber} ({b.fleetNumber}) - {b.depotName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mgmt-form-group" style={{ marginBottom: '16px' }}>
            <label className="mgmt-form-label">{isTa ? 'ஒதுக்கீட்டுக் குறிப்பு / ஆணை எண்' : 'Assignment Notes / Shift Order'}</label>
            <input
              type="text"
              placeholder={isTa ? 'e.g. காலைப் பணி மாற்ற ஆணை எண் #8401' : 'e.g. Shift assignment order #8401 / Scheduled maintenance release'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mgmt-form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? (isTa ? 'செயல்படுத்துகிறது...' : 'Executing Pairing...') : (isTa ? 'ஒதுக்கீட்டை உறுதி செய்' : 'Confirm Assignment')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Immutable Assignment Ledger */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#EAB308" />
            <span>{isTa ? 'அனைத்து ஒதுக்கீடுகளின் நேரலை வரலாற்றுப் பதிவு' : 'Live Controlled Assignment Ledger'}</span>
          </h2>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            Showing recent {assignments.length} transactions
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="mgmt-empty-state">
            <p>{isTa ? 'ஒதுக்கீட்டுப் பதிவுகள் எதுவும் இல்லை' : 'No assignment records found'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'ஒதுக்கீடு வகை' : 'Type'}</th>
                  <th>{isTa ? 'வாகனம்' : 'Bus'}</th>
                  <th>{isTa ? 'சாதனம்' : 'Device'}</th>
                  <th>{isTa ? 'பணியாளர்' : 'Staff'}</th>
                  <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
                  <th>{isTa ? 'நிலை' : 'Status'}</th>
                  <th>{isTa ? 'ஒதுக்கப்பட்ட நேரம்' : 'Timestamp'}</th>
                  <th>{isTa ? 'குறிப்புகள்' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <span className="mgmt-badge" style={{ backgroundColor: '#F3F4F6', color: '#1F2937', fontWeight: 700 }}>
                        {rec.assignmentType}
                      </span>
                    </td>
                    <td>
                      {rec.busId ? (
                        <strong>{rec.busId.registrationNumber}</strong>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {rec.deviceId ? (
                        <span>{rec.deviceId.deviceId} ({rec.deviceId.deviceCategory})</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {rec.crewId ? (
                        <span>{rec.crewId.fullName} ({rec.crewId.role})</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {rec.depotId ? (
                        <span>{rec.depotId.nameEn}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`mgmt-badge ${rec.status === 'ACTIVE' ? 'mgmt-badge-active' : 'mgmt-badge-inactive'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(rec.assignedAt).toLocaleString()}
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
    </div>
  );
};
