import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Check,
  X,
  Play,
  CheckCircle,
  RefreshCw,
  Ban
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  managementService,
  DepotTransferDto,
  DepotDto
} from '../../../services/api/management.service';
import { busesService } from '../../../services/api/buses.service';
import { BusDto } from '../../../types/domain';
import { ManagementNav } from '../components/ManagementNav';
import '../styles/management.css';

const TRANSFER_REASONS = [
  'FLEET_REBALANCING',
  'MAINTENANCE_RELOCATION',
  'ROUTE_AUGMENTATION',
  'SPECIAL_SERVICE_DUTY',
  'SEASONAL_DEMAND_SHIFT',
  'PERMANENT_TRANSFER'
];

export const DepotTransferPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [transfers, setTransfers] = useState<DepotTransferDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dropdown reference data
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [buses, setBuses] = useState<BusDto[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    transferNumber: `TR-${Date.now().toString().slice(-6)}`,
    busId: '',
    fromDepotId: '',
    toDepotId: '',
    reason: 'FLEET_REBALANCING',
    reasonDetails: '',
    notes: ''
  });

  const fetchTransfers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;

      const [res, depotsRes, busesRes] = await Promise.all([
        managementService.listTransfers(params),
        managementService.listDepots(),
        busesService.getBuses({ limit: 100 })
      ]);

      setTransfers(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setDepots(depotsRes.data || []);
      setBuses(busesRes.data || []);

      if (depotsRes.data && depotsRes.data.length >= 2 && !formData.fromDepotId) {
        setFormData(prev => ({
          ...prev,
          fromDepotId: depotsRes.data[0]._id,
          toDepotId: depotsRes.data[1]._id
        }));
      }
      if (busesRes.data && busesRes.data.length > 0 && !formData.busId) {
        setFormData(prev => ({ ...prev, busId: busesRes.data[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load depot transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const handleAction = async (
    actionFn: (id: string, notes?: string) => Promise<any>,
    id: string,
    actionName: string
  ) => {
    const notes = prompt(`Enter notes for ${actionName} (optional):`) || undefined;
    try {
      await actionFn(id, notes);
      fetchTransfers();
    } catch (err: any) {
      alert(err?.message || `Failed to ${actionName}`);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (formData.fromDepotId === formData.toDepotId) {
        throw new Error('Source and destination depots cannot be the same');
      }

      await managementService.requestTransfer({
        transferNumber: formData.transferNumber.trim(),
        busId: formData.busId,
        fromDepotId: formData.fromDepotId,
        toDepotId: formData.toDepotId,
        reason: formData.reason,
        reasonDetails: formData.reasonDetails.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });

      setIsModalOpen(false);
      setFormData({
        transferNumber: `TR-${Date.now().toString().slice(-6)}`,
        busId: buses[0]?.id || '',
        fromDepotId: depots[0]?._id || '',
        toDepotId: depots[1]?._id || '',
        reason: 'FLEET_REBALANCING',
        reasonDetails: '',
        notes: ''
      });
      fetchTransfers();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to request transfer');
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
              {isTa ? 'பணிமனை இடமாற்றங்கள்' : 'Depot Fleet Transfers'}
            </h1>
            <p className="mgmt-subtitle">
              {isTa
                ? 'பணிமனைகளுக்கு இடையிலான பேருந்து இடமாற்ற விண்ணப்பங்கள், ஒப்புதல்கள் மற்றும் கடற்படை மறுஒதுக்கீடு'
                : 'Inter-depot transfer requests, multi-stage approval workflow, and atomic fleet reassignment'}
            </p>
          </div>
          <button
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                transferNumber: `TR-${Date.now().toString().slice(-6)}`
              }));
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{isTa ? 'இடமாற்ற விண்ணப்பம்' : 'Request Transfer'}</span>
          </button>
        </div>
      </div>

      <ManagementNav />

      {/* Filter bar */}
      <div className="mgmt-controls-bar">
        <div className="mgmt-filter-group">
          <select
            className="mgmt-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Transfer Statuses'}</option>
            <option value="REQUESTED">REQUESTED (விண்ணப்பிக்கப்பட்டது)</option>
            <option value="APPROVED">APPROVED (ஒப்புதல் அளிக்கப்பட்டது)</option>
            <option value="IN_TRANSIT">IN_TRANSIT (பயணத்தில் உள்ளது)</option>
            <option value="COMPLETED">COMPLETED (நிறைவடைந்தது)</option>
            <option value="REJECTED">REJECTED (நிராகரிக்கப்பட்டது)</option>
            <option value="CANCELLED">CANCELLED (ரத்து செய்யப்பட்டது)</option>
          </select>
        </div>

        <button
          onClick={fetchTransfers}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
        </button>
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
              <th>{isTa ? 'இடமாற்ற எண்' : 'Transfer No'}</th>
              <th>{isTa ? 'பேருந்து' : 'Bus Details'}</th>
              <th>{isTa ? 'புறப்படும் பணிமனை' : 'From Depot'}</th>
              <th>{isTa ? 'செல்லும் பணிமனை' : 'To Depot'}</th>
              <th>{isTa ? 'காரணம்' : 'Reason'}</th>
              <th>{isTa ? 'நிலை' : 'Status'}</th>
              <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்கள்' : 'Lifecycle Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  {isTa ? 'இடமாற்றங்கள் ஏற்றப்படுகின்றன...' : 'Loading transfers...'}
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="mgmt-empty-state">
                  <ArrowLeftRight size={36} className="mgmt-empty-icon" />
                  <p>{isTa ? 'இடமாற்ற விண்ணப்பங்கள் எதுவும் இல்லை' : 'No depot transfers found'}</p>
                </td>
              </tr>
            ) : (
              transfers.map(tr => (
                <tr key={tr._id}>
                  <td style={{ fontWeight: 800, color: '#000' }}>{tr.transferNumber}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{tr.busId?.registrationNumber || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Fleet: {tr.busId?.fleetNumber || 'N/A'} • {tr.busId?.vehicleType || ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tr.fromDepotId?.nameEn || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{tr.fromDepotId?.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tr.toDepotId?.nameEn || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{tr.toDepotId?.code}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{tr.reason}</div>
                    {tr.reasonDetails && (
                      <div style={{ fontSize: '11px', color: '#666', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tr.reasonDetails}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`mgmt-pill mgmt-pill-${tr.status.toLowerCase()}`}>
                      {tr.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {tr.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleAction(managementService.approveTransfer, tr._id, 'Approve')}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#166534', backgroundColor: '#DCFCE7' }}
                            title="Approve Transfer"
                          >
                            <Check size={12} style={{ marginRight: '3px' }} />
                            {isTa ? 'ஒப்புதல்' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleAction(managementService.rejectTransfer, tr._id, 'Reject')}
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#991B1B' }}
                            title="Reject Transfer"
                          >
                            <X size={12} style={{ marginRight: '3px' }} />
                            {isTa ? 'நிராகரி' : 'Reject'}
                          </button>
                        </>
                      )}

                      {tr.status === 'APPROVED' && (
                        <>
                          <button
                            onClick={() => handleAction(managementService.startTransferTransit, tr._id, 'Start Transit')}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Dispatch bus to transit"
                          >
                            <Play size={12} style={{ marginRight: '3px' }} />
                            {isTa ? 'பயணம் தொடங்கு' : 'Start Transit'}
                          </button>
                          <button
                            onClick={() => handleAction(managementService.cancelTransfer, tr._id, 'Cancel')}
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#991B1B' }}
                            title="Cancel Transfer"
                          >
                            <Ban size={12} style={{ marginRight: '3px' }} />
                            {isTa ? 'ரத்து' : 'Cancel'}
                          </button>
                        </>
                      )}

                      {tr.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleAction(managementService.completeTransfer, tr._id, 'Complete Transfer')}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#10B981', color: '#fff' }}
                          title="Complete transfer & atomically reassign bus depot"
                        >
                          <CheckCircle size={12} style={{ marginRight: '3px' }} />
                          {isTa ? 'இடமாற்றத்தை நிறைவுசெய்' : 'Complete Transfer'}
                        </button>
                      )}

                      {(tr.status === 'COMPLETED' || tr.status === 'REJECTED' || tr.status === 'CANCELLED') && (
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          {isTa ? 'முடிவுற்றது' : 'Terminal state'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
        {isTa ? `மொத்த இடமாற்றங்கள்: ${total}` : `Total Transfers: ${total}`}
      </div>

      {/* Modal: Request Transfer */}
      {isModalOpen && (
        <div className="mgmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">
                {isTa ? 'பணிமனை இடமாற்ற விண்ணப்பம்' : 'Request Depot Transfer'}
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

            <form onSubmit={handleRequestSubmit}>
              <div className="mgmt-modal-body">
                {modalError && (
                  <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px' }}>
                    {modalError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'இடமாற்ற எண்' : 'Transfer Number *'}</label>
                    <input
                      type="text"
                      required
                      className="mgmt-form-input"
                      value={formData.transferNumber}
                      onChange={e => setFormData({ ...formData, transferNumber: e.target.value })}
                    />
                  </div>

                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'பேருந்து' : 'Select Bus *'}</label>
                    <select
                      required
                      className="mgmt-select"
                      value={formData.busId}
                      onChange={e => {
                        const bId = e.target.value;
                        const bus = buses.find(b => b.id === bId);
                        setFormData({
                          ...formData,
                          busId: bId,
                          fromDepotId: (bus as any)?.depotId || formData.fromDepotId
                        });
                      }}
                    >
                      {buses.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.registrationNumber} ({b.fleetNumber}) - {b.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'புறப்படும் பணிமனை (From)' : 'Origin Depot *'}</label>
                    <select
                      required
                      className="mgmt-select"
                      value={formData.fromDepotId}
                      onChange={e => setFormData({ ...formData, fromDepotId: e.target.value })}
                    >
                      {depots.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mgmt-form-group">
                    <label className="mgmt-form-label">{isTa ? 'செல்லும் பணிமனை (To)' : 'Destination Depot *'}</label>
                    <select
                      required
                      className="mgmt-select"
                      value={formData.toDepotId}
                      onChange={e => setFormData({ ...formData, toDepotId: e.target.value })}
                    >
                      {depots.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'இடமாற்றக் காரணம்' : 'Transfer Reason *'}</label>
                  <select
                    className="mgmt-select"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  >
                    {TRANSFER_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'காரண விவரங்கள்' : 'Reason Details'}</label>
                  <textarea
                    rows={2}
                    placeholder={isTa ? 'எ.கா. திருவிழா கூட்ட நெரிசல் காரணமாக கூடுதல் பேருந்து தேவை' : 'e.g. Festival peak augmentation'}
                    className="mgmt-form-textarea"
                    value={formData.reasonDetails}
                    onChange={e => setFormData({ ...formData, reasonDetails: e.target.value })}
                  />
                </div>

                <div className="mgmt-form-group">
                  <label className="mgmt-form-label">{isTa ? 'செயல்பாட்டுக் குறிப்புகள்' : 'Operational Notes'}</label>
                  <input
                    type="text"
                    placeholder={isTa ? 'குறிப்புகள் ஏதேனும் இருப்பின்' : 'Optional notes'}
                    className="mgmt-form-input"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
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
                  {isSubmitting ? (isTa ? 'விண்ணப்பிக்கப்படுகிறது...' : 'Submitting...') : (isTa ? 'விண்ணப்பி' : 'Submit Transfer Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
