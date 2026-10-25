/**
 * PERUNDHU (பேருந்து) — Luminous Transit Highway Progress Beam
 * Sweeps across the top of the viewport during route transitions, featuring
 * an animated cruising TNSTC vector bus mounted on the progress head with
 * rotating wheels, glowing headlights, road lane markings, and speed physics.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const RouteProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all pending transition timers
  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    clearTimers();

    // Start bus cruise pulse immediately on navigation
    setIsVisible(true);
    setProgress(18);

    const t1 = setTimeout(() => {
      setProgress(52);
    }, 80);

    const t2 = setTimeout(() => {
      setProgress(86);
    }, 220);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 400);

    // Fade out smoothly after reaching destination
    const t4 = setTimeout(() => {
      setIsVisible(false);
    }, 720);

    const t5 = setTimeout(() => {
      setProgress(0);
    }, 950);

    timeoutsRef.current = [t1, t2, t3, t4, t5];

    return () => {
      clearTimers();
    };
  }, [location.pathname, location.search]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      className={`quantum-route-progress ${isVisible ? 'active' : 'fading'}`}
      style={{
        opacity: isVisible ? 1 : 0
      }}
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Background Asphalt Highway Track */}
      <div className="transit-progress-highway-track">
        <div className="transit-progress-lane-dashes" />
      </div>

      {/* Dynamic Progress Beam */}
      <div
        className="quantum-route-progress-bar"
        style={{
          width: `${progress}%`
        }}
      />
    </div>
  );
};
