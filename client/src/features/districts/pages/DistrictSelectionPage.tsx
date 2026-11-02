import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Radio, User, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { useDistricts } from '../hooks/useDistricts';
import { filterDistricts } from '../utils/filterDistricts';
import { DistrictItem } from '../types';
import { DistrictSearch } from '../components/DistrictSearch';
import { DistrictGrid } from '../components/DistrictGrid';
import { TOTAL_DISTRICTS_COUNT, TAMIL_NADU_DISTRICTS } from '../data/tamilNaduDistricts';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import '../styles/district-selection.css';

export const DistrictSelectionPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { districts, selectedDistrict, selectDistrict } = useDistricts();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Expansion modal state for inactive/coming-soon districts
  const [expansionDistrict, setExpansionDistrict] = useState<DistrictItem | null>(null);

  useEffect(() => {
    document.title = `${t('districts.title')} — PERUNDHU`;
  }, [t]);

  // Filtered districts memoized
  const filteredDistricts = useMemo(() => {
    return filterDistricts(districts, searchQuery, statusFilter);
  }, [districts, searchQuery, statusFilter]);

  const handleSelectDistrict = (district: DistrictItem) => {
    if (district.status !== 'AVAILABLE') {
      setExpansionDistrict(district);
      return;
    }
    const success = selectDistrict(district);
    if (success) {
      // Navigate to route destination
      navigate(`/districts/${district.code.toLowerCase()}/routes`);
    }
  };

  const handleExploreMadurai = () => {
    const madurai = districts.find((d) => d.code === 'MDU') || TAMIL_NADU_DISTRICTS.find((d) => d.code === 'MDU');
    if (madurai) {
      selectDistrict(madurai);
      setExpansionDistrict(null);
      navigate('/districts/mdu/routes');
    }
  };

  return (
    <div className="districts-page">
      {/* Top Navigation & Status */}
      <div className="districts-header-top page-stagger-1">
        <Link to="/" className="auth-back-link" aria-label={t('nav.back_home')}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t('nav.back_home')}</span>
        </Link>

        {isAuthenticated && user && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Badge variant="neutral">
              <User size={12} style={{ marginRight: '4px' }} />
              <span>{user.fullName}</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Main Header & Instruction */}
      <header className="districts-header page-stagger-2">
        <div className="districts-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Badge variant="info">
              {language === 'ta' ? 'தமிழ்நாடு அரசுப் போக்குவரத்து' : 'Tamil Nadu State Transit'}
            </Badge>
            <Badge variant="success">
              <Radio size={10} style={{ marginRight: '4px' }} />
              {t('pilot.badge')}
            </Badge>
          </div>

          <h1 className="districts-title">
            {t('districts.title')}
          </h1>

          <p className="districts-subtitle">
            {t('districts.subtitle')}
          </p>
        </div>

        {/* Factual Statistics Strip */}
        <div className="districts-stats-strip" role="region" aria-label="District availability overview">
          <div className="districts-stat-item">
            <span className="districts-stat-dot districts-stat-dot-neutral" aria-hidden="true" />
            <span>
              <strong>{TOTAL_DISTRICTS_COUNT}</strong> {t('districts.stat_total')}
            </span>
          </div>

          <span style={{ color: 'var(--color-border)' }}>•</span>

          <div className="districts-stat-item">
            <span className="districts-stat-dot districts-stat-dot-active" aria-hidden="true" />
            <span>
              <strong>1</strong> {t('districts.stat_active')}: <strong>{language === 'ta' ? 'மதுரை' : 'Madurai'}</strong>
            </span>
          </div>

          <span style={{ color: 'var(--color-border)' }}>•</span>

          <div className="districts-stat-item">
            <span style={{ color: 'var(--color-text-muted)' }}>
              {t('landing.footer_statewide')}
            </span>
          </div>
        </div>
      </header>

      {/* Search & Filtering Bar */}
      <div className="page-stagger-3">
        <DistrictSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filteredCount={filteredDistricts.length}
          totalCount={districts.length}
        />
      </div>

      {/* Responsive District Cards Grid */}
      <div className="page-stagger-4">
        <DistrictGrid
          districts={filteredDistricts}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={handleSelectDistrict}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
      </div>

      {/* Accessible Informative Expansion Modal for Coming Soon Districts */}
      {expansionDistrict && (
        <div
          className="district-expansion-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expansion-modal-title"
          onClick={() => setExpansionDistrict(null)}
        >
          <div
            className="district-expansion-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="district-expansion-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="district-expansion-icon-box">
                  <AlertCircle size={22} color="#CA8A04" />
                </div>
                <div>
                  <h2 id="expansion-modal-title" className="district-expansion-modal-title">
                    {expansionDistrict.nameEn} ({expansionDistrict.nameTa})
                  </h2>
                  <span className="district-expansion-modal-badge">
                    {t('passenger.expansion_notice_title')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="district-expansion-modal-close"
                onClick={() => setExpansionDistrict(null)}
                aria-label={t('dashboard.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="district-expansion-modal-body">
              <p className="district-expansion-modal-message">
                {t('passenger.expansion_notice_desc').replace(
                  '{district}',
                  language === 'ta' ? expansionDistrict.nameTa : expansionDistrict.nameEn
                )}
              </p>

              <div className="district-expansion-pilot-callout">
                <ShieldCheck size={18} color="var(--color-primary-teal)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>{t('pilot.badge')}: </strong>
                  <span>{t('landing.pilot_disclaimer')}</span>
                </div>
              </div>
            </div>

            <div className="district-expansion-modal-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpansionDistrict(null)}
              >
                <span>{t('dashboard.close')}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleExploreMadurai}
                icon={<ArrowRight size={16} />}
              >
                <span>{t('passenger.explore_madurai')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
