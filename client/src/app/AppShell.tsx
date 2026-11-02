/**
 * PERUNDHU (பேருந்து) — Quantum App Shell
 * Top-level application layout orchestrating global route transitions,
 * glowing progress beam, and AI Transit Copilot (LangGraph & LangChain).
 */

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RouteProgressBar, PageTransition } from '../components/common';
import {
  AiCopilotProvider,
  AiCopilotDrawer,
  AiCopilotFloatingButton
} from '../features/ai-copilot';

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
    <AiCopilotProvider>
      <div className="perundhu-quantum-app">
        <RouteProgressBar />
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
        <AiCopilotDrawer />
        <AiCopilotFloatingButton />
      </div>
    </AiCopilotProvider>
  );
};
