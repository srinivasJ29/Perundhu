/**
 * PERUNDHU (பேருந்து) — Passenger Guidance Component
 * Concise 5-step visual guide for rural citizens, senior passengers, students,
 * and first-time commuters in Tamil and English.
 */

import React from 'react';
import {
  MapPin,
  Route,
  Calendar,
  Radio,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

export const PassengerGuidance: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: 1,
      icon: <MapPin size={20} color="var(--color-primary-teal)" />,
      titleKey: 'dashboard.step1_title',
      descKey: 'dashboard.step1_desc'
    },
    {
      num: 2,
      icon: <Route size={20} color="var(--color-primary-teal)" />,
      titleKey: 'dashboard.step2_title',
      descKey: 'dashboard.step2_desc'
    },
    {
      num: 3,
      icon: <Calendar size={20} color="var(--color-primary-teal)" />,
      titleKey: 'dashboard.step3_title',
      descKey: 'dashboard.step3_desc'
    },
    {
      num: 4,
      icon: <Radio size={20} color="var(--color-primary-teal)" />,
      titleKey: 'dashboard.step4_title',
      descKey: 'dashboard.step4_desc'
    },
    {
      num: 5,
      icon: <Navigation size={20} color="var(--color-primary-teal)" />,
      titleKey: 'dashboard.step5_title',
      descKey: 'dashboard.step5_desc'
    }
  ];

  return (
    <section
      id="passenger-guidance-section"
      className="guidance-section"
      aria-labelledby="guidance-heading"
    >
      <div className="guidance-header">
        <h2 id="guidance-heading" className="guidance-title">
          {t('dashboard.guidance_title')}
        </h2>
        <p className="guidance-subtitle">{t('dashboard.guidance_subtitle')}</p>
      </div>

      <div className="guidance-grid">
        {steps.map((step) => (
          <div key={step.num} className="guidance-card">
            <div className="guidance-card-top">
              <div className="guidance-icon-box">{step.icon}</div>
              <div className="guidance-step-badge">
                <CheckCircle2 size={12} />
                <span>Step {step.num}</span>
              </div>
            </div>
            <h3 className="guidance-card-title">{t(step.titleKey)}</h3>
            <p className="guidance-card-desc">{t(step.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
