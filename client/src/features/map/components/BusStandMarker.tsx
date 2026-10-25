/**
 * PERUNDHU (பேருந்து) — Bus Stand / Terminal Leaflet Map Marker
 * Renders verified bus stand terminals with accessible popups and route exploration actions.
 */

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { BusStandDto } from '../../../types/domain';
import { createBusStandIcon } from '../utils/mapIcons';
import { useLanguage } from '../../../hooks/useLanguage';
import { SelectedMapEntity } from '../types';
import { Building2, Navigation, Layers, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface BusStandMarkerProps {
  stand: BusStandDto;
  isSelected: boolean;
  role?: 'ORIGIN' | 'DESTINATION' | null;
  onSelect: (entity: SelectedMapEntity) => void;
  onExploreRoutes?: (standId: string) => void;
}

export const BusStandMarker: React.FC<BusStandMarkerProps> = ({
  stand,
  isSelected,
  role,
  onSelect,
  onExploreRoutes
}) => {
  const { t, language } = useLanguage();

  if (!stand.location || !stand.location.coordinates || stand.location.coordinates.length < 2) {
    return null;
  }

  const lat = stand.location.coordinates[1];
  const lng = stand.location.coordinates[0];
  const icon = createBusStandIcon(isSelected, stand.code, role);

  const title = language === 'ta' ? stand.nameTa : stand.nameEn;
  const secondaryTitle = language === 'ta' ? stand.nameEn : stand.nameTa;

  const handleMarkerClick = () => {
    onSelect({
      type: 'BUS_STAND',
      id: stand.id,
      lat,
      lng,
      titleEn: stand.nameEn,
      titleTa: stand.nameTa,
      subtitleEn: `${stand.totalPlatforms} Platforms • Terminal${role ? ` (${role})` : ''}`,
      subtitleTa: `${stand.totalPlatforms} நடைமேடைகள் • முனையம்${role === 'ORIGIN' ? ' (தொடக்கம்)' : role === 'DESTINATION' ? ' (முடிவு)' : ''}`,
      data: stand
    });
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: handleMarkerClick
      }}
    >
      <Popup className="perundhu-leaflet-popup" minWidth={240}>
        <div className="map-popup-card">
          <div className="map-popup-header">
            <div className="map-popup-icon-box terminal" aria-hidden="true">
              <Building2 size={16} color="#FFFFFF" />
            </div>
            <div>
              {role === 'ORIGIN' ? (
                <Badge variant="success">
                  <span>{language === 'ta' ? 'தொடங்கும் முனையம்' : 'Origin Terminal'}</span>
                </Badge>
              ) : role === 'DESTINATION' ? (
                <Badge variant="error">
                  <span>{language === 'ta' ? 'சேரும் முனையம்' : 'Destination Terminal'}</span>
                </Badge>
              ) : (
                <Badge variant="neutral">
                  <span>{t('map.terminal')}</span>
                </Badge>
              )}
              <h4 className="map-popup-title">{title}</h4>
              <p className="map-popup-subtitle">{secondaryTitle}</p>
            </div>
          </div>

          <div className="map-popup-details">
            <div className="map-popup-row">
              <Layers size={14} className="map-popup-row-icon" />
              <span>
                {t('map.platforms').replace('{count}', String(stand.totalPlatforms || 4))}
              </span>
            </div>
            <div className="map-popup-row">
              <Navigation size={14} className="map-popup-row-icon" />
              <span>{stand.code}</span>
            </div>
          </div>

          {onExploreRoutes && (
            <div className="map-popup-actions">
              <Button
                type="button"
                variant="primary"
                onClick={() => onExploreRoutes(stand.id)}
                icon={<ExternalLink size={12} />}
              >
                <span>{t('map.view_stand_routes')}</span>
              </Button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
