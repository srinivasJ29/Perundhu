/**
 * PERUNDHU (பேருந்து) — Ultra-Premium Front Opening Experience
 *
 * Cinematic luxury introduction displayed ONLY on front app launch/opening.
 * Designed with:
 * - Pure Onyx Black stage with perspective highway grid
 * - Electric Yellow laser guidelines and glowing headlights
 * - Handcrafted high-definition TNSTC Express Bus with golden underglow & spinning rims
 * - Dynamic system initialization telemetry
 * - Clean entry into the White / Black / Yellow application interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, X, Radio } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface PremiumFrontOpeningProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export const PremiumFrontOpening: React.FC<PremiumFrontOpeningProps> = ({
  forceShow = false,
  onComplete
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<'cruising' | 'approaching' | 'docked'>('cruising');

  // Check whether intro has already been shown in current session
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setProgress(0);
      setStage('cruising');
      return;
    }

    const hasPlayed = sessionStorage.getItem('perundhu_front_opening_played');
    if (!hasPlayed) {
      setIsOpen(true);
      sessionStorage.setItem('perundhu_front_opening_played', 'true');
    }

    const handleReplay = () => {
      setProgress(0);
      setStage('cruising');
      setIsOpen(true);
    };

    window.addEventListener('perundhu:replay-opening', handleReplay);
    return () => window.removeEventListener('perundhu:replay-opening', handleReplay);
  }, [forceShow]);

  // Handle closing / completion
  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    sessionStorage.setItem('perundhu_front_opening_played', 'true');
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Timed progress sequence for the opening reveal
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    const s1 = setTimeout(() => setStage('approaching'), 1000);
    const s2 = setTimeout(() => setStage('docked'), 2200);

    // Auto-dismiss after 3.6s if user doesn't click
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(autoDismissTimer);
    };
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div className="premium-front-opening-overlay" role="dialog" aria-modal="true" aria-label="PERUNDHU Premium Opening">
      {/* Background Deep Obsidian Void with Golden Star Dust */}
      <div className="opening-cosmic-backdrop" />

      {/* Top Bar with Brand Badge & Quick Skip */}
      <div className="opening-top-bar">
        <div className="opening-brand-badge">
          <span className="opening-dot-pulse" />
          <Radio size={14} className="opening-radio-icon" />
          <span>TNSTC SMART TRANSIT • LIVE SYSTEM</span>
        </div>

        <button
          type="button"
          className="opening-skip-btn"
          onClick={handleDismiss}
          aria-label="Skip Introduction"
        >
          <span>{language === 'ta' ? 'தவிர்' : 'Skip Intro'}</span>
          <X size={14} />
        </button>
      </div>

      {/* Central 3D Highway Stage with Cruising Bus */}
      <div className="opening-stage-container">
        {/* Perspective Highway Grid with Golden Neon Horizon */}
        <div className="opening-perspective-highway">
          <div className="opening-horizon-glow" />
          <div className="opening-highway-roadbed">
            <div className="opening-highway-centerline" />
            <div className="opening-highway-yellow-guides" />
          </div>
        </div>

        {/* Cinematic High-Speed Laser Speed Lines */}
        <div className="opening-speed-lasers" aria-hidden="true">
          <span className="laser l-1" />
          <span className="laser l-2" />
          <span className="laser l-3" />
          <span className="laser l-4" />
        </div>

        {/* Handcrafted Luxury TNSTC Express Bus */}
        <div className={`opening-hero-bus-carrier stage-${stage}`}>
          {/* Headlight Cones (Dual High-Intensity Xenon Glow) */}
          <div className="opening-headlight-flare flare-top" />
          <div className="opening-headlight-flare flare-bottom" />

          {/* Golden Ground Underglow Neon */}
          <div className="opening-bus-underglow" />

          {/* High-Definition Vector Bus Body */}
          <svg
            className="opening-vector-bus"
            viewBox="0 0 320 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="busBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#064E3B" />
                <stop offset="50%" stopColor="#047857" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="goldStripeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EAB308" />
                <stop offset="50%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
              <linearGradient id="darkChassis" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#09090B" />
                <stop offset="100%" stopColor="#18181B" />
              </linearGradient>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Aerodynamic Luxury Bus Chassis */}
            <path
              d="M18 24 C18 16, 26 12, 38 12 L280 12 C296 12, 312 22, 316 40 L318 88 C318 94, 314 96, 308 96 L24 96 C20 96, 18 92, 18 86 Z"
              fill="url(#busBodyGrad)"
              stroke="#065F46"
              strokeWidth="2"
            />

            {/* Aerodynamic Roof AC Unit & Dynamic Air Scoop */}
            <rect x="70" y="5" width="130" height="7" rx="3.5" fill="#E2E8F0" />
            <rect x="75" y="7" width="120" height="3" rx="1.5" fill="#94A3B8" />

            {/* Signature Electric Yellow / Gold Racing Stripe */}
            <path d="M18 42 L315 42 L314 50 L18 50 Z" fill="url(#goldStripeGrad)" filter="url(#goldGlow)" />

            {/* Pure White Upper Body Band */}
            <path d="M18 36 L313 36 L313 41 L18 41 Z" fill="#FFFFFF" />

            {/* Jet Black Lower Rocker Panel */}
            <path d="M18 84 L318 84 L318 96 L18 96 Z" fill="url(#darkChassis)" />

            {/* Glowing Golden LED Matrix Destination Display */}
            <rect x="235" y="16" width="70" height="15" rx="3" fill="#0A0A0A" stroke="#27272A" strokeWidth="1" />
            <text x="270" y="27" fill="#FACC15" fontSize="8.5" fontWeight="900" fontFamily="monospace" textAnchor="middle" filter="url(#goldGlow)">
              TNSTC 70 • மதுரை
            </text>

            {/* Panoramic Tinted Glass Windows */}
            <path d="M272 38 L308 40 C310 46, 311 54, 311 64 L272 64 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="232" y="40" width="34" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="190" y="40" width="36" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="148" y="40" width="36" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="106" y="40" width="36" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="50" y="40" width="50" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />

            {/* Illuminated Passenger Silhouettes */}
            <circle cx="208" cy="50" r="4.5" fill="#FACC15" opacity="0.85" />
            <circle cx="166" cy="50" r="4.5" fill="#FACC15" opacity="0.85" />
            <circle cx="124" cy="50" r="4.5" fill="#FACC15" opacity="0.85" />

            {/* Dual Front Xenon High-Beam Headlights */}
            <ellipse cx="316" cy="74" rx="3" ry="5" fill="#FEF08A" filter="url(#goldGlow)" />
            <ellipse cx="316" cy="74" rx="1.5" ry="3" fill="#FFFFFF" />

            {/* Rear LED Ruby Safety Tail Lamps */}
            <rect x="17" y="68" width="3" height="12" rx="1.5" fill="#EF4444" />

            {/* Front Wheel Assembly (High Speed Rotating Chrome Rims) */}
            <g className="opening-wheel-group front">
              <circle cx="265" cy="96" r="17" fill="#09090B" stroke="#18181B" strokeWidth="2" />
              <circle cx="265" cy="96" r="10" fill="#27272A" stroke="#EAB308" strokeWidth="1.5" />
              <circle cx="265" cy="96" r="4.5" fill="#FACC15" />
              {/* Spinning Spokes */}
              <line x1="265" y1="86" x2="265" y2="106" stroke="#FFFFFF" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="255" y1="96" x2="275" y2="96" stroke="#FFFFFF" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="258" y1="89" x2="272" y2="103" stroke="#FACC15" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="258" y1="103" x2="272" y2="89" stroke="#FACC15" strokeWidth="1.5" className="wheel-spin-spoke" />
            </g>

            {/* Rear Dual Axle Wheel Assembly */}
            <g className="opening-wheel-group rear">
              <circle cx="82" cy="96" r="17" fill="#09090B" stroke="#18181B" strokeWidth="2" />
              <circle cx="82" cy="96" r="10" fill="#27272A" stroke="#EAB308" strokeWidth="1.5" />
              <circle cx="82" cy="96" r="4.5" fill="#FACC15" />
              {/* Spinning Spokes */}
              <line x1="82" y1="86" x2="82" y2="106" stroke="#FFFFFF" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="72" y1="96" x2="92" y2="96" stroke="#FFFFFF" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="75" y1="89" x2="89" y2="103" stroke="#FACC15" strokeWidth="1.5" className="wheel-spin-spoke" />
              <line x1="75" y1="103" x2="89" y2="89" stroke="#FACC15" strokeWidth="1.5" className="wheel-spin-spoke" />
            </g>
          </svg>
        </div>
      </div>

      {/* Luxury Typography & Entrance Status */}
      <div className="opening-content-panel">
        <div className="opening-gold-pill">
          <Sparkles size={14} className="opening-sparkle" />
          <span>{language === 'ta' ? 'அதிநவீன நேரலை பேருந்து கண்காணிப்பு' : 'PREMIUM LIVE TRANSIT NETWORK'}</span>
        </div>

        <h1 className="opening-title">
          <span className="opening-title-tamil">பேருந்து</span>
          <span className="opening-title-separator">•</span>
          <span className="opening-title-english">PERUNDHU</span>
        </h1>

        <p className="opening-subtitle">
          {language === 'ta'
            ? 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழகத்தின் துல்லிய நேரலை கண்காணிப்பு தளம்'
            : 'Tamil Nadu State Transport Corporation — Real-Time Bus Telemetry Platform'}
        </p>

        {/* Live System Diagnostics Badges */}
        <div className="opening-telemetry-chips">
          <div className="telemetry-chip active">
            <span className="chip-dot yellow" />
            <span>GPS TELEMETRY: <strong>LIVE</strong></span>
          </div>
          <div className="telemetry-chip active">
            <span className="chip-dot yellow" />
            <span>MADURAI PILOT: <strong>ACTIVE</strong></span>
          </div>
          <div className="telemetry-chip">
            <span className="chip-dot white" />
            <span>ACCURACY: <strong>SNAPPED</strong></span>
          </div>
        </div>

        {/* Golden Progress Meter */}
        <div className="opening-progress-wrapper">
          <div className="opening-progress-track">
            <div
              className="opening-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="opening-progress-labels">
            <span>{language === 'ta' ? 'அமைப்பு தயாராகிறது...' : 'Initializing Systems...'}</span>
            <span className="progress-num">{progress}%</span>
          </div>
        </div>

        {/* Action Button: Board Now */}
        <div className="opening-actions-row">
          <button
            type="button"
            className="opening-board-btn"
            onClick={handleDismiss}
          >
            <span>{language === 'ta' ? 'பயணத்தைத் தொடங்கு' : 'Enter PERUNDHU'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
