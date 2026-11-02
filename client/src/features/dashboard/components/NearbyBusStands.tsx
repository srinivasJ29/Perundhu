/**
 * PERUNDHU (பேருந்து) — Nearby Bus Stands Component
 * On-demand geolocation activation with strict consent compliance, genuine MongoDB $geoNear
 * distance calculations, and accessible fallback to district-level terminals.
 */

import React from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  RefreshCw,
  Building2,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { NearbyStandsState } from '../types';
import { NearbyBusStandDto } from '../../../types/domain';
import { getBusStandAsset } from '../../../lib/assets';

interface NearbyBusStandsProps {
  nearbyState: NearbyStandsState;
  onRequestLocation: () => void;
  onBrowseDistrictStands: () => void;
}

export const NearbyBusStands: React.FC<NearbyBusStandsProps> = ({
  nearbyState,
  onRequestLocation,
  onBrowseDistrictStands
}) => {
  const { t, language } = useLanguage();

  const formatDistance = (meters?: number) => {
    if (typeof meters !== 'number') return null;
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getStandTypeBadge = (standType: string) => {
    switch (standType) {
      case 'INTERCITY_TERMINAL':
        return language === 'ta' ? 'முக்கிய முனையம்' : 'Intercity Terminal';
      case 'MOFUSSIL':
        return language === 'ta' ? 'புறநகர் நிலையம்' : 'Mofussil Terminal';
      case 'TOWN_STAND':
        return language === 'ta' ? 'நகர நிலையம்' : 'Town Stand';
      default:
        return standType.replace('_', ' ');
    }
  };

  return (
    <section className="nearby-stands-card" aria-labelledby="nearby-stands-title">
      <div className="nearby-stands-header">
        <div className="nearby-stands-title-box">
          <div className="nearby-stands-icon radar-active" aria-hidden="true">
            <span className="radar-wave-ring r1" />
            <span className="radar-wave-ring r2" />
            <MapPin size={20} />
          </div>
          <div>
            <h2 id="nearby-stands-title" className="nearby-stands-title">
              {t('dashboard.nearby_stands_title')}
            </h2>
            <p className="nearby-stands-subtitle">
              {language === 'ta'
                ? 'அருகிலுள்ள பேருந்து நிலையங்கள், நடைமேடைகள் மற்றும் புறப்பாடு விவரங்களை அறியவும்'
                : 'Discover terminals, platform counts, and genuine distances from your location'}
            </p>
          </div>
        </div>

        {/* Header Status Badge */}
        {!nearbyState.permissionRequested && (
          <Badge variant="neutral">
            <Compass size={12} style={{ marginRight: '4px' }} />
            <span>{language === 'ta' ? 'ஜிபிஎஸ் இருப்பிடம்' : 'GPS Radar Ready'}</span>
          </Badge>
        )}
      </div>

      {/* State 1: Location Not Yet Requested */}
      {!nearbyState.permissionRequested && !nearbyState.isLoading && nearbyState.stands.length === 0 && (
        <div className="nearby-stands-initial-box">
          <p className="nearby-stands-initial-text">
            {language === 'ta'
              ? 'உங்கள் உலாவியில் இருப்பிட அனுமதி கோரப்படும் போது "அனுமதி" என்பதை அழுத்தவும். இருப்பிடத்தைப் பகிர விரும்பவில்லை எனில் கீழே உள்ள மதுரை நிலையங்களைப் பார்வையிடலாம்.'
              : 'Click below to detect nearby bus stands with genuine GPS distance. You can also browse all Madurai terminals without sharing your location.'}
          </p>
          <div className="nearby-stands-actions-group">
            <Button
              type="button"
              variant="primary"
              onClick={onRequestLocation}
              icon={<Navigation size={16} />}
            >
              <span>{t('dashboard.detect_location_btn')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBrowseDistrictStands}
              icon={<Building2 size={16} />}
            >
              <span>{t('dashboard.browse_district_stands')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* State 2: Loading Geolocation & Spatial Query */}
      {nearbyState.isLoading && (
        <div className="nearby-stands-loading" role="status">
          <div className="loading-spinner-sm" aria-hidden="true" />
          <span>{t('dashboard.location_detecting')}</span>
        </div>
      )}

      {/* State 3: Permission Denied or Location Error */}
      {!nearbyState.isLoading && nearbyState.permissionDenied && (
        <div className="nearby-stands-alert denied" role="alert">
          <AlertCircle size={20} color="var(--color-coral-red)" />
          <div className="alert-content">
            <strong>{t('dashboard.location_denied_title')}</strong>
            <p>{t('dashboard.location_denied_desc')}</p>
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                type="button"
                variant="outline"
                onClick={onRequestLocation}
                icon={<RefreshCw size={12} />}
              >
                <span>{t('dashboard.retry_location')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* State 4: Stands List (Either from Geolocation with genuine distances or District fallback) */}
      {!nearbyState.isLoading && nearbyState.stands.length > 0 && (
        <div className="nearby-stands-list" role="list">
          {nearbyState.userCoordinates && (
            <div className="nearby-gps-verified-tag">
              <CheckCircle2 size={14} />
              <span>
                {language === 'ta'
                  ? 'நேரலை ஜிபிஎஸ் தொலைவு கணக்கிடப்பட்டது (WGS84)'
                  : 'Genuine GPS Distance Computed (WGS84)'}
              </span>
            </div>
          )}

          <div className="nearby-stands-grid">
            {nearbyState.stands.map((stand) => {
              const nearbyStand = stand as NearbyBusStandDto;
              const hasDistance = typeof nearbyStand.distanceMeters === 'number';
              const formattedDist = formatDistance(nearbyStand.distanceMeters);
              const standAsset = getBusStandAsset(stand.code);

              return (
                <article
                  key={stand.id}
                  className="nearby-stand-card"
                  role="listitem"
                  aria-labelledby={`stand-name-${stand.id}`}
                >
                  {standAsset && (
                    <div className="nearby-stand-photo-wrap">
                      <picture>
                        <source type="image/webp" srcSet={standAsset.thumb} />
                        <img
                          src={standAsset.jpg}
                          alt={language === 'ta' ? standAsset.altTa : standAsset.altEn}
                          className="nearby-stand-photo"
                          loading="lazy"
                        />
                      </picture>
                      <div className="nearby-stand-photo-attribution" title={standAsset.attribution}>
                        <span>{standAsset.attribution.replace(' (Wikimedia Commons, ', ' / ').replace(')', '')}</span>
                      </div>
                    </div>
                  )}

                  <div className="nearby-stand-top">
                    <Badge variant="neutral">
                      <Layers size={11} style={{ marginRight: '3px' }} />
                      <span>{getStandTypeBadge(stand.standType)}</span>
                    </Badge>

                    {hasDistance && formattedDist && (
                      <div className="nearby-stand-distance-pill">
                        <Compass size={12} aria-hidden="true" />
                        <strong>{formattedDist}</strong>
                      </div>
                    )}
                  </div>

                  <h3 id={`stand-name-${stand.id}`} className="nearby-stand-name">
                    {language === 'ta' ? stand.nameTa : stand.nameEn}
                  </h3>

                  <div className="nearby-stand-details">
                    <div className="nearby-stand-platforms">
                      <Building2 size={14} aria-hidden="true" />
                      <span>{t('dashboard.platforms').replace('{count}', String(stand.totalPlatforms))}</span>
                    </div>
                    <div className="nearby-stand-code">
                      <span>Code:</span> <code>{stand.code}</code>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
