import React from 'react';

interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'alert' | 'info' | 'neutral';
  };
  onClick?: () => void;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  onClick
}) => {
  return (
    <div
      className={`op-kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="op-kpi-header">
        <span className="op-kpi-title">{title}</span>
        <div className="op-kpi-icon-wrap" aria-hidden="true">
          {icon}
        </div>
      </div>

      <div className="op-kpi-body">
        <span className="op-kpi-value">{value}</span>
        {badge && (
          <span className={`op-kpi-badge badge-${badge.variant}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="op-kpi-subtitle">{subtitle}</p>}
    </div>
  );
};

