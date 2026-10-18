import { createBrowserRouter } from 'react-router-dom';
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
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/map',
    element: <LiveMapPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/routes/:routeId',
    element: <LiveMapPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/districts/:districtId/routes/:routeId',
    element: <LiveMapPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/signup',
    element: <SignupPage />,
    errorElement: <ErrorBoundary />
  },
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
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
]);
