/**
 * PERUNDHU (பேருந்து) — Route Selection Page (Step 5)
 * Allows passengers to explore verified routes in the selected district,
 * inspect ordered stops and directions, and select a route for live tracking.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Radio, User, AlertCircle, RefreshCw, Route, MapPin } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { useDistrictRoutes } from '../hooks/useDistrictRoutes';
import { filterRoutes } from '../utils/filterRoutes';
import { RouteListItem } from '../types';
import { RouteSearch } from '../components/RouteSearch';
import { RouteCard } from '../components/RouteCard';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import '../styles/route-selection.css';

export const RouteSelectionPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { districtId } = useParams();

  const {
    routes,
    isLoading,
    error,
    refetch,
    districtCode,
    districtName,
    isMaduraiPilot,
    selectedRouteId,
    selectRoute
  } = useDistrictRoutes(districtId);

  // Search & category filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    document.title = `${t('routes.title')} — PERUNDHU`;
  }, [t]);

  // Filtered routes memoized
  const filteredRoutes = useMemo(() => {
    return filterRoutes(routes, searchQuery, categoryFilter);
  }, [routes, searchQuery, categoryFilter]);

  const handleSelectRoute = (route: RouteListItem, directionId: string) => {
    selectRoute(route);
    // Navigate to Step 6 live tracking handoff destination
    navigate(
      `/routes/${route.id}?directionId=${directionId}&routeNumber=${route.routeNumber}&district=${districtCode.toLowerCase()}`
    );
  };

  return (
    <div className="routes-page">
      {/* 1. Top Navigation & User Context */}
      <div className="routes-header-top page-stagger-1">
        <Link to="/districts" className="routes-back-link" aria-label={t('routes.back_to_districts')}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t('routes.back_to_districts')}</span>
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

      {/* 2. Header & Instruction */}
      <header className="routes-header page-stagger-2">
        <div className="routes-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="info">
              <MapPin size={11} style={{ marginRight: '3px' }} />
              <span>
                {language === 'ta' ? `${districtName.ta}, தமிழ்நாடு` : `${districtName.en}, Tamil Nadu`}
              </span>
            </Badge>

            {isMaduraiPilot && (
              <Badge variant="success">
                <Radio size={10} style={{ marginRight: '4px' }} />
                <span>{t('routes.verified_pilot_badge')}</span>
              </Badge>
            )}
          </div>

          <h1 className="routes-title">{t('routes.title')}</h1>

          <p className="routes-subtitle">{t('routes.subtitle')}</p>
        </div>
      </header>

      {/* 3. Non-Pilot / Unsupported District Guard */}
      {!isMaduraiPilot && (
        <div className="routes-error-card page-stagger-3">
          <AlertCircle size={32} color="var(--color-coral-red)" />
          <h2 className="routes-error-title">
            {language === 'ta'
              ? 'இந்த மாவட்டத்தில் சேவைகள் விரைவில் தொடங்கும்'
              : 'Corridor Planned for Future Rollout'}
          </h2>
          <p className="routes-error-desc">
            {language === 'ta'
              ? `${districtCode} மாவட்டத்தில் பேருந்து வழித்தடங்கள் மற்றும் நேரலை கண்காணிப்பு எதிர்கால கட்டத்தில் இணைக்கப்படும். தற்போதைய முன்னோடி திட்டத்திற்கு மதுரையைத் தேர்ந்தெடுக்கவும்.`
              : `Live bus route telemetry for district ${districtCode} is scheduled for future statewide expansion phases. Please choose Madurai to experience the active pilot.`}
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/districts')}
            icon={<ArrowLeft size={16} />}
          >
            <span>{t('routes.back_to_districts')}</span>
          </Button>
        </div>
      )}

      {/* 4. Active Pilot District Content */}
      {isMaduraiPilot && (
        <>
          {/* Search & Filtering Bar */}
          <div className="page-stagger-3">
            <RouteSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              filteredCount={filteredRoutes.length}
              totalCount={routes.length}
            />
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="route-stops-loading" style={{ justifyContent: 'center', padding: 'var(--space-12) 0' }}>
              <div className="loading-spinner-sm" aria-hidden="true" />
              <span>{t('routes.loading_routes')}</span>
            </div>
          )}

          {/* Error Banner */}
          {!isLoading && error && (
            <div className="routes-error-card">
              <AlertCircle size={28} color="var(--color-coral-red)" />
              <h2 className="routes-error-title">{t('routes.error_title')}</h2>
              <p className="routes-error-desc">{error}</p>
              <Button
                type="button"
                variant="primary"
                onClick={refetch}
                icon={<RefreshCw size={14} />}
              >
                <span>{t('routes.error_retry')}</span>
              </Button>
            </div>
          )}

          {/* No Routes for District */}
          {!isLoading && !error && routes.length === 0 && (
            <div className="routes-empty-state">
              <Route size={32} color="var(--color-text-muted)" />
              <h2 className="routes-empty-title">{t('routes.no_routes_district')}</h2>
              <p className="routes-empty-desc">{t('districts.unavailable_desc')}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/districts')}
                icon={<ArrowLeft size={16} />}
              >
                <span>{t('routes.back_to_districts')}</span>
              </Button>
            </div>
          )}

          {/* No Search Matches */}
          {!isLoading && !error && routes.length > 0 && filteredRoutes.length === 0 && (
            <div className="routes-empty-state" data-testid="routes-empty-state">
              <Route size={32} color="var(--color-text-muted)" />
              <h2 className="routes-empty-title">{t('routes.no_results_title')}</h2>
              <p className="routes-empty-desc">
                {t('routes.no_results_desc').replace('{query}', searchQuery)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                }}
              >
                <span>{t('routes.clear_filter')}</span>
              </Button>
            </div>
          )}

          {/* Route Cards List */}
          {!isLoading && !error && filteredRoutes.length > 0 && (
            <div className="routes-grid page-stagger-4" role="region" aria-label="Available bus routes list">
              {filteredRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRouteId === route.id}
                  onSelectRoute={handleSelectRoute}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
