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
