/**
 * PERUNDHU (பேருந்து) — Quantum App Shell
 * Top-level application layout orchestrating global route transitions,
 * top progress beam, animated bus page-to-page curtain, and viewport scroll synchronization.
 */

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RouteProgressBar, PageTransition, PremiumFrontOpening } from '../components/common';

export const AppShell: React.FC = () => {
  const location = useLocation();

  // Instant scroll-to-top on page navigation
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior
    });
  }, [location.pathname]);

  return (
    <div className="perundhu-quantum-app">
      <PremiumFrontOpening />
      <RouteProgressBar />
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </div>
  );
};
