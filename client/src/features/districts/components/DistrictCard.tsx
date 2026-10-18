import React from 'react';
import { ArrowRight, MapPin, Building2, Check } from 'lucide-react';
import { DistrictItem } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { DistrictAvailabilityBadge } from './DistrictAvailabilityBadge';
import { Button } from '../../../components/common/Button';

interface DistrictCardProps {
  district: DistrictItem;
  isSelected?: boolean;
  onSelect: (district: DistrictItem) => void;
}

export const DistrictCard: React.FC<DistrictCardProps> = ({
  district,
  isSelected = false,
  onSelect
}) => {
  const { language, t } = useLanguage();

  const isAvailable = district.status === 'AVAILABLE';
  const primaryName = language === 'ta' ? district.nameTa : district.nameEn;
  const secondaryName = language === 'ta' ? district.nameEn : district.nameTa;
  const headquarters = language === 'ta' ? district.headquartersTa : district.headquartersEn;

  return (
    <div
      className={`district-card ${
        isAvailable ? 'district-card-available' : 'district-card-coming-soon'
      } ${isSelected ? 'district-card-selected' : ''}`}
      data-testid={`district-card-${district.code.toLowerCase()}`}
    >
      {/* Top Meta: Code Badge & Availability Badge */}
      <div className="district-card-top">
        <span className="district-code-badge" aria-label={`District Code ${district.code}`}>
          {district.code}
        </span>

        <DistrictAvailabilityBadge status={district.status} isPilot={district.isPilot} />
      </div>

      {/* Main District Details */}
      <div className="district-card-content">
        <h2 className="district-primary-name">
          {primaryName}
        </h2>

        <div className="district-secondary-name">
          {secondaryName}
        </div>

        <div className="district-headquarters-row">
          <Building2 size={13} aria-hidden="true" />
          <span>
            {t('districts.headquarters_label')}: {headquarters}
          </span>
        </div>
      </div>

      {/* Card Action or Rollout Notice */}
      <div className="district-card-footer">
        {isAvailable ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-teal)', fontWeight: 'var(--font-weight-medium)' }}>
              <MapPin size={12} aria-hidden="true" />
              <span>{t('landing.hero_tag_routes')}</span>
            </div>

            <Button
              type="button"
              variant={isSelected ? 'secondary' : 'primary'}
              className="district-card-action-btn"
              onClick={() => onSelect(district)}
              aria-label={`${t('districts.select_action')} ${primaryName}`}
              icon={isSelected ? <Check size={16} /> : <ArrowRight size={16} />}
            >
              <span>{isSelected ? t('districts.selected_badge') : t('districts.select_action')}</span>
            </Button>
          </>
        ) : (
          <p className="district-coming-soon-desc">
            {t('districts.unavailable_desc')}
          </p>
        )}
      </div>
    </div>
  );
};
