/**
 * PERUNDHU (பேருந்து) — User Current Location Leaflet Map Marker
 * Displays pulsing GPS device coordinates with accuracy bounding circle.
 */

import React from 'react';
import { Marker, Circle, Popup } from 'react-leaflet';
import { createUserLocationIcon } from '../utils/mapIcons';
import { useLanguage } from '../../../hooks/useLanguage';
import { Navigation } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface UserLocationMarkerProps {
  coords: {
    lat: number;
    lng: number;
    accuracy: number;
  };
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ coords }) => {
  const { t, language } = useLanguage();
  const icon = createUserLocationIcon();

  return (
    <>
      {/* Accuracy Radius Circle */}
      <Circle
        center={[coords.lat, coords.lng]}
        radius={coords.accuracy || 25}
        pathOptions={{
          fillColor: '#0284C7',
          fillOpacity: 0.12,
          color: '#0284C7',
          weight: 1.5,
          dashArray: '4, 4'
        }}
      />

      <Marker position={[coords.lat, coords.lng]} icon={icon}>
        <Popup className="perundhu-leaflet-popup" minWidth={200}>
          <div className="map-popup-card">
            <div className="map-popup-header">
              <div className="map-popup-icon-box user" aria-hidden="true">
                <Navigation size={16} color="#FFFFFF" />
              </div>
              <div>
                <Badge variant="info">
                  <span>{t('map.user_location_title')}</span>
                </Badge>
                <h4 className="map-popup-title">
                  {language === 'ta' ? 'உங்கள் சாதனம்' : 'Your Device'}
                </h4>
                <p className="map-popup-subtitle">
                  {t('map.user_location_accuracy').replace(
                    '{meters}',
                    String(Math.round(coords.accuracy))
                  )}
                </p>
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};
