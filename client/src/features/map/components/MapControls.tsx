/**
 * PERUNDHU (பேருந்து) — Floating Map Controls
 * My Location on-demand request, recenter trigger, and zoom controls.
 */

import React from 'react';
import { Navigation, Compass, Loader2, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface MapControlsProps {
  isLocatingUser: boolean;
  hasUserLocation: boolean;
  onRequestUserLocation: () => void;
  onRecenter: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

/**
 * Floating map navigation controls with Zoom In (+), Zoom Out (-),
 * My Location, and Recenter triggers.
 */
export const MapControls: React.FC<MapControlsProps> = ({
  isLocatingUser,
  hasUserLocation,
  onRequestUserLocation,
  onRecenter,
  onZoomIn,
  onZoomOut
}) => {
  const { t } = useLanguage();

  return (
    <div className="map-floating-controls-group" role="toolbar" aria-label="Map Navigation Controls">
      {/* Zoom In (+) Button */}
      {onZoomIn && (
        <button
          type="button"
          id="map-zoom-in-btn"
          className="map-floating-btn"
          onClick={onZoomIn}
          title={`${t('map.zoom_in')} (+)`}
          aria-label={`${t('map.zoom_in')} (+)`}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Zoom Out (-) Button */}
      {onZoomOut && (
        <button
          type="button"
          id="map-zoom-out-btn"
          className="map-floating-btn"
          onClick={onZoomOut}
          title={`${t('map.zoom_out')} (-)`}
          aria-label={`${t('map.zoom_out')} (-)`}
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
      )}

      {(onZoomIn || onZoomOut) && <div className="map-floating-divider" aria-hidden="true" />}

      {/* My Location Button */}
      <button
        type="button"
        id="map-my-location-btn"
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
        id="map-recenter-btn"
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
