/**
 * PERUNDHU (பேருந்து) — Step 7 Interactive Live Map Page
 * Full interactive geospatial tracking canvas connecting verified backend data,
 * OpenStreetMap standard tiles, Socket.IO real-time telemetry, and responsive collapsible panels.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Navigation,
  Compass,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useMapState } from '../hooks/useMapState';
import { MapCanvas } from '../components/MapCanvas';
import { MapSearch } from '../components/MapSearch';
import { MapLayerControl } from '../components/MapLayerControl';
import { MapControls } from '../components/MapControls';
import { TrackingStatusBanner } from '../components/TrackingStatusBanner';
import { MapInfoPanel } from '../components/MapInfoPanel';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import '../styles/map.css';

export const LiveMapPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  const {
    districtInfo,
    districtRoutes,
    routeGeometry,
    isLoadingRoute,
    routeLoadError,
    busStands,
    userCoords,
    isLocatingUser,
    nearbyStands,
    isLoadingNearby,
    liveBuses,
    socketStatus,
    subscribedRoom,
    selectedEntity,
    activeLayer,
    searchQuery,
    searchResults,
    isPanelCollapsed,
    activePanelTab,
    viewportTrigger,
    setSearchQuery,
    setActiveLayer,
    setIsPanelCollapsed,
    setActivePanelTab,
    handleRequestUserLocation,
    handleRecenter,
    handleSelectRoute,
    handleSwitchDirection,
    handleSelectEntity,
    handleClearSelectedEntity,
    handleReturnToDashboard
  } = useMapState();

  useEffect(() => {
    const routeTitle = routeGeometry ? `Route ${routeGeometry.routeNumber} • ` : '';
    document.title = `${routeTitle}${t('map.title')} — PERUNDHU`;
  }, [routeGeometry, t]);

  // Handle selecting an item from the floating search bar
  const handleSelectSearchResult = (item: any) => {
    if (item.type === 'ROUTE' && item.routeId) {
      handleSelectRoute(item.routeId);
    } else if (item.lat && item.lng) {
      handleSelectEntity({
        type: item.type,
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        titleEn: item.nameEn,
        titleTa: item.nameTa,
        subtitleEn: item.subtitleEn,
        subtitleTa: item.subtitleTa,
        data: item
      });
    }
  };

  const hasSimulatedBuses = liveBuses.some((b) => b.isSimulated);

  return (
    <div className="live-map-page-wrapper">
      {/* 1. Header Navigation Bar */}
      <header className="live-map-header" role="banner">
        <div className="live-map-header-left">
          <Button
            type="button"
            variant="outline"
            onClick={handleReturnToDashboard}
            icon={<ArrowLeft size={16} />}
          >
            <span>{t('map.back_to_dashboard')}</span>
          </Button>

          <div className="live-map-brand-title">
            <span>PERUNDHU</span>
            <span className="live-map-brand-tamil">பேருந்து</span>
          </div>

          <div className="live-map-context-pills">
            {/* District Context Pill */}
            <div className="live-map-context-pill">
              <Navigation size={12} color="var(--color-primary-teal)" />
              <span>
                {language === 'ta' ? districtInfo.nameTa : districtInfo.nameEn}
              </span>
              {districtInfo.isPilot ? (
                <Badge variant="neutral">
                  <span>Pilot</span>
                </Badge>
              ) : (
                <Badge variant="warning">
                  <span>Expansion</span>
                </Badge>
              )}
            </div>

            {/* Selected Route Pill */}
            {routeGeometry && (
              <div className="live-map-context-pill">
                <Compass size={12} color="var(--color-sage)" />
                <span>
                  {language === 'ta' ? `தடம் ${routeGeometry.routeNumber}` : `Route ${routeGeometry.routeNumber}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="live-map-header-right">
          {/* Language Switcher */}
          <button
            type="button"
            className="live-map-lang-toggle-btn"
            onClick={toggleLanguage}
            aria-label="Switch Language / மொழியை மாற்றுக"
          >
            <Globe size={14} />
            <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>
        </div>
      </header>

      {/* 2. Interactive Main Map Area */}
      <main className="live-map-main-area" role="main">
        {/* Floating Real-Time Status Pill */}
        <TrackingStatusBanner
          socketStatus={socketStatus}
          subscribedRoom={subscribedRoom}
          activeBusesCount={liveBuses.length}
          hasSimulatedBuses={hasSimulatedBuses}
          routeNumber={routeGeometry?.routeNumber}
        />

        {/* Compact Floating Search Bar */}
        <MapSearch
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearchChange={setSearchQuery}
          onSelectResult={handleSelectSearchResult}
          onClearSearch={() => setSearchQuery('')}
        />

        {/* Floating Map Layer Selector */}
        <MapLayerControl
          activeLayer={activeLayer}
          onSelectLayer={setActiveLayer}
        />

        {/* Floating Action Controls (Location, Recenter) */}
        <MapControls
          isLocatingUser={isLocatingUser}
          hasUserLocation={Boolean(userCoords)}
          onRequestUserLocation={handleRequestUserLocation}
          onRecenter={handleRecenter}
        />

        {/* Leaflet Map Canvas */}
        <MapCanvas
          initialCenter={districtInfo.center}
          initialZoom={districtInfo.zoom}
          viewportTrigger={viewportTrigger}
          activeLayer={activeLayer}
          isPanelCollapsed={isPanelCollapsed}
          busStands={busStands}
          routeGeometry={routeGeometry}
          liveBuses={liveBuses}
          userCoords={userCoords}
          selectedEntity={selectedEntity}
          onSelectEntity={handleSelectEntity}
          onClearSelection={handleClearSelectedEntity}
          onExploreStandRoutes={(standId) => {
            const stand = busStands.find((s) => s.id === standId);
            if (stand && stand.location?.coordinates) {
              handleSelectEntity({
                type: 'BUS_STAND',
                id: stand.id,
                lat: stand.location.coordinates[1],
                lng: stand.location.coordinates[0],
                titleEn: stand.nameEn,
                titleTa: stand.nameTa,
                subtitleEn: stand.code,
                subtitleTa: stand.code,
                data: stand
              });
            }
            setIsPanelCollapsed(false);
            setActivePanelTab('nearby');
          }}
        />

        {/* Non-pilot District Friendly Notice Banner */}
        {!districtInfo.isPilot && (
          <div
            style={{
              position: 'absolute',
              top: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 16px rgba(7,31,33,0.12)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '90vw'
            }}
          >
            <AlertCircle size={20} color="var(--color-status-warning)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-deep-teal)' }}>
              {t('map.district_no_data').replace(
                '{district}',
                language === 'ta' ? districtInfo.nameTa : districtInfo.nameEn
              )}
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                navigate('/routes/70?district=mdu');
              }}
            >
              <span>{t('map.switch_to_madurai')}</span>
            </Button>
          </div>
        )}

        {/* Collapsible Route, Stop, and Fleet Information Panel */}
        <MapInfoPanel
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed((prev) => !prev)}
          activeTab={activePanelTab}
          onTabChange={setActivePanelTab}
          routeGeometry={routeGeometry}
          availableRoutes={districtRoutes}
          isLoadingRoute={isLoadingRoute}
          routeError={routeLoadError}
          onSelectRoute={handleSelectRoute}
          onSwitchDirection={handleSwitchDirection}
          liveBuses={liveBuses}
          busStands={busStands}
          nearbyStands={nearbyStands}
          isLoadingNearby={isLoadingNearby}
          selectedEntity={selectedEntity}
          onSelectEntity={handleSelectEntity}
          onClearSelectedEntity={handleClearSelectedEntity}
        />
      </main>
    </div>
  );
};
