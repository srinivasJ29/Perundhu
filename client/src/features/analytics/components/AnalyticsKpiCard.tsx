import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { DataClassification } from '../../../types/domain';

interface AnalyticsKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
  icon?: React.ReactNode;
  classification?: DataClassification;
  calculationBasis?: string;
}

export const AnalyticsKpiCard: React.FC<AnalyticsKpiCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'info',
  icon,
  classification = 'OFFICIAL_VERIFIED',
  calculationBasis
}) => {
  return (
    <div className="analytics-kpi-card" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>

      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        {badge && <span className={`kpi-badge kpi-badge-${badgeType}`}>{badge}</span>}
      </div>

      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}

      <div className="kpi-footer">
        <div className="kpi-classification" title={`Data classification: ${classification}`}>
          <ShieldCheck size={12} className="shield-icon" />
          <span>{classification}</span>
        </div>
        {calculationBasis && (
          <div className="kpi-calc-basis" title={calculationBasis}>
            <Info size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

