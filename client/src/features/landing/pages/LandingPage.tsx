import React, { useEffect } from 'react';
import { LandingHeader } from '../components/LandingHeader';
import { HeroSection } from '../components/HeroSection';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { PilotInformation } from '../components/PilotInformation';
import { LandingFooter } from '../components/LandingFooter';
import '../styles/landing.css';

/**
 * LandingPage Component (Preserving Exact Project Workflow)
 *
 * Official opening page for PERUNDHU (பேருந்து) — TNSTC Live Bus Tracking.
 * Orchestrates:
 * 1. LandingHeader
 * 2. HeroSection
 * 3. FeatureHighlights
 * 4. PilotInformation
 * 5. LandingFooter
 */
export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'PERUNDHU (பேருந்து) — TNSTC Live Bus Tracking';
  }, []);

  return (
    <div className="landing-container">
      <div className="page-stagger-1">
        <LandingHeader />
      </div>
      <main id="main-content" role="main">
        <div className="page-stagger-2">
          <HeroSection />
        </div>
        <div className="page-stagger-3">
          <FeatureHighlights />
        </div>
        <div className="page-stagger-4">
          <PilotInformation />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

