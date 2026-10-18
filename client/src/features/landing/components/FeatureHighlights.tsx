import React from 'react';
import { MapPin, Route, Radio, Clock } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

/**
 * FeatureHighlights Component
 *
 * Restrained, factual introduction to the four primary capabilities of PERUNDHU:
 * 1. Find Bus Stops
 * 2. Explore Routes
 * 3. Track Buses
 * 4. Check Arrivals
 */
export const FeatureHighlights: React.FC = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      id: 'stops',
      icon: <MapPin size={22} />,
      title: t('landing.feature_stops_title'),
      desc: t('landing.feature_stops_desc')
    },
    {
      id: 'routes',
      icon: <Route size={22} />,
      title: t('landing.feature_routes_title'),
      desc: t('landing.feature_routes_desc')
    },
    {
      id: 'tracking',
      icon: <Radio size={22} />,
      title: t('landing.feature_tracking_title'),
      desc: t('landing.feature_tracking_desc')
    },
    {
      id: 'arrivals',
      icon: <Clock size={22} />,
      title: t('landing.feature_arrivals_title'),
      desc: t('landing.feature_arrivals_desc')
    }
  ];

  return (
    <section id="features" className="landing-features" aria-labelledby="features-heading">
      <div className="app-container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">
            {language === 'ta' ? 'அடிப்படை வசதிகள்' : 'Core Capabilities'}
          </span>
          <h2 id="features-heading" className="section-title">
            {t('landing.features_title')}
          </h2>
          <p className="section-subtitle">
            {t('landing.features_subtitle')}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="features-grid">
          {features.map((item) => (
            <article key={item.id} className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
