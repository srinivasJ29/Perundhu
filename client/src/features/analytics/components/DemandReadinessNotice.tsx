import React from 'react';
import { DemandAnalyticsDto } from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';
import { ShieldAlert, AlertTriangle, CheckCircle, Database, Cpu, Users, ShieldCheck } from 'lucide-react';

interface DemandReadinessNoticeProps {
  data: DemandAnalyticsDto;
}

export const DemandReadinessNotice: React.FC<DemandReadinessNoticeProps> = ({ data }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  if (data.status === 'DATA_NOT_AVAILABLE') {
    return (
      <div className="analytics-widget-container demand-readiness-widget" data-testid="demand-readiness-notice">
        <div className="governance-alert-box">
          <div className="alert-box-header">
            <ShieldAlert size={28} className="text-warning" />
            <div>
              <h3>
                {isTa
                  ? 'பயணிகள் தேவை & கட்டணத் தரவு தயார்நிலை அறிக்கை'
                  : 'Passenger Demand & Ticketing Data Readiness Diagnostic'}
              </h3>
              <span className="badge badge-warning">
                {isTa ? 'தரவு கிடைக்கவில்லை (DATA_NOT_AVAILABLE)' : 'DATA_NOT_AVAILABLE'}
              </span>
            </div>
          </div>

          <div className="governance-policy-notice">
            <p className="policy-statement">
              <strong>{isTa ? 'பேருந்து தரவுக் கொள்கை:' : 'PERUNDHU Data Governance Directive:'}</strong>{' '}
              {isTa
                ? data.dataReadiness.diagnosticMessageTa
                : data.dataReadiness.diagnosticMessageEn}
            </p>
            <div className="governance-highlight">
              <AlertTriangle size={16} />
              <span>{data.dataReadiness.governanceNotice}</span>
            </div>
          </div>

          <div className="missing-prerequisites-grid">
            <div className="prereq-card">
              <Cpu size={20} className="prereq-icon text-warning" />
              <div className="prereq-info">
                <h5>{isTa ? 'ETM பயணச்சீட்டு API இணைப்பு' : 'ETM Ticketing Stream'}</h5>
                <span className="prereq-status text-danger">{isTa ? 'இணைக்கப்படவில்லை' : 'Pending Activation'}</span>
                <p>{isTa ? 'நிகழ்நேர பயணச்சீட்டு பரிவர்த்தனை தரவு இணைப்பு தேவை.' : 'Physical hardware registered; live transaction stream awaiting IT gateway key.'}</p>
              </div>
            </div>

            <div className="prereq-card">
              <Users size={20} className="prereq-icon text-warning" />
              <div className="prereq-info">
                <h5>{isTa ? 'APC சென்சார் தரவு' : 'APC Passenger Counter'}</h5>
                <span className="prereq-status text-muted">{isTa ? 'பொருத்தப்படவில்லை' : 'Not Deployed'}</span>
                <p>{isTa ? 'பேருந்து வாசலில் ஏறும்/இறங்கும் நபர்களைக் கணக்கிடும் சென்சார்.' : 'Automated door optical sensor feeds for physical boarding verification.'}</p>
              </div>
            </div>

            <div className="prereq-card">
              <Database size={20} className="prereq-icon text-info" />
              <div className="prereq-info">
                <h5>{isTa ? 'நடத்துநர் வழிப்பட்டியல்' : 'Waybill Reconciliation'}</h5>
                <span className="prereq-status text-warning">{isTa ? 'பணிமனை ஒத்திசைவு நிலுவை' : 'Manual Depot Sync'}</span>
                <p>{isTa ? 'தினசரி வழிப்பட்டியல் கணக்குகள் கணினிமயமாக்கப்பட்டு வருகின்றன.' : 'Daily trip ticket collections reconciled post-shift at depot.'}</p>
              </div>
            </div>
          </div>

          <div className="provenance-footer">
            <ShieldCheck size={14} className="shield-icon" />
            <span>
              {isTa ? 'தரவு வகைப்பாடு:' : 'Data Classification:'} {data.dataProvenance.classification} • {data.dataProvenance.verificationStatus} • {data.dataProvenance.sourceReference}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // When records exist (DATA_AVAILABLE)
  return (
    <div className="analytics-widget-container" data-testid="demand-readiness-notice">
      <div className="widget-header">
        <div className="widget-title-group">
          <CheckCircle className="widget-icon text-success" size={20} />
          <div>
            <h3>{isTa ? 'பயணிகள் தேவை & பயண எண்ணிக்கை' : 'Passenger Demand & Boarding Analytics'}</h3>
            <span className="badge badge-success">{isTa ? 'சரிபார்க்கப்பட்டது' : 'DATA_AVAILABLE'}</span>
          </div>
        </div>
      </div>

      <div className="demand-summary-cards">
        <div className="summary-card">
          <span className="label">{isTa ? 'மொத்த ஏறிய பயணிகள்' : 'Total Boardings'}</span>
          <div className="val">{data.summary?.totalBoardings || 0}</div>
        </div>
        <div className="summary-card">
          <span className="label">{isTa ? 'மொத்த இறங்கிய பயணிகள்' : 'Total Alightings'}</span>
          <div className="val">{data.summary?.totalAlightings || 0}</div>
        </div>
      </div>

      {data.hourlyPattern && data.hourlyPattern.length > 0 && (
        <div className="hourly-pattern-section">
          <h4>{isTa ? 'மணிநேர வாரியான பயணிகள் நெரிசல்' : 'Hourly Demand Distribution'}</h4>
          <div className="hourly-bars">
            {data.hourlyPattern.map((p) => (
              <div key={p.hour} className="hourly-bar-col">
                <div className="bar-val">{p.boardings}</div>
                <div className="hourly-bar-track">
                  <div className="hourly-bar-fill" style={{ height: `${Math.min(100, p.boardings * 2)}%` }} />
                </div>
                <div className="hour-label">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="provenance-footer">
        <ShieldCheck size={14} className="shield-icon" />
        <span>
          {isTa ? 'தரவு ஆதாரம்:' : 'Data Provenance:'} {data.dataProvenance.sourceOrganization} • {data.dataProvenance.classification}
        </span>
      </div>
    </div>
  );
};

