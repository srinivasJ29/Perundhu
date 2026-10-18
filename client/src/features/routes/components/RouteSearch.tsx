/**
 * PERUNDHU (பேருந்து) — Route Search and Filter Component
 */

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface RouteSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  query,
  onQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  filteredCount,
  totalCount
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="routes-search-section">
      <div className="routes-search-container">
        <label htmlFor="route-search-input" className="sr-only">
          {t('routes.search_label')}
        </label>
        <div className="routes-search-input-wrapper">
          <Search className="routes-search-icon" size={18} aria-hidden="true" />
          <input
            id="route-search-input"
            type="search"
            className="routes-search-input"
            placeholder={t('routes.search_placeholder')}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="routes-search-clear"
              onClick={() => onQueryChange('')}
              aria-label={t('routes.clear_search')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="routes-filter-row" role="radiogroup" aria-label="Route category filter">
          <button
            type="button"
            className={`routes-filter-pill ${categoryFilter === 'ALL' ? 'routes-filter-pill-active' : ''}`}
            onClick={() => onCategoryFilterChange('ALL')}
            aria-checked={categoryFilter === 'ALL'}
            role="radio"
          >
            <Filter size={13} style={{ marginRight: '4px' }} />
            <span>{t('routes.filter_all')}</span>
          </button>

          <button
            type="button"
            className={`routes-filter-pill ${categoryFilter === 'TOWN_SERVICE' ? 'routes-filter-pill-active' : ''}`}
            onClick={() => onCategoryFilterChange('TOWN_SERVICE')}
            aria-checked={categoryFilter === 'TOWN_SERVICE'}
            role="radio"
          >
            <span>{language === 'ta' ? 'நகரப் பேருந்து' : 'Town Service'}</span>
          </button>
        </div>
      </div>

      {/* Results Count Strip */}
      <div className="routes-count-strip" aria-live="polite">
        <span>
          {t('routes.showing_count')
            .replace('{count}', String(filteredCount))
            .replace('{total}', String(totalCount))}
        </span>
      </div>
    </div>
  );
};
