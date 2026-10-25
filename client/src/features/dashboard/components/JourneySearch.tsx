/**
 * PERUNDHU (பேருந்து) — Journey Quick Search Panel
 * Allows passengers to pick genuine origin and destination stops/stands,
 * swap directions, validate inputs, and discover direct corridor routes.
 * Honestly informs passengers that full multi-leg routing is scheduled for future phases.
 */

import React, { useState, useId } from 'react';
import { ArrowLeftRight, Search, MapPin, AlertCircle, Info, CheckCircle2, Route } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { SearchLocationOption } from '../types';
import { RouteListItem } from '../../routes/types';
import { Button } from '../../../components/common/Button';

interface JourneySearchProps {
  locationOptions: SearchLocationOption[];
  districtRoutes: RouteListItem[];
  onSelectRoute: (routeId: string, directionId?: string) => void;
}

export const JourneySearch: React.FC<JourneySearchProps> = ({
  locationOptions,
  districtRoutes,
  onSelectRoute
}) => {
  const { t, language } = useLanguage();
  const fromInputId = useId();
  const toInputId = useId();

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searchExecuted, setSearchExecuted] = useState<boolean>(false);
  const [matchedRoutes, setMatchedRoutes] = useState<RouteListItem[]>([]);

  // Filter suggestion lists
  const fromSuggestions = locationOptions.filter((opt) => {
    if (!fromValue.trim()) return true;
    const term = fromValue.toLowerCase();
    return (
      opt.nameEn.toLowerCase().includes(term) ||
      opt.nameTa.toLowerCase().includes(term) ||
      opt.code.toLowerCase().includes(term)
    );
  }).slice(0, 10);

  const toSuggestions = locationOptions.filter((opt) => {
    if (!toValue.trim()) return true;
    const term = toValue.toLowerCase();
    return (
      opt.nameEn.toLowerCase().includes(term) ||
      opt.nameTa.toLowerCase().includes(term) ||
      opt.code.toLowerCase().includes(term)
    );
  }).slice(0, 10);

  const handleSwap = () => {
    const temp = fromValue;
    setFromValue(toValue);
    setToValue(temp);
    setValidationError(null);
    setSearchExecuted(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const fromTrimmed = fromValue.trim();
    const toTrimmed = toValue.trim();

    if (!fromTrimmed || !toTrimmed) {
      setValidationError(t('dashboard.validation_empty'));
      setSearchExecuted(false);
      return;
    }

    if (fromTrimmed.toLowerCase() === toTrimmed.toLowerCase()) {
      setValidationError(t('dashboard.validation_same'));
      setSearchExecuted(false);
      return;
    }

    // Inspect verified district routes to check if any corridor connects these two places
    const termFrom = fromTrimmed.toLowerCase();
    const termTo = toTrimmed.toLowerCase();

    const matches = districtRoutes.filter((r) => {
      const titleEn = r.displayTitleEn.toLowerCase();
      const titleTa = r.displayTitleTa.toLowerCase();
      const stands = r.servingBusStands.map((s) => s.toLowerCase());

      const matchesFrom =
        titleEn.includes(termFrom) ||
        titleTa.includes(termFrom) ||
        stands.some((s) => s.includes(termFrom));

      const matchesTo =
        titleEn.includes(termTo) ||
        titleTa.includes(termTo) ||
        stands.some((s) => s.includes(termTo));

      return matchesFrom || matchesTo;
    });

    setMatchedRoutes(matches);
    setSearchExecuted(true);
  };

  return (
    <section className="journey-search-card" aria-labelledby="journey-search-title">
      <div className="journey-search-header">
        <h2 id="journey-search-title" className="journey-search-title">
          {language === 'ta'
            ? 'இன்று நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்?'
            : 'Where would you like to go today?'}
        </h2>
        <p className="journey-search-subtitle">
          {language === 'ta'
            ? 'அங்கீகரிக்கப்பட்ட பேருந்து நிறுத்தங்களைத் தேர்ந்தெடுத்து நேரடி அரசுப் பேருந்துகளைக் கண்டறியவும்'
            : 'Select verified transit stops to discover direct TNSTC bus routes'}
        </p>
      </div>

      <form onSubmit={handleSearch} className="journey-search-form" noValidate>
        <div className="journey-search-inputs-grid">
          {/* 1. Origin Input */}
          <div className="journey-input-group">
            <label htmlFor={fromInputId} className="journey-input-label">
              <MapPin size={14} className="journey-input-icon origin" aria-hidden="true" />
              <span>{t('dashboard.search_from')}</span>
            </label>
            <div className="journey-input-wrapper">
              <input
                id={fromInputId}
                type="text"
                className="journey-text-input"
                placeholder={t('dashboard.search_from_placeholder')}
                value={fromValue}
                onChange={(e) => {
                  setFromValue(e.target.value);
                  setValidationError(null);
                  setSearchExecuted(false);
                }}
                list="from-stops-list"
                autoComplete="off"
                aria-required="true"
              />
              <datalist id="from-stops-list">
                {fromSuggestions.map((opt) => (
                  <option
                    key={`from-${opt.id}`}
                    value={language === 'ta' ? opt.nameTa : opt.nameEn}
                  >
                    {opt.landmark ? `(${opt.landmark})` : opt.code}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* 2. Swap Origin / Destination Button */}
          <div className="journey-swap-btn-box">
            <button
              type="button"
              className="journey-swap-btn"
              onClick={handleSwap}
              title={t('dashboard.swap_direction')}
              aria-label={t('dashboard.swap_direction')}
            >
              <ArrowLeftRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* 3. Destination Input */}
          <div className="journey-input-group">
            <label htmlFor={toInputId} className="journey-input-label">
              <MapPin size={14} className="journey-input-icon destination" aria-hidden="true" />
              <span>{t('dashboard.search_to')}</span>
            </label>
            <div className="journey-input-wrapper">
              <input
                id={toInputId}
                type="text"
                className="journey-text-input"
                placeholder={t('dashboard.search_to_placeholder')}
                value={toValue}
                onChange={(e) => {
                  setToValue(e.target.value);
                  setValidationError(null);
                  setSearchExecuted(false);
                }}
                list="to-stops-list"
                autoComplete="off"
                aria-required="true"
              />
              <datalist id="to-stops-list">
                {toSuggestions.map((opt) => (
                  <option
                    key={`to-${opt.id}`}
                    value={language === 'ta' ? opt.nameTa : opt.nameEn}
                  >
                    {opt.landmark ? `(${opt.landmark})` : opt.code}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* 4. Search Action Button */}
          <div className="journey-submit-btn-box">
            <Button
              type="submit"
              variant="primary"
              className="journey-submit-btn"
              icon={<Search size={16} />}
            >
              <span>{t('dashboard.search_button')}</span>
            </Button>
          </div>
        </div>

        {/* Quick Popular Hubs Preset Chips */}
        <div className="journey-quick-hubs-row">
          <span className="quick-hubs-label">
            {language === 'ta' ? 'அடிக்கடி செல்லும் முனையங்கள்:' : 'Popular Hubs:'}
          </span>
          <div className="quick-hubs-list">
            {[
              { code: 'MDU-MGR', nameEn: 'Mattuthavani', nameTa: 'மாட்டுத்தாவணி' },
              { code: 'MDU-PER', nameEn: 'Periyar', nameTa: 'பெரியார்' },
              { code: 'MDU-ARP', nameEn: 'Arapalayam', nameTa: 'ஆரப்பாளையம்' },
              { code: 'MDU-TMG', nameEn: 'Thirumangalam', nameTa: 'திருமங்கலம்' }
            ].map((hub) => (
              <button
                key={hub.code}
                type="button"
                className="quick-hub-chip"
                onClick={() => {
                  const hubName = language === 'ta' ? hub.nameTa : hub.nameEn;
                  setValidationError(null);
                  setSearchExecuted(false);
                  if (!fromValue.trim()) {
                    setFromValue(hubName);
                  } else if (!toValue.trim() && fromValue.trim() !== hubName) {
                    setToValue(hubName);
                  } else {
                    setToValue(hubName);
                  }
                }}
              >
                <span>{language === 'ta' ? hub.nameTa : hub.nameEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="journey-validation-alert" role="alert">
            <AlertCircle size={16} color="var(--color-coral-red)" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* Honest Capability Communication & Search Results */}
      {searchExecuted && (
        <div className="journey-results-section" aria-live="polite">
          {matchedRoutes.length > 0 ? (
            <div className="journey-results-card">
              <div className="journey-results-badge-row">
                <div className="journey-success-tag">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>{t('dashboard.direct_route_found')}</span>
                </div>
              </div>

              <div className="journey-matched-routes-list">
                {matchedRoutes.map((r) => (
                  <div key={r.id} className="journey-matched-route-item">
                    <div className="journey-route-pill">
                      <span>{language === 'ta' ? 'தடம்' : 'Route'}</span>
                      <strong>{r.routeNumber}</strong>
                    </div>
                    <div className="journey-route-info">
                      <div className="journey-route-name">
                        {language === 'ta' ? r.displayTitleTa : r.displayTitleEn}
                      </div>
                      <div className="journey-route-stands">
                        {language === 'ta' ? 'இணைக்கும் முனையங்கள்: ' : 'Connects: '}
                        {r.servingBusStands.join(' • ')}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSelectRoute(r.id, r.directions[0]?.id)}
                      icon={<Route size={14} />}
                    >
                      <span>{language === 'ta' ? 'தேர்ந்தெடு' : 'Select'}</span>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Honest Notice */}
              <div className="journey-honest-notice">
                <Info size={14} color="var(--color-primary-teal)" aria-hidden="true" />
                <span>{t('dashboard.journey_plan_notice')}</span>
              </div>
            </div>
          ) : (
            <div className="journey-empty-card">
              <Info size={20} color="var(--color-sage)" aria-hidden="true" />
              <div className="journey-empty-text">
                <strong>{t('dashboard.journey_no_direct')}</strong>
                <p>
                  {language === 'ta'
                    ? 'மதுரை முன்னோடி வழித்தடங்களான தடம் 70 (மாட்டுத்தாவணி - பெரியார்) மற்றும் தடம் 77 (மாட்டுத்தாவணி - திருமங்கலம்) தற்போது இயங்குகின்றன.'
                    : 'Active pilot corridors currently in service include Route 70 (Mattuthavani – Periyar) and Route 77 (Mattuthavani – Thirumangalam).'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
