import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { LandingPage, LanguageSelector, TNSTCLogo, BusHeroImage } from '../src/features/landing';
import { OnboardingPage } from '../src/features/onboarding';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <I18nProvider>
        {ui}
      </I18nProvider>
    </MemoryRouter>
  );
};

describe('Landing Page & Step 2 Branding Experience', () => {
  it('should render the landing page with main headline and primary call to action', () => {
    renderWithProviders(<LandingPage />);

    // Brand title presence
    expect(screen.getAllByText(/PERUNDHU|பேருந்து/i).length).toBeGreaterThan(0);

    // Primary CTA buttons exist
    const ctaButtons = screen.getAllByRole('button', { name: /தொடங்குங்கள்|Get Started/i });
    expect(ctaButtons.length).toBeGreaterThan(0);

    // Feature highlights section heading exists
    expect(screen.getByRole('heading', { level: 2, name: /Built for Every Tamil Nadu Passenger|தமிழ்நாட்டுப் பயணிகளுக்காக பிரத்யேகமாக உருவாக்கப்பட்டது/i })).toBeInTheDocument();
  });

  it('should switch between Tamil and English dynamically without reloading', () => {
    renderWithProviders(
      <div>
        <LanguageSelector />
        <LandingPage />
      </div>
    );

    // Find English button and switch to English
    const enButtons = screen.getAllByRole('button', { name: /English|Switch to English/i });
    fireEvent.click(enButtons[0]);

    // Check English hero heading
    expect(screen.getByText('Your Journey. Your Bus. Your Tamil Nadu.')).toBeInTheDocument();

    // Find Tamil button and switch back
    const taButtons = screen.getAllByRole('button', { name: /தமிழ்|தமிழுக்கு மாறுக/i });
    fireEvent.click(taButtons[0]);

    // Check Tamil hero heading
    expect(screen.getByText('உங்கள் பயணம். உங்கள் பேருந்து. உங்கள் தமிழ்நாடு.')).toBeInTheDocument();
  });

  it('should render the TNSTCLogo with accessible alternative text or fallback', () => {
    renderWithProviders(<TNSTCLogo size="md" />);
    const logoOrFallback = screen.getByRole('img');
    const accessibleText = logoOrFallback.getAttribute('aria-label') || logoOrFallback.getAttribute('alt');
    expect(accessibleText).toBeDefined();
    expect(accessibleText?.length).toBeGreaterThan(0);
  });

  it('should render the BusHeroImage with appropriate accessible region or image tag', () => {
    renderWithProviders(<BusHeroImage />);
    const card = screen.getByTestId('bus-hero-card');
    expect(card).toBeInTheDocument();

    const img = screen.queryByRole('img');
    if (img) {
      fireEvent.error(img);
    }
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should render OnboardingPage with Step 3 scope badge and back button', () => {
    renderWithProviders(<OnboardingPage />);
    expect(screen.getByText(/Coming in Step 3|படி 3-ல் வரவிருக்கிறது/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Home|முகப்புக்குத் திரும்புக/i })).toBeInTheDocument();
  });
});
