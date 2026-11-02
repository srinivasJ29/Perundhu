import React from 'react';
import { RoutePerformanceDto } from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';
import { Navigation, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

interface RoutePerformanceWidgetProps {
  data: RoutePerformanceDto;
  onRefresh?: () => void;
}

export const RoutePerformanceWidget: React.FC<RoutePerformanceWidgetProps> = ({ data }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const getCongestionClass = (level: string) => {
    switch (level) {
      case 'CONGESTED':
        return 'badge-danger';
      case 'HIGH':
        return 'badge-warning';
      case 'MODERATE':
        return 'badge-info';
      default:
        return 'badge-success';
    }
  };

  return (
    <div className="analytics-widget-container" data-testid="route-performance-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <Navigation className="widget-icon" size={20} />
          <div>
            <h3>
              {isTa ? 'வழித்தட பயண நேர பகுப்பாய்வு' : 'Route Journey Duration & Congestion Analysis'}
            </h3>
            <div className="widget-subtitle">
              <span className="route-badge">{data.routeNumber}</span>
              <span>{isTa ? data.displayTitleTa : data.displayTitleEn}</span>
              <span className="direction-tag">({data.directionCode})</span>
            </div>
          </div>
        </div>
        <div className="sample-period-tag">
          <Clock size={14} />
          <span>{data.samplePeriod.observedTripsCount} {isTa ? 'பயணங்கள் கண்காணிக்கப்பட்டன' : 'Observed Trips'}</span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="performance-kpi-grid">
        <div className="perf-metric-card">
          <span className="metric-label">{isTa ? 'சராசரி பயண நேரம்' : 'Average Journey Duration'}</span>
          <div className="metric-val text-primary">{data.averageDurationMinutes} <span className="unit">{isTa ? 'நிமிடம்' : 'mins'}</span></div>
          <span className="metric-sub">{isTa ? 'அட்டவணை:' : 'Scheduled:'} {data.scheduledDurationMinutes} {isTa ? 'நிமிடம்' : 'mins'}</span>
        </div>

        <div className="perf-metric-card">
          <span className="metric-label">{isTa ? 'P50 பயண நேரம்' : 'P50 (Median Duration)'}</span>
          <div className="metric-val">{data.p50DurationMinutes} <span className="unit">{isTa ? 'நிமிடம்' : 'mins'}</span></div>
          <span className="metric-sub">{isTa ? '50% பயணங்கள் முடிந்தது' : '50% trips completed within'}</span>
        </div>

        <div className="perf-metric-card">
          <span className="metric-label">{isTa ? 'P90 பயண நேரம் (உச்சநேரம்)' : 'P90 (Peak Duration)'}</span>
          <div className="metric-val text-warning">{data.p90DurationMinutes} <span className="unit">{isTa ? 'நிமிடம்' : 'mins'}</span></div>
          <span className="metric-sub">{isTa ? '90% பயணங்கள் முடிந்தது' : '90% trips completed within'}</span>
        </div>

        <div className="perf-metric-card">
          <span className="metric-label">{isTa ? 'நிறுத்த தாமத நேரம்' : 'Avg Dwell Time'}</span>
          <div className="metric-val">{data.averageDwellTimeSeconds} <span className="unit">{isTa ? 'விநாடி' : 'sec'}</span></div>
          <span className="metric-sub">{isTa ? 'நிறுத்தத்தில் பயணிகள் ஏறும் நேரம்' : 'Passenger boarding/alighting'}</span>
        </div>
      </div>

      {/* Segment Breakdown Table */}
      <div className="segment-analysis-section">
        <div className="sub-header">
          <AlertCircle size={16} />
          <h4>{isTa ? 'நிறுத்தங்களுக்கிடையேயான பயண நேர மாறுபாடு & நெரிசல்' : 'Inter-Stop Segment Travel Time & Chokepoints'}</h4>
        </div>

        <div className="table-responsive">
          <table className="segment-table">
            <thead>
              <tr>
                <th>{isTa ? 'தொடக்க நிறுத்தம்' : 'From Stop'}</th>
                <th>{isTa ? 'சேருமிடம்' : 'To Stop'}</th>
                <th>{isTa ? 'திட்டமிடப்பட்ட நேரம்' : 'Scheduled'}</th>
                <th>{isTa ? 'கண்காணிக்கப்பட்ட நேரம்' : 'Observed'}</th>
                <th>{isTa ? 'தாமத மாறுபாடு' : 'Delay Deviation'}</th>
                <th>{isTa ? 'நெரிசல் நிலை' : 'Congestion'}</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((seg, idx) => (
                <tr key={`${seg.fromStopId}-${seg.toStopId}-${idx}`}>
                  <td><strong>{isTa ? seg.fromStopNameTa : seg.fromStopNameEn}</strong></td>
                  <td><strong>{isTa ? seg.toStopNameTa : seg.toStopNameEn}</strong></td>
                  <td>{seg.scheduledTravelTimeMinutes} {isTa ? 'நிமி' : 'min'}</td>
                  <td>{seg.averageTravelTimeMinutes} {isTa ? 'நிமி' : 'min'}</td>
                  <td>
                    <span className={seg.delayDeviationMinutes > 2 ? 'text-danger font-semibold' : 'text-success'}>
                      {seg.delayDeviationMinutes > 0 ? `+${seg.delayDeviationMinutes}` : seg.delayDeviationMinutes} {isTa ? 'நிமி' : 'min'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getCongestionClass(seg.congestionLevel)}`}>
                      {seg.congestionLevel}
                    </span>
                  </td>
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

