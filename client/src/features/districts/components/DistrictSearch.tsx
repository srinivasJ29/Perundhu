import React from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface DistrictSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const DistrictSearch: React.FC<DistrictSearchProps> = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  totalCount
}) => {
  const { t } = useLanguage();

  return (
    <div className="district-search-bar" role="search">
      {/* Accessible Search Label */}
      <label htmlFor="district-search-input" className="sr-only">
        {t('districts.search_label')}
      </label>

      {/* Input container with icon and clear button */}
      <div className="district-search-input-wrapper">
        <span className="district-search-icon" aria-hidden="true">
          <Search size={20} />
        </span>

        <input
          id="district-search-input"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('districts.search_placeholder')}
          className="district-search-input"
          autoComplete="off"
          spellCheck={false}
        />

        {query.length > 0 && (
          <button
            type="button"
            className="district-search-clear-btn"
            onClick={() => onQueryChange('')}
            aria-label={t('districts.clear_search')}
            title={t('districts.clear_search')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter Tabs and Count */}
      <div className="district-filter-pills">
        <div className="district-filter-tabs" role="tablist" aria-label="District availability filter">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'ALL'}
            className={`district-filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('ALL')}
          >
            <span>{t('districts.filter_all')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'AVAILABLE'}
            className={`district-filter-tab ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('AVAILABLE')}
          >
            <MapPin size={12} aria-hidden="true" />
            <span>{t('districts.filter_available')}</span>
          </button>
        </div>

        <div className="district-count-display" aria-live="polite">
          {t('districts.showing_count', { count: filteredCount, total: totalCount })}
        </div>
      </div>
    </div>
  );
};
