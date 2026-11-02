import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { ReportType } from '../../../types/domain';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  depotId?: string;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  depotId
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [reportType, setReportType] = useState<ReportType>('FLEET_STATUS');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    const params = new URLSearchParams({ reportType });
    if (depotId) params.append('depotId', depotId);

    // Trigger direct browser download
    const url = `/api/v1/operations/reports/export?${params.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `perundhu_${reportType.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="op-modal-backdrop" role="dialog" aria-modal="true">
      <div className="op-modal-card">
        <div className="op-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} className="text-teal" />
            <div>
              <h3 className="op-modal-title">
                {isTa ? 'அதிகாரப்பூர்வ CSV அறிக்கை பதிவிறக்கம்' : 'Official Role-Authorized CSV Export'}
              </h3>
              <p className="op-modal-subtitle">
                {isTa
                  ? 'பாதுகாப்பான CSV சூத்திர தடுப்புடன் கூடிய விரிதாள் தரவு'
                  : 'Secured export with strict formula injection protection'}
              </p>
            </div>
          </div>
          <button type="button" className="op-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="op-modal-body">
          <div className="op-form-group">
            <label className="op-form-label">
              {isTa ? 'அறிக்கை வகையைத் தேர்ந்தெடுக்கவும்:' : 'Select Report Category:'}
            </label>

            <select
              className="op-form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="FLEET_STATUS">
                {isTa ? 'பேருந்துகள் மற்றும் நிலை அறிக்கை (Fleet Status)' : 'Fleet Status & Allocation Report'}
              </option>
              <option value="TRIP_COMPLETION">
                {isTa ? 'பயணங்கள் நிறைவு மற்றும் தாமத அறிக்கை (Trip Completion)' : 'Trip Completion & Schedule Performance'}
              </option>
              <option value="STAFF_ASSIGNMENTS">
                {isTa ? 'ஓட்டுநர் & நடத்துநர் பணி ஒதுக்கீடுகள் (Staff Duty Roster)' : 'Driver & Conductor Duty Assignments'}
              </option>
              <option value="GPS_DEVICE_HEALTH">
                {isTa ? 'ஜிபிஎஸ் கருவிகள் & பேட்டரி நிலை (GPS Telemetry Health)' : 'GPS Tracker Connectivity & Battery Health'}
              </option>
            </select>
          </div>

          <div className="op-security-notice">
            <ShieldAlert size={16} />
            <span>
              {isTa
                ? 'பாதுகாப்பு உறுதி: தனிப்பட்ட தொலைபேசி மற்றும் சூத்திர வன்பொருள் எண்குறியீடுகள் முழுமையாக சுத்திகரிக்கப்பட்டுள்ளன.'
                : 'Security Compliance: CSV Formula Injection defended. Private contact details redacted.'}
            </span>
          </div>

          <div className="op-modal-footer">
            <button type="button" className="op-btn-outline" onClick={onClose} disabled={isExporting}>
              {isTa ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button type="button" className="op-btn-primary" onClick={handleExport} disabled={isExporting}>
              <Download size={16} />
              <span>{isExporting ? (isTa ? 'பதிவிறக்குகிறது...' : 'Generating...') : (isTa ? 'CSV பதிவிறக்கு' : 'Export CSV')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

