/**
 * PERUNDHU (பேருந்து) — Service Notices & Transit Advisories Banner
 * Displays verified transit announcements, disruptions, route diversions,
 * and festival special operations issued by TNSTC or District Administration.
 */

import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { ServiceAlertDto, ServiceAlertType, ServiceAlertSeverity } from '../../../types/domain';
import { Badge } from '../../../components/common/Badge';

interface ServiceNoticesBannerProps {
  alerts: ServiceAlertDto[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export const ServiceNoticesBanner: React.FC<ServiceNoticesBannerProps> = ({
  alerts,
  isLoading,
  error,
  onRefresh
}) => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const getAlertIcon = (type: ServiceAlertType, severity: ServiceAlertSeverity) => {
    if (severity === 'CRITICAL' || type === 'DISRUPTION') {
      return <ShieldAlert size={18} color="#EF2E33" />;
    }
    if (severity === 'WARNING' || type === 'ROUTE_DIVERSION') {
      return <AlertTriangle size={18} color="#F59E0B" />;
    }
    if (type === 'FESTIVAL_SPECIAL') {
      return <Sparkles size={18} color="#1D7873" />;
    }
    return <Info size={18} color="#1D7873" />;
  };

  const getTypeLabel = (type: ServiceAlertType) => {
    switch (type) {
      case 'FESTIVAL_SPECIAL':
        return language === 'ta' ? 'சிறப்பு இயக்கம்' : 'Festival Special';
      case 'ROUTE_DIVERSION':
        return language === 'ta' ? 'தட மாற்றம்' : 'Route Diversion';
      case 'DISRUPTION':
        return language === 'ta' ? 'சேவை பாதிப்பு' : 'Disruption';
      case 'WEATHER_NOTICE':
        return language === 'ta' ? 'வானிலை அறிவிப்பு' : 'Weather Advisory';
      case 'ADVISORY':
      default:
        return language === 'ta' ? 'பயணிகள் அறிவிப்பு' : 'Advisory';
    }
  };

  if (isLoading) {
    return (
      <section className="service-notices-section loading" aria-label="Service Notices Loading">
        <div className="service-notices-loading-box">
          <div className="spinner" />
          <span>{language === 'ta' ? 'அறிவிப்புகள் சரிபார்க்கப்படுகின்றன...' : 'Querying verified transport notices...'}</span>
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Gracefully degrade if notices backend is unreachable
  }

  return (
    <section
      className="service-notices-section"
      aria-labelledby="service-notices-heading"
      role="region"
    >
      <div className="service-notices-header">
        <div className="service-notices-title-group">
          <Bell size={18} className="service-notices-icon" />
          <h3 id="service-notices-heading" className="service-notices-heading">
            {t('alerts.title')}
          </h3>
          {alerts.length > 0 ? (
            <span className="service-notices-count-badge">
              {alerts.length} {language === 'ta' ? 'அறிவிப்புகள்' : 'Active'}
            </span>
          ) : (
            <span className="service-notices-normal-pill">
              <CheckCircle2 size={13} color="#10B981" />
              <span>{t('alerts.normal_service')}</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onRefresh && (
            <button
              type="button"
              className="service-notices-toggle-btn"
              onClick={onRefresh}
              aria-label={t('common.refresh')}
              title={t('common.refresh')}
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            type="button"
            className="service-notices-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse notices' : 'Expand notices'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="service-notices-body">
          {alerts.length > 0 ? (
            <div className="service-notices-list" role="list">
              {alerts.map((alert) => {
                const title = language === 'ta' ? alert.titleTa : alert.titleEn;
                const desc = language === 'ta' ? alert.descriptionTa : alert.descriptionEn;

                return (
                  <article
                    key={alert.id}
                    className={`service-notice-card severity-${alert.severity.toLowerCase()}`}
                    role="listitem"
                  >
                    <div className="service-notice-card-header">
                      <div className="service-notice-icon-box">
                        {getAlertIcon(alert.alertType, alert.severity)}
                      </div>
                      <div className="service-notice-title-box">
                        <div className="service-notice-badges-row">
                          <span className={`service-notice-type-tag type-${alert.alertType.toLowerCase()}`}>
                            {getTypeLabel(alert.alertType)}
                          </span>
                          {alert.severity === 'CRITICAL' && (
                            <Badge variant="error"><span>CRITICAL</span></Badge>
                          )}
                          {alert.severity === 'WARNING' && (
                            <Badge variant="warning"><span>ATTENTION</span></Badge>
                          )}
                        </div>
                        <h4 className="service-notice-title">{title}</h4>
                      </div>
                    </div>

                    <p className="service-notice-desc">{desc}</p>

                    <div className="service-notice-meta-footer">
                      {/* Affected Routes */}
                      {alert.affectedRouteNumbers && alert.affectedRouteNumbers.length > 0 && (
                        <div className="service-notice-routes-row">
                          <span className="service-notice-meta-lbl">
                            {t('alerts.routes_affected')}:
                          </span>
                          {alert.affectedRouteNumbers.map((r) => (
                            <span key={r} className="service-notice-route-pill">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Source attribution */}
                      <div className="service-notice-source-row">
                        <span className="service-notice-source-org">
                          {alert.sourceOrganization}
                        </span>
                        {alert.sourceUrl && (
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="service-notice-source-link"
                            title="Verify with official source portal"
                            aria-label={`Official source link for ${alert.sourceOrganization}`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Truthful Normal Operations Reassurance Notice */
            <div className="service-notices-empty-box" role="status">
              <CheckCircle2 size={24} color="#10B981" />
              <div>
                <h4 className="service-notices-empty-title">
                  {language === 'ta'
                    ? 'மதுரை முன்னோடி வழித்தடங்கள் தடையின்றி இயங்குகின்றன'
                    : 'Normal Transit Operations in Madurai Corridor'}
                </h4>
                <p className="service-notices-empty-desc">
                  {t('alerts.normal_service_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
