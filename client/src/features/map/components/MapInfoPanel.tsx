/**
 * PERUNDHU (பேருந்து) — Collapsible Map Information Panel
 * Displays route itinerary, direction toggle, ordered stops, live fleet telemetry,
 * nearby bus stands, and detailed selected marker cards across desktop and mobile.
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Route as RouteIcon,
  ListOrdered,
  Bus,
  Building2,
  X,
  Compass,
  Clock,
  Gauge,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  RouteGeometryState,
  SelectedMapEntity,
  LiveBusMarkerData
} from '../types';
import { NearbyBusStandDto, BusStandDto } from '../../../types/domain';
import { RouteListItem } from '../../routes/types';
import { Badge } from '../../../components/common/Badge';

interface MapInfoPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: 'route' | 'stops' | 'buses' | 'nearby';
  onTabChange: (tab: 'route' | 'stops' | 'buses' | 'nearby') => void;
  routeGeometry: RouteGeometryState | null;
  availableRoutes: RouteListItem[];
  isLoadingRoute: boolean;
  routeError: string | null;
  onSelectRoute: (routeId: string, directionId?: string) => void;
  onSwitchDirection: (directionId: string) => void;
  liveBuses: LiveBusMarkerData[];
  busStands: BusStandDto[];
  nearbyStands: NearbyBusStandDto[];
  isLoadingNearby: boolean;
  selectedEntity: SelectedMapEntity | null;
  onSelectEntity: (entity: SelectedMapEntity) => void;
  onClearSelectedEntity: () => void;
}

export const MapInfoPanel: React.FC<MapInfoPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  routeGeometry,
  availableRoutes,
  isLoadingRoute,
  routeError,
  onSelectRoute,
  onSwitchDirection,
  liveBuses,
  busStands,
  nearbyStands,
  isLoadingNearby,
  selectedEntity,
  onSelectEntity,
  onClearSelectedEntity
}) => {
  const { t, language } = useLanguage();

  const activeRoute = availableRoutes.find((r) => r.id === routeGeometry?.routeId);

  return (
    <aside
      className={`map-info-panel ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Route and Transit Information"
    >
      {/* Toggle button for collapse / expand */}
      <button
        type="button"
        className="map-panel-toggle-btn"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? t('map.expand_panel') : t('map.collapse_panel')}
        title={isCollapsed ? t('map.expand_panel') : t('map.collapse_panel')}
      >
        <span className="desktop-icon">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </span>
        <span className="mobile-icon">
          {isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Panel Header & Navigation Tabs */}
      <div className="map-panel-header">
        <div className="map-panel-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'route'}
            className={`map-panel-tab ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => onTabChange('route')}
          >
            <RouteIcon size={15} />
            <span>{t('map.panel_tab_route')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stops'}
            className={`map-panel-tab ${activeTab === 'stops' ? 'active' : ''}`}
            onClick={() => onTabChange('stops')}
          >
            <ListOrdered size={15} />
            <span>{t('map.panel_tab_stops')}</span>
            {routeGeometry?.stops && (
              <span className="map-tab-count">{routeGeometry.stops.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'buses'}
            className={`map-panel-tab ${activeTab === 'buses' ? 'active' : ''}`}
            onClick={() => onTabChange('buses')}
          >
            <Bus size={15} />
            <span>{t('map.panel_tab_buses')}</span>
            {liveBuses.length > 0 && (
              <span className="map-tab-count active">{liveBuses.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'nearby'}
            className={`map-panel-tab ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => onTabChange('nearby')}
          >
            <Building2 size={15} />
            <span>{t('map.panel_tab_nearby')}</span>
          </button>
        </div>
      </div>

      {/* Selected Entity Card Overlay (if an item is clicked) */}
      {selectedEntity && (
        <div className="map-selected-entity-card">
          <div className="map-selected-entity-header">
            <div>
              <span className="map-entity-type-badge">
                {selectedEntity.type === 'BUS_STAND' && t('map.search_type_stand')}
                {selectedEntity.type === 'BUS_STOP' && t('map.search_type_stop')}
                {selectedEntity.type === 'BUS' && t('map.selected_bus_title')}
                {selectedEntity.type === 'USER_LOCATION' && t('map.user_location_title')}
              </span>
              <h4 className="map-selected-entity-title">
                {language === 'ta' ? selectedEntity.titleTa : selectedEntity.titleEn}
              </h4>
            </div>
            <button
              type="button"
              className="map-selected-entity-close"
              onClick={onClearSelectedEntity}
              aria-label={t('map.clear_selection')}
            >
              <X size={16} />
            </button>
          </div>

          {selectedEntity.subtitleEn && (
            <p className="map-selected-entity-desc">
              {language === 'ta' ? selectedEntity.subtitleTa : selectedEntity.subtitleEn}
            </p>
          )}

          {selectedEntity.type === 'BUS' && selectedEntity.data && (
            <div className="map-selected-bus-meta" style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedEntity.data.isSimulated ? (
                <Badge variant="warning"><span>{t('map.simulated_badge')}</span></Badge>
              ) : (
                <Badge variant="success"><span>{t('map.live_gps_badge')}</span></Badge>
              )}
              {selectedEntity.data.trackingStatus === 'STALE' && (
                <Badge variant="neutral"><span>{t('map.stale_badge')}</span></Badge>
              )}
              {selectedEntity.data.trackingStatus === 'DELAYED' && (
                <Badge variant="warning"><span>{t('map.delayed_badge')}</span></Badge>
              )}
              {selectedEntity.data.trackingStatus === 'DEVIATED' && (
                <Badge variant="error"><span>{t('map.deviated_badge')}</span></Badge>
              )}
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                {Math.round(selectedEntity.data.speedKmph || 0)} km/h • {Math.round(selectedEntity.data.heading || 0)}°
              </span>
            </div>
          )}
        </div>
      )}

      {/* Panel Scrollable Body */}
      <div className="map-panel-body">
        {/* TAB 1: ROUTE SUMMARY & DIRECTION SELECTOR */}
        {activeTab === 'route' && (
          <div className="map-tab-content">
            {isLoadingRoute ? (
              <div className="map-panel-loading">
                <div className="spinner" />
                <p>{language === 'ta' ? 'வழித்தடத் தகவல்கள் ஏற்றப்படுகின்றன...' : 'Loading verified corridor details...'}</p>
              </div>
            ) : routeError ? (
              <div className="map-notice-banner warning">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{routeError}</span>
              </div>
            ) : routeGeometry ? (
              <div className="map-route-summary-section">
                {/* Route Header */}
                <div className="map-route-header-box">
                  <div className="map-route-num-badge">
                    <span>{language === 'ta' ? 'தடம்' : 'Route'}</span>
                    <strong>{routeGeometry.routeNumber}</strong>
                  </div>
                  <div>
                    <h3 className="map-route-title">
                      {language === 'ta' ? routeGeometry.displayTitleTa : routeGeometry.displayTitleEn}
                    </h3>
                    <p className="map-route-subtitle">
                      {language === 'ta' ? routeGeometry.displayTitleEn : routeGeometry.displayTitleTa}
                    </p>
                  </div>
                </div>

                {/* Direction Switcher */}
                {activeRoute && activeRoute.directions.length > 1 && (
                  <div className="map-direction-selector">
                    <span className="map-direction-label">{t('routes.direction_label')}:</span>
                    <div className="map-direction-btn-group">
                      {activeRoute.directions.map((d) => {
                        const isDirActive = d.id === routeGeometry.directionId;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            className={`map-direction-btn ${isDirActive ? 'active' : ''}`}
                            onClick={() => onSwitchDirection(d.id)}
                          >
                            <span>
                              {d.directionCode === 'OUTBOUND'
                                ? t('map.direction_outbound')
                                : t('map.direction_inbound')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="map-metrics-grid">
                  <div className="map-metric-card">
                    <ListOrdered size={16} color="var(--color-primary-teal)" />
                    <div>
                      <span className="map-metric-lbl">{t('routes.stops_count_label')}</span>
                      <strong>{routeGeometry.stops.length}</strong>
                    </div>
                  </div>
                  <div className="map-metric-card">
                    <Compass size={16} color="var(--color-primary-teal)" />
                    <div>
                      <span className="map-metric-lbl">{t('routes.distance_label')}</span>
                      <strong>{routeGeometry.totalDistanceKm} km</strong>
                    </div>
                  </div>
                  <div className="map-metric-card">
                    <Clock size={16} color="var(--color-primary-teal)" />
                    <div>
                      <span className="map-metric-lbl">{t('routes.duration_label')}</span>
                      <strong>{routeGeometry.estimatedDurationMins} mins</strong>
                    </div>
                  </div>
                </div>

                {/* Polyline geometry verification banner */}
                {!routeGeometry.hasVerifiedGeometry && (
                  <div className="map-notice-banner warning">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{t('map.route_no_geometry')}</span>
                  </div>
                )}

                {/* Quick Switch to Other District Routes */}
                <div className="map-routes-picker-box">
                  <span className="map-section-label">
                    {language === 'ta' ? 'மதுரை முன்னோடி வழித்தடங்கள்' : 'Corridor Routes'}
                  </span>
                  <div className="map-routes-pill-row">
                    {availableRoutes.map((r) => {
                      const isCurrent = r.id === routeGeometry.routeId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`map-route-pill ${isCurrent ? 'selected' : ''}`}
                          onClick={() => onSelectRoute(r.id)}
                        >
                          <strong>{r.routeNumber}</strong>
                          <span>{r.displayTitleEn.split(' - ')[1] || r.displayTitleEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="map-panel-empty">
                <RouteIcon size={32} color="var(--color-sage)" />
                <h4>{t('dashboard.select_route_prompt')}</h4>
                <div className="map-routes-pill-row">
                  {availableRoutes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="map-route-pill"
                      onClick={() => onSelectRoute(r.id)}
                    >
                      <strong>{r.routeNumber}</strong>
                      <span>{r.displayTitleEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERED STOP SEQUENCE */}
        {activeTab === 'stops' && (
          <div className="map-tab-content">
            {routeGeometry?.stops && routeGeometry.stops.length > 0 ? (
              <div className="map-stops-timeline">
                <div className="map-stops-timeline-header">
                  <h4 className="map-section-title">{t('map.route_stops_title')}</h4>
                  <span className="map-stops-total-tag">
                    {t('map.stops_count').replace('{count}', String(routeGeometry.stops.length))}
                  </span>
                </div>

                <div className="map-stops-list" role="list">
                  {routeGeometry.stops.map((seq, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === routeGeometry.stops.length - 1;
                    const isSelected = selectedEntity?.id === seq.stop.id;
                    const name = language === 'ta' ? seq.stop.nameTa : seq.stop.nameEn;
                    const secondary = language === 'ta' ? seq.stop.nameEn : seq.stop.nameTa;

                    return (
                      <div
                        key={seq.stop.id}
                        className={`map-stop-item ${isSelected ? 'selected' : ''} ${
                          isFirst || isLast ? 'terminal' : ''
                        }`}
                        role="listitem"
                        onClick={() => {
                          if (seq.stop.location?.coordinates) {
                            onSelectEntity({
                              type: 'BUS_STOP',
                              id: seq.stop.id,
                              lat: seq.stop.location.coordinates[1],
                              lng: seq.stop.location.coordinates[0],
                              titleEn: seq.stop.nameEn,
                              titleTa: seq.stop.nameTa,
                              subtitleEn: `Stop #${seq.sequenceOrder} • Route ${routeGeometry.routeNumber}`,
                              subtitleTa: `நிறுத்தம் #${seq.sequenceOrder} • தடம் ${routeGeometry.routeNumber}`,
                              data: seq
                            });
                          }
                        }}
                      >
                        <div className="map-stop-timeline-node">
                          <span className="map-stop-num-dot">{seq.sequenceOrder}</span>
                          {!isLast && <span className="map-stop-timeline-line" />}
                        </div>

                        <div className="map-stop-info">
                          <div className="map-stop-title-row">
                            <strong className="map-stop-name">{name}</strong>
                            {seq.isFareStage && (
                              <Badge variant="neutral">
                                <span>{t('map.fare_stage')}</span>
                              </Badge>
                            )}
                          </div>
                          <span className="map-stop-secondary">{secondary}</span>
                          <span className="map-stop-distance">
                            {seq.distanceFromOriginKm} km from origin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="map-panel-empty">
                <ListOrdered size={32} color="var(--color-sage)" />
                <p>{t('routes.no_stops_available')}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE BUS FLEET TELEMETRY */}
        {activeTab === 'buses' && (
          <div className="map-tab-content">
            <div className="map-buses-header">
              <h4 className="map-section-title">{t('map.live_buses_title')}</h4>
              {liveBuses.length > 0 && (
                <span className="map-live-bus-badge">
                  {liveBuses.length} {language === 'ta' ? 'பேருந்துகள்' : 'Reporting'}
                </span>
              )}
            </div>

            {liveBuses.length > 0 ? (
              <div className="map-buses-list">
                {liveBuses.map((b) => {
                  const isSelected = selectedEntity?.id === b.busId;
                  const timeFormatted = b.recordedAt
                    ? new Date(b.recordedAt).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : '--:--:--';

                  return (
                    <div
                      key={b.busId}
                      className={`map-bus-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectEntity({
                          type: 'BUS',
                          id: b.busId,
                          lat: b.lat,
                          lng: b.lng,
                          titleEn: b.fleetNumber || 'TNSTC Bus',
                          titleTa: b.fleetNumber || 'அரசுப் பேருந்து',
                          subtitleEn: b.isSimulated ? 'Simulated Telemetry' : 'Live Hardware GPS',
                          subtitleTa: b.isSimulated ? 'மாதிரி இயக்கம்' : 'நேரலை ஜிபிஎஸ்',
                          data: b
                        });
                      }}
                    >
                      <div className="map-bus-card-top">
                        <div className="map-bus-card-title-box">
                          <Bus size={18} color="var(--color-primary-teal)" />
                          <div>
                            <strong>{b.fleetNumber || 'TNSTC Bus'}</strong>
                            {b.registrationNumber && (
                              <span className="map-bus-reg">{b.registrationNumber}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {b.isSimulated ? (
                            <Badge variant="warning">
                              <span>{t('map.simulated_badge')}</span>
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              <span>{t('map.live_gps_badge')}</span>
                            </Badge>
                          )}
                          {b.trackingStatus === 'STALE' && (
                            <Badge variant="neutral">
                              <span>{t('map.stale_badge')}</span>
                            </Badge>
                          )}
                          {b.trackingStatus === 'DELAYED' && (
                            <Badge variant="warning">
                              <span>{t('map.delayed_badge')}</span>
                            </Badge>
                          )}
                          {b.trackingStatus === 'DEVIATED' && (
                            <Badge variant="error">
                              <span>{t('map.deviated_badge')}</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="map-bus-card-stats">
                        <div className="map-bus-stat">
                          <Gauge size={13} />
                          <span>{Math.round(b.speedKmph || 0)} km/h</span>
                        </div>
                        <div className="map-bus-stat">
                          <Compass size={13} />
                          <span>{Math.round(b.heading || 0)}°</span>
                        </div>
                        <div className="map-bus-stat">
                          <Clock size={13} />
                          <span>{timeFormatted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* REQUIRED TRUTHFUL EMPTY STATE NOTICE */
              <div className="map-no-live-buses-box" role="note">
                <div className="map-no-buses-icon-box">
                  <Bus size={28} color="var(--color-sage)" />
                </div>
                <h5 className="map-no-buses-title">{t('map.no_live_buses_title')}</h5>
                <p className="map-no-buses-message">
                  {t('map.no_live_buses')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NEARBY BUS STANDS & TERMINALS */}
        {activeTab === 'nearby' && (
          <div className="map-tab-content">
            <div className="map-stands-header">
              <h4 className="map-section-title">{t('map.nearby_stands_title')}</h4>
              {isLoadingNearby && (
                <span style={{ fontSize: '11px', color: 'var(--color-sage)' }}>
                  {language === 'ta' ? 'தேடப்படுகிறது...' : 'Querying...'}
                </span>
              )}
            </div>

            {nearbyStands.length > 0 ? (
              <div className="map-stands-list">
                {nearbyStands.map((stand) => {
                  const isSelected = selectedEntity?.id === stand.id;
                  const name = language === 'ta' ? stand.nameTa : stand.nameEn;
                  const secondary = language === 'ta' ? stand.nameEn : stand.nameTa;
                  const distKm = (stand.distanceMeters / 1000).toFixed(1);

                  return (
                    <div
                      key={stand.id}
                      className={`map-stand-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (stand.location?.coordinates) {
                          onSelectEntity({
                            type: 'BUS_STAND',
                            id: stand.id,
                            lat: stand.location.coordinates[1],
                            lng: stand.location.coordinates[0],
                            titleEn: stand.nameEn,
                            titleTa: stand.nameTa,
                            subtitleEn: `${stand.totalPlatforms} Platforms • Terminal`,
                            subtitleTa: `${stand.totalPlatforms} நடைமேடைகள் • முனையம்`,
                            data: stand
                          });
                        }
                      }}
                    >
                      <div className="map-stand-card-header">
                        <Building2 size={16} color="var(--color-primary-teal)" />
                        <div style={{ flex: 1 }}>
                          <strong className="map-stand-name">{name}</strong>
                          <span className="map-stand-secondary">{secondary}</span>
                        </div>
                        <span className="map-stand-distance-pill">
                          {stand.distanceMeters < 1000
                            ? `${Math.round(stand.distanceMeters)} m`
                            : `${distKm} km`}
                        </span>
                      </div>
                      <div className="map-stand-card-footer">
                        <span>{stand.totalPlatforms} Platforms</span>
                        <span>{stand.code}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="map-stands-list">
                <span className="map-section-label" style={{ marginBottom: '8px', display: 'block' }}>
                  {language === 'ta' ? 'அனைத்து நிலையங்கள்' : 'District Terminals'}
                </span>
                {busStands.map((stand) => {
                  const isSelected = selectedEntity?.id === stand.id;
                  const name = language === 'ta' ? stand.nameTa : stand.nameEn;
                  const secondary = language === 'ta' ? stand.nameEn : stand.nameTa;

                  return (
                    <div
                      key={stand.id}
                      className={`map-stand-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (stand.location?.coordinates) {
                          onSelectEntity({
                            type: 'BUS_STAND',
                            id: stand.id,
                            lat: stand.location.coordinates[1],
                            lng: stand.location.coordinates[0],
                            titleEn: stand.nameEn,
                            titleTa: stand.nameTa,
                            subtitleEn: `${stand.totalPlatforms} Platforms • Terminal`,
                            subtitleTa: `${stand.totalPlatforms} நடைமேடைகள் • முனையம்`,
                            data: stand
                          });
                        }
                      }}
                    >
                      <div className="map-stand-card-header">
                        <Building2 size={16} color="var(--color-primary-teal)" />
                        <div style={{ flex: 1 }}>
                          <strong className="map-stand-name">{name}</strong>
                          <span className="map-stand-secondary">{secondary}</span>
                        </div>
                      </div>
                      <div className="map-stand-card-footer">
                        <span>{stand.totalPlatforms} Platforms</span>
                        <span>{stand.code}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
