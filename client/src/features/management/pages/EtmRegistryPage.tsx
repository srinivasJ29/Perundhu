import React, { useEffect, useState } from 'react';
import { Plus, Search, Cpu, Battery, Wifi, WifiOff, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fleetStaffDeviceService,
  DeviceRegistryDto,
  CreateEtmPayload,
  GpsAvailabilityStatus
} from '../../../services/api/fleetStaffDevice.service';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const EtmRegistryPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [etms, setEtms] = useState<DeviceRegistryDto[]>([]);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [gpsFilter, setGpsFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [depotFilter, setDepotFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateEtmPayload>({
    deviceId: '',
    manufacturer: 'Analogics Tech',
    deviceModel: 'SmartPrint-700',
    depotId: '',
    operatingSystem: 'Android / RTOS',
    firmwareVersion: 'v2.4.1',
    gpsAvailabilityStatus: 'UNKNOWN',
    batteryHealthPercent: 95
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (gpsFilter) params.gpsAvailabilityStatus = gpsFilter;
      if (statusFilter) params.status = statusFilter;
      if (depotFilter) params.depotId = depotFilter;

      const [etmRes, depotRes] = await Promise.all([
        fleetStaffDeviceService.listEtms(params),
        managementService.listDepots({ limit: 100 })
      ]);

      setEtms(etmRes.data || []);
      setTotal(etmRes.pagination?.total ?? etmRes.data?.length ?? 0);
      setDepots(depotRes.data || []);
      if (depotRes.data && depotRes.data.length > 0 && !formData.depotId) {
        setFormData(prev => ({ ...prev, depotId: depotRes.data[0]._id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load ETM registry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gpsFilter, statusFilter, depotFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await fleetStaffDeviceService.createEtm({
        ...formData,
        deviceId: formData.deviceId.toUpperCase().trim()
      });
      setIsModalOpen(false);
      setFormData({
        deviceId: '',
        manufacturer: 'Analogics Tech',
        deviceModel: 'SmartPrint-700',
        depotId: depots[0]?._id || '',
        operatingSystem: 'Android / RTOS',
        firmwareVersion: 'v2.4.1',
        gpsAvailabilityStatus: 'UNKNOWN',
        batteryHealthPercent: 95
      });
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to register ETM device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGpsBadge = (status: GpsAvailabilityStatus) => {
    switch (status) {
      case 'VERIFIED_AVAILABLE':
        return (
          <span className="mgmt-badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
            {status}
          </span>
        );
      case 'VERIFIED_UNAVAILABLE':
        return (
          <span className="mgmt-badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }}>
            {status}
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="mgmt-badge" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontWeight: 700 }}>
            <AlertTriangle size={11} style={{ marginRight: '3px' }} />
            {status} (Unconfirmed)
          </span>
        );
    }
  };

  return (
    <div className="mgmt-page-container app-container">
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <div>
            <h1 className="mgmt-title font-shining-title">
              {isTa ? 'மின்னணு டிக்கெட் இயந்திரங்கள் (ETM)' : 'Electronic Ticketing Machine (ETM) Registry'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'நடத்துநர் டிக்கெட் வழங்கும் இயந்திரங்களின் விவரங்கள், ஜிபிஎஸ் சரிபார்ப்பு நிலை மற்றும் இணைப்பு'
                : 'Inventory of conductor ticketing hardware, telematics verification, firmware, and depot assignment'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய ETM சேர்' : 'Register ETM Device'}</span>
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
                placeholder={isTa ? 'சாதன எண் அல்லது மாடல் தேடுக...' : 'Search device ID, model, manufacturer...'}
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
              value={gpsFilter}
              onChange={e => setGpsFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து ஜிபிஎஸ் நிலைகள்' : 'All GPS Statuses'}</option>
              <option value="UNKNOWN">UNKNOWN (Unverified)</option>
              <option value="VERIFIED_AVAILABLE">VERIFIED AVAILABLE</option>
              <option value="VERIFIED_UNAVAILABLE">VERIFIED UNAVAILABLE</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து செயல்பாட்டு நிலைகள்' : 'All Statuses'}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="STANDBY">STANDBY</option>
              <option value="FAULTY">FAULTY</option>
              <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
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

      {/* ETM Devices Table */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            {isTa ? 'பதிவு செய்யப்பட்ட ETM சாதனங்கள்' : 'Registered ETM Devices'} ({total})
          </h2>
        </div>

        {isLoading ? (
          <div className="mgmt-empty-state">
            <Cpu size={36} className="mgmt-empty-icon animate-pulse" />
            <p>{isTa ? 'சாதனங்கள் ஏற்றப்படுகின்றன...' : 'Loading ETM devices...'}</p>
          </div>
        ) : etms.length === 0 ? (
          <div className="mgmt-empty-state">
            <Cpu size={36} className="mgmt-empty-icon" />
            <p>{isTa ? 'சாதனங்கள் எதுவும் கிடைக்கவில்லை' : 'No ETM devices match your criteria'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'சாதன எண்' : 'Device ID'}</th>
                  <th>{isTa ? 'உற்பத்தியாளர் & மாடல்' : 'Make & Model'}</th>
                  <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
                  <th>{isTa ? 'ஜிபிஎஸ் நிலை' : 'ETM GPS Capability'}</th>
                  <th>{isTa ? 'பேட்டரி & தொடர்பு' : 'Battery & Pulse'}</th>
                  <th>{isTa ? 'ஒதுக்கீடு' : 'Current Assignment'}</th>
                  <th>{isTa ? 'செயல்பாட்டு நிலை' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {etms.map(device => (
                  <tr key={device.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-black-900)' }}>
                        {device.deviceId}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        OS: {device.operatingSystem || 'RTOS'} • FW: {device.firmwareVersion || 'v1.0'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{device.manufacturer}</div>
                      <div style={{ fontSize: '12px', color: '#4B5563' }}>{device.deviceModel}</div>
                    </td>
                    <td>{device.depot?.nameEn || '—'}</td>
                    <td>{getGpsBadge(device.gpsAvailabilityStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                          <Battery size={13} color={device.batteryHealthPercent && device.batteryHealthPercent > 20 ? '#166534' : '#DC2626'} />
                          {device.batteryHealthPercent ?? 100}%
                        </span>
                        {device.isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                            <Wifi size={12} /> Live
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#9CA3AF' }}>
                            <WifiOff size={12} /> Off
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>
                        {device.lastCommunicationAt ? new Date(device.lastCommunicationAt).toLocaleTimeString() : 'No pulse'}
                      </div>
                    </td>
                    <td>
                      {device.currentAssignedCrew ? (
                        <div style={{ fontSize: '12px' }}>
                          Conductor: <strong>{device.currentAssignedCrew.fullName}</strong> (#{device.currentAssignedCrew.employeeId})
                        </div>
                      ) : device.currentAssignedBus ? (
                        <div style={{ fontSize: '12px' }}>
                          Bus: <strong>{device.currentAssignedBus.registrationNumber}</strong>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{isTa ? 'ஒதுக்கப்படவில்லை' : 'Standby in Depot'}</span>
                      )}
                    </td>
                    <td>
                      <span className={`mgmt-badge ${
                        device.status === 'ACTIVE' ? 'mgmt-badge-active' :
                        device.status === 'STANDBY' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register ETM Modal */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{isTa ? 'புதிய ETM பதிவு செய்' : 'Register New ETM Terminal'}</h3>
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
                    <label className="mgmt-form-label">{isTa ? 'சாதன அடையாள எண்' : 'Device ID *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ETM-MDU-7001"
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
                      placeholder="e.g. Analogics Tech, VeriFone, Evolute"
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
                      placeholder="e.g. SmartPrint-700"
                      value={formData.deviceModel}
                      onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'இயக்க முறைமை' : 'Operating System'}</label>
                    <input
                      type="text"
                      placeholder="e.g. Android 8.1 / FreeRTOS"
                      value={formData.operatingSystem || ''}
                      onChange={e => setFormData({ ...formData, operatingSystem: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஃபார்ம்வேர்' : 'Firmware Version'}</label>
                    <input
                      type="text"
                      placeholder="e.g. v2.4.1-patch3"
                      value={formData.firmwareVersion || ''}
                      onChange={e => setFormData({ ...formData, firmwareVersion: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'ஜிபிஎஸ் திறன் நிலை' : 'ETM GPS Capability Status *'}</label>
                    <select
                      value={formData.gpsAvailabilityStatus}
                      onChange={e => setFormData({ ...formData, gpsAvailabilityStatus: e.target.value as any })}
                      className="mgmt-form-input"
                    >
                      <option value="UNKNOWN">UNKNOWN (Default - Hardware not yet verified)</option>
                      <option value="VERIFIED_AVAILABLE">VERIFIED AVAILABLE (Hardware GPS confirmed)</option>
                      <option value="VERIFIED_UNAVAILABLE">VERIFIED UNAVAILABLE (No GPS module)</option>
                    </select>
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பேட்டரி ஆரோக்கியம் (%)' : 'Battery Health (%)'}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.batteryHealthPercent || 100}
                      onChange={e => setFormData({ ...formData, batteryHealthPercent: Number(e.target.value) })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'சீரியல் எண்' : 'Serial Number'}</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-89230198"
                      value={formData.serialNumber || ''}
                      onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'IMEI எண்' : 'Device IMEI'}</label>
                    <input
                      type="text"
                      placeholder="e.g. 864201029384756"
                      value={formData.imei || ''}
                      onChange={e => setFormData({ ...formData, imei: e.target.value })}
                      className="mgmt-form-input"
                    />
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
                  {isSubmitting ? (isTa ? 'சேமிக்கிறது...' : 'Registering...') : (isTa ? 'பதிவு செய்' : 'Register ETM')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
