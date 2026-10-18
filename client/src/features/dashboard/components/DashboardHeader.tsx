/**
 * PERUNDHU (பேருந்து) — Dashboard Header Component (Step 6)
 * Features brand identity, active district & route badges with fast change actions,
 * language switcher, authenticated user profile menu, and sign-out action.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Route,
  Globe,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { Badge } from '../../../components/common/Badge';
import { DashboardDistrictInfo, DashboardRouteSummary } from '../types';

interface DashboardHeaderProps {
  district: DashboardDistrictInfo;
  selectedRoute: DashboardRouteSummary | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  district,
  selectedRoute
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="dashboard-header" role="banner">
      <div className="dashboard-header-container">
        {/* 1. Left Brand Identity */}
        <div className="dashboard-brand-group">
          <Link to="/" className="dashboard-brand-link" aria-label="PERUNDHU Home">
            <div className="dashboard-logo-icon" aria-hidden="true">
              <Bus size={22} />
            </div>
            <div className="dashboard-brand-text">
              <div className="dashboard-brand-tamil">பேருந்து</div>
              <div className="dashboard-brand-en">PERUNDHU • TNSTC</div>
            </div>
          </Link>

          {/* Active Pilot Indicator */}
          <Badge variant="success" className="dashboard-pilot-badge">
            <span>{language === 'ta' ? 'மதுரை முன்னோட்டம்' : 'Madurai Pilot'}</span>
          </Badge>
        </div>

        {/* 2. Middle Context Badges (Selected District & Route) */}
        <div className="dashboard-context-badges">
          {/* Selected District Badge */}
          <div className="dashboard-context-pill" data-testid="selected-district-pill">
            <MapPin size={14} className="dashboard-pill-icon" aria-hidden="true" />
            <div className="dashboard-pill-content">
              <span className="dashboard-pill-label">{t('dashboard.selected_district')}</span>
              <span className="dashboard-pill-val">
                {language === 'ta' ? district.nameTa : district.nameEn}
              </span>
            </div>
            <Link
              to="/districts"
              className="dashboard-pill-change-btn"
              title={t('dashboard.change_district')}
              aria-label={t('dashboard.change_district')}
            >
              {t('dashboard.change_district')}
            </Link>
          </div>

          {/* Selected Route Badge */}
          {selectedRoute ? (
            <div className="dashboard-context-pill" data-testid="selected-route-pill">
              <Route size={14} className="dashboard-pill-icon" aria-hidden="true" />
              <div className="dashboard-pill-content">
                <span className="dashboard-pill-label">{t('dashboard.selected_route')}</span>
                <span className="dashboard-pill-val">
                  {language === 'ta' ? `தடம் ${selectedRoute.routeNumber}` : `Route ${selectedRoute.routeNumber}`}
                </span>
              </div>
              <Link
                to={`/districts/${district.code.toLowerCase()}/routes`}
                className="dashboard-pill-change-btn"
                title={t('dashboard.change_route')}
                aria-label={t('dashboard.change_route')}
              >
                {t('dashboard.change_route')}
              </Link>
            </div>
          ) : (
            <Link
              to={`/districts/${district.code.toLowerCase()}/routes`}
              className="dashboard-choose-route-pill"
            >
              <Route size={14} aria-hidden="true" />
              <span>{t('dashboard.choose_route_btn')}</span>
            </Link>
          )}
        </div>

        {/* 3. Right Controls (Language & User Menu) */}
        <div className="dashboard-actions-group">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn btn-outline dashboard-lang-btn"
            aria-label={`Switch to ${language === 'ta' ? 'English' : 'தமிழ்'}`}
          >
            <Globe size={15} aria-hidden="true" />
            <span className="dashboard-lang-label">
              {language === 'ta' ? 'English' : 'தமிழ்'}
            </span>
          </button>

          {/* User Account / Profile Dropdown */}
          {isAuthenticated && user ? (
            <div className="dashboard-user-menu-wrapper">
              <button
                type="button"
                className="dashboard-user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="User Account Menu"
              >
                <div className="dashboard-user-avatar">
                  <User size={16} />
                </div>
                <span className="dashboard-user-name">{user.fullName}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {isUserMenuOpen && (
                <div className="dashboard-user-dropdown" role="menu">
                  <div className="dashboard-dropdown-header">
                    <div className="dashboard-dropdown-name">{user.fullName}</div>
                    <div className="dashboard-dropdown-email">{user.email}</div>
                    <Badge variant="neutral" style={{ marginTop: 'var(--space-1)' }}>
                      {user.role === 'ADMIN' ? 'TNSTC Admin' : 'Passenger'}
                    </Badge>
                  </div>
                  <div className="dashboard-dropdown-divider" />
                  <Link
                    to="/districts"
                    className="dashboard-dropdown-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <MapPin size={15} />
                    <span>{t('districts.title')}</span>
                  </Link>
                  <Link
                    to={`/districts/${district.code.toLowerCase()}/routes`}
                    className="dashboard-dropdown-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Route size={15} />
                    <span>{t('routes.title')}</span>
                  </Link>
                  <div className="dashboard-dropdown-divider" />
                  <button
                    type="button"
                    className="dashboard-dropdown-item dashboard-logout-item"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    <LogOut size={15} />
                    <span>{t('auth.sign_out')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Link to="/login" className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                {t('auth.sign_in_button')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="dashboard-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Drawer */}
      {isMobileMenuOpen && (
        <div className="dashboard-mobile-drawer" role="navigation">
          <div className="dashboard-mobile-context-stack">
            <div className="dashboard-mobile-pill-row">
              <span className="dashboard-pill-label">{t('dashboard.selected_district')}:</span>
              <strong>{language === 'ta' ? district.nameTa : district.nameEn}</strong>
              <Link to="/districts" className="dashboard-mobile-change-btn">
                {t('dashboard.change_district')}
              </Link>
            </div>
            <div className="dashboard-mobile-pill-row">
              <span className="dashboard-pill-label">{t('dashboard.selected_route')}:</span>
              <strong>
                {selectedRoute
                  ? `${language === 'ta' ? 'தடம்' : 'Route'} ${selectedRoute.routeNumber}`
                  : (language === 'ta' ? 'தேர்ந்தெடுக்கப்படவில்லை' : 'None Selected')}
              </strong>
              <Link
                to={`/districts/${district.code.toLowerCase()}/routes`}
                className="dashboard-mobile-change-btn"
              >
                {selectedRoute ? t('dashboard.change_route') : t('dashboard.choose_route_btn')}
              </Link>
            </div>
          </div>

          <div className="dashboard-mobile-links">
            <Link
              to="/districts"
              className="dashboard-mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MapPin size={16} />
              <span>{t('districts.title')}</span>
            </Link>
            <Link
              to={`/districts/${district.code.toLowerCase()}/routes`}
              className="dashboard-mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Route size={16} />
              <span>{t('routes.title')}</span>
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                className="dashboard-mobile-nav-link dashboard-mobile-logout"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                <span>{t('auth.sign_out')}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="dashboard-mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User size={16} />
                <span>{t('auth.sign_in_button')}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
