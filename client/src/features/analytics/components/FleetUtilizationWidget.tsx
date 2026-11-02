import React from 'react';
import { FleetUtilizationDto } from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';
import { BarChart3, Building2, Calendar, ShieldCheck, Bus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FleetUtilizationWidgetProps {
  data: FleetUtilizationDto;
}

export const FleetUtilizationWidget: React.FC<FleetUtilizationWidgetProps> = ({ data }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <div className="analytics-widget-container" data-testid="fleet-utilization-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <BarChart3 className="widget-icon" size={20} />
          <div>
            <h3>{isTa ? 'கடற்படை பயன்பாட்டு விகிதம் & பணிமனை மேலாண்மை' : 'Fleet Utilization & Deployment Efficiency'}</h3>
            <span className="widget-subtitle">
              <Calendar size={14} />
              {isTa ? 'மதிப்பீட்டுக் காலம்: கடந்த 7 நாட்கள்' : 'Evaluation Window: Last 7 Days'}
            </span>
          </div>
        </div>
        <div className="utilization-rate-badge">
          <span className="rate-val">{data.vehicleUtilizationRate}%</span>
          <span className="rate-label">{isTa ? 'பயன்பாட்டு விகிதம்' : 'Fleet Utilization'}</span>
        </div>
      </div>

      {/* Utilization Metric Cards */}
      <div className="utilization-kpi-row">
        <div className="util-metric-card">
          <Bus size={20} className="text-primary mb-2" />
          <span className="metric-label">{isTa ? 'மொத்த கடற்படை' : 'Total Fleet Size'}</span>
          <div className="metric-val">{data.fleetSize}</div>
          <span className="metric-sub">{isTa ? 'பதிவு செய்யப்பட்ட பேருந்துகள்' : 'Registered in Madurai Division'}</span>
        </div>

        <div className="util-metric-card">
          <CheckCircle2 size={20} className="text-success mb-2" />
          <span className="metric-label">{isTa ? 'திட்டமிடப்பட்ட / ஒதுக்கப்பட்ட' : 'Scheduled / Assigned Trips'}</span>
          <div className="metric-val text-success">
            {data.assignedTripsCount} / {data.scheduledTripsCount}
          </div>
          <span className="metric-sub">{isTa ? 'பயண ஒதுக்கீடு நிறைவு' : 'Trip roster assignment'}</span>
        </div>

        <div className="util-metric-card">
          <AlertTriangle size={20} className="text-warning mb-2" />
          <span className="metric-label">{isTa ? 'ஒதுக்கப்படாத பேருந்துகள்' : 'Unassigned Standby Fleet'}</span>
          <div className="metric-val text-warning">{data.unassignedVehiclesCount}</div>
          <span className="metric-sub">{isTa ? 'உடனடி பயன்பாட்டிற்கு தயார்' : 'Available for immediate dispatch'}</span>
        </div>

        <div className="util-metric-card">
          <AlertTriangle size={20} className="text-danger mb-2" />
          <span className="metric-label">{isTa ? 'ஜிபிஎஸ் இடைவெளி உள்ளவை' : 'Telemetry Gaps (Stale)'}</span>
          <div className="metric-val text-danger">{data.telemetryGapsCount}</div>
          <span className="metric-sub">{isTa ? 'இயக்கத்தில் உள்ள சமிக்ஞை இடைவெளி' : 'Active buses with signal delay'}</span>
        </div>
      </div>

      {/* Depot Breakdown Table */}
      <div className="depot-breakdown-section">
        <div className="sub-header">
          <Building2 size={16} />
          <h4>{isTa ? 'பணிமனை வாரியாக பயன்பாட்டுத் திறன்' : 'Depot-Level Fleet Deployment Efficiency'}</h4>
        </div>

        <div className="table-responsive">
          <table className="depot-utilization-table">
            <thead>
              <tr>
                <th>{isTa ? 'பணிமனை பெயர்' : 'Depot Name'}</th>
                <th>{isTa ? 'மொத்த பேருந்துகள்' : 'Total Fleet'}</th>
                <th>{isTa ? 'சேவையில் (In Service)' : 'In Service'}</th>
                <th>{isTa ? 'ரிசர்வ் (Reserve)' : 'Reserve'}</th>
                <th>{isTa ? 'பராமரிப்பு (Maintenance)' : 'Maint.'}</th>
                <th>{isTa ? 'பயன்பாட்டு விகிதம்' : 'Utilization %'}</th>
              </tr>
            </thead>
            <tbody>
              {data.depotUtilization.map((d) => (
                <tr key={d.depotId}>
                  <td><strong>{d.depotName}</strong></td>
                  <td>{d.totalFleet}</td>
                  <td><span className="text-success font-semibold">{d.inServiceCount}</span></td>
                  <td><span className="text-info">{d.reserveCount}</span></td>
                  <td><span className="text-warning">{d.maintenanceCount}</span></td>
                  <td>
                    <div className="inline-progress">
                      <span className="font-semibold">{d.utilizationPercentage}%</span>
                      <div className="mini-track">
                        <div
                          className={`mini-fill ${d.utilizationPercentage >= 75 ? 'fill-success' : d.utilizationPercentage >= 50 ? 'fill-info' : 'fill-warning'}`}
                          style={{ width: `${d.utilizationPercentage}%` }}
                        />
                      </div>
                    </div>
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

