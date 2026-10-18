/**
 * PERUNDHU (பேருந்து) — Compact Floating Map Search
 * Features debounced search across bus stands, route stops, and routes
 * with keyboard navigation, clear action, and category badges.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building2, Route as RouteIcon } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { SearchableMapItem } from '../types';
import { Badge } from '../../../components/common/Badge';

interface MapSearchProps {
  searchQuery: string;
  searchResults: SearchableMapItem[];
  onSearchChange: (q: string) => void;
  onSelectResult: (item: SearchableMapItem) => void;
  onClearSearch: () => void;
}

export const MapSearch: React.FC<MapSearchProps> = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onSelectResult,
  onClearSearch
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchChange(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
        handleSelect(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SearchableMapItem) => {
    onSelectResult(item);
    setIsOpen(false);
    onSearchChange('');
  };

  const handleClear = () => {
    onClearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const renderIcon = (type: SearchableMapItem['type']) => {
    switch (type) {
      case 'BUS_STAND':
        return <Building2 size={16} color="var(--color-primary-teal)" />;
      case 'BUS_STOP':
        return <MapPin size={16} color="var(--color-sage)" />;
      case 'ROUTE':
        return <RouteIcon size={16} color="var(--color-coral-red)" />;
    }
  };

  const renderTypeBadge = (type: SearchableMapItem['type']) => {
    switch (type) {
      case 'BUS_STAND':
        return (
          <Badge variant="neutral">
            <span>{t('map.search_type_stand')}</span>
          </Badge>
        );
      case 'BUS_STOP':
        return (
          <Badge variant="info">
            <span>{t('map.search_type_stop')}</span>
          </Badge>
        );
      case 'ROUTE':
        return (
          <Badge variant="success">
            <span>{t('map.search_type_route')}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="map-search-wrapper" ref={containerRef}>
      <div className="map-search-bar" role="search">
        <label htmlFor="map-search-input" className="sr-only">
          {t('map.search_label')}
        </label>
        <Search size={18} className="map-search-icon" aria-hidden="true" />
        <input
          id="map-search-input"
          ref={inputRef}
          type="text"
          className="map-search-input"
          placeholder={t('map.search_placeholder')}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            type="button"
            className="map-search-clear-btn"
            onClick={handleClear}
            aria-label={t('map.search_clear')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="map-search-dropdown" role="listbox">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const name = language === 'ta' ? item.nameTa : item.nameEn;
              const subtitle = language === 'ta' ? item.subtitleTa : item.subtitleEn;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`map-search-item ${isHighlighted ? 'highlighted' : ''}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="map-search-item-icon">{renderIcon(item.type)}</div>
                  <div className="map-search-item-text">
                    <div className="map-search-item-title-row">
                      <strong className="map-search-item-title">{name}</strong>
                      {renderTypeBadge(item.type)}
                    </div>
                    <span className="map-search-item-subtitle">{subtitle}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="map-search-empty">
              <span>{t('map.search_no_results').replace('{query}', searchQuery)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
