import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RootLayout } from './RootLayout';
import { DevShell } from './DevShell';
import { NotFound } from './NotFound';
import { ErrorBoundary } from './ErrorBoundary';
import { LandingPage } from '../features/landing';
import { OnboardingPage } from '../features/onboarding';
import { LoginPage, SignupPage } from '../features/auth';
import { DistrictSelectionPage } from '../features/districts';
import { RouteSelectionPage, LiveTrackingPlaceholder } from '../features/routes';
import { DashboardPage } from '../features/dashboard';
import { LiveMapPage } from '../features/map';
import {
  OperationsHubPage,
  DepotManagementPage,
  DepotDetailsPage,
  ReserveFleetPage,
  WorkshopManagementPage,
  BusStandManagementPage,
  DepotTransferPage,
  FleetManagementPage,
  BusDetailsPage,
  DriverManagementPage,
  DriverDetailsPage,
  ConductorManagementPage,
  ConductorDetailsPage,
  EtmRegistryPage,
  GpsTrackerRegistryPage,
  DeviceAssignmentPage,
  FleetDeviceMonitoringPage,
  TransportAdminDashboardPage,
  DepotManagerDashboardPage,
  DispatcherDashboardPage,
  DriverDashboardPage,
  ConductorDashboardPage
} from '../features/management';
import { AnalyticsDashboardPage } from '../features/analytics/pages/AnalyticsDashboardPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/',
        element: <LandingPage />
      },
      {
        path: '/dashboard',
        element: <DashboardPage />
      },
      {
        path: '/map',
        element: <LiveMapPage />
      },
      {
        path: '/routes/:routeId',
        element: <LiveMapPage />
      },
      {
        path: '/districts/:districtId/routes/:routeId',
        element: <LiveMapPage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/signup',
        element: <SignupPage />
      },
      {
        element: <RootLayout />,
        children: [
          {
            path: '/operations',
            element: <OperationsHubPage />
          },
          {
            path: '/operations/admin-dashboard',
            element: <TransportAdminDashboardPage />
          },
          {
            path: '/operations/depot-dashboard',
            element: <DepotManagerDashboardPage />
          },
          {
            path: '/operations/dispatcher-dashboard',
            element: <DispatcherDashboardPage />
          },
          {
            path: '/operations/driver-dashboard',
            element: <DriverDashboardPage />
          },
          {
            path: '/operations/conductor-dashboard',
            element: <ConductorDashboardPage />
          },
          {
            path: '/driver',
            element: <DriverDashboardPage />
          },
          {
            path: '/conductor',
            element: <ConductorDashboardPage />
          },
          {
            path: '/operations/fleet',
            element: <FleetManagementPage />
          },
          {
            path: '/operations/fleet/:busId',
            element: <BusDetailsPage />
          },
          {
            path: '/operations/drivers',
            element: <DriverManagementPage />
          },
          {
            path: '/operations/drivers/:driverId',
            element: <DriverDetailsPage />
          },
          {
            path: '/operations/conductors',
            element: <ConductorManagementPage />
          },
          {
            path: '/operations/conductors/:conductorId',
            element: <ConductorDetailsPage />
          },
          {
            path: '/operations/etms',
            element: <EtmRegistryPage />
          },
          {
            path: '/operations/gps-trackers',
            element: <GpsTrackerRegistryPage />
          },
          {
            path: '/operations/assignments',
            element: <DeviceAssignmentPage />
          },
          {
            path: '/operations/monitoring',
            element: <FleetDeviceMonitoringPage />
          },
          {
            path: '/operations/analytics',
            element: <AnalyticsDashboardPage />
          },
          {
            path: '/operations/depots',
            element: <DepotManagementPage />
          },
          {
            path: '/operations/depots/:depotId',
            element: <DepotDetailsPage />
          },
          {
            path: '/operations/reserve-fleet',
            element: <ReserveFleetPage />
          },
          {
            path: '/operations/workshops',
            element: <WorkshopManagementPage />
          },
          {
            path: '/operations/bus-stands',
            element: <BusStandManagementPage />
          },
          {
            path: '/operations/transfers',
            element: <DepotTransferPage />
          },
          {
            path: '/districts',
            element: <DistrictSelectionPage />
          },
          {
            path: '/districts/:districtId/routes',
            element: <RouteSelectionPage />
          },
          {
            path: '/routes',
            element: <RouteSelectionPage />
          },
          {
            path: '/live-tracking-preview',
            element: <LiveTrackingPlaceholder />
          },
          {
            path: '/onboarding',
            element: <OnboardingPage />
          },
          {
            path: '/dev',
            element: <DevShell />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      }
    ]
  }
]);
