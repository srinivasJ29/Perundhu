import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  ShieldAlert,
  RefreshCw,
  Share2,
  X
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  managementService,
  DepotDto,
  DepotBusDto,
  BackupDepotsResponseDto
} from '../../../services/api/management.service';
import '../styles/management.css';

export const DepotDetailsPage: React.FC = () => {
  const { depotId } = useParams<{ depotId: string }>();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [depot, setDepot] = useState<DepotDto | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [buses, setBuses] = useState<DepotBusDto[]>([]);
  const [backupDepotsData, setBackupDepotsData] = useState<BackupDepotsResponseDto | null>(null);
  const [allPrimaryDepots, setAllPrimaryDepots] = useState<DepotDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'buses' | 'backup-depots'>('buses');

  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false);
  const [reassignTargetBackupId, setReassignTargetBackupId] = useState<string>('');
  const [newPrimaryId, setNewPrimaryId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  const loadData = async () => {
    if (!depotId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [depotData, statsData, busesData] = await Promise.all([
        managementService.getDepotById(depotId),
        managementService.getDepotStats(depotId),
        managementService.getDepotBuses(depotId)
      ]);
      setDepot(depotData);
      setStats(statsData);
      setBuses(busesData.data || []);

      if (depotData.depotType === 'PRIMARY') {
        const backupData = await managementService.getBackupDepots(depotId);
        setBackupDepotsData(backupData);
      }

      // Fetch primary depots list in case we need reassignment
      const depotsRes = await managementService.listDepots({ depotType: 'PRIMARY' });
      setAllPrimaryDepots(depotsRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load depot details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [depotId]);

  const handleOpenReassignModal = (backupDepotId: string) => {
    setReassignTargetBackupId(backupDepotId);
    setNewPrimaryId('');
    setReassignError(null);
    setIsReassignModalOpen(true);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetBackupId || !newPrimaryId) return;
    setIsReassigning(true);
    setReassignError(null);
    try {
      await managementService.reassignBackupDepot(reassignTargetBackupId, newPrimaryId);
      setIsReassignModalOpen(false);
      loadData();
    } catch (err: any) {
      setReassignError(err?.message || 'Failed to reassign backup depot');
    } finally {
      setIsReassigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mgmt-page-container app-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>{isTa ? 'பணிமனை விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading depot details...'}</p>
      </div>
    );
  }

  if (error || !depot) {
    return (
      <div className="mgmt-page-container app-container">
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
          {error || 'Depot not found'}
        </div>
        <Link to="/operations/depots" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          <span>{isTa ? 'பணிமனைகள் பட்டியலுக்குத் திரும்பு' : 'Back to Depots'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mgmt-page-container app-container">
      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/operations/depots"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#555',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          <ArrowLeft size={14} />
          <span>{isTa ? 'பணிமனைகள் பட்டியல்' : 'Back to Depots List'}</span>
        </Link>
      </div>

      {/* Header Card */}
      <div
        style={{
          background: 'var(--color-white)',
          border: '1px solid var(--color-cream-300)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className={`mgmt-pill mgmt-pill-${depot.depotType.toLowerCase()}`}>
                {depot.depotType}
              </span>
              <span className={`mgmt-pill mgmt-pill-${depot.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {depot.status}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#666' }}>{depot.code}</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px 0', color: '#000' }}>
              {isTa ? depot.nameTa : depot.nameEn}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {isTa ? depot.nameEn : depot.nameTa} • {depot.address || 'Address not registered'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {depot.depotType === 'BACKUP' && (
              <button
                onClick={() => handleOpenReassignModal(depot._id)}
                className="btn btn-secondary"
                style={{ fontSize: '13px' }}
              >
                <Share2 size={14} style={{ marginRight: '6px' }} />
                {isTa ? 'முதன்மை பணிமனையை மாற்று' : 'Reassign Primary'}
              </button>
            )}
            <button onClick={loadData} className="btn btn-outline" style={{ fontSize: '13px' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Key stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-cream-300)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>
              {isTa ? 'ஒதுக்கப்பட்ட பேருந்துகள்' : 'Assigned Buses'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#000' }}>
              {stats?.totalRegisteredBuses ?? buses.length} / {depot.totalCapacity}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>
              {isTa ? 'சேவையில் உள்ளவை' : 'In Service'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>
              {stats?.inServiceBuses ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>
              {isTa ? 'தயார் நிலையில்' : 'Available'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#854D0E' }}>
              {stats?.availableBuses ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>
              {isTa ? 'ரிசர்வ் பேருந்துகள்' : 'Reserve'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#6B21A8' }}>
              {stats?.reserveBuses ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>
              {isTa ? 'பராமரிப்பில்' : 'Maintenance'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#92400E' }}>
              {stats?.maintenanceBuses ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-cream-300)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('buses')}
          className={`mgmt-nav-tab ${activeTab === 'buses' ? 'active' : ''}`}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <Bus size={16} />
          <span>{isTa ? `ஒதுக்கப்பட்ட பேருந்துகள் (${buses.length})` : `Assigned Fleet (${buses.length})`}</span>
        </button>

        {depot.depotType === 'PRIMARY' && (
          <button
            onClick={() => setActiveTab('backup-depots')}
            className={`mgmt-nav-tab ${activeTab === 'backup-depots' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <ShieldAlert size={16} />
            <span>
              {isTa
                ? `இணைக்கப்பட்ட காப்பு பணிமனைகள் (${backupDepotsData?.backupDepots.length || 0})`
                : `Linked Backup Depots (${backupDepotsData?.backupDepots.length || 0})`}
            </span>
          </button>
        )}
      </div>

      {/* Tab: Assigned Buses */}
      {activeTab === 'buses' && (
        <div className="mgmt-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>{isTa ? 'பதிவு எண்' : 'Reg Number'}</th>
                <th>{isTa ? 'கடற்படை எண்' : 'Fleet No'}</th>
                <th>{isTa ? 'வகை' : 'Vehicle Type'}</th>
                <th>{isTa ? 'நிலை' : 'Status'}</th>
                <th>{isTa ? 'ரிசர்வ் நிலை' : 'Reserve'}</th>
                <th>{isTa ? 'ஓட்டுநர் / நடத்துனர்' : 'Crew (Driver / Conductor)'}</th>
                <th>{isTa ? 'நடப்பு பணி' : 'Active Duty'}</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mgmt-empty-state">
                    <Bus size={32} className="mgmt-empty-icon" />
                    <p>{isTa ? 'இப்பணிமனைக்கு பேருந்துகள் எதுவும் ஒதுக்கப்படவில்லை' : 'No buses assigned to this depot'}</p>
                  </td>
                </tr>
              ) : (
                buses.map(bus => (
                  <tr key={bus._id}>
                    <td style={{ fontWeight: 800, color: '#000' }}>{bus.registrationNumber}</td>
                    <td style={{ fontWeight: 700 }}>{bus.fleetNumber}</td>
                    <td>{bus.vehicleType}</td>
                    <td>
                      <span className={`mgmt-pill mgmt-pill-${bus.status.toLowerCase()}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td>
                      {bus.isReserveFleet ? (
                        <span className="mgmt-pill mgmt-pill-backup">{isTa ? 'ரிசர்வ்' : 'Reserve'}</span>
                      ) : (
                        <span style={{ color: '#888', fontSize: '12px' }}>{isTa ? 'வழக்கமான' : 'Regular'}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div><strong>D:</strong> {bus.assignedDriverId?.fullName || (isTa ? 'ஒதுக்கப்படவில்லை' : 'Unassigned')}</div>
                        <div><strong>C:</strong> {bus.assignedConductorId?.fullName || (isTa ? 'ஒதுக்கப்படவில்லை' : 'Unassigned')}</div>
                      </div>
                    </td>
                    <td>
                      {bus.currentAssignedTripId ? (
                        <span className="mgmt-pill mgmt-pill-transit">
                          Trip: {bus.currentAssignedTripId.tripCode}
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontSize: '12px' }}>{isTa ? 'பணி இல்லை' : 'Idle'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Linked Backup Depots */}
      {activeTab === 'backup-depots' && depot.depotType === 'PRIMARY' && (
        <div>
          {(!backupDepotsData?.backupDepots || backupDepotsData.backupDepots.length === 0) ? (
            <div className="mgmt-table-wrapper" style={{ padding: '40px', textAlign: 'center' }}>
              <ShieldAlert size={36} className="mgmt-empty-icon" />
              <p style={{ fontWeight: 700 }}>
                {isTa ? 'இணைக்கப்பட்ட காப்புப் பணிமனைகள் எதுவும் இல்லை' : 'No linked backup depots configured for this primary depot'}
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                {isTa
                  ? 'காப்புப் பணிமனைகள் உருவாக்கும் போது அல்லது மறுஒதுக்கீட்டின் போது இந்த முதன்மை பணிமனையுடன் இணைக்கப்படலாம்.'
                  : 'Backup depots can be linked to provide emergency reserve fleet relief during disruptions.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {backupDepotsData.backupDepots.map(backup => (
                <div
                  key={backup._id}
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-cream-300)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mgmt-pill mgmt-pill-backup">BACKUP</span>
                        <span style={{ fontWeight: 800 }}>{backup.code}</span>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                          {isTa ? backup.nameTa : backup.nameEn}
                        </h3>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                        {backup.address || 'Address unlisted'} • Total Capacity: {backup.totalCapacity}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#888' }}>
                          {isTa ? 'தயார் நிலை ரிசர்வ்' : 'Available Reserve'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#166534' }}>
                          {backup.availableReserveCount} / {backup.totalReserveFleetCount}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenReassignModal(backup._id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        {isTa ? 'மறுஒதுக்கீடு' : 'Reassign Link'}
                      </button>
                    </div>
                  </div>

                  {/* Reserve buses in this backup depot */}
                  <div style={{ background: 'var(--color-bg-subtle)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#444' }}>
                      {isTa ? 'காப்பு பணிமனையின் ரிசர்வ் பேருந்துகள்:' : 'Reserve Buses in Linked Backup Depot:'}
                    </div>
                    {backup.reserveBuses.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {isTa ? 'ரிசர்வ் பேருந்துகள் எதுவும் இல்லை' : 'No reserve buses currently staged here'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {backup.reserveBuses.map(rb => (
                          <div
                            key={rb.id}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--color-cream-300)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px'
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>{rb.registrationNumber}</span>
                            <span style={{ color: '#666' }}>({rb.fleetNumber})</span>
                            <span
                              className={`mgmt-pill ${rb.isAvailable ? 'mgmt-pill-active' : 'mgmt-pill-inactive'}`}
                              style={{ fontSize: '9px', padding: '1px 5px' }}
                            >
                              {rb.isAvailable ? 'READY' : 'BUSY'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Reassign Backup Depot Link */}
      {isReassignModalOpen && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsReassignModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'காப்பு பணிமனை முதன்மை இணைப்பை மாற்று' : 'Reassign Backup Depot Primary Link'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="btn btn-ghost"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit}>
              <div className="mgmt-modal-body">
                {reassignError && (
                  <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px' }}>
                    {reassignError}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                  {isTa
                    ? 'இந்த காப்பு பணிமனையை மற்றொரு முதன்மை பணிமனையுடன் இணைக்கவும். தன்னாட்சி மற்றும் சுழற்சி தொடர்புகள் நிராகரிக்கப்படும்.'
                    : 'Select a valid primary depot belonging to compatible organization and division. Self-referencing and circular links are strictly prevented.'}
                </p>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'புதிய முதன்மை பணிமனை' : 'New Primary Depot *'}</label>
                  <select
                    required
                    className="mgmt-select"
                    value={newPrimaryId}
                    onChange={e => setNewPrimaryId(e.target.value)}
                  >
                    <option value="">{isTa ? '-- முதன்மை பணிமனையைத் தேர்ந்தெடு --' : '-- Select New Primary Depot --'}</option>
                    {allPrimaryDepots
                      .filter(p => p._id !== reassignTargetBackupId)
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          {p.code} - {p.nameEn}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="btn btn-ghost"
                >
                  {isTa ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !newPrimaryId}
                  className="btn btn-primary"
                >
                  {isReassigning ? (isTa ? 'மாற்றப்படுகிறது...' : 'Updating...') : (isTa ? 'இணைப்பை மாற்று' : 'Reassign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
