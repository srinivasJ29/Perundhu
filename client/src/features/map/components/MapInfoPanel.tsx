/**
 * PERUNDHU (பேருந்து) — Collapsible Map Information Panel
 * Displays route itinerary, direction toggle, ordered stops, live fleet telemetry,
 * nearby bus stands, and detailed selected marker cards across desktop and mobile.
 */

import React, { useMemo } from 'react';
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
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Search,
  Activity,
  MapPin,
  Radio,
  Table,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  RouteGeometryState,
  SelectedMapEntity,
  LiveBusMarkerData
} from '../types';
import { NearbyBusStandDto, BusStandDto, ServiceAlertDto } from '../../../types/domain';
import { RouteListItem } from '../../routes/types';
import { Badge } from '../../../components/common/Badge';
import { alertsService } from '../../../services/api/alerts.service';

interface MapInfoPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: 'route' | 'stops' | 'buses' | 'nearby' | 'table';
  onTabChange: (tab: 'route' | 'stops' | 'buses' | 'nearby' | 'table') => void;
  routeGeometry: RouteGeometryState | null;
  availableRoutes: RouteListItem[];
  isLoadingRoute: boolean;
  routeError: string | null;
  onSelectRoute: (routeId: string, directionId?: string) => void;
  onSwitchDirection: (directionId: string) => void;
  liveBuses: LiveBusMarkerData[];
  filteredBuses?: LiveBusMarkerData[];
  fleetFilter?: 'ALL' | 'MOVING' | 'STATIONARY' | 'DELAYED_STALE' | 'OFFLINE' | 'REAL_GPS' | 'SIMULATOR';
  onFleetFilterChange?: (filter: 'ALL' | 'MOVING' | 'STATIONARY' | 'DELAYED_STALE' | 'OFFLINE' | 'REAL_GPS' | 'SIMULATOR') => void;
  fleetSearch?: string;
  onFleetSearchChange?: (search: string) => void;
  selectedBusLiveDetails?: any | null;
  isLoadingBusDetails?: boolean;
  onFitToFleet?: () => void;
  onFitToRoute?: () => void;
  busStands: BusStandDto[];
  nearbyStands: NearbyBusStandDto[];
  isLoadingNearby: boolean;
  selectedEntity: SelectedMapEntity | null;
  onSelectEntity: (entity: SelectedMapEntity) => void;
  onClearSelectedEntity: () => void;
}

function getCompassDirection(heading?: number): string {
  if (heading === undefined || heading === null || isNaN(heading)) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
  return directions[index];
}

