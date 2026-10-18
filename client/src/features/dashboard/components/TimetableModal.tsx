/**
 * PERUNDHU (பேருந்து) — Timetable Modal Component
 * Accessible dialog displaying verified scheduled departures from /routes/:routeId/timetable.
 * Strictly presents planned operational schedules without misrepresenting them as live GPS predictions.
 */

import React, { useEffect, useRef } from 'react';
import { X, Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { TimetableModalState } from '../types';

interface TimetableModalProps {
  modalState: TimetableModalState;
  onClose: () => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  modalState,
  onClose
}) => {
  const { t, language } = useLanguage();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modalState.isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [modalState.isOpen]);

  if (!modalState.isOpen) {
    return null;
  }

  // Handle directions array from backend response
  const rawData = modalState.data as unknown as {
    directions?: Array<{
      directionId: string;
      directionCode: 'OUTBOUND' | 'INBOUND';
      originStop?: { nameEn: string; nameTa: string };
      destinationStop?: { nameEn: string; nameTa: string };
      departures?: Array<{
        tripId: string;
        tripCode: string;
        departureTime: string;
        arrivalTime: string;
        status: string;
      }>;
    }>;
    outbound?: Array<{
      tripId: string;
      tripCode: string;
      departureTime: string;
      arrivalTime: string;
      status: string;
    }>;
    inbound?: Array<{
      tripId: string;
      tripCode: string;
      departureTime: string;
      arrivalTime: string;
      status: string;
    }>;
  };

  const outboundDepartures =
    rawData?.directions?.find((d) => d.directionCode === 'OUTBOUND')?.departures ||
    rawData?.outbound ||
    [];

  const inboundDepartures =
    rawData?.directions?.find((d) => d.directionCode === 'INBOUND')?.departures ||
    rawData?.inbound ||
    [];

  return (
    <div
      className="dashboard-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timetable-modal-title"
      onClick={onClose}
    >
      <div
        className="dashboard-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-box">
              <Calendar size={20} color="var(--color-primary-teal)" />
            </div>
            <div>
              <h3 id="timetable-modal-title" className="dashboard-modal-title">
                {t('dashboard.timetable_modal_title')} —{' '}
                {language === 'ta' ? `தடம் ${modalState.routeNumber}` : `Route ${modalState.routeNumber}`}
              </h3>
              <Badge variant="info">
                <span>TNSTC Madurai Region</span>
              </Badge>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="dashboard-modal-close-btn"
            onClick={onClose}
            aria-label={t('dashboard.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Schedule Notice Disclaimer */}
        <div className="dashboard-modal-notice">
          <AlertCircle size={16} color="var(--color-primary-teal)" />
          <span>{t('dashboard.timetable_notice')}</span>
        </div>

        {/* Loading Spinner */}
        {modalState.isLoading && (
          <div className="dashboard-modal-loading">
            <div className="loading-spinner-sm" aria-hidden="true" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {!modalState.isLoading && modalState.error && (
          <div className="dashboard-modal-error">
            <p>{modalState.error}</p>
          </div>
        )}

        {/* Content */}
        {!modalState.isLoading && !modalState.error && (
          <div className="dashboard-timetable-sections">
            {/* Outbound */}
            <div className="timetable-direction-column">
              <h4 className="timetable-direction-heading">
                {t('dashboard.outbound_departures')}
              </h4>
              {outboundDepartures.length > 0 ? (
                <div className="timetable-trips-list">
                  {outboundDepartures.map((trip) => (
                    <div key={trip.tripId} className="timetable-trip-card">
                      <div className="trip-time-box">
                        <Clock size={14} />
                        <strong>{trip.departureTime}</strong>
                        <ArrowRight size={12} />
                        <span>{trip.arrivalTime}</span>
                      </div>
                      <div className="trip-code-box">
                        <code>{trip.tripCode}</code>
                        <Badge variant="neutral">{trip.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timetable-empty">
                  <span>{t('dashboard.no_timetable_available')}</span>
                </div>
              )}
            </div>

            {/* Inbound */}
            <div className="timetable-direction-column">
              <h4 className="timetable-direction-heading">
                {t('dashboard.inbound_departures')}
              </h4>
              {inboundDepartures.length > 0 ? (
                <div className="timetable-trips-list">
                  {inboundDepartures.map((trip) => (
                    <div key={trip.tripId} className="timetable-trip-card">
                      <div className="trip-time-box">
                        <Clock size={14} />
                        <strong>{trip.departureTime}</strong>
                        <ArrowRight size={12} />
                        <span>{trip.arrivalTime}</span>
                      </div>
                      <div className="trip-code-box">
                        <code>{trip.tripCode}</code>
                        <Badge variant="neutral">{trip.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timetable-empty">
                  <span>{t('dashboard.no_timetable_available')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="dashboard-modal-footer">
          <Button type="button" variant="primary" onClick={onClose}>
            <span>{t('dashboard.close')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
