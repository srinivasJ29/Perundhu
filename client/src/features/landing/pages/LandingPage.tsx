import React, { useEffect } from 'react';
import { LandingHeader } from '../components/LandingHeader';
import { HeroSection } from '../components/HeroSection';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { PilotInformation } from '../components/PilotInformation';
import { LandingFooter } from '../components/LandingFooter';
import '../styles/landing.css';

/**
 * LandingPage Component (Step 2 Entry Point)
 *
 * The official opening page for PERUNDHU (பேருந்து) — TNSTC Live Bus Tracking.
 * Introduces the brand, the Madurai pilot corridor, core transit tracking capabilities,
 * bilingual Tamil/English preferences, and leads into the future passenger onboarding flow.
 */
export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Set descriptive page title for accessibility & SEO
    document.title = 'PERUNDHU (பேருந்து) — TNSTC Live Bus Tracking';
  }, []);

  return (
    <div className="landing-container">
      <LandingHeader />
      <main id="main-content" role="main">
        <HeroSection />
        <FeatureHighlights />
        <PilotInformation />
      </main>
      <LandingFooter />
    </div>
  );
};
