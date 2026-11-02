import React, { useState } from 'react';
import { X, Check, Bus, UserCheck, Users, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { operationsService } from '../../../services/api';

interface TripAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    tripCode: string;
    routeNumber: string;
    departureTime: string;
    assignedBusNumber?: string;
    assignedBusId?: string;
    assignedDriverName?: string;
    assignedDriverId?: string;
    assignedConductorName?: string;
    assignedConductorId?: string;
  } | null;
  availableBuses: Array<{ id: string; registrationNumber: string; fleetNumber: string; status: string }>;
  availableDrivers: Array<{ id: string; fullName: string; badgeNumber: string }>;
  availableConductors: Array<{ id: string; fullName: string; badgeNumber: string }>;
  onAssignmentSuccess: () => void;
}

export const TripAssignmentModal: React.FC<TripAssignmentModalProps> = ({
  isOpen,
  onClose,
  trip,
  availableBuses,
  availableDrivers,
  availableConductors,
  onAssignmentSuccess
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [assignmentType, setAssignmentType] = useState<'BUS' | 'DRIVER' | 'CONDUCTOR'>('BUS');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) {
      setError(isTa ? 'தயவுசெய்து ஒரு பதிவைத் தேர்ந்தெடுக்கவும்' : 'Please select an entity');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (assignmentType === 'BUS') {
        await operationsService.assignTripBus(trip.id, selectedEntityId);
      } else if (assignmentType === 'DRIVER') {
        await operationsService.assignTripDriver(trip.id, selectedEntityId);
      } else {
        await operationsService.assignTripConductor(trip.id, selectedEntityId);
      }
      onAssignmentSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || (isTa ? 'ஒதுக்கீடு தோல்வியடைந்தது' : 'Assignment failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="op-modal-backdrop" role="dialog" aria-modal="true">
      <div className="op-modal-card">
        <div className="op-modal-header">
          <div>
            <h3 className="op-modal-title">
              {isTa ? 'பயண ஒதுக்கீடு பணிமனை மேலாண்மை' : 'Trip Assignment Management'}
            </h3>
            <p className="op-modal-subtitle">
              {trip.tripCode} • {isTa ? 'வழித்தடம்' : 'Route'} {trip.routeNumber} ({trip.departureTime})
            </p>
          </div>
          <button type="button" className="op-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="op-modal-body">
          {error && (
            <div className="op-modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="op-type-tabs">
            <button
              type="button"
              className={`op-type-btn ${assignmentType === 'BUS' ? 'active' : ''}`}
              onClick={() => {
                setAssignmentType('BUS');
                setSelectedEntityId('');
                setError(null);
              }}
            >
              <Bus size={15} />
              <span>{isTa ? 'பேருந்து' : 'Bus'}</span>
            </button>

            <button
              type="button"
              className={`op-type-btn ${assignmentType === 'DRIVER' ? 'active' : ''}`}
              onClick={() => {
                setAssignmentType('DRIVER');
                setSelectedEntityId('');
                setError(null);
              }}
            >
              <UserCheck size={15} />
              <span>{isTa ? 'ஓட்டுநர்' : 'Driver'}</span>
            </button>

            <button
              type="button"
              className={`op-type-btn ${assignmentType === 'CONDUCTOR' ? 'active' : ''}`}
              onClick={() => {
                setAssignmentType('CONDUCTOR');
                setSelectedEntityId('');
                setError(null);
              }}
            >
              <Users size={15} />
              <span>{isTa ? 'நடத்துநர்' : 'Conductor'}</span>
            </button>
          </div>

          <div className="op-form-group">
            <label className="op-form-label">
              {assignmentType === 'BUS' && (isTa ? 'கிடைக்கும் பேருந்தைத் தேர்ந்தெடுக்கவும்:' : 'Select Available Bus:')}
              {assignmentType === 'DRIVER' && (isTa ? 'கிடைக்கும் ஓட்டுநரைத் தேர்ந்தெடுக்கவும்:' : 'Select Available Driver:')}
              {assignmentType === 'CONDUCTOR' && (isTa ? 'கிடைக்கும் நடத்துநரைத் தேர்ந்தெடுக்கவும்:' : 'Select Available Conductor:')}
            </label>

            <select
              className="op-form-select"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              required
            >
              <option value="">{isTa ? '-- தேர்ந்தெடுக்கவும் --' : '-- Choose option --'}</option>
              {assignmentType === 'BUS' &&
                availableBuses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.registrationNumber} ({b.fleetNumber}) — {b.status}
                  </option>
                ))}
              {assignmentType === 'DRIVER' &&
                availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.badgeNumber})
                  </option>
                ))}
              {assignmentType === 'CONDUCTOR' &&
                availableConductors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.badgeNumber})
                  </option>
                ))}
            </select>
          </div>

          <div className="op-modal-footer">
            <button type="button" className="op-btn-outline" onClick={onClose} disabled={isSubmitting}>
              {isTa ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button type="submit" className="op-btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              <span>{isSubmitting ? (isTa ? 'ஒதுக்குகிறது...' : 'Assigning...') : (isTa ? 'ஒதுக்கு' : 'Confirm Assignment')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

