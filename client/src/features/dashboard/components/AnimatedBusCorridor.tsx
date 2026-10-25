/**
 * PERUNDHU (பேருந்து) — Animated Bus Highway Corridor
 * Features a high-speed vector TNSTC transit bus driving across an asphalt highway
 * with animated dashed lane markings, glowing headlights, rotating wheel hubs,
 * passenger silhouettes, terminal milestone markers, and live telemetry.
 */

import React, { useState } from 'react';
import { ArrowRight, Play, Pause, Zap, Compass, Flag } from 'lucide-react';

interface AnimatedBusCorridorProps {
  originStopName: string;
  destStopName: string;
  routeNumber: string;
  language: 'ta' | 'en';
  directionCode: 'OUTBOUND' | 'INBOUND';
  totalDistanceKm: number;
  estimatedDurationMins: number;
}

export const AnimatedBusCorridor: React.FC<AnimatedBusCorridorProps> = ({
  originStopName,
  destStopName,
  routeNumber,
  language,
  directionCode,
  totalDistanceKm,
  estimatedDurationMins
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  const toggleTurbo = () => setIsTurbo((prev) => !prev);

  const currentSpeed = isTurbo ? '58 km/h' : '42 km/h';

  return (
    <div className="animated-bus-corridor-wrapper">
      {/* 1. Terminal Headers & Semantic DOM for Test Compatibility */}
      <div className="selected-route-terminals-card">
        <div className="terminal-node origin">
          <div className="terminal-dot origin" aria-hidden="true">
            <span className="terminal-pulse-ring" />
          </div>
          <div className="terminal-info">
            <span className="terminal-tag">
              {language === 'ta' ? 'புறப்படும் இடம்' : 'Origin Stop'}
            </span>
            <strong className="terminal-name">{originStopName}</strong>
          </div>
        </div>

        <div className="terminal-connector">
          <ArrowRight size={18} className="terminal-arrow" aria-hidden="true" />
          <span className="terminal-corridor-label">TNSTC Corridor</span>
        </div>

        <div className="terminal-node destination">
          <div className="terminal-dot destination" aria-hidden="true">
            <span className="terminal-pulse-ring destination" />
          </div>
          <div className="terminal-info">
            <span className="terminal-tag">
              {language === 'ta' ? 'சேருமிடம்' : 'Destination Stop'}
            </span>
            <strong className="terminal-name">{destStopName}</strong>
          </div>
        </div>
      </div>

      {/* 2. Living Transit Highway Canvas */}
      <div className={`highway-canvas ${isPlaying ? 'running' : 'paused'} ${isTurbo ? 'turbo' : ''}`}>
        {/* Top Asphalt Curb & Telemetry HUD */}
        <div className="highway-hud-bar">
          <div className="hud-telemetry-badge">
            <span className="hud-live-dot" />
            <span className="hud-label">
              {language === 'ta' ? 'நேரலை பேருந்து இயக்கம்' : 'LIVE TRANSIT CRUISE'}
            </span>
            <span className="hud-separator">•</span>
            <span className="hud-speed">{currentSpeed}</span>
          </div>

          <div className="hud-controls-group">
            <button
              type="button"
              className={`hud-ctrl-btn ${isTurbo ? 'active' : ''}`}
              onClick={toggleTurbo}
              title={language === 'ta' ? 'வேகத்தை மாற்றுக' : 'Toggle Cruise Speed'}
              aria-label="Toggle Turbo Speed"
            >
              <Zap size={12} />
              <span>{isTurbo ? 'TURBO' : 'NORMAL'}</span>
            </button>
            <button
              type="button"
              className="hud-ctrl-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause animation' : 'Play animation'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>

        {/* Asphalt Road Track with Animated Lane Stripes */}
        <div className="asphalt-road-bed">
          {/* Reflective Road Studs (Cat's Eyes) */}
          <div className="road-studs-line top" />

          {/* Lane Divider Dashes */}
          <div className="highway-lane-divider" />

          {/* Road Waypoint Indicators */}
          <div className="highway-milestone-marker origin">
            <div className="marker-pole" />
            <span className="marker-label">{language === 'ta' ? 'தொடக்க நிலையம்' : 'Terminal A'}</span>
          </div>

          <div className="highway-milestone-marker midpoint">
            <div className="midpoint-dot" />
            <span className="marker-label">{language === 'ta' ? 'இடைவழி' : 'Midpoint'}</span>
          </div>

          <div className="highway-milestone-marker destination">
            <div className="marker-pole destination" />
            <span className="marker-label">{language === 'ta' ? 'சேருமிடம்' : 'Terminal B'}</span>
          </div>

          {/* The Cruising TNSTC Bus Vector */}
          <div className={`cruising-bus-chassis ${directionCode === 'INBOUND' ? 'inbound' : 'outbound'}`}>
            {/* Headlight illumination beam casting forward */}
            <div className="headlight-beam" />

            {/* Exhaust puff animation */}
            <div className="exhaust-puff-stream">
              <span className="puff p1" />
              <span className="puff p2" />
              <span className="puff p3" />
            </div>

            {/* Detailed Tamil Nadu Government Bus SVG */}
            <svg
              className="tnstc-vector-bus"
              viewBox="0 0 170 68"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label={`TNSTC Bus Route ${routeNumber}`}
            >
              {/* Bus Shadow */}
              <ellipse cx="85" cy="65" rx="72" ry="3.5" fill="rgba(0, 0, 0, 0.45)" filter="blur(2px)" />

              {/* Main Body (TNSTC Emerald Green) */}
              <path
                d="M12 18 C12 14, 16 12, 22 12 L146 12 C156 12, 165 17, 166 28 L167 52 C167 55, 165 56, 162 56 L16 56 C13 56, 12 54, 12 51 Z"
                fill="url(#busBodyGrad)"
              />

              {/* White/Cream Upper Stripe (Iconic TNSTC livery) */}
              <path
                d="M12 24 L166 24 L165.5 30 L12 30 Z"
                fill="#FEF9C3"
                opacity="0.95"
              />

              {/* Navy Trim Lower Skirt */}
              <path
                d="M12 48 L166.5 48 L166.8 54 C166.8 55.5, 165.5 56, 162 56 L16 56 C13 56, 12 54.5, 12 53 Z"
                fill="#0F2B2B"
              />

              {/* Digital LED Route Display Board */}
              <rect x="124" y="15" width="36" height="7.5" rx="2" fill="#18181B" stroke="#27272A" strokeWidth="0.8" />
              <text
                x="142"
                y="21"
                fill="#FBBF24"
                fontSize="6"
                fontWeight="900"
                fontFamily="monospace"
                textAnchor="middle"
                className="led-display-text"
              >
                {routeNumber} MDU
              </text>

              {/* Side Passenger Windows */}
              <g className="bus-windows">
                {/* Windshield (Front Slanted Glass) */}
                <path
                  d="M142 25 L163 26 C164 30, 164.5 35, 164.5 40 L142 40 Z"
                  fill="url(#glassGrad)"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                {/* Driver Window */}
                <rect x="122" y="26" width="17" height="14" rx="1.5" fill="url(#glassGrad)" stroke="#1E293B" strokeWidth="1" />
                {/* Passenger Window 1 */}
                <rect x="98" y="26" width="20" height="14" rx="1.5" fill="url(#glassGrad)" stroke="#1E293B" strokeWidth="1" />
                {/* Passenger Window 2 */}
                <rect x="74" y="26" width="20" height="14" rx="1.5" fill="url(#glassGrad)" stroke="#1E293B" strokeWidth="1" />
                {/* Passenger Window 3 */}
                <rect x="50" y="26" width="20" height="14" rx="1.5" fill="url(#glassGrad)" stroke="#1E293B" strokeWidth="1" />
                {/* Rear Window */}
                <rect x="22" y="26" width="24" height="14" rx="1.5" fill="url(#glassGrad)" stroke="#1E293B" strokeWidth="1" />

                {/* Passenger Silhouettes inside windows */}
                <circle cx="106" cy="33" r="2.8" fill="#334155" opacity="0.75" />
                <circle cx="82" cy="33" r="2.8" fill="#334155" opacity="0.75" />
                <circle cx="58" cy="33" r="2.8" fill="#334155" opacity="0.75" />
                <circle cx="32" cy="33" r="2.8" fill="#334155" opacity="0.75" />
              </g>

              {/* Headlights (Front Glowing Pods) */}
              <circle cx="165.5" cy="46" r="3" fill="#FEF08A" filter="url(#glowFilter)" />
              <circle cx="165" cy="46" r="1.8" fill="#FFFFFF" />

              {/* Rear Tail Lights */}
              <rect x="11.5" y="44" width="2" height="6" rx="1" fill="#EF4444" filter="url(#redGlowFilter)" />

              {/* Front Wheel Well & Animated Wheel */}
              <g className="wheel-group front">
                <path d="M124 56 A12 12 0 0 1 148 56 Z" fill="#0B1619" />
                <circle cx="136" cy="56" r="9.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="136" cy="56" r="5.5" fill="#94A3B8" />
                <circle cx="136" cy="56" r="2.5" fill="#0D9488" />
                {/* Spokes */}
                <line x1="136" y1="50.5" x2="136" y2="61.5" stroke="#CBD5E1" strokeWidth="1.2" className="wheel-spoke" />
                <line x1="130.5" y1="56" x2="141.5" y2="56" stroke="#CBD5E1" strokeWidth="1.2" className="wheel-spoke" />
              </g>

              {/* Rear Wheel Well & Animated Wheel */}
              <g className="wheel-group rear">
                <path d="M32 56 A12 12 0 0 1 56 56 Z" fill="#0B1619" />
                <circle cx="44" cy="56" r="9.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="44" cy="56" r="5.5" fill="#94A3B8" />
                <circle cx="44" cy="56" r="2.5" fill="#0D9488" />
                {/* Spokes */}
                <line x1="44" y1="50.5" x2="44" y2="61.5" stroke="#CBD5E1" strokeWidth="1.2" className="wheel-spoke" />
                <line x1="38.5" y1="56" x2="49.5" y2="56" stroke="#CBD5E1" strokeWidth="1.2" className="wheel-spoke" />
              </g>

              {/* Gradients & Filters */}
              <defs>
                <linearGradient id="busBodyGrad" x1="12" y1="12" x2="167" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#047857" />
                  <stop offset="0.45" stopColor="#059669" />
                  <stop offset="0.8" stopColor="#10B981" />
                  <stop offset="1" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#7DD3FC" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#0284C7" stopOpacity="0.95" />
                </linearGradient>

                <filter id="glowFilter" x="155" y="36" width="22" height="20" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <filter id="redGlowFilter" x="5" y="38" width="15" height="18" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
            </svg>
          </div>

          {/* Bottom Asphalt Curb Line */}
          <div className="road-studs-line bottom" />
        </div>

        {/* Live Corridor Quick Stats Strip */}
        <div className="highway-stats-strip">
          <div className="strip-item">
            <Compass size={13} className="strip-icon" />
            <span>
              {language === 'ta' ? 'திசை: ' : 'Direction: '}
              <strong>{directionCode === 'OUTBOUND' ? 'Outbound' : 'Inbound'}</strong>
            </span>
          </div>
          <div className="strip-item">
            <Zap size={13} className="strip-icon" />
            <span>
              {language === 'ta' ? 'பயண நேரம்: ' : 'Travel Time: '}
              <strong>{estimatedDurationMins} Minutes</strong>
            </span>
          </div>
          <div className="strip-item">
            <Flag size={13} className="strip-icon" />
            <span>
              {language === 'ta' ? 'வழித்தட நீளம்: ' : 'Corridor Length: '}
              <strong>{totalDistanceKm} Kilometers</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
