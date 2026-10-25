/**
 * PERUNDHU (பேருந்து) — Map Layer Selector
 * Supports standard street map and clearly communicates unavailable status for satellite/hybrid layers.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Layers, Check, Info } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { MAP_LAYERS, MapLayerId } from '../types';

interface MapLayerControlProps {
  activeLayer: MapLayerId;
  onSelectLayer: (layerId: MapLayerId) => void;
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  activeLayer,
  onSelectLayer
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLayerClick = (layerId: MapLayerId) => {
    const config = MAP_LAYERS[layerId];
    if (config.isAvailable) {
      onSelectLayer(layerId);
      setIsOpen(false);
    }
  };

  return (
    <div className="map-layer-control-wrapper" ref={containerRef}>
      <button
        type="button"
        className="map-floating-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('map.layer_standard')}
        aria-expanded={isOpen}
      >
        <Layers size={20} />
      </button>

      {isOpen && (
        <div className="map-layer-menu" role="menu">
          <div className="map-layer-menu-header">
            <strong>{language === 'ta' ? 'வரைபட அடுக்குகள்' : 'Map Layers'}</strong>
          </div>

          <div className="map-layer-options">
            {Object.values(MAP_LAYERS).map((layer) => {
              const isSelected = activeLayer === layer.id;
              const title = language === 'ta' ? layer.nameTa : layer.nameEn;
              const reason =
                language === 'ta'
                  ? layer.unavailableReasonTa
                  : layer.unavailableReasonEn;

              return (
                <button
                  key={layer.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  disabled={!layer.isAvailable}
                  className={`map-layer-option-btn ${isSelected ? 'selected' : ''} ${
                    !layer.isAvailable ? 'disabled' : ''
                  }`}
                  onClick={() => handleLayerClick(layer.id)}
                >
                  <div className="map-layer-option-left">
                    <span className="map-layer-radio-circle">
                      {isSelected && <Check size={12} />}
                    </span>
                    <span>{title}</span>
                  </div>

                  {!layer.isAvailable && (
                    <span
                      className="map-layer-unavailable-tag"
                      title={reason}
                    >
                      <Info size={12} />
                      <span>{language === 'ta' ? 'கிடைக்கவில்லை' : 'Unavailable'}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="map-layer-footer-notice">
            {language === 'ta'
              ? 'அரசுப் பேருந்து வழித்தடங்கள் ஓபன்ஸ்ட்ரீட்மேப் மற்றும் Esri செயற்கைக்கோள் தரவுகளுடன் இணைக்கப்பட்டுள்ளன.'
              : 'Public transit corridors rendered via OpenStreetMap & Esri imagery.'}
          </p>
        </div>
      )}
    </div>
  );
};
