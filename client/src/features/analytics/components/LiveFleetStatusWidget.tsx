import React from 'react';
import { Bus, Radio, Building2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { FleetOverviewKpiDto } from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';

interface LiveFleetStatusWidgetProps {
  data: FleetOverviewKpiDto;
}

export const LiveFleetStatusWidget: React.FC<LiveFleetStatusWidgetProps> = ({ data }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const {
    totalBuses,
    operationalAvailabilityBreakdown: ops,
    gpsFreshnessBreakdown: gps,
    depotDistribution,
    routeDistribution,
    telemetryHealth
  } = data;

  return (
    <div className="analytics-widget-container" data-testid="live-fleet-status-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <Bus className="widget-icon" size={20} />
          <h3>{isTa ? 'நேரலை கடற்படை நிலை & ஜிபிஎஸ் நம்பகத்தன்மை' : 'Live Fleet Status & GPS Telemetry Health'}</h3>
        </div>
        <div className="coverage-badge" title="Telemetry Coverage Ratio">
          <Radio size={14} />
          <span>{isTa ? 'ஜிபிஎஸ் பரப்பு:' : 'GPS Coverage:'} {(telemetryHealth.coverageRatio * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Strict Data Governance Banner */}
      <div className="governance-info-banner">
        <AlertTriangle size={16} className="banner-icon" />
        <div className="banner-text">
          <strong>{isTa ? 'தரவுக் கொள்கை அறிவிப்பு:' : 'Data Governance Principle:'}</strong>{' '}
          {isTa
            ? 'ஜிபிஎஸ் சமிக்ஞை தாமதமானது பேருந்தை செயலற்றதாக மாற்றாது. நிர்வாகப் பதிவு பேருந்து சேவையில் உள்ளதை உறுதிசெய்கிறது.'
            : 'Stale GPS telemetry does not equate to an inactive bus. Administrative fleet records govern vehicle operational availability.'}
        </div>
      </div>

      <div className="fleet-status-comparison-grid">
        {/* Column 1: Administrative Operational State */}
        <div className="status-column">
          <div className="column-title">
            <CheckCircle2 size={16} className="text-success" />
            <h4>{isTa ? 'நிர்வாக இயக்க நிலை' : 'Operational Availability (Roster)'}</h4>
          </div>
          <div className="status-bars-group">
            <div className="status-bar-item">
              <div className="bar-label">
                <span>{isTa ? 'சேவையில் உள்ளவை' : 'In Service'}</span>
                <strong>{ops.inService} ({totalBuses > 0 ? Math.round((ops.inService / totalBuses) * 100) : 0}%)</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-success"
                  style={{ width: `${totalBuses > 0 ? (ops.inService / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span>{isTa ? 'ரிசர்வ் / தயார்நிலை' : 'Reserve Fleet'}</span>
                <strong>{ops.reserve}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-info"
                  style={{ width: `${totalBuses > 0 ? (ops.reserve / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span>{isTa ? 'பராமரிப்பில் உள்ளவை' : 'Maintenance'}</span>
                <strong>{ops.maintenance}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-warning"
                  style={{ width: `${totalBuses > 0 ? (ops.maintenance / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span>{isTa ? 'செயலிழந்தவை' : 'Offline / Inactive'}</span>
                <strong>{ops.offline}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-muted"
                  style={{ width: `${totalBuses > 0 ? (ops.offline / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Live GPS Telemetry Freshness */}
        <div className="status-column">
          <div className="column-title">
            <Radio size={16} className="text-primary" />
            <h4>{isTa ? 'நேரலை ஜிபிஎஸ் புதுப்பிப்பு நிலை' : 'GNSS Telemetry Freshness'}</h4>
          </div>
          <div className="status-bars-group">
            <div className="status-bar-item">
              <div className="bar-label">
                <span className="dot dot-healthy" />
                <span>{isTa ? 'சீரான சமிக்ஞை (<30 விநாடி)' : 'Healthy (<30s)'}</span>
                <strong>{gps.healthy}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-healthy"
                  style={{ width: `${totalBuses > 0 ? (gps.healthy / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span className="dot dot-delayed" />
                <span>{isTa ? 'தாமதமான சமிக்ஞை (30-60 விநாடி)' : 'Delayed (30-60s)'}</span>
                <strong>{gps.delayed}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-delayed"
                  style={{ width: `${totalBuses > 0 ? (gps.delayed / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span className="dot dot-stale" />
                <span>{isTa ? 'பழைய சமிக்ஞை (1-5 நிமிடம்)' : 'Stale (1-5m)'}</span>
                <strong>{gps.stale}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-stale"
                  style={{ width: `${totalBuses > 0 ? (gps.stale / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="status-bar-item">
              <div className="bar-label">
                <span className="dot dot-offline" />
                <span>{isTa ? 'தொடர்பு இல்லை (>5 நிமிடம்)' : 'Offline / Unknown (>5m)'}</span>
                <strong>{gps.offline + gps.unknown}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-offline"
                  style={{ width: `${totalBuses > 0 ? ((gps.offline + gps.unknown) / totalBuses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Depot Distribution Summary */}
      <div className="depot-distribution-section">
        <div className="sub-header">
          <Building2 size={16} />
          <h4>{isTa ? 'பணிமனை வாரியாக கடற்படை ஒதுக்கீடு' : 'Depot-Level Fleet Allocation'}</h4>
        </div>
        <div className="depot-distribution-table-wrap">
          <table className="depot-table">
            <thead>
              <tr>
                <th>{isTa ? 'பணிமனை' : 'Depot Name'}</th>
                <th>{isTa ? 'குறியீடு' : 'Code'}</th>
                <th>{isTa ? 'மொத்த பேருந்துகள்' : 'Total Fleet'}</th>
                <th>{isTa ? 'சேவையில்' : 'In Service'}</th>
                <th>{isTa ? 'ரிசர்வ்' : 'Reserve'}</th>
                <th>{isTa ? 'பராமரிப்பு' : 'Maint.'}</th>
              </tr>
            </thead>
            <tbody>
              {depotDistribution.map((d) => (
                <tr key={d.depotId}>
                  <td><strong>{d.depotName}</strong></td>
                  <td><code>{d.depotCode}</code></td>
                  <td>{d.totalBuses}</td>
                  <td><span className="badge badge-success">{d.activeBuses}</span></td>
                  <td><span className="badge badge-info">{d.reserveBuses}</span></td>
                  <td><span className="badge badge-warning">{d.maintenanceBuses}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Allocation Summary */}
      <div className="route-distribution-section">
        <div className="sub-header">
          <Clock size={16} />
          <h4>{isTa ? 'வழித்தட வாரியாக நேரலை இயக்கம்' : 'Route-Level Active Tracking'}</h4>
        </div>
        <div className="route-pills-grid">
          {routeDistribution.map((r) => (
            <div key={r.routeId} className="route-pill-card">
              <div className="route-pill-header">
                <span className="route-badge">{r.routeNumber}</span>
                <span className="route-name">{isTa ? r.displayTitleTa : r.displayTitleEn}</span>
              </div>
              <div className="route-pill-stats">
                <span>{isTa ? 'ஒதுக்கீடு:' : 'Assigned:'} <strong>{r.assignedBusesCount}</strong></span>
                <span>{isTa ? 'நேரலை கண்காணிப்பு:' : 'Live Tracking:'} <strong className="text-success">{r.activeTrackingBusesCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

