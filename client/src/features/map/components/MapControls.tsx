/**
 * PERUNDHU (பேருந்து) — Floating Map Controls
 * My Location on-demand request, recenter trigger, and zoom controls.
 */

import React from 'react';
import { Navigation, Compass, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface MapControlsProps {
  isLocatingUser: boolean;
  hasUserLocation: boolean;
  onRequestUserLocation: () => void;
  onRecenter: () => void;
}

/**
 * Inner buttons that use useMap() context for zoom in/out.
 */
export const MapControls: React.FC<MapControlsProps> = ({
  isLocatingUser,
  hasUserLocation,
  onRequestUserLocation,
  onRecenter
}) => {
  const { t } = useLanguage();

  return (
    <div className="map-floating-controls-group" role="toolbar" aria-label="Map Navigation Controls">
      {/* My Location Button */}
      <button
        type="button"
        className={`map-floating-btn ${hasUserLocation ? 'active' : ''}`}
        onClick={onRequestUserLocation}
        disabled={isLocatingUser}
        title={t('map.my_location')}
        aria-label={t('map.my_location')}
      >
        {isLocatingUser ? (
          <Loader2 size={18} className="spinner" />
        ) : (
          <Navigation size={18} />
        )}
      </button>

      {/* Recenter Map Button */}
      <button
        type="button"
        className="map-floating-btn"
        onClick={onRecenter}
        title={t('map.recenter')}
        aria-label={t('map.recenter')}
      >
        <Compass size={18} />
      </button>
    </div>
  );
};
