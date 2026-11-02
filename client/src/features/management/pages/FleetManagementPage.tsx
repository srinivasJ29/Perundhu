import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Bus, Eye, Fuel, Shield, Cpu, Radio, X } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { fleetStaffDeviceService, FleetBusDto, RegisterBusPayload } from '../../../services/api/fleetStaffDevice.service';
import { managementService, DepotDto } from '../../../services/api/management.service';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

export const FleetManagementPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [buses, setBuses] = useState<FleetBusDto[]>([]);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fuelFilter, setFuelFilter] = useState<string>('');
  const [depotFilter, setDepotFilter] = useState<string>('');
  const [reserveOnly, setReserveOnly] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegisterBusPayload>({
    registrationNumber: '',
    fleetNumber: '',
    depotName: '',
    depotId: '',
    vehicleType: 'ORDINARY_NON_AC',
    manufacturer: 'Ashok Leyland',
    vehicleModel: 'Viking BS6',
    fuelType: 'DIESEL',
    seatingCapacity: 45,
    chassisNumber: '',
    engineNumber: '',
    isReserveFleet: false
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (fuelFilter) params.fuelType = fuelFilter;
      if (depotFilter) params.depotId = depotFilter;
      if (reserveOnly) params.isReserveFleet = 'true';

      const [busRes, depotRes] = await Promise.all([
        fleetStaffDeviceService.listBuses(params),
        managementService.listDepots({ limit: 100 })
      ]);

      setBuses(busRes.data || []);
      setTotal(busRes.pagination?.total ?? busRes.data?.length ?? 0);
      setDepots(depotRes.data || []);
      if (depotRes.data && depotRes.data.length > 0 && !formData.depotId) {
        setFormData(prev => ({
          ...prev,
          depotId: depotRes.data[0]._id,
          depotName: depotRes.data[0].nameEn
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fleet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, fuelFilter, depotFilter, reserveOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const selectedDepot = depots.find(d => d._id === formData.depotId);
      const payload: RegisterBusPayload = {
        ...formData,
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        fleetNumber: formData.fleetNumber.toUpperCase().trim(),
        depotName: selectedDepot ? selectedDepot.nameEn : formData.depotName,
        chassisNumber: formData.chassisNumber?.trim() || undefined,
        engineNumber: formData.engineNumber?.trim() || undefined
      };

      await fleetStaffDeviceService.createBus(payload);
      setIsModalOpen(false);
      setFormData({
        registrationNumber: '',
        fleetNumber: '',
        depotName: '',
        depotId: depots[0]?._id || '',
        vehicleType: 'ORDINARY_NON_AC',
        manufacturer: 'Ashok Leyland',
        vehicleModel: 'Viking BS6',
        fuelType: 'DIESEL',
        seatingCapacity: 45,
        chassisNumber: '',
        engineNumber: '',
        isReserveFleet: false
      });
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to register bus');
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
              {isTa ? 'பேருந்துக் கடற்படை மேலாண்மை' : 'Fleet Registry & Vehicles'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'அனைத்து அரசுப் போக்குவரத்துக் கழகப் பேருந்துகளின் விவரக்குறிப்புகள் மற்றும் சாதன ஒதுக்கீடு'
                : 'Manage Tamil Nadu public transit buses, vehicle specifications, depots, and assigned telematics'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'புதிய பேருந்து சேர்' : 'Register Bus'}</span>
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
                placeholder={isTa ? 'எண் அல்லது வாகன குறியீடு தேடுக...' : 'Search registration or fleet number...'}
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
              <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
              <option value="IN_SERVICE">{isTa ? 'சேவையில் உள்ளது' : 'In Service'}</option>
              <option value="MAINTENANCE">{isTa ? 'பராமரிப்பில்' : 'Maintenance'}</option>
              <option value="OFFLINE">{isTa ? 'முடக்கம்' : 'Offline'}</option>
            </select>

            <select
              value={fuelFilter}
              onChange={e => setFuelFilter(e.target.value)}
              className="mgmt-form-input"
              style={{ width: 'auto' }}
            >
              <option value="">{isTa ? 'அனைத்து எரிபொருள்கள்' : 'All Fuel Types'}</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric</option>
              <option value="CNG">CNG</option>
              <option value="HYBRID">Hybrid</option>
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

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={reserveOnly}
                onChange={e => setReserveOnly(e.target.checked)}
              />
              <span>{isTa ? 'ரிசர்வ் மட்டும்' : 'Reserve Only'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="mgmt-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            {isTa ? 'பதிவு செய்யப்பட்ட பேருந்துகள்' : 'Registered Fleet Buses'} ({total})
          </h2>
        </div>

        {isLoading ? (
          <div className="mgmt-empty-state">
            <Bus size={36} className="mgmt-empty-icon animate-pulse" />
            <p>{isTa ? 'விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading fleet registry...'}</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="mgmt-empty-state">
            <Bus size={36} className="mgmt-empty-icon" />
            <p>{isTa ? 'பேருந்துகள் எதுவும் கிடைக்கவில்லை' : 'No buses match your search criteria'}</p>
          </div>
        ) : (
          <div className="mgmt-table-container">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>{isTa ? 'பதிவு எண்' : 'Registration'}</th>
                  <th>{isTa ? 'குறியீடு' : 'Fleet No'}</th>
                  <th>{isTa ? 'பணிமனை' : 'Depot'}</th>
                  <th>{isTa ? 'வகை & எரிபொருள்' : 'Type & Fuel'}</th>
                  <th>{isTa ? 'இருக்கைகள்' : 'Seats'}</th>
                  <th>{isTa ? 'சாதனங்கள்' : 'Devices'}</th>
                  <th>{isTa ? 'நிலை' : 'Status'}</th>
                  <th style={{ textAlign: 'right' }}>{isTa ? 'நடவடிக்கை' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => (
                  <tr key={bus.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-black-900)' }}>
                        {bus.registrationNumber}
                      </div>
                      {bus.isReserveFleet && (
                        <span className="mgmt-badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10px' }}>
                          <Shield size={10} style={{ marginRight: '3px' }} />
                          {isTa ? 'ரிசர்வ்' : 'Reserve'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{bus.fleetNumber}</td>
                    <td>{bus.depot?.nameEn || bus.depotName || '—'}</td>
                    <td>
                      <div>{bus.vehicleType.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Fuel size={12} />
                        {bus.fuelType || 'DIESEL'} • {bus.manufacturer || 'Ashok Leyland'}
                      </div>
                    </td>
                    <td>{bus.seatingCapacity ?? 45}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {bus.assignedGpsTrackerId ? (
                          <span className="mgmt-badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '11px' }} title="Dedicated GPS Tracker Attached">
                            <Radio size={11} style={{ marginRight: '3px' }} /> GPS
                          </span>
                        ) : (
                          <span className="mgmt-badge" style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '11px' }}>
                            No GPS
                          </span>
                        )}
                        {bus.assignedEtmDeviceId ? (
                          <span className="mgmt-badge" style={{ backgroundColor: '#E0E7FF', color: '#3730A3', fontSize: '11px' }} title={`ETM Machine Attached (GPS: ${bus.assignedEtmDeviceId.gpsAvailabilityStatus})`}>
                            <Cpu size={11} style={{ marginRight: '3px' }} /> ETM
                          </span>
                        ) : (
                          <span className="mgmt-badge" style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '11px' }}>
                            No ETM
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`mgmt-badge ${
                        bus.status === 'IN_SERVICE' ? 'mgmt-badge-active' :
                        bus.status === 'MAINTENANCE' ? 'mgmt-badge-secondary' : 'mgmt-badge-inactive'
                      }`}>
                        {bus.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/operations/fleet/${bus.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} />
                        <span>{isTa ? 'பார்வை' : 'Details'}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Bus Modal */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop">
          <div className="mgmt-modal">
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'புதிய பேருந்து பதிவு செய்க' : 'Register New Fleet Bus'}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பதிவு எண்' : 'Registration No *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN-58-N-2450"
                      value={formData.registrationNumber}
                      onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'கடற்படை குறியீடு' : 'Fleet Number *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MDU-EXP-104"
                      value={formData.fleetNumber}
                      onChange={e => setFormData({ ...formData, fleetNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'வாகன வகை' : 'Vehicle Type *'}</label>
                    <select
                      value={formData.vehicleType}
                      onChange={e => setFormData({ ...formData, vehicleType: e.target.value as any })}
                      className="mgmt-form-input"
                    >
                      <option value="ORDINARY_NON_AC">Ordinary Non-AC</option>
                      <option value="DELUXE_NON_AC">Deluxe Non-AC</option>
                      <option value="LOW_FLOOR_AC">Low Floor AC</option>
                      <option value="POINT_TO_POINT">Point-to-Point Express</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'உற்பத்தியாளர்' : 'Manufacturer'}</label>
                    <input
                      type="text"
                      placeholder="e.g. Ashok Leyland, Tata Motors"
                      value={formData.manufacturer || ''}
                      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'மாடல்' : 'Vehicle Model'}</label>
                    <input
                      type="text"
                      placeholder="e.g. Viking BS6"
                      value={formData.vehicleModel || ''}
                      onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'எரிபொருள் வகை' : 'Fuel Type'}</label>
                    <select
                      value={formData.fuelType}
                      onChange={e => setFormData({ ...formData, fuelType: e.target.value as any })}
                      className="mgmt-form-input"
                    >
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="CNG">CNG</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'இருக்கைகள்' : 'Seating Capacity'}</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={formData.seatingCapacity || 45}
                      onChange={e => setFormData({ ...formData, seatingCapacity: Number(e.target.value) })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'சேஸிஸ் எண்' : 'Chassis Number'}</label>
                    <input
                      type="text"
                      placeholder="e.g. MB1...12345"
                      value={formData.chassisNumber || ''}
                      onChange={e => setFormData({ ...formData, chassisNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'என்ஜின் எண்' : 'Engine Number'}</label>
                    <input
                      type="text"
                      placeholder="e.g. ENG...98765"
                      value={formData.engineNumber || ''}
                      onChange={e => setFormData({ ...formData, engineNumber: e.target.value })}
                      className="mgmt-form-input"
                    />
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isReserveFleet}
                    onChange={e => setFormData({ ...formData, isReserveFleet: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {isTa ? 'ரிசர்வ் கடற்படையாக பதிவு செய்க' : 'Designate as Reserve Fleet bus'}
                  </span>
                </label>
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
                  {isSubmitting ? (isTa ? 'சேமிக்கிறது...' : 'Registering...') : (isTa ? 'பதிவு செய்' : 'Register Bus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

