import React, { useState } from 'react';
import {
  OptimizationRecommendationDto,
  HumanReviewStatus
} from '../../../types/domain';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OptimizationRecommendationsListProps {
  recommendations: OptimizationRecommendationDto[];
  onReview: (id: string, status: HumanReviewStatus, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const OptimizationRecommendationsList: React.FC<OptimizationRecommendationsListProps> = ({
  recommendations,
  onReview,
  isLoading = false
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const filteredRecs = recommendations.filter((rec) => {
    if (selectedCategory !== 'ALL' && rec.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && rec.humanReviewStatus !== selectedStatus) return false;
    return true;
  });

  const handleReviewAction = async (id: string, status: HumanReviewStatus) => {
    try {
      setIsSubmitting(id);
      const notes = actionNotes[id] || '';
      await onReview(id, status, notes);
      setActionNotes((prev) => ({ ...prev, [id]: '' }));
    } finally {
      setIsSubmitting(null);
    }
  };

  const getStatusBadge = (status: HumanReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> {isTa ? 'அங்கீகரிக்கப்பட்டது' : 'APPROVED'}</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={12} /> {isTa ? 'நிராகரிக்கப்பட்டது' : 'REJECTED'}</span>;
      case 'DEFERRED':
        return <span className="badge badge-warning"><Clock size={12} /> {isTa ? 'ஒத்திவைக்கப்பட்டது' : 'DEFERRED'}</span>;
      default:
        return <span className="badge badge-info"><Clock size={12} /> {isTa ? 'பரிசீலனையில்' : 'PENDING'}</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="badge badge-danger">{isTa ? 'மிக முக்கியமானது' : 'CRITICAL'}</span>;
      case 'HIGH':
        return <span className="badge badge-warning">{isTa ? 'உயர்மட்டம்' : 'HIGH'}</span>;
      case 'MEDIUM':
        return <span className="badge badge-info">{isTa ? 'நடுத்தரம்' : 'MEDIUM'}</span>;
      default:
        return <span className="badge badge-muted">{isTa ? 'குறைந்த' : 'LOW'}</span>;
    }
  };

  return (
    <div className="analytics-widget-container" data-testid="recommendations-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <Sliders className="widget-icon" size={20} />
          <div>
            <h3>{isTa ? 'அறிவுசார் கடற்படை மேம்பாட்டுப் பரிந்துரைகள்' : 'Intelligent Fleet Optimization Recommendations'}</h3>
            <span className="widget-subtitle">
              {isTa ? 'தரவு ஆதாரங்களுடன் கூடிய பரிந்துரைகள் — மனித ஒப்புதல் கட்டாயம்' : 'Data-backed optimization with mandatory human-in-the-loop review'}
            </span>
          </div>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="governance-info-banner">
        <FileCheck2 size={16} className="banner-icon" />
        <div className="banner-text">
          <strong>{isTa ? 'மனித ஒப்புதல் கொள்கை:' : 'Human Approval Requirement:'}</strong>{' '}
          {isTa
            ? 'அமைப்பின் பரிந்துரைகள் ஒருபோதும் தானாக அட்டவணையை மாற்றாது. அதிகாரிகளின் பரிசீலனை மற்றும் முடிவு அவசியமாகும்.'
            : 'Recommendations never automatically modify schedules or vehicle assignments. Every optimization requires administrative human sign-off.'}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="recommendations-filter-bar">
        <div className="filter-group">
          <label htmlFor="filter-cat">{isTa ? 'வகை:' : 'Category:'}</label>
          <select
            id="filter-cat"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">{isTa ? 'அனைத்தும்' : 'All Categories'}</option>
            <option value="DEPOT_IMBALANCE">{isTa ? 'பணிமனை சமநிலை' : 'Depot Imbalance'}</option>
            <option value="ROUTE_DELAY">{isTa ? 'வழித்தட தாமதம்' : 'Route Delay'}</option>
            <option value="GPS_COVERAGE_GAP">{isTa ? 'ஜிபிஎஸ் இடைவெளி' : 'GPS Coverage Gap'}</option>
            <option value="DATA_COLLECTION_GAP">{isTa ? 'தரவு சேகரிப்பு இடைவெளி' : 'Data Collection Gap'}</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">{isTa ? 'நிலை:' : 'Review Status:'}</label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">{isTa ? 'அனைத்தும்' : 'All Statuses'}</option>
            <option value="PENDING">{isTa ? 'பரிசீலனையில்' : 'Pending'}</option>
            <option value="APPROVED">{isTa ? 'அங்கீகரிக்கப்பட்டது' : 'Approved'}</option>
            <option value="REJECTED">{isTa ? 'நிராகரிக்கப்பட்டது' : 'Rejected'}</option>
            <option value="DEFERRED">{isTa ? 'ஒத்திவைக்கப்பட்டது' : 'Deferred'}</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="recommendations-list">
        {filteredRecs.length === 0 ? (
          <div className="empty-state">
            <p>{isTa ? 'பரிந்துரைகள் எதுவும் இல்லை.' : 'No recommendations matching the selected filters.'}</p>
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const isExpanded = expandedId === rec.id;
            return (
              <div
                key={rec.id}
                className={`recommendation-card border-${rec.severity.toLowerCase()}`}
                data-testid={`rec-card-${rec.recommendationId}`}
              >
                <div className="rec-card-header">
                  <div className="rec-badge-group">
                    <span className="rec-id-tag">{rec.recommendationId}</span>
                    {getSeverityBadge(rec.severity)}
                    <span className="rec-cat-tag">{rec.category}</span>
                    <span className="confidence-pill" title="Statistical Confidence Score">
                      {(rec.confidenceScore * 100).toFixed(0)}% {isTa ? 'நம்பகத்தன்மை' : 'confidence'}
                    </span>
                  </div>
                  <div className="rec-status-area">
                    {getStatusBadge(rec.humanReviewStatus)}
                  </div>
                </div>

                <div className="rec-title-area">
                  <h4>{isTa ? rec.titleTa : rec.title}</h4>
                  {rec.targetEntityName && (
                    <div className="target-entity">
                      <strong>{isTa ? 'இலக்கு:' : 'Target:'}</strong> {rec.targetEntityName} ({rec.targetEntityType})
                    </div>
                  )}
                  <p className="rec-desc">{isTa ? rec.descriptionTa : rec.description}</p>
                </div>

                {/* Observations preview */}
                {rec.supportingObservations.length > 0 && (
                  <div className="rec-observations">
                    <strong>{isTa ? 'கண்காணிக்கப்பட்ட காரணிகள்:' : 'Key Observations:'}</strong>
                    <ul>
                      {rec.supportingObservations.map((obs, idx) => (
                        <li key={idx}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="rec-expanded-content">
                    <div className="benefit-risk-grid">
                      <div className="benefit-box">
                        <TrendingUp size={16} className="text-success mb-1" />
                        <strong>{isTa ? 'எதிர்பார்க்கப்படும் பலன்:' : 'Expected Benefit:'}</strong>
                        <p>{isTa ? rec.expectedBenefitTa : rec.expectedBenefit}</p>
                      </div>

                      <div className="risk-box">
                        <AlertTriangle size={16} className="text-warning mb-1" />
                        <strong>{isTa ? 'அபாயங்கள் & அனுமானங்கள்:' : 'Risks & Assumptions:'}</strong>
                        <p>{rec.risksAndAssumptions}</p>
                      </div>
                    </div>

                    <div className="evidence-provenance-info">
                      <div>
                        <strong>{isTa ? 'சான்று காலம்:' : 'Evidence Period:'}</strong>{' '}
                        {new Date(rec.evidencePeriod.from).toLocaleDateString()} —{' '}
                        {new Date(rec.evidencePeriod.to).toLocaleDateString()} ({rec.evidencePeriod.sampleSize}{' '}
                        {rec.evidencePeriod.unit})
                      </div>
                      <div>
                        <strong>{isTa ? 'தரவு மூலங்கள்:' : 'Data Sources:'}</strong> {rec.dataSource.join(', ')}
                      </div>
                    </div>

                    {/* Review History */}
                    {rec.reviewHistory.length > 0 && (
                      <div className="review-history-section">
                        <h5>{isTa ? 'பரிசீலனை வரலாறு:' : 'Review History:'}</h5>
                        <div className="history-timeline">
                          {rec.reviewHistory.map((h, hIdx) => (
                            <div key={hIdx} className="history-item">
                              <span className="history-actor">
                                {h.reviewedBy} ({h.reviewerRole})
                              </span>{' '}
                              marked <strong>{h.status}</strong> on{' '}
                              <span className="history-date">
                                {new Date(h.timestamp).toLocaleString()}
                              </span>
                              {h.decisionNotes && (
                                <p className="history-notes">"{h.decisionNotes}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Action Controls */}
                <div className="rec-actions-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost toggle-details-btn"
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} /> {isTa ? 'குறைவாகக் காட்டு' : 'Hide Details'}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> {isTa ? 'விவரங்களைக் காட்டு' : 'View Full Details'}
                      </>
                    )}
                  </button>

                  <div className="review-buttons-group">
                    <input
                      type="text"
                      placeholder={isTa ? 'முடிவுக்கான குறிப்பு (விரும்பினால்)...' : 'Decision notes (optional)...'}
                      value={actionNotes[rec.id] || ''}
                      onChange={(e) =>
                        setActionNotes({ ...actionNotes, [rec.id]: e.target.value })
                      }
                      className="notes-input"
                    />
                    <button
                      type="button"
                      disabled={isSubmitting === rec.id || isLoading}
                      onClick={() => handleReviewAction(rec.id, 'APPROVED')}
                      className="btn btn-sm btn-success"
                    >
                      <CheckCircle2 size={14} /> {isTa ? 'ஒப்புதல்' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting === rec.id || isLoading}
                      onClick={() => handleReviewAction(rec.id, 'REJECTED')}
                      className="btn btn-sm btn-danger"
                    >
                      <XCircle size={14} /> {isTa ? 'நிராகரி' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting === rec.id || isLoading}
                      onClick={() => handleReviewAction(rec.id, 'DEFERRED')}
                      className="btn btn-sm btn-warning"
                    >
                      <Clock size={14} /> {isTa ? 'ஒத்திவை' : 'Defer'}
                    </button>
                  </div>
                </div>

                <div className="provenance-footer">
                  <ShieldCheck size={14} className="shield-icon" />
                  <span>
                    {isTa ? 'தரவு ஆதாரம்:' : 'Provenance:'} {rec.dataProvenance.sourceOrganization} • {rec.dataProvenance.sourceReference}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
