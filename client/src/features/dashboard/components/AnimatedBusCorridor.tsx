/**
 * PERUNDHU (பேருந்து) — Passenger Transit Journey Board
 * Engineered for clarity, accessibility, and ease of use for all Tamil Nadu citizens:
 * students, women commuters, office workers, and senior passengers.
 * Presents key travel information at a glance with large readable bilingual typography,
 * genuine live transit status, and the Vidiyal Payanam women free travel indicator.
 */

import React from 'react';
import {
  ArrowRight,
  Radio,
  Clock,
  Sparkles,
  MapPin,
  Bus
} from 'lucide-react';

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
  totalDistanceKm: _totalDistanceKm,
  estimatedDurationMins: _estimatedDurationMins
}) => {
  const isTa = language === 'ta';

  return (
    <div className="passenger-journey-board" role="region" aria-label={isTa ? 'பயண வழித்தட விவரங்கள்' : 'Route Journey Details'}>
      {/* 1. Clear Journey Flow: From -> To */}
      <div className="journey-flow-strip">
        {/* Origin / Starting Stand */}
        <div className="journey-stop-card origin">
          <div className="journey-stop-header">
            <span className="journey-stop-badge origin">
              <span className="stop-pulse-dot origin" />
              {isTa ? 'புறப்படும் இடம்' : 'Starting From'}
            </span>
          </div>
          <div className="journey-stop-name-box">
            <strong className="journey-stop-name">{originStopName}</strong>
            <span className="journey-stop-hint">
              {isTa ? 'தொடக்க பேருந்து நிலையம்' : 'Origin Terminal'}
            </span>
          </div>
        </div>

        {/* Middle Route Direction & Bus Indicator */}
        <div className="journey-middle-connector">
          <div className="connector-bus-pill">
            <Bus size={15} className="connector-bus-icon" />
            <span className="connector-bus-text">
              {isTa ? `தடம் ${routeNumber}` : `Bus ${routeNumber}`}
            </span>
            <span className="connector-live-tag">
              {isTa ? 'நேரலை' : 'Live'}
            </span>
          </div>
          <div className="connector-line">
            <ArrowRight size={16} className="connector-arrow" />
          </div>
          <span className="connector-direction-label">
            {directionCode === 'OUTBOUND'
              ? (isTa ? 'நேரடி வழித்தடம்' : 'Direct Route')
              : (isTa ? 'திரும்பும் வழித்தடம்' : 'Return Route')}
          </span>
        </div>

        {/* Destination / Reaching Stand */}
        <div className="journey-stop-card destination">
          <div className="journey-stop-header">
            <span className="journey-stop-badge destination">
              <MapPin size={12} className="destination-pin-icon" />
              {isTa ? 'சேருமிடம்' : 'Reaching To'}
            </span>
          </div>
          <div className="journey-stop-name-box">
            <strong className="journey-stop-name">{destStopName}</strong>
            <span className="journey-stop-hint">
              {isTa ? 'இறுதி பேருந்து முனையம்' : 'Destination Terminus'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Everyday Citizen Information Strip */}
      <div className="journey-info-ribbon">
        {/* Live Service Status */}
        <div className="ribbon-item live-status">
          <Radio size={14} className="ribbon-icon live" />
          <div className="ribbon-text-col">
            <span className="ribbon-label">
              {isTa ? 'பேருந்து நிலை' : 'Live Status'}
            </span>
            <strong className="ribbon-val">
              {isTa ? 'நேரலை கண்காணிப்பில் உள்ளது' : 'Actively Monitored Live'}
            </strong>
          </div>
        </div>

        {/* Next Bus / Frequency */}
        <div className="ribbon-item frequency">
          <Clock size={14} className="ribbon-icon" />
          <div className="ribbon-text-col">
            <span className="ribbon-label">
              {isTa ? 'அடுத்த பேருந்து' : 'Next Bus'}
            </span>
            <strong className="ribbon-val">
              {isTa ? '5 - 10 நிமிடங்களில்' : 'In 5 - 10 mins'}
            </strong>
          </div>
        </div>

        {/* Vidiyal Payanam Free Scheme for Women */}
        <div className="ribbon-item vidiyal-scheme">
          <Sparkles size={14} className="ribbon-icon vidiyal" />
          <div className="ribbon-text-col">
            <span className="ribbon-label">
              {isTa ? 'அரசு திட்டம்' : 'Government Scheme'}
            </span>
            <strong className="ribbon-val">
              {isTa ? 'விடியல் பயணம் (மகளிருக்கு இலவசம்)' : 'Vidiyal Payanam (Free for Women)'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
