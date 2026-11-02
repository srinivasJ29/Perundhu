/**
 * PERUNDHU (பேருந்து) — Step 6 Home Dashboard Page
 * Main passenger portal unifying authenticated profile, selected district & route telemetry,
 * genuine GPS-backed nearby terminals, journey search, and quick access actions.
 */

import React, { useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeader } from '../components/DashboardHeader';
import { JourneySearch } from '../components/JourneySearch';
import { SelectedRouteCard } from '../components/SelectedRouteCard';
import { NearbyBusStands } from '../components/NearbyBusStands';
import { LiveBusOverview } from '../components/LiveBusOverview';
import { QuickAccessGrid } from '../components/QuickAccessGrid';
import { PassengerGuidance } from '../components/PassengerGuidance';
import { TimetableModal } from '../components/TimetableModal';
import { ServiceNoticesBanner } from '../components/ServiceNoticesBanner';
import '../styles/dashboard.css';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();

  const {
    district,
    districtRoutes,
    selectedRoute,
    isLoadingRouteDetail,
    locationOptions,
    liveOverview,
    nearbyStands,
    timetableModal,
    alerts,
    isLoadingAlerts,
    alertsError,
    refreshAlerts,
    handleRequestLocation,
    handleBrowseDistrictStands,
    handleOpenTimetable,
    handleCloseTimetable,
    refreshLiveOverview,
    selectRoute
  } = useDashboardData();

  useEffect(() => {
    document.title = `${t('dashboard.title')} — PERUNDHU`;
  }, [t]);

  const handleScrollToGuidance = () => {
    const el = document.getElementById('passenger-guidance-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dashboard-page-wrapper">
      {/* 1. Header with branding, district/route pills, language, and user profile */}
      <div className="page-stagger-1">
        <DashboardHeader district={district} selectedRoute={selectedRoute} />
      </div>

      {/* 2. Main Dashboard Content Grid */}
      <main className="dashboard-main-content" role="main">
        <div className="app-container dashboard-layout-container">
          {/* Welcome & Journey Quick Search */}
          <div className="page-stagger-2">
            <JourneySearch
              locationOptions={locationOptions}
              districtRoutes={districtRoutes}
              onSelectRoute={(routeId) => selectRoute(routeId)}
            />
          </div>

          {/* Official Transit Notices & Service Advisories */}
          <div className="page-stagger-2" style={{ marginBottom: 'var(--space-4)' }}>
            <ServiceNoticesBanner
              alerts={alerts}
              isLoading={isLoadingAlerts}
              error={alertsError}
              onRefresh={refreshAlerts}
            />
          </div>

          {/* Primary Two-Column Operations Layout */}
          <div className="dashboard-grid-layout page-stagger-3">
            {/* Left Column: Active Route & Live Telemetry Overview */}
            <div className="dashboard-column primary">
              <SelectedRouteCard
                district={district}
                selectedRoute={selectedRoute}
                isLoading={isLoadingRouteDetail}
                onOpenTimetable={() => handleOpenTimetable()}
              />

              <LiveBusOverview
                overviewState={liveOverview}
                selectedRoute={selectedRoute}
                onRefresh={refreshLiveOverview}
              />
            </div>

            {/* Right Column: Nearby Terminals & Quick Shortcuts */}
            <div className="dashboard-column secondary">
              <NearbyBusStands
                nearbyState={nearbyStands}
                onRequestLocation={handleRequestLocation}
                onBrowseDistrictStands={handleBrowseDistrictStands}
              />

              <QuickAccessGrid
                selectedRoute={selectedRoute}
                districtCode={district.code}
                onOpenTimetable={() => handleOpenTimetable()}
                onBrowseBusStands={handleBrowseDistrictStands}
                onScrollToGuidance={handleScrollToGuidance}
              />
            </div>
          </div>

          {/* Passenger Guidance (5 Simple Steps in English & Tamil) */}
          <div className="page-stagger-4">
            <PassengerGuidance />
          </div>
        </div>
      </main>

      {/* 3. Verified Timetable Dialog */}
      <TimetableModal
        modalState={timetableModal}
        onClose={handleCloseTimetable}
      />
    </div>
  );
};
