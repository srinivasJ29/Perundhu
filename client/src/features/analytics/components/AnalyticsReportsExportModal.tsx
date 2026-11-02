import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { analyticsService, ReportExportParams } from '../../../services/api/analytics.service';
import { Download, FileText, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AnalyticsReportsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsReportsExportModal: React.FC<AnalyticsReportsExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [reportType, setReportType] = useState<ReportExportParams['reportType']>('FLEET_OVERVIEW');
  const [format, setFormat] = useState<'JSON' | 'CSV'>('CSV');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await analyticsService.exportReport({
        reportType,
        format
      });

      // Trigger browser file download
      const blob = new Blob([result.data], { type: result.contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `perundhu_${reportType.toLowerCase()}_${Date.now()}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(
        isTa
          ? 'அறிக்கை வெற்றிகரமாகப் பதிவிறக்கப்பட்டது!'
          : 'Report successfully generated and downloaded!'
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isTa ? 'அறிக்கையைப் பதிவிறக்குவதில் பிழை.' : 'Failed to download report.')
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="export-modal-backdrop">
      <div
        className="modal-content analytics-export-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="analytics-export-modal"
      >
        <div className="modal-header">
          <div className="title-group">
            <Download size={20} className="text-primary" />
            <h3>{isTa ? 'அதிகாரப்பூர்வ போக்குவரத்து பகுப்பாய்வு அறிக்கை' : 'Official Transit Analytics Export'}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="export-notice">
            <ShieldCheck size={16} className="text-success" />
            <span>
              {isTa
                ? 'அனைத்து அறிக்கைகளும் முழு தரவு ஆதார விவரங்களுடன் (Data Provenance) மற்றும் தனிநபர் அடையாளங்கள் இன்றி (Zero PII) உருவாக்கப்படுகின்றன.'
                : 'All exports include full Data Provenance disclosures and zero personally identifiable information (Zero PII).'}
            </span>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">{isTa ? 'அறிக்கை வகை:' : 'Report Dataset:'}</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="form-select"
            >
              <option value="FLEET_OVERVIEW">
                {isTa ? 'கடற்படை கண்ணோட்டம் & ஜிபிஎஸ் நிலை (Fleet Overview)' : 'Fleet Overview & GPS Telemetry'}
              </option>
              <option value="ROUTE_PERFORMANCE">
                {isTa ? 'வழித்தட பயண நேரம் & நெரிசல் (Route Performance)' : 'Route Performance & Segment Travel Times'}
              </option>
              <option value="SCHEDULE_ADHERENCE">
                {isTa ? 'அட்டவணை கடைபிடிப்பு & நேரந்தவறாமை (Schedule Adherence)' : 'Schedule Adherence & Delays'}
              </option>
              <option value="FLEET_UTILIZATION">
                {isTa ? 'பணிமனை பயன்பாட்டுத் திறன் (Fleet Utilization)' : 'Fleet Utilization & Depot Deployment'}
              </option>
              <option value="RECOMMENDATIONS">
                {isTa ? 'மேம்பாட்டுப் பரிந்துரைகள் (Optimization Recommendations)' : 'Optimization Recommendations & Review History'}
              </option>
            </select>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">{isTa ? 'கோப்பு வடிவம்:' : 'Export Format:'}</label>
            <div className="format-radio-group">
              <label className={`format-pill ${format === 'CSV' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value="CSV"
                  checked={format === 'CSV'}
                  onChange={() => setFormat('CSV')}
                />
                <FileText size={14} />
                <span>CSV (Spreadsheet)</span>
              </label>

              <label className={`format-pill ${format === 'JSON' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value="JSON"
                  checked={format === 'JSON'}
                  onChange={() => setFormat('JSON')}
                />
                <FileText size={14} />
                <span>JSON (Machine Readable)</span>
              </label>
            </div>
          </div>

          {successMessage && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger">
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {isTa ? 'மூடு' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={16} />
            <span>{isExporting ? (isTa ? 'உருவாக்குகிறது...' : 'Generating...') : (isTa ? 'பதிவிறக்கு' : 'Download Report')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

