import React from 'react';
import { ScheduleAdherenceDto } from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScheduleAdherenceWidgetProps {
  data: ScheduleAdherenceDto;
}

export const ScheduleAdherenceWidget: React.FC<ScheduleAdherenceWidgetProps> = ({ data }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const { delayDistribution } = data;
  const total =
    delayDistribution.onTime +
    delayDistribution.slightDelay +
    delayDistribution.moderateDelay +
    delayDistribution.severeDelay +
    delayDistribution.early;

  return (
    <div className="analytics-widget-container" data-testid="schedule-adherence-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <CheckCircle2 className="widget-icon text-success" size={20} />
          <div>
            <h3>{isTa ? 'அட்டவணை கடைபிடிப்பு & நேரந்தவறாமை' : 'Schedule Adherence & Punctuality'}</h3>
            <div className="widget-subtitle">
              <span className="route-badge">{data.routeNumber}</span>
              <span>{isTa ? data.displayTitleTa : data.displayTitleEn}</span>
            </div>
          </div>
        </div>
        <div className="sample-period-tag">
          <Clock size={14} />
          <span>{data.samplePeriod.evaluatedTripsCount} {isTa ? 'மதிப்பாய்வு செய்யப்பட்ட பயணங்கள்' : 'Evaluated Trips'}</span>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="adherence-kpi-row">
        <div className="adherence-card highlight-success">
          <span className="adh-label">{isTa ? 'நேரந்தவறாமை விகிதம் (On-Time)' : 'On-Time Compliance (≤5m)'}</span>
          <div className="adh-val text-success">{data.onTimePercentage}%</div>
          <span className="adh-desc">{isTa ? 'அட்டவணைப்படி 5 நிமிடத்திற்குள்' : 'Within -2 to +5 min window'}</span>
        </div>

        <div className="adherence-card">
          <span className="adh-label">{isTa ? 'தாமத விகிதம் (>5 நிமிடம்)' : 'Delayed Ratio (>5m)'}</span>
          <div className="adh-val text-warning">{data.delayedPercentage}%</div>
          <span className="adh-desc">{isTa ? '5 நிமிடத்திற்கும் அதிகமான தாமதம்' : 'More than 5 minutes late'}</span>
        </div>

        <div className="adherence-card">
          <span className="adh-label">{isTa ? 'முன்கூட்டியே வருகை (>2 நிமிடம்)' : 'Early Departures (>2m)'}</span>
          <div className="adh-val text-info">{data.earlyPercentage}%</div>
          <span className="adh-desc">{isTa ? 'முன்கூட்டியே சென்ற பேருந்துகள்' : 'Departed before schedule'}</span>
        </div>

        <div className="adherence-card">
          <span className="adh-label">{isTa ? 'சராசரி தாமதம்' : 'Average Delay'}</span>
          <div className="adh-val">{data.averageDelayMinutes} <span className="unit">{isTa ? 'நிமி' : 'min'}</span></div>
          <span className="adh-desc">{isTa ? 'அதிகபட்ச தாமதம்: ' : 'Max observed delay: '} {data.maxDelayMinutes} {isTa ? 'நிமி' : 'min'}</span>
        </div>
      </div>

      {/* Delay Distribution Buckets */}
      <div className="delay-buckets-section">
        <div className="sub-header">
          <AlertTriangle size={16} />
          <h4>{isTa ? 'தாமத கால இடைவெளி பகிர்வு' : 'Delay Distribution Buckets'}</h4>
        </div>
        <div className="bucket-bars">
          <div className="bucket-bar-item">
            <div className="bucket-info">
              <span>{isTa ? 'நேரத்திற்கு (≤ 5 நிமிடம்)' : 'On-Time (≤ 5 mins)'}</span>
              <strong>{delayDistribution.onTime} ({total > 0 ? Math.round((delayDistribution.onTime / total) * 100) : 0}%)</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-success"
                style={{ width: `${total > 0 ? (delayDistribution.onTime / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bucket-bar-item">
            <div className="bucket-info">
              <span>{isTa ? 'குறைந்த தாமதம் (5 - 10 நிமிடம்)' : 'Slight Delay (5 - 10 mins)'}</span>
              <strong>{delayDistribution.slightDelay} ({total > 0 ? Math.round((delayDistribution.slightDelay / total) * 100) : 0}%)</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-info"
                style={{ width: `${total > 0 ? (delayDistribution.slightDelay / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bucket-bar-item">
            <div className="bucket-info">
              <span>{isTa ? 'நடுத்தர தாமதம் (10 - 20 நிமிடம்)' : 'Moderate Delay (10 - 20 mins)'}</span>
              <strong>{delayDistribution.moderateDelay} ({total > 0 ? Math.round((delayDistribution.moderateDelay / total) * 100) : 0}%)</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-warning"
                style={{ width: `${total > 0 ? (delayDistribution.moderateDelay / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bucket-bar-item">
            <div className="bucket-info">
              <span>{isTa ? 'கடுமையான தாமதம் (> 20 நிமிடம்)' : 'Severe Delay (> 20 mins)'}</span>
              <strong>{delayDistribution.severeDelay} ({total > 0 ? Math.round((delayDistribution.severeDelay / total) * 100) : 0}%)</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-danger"
                style={{ width: `${total > 0 ? (delayDistribution.severeDelay / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stop-by-stop adherence */}
      <div className="stop-adherence-section">
        <div className="sub-header">
          <Clock size={16} />
          <h4>{isTa ? 'நிறுத்த வாரியான நேரந்தவறாமை' : 'Stop-by-Stop Punctuality Profile'}</h4>
        </div>
        <div className="table-responsive">
          <table className="adherence-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isTa ? 'பேருந்து நிறுத்தம்' : 'Bus Stop'}</th>
                <th>{isTa ? 'நேரந்தவறாமை விகிதம்' : 'On-Time Compliance'}</th>
                <th>{isTa ? 'சராசரி தாமதம்' : 'Avg Delay (mins)'}</th>
              </tr>
            </thead>
            <tbody>
              {data.adherenceByStop.map((stop) => (
                <tr key={stop.stopId}>
                  <td><code>{stop.sequence}</code></td>
                  <td><strong>{isTa ? stop.stopNameTa : stop.stopNameEn}</strong></td>
                  <td>
                    <div className="inline-progress">
                      <span className="font-semibold">{stop.onTimePercentage}%</span>
                      <div className="mini-track">
                        <div
                          className={`mini-fill ${stop.onTimePercentage >= 80 ? 'fill-success' : stop.onTimePercentage >= 70 ? 'fill-warning' : 'fill-danger'}`}
                          style={{ width: `${stop.onTimePercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>+{stop.averageDelayMinutes} {isTa ? 'நிமிடம்' : 'mins'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="provenance-footer">
        <ShieldCheck size={14} className="shield-icon" />
        <span>
          {isTa ? 'தரவு ஆதாரம்:' : 'Data Provenance:'} {data.dataProvenance.sourceOrganization} • {data.dataProvenance.sourceReference} • {data.dataProvenance.classification}
        </span>
      </div>
    </div>
  );
};

