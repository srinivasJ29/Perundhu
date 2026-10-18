import React from 'react';
import { SearchX } from 'lucide-react';
import { DistrictItem } from '../types';
import { DistrictCard } from './DistrictCard';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../../components/common/Button';

interface DistrictGridProps {
  districts: DistrictItem[];
  selectedDistrict: DistrictItem | null;
  onSelectDistrict: (district: DistrictItem) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

export const DistrictGrid: React.FC<DistrictGridProps> = ({
  districts,
  selectedDistrict,
  onSelectDistrict,
  searchQuery,
  onClearSearch
}) => {
  const { t } = useLanguage();

  if (districts.length === 0) {
    return (
      <div className="districts-empty-state" role="status">
        <div className="districts-empty-icon" aria-hidden="true">
          <SearchX size={24} />
        </div>

        <h3 className="districts-empty-title">
          {t('districts.no_results_title')}
        </h3>

        <p className="districts-empty-desc">
          {t('districts.no_results_desc', { query: searchQuery })}
        </p>

        <Button type="button" variant="outline" onClick={onClearSearch}>
          <span>{t('districts.clear_query_action')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="districts-grid" role="region" aria-label="Tamil Nadu Districts Directory">
      {districts.map((district) => (
        <DistrictCard
          key={district.code}
          district={district}
          isSelected={selectedDistrict?.code === district.code}
          onSelect={onSelectDistrict}
        />
      ))}
    </div>
  );
};