function formatRelativeFreshness(isoString?: string): string {
  if (!isoString) return 'Not available';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 0 || isNaN(diffSec)) return 'Just now';
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
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
  filteredBuses,
  fleetFilter = 'ALL',
  onFleetFilterChange,
  fleetSearch = '',
  onFleetSearchChange,
  selectedBusLiveDetails,
  isLoadingBusDetails,
  onFitToFleet,
  onFitToRoute,
  busStands,
  nearbyStands,
  isLoadingNearby,
  selectedEntity,
  onSelectEntity,
  onClearSelectedEntity
}) => {
  const { t, language } = useLanguage();
  const [selectedDownstreamStopId, setSelectedDownstreamStopId] = React.useState<string | null>(null);
  const [routeAlerts, setRouteAlerts] = React.useState<ServiceAlertDto[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = React.useState<boolean>(false);

  const currentRouteNumber =
    selectedBusLiveDetails?.route?.routeNumber ||
    (selectedEntity?.data as LiveBusMarkerData)?.routeNumber ||
    routeGeometry?.routeNumber;

  React.useEffect(() => {
    if (!currentRouteNumber) {
      setRouteAlerts([]);
      return;
    }
    let isCancelled = false;
    setIsLoadingAlerts(true);
    alertsService.getAlerts({ routeNumber: currentRouteNumber, isActive: true })
      .then((data) => {
        if (!isCancelled) {
          setRouteAlerts(data || []);
        }
      })
      .catch(() => {
        if (!isCancelled) setRouteAlerts([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingAlerts(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [currentRouteNumber]);

  const activeRoute = availableRoutes.find((r) => r.id === routeGeometry?.routeId);

  // Compute category counts for filter pills
  const filterCounts = useMemo(() => {
    return {
      ALL: liveBuses.length,
      MOVING: liveBuses.filter((b) => (b.speedKmph || 0) > 5).length,
      STATIONARY: liveBuses.filter((b) => (b.speedKmph || 0) <= 5).length,
      DELAYED_STALE: liveBuses.filter(
        (b) =>
          b.trackingStatus === 'DELAYED' ||
          b.trackingStatus === 'STALE' ||
          b.freshness === 'DELAYED' ||
          b.freshness === 'STALE'
      ).length,
      OFFLINE: liveBuses.filter(
        (b) =>
          b.trackingStatus === 'OFFLINE' ||
          b.trackingStatus === 'UNAVAILABLE' ||
          b.freshness === 'OFFLINE'
      ).length,
      REAL_GPS: liveBuses.filter((b) => !b.isSimulated && b.source !== 'SIMULATOR').length,
      SIMULATOR: liveBuses.filter((b) => b.isSimulated || b.source === 'SIMULATOR').length
    };
  }, [liveBuses]);

  const busesToShow = filteredBuses ?? liveBuses;

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

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'table'}
            className={`map-panel-tab ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => onTabChange('table')}
            title={t('accessibility.list_view_toggle')}
          >
            <Table size={15} />
            <span>{language === 'ta' ? 'பட்டியல்' : 'List View'}</span>
          </button>
        </div>
      </div>

      {/* Selected Entity Card Overlay */}
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

          {selectedEntity.type === 'BUS' ? (
            /* COMPREHENSIVE SELECTED BUS DETAILS CARD */
            <div className="map-selected-bus-expanded" style={{ marginTop: '8px' }}>
              {(() => {
                const liveDetails = selectedBusLiveDetails;
                const markerData = selectedEntity.data as LiveBusMarkerData | undefined;

                const regNumber =
                  liveDetails?.bus?.registrationNumber ||
                  markerData?.registrationNumber ||
                  t('map.not_available');
                const fleetNumber =
                  liveDetails?.bus?.fleetNumber ||
                  markerData?.fleetNumber ||
                  'TNSTC Bus';
                const vehicleType =
                  liveDetails?.bus?.vehicleType || 'STANDARD_PASSENGER';

                // Depot Info
                const depot = liveDetails?.depot || liveDetails?.bus?.currentDepotId;
                const depotName = depot
                  ? language === 'ta'
                    ? depot.nameTa || depot.nameEn || depot.name
                    : depot.nameEn || depot.name
                  : t('map.not_available');
                const depotCode = depot?.code ? ` (${depot.code})` : '';

                // Route Info
                const assignedRoute = liveDetails?.route || liveDetails?.assignedRoute;
                const routeNumber =
                  assignedRoute?.routeNumber ||
                  markerData?.routeNumber ||
                  routeGeometry?.routeNumber ||
                  t('map.not_assigned');
                const routeName = assignedRoute
                  ? language === 'ta'
                    ? assignedRoute.displayTitleTa || assignedRoute.nameTa || assignedRoute.displayTitleEn || assignedRoute.nameEn
                    : assignedRoute.displayTitleEn || assignedRoute.nameEn
                  : '';
                const directionCode =
                  liveDetails?.direction?.directionCode || routeGeometry?.directionCode || '';

                // Telemetry
                const lat = liveDetails?.latestPosition?.coordinates
                  ? liveDetails.latestPosition.coordinates[1]
                  : (liveDetails?.latestPosition?.lat ?? markerData?.lat);
                const lng = liveDetails?.latestPosition?.coordinates
                  ? liveDetails.latestPosition.coordinates[0]
                  : (liveDetails?.latestPosition?.lng ?? markerData?.lng);
                const speed =
                  liveDetails?.latestPosition?.speedKmph ?? markerData?.speedKmph;
                const heading =
                  liveDetails?.latestPosition?.heading ?? markerData?.heading;
                const recordedAt =
                  liveDetails?.latestPosition?.recordedAt ?? markerData?.recordedAt;
                const isSim =
                  liveDetails?.latestPosition?.isSimulated ??
                  markerData?.isSimulated ??
                  false;
                const source =
                  liveDetails?.latestPosition?.source ?? markerData?.source ?? 'GPS';
                const trackingStatus =
                  liveDetails?.latestPosition?.trackingStatus ??
                  markerData?.trackingStatus ??
                  'LIVE';
                const freshness =
                  liveDetails?.latestPosition?.freshness ?? markerData?.freshness;

                // Intelligence Info
                const intel = liveDetails?.intelligence;
                const movementStatus =
                  intel?.movementStatus ||
                  (typeof speed === 'number'
                    ? speed > 2
                      ? 'MOVING'
                      : 'STATIONARY'
                    : 'UNAVAILABLE');
                const routeProgress = intel?.routeProgress;
                const lastConfirmedStop = intel?.lastConfirmedStop;
                const nextExpectedStop = intel?.nextExpectedStop;
                const stopsItinerary = intel?.stopsItinerary || [];

                // Health
                const deviceHealth = liveDetails?.deviceHealth;
                const networkStatus =
                  deviceHealth?.networkConnectivity ??
                  markerData?.deviceHealth?.networkConnectivity ??
                  (trackingStatus === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
                const gpsFix = deviceHealth?.gpsSignalStatus ?? 'ACQUIRED_3D';
                const satellites = deviceHealth?.satellitesTracked;

                const formattedTime = recordedAt
                  ? new Date(recordedAt).toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  : '--:--:--';

                // ETA Information
                const etaObj = liveDetails?.eta;
                const downstreamList: any[] = etaObj?.downstreamStops || [];
                const activeStopTarget = selectedDownstreamStopId
                  ? stopsItinerary.find((s: any) => s.stopId === selectedDownstreamStopId) ||
                    downstreamList.find((s: any) => s.stopId === selectedDownstreamStopId) ||
                    nextExpectedStop ||
                    etaObj?.nextStop
                  : nextExpectedStop || etaObj?.nextStop;

                const predSource =
                  activeStopTarget?.predictionSource ||
                  etaObj?.predictionSource ||
                  (activeStopTarget ? 'BASELINE_ESTIMATE' : 'ETA_UNAVAILABLE');
                const isUnavailable = predSource === 'ETA_UNAVAILABLE' || !activeStopTarget;
                const fallbackReason =
                  activeStopTarget?.fallbackReason || etaObj?.fallbackReason;

                const stopName = activeStopTarget
                  ? language === 'ta'
                    ? activeStopTarget.stopNameTa ||
                      activeStopTarget.nameTa ||
                      activeStopTarget.stopNameEn ||
                      activeStopTarget.nameEn ||
                      activeStopTarget.stopName
                    : activeStopTarget.stopNameEn ||
                      activeStopTarget.nameEn ||
                      activeStopTarget.stopName
                  : '';

                const rawMins =
                  activeStopTarget?.etaMinutes !== undefined
                    ? activeStopTarget.etaMinutes
                    : activeStopTarget?.estimatedMinutes;

                const etaMins =
                  rawMins !== undefined ? Math.max(1, Math.round(rawMins)) : null;

                const confInterval = activeStopTarget?.confidenceIntervalSeconds;
                const lowerMins = confInterval
                  ? Math.max(1, Math.round(confInterval[0] / 60))
                  : null;
                const upperMins = confInterval
                  ? Math.max(lowerMins || 1, Math.round(confInterval[1] / 60))
                  : null;

                // Destination Stop Summary calculations
                const selectedDestStop = selectedDownstreamStopId
                  ? stopsItinerary.find((s: any) => s.stopId === selectedDownstreamStopId) ||
                    downstreamList.find((s: any) => s.stopId === selectedDownstreamStopId)
                  : null;
                const stopsRemainingCount =
                  selectedDestStop && lastConfirmedStop
                    ? Math.max(1, (selectedDestStop.sequence || selectedDestStop.stopSequence || 0) - lastConfirmedStop.sequence)
                    : selectedDestStop
                    ? 1
                    : null;

                return (
                  <div>
                    {isLoadingBusDetails && (
                      <div style={{ fontSize: '11px', color: 'var(--color-primary-teal)', marginBottom: '4px' }}>
                        {language === 'ta' ? 'விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading verified telemetry...'}
                      </div>
                    )}

                    {/* SECTION A: BUS HEADER (Identity, Route, Direction, Status Badges) */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {/* Freshness Badge */}
                      {isSim ? (
                        <Badge variant="warning"><span>{t('map.simulated_badge')}</span></Badge>
                      ) : freshness === 'HEALTHY' || (!freshness && trackingStatus === 'LIVE') ? (
                        <Badge variant="success"><span>{t('eta.status_live')}</span></Badge>
                      ) : freshness === 'DELAYED' ? (
                        <Badge variant="warning"><span>{t('eta.status_delayed')}</span></Badge>
                      ) : freshness === 'STALE' ? (
                        <Badge variant="neutral"><span>{t('eta.status_stale')}</span></Badge>
                      ) : freshness === 'OFFLINE' || trackingStatus === 'OFFLINE' ? (
                        <Badge variant="error"><span>{t('eta.status_offline')}</span></Badge>
                      ) : (
                        <Badge variant="neutral"><span>{t('map.not_available')}</span></Badge>
                      )}

                      {/* Device Network Status */}
                      {networkStatus === 'ONLINE' ? (
                        <Badge variant="success"><span>ONLINE</span></Badge>
                      ) : networkStatus === 'DELAYED' ? (
                        <Badge variant="warning"><span>{t('map.delayed_badge')}</span></Badge>
                      ) : networkStatus === 'STALE' ? (
                        <Badge variant="neutral"><span>{t('map.stale_badge')}</span></Badge>
                      ) : (
                        <Badge variant="error"><span>{t('map.offline_badge')}</span></Badge>
                      )}

                      {/* Direction Badge */}
                      {directionCode && (
                        <Badge variant="neutral">
                          <span>{directionCode === 'OUTBOUND' ? t('routes.direction_outbound') : t('routes.direction_inbound')}</span>
                        </Badge>
                      )}

                      {/* Route Deviation Badge */}
                      {trackingStatus === 'DEVIATED' && (
                        <Badge variant="error"><span>{t('map.deviated_badge')}</span></Badge>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-deep-teal)', fontWeight: 700, marginBottom: '2px' }}>
                      {fleetNumber} • <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{regNumber}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      {vehicleType.replace(/_/g, ' ')}
                      {routeNumber !== t('map.not_assigned') && ` • Route ${routeNumber}`}
                      {routeName && ` (${routeName})`}
                    </div>

                    {/* SECTION C: LIVE TRAVEL INFORMATION (Speed, Heading, Progress, Stops) */}
                    <div className="map-bus-intelligence-section">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gauge size={14} color="var(--color-primary-teal)" />
                          <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--color-deep-teal)' }}>
                            {language === 'ta' ? 'நேரலை இயக்கம்' : 'Live Movement Telemetry'}
                          </strong>
                        </div>
                        {movementStatus === 'MOVING' ? (
                          <Badge variant="success">
                            <Activity size={10} style={{ marginRight: '3px' }} />
                            <span>{t('eta.movement_moving')}</span>
                          </Badge>
                        ) : movementStatus === 'DWELLING' ? (
                          <Badge variant="warning">
                            <Clock size={10} style={{ marginRight: '3px' }} />
                            <span>{t('eta.movement_dwelling')}</span>
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            <span>{t('eta.movement_stationary')}</span>
                          </Badge>
                        )}
                      </div>

                      {/* Speed & Heading Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10px' }}>{t('map.speed_label')}</span>
                          <strong style={{ color: 'var(--color-deep-teal)' }}>
                            {typeof speed === 'number'
                              ? speed <= 2
                                ? `0 km/h (${t('eta.movement_stationary')})`
                                : `${Math.round(speed)} km/h`
                              : t('eta.movement_unavailable')}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10px' }}>{t('map.heading_label')}</span>
                          <strong style={{ color: 'var(--color-deep-teal)' }}>
                            {typeof heading === 'number' ? `${Math.round(heading)}° (${getCompassDirection(heading)})` : 'N/A'}
                          </strong>
                        </div>
                      </div>

                      {/* Route Progress Bar */}
                      {routeProgress && (
                        <div className="map-bus-progress-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                            <span>{t('eta.route_progress')} (Segment {routeProgress.currentSegmentIndex + 1}/{routeProgress.totalSegments})</span>
                            <strong>{routeProgress.progressPercent}% ({routeProgress.distanceTraveledKm} / {routeProgress.totalDistanceKm} km)</strong>
                          </div>
                          <div className="map-bus-progress-track">
                            <div
                              className="map-bus-progress-fill"
                              style={{ width: `${Math.min(100, Math.max(0, routeProgress.progressPercent))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Confirmed Stop Evidence */}
                      <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {lastConfirmedStop && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={12} color="var(--color-status-success)" />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('eta.last_confirmed_stop')}:</span>
                            <strong style={{ color: 'var(--color-deep-teal)' }}>
                              #{lastConfirmedStop.sequence} {language === 'ta' ? lastConfirmedStop.nameTa : lastConfirmedStop.nameEn}
                            </strong>
                          </div>
                        )}
                        {nextExpectedStop && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Radio size={12} color="var(--color-primary-teal)" />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('eta.next_expected_stop')}:</span>
                            <strong style={{ color: 'var(--color-deep-teal)' }}>
                              #{nextExpectedStop.sequence} {language === 'ta' ? nextExpectedStop.nameTa : nextExpectedStop.nameEn}
                            </strong>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              ({(nextExpectedStop.distanceMeters / 1000).toFixed(1)} km)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* GPS Source & Timestamp */}
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--color-border)', fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('map.telemetry_source_label')}: {isSim ? 'Simulator Engine' : source.replace(/_/g, ' ')}</span>
                        <span>{formatRelativeFreshness(recordedAt)} ({formattedTime} IST)</span>
                      </div>
                    </div>

                    {/* SECTION D: AI ARRIVAL PREDICTION (Dynamic ETA, Bounds & Schedule Comparison) */}
                    <div className="map-bus-eta-box" style={{ marginTop: '10px', marginBottom: '10px', padding: '10px 12px', background: 'var(--color-surface, #FFFFFF)', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="var(--color-primary-teal)" />
                          <strong style={{ fontSize: '12px', color: 'var(--color-deep-teal)' }}>
                            {t('eta.label')}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {predSource === 'ML_PREDICTION' ? (
                            <Badge variant="success">
                              <span>{t('eta.ml_badge')}</span>
                            </Badge>
                          ) : predSource === 'BASELINE_ESTIMATE' ? (
                            <Badge variant="neutral">
                              <span>{t('eta.baseline_badge')}</span>
                            </Badge>
                          ) : predSource === 'OFFICIAL_SCHEDULE' ? (
                            <Badge variant="warning">
                              <span>{t('eta.official_schedule_badge')}</span>
                            </Badge>
                          ) : null}

                          {etaObj?.confidence !== undefined && predSource !== 'ETA_UNAVAILABLE' ? (
                            <Badge variant={etaObj.confidence > 0.7 ? 'success' : etaObj.confidence > 0.4 ? 'warning' : 'neutral'}>
                              <span>
                                {etaObj.confidence > 0.7
                                  ? t('eta.confidence_high')
                                  : etaObj.confidence > 0.4
                                  ? t('eta.confidence_med')
                                  : t('eta.confidence_low')}
                              </span>
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {isUnavailable ? (
                        <div style={{ padding: '4px 0' }}>
                          {fallbackReason === 'BUS_OFF_ROUTE' || trackingStatus === 'DEVIATED' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF2E33', fontSize: '11px', fontWeight: 600 }}>
                              <AlertCircle size={14} />
                              <span>{t('eta.fallback_deviated')}</span>
                            </div>
                          ) : fallbackReason === 'GPS_STALE' || trackingStatus === 'OFFLINE' || networkStatus === 'OFFLINE' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF2E33', fontSize: '11px', fontWeight: 600 }}>
                              <AlertCircle size={14} />
                              <span>{t('eta.fallback_stale')}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              {t('eta.unavailable')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="map-bus-eta-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {selectedDownstreamStopId ? t('eta.selected_stop_eta') : t('eta.next_stop')}: {stopName}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-teal)' }}>
                              ~{etaMins} {language === 'ta' ? 'நிமிடங்கள்' : 'mins'}
                              {lowerMins !== null && upperMins !== null && predSource === 'ML_PREDICTION' && (
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                                  ({lowerMins}–{upperMins} {language === 'ta' ? 'நிமி' : 'mins'})
                                </span>
                              )}
                            </span>
                          </div>

                          {activeStopTarget.estimatedArrivalAt && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                              {language === 'ta' ? 'கணிக்கப்பட்ட நேரம்' : 'Estimated arrival'}: {new Date(activeStopTarget.estimatedArrivalAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                              {activeStopTarget.remainingDistanceMeters && ` • ${(activeStopTarget.remainingDistanceMeters / 1000).toFixed(1)} km`}
                              {activeStopTarget.distanceMeters && ` • ${(activeStopTarget.distanceMeters / 1000).toFixed(1)} km`}
                            </div>
                          )}

                          {/* Official Timetable Comparison if assigned trip available */}
                          {liveDetails?.assignedTrip?.arrivalTime && (
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--color-border)' }}>
                              <span>{t('eta.scheduled_arrival')}: {liveDetails.assignedTrip.arrivalTime}</span>
                              {activeStopTarget.estimatedArrivalAt && (
                                <span style={{ marginLeft: '6px', color: 'var(--color-deep-teal)', fontWeight: 600 }}>
                                  ({t('eta.variance')}: {Math.round((new Date(activeStopTarget.estimatedArrivalAt).getTime() - new Date().setHours(parseInt(liveDetails.assignedTrip.arrivalTime.split(':')[0], 10), parseInt(liveDetails.assignedTrip.arrivalTime.split(':')[1], 10))) / 60000)}m)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Downstream Stop Selector */}
                          {downstreamList.length > 1 && (
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--color-border)' }}>
                              <label htmlFor="downstream-stop-selector" style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '3px' }}>
                                {t('eta.select_stop_prompt')}
                              </label>
                              <select
                                id="downstream-stop-selector"
                                aria-label={t('eta.select_stop_prompt')}
                                value={selectedDownstreamStopId || ''}
                                onChange={(e) => setSelectedDownstreamStopId(e.target.value || null)}
                                style={{
                                  width: '100%',
                                  fontSize: '11px',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                  background: 'var(--color-surface, #FFFFFF)',
                                  color: 'var(--color-text-primary)'
                                }}
                              >
                                <option value="">
                                  {t('eta.next_stop')} — {language === 'ta' ? etaObj?.nextStop?.stopNameTa || etaObj?.nextStop?.stopNameEn || etaObj?.nextStop?.stopName : etaObj?.nextStop?.stopNameEn || etaObj?.nextStop?.stopName} (~{etaObj?.nextStop?.etaMinutes !== undefined ? Math.round(etaObj.nextStop.etaMinutes) : Math.round(etaObj?.nextStop?.estimatedMinutes || 1)} {language === 'ta' ? 'நிமி' : 'mins'})
                                </option>
                                {downstreamList.map((ds: any) => {
                                  const dsName = language === 'ta' ? ds.stopNameTa || ds.stopNameEn : ds.stopNameEn;
                                  return (
                                    <option key={ds.stopId} value={ds.stopId}>
                                      #{ds.stopSequence}: {dsName} (~{Math.max(1, Math.round(ds.etaMinutes))} {language === 'ta' ? 'நிமி' : 'mins'})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.35 }}>
                            {t('eta.prediction_disclaimer')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SECTION E: ROUTE STOP TIMELINE & DESTINATION STOP SELECTION */}
                    {stopsItinerary.length > 0 && (
                      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {language === 'ta' ? 'வழித்தட நிறுத்தங்கள் & வருகை' : 'Route Stops & Predicted Arrival'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {t('eta.select_stop_prompt')}
                          </span>
                        </div>

                        {/* Selected Destination Summary Card */}
                        {selectedDestStop && (
                          <div className="map-bus-destination-summary">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <strong style={{ color: 'var(--color-primary-teal)' }}>
                                {t('eta.destination_stop')}: {language === 'ta' ? selectedDestStop.nameTa || selectedDestStop.stopNameTa : selectedDestStop.nameEn || selectedDestStop.stopNameEn}
                              </strong>
                              <button
                                type="button"
                                onClick={() => setSelectedDownstreamStopId(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '11px' }}
                              >
                                ✕
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                              <span>{stopsRemainingCount} {t('eta.stops_to_destination').replace('{count}', String(stopsRemainingCount))}</span>
                              {selectedDestStop.distanceFromOriginKm && (
                                <span>• {selectedDestStop.distanceFromOriginKm} km</span>
                              )}
                              {etaMins !== null && (
                                <strong style={{ color: 'var(--color-primary-teal)' }}>
                                  • ~{etaMins} {language === 'ta' ? 'நிமி' : 'mins'}
                                </strong>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive Stops Mini-Timeline */}
                        <div className="map-bus-timeline-mini">
                          {stopsItinerary.map((stopItem: any) => {
                            const isPassed = stopItem.status === 'CONFIRMED_PASSED';
                            const isCurrent = stopItem.status === 'CURRENT_STOP';
                            const isSelectedDest = selectedDownstreamStopId === stopItem.stopId;
                            const itemStopName = language === 'ta' ? stopItem.nameTa : stopItem.nameEn;

                            return (
                              <div
                                key={stopItem.stopId}
                                className={`map-bus-timeline-item ${isPassed ? 'passed' : ''} ${isSelectedDest ? 'selected-dest' : ''}`}
                                onClick={() => {
                                  if (!isPassed) {
                                    setSelectedDownstreamStopId(isSelectedDest ? null : stopItem.stopId);
                                  }
                                }}
                                title={isPassed ? 'Passed stop' : 'Click to select as destination'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {isPassed ? (
                                    <CheckCircle2 size={12} color="var(--color-status-success)" />
                                  ) : isCurrent ? (
                                    <Radio size={12} color="var(--color-primary-teal)" />
                                  ) : (
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                      #{stopItem.sequence}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', color: isPassed ? 'var(--color-text-muted)' : 'var(--color-text-primary)', fontWeight: isCurrent || isSelectedDest ? 700 : 500 }}>
                                    {itemStopName}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {stopItem.etaMinutes !== undefined && !isPassed && (
                                    <Badge variant={stopItem.predictionSource === 'ML_PREDICTION' ? 'success' : 'neutral'}>
                                      <span>~{Math.max(1, Math.round(stopItem.etaMinutes))}m</span>
                                    </Badge>
                                  )}
                                  {isSelectedDest && (
                                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-primary-teal)', textTransform: 'uppercase' }}>
                                      Dest
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SECTION F: SERVICE INFORMATION & ROUTE ALERTS */}
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                        {t('eta.service_status')}
                      </span>
                      {isLoadingAlerts ? (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          {language === 'ta' ? 'அறிவிப்புகள் சரிபார்க்கப்படுகின்றன...' : 'Checking verified transit advisories...'}
                        </div>
                      ) : routeAlerts.length > 0 ? (
                        routeAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`map-bus-alert-card ${alert.severity === 'CRITICAL' ? 'critical' : 'warning'}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, marginBottom: '2px' }}>
                              <AlertTriangle size={12} />
                              <span>{language === 'ta' ? alert.titleTa : alert.titleEn}</span>
                            </div>
                            <div style={{ fontSize: '10px', lineHeight: 1.35 }}>
                              {language === 'ta' ? alert.descriptionTa : alert.descriptionEn}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="map-bus-alert-card normal">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                            <CheckCircle2 size={12} />
                            <span>{t('eta.no_active_alerts')}</span>
                          </div>
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>
                            {t('eta.no_active_alerts_desc')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid (Depot, Coordinates, Hardware Health) */}
                    <div className="map-bus-detail-grid" style={{ marginTop: '10px' }}>
                      {/* Assigned Depot */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">{t('map.depot_label')}</span>
                        <span className="map-bus-detail-val" title={`${depotName}${depotCode}`}>
                          {depotName}{depotCode}
                        </span>
                      </div>

                      {/* Assigned Route */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">
                          {language === 'ta' ? 'ஒதுக்கப்பட்ட தடம்' : 'Assigned Route'}
                        </span>
                        <span className="map-bus-detail-val" title={routeName ? `${routeNumber} - ${routeName}` : routeNumber}>
                          {routeNumber !== t('map.not_assigned') ? `Route ${routeNumber}` : routeNumber}
                        </span>
                      </div>

                      {/* Coordinates */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">{language === 'ta' ? 'அமைவிடம்' : 'Coordinates'}</span>
                        <span className="map-bus-detail-val">
                          {typeof lat === 'number' && typeof lng === 'number'
                            ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                            : t('map.not_available')}
                        </span>
                      </div>

                      {/* Speed & Heading */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">
                          {t('map.speed_label')} / {t('map.heading_label')}
                        </span>
                        <span className="map-bus-detail-val">
                          {typeof speed === 'number' ? `${Math.round(speed)} km/h` : t('map.not_available')}
                          {' • '}
                          {typeof heading === 'number' ? `${Math.round(heading)}° (${getCompassDirection(heading)})` : 'N/A'}
                        </span>
                      </div>

                      {/* GNSS Fix & Satellites */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">{t('map.device_health_label')}</span>
                        <span className="map-bus-detail-val">
                          {gpsFix} {satellites ? `• ${satellites} Sats` : ''}
                        </span>
                      </div>

                      {/* Current Trip */}
                      <div className="map-bus-detail-item">
                        <span className="map-bus-detail-label">{t('map.trip_label')}</span>
                        <span className="map-bus-detail-val">
                          {liveDetails?.assignedTrip?.tripCode
                            ? `Trip #${liveDetails.assignedTrip.tripCode}`
                            : liveDetails?.activeTrip?.id
                            ? `Trip #${liveDetails.activeTrip.id.slice(-6)}`
                            : t('map.not_available')}
                        </span>
                      </div>
                    </div>

                    {/* SECTION B: Action buttons (Focus Bus, Fit Route) */}
                    <div className="map-bus-action-buttons">
                      <button
                        type="button"
                        className="map-bus-action-btn primary"
                        onClick={() => {
                          if (typeof lat === 'number' && typeof lng === 'number') {
                            onSelectEntity({
                              type: 'BUS',
                              id: selectedEntity.id,
                              lat,
                              lng,
                              titleEn: fleetNumber,
                              titleTa: fleetNumber,
                              subtitleEn: regNumber,
                              subtitleTa: regNumber,
                              data: markerData
                            });
                          }
                        }}
                      >
                        <MapPin size={13} />
                        <span>{t('map.focus_bus')}</span>
                      </button>

                      {onFitToRoute && (
                        <button
                          type="button"
                          className="map-bus-action-btn"
                          onClick={onFitToRoute}
                          disabled={!routeGeometry}
                          title={routeGeometry ? t('map.fit_route') : 'Route geometry not active'}
                        >
                          <RouteIcon size={13} />
                          <span>{t('map.fit_route')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* NON-BUS ENTITY SUBTITLE */
            selectedEntity.subtitleEn && (
              <p className="map-selected-entity-desc">
                {language === 'ta' ? selectedEntity.subtitleTa : selectedEntity.subtitleEn}
              </p>
            )
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

                {/* Bus Stand to Bus Stand Authorized TNSTC Road Corridor */}
                {(() => {
                  const originStandInfo = busStands.find(
                    (s) =>
                      (routeGeometry.originStand && (s.id === routeGeometry.originStand.id || s.code === routeGeometry.originStand.code)) ||
                      (routeGeometry.stops.length > 0 && s.nameEn.toLowerCase().includes(routeGeometry.stops[0].stop.nameEn.toLowerCase().split(' ')[0]))
                  );
                  const destStandInfo = busStands.find(
                    (s) =>
                      (routeGeometry.destinationStand && (s.id === routeGeometry.destinationStand.id || s.code === routeGeometry.destinationStand.code)) ||
                      (routeGeometry.stops.length > 0 && s.nameEn.toLowerCase().includes(routeGeometry.stops[routeGeometry.stops.length - 1].stop.nameEn.toLowerCase().split(' ')[0]))
                  );

                  const originNameTa = routeGeometry.originStand?.nameTa || originStandInfo?.nameTa || (routeGeometry.stops[0] ? routeGeometry.stops[0].stop.nameTa : 'தொடக்க முனையம்');
                  const originNameEn = routeGeometry.originStand?.nameEn || originStandInfo?.nameEn || (routeGeometry.stops[0] ? routeGeometry.stops[0].stop.nameEn : 'Origin Stand');
                  const destNameTa = routeGeometry.destinationStand?.nameTa || destStandInfo?.nameTa || (routeGeometry.stops[routeGeometry.stops.length - 1] ? routeGeometry.stops[routeGeometry.stops.length - 1].stop.nameTa : 'முடிவு முனையம்');
                  const destNameEn = routeGeometry.destinationStand?.nameEn || destStandInfo?.nameEn || (routeGeometry.stops[routeGeometry.stops.length - 1] ? routeGeometry.stops[routeGeometry.stops.length - 1].stop.nameEn : 'Destination Stand');

                  return (
                    <div
                      className="map-stand-corridor-card"
                      style={{
                        marginTop: '10px',
                        marginBottom: '12px',
                        padding: '12px 14px',
                        background: 'var(--color-bg-secondary, #F4F7F6)',
                        border: '1px solid var(--color-border-subtle, rgba(29, 119, 114, 0.2))',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={16} color="var(--color-primary-teal, #1D7772)" />
                          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--color-primary-teal, #1D7772)' }}>
                            {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட பேருந்து சாலை வழித்தடம்' : 'TNSTC Bus Running Road Corridor'}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '4px' }}>
                          {language === 'ta' ? 'முனையம் ⇄ முனையம்' : 'Stand to Stand'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Origin Stand */}
                        <div
                          style={{ flex: 1, minWidth: 0, cursor: originStandInfo ? 'pointer' : 'default' }}
                          title={language === 'ta' ? 'வரைபடத்தில் பார்க்க கிளிக் செய்யவும்' : 'Click to inspect terminal on map'}
                          onClick={() => {
                            if (originStandInfo && originStandInfo.location?.coordinates) {
                              onSelectEntity({
                                type: 'BUS_STAND',
                                id: originStandInfo.id,
                                lat: originStandInfo.location.coordinates[1],
                                lng: originStandInfo.location.coordinates[0],
                                titleEn: originStandInfo.nameEn,
                                titleTa: originStandInfo.nameTa,
                                subtitleEn: `${originStandInfo.totalPlatforms} Platforms • Origin Terminal`,
                                subtitleTa: `${originStandInfo.totalPlatforms} நடைமேடைகள் • தொடக்க முனையம்`,
                                data: originStandInfo
                              });
                            }
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                            {language === 'ta' ? 'தொடக்க முனையம்' : 'Origin Stand'}
                          </span>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-deep-teal, #071F21)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {language === 'ta' ? originNameTa : originNameEn}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, padding: '0 4px' }}>
                          <ArrowRight size={16} color="var(--color-primary-teal, #1D7772)" />
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-text-muted, #67958C)' }}>
                            {routeGeometry.totalDistanceKm} km
                          </span>
                        </div>

                        {/* Destination Stand */}
                        <div
                          style={{ flex: 1, minWidth: 0, cursor: destStandInfo ? 'pointer' : 'default', textAlign: 'right' }}
                          title={language === 'ta' ? 'வரைபடத்தில் பார்க்க கிளிக் செய்யவும்' : 'Click to inspect terminal on map'}
                          onClick={() => {
                            if (destStandInfo && destStandInfo.location?.coordinates) {
                              onSelectEntity({
                                type: 'BUS_STAND',
                                id: destStandInfo.id,
                                lat: destStandInfo.location.coordinates[1],
                                lng: destStandInfo.location.coordinates[0],
                                titleEn: destStandInfo.nameEn,
                                titleTa: destStandInfo.nameTa,
                                subtitleEn: `${destStandInfo.totalPlatforms} Platforms • Destination Terminal`,
                                subtitleTa: `${destStandInfo.totalPlatforms} நடைமேடைகள் • சேரும் முனையம்`,
                                data: destStandInfo
                              });
                            }
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#F22932', textTransform: 'uppercase' }}>
                            {language === 'ta' ? 'சேரும் முனையம்' : 'Destination Stand'}
                          </span>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-deep-teal, #071F21)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {language === 'ta' ? destNameTa : destNameEn}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--color-border-subtle, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted, #67958C)' }}>
                        <span>{language === 'ta' ? 'பேருந்து இயங்கும் நெடுஞ்சாலை வழி (குறுக்குவழி அல்ல)' : 'Heavy-capacity bus running corridor (no by-roads)'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary-teal, #1D7772)' }}>{routeGeometry.stops.length} {language === 'ta' ? 'நிறுத்தங்கள்' : 'Stops'}</span>
                      </div>
                    </div>
                  );
                })()}

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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                            <span className="map-stop-distance">
                              {seq.distanceFromOriginKm} km from origin
                            </span>
                            {(() => {
                              const stopEst = selectedBusLiveDetails?.eta?.downstreamStops?.find(
                                (s: any) => s.stopId === seq.stop.id || s.stopSequence === seq.sequenceOrder
                              ) || (selectedBusLiveDetails?.eta?.nextStop?.stopId === seq.stop.id ? selectedBusLiveDetails.eta.nextStop : null)
                              || selectedBusLiveDetails?.eta?.stopEstimates?.find(
                                (s: any) => s.stopId === seq.stop.id || s.sequence === seq.sequenceOrder
                              );
                              if (stopEst && (stopEst.etaMinutes !== undefined || stopEst.estimatedMinutes !== undefined)) {
                                const mins = stopEst.etaMinutes !== undefined ? stopEst.etaMinutes : stopEst.estimatedMinutes;
                                const isMl = stopEst.predictionSource === 'ML_PREDICTION' || selectedBusLiveDetails?.eta?.predictionSource === 'ML_PREDICTION';
                                return (
                                  <Badge
                                    variant={isMl ? 'success' : 'info'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDownstreamStopId(seq.stop.id);
                                    }}
                                    title="Click to select downstream stop arrival estimate"
                                  >
                                    <span>~{Math.max(1, Math.round(mins))} {t('eta.minutes_away')}</span>
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
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

        {/* TAB 3: LIVE BUS FLEET SIDEBAR (Search, Category Filters, Fleet List) */}
        {activeTab === 'buses' && (
          <div className="map-tab-content">
            <div className="map-buses-header">
              <h4 className="map-section-title">{t('map.live_buses_title')}</h4>
              {liveBuses.length > 0 && (
                <span className="map-live-bus-badge">
                  {busesToShow.length} / {liveBuses.length} {language === 'ta' ? 'பேருந்துகள்' : 'Reporting'}
                </span>
              )}
            </div>

            {/* 1. Fleet Search Bar */}
            <div className="map-fleet-search-wrapper">
              <Search size={14} className="map-fleet-search-icon" />
              <input
                type="text"
                className="map-fleet-search-input"
                placeholder={t('map.search_fleet_placeholder')}
                value={fleetSearch}
                onChange={(e) => onFleetSearchChange?.(e.target.value)}
                aria-label={t('map.search_fleet_placeholder')}
              />
              {fleetSearch && (
                <button
                  type="button"
                  className="map-fleet-search-clear"
                  onClick={() => onFleetSearchChange?.('')}
                  aria-label="Clear fleet search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 2. Category Filter Pills */}
            <div className="map-fleet-filters-scroll" role="toolbar" aria-label="Fleet Category Filters">
              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => onFleetFilterChange?.('ALL')}
              >
                <span>{t('map.filter_all')}</span>
                <span>({filterCounts.ALL})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'MOVING' ? 'active' : ''}`}
                onClick={() => onFleetFilterChange?.('MOVING')}
              >
                <Activity size={12} />
                <span>{t('map.filter_moving')}</span>
                <span>({filterCounts.MOVING})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'STATIONARY' ? 'active' : ''}`}
                onClick={() => onFleetFilterChange?.('STATIONARY')}
              >
                <span>{t('map.filter_stationary')}</span>
                <span>({filterCounts.STATIONARY})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'DELAYED_STALE' ? 'active' : ''}`}
                onClick={() => onFleetFilterChange?.('DELAYED_STALE')}
              >
                <Clock size={12} />
                <span>{t('map.filter_delayed_stale')}</span>
                <span>({filterCounts.DELAYED_STALE})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'OFFLINE' ? 'active' : ''}`}
                onClick={() => onFleetFilterChange?.('OFFLINE')}
              >
                <span>{t('map.filter_offline')}</span>
                <span>({filterCounts.OFFLINE})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'REAL_GPS' ? 'active active-real' : ''}`}
                onClick={() => onFleetFilterChange?.('REAL_GPS')}
              >
                <Radio size={12} />
                <span>{t('map.filter_real_gps')}</span>
                <span>({filterCounts.REAL_GPS})</span>
              </button>

              <button
                type="button"
                className={`map-fleet-filter-btn ${fleetFilter === 'SIMULATOR' ? 'active active-sim' : ''}`}
                onClick={() => onFleetFilterChange?.('SIMULATOR')}
              >
                <span>{t('map.filter_simulator')}</span>
                <span>({filterCounts.SIMULATOR})</span>
              </button>
            </div>

            {/* 3. Quick Fit-to-Fleet Action */}
            {onFitToFleet && (
              <button
                type="button"
                className="map-fleet-fit-btn"
                onClick={onFitToFleet}
                title={t('map.fit_fleet')}
              >
                <Bus size={14} />
                <span>{t('map.fit_fleet')}</span>
              </button>
            )}

            {/* 4. Fleet List / Empty States */}
            {busesToShow.length > 0 ? (
              <div className="map-buses-list">
                {busesToShow.map((b) => {
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
                          <span>{Math.round(b.heading || 0)}° ({getCompassDirection(b.heading)})</span>
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
            ) : liveBuses.length > 0 ? (
              /* FILTERED EMPTY STATE */
              <div className="map-no-live-buses-box" role="note">
                <div className="map-no-buses-icon-box">
                  <Search size={24} color="var(--color-sage)" />
                </div>
                <h5 className="map-no-buses-title">{t('map.no_buses_matching_filter')}</h5>
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="map-bus-action-btn primary"
                    onClick={() => {
                      onFleetFilterChange?.('ALL');
                      onFleetSearchChange?.('');
                    }}
                  >
                    <span>{language === 'ta' ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* REQUIRED TRUTHFUL EMPTY STATE NOTICE WITH HARDWARE DISCLOSURE */
              <div className="map-no-live-buses-box" role="note">
                <div className="map-no-buses-icon-box">
                  <Bus size={28} color="var(--color-sage)" />
                </div>
                <h5 className="map-no-buses-title">{t('map.no_live_buses_title')}</h5>
                <p className="map-no-buses-message">
                  {t('map.no_live_buses')}
                </p>
                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(29, 120, 115, 0.05)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <ShieldCheck size={14} color="var(--color-primary-teal)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  <span>{t('map.hardware_truth_notice')}</span>
                </div>
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

        {/* TAB 5: ACCESSIBLE TEXT-BASED ALTERNATIVE VIEW */}
        {activeTab === 'table' && (
          <div className="map-tab-content" role="region" aria-label={t('accessibility.table_caption')}>
            <div className="map-accessible-view-header" style={{ marginBottom: '14px' }}>
              <h4 className="map-section-title">{t('accessibility.list_view_toggle')}</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                {language === 'ta'
                  ? 'திரை வாசிப்பிகள் மற்றும் எளிய தரவுப் பார்வைக்கான உரை அடிப்படையிலான நேரலைத் தகவல்.'
                  : 'Structured text alternative view of real-time transit telemetry for screen readers and text-first navigation.'}
              </p>
            </div>

            {/* Live Buses Table */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-deep-teal)', marginBottom: '8px' }}>
                {language === 'ta' ? 'இயங்கும் பேருந்துகள்' : 'Active Reporting Buses'} ({liveBuses.length})
              </h5>
              {liveBuses.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <caption className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                      {language === 'ta' ? 'இயங்கும் பேருந்துகளின் நேரலைத் தரவு அட்டவணை' : 'Live Reporting Bus Fleet Telemetry Table'}
                    </caption>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-surface-subtle, #F8FAFC)', borderBottom: '1px solid var(--color-border)' }}>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Fleet / Reg</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Speed</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Heading</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Coordinates</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveBuses.map((b) => (
                        <tr
                          key={b.busId}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
                            cursor: 'pointer',
                            backgroundColor: selectedEntity?.id === b.busId ? 'rgba(29, 120, 115, 0.08)' : 'transparent'
                          }}
                          onClick={() => {
                            onSelectEntity({
                              type: 'BUS',
                              id: b.busId,
                              lat: b.lat,
                              lng: b.lng,
                              titleEn: b.fleetNumber || 'TNSTC Bus',
                              titleTa: b.fleetNumber || 'அரசுப் பேருந்து',
                              subtitleEn: b.isSimulated ? 'Simulated' : 'Live GPS',
                              subtitleTa: b.isSimulated ? 'மாதிரி இயக்கம்' : 'நேரலை ஜிபிஎஸ்',
                              data: b
                            });
                          }}
                        >
                          <td style={{ padding: '8px 10px' }}>
                            <strong>{b.fleetNumber || 'TNSTC'}</strong>
                            {b.registrationNumber && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{b.registrationNumber}</div>}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, backgroundColor: b.isSimulated ? '#FEF3C7' : '#DCFCE7', color: b.isSimulated ? '#92400E' : '#166534' }}>
                              {b.isSimulated ? 'SIM' : 'LIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>{Math.round(b.speedKmph || 0)} km/h</td>
                          <td style={{ padding: '8px 10px' }}>{Math.round(b.heading || 0)}° ({getCompassDirection(b.heading)})</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</td>
                          <td style={{ padding: '8px 10px' }}>{formatRelativeFreshness(b.recordedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {t('map.no_live_buses')}
                </p>
              )}
            </div>

            {/* Route Stops Table */}
            {routeGeometry?.stops && routeGeometry.stops.length > 0 && (
              <div>
                <h5 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-deep-teal)', marginBottom: '8px' }}>
                  {language === 'ta' ? 'வழித்தட நிறுத்தங்கள்' : 'Route Stops Sequence'} ({routeGeometry.routeNumber})
                </h5>
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <caption className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                      {language === 'ta' ? 'வழித்தட நிறுத்தங்களின் வரிசைமுறை அட்டவணை' : 'Ordered Route Stops Sequence Table'}
                    </caption>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-surface-subtle, #F8FAFC)', borderBottom: '1px solid var(--color-border)' }}>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>#</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Stop Name</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Distance</th>
                        <th scope="col" style={{ padding: '8px 10px', fontWeight: 700 }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeGeometry.stops.map((seq) => (
                        <tr
                          key={seq.stop.id}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
                            cursor: 'pointer',
                            backgroundColor: selectedEntity?.id === seq.stop.id ? 'rgba(29, 120, 115, 0.08)' : 'transparent'
                          }}
                          onClick={() => {
                            if (seq.stop.location?.coordinates) {
                              onSelectEntity({
                                type: 'BUS_STOP',
                                id: seq.stop.id,
                                lat: seq.stop.location.coordinates[1],
                                lng: seq.stop.location.coordinates[0],
                                titleEn: seq.stop.nameEn,
                                titleTa: seq.stop.nameTa,
                                subtitleEn: `Stop #${seq.sequenceOrder}`,
                                subtitleTa: `நிறுத்தம் #${seq.sequenceOrder}`,
                                data: seq
                              });
                            }
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>{seq.sequenceOrder}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <strong>{language === 'ta' ? seq.stop.nameTa : seq.stop.nameEn}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              {language === 'ta' ? seq.stop.nameEn : seq.stop.nameTa}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>{seq.distanceFromOriginKm} km</td>
                          <td style={{ padding: '8px 10px' }}>
                            {seq.isFareStage ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, backgroundColor: 'rgba(29, 120, 115, 0.1)', color: 'var(--color-primary-teal)' }}>
                                {t('map.fare_stage')}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)' }}>Regular</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
