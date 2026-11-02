import React, { useEffect, useState } from 'react';
import { Plus, Search, Radio, Wifi, WifiOff, X, Bus } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  DeviceRegistryDto,
  CreateGpsTrackerPayload
} from '../../../services/api/fleetStaffDevice.service';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const GpsTrackerRegistryPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [trackers, setTrackers] = useState<DeviceRegistryDto[]>([]);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [installFilter, setInstallFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [depotFilter, setDepotFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateGpsTrackerPayload>({
    deviceId: '',
    manufacturer: 'Teltonika',
    deviceModel: 'FMB120 GNSS',
    depotId: '',
    supportedProtocols: ['HTTP', 'HTTPS', 'TCP'],
    installationStatus: 'UNINSTALLED'
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (depotFilter) params.depotId = depotFilter;

      const [trackerRes, depotRes] = await Promise.all([
        fleetStaffDeviceService.listGpsTrackers(params),
        managementService.listDepots({ limit: 100 })
      ]);

      let list = trackerRes.data || [];
      if (installFilter) {
        list = list.filter(t => t.installationStatus === installFilter);
      }

      setTrackers(list);
      setTotal(trackerRes.pagination?.total ?? trackerRes.data?.length ?? 0);
      setDepots(depotRes.data || []);
      if (depotRes.data && depotRes.data.length > 0 && !formData.depotId) {
        setFormData(prev => ({ ...prev, depotId: depotRes.data[0]._id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load GPS trackers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [installFilter, statusFilter, depotFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await fleetStaffDeviceService.createGpsTracker({
        ...formData,
        deviceId: formData.deviceId.toUpperCase().trim()
      });
      setIsModalOpen(false);
      setFormData({
        deviceId: '',
        manufacturer: 'Teltonika',
        deviceModel: 'FMB120 GNSS',
        depotId: depots[0]?._id || '',
        supportedProtocols: ['HTTP', 'HTTPS', 'TCP'],
        installationStatus: 'UNINSTALLED'
      });
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to register GPS tracker');
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
              {isTa ? 'வாகன ஜிபிஎஸ் கருவிகள் (GPS Trackers)' : 'Dedicated Vehicle GPS Trackers'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'பேருந்துகளில் பொருத்தப்பட்ட நேரலை ஜிபிஎஸ் டிராக்கிங் கருவிகள் மற்றும் டெலிமெட்ரி இணைப்பு'
                : 'Manage dedicated GNSS / GPS vehicle telematics trackers, protocols, telemetry pulse, and bus mounting'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய ஜிபிஎஸ் சேர்' : 'Register GPS Tracker'}</span>
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
                placeholder={isTa ? 'சாதன எண் அல்லது மாடல் தேடுக...' : 'Search tracker ID, model, IMEI...'}
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
              value={installFilter}
              onChange={e => setInstallFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து நிறுவல் நிலைகள்' : 'All Installation States'}</option>
              <option value="INSTALLED">{isTa ? 'பொருத்தப்பட்டுள்ளது' : 'INSTALLED'}</option>
              <option value="UNINSTALLED">{isTa ? 'பொருத்தப்படவில்லை' : 'UNINSTALLED'}</option>
              <option value="MAINTENANCE_REMOVED">{isTa ? 'பராமரிப்பில் கழற்றப்பட்டது' : 'MAINTENANCE_REMOVED'}</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="STANDBY">STANDBY</option>
              <option value="FAULTY">FAULTY</option>
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

      {/* Tracker Table */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            {isTa ? 'பதிவு செய்யப்பட்ட ஜிபிஎஸ் கருவிகள்' : 'Registered GPS Trackers'} ({total})
          </h2>
        </div>

        {isLoading ? (
          <div className="mgmt-empty-state">
            <Radio size={36} className="mgmt-empty-icon animate-pulse" />
            <p>{isTa ? 'ஜிபிஎஸ் கருவிகள் ஏற்றப்படுகின்றன...' : 'Loading GPS trackers...'}</p>
          </div>
        ) : trackers.length === 0 ? (
          <div className="mgmt-empty-state">
            <Radio size={36} className="mgmt-empty-icon" />
            <p>{isTa ? 'ஜிபிஎஸ் கருவிகள் எதுவும் கிடைக்கவில்லை' : 'No GPS trackers match your search criteria'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'சாதன எண்' : 'Tracker ID'}</th>
                  <th>{isTa ? 'மாடல் & நெறிமுறைகள்' : 'Model & Protocols'}</th>
                  <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
                  <th>{isTa ? 'பொருத்தப்பட்ட பேருந்து' : 'Mounted Bus'}</th>
                  <th>{isTa ? 'நிறுவல் நிலை' : 'Installation'}</th>
                  <th>{isTa ? 'தொடர்பு நிலை' : 'Telemetry Status'}</th>
                  <th>{isTa ? 'நிலை' : 'Operational Status'}</th>
                </tr>
              </thead>
              <tbody>
                {trackers.map(tracker => (
                  <tr key={tracker.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-black-900)' }}>
                        {tracker.deviceId}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Make: {tracker.manufacturer}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tracker.deviceModel}</div>
                      <div style={{ fontSize: '11px', color: '#4B5563' }}>
                        {tracker.supportedProtocols ? tracker.supportedProtocols.join(', ') : 'HTTP, TCP'}
                      </div>
                    </td>
                    <td>{tracker.depot?.nameEn || '—'}</td>
                    <td>
                      {tracker.currentAssignedBus ? (
                        <span className="mgmt-badge" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '12px', fontWeight: 700 }}>
                          <Bus size={12} style={{ marginRight: '4px' }} />
                          {tracker.currentAssignedBus.registrationNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{isTa ? 'பொருத்தப்படவில்லை' : 'Unmounted'}</span>
                      )}
                    </td>
                    <td>
                      <span className={`mgmt-badge ${
                        tracker.installationStatus === 'INSTALLED' ? 'mgmt-badge-active' :
                        tracker.installationStatus === 'MAINTENANCE_REMOVED' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                      }`}>
                        {tracker.installationStatus || 'UNINSTALLED'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tracker.isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                            <Wifi size={12} /> Live Pulse
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#9CA3AF' }}>
                            <WifiOff size={12} /> Offline
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>
                        {tracker.lastCommunicationAt ? new Date(tracker.lastCommunicationAt).toLocaleTimeString() : 'No signal yet'}
                      </div>
                    </td>
                    <td>
                      <span className={`mgmt-badge ${
                        tracker.status === 'ACTIVE' ? 'mgmt-badge-active' :
                        tracker.status === 'STANDBY' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                      }`}>
                        {tracker.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register GPS Tracker Modal */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{isTa ? 'புதிய ஜிபிஎஸ் சாதனம் பதிவு செய்' : 'Register Dedicated GPS Tracker'}</h3>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'சாதன அடையாள எண்' : 'Tracker ID *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GPS-TN-8001"
                      value={formData.deviceId}
                      onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பணிமனை' : 'Depot *'}</label>
                    <select
                      required
                      value={formData.depotId}
                      onChange={e => setFormData({ ...formData, depotId: e.target.value })}
                      className="mgmt-form-input"
                    >
                      {depots.map(d => (
                        <option key={d._id} value={d._id}>{d.nameEn} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'உற்பத்தியாளர்' : 'Manufacturer *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Teltonika, Coban, Concox"
                      value={formData.manufacturer}
                      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'மாடல்' : 'Device Model *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FMB120 GNSS"
                      value={formData.deviceModel}
                      onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஃபார்ம்வேர்' : 'Firmware Version'}</label>
                    <input
                      type="text"
                      placeholder="e.g. 03.28.02.Rev.00"
                      value={formData.firmwareVersion || ''}
                      onChange={e => setFormData({ ...formData, firmwareVersion: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'நிறுவல் நிலை' : 'Installation Status'}</label>
                    <select
                      value={formData.installationStatus}
                      onChange={e => setFormData({ ...formData, installationStatus: e.target.value as any })}
                      className="mgmt-form-input"
                    >
                      <option value="UNINSTALLED">UNINSTALLED (Depot Inventory)</option>
                      <option value="INSTALLED">INSTALLED (Mounted on bus)</option>
                      <option value="MAINTENANCE_REMOVED">MAINTENANCE_REMOVED</option>
                    </select>
                  </div>
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
                  {isSubmitting ? (isTa ? 'சேமிக்கிறது...' : 'Registering...') : (isTa ? 'பதிவு செய்' : 'Register GPS Tracker')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
