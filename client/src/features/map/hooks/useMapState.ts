/**
 * PERUNDHU (பேருந்து) — Hook to manage interactive map state, API integrations, and Socket.IO real-time telemetry.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { userPreferences } from '../../../state/userPreferences';
import { STORAGE_KEYS } from '../../../config/constants';
import { safeSetItem } from '../../../lib/storage';
import { districtsService } from '../../../services/api/districts.service';
import { routeService } from '../../routes/services/routeService';
import { requestUserGeolocation } from '../../location/geolocation';
import { socketClientManager } from '../../../services/socket/socketClient';
import { mapDataService } from '../services/mapDataService';
import { getDistrictCenterInfo, DistrictCenterInfo } from '../data/districtCenters';
import {
  MapLayerId,
  SelectedMapEntity,
  LiveBusMarkerData,
  RouteGeometryState,
  SearchableMapItem
} from '../types';
import {
  BusStandDto,
  NearbyBusStandDto,
  DistrictDto,
  TrackingTelemetryStatus
} from '../../../types/domain';
import { RouteListItem } from '../../routes/types';
import {
  BusPositionPayload,
  BusStatusPayload,
  SubscriptionAckPayload,
  SocketConnectionState
} from '../../../types/realtime';

function getCompassDirection(heading?: number): string {
  if (heading === undefined || heading === null || isNaN(heading)) return 'N';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
  return directions[index];
}

export function useMapState() {
  const navigate = useNavigate();
  const { routeId: paramRouteId, districtId: paramDistrictId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken } = useAuth();

  // URL query parameters
  const queryDistrict = searchParams.get('district') || paramDistrictId || '';
  const queryRouteId = searchParams.get('routeId') || paramRouteId || '';
  const queryDirectionId = searchParams.get('directionId') || '';
  // 1. District State
  const [districtInfo, setDistrictInfo] = useState<DistrictCenterInfo>(() => {
    const pref = userPreferences.getSelectedDistrict();
    return getDistrictCenterInfo(queryDistrict || pref?.nameEn || pref?.districtId || 'MDU');
  });
  const [districtBackendRecord, setDistrictBackendRecord] = useState<DistrictDto | null>(null);

  // 2. Available Routes in District
  const [districtRoutes, setDistrictRoutes] = useState<RouteListItem[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);

  // 3. Selected Route & Geometry
  const [selectedRouteId, setSelectedRouteId] = useState<string>(queryRouteId);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>(queryDirectionId);
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometryState | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeLoadError, setRouteLoadError] = useState<string | null>(null);

  // 4. Bus Stands in District
  const [busStands, setBusStands] = useState<BusStandDto[]>([]);
  const [isLoadingStands, setIsLoadingStands] = useState<boolean>(false);

  // 5. User Geolocation & Nearby Stands
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyStands, setNearbyStands] = useState<NearbyBusStandDto[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);

  // 6. Real-time Live Buses Telemetry Map
  const [liveBusesMap, setLiveBusesMap] = useState<Map<string, LiveBusMarkerData>>(new Map());
  const [socketStatus, setSocketStatus] = useState<SocketConnectionState>('DISCONNECTED');
  const [subscribedRoom, setSubscribedRoom] = useState<string | null>(null);

  // 7. Interactive Map Selection & Viewport
  const [selectedEntity, setSelectedEntity] = useState<SelectedMapEntity | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerId>('street');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [activePanelTab, setActivePanelTab] = useState<'route' | 'stops' | 'buses' | 'nearby' | 'table'>('route');

  // 8. Fleet Sidebar Filter, Search & Details States
  const [fleetFilter, setFleetFilter] = useState<
    'ALL' | 'MOVING' | 'STATIONARY' | 'DELAYED_STALE' | 'OFFLINE' | 'REAL_GPS' | 'SIMULATOR'
  >('ALL');
  const [fleetSearch, setFleetSearch] = useState<string>('');
  const [selectedBusLiveDetails, setSelectedBusLiveDetails] = useState<any | null>(null);
  const [isLoadingBusDetails, setIsLoadingBusDetails] = useState<boolean>(false);

  const selectedBusIdRef = useRef<string | null>(null);
  const lastEtaCalculationRef = useRef<{ timestamp: number; distanceAlongRouteMeters?: number }>({
    timestamp: 0,
    distanceAlongRouteMeters: undefined
  });
  const isEtaFetchingRef = useRef<boolean>(false);

  // Synchronize selectedBusIdRef with selectedEntity
  useEffect(() => {
    if (selectedEntity?.type === 'BUS') {
      selectedBusIdRef.current = selectedEntity.id;
    } else {
      selectedBusIdRef.current = null;
    }
  }, [selectedEntity]);

  // Viewport trigger for programmatic pan/zoom
  const [viewportTrigger, setViewportTrigger] = useState<{
    center: [number, number];
    zoom: number;
    bounds?: [[number, number], [number, number]];
    timestamp: number;
  }>({
    center: districtInfo.center,
    zoom: districtInfo.zoom,
    timestamp: Date.now()
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set auth token provider for socket client
  useEffect(() => {
    if (accessToken) {
      socketClientManager.setTokenProvider(() => accessToken);
    }
  }, [accessToken]);

  // Track socket connection state
  useEffect(() => {
    const unsub = socketClientManager.onStateChange((state) => {
      if (isMountedRef.current) {
        setSocketStatus(state);
      }
    });
    return unsub;
  }, []);

  // Update district center info when district query changes
  useEffect(() => {
    const pref = userPreferences.getSelectedDistrict();
    const info = getDistrictCenterInfo(queryDistrict || pref?.nameEn || pref?.districtId || 'MDU');
    setDistrictInfo(info);
    setViewportTrigger({
      center: info.center,
      zoom: info.zoom,
      timestamp: Date.now()
    });
  }, [queryDistrict]);

  // Load district backend record and bus stands
  useEffect(() => {
    let isCancelled = false;

    async function loadDistrict() {
      setIsLoadingStands(true);
      try {
        const districtsRes = await districtsService.getDistricts({ limit: 50 });
        const matched =
          districtsRes.data.find(
            (d) => d.code.toUpperCase() === districtInfo.code.toUpperCase()
          ) ||
          districtsRes.data.find(
            (d) => d.nameEn.toLowerCase() === districtInfo.nameEn.toLowerCase()
          );

        if (!isCancelled && matched) {
          setDistrictBackendRecord(matched);

          // Fetch bus stands for this district
          const stands = await mapDataService.getDistrictBusStands(matched.id);
          if (!isCancelled) {
            setBusStands(stands);
          }

          // Fetch available routes for this district if pilot
          if (districtInfo.isPilot) {
            setIsLoadingRoutes(true);
            const routes = await routeService.getRoutesForDistrict(matched.id);
            if (!isCancelled) {
              setDistrictRoutes(routes);
            }
          } else {
            if (!isCancelled) {
              setDistrictRoutes([]);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load district data:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingStands(false);
          setIsLoadingRoutes(false);
        }
      }
    }

    loadDistrict();

    return () => {
      isCancelled = true;
    };
  }, [districtInfo.code, districtInfo.isPilot, districtInfo.nameEn]);

  // Synchronize route selection with query param or auto-select first available route for pilot
  useEffect(() => {
    if (queryRouteId) {
      setSelectedRouteId(queryRouteId);
    } else if (districtRoutes.length > 0 && !selectedRouteId) {
      // Default to Route 70 or first route
      const preferred =
        districtRoutes.find((r) => r.routeNumber === '70') || districtRoutes[0];
      if (preferred) {
        setSelectedRouteId(preferred.id);
        const firstDir = preferred.directions[0];
        if (firstDir) {
          setSelectedDirectionId(firstDir.id);
        }
      }
    }
  }, [queryRouteId, districtRoutes, selectedRouteId]);

  // Synchronize directionId
  useEffect(() => {
    if (queryDirectionId) {
      setSelectedDirectionId(queryDirectionId);
    }
  }, [queryDirectionId]);

  // Fetch verified route geometry & stop sequence
  useEffect(() => {
    if (!selectedRouteId) {
      setRouteGeometry(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingRoute(true);
    setRouteLoadError(null);

    async function loadRouteDetails() {
      try {
        // Find route metadata
        const routeMeta = districtRoutes.find((r) => r.id === selectedRouteId);
        let dirId = selectedDirectionId;

        if (!dirId && routeMeta && routeMeta.directions.length > 0) {
          dirId = routeMeta.directions[0].id;
          setSelectedDirectionId(dirId);
        }

        if (!dirId) {
          setIsLoadingRoute(false);
          return;
        }

        const detail = await mapDataService.getRouteDirectionDetails(
          selectedRouteId,
          dirId
        );

        if (isCancelled) return;

        // Convert GeoJSON LineString coordinates [lng, lat] to Leaflet [lat, lng]
        let polylineCoords: [number, number][] = [];
        let hasGeometry = false;

        if (
          detail.direction.routePolyline &&
          Array.isArray(detail.direction.routePolyline.coordinates) &&
          detail.direction.routePolyline.coordinates.length > 1
        ) {
          polylineCoords = detail.direction.routePolyline.coordinates.map((c) => [
            c[1],
            c[0]
          ]);
          hasGeometry = true;
        } else if (detail.direction.stops && detail.direction.stops.length > 0) {
          // Fallback to stop sequence point locations
          polylineCoords = detail.direction.stops
            .filter((s) => s.stop && s.stop.location && s.stop.location.coordinates)
            .map((s) => [
              s.stop.location.coordinates[1],
              s.stop.location.coordinates[0]
            ]);
        }

        const geomState: RouteGeometryState = {
          routeId: detail.route.id,
          directionId: detail.direction.id,
          routeNumber: detail.route.routeNumber,
          displayTitleEn: detail.route.displayTitleEn,
          displayTitleTa: detail.route.displayTitleTa,
          directionCode: detail.direction.directionCode,
          polylineCoordinates: polylineCoords,
          hasVerifiedGeometry: hasGeometry,
          totalDistanceKm: detail.direction.totalDistanceKm,
          estimatedDurationMins: detail.direction.estimatedDurationMins,
          originStand: detail.direction.originStand,
          destinationStand: detail.direction.destinationStand,
          stops: detail.direction.stops || []
        };

        setRouteGeometry(geomState);

        // Auto-fit route bounds if coordinates available
        if (polylineCoords.length > 1) {
          const lats = polylineCoords.map((c) => c[0]);
          const lngs = polylineCoords.map((c) => c[1]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          setViewportTrigger({
            center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
            zoom: 13,
            bounds: [
              [minLat - 0.005, minLng - 0.005],
              [maxLat + 0.005, maxLng + 0.005]
            ],
            timestamp: Date.now()
          });
        }
      } catch (err: any) {
        if (!isCancelled) {
          setRouteLoadError(err.message || 'Failed to load route itinerary');
          setRouteGeometry(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    }

    loadRouteDetails();

    return () => {
      isCancelled = true;
    };
  }, [selectedRouteId, selectedDirectionId, districtRoutes]);

  const routeNumberRef = useRef(routeGeometry?.routeNumber);
  useEffect(() => {
    routeNumberRef.current = routeGeometry?.routeNumber;
  }, [routeGeometry?.routeNumber]);

  // Load fleet positions from verified backend REST API
  const loadFleetPositions = useCallback(async () => {
    try {
      const res = await mapDataService.getFleetPositions({ limit: 100 });
      if (!isMountedRef.current || !res.data) return;
      setLiveBusesMap((prev) => {
        const next = new Map(prev);
        for (const item of res.data) {
          if (
            item.location?.coordinates &&
            Array.isArray(item.location.coordinates) &&
            item.location.coordinates.length === 2 &&
            !isNaN(item.location.coordinates[0]) &&
            !isNaN(item.location.coordinates[1])
          ) {
            next.set(item.busId, {
              busId: item.busId,
              tripId: item.tripId,
              routeId: item.route?.id,
              directionId: item.direction?.id,
              fleetNumber: item.fleetNumber || 'TNSTC Bus',
              registrationNumber: item.registrationNumber || '',
              routeNumber: item.route?.routeNumber || '70',
              displayTitleEn: item.route?.displayTitleEn,
              displayTitleTa: item.route?.displayTitleTa,
              depotName: item.depot?.name,
              depotCode: item.depot?.code,
              vehicleType: item.vehicleType,
              operationalStatus: item.operationalStatus,
              lat: item.location.coordinates[1],
              lng: item.location.coordinates[0],
              heading: item.heading || 0,
              speedKmph: item.speedKmph || 0,
              progressRatio: item.progressRatio,
              distanceAlongRouteMeters: item.distanceAlongRouteMeters,
              totalRouteDistanceMeters: item.totalRouteDistanceMeters,
              trackingStatus: item.trackingStatus || (item.isSimulated ? 'SIMULATED' : 'LIVE'),
              source: item.source || (item.isSimulated ? 'SIMULATOR' : 'VEHICLE_HARDWARE_GPS'),
              isSimulated: Boolean(item.isSimulated),
              freshness: item.freshness,
              satellitesCount: item.satellitesCount,
              altitudeMeters: item.altitudeMeters,
              gpsFixStatus: item.gpsFixStatus,
              batteryPercent: item.batteryPercent,
              networkSignalDbm: item.networkSignalDbm,
              deviceHealth: item.deviceHealth,
              recordedAt: item.recordedAt || new Date().toISOString(),
              lastReceivedAt: Date.now()
            });
          }
        }
        return next;
      });
    } catch (err) {
      console.warn('Failed to load fleet positions:', err);
    }
  }, []);

  // Real-time Socket.IO Route & Fleet Subscription Lifecycle
  useEffect(() => {
    // Connect shared socket client
    socketClientManager.connect();

    if (selectedRouteId) {
      setLiveBusesMap(new Map());
      socketClientManager.subscribeRoute(selectedRouteId);
      setSubscribedRoom(`route:${selectedRouteId}`);
    } else {
      loadFleetPositions();
      socketClientManager.subscribeFleet?.();
      setSubscribedRoom('fleet:all');
    }

    // Handle subscription acknowledgment and initial snapshot
    const unsubAck = socketClientManager.onSubscriptionAck((ack: SubscriptionAckPayload<any>) => {
      if (!isMountedRef.current) return;
      if (ack.snapshot && Array.isArray(ack.snapshot.buses)) {
        setLiveBusesMap((prev) => {
          const next = new Map(prev);
          for (const raw of ack.snapshot.buses) {
            if (
              raw.coordinates &&
              Array.isArray(raw.coordinates) &&
              raw.coordinates.length === 2 &&
              typeof raw.coordinates[0] === 'number' &&
              typeof raw.coordinates[1] === 'number' &&
              !isNaN(raw.coordinates[0]) &&
              !isNaN(raw.coordinates[1])
            ) {
              const isSim =
                raw.source === 'SIMULATOR' || raw.trackingStatus === 'SIMULATED';
              next.set(raw.busId, {
                busId: raw.busId,
                tripId: raw.tripId,
                routeId: raw.routeId,
                directionId: raw.directionId,
                fleetNumber: raw.fleetNumber || 'TNSTC Bus',
                registrationNumber: raw.registrationNumber || '',
                routeNumber: raw.routeNumber || routeNumberRef.current || '70',
                lat: raw.coordinates[1],
                lng: raw.coordinates[0],
                heading: raw.heading || 0,
                speedKmph: raw.speedKmph || 0,
                progressRatio: raw.progressRatio,
                distanceAlongRouteMeters: raw.distanceAlongRouteMeters,
                totalRouteDistanceMeters: raw.totalRouteDistanceMeters,
                trackingStatus: raw.trackingStatus || (isSim ? 'SIMULATED' : 'LIVE'),
                source: raw.source || (isSim ? 'SIMULATOR' : 'VEHICLE_HARDWARE_GPS'),
                isSimulated: isSim,
                recordedAt: raw.recordedAt || new Date().toISOString(),
                lastReceivedAt: Date.now()
              });
            }
          }
          return next;
        });
      }
    });

    // Handle incoming real-time bus positions
    const unsubPosition = socketClientManager.onBusPosition((pos: BusPositionPayload) => {
      if (!isMountedRef.current) return;
      if (
        pos.coordinates &&
        Array.isArray(pos.coordinates) &&
        pos.coordinates.length === 2 &&
        typeof pos.coordinates[0] === 'number' &&
        typeof pos.coordinates[1] === 'number' &&
        !isNaN(pos.coordinates[0]) &&
        !isNaN(pos.coordinates[1])
      ) {
        const [lng, lat] = pos.coordinates;

        setLiveBusesMap((prev) => {
          const next = new Map(prev);
          const existing = next.get(pos.busId);

          const isSim =
            pos.source === 'SIMULATOR' || pos.trackingStatus === 'SIMULATED';

          // Source-protection guard: Never allow simulated telemetry to overwrite real GPS
          if (existing && !existing.isSimulated && isSim) {
            return prev;
          }

          // Prevent outdated timestamps from overwriting newer telemetry
          if (
            existing &&
            pos.recordedAt &&
            existing.recordedAt &&
            new Date(pos.recordedAt).getTime() < new Date(existing.recordedAt).getTime()
          ) {
            return prev;
          }

          const updatedBus: LiveBusMarkerData = {
            busId: pos.busId,
            tripId: pos.tripId || existing?.tripId,
            routeId: pos.routeId || existing?.routeId,
            directionId: pos.directionId || existing?.directionId,
            fleetNumber: existing?.fleetNumber || 'TNSTC Bus',
            registrationNumber: existing?.registrationNumber || '',
            routeNumber: routeNumberRef.current || existing?.routeNumber || '70',
            lat,
            lng,
            heading: pos.heading ?? existing?.heading ?? 0,
            speedKmph: pos.speedKmph ?? existing?.speedKmph ?? 0,
            progressRatio: pos.progressRatio ?? existing?.progressRatio,
            distanceAlongRouteMeters:
              pos.distanceAlongRouteMeters ?? existing?.distanceAlongRouteMeters,
            totalRouteDistanceMeters:
              pos.totalRouteDistanceMeters ?? existing?.totalRouteDistanceMeters,
            trackingStatus: pos.trackingStatus || (isSim ? 'SIMULATED' : 'LIVE'),
            source: pos.source || (isSim ? 'SIMULATOR' : 'VEHICLE_HARDWARE_GPS'),
            isSimulated: isSim,
            recordedAt: pos.recordedAt || new Date().toISOString(),
            lastReceivedAt: Date.now()
          };

          next.set(pos.busId, updatedBus);
          return next;
        });

        // Keep selected entity card in sync if user currently has this bus selected
        setSelectedEntity((prevEntity) => {
          if (prevEntity && prevEntity.type === 'BUS' && prevEntity.id === pos.busId) {
            return {
              ...prevEntity,
              lat,
              lng,
              data: {
                ...prevEntity.data,
                lat,
                lng,
                heading: pos.heading ?? prevEntity.data?.heading ?? 0,
                speedKmph: pos.speedKmph ?? prevEntity.data?.speedKmph ?? 0,
                trackingStatus: pos.trackingStatus || prevEntity.data?.trackingStatus,
                recordedAt: pos.recordedAt || prevEntity.data?.recordedAt,
                lastReceivedAt: Date.now()
              }
            };
          }
          return prevEntity;
        });

        // Keep selected bus live details and telemetry in sync
        if (selectedBusIdRef.current === pos.busId) {
          setSelectedBusLiveDetails((prevDetails: any) => {
            if (!prevDetails) return prevDetails;
            const heading = pos.heading ?? prevDetails.latestPosition?.heading ?? 0;
            const speed = pos.speedKmph ?? prevDetails.latestPosition?.speedKmph ?? 0;
            const movementStatus = (speed > 2)
              ? 'MOVING'
              : (prevDetails.intelligence?.movementStatus === 'DWELLING' ? 'DWELLING' : 'STATIONARY');

            const updatedLatestPos = {
              ...prevDetails.latestPosition,
              coordinates: [lng, lat],
              heading,
              speedKmph: speed,
              distanceAlongRouteMeters: pos.distanceAlongRouteMeters ?? prevDetails.latestPosition?.distanceAlongRouteMeters,
              progressRatio: pos.progressRatio ?? prevDetails.latestPosition?.progressRatio,
              trackingStatus: pos.trackingStatus || prevDetails.latestPosition?.trackingStatus || 'LIVE',
              recordedAt: pos.recordedAt || prevDetails.latestPosition?.recordedAt || new Date().toISOString(),
              receivedAt: new Date().toISOString()
            };

            const updatedIntelligence = prevDetails.intelligence ? {
              ...prevDetails.intelligence,
              movementStatus,
              currentSpeedKmph: speed,
              compassHeading: {
                degrees: heading,
                direction: getCompassDirection(heading)
              },
              routeProgress: prevDetails.intelligence.routeProgress ? {
                ...prevDetails.intelligence.routeProgress,
                distanceTraveledKm: pos.distanceAlongRouteMeters !== undefined
                  ? +(pos.distanceAlongRouteMeters / 1000).toFixed(2)
                  : prevDetails.intelligence.routeProgress.distanceTraveledKm,
                progressPercent: pos.progressRatio !== undefined
                  ? Math.round(pos.progressRatio * 100)
                  : prevDetails.intelligence.routeProgress.progressPercent
              } : null
            } : prevDetails.intelligence;

            return {
              ...prevDetails,
              latestPosition: updatedLatestPos,
              intelligence: updatedIntelligence
            };
          });

          // Throttle ETA recalculations:
          // Live location updates arrive every 2-5s, but ETA recalculation (ML / baseline)
          // only triggers if the bus has progressed >= 100 meters along route OR >= 20 seconds have elapsed
          const now = Date.now();
          const lastCalc = lastEtaCalculationRef.current;
          const timeSinceLast = now - lastCalc.timestamp;
          const distDiff = pos.distanceAlongRouteMeters !== undefined && lastCalc.distanceAlongRouteMeters !== undefined
            ? Math.abs(pos.distanceAlongRouteMeters - lastCalc.distanceAlongRouteMeters)
            : 0;

          const shouldRecalculateEta =
            !isEtaFetchingRef.current &&
            (timeSinceLast >= 20000 || (distDiff >= 100 && timeSinceLast >= 5000));

          if (shouldRecalculateEta) {
            isEtaFetchingRef.current = true;
            lastEtaCalculationRef.current = {
              timestamp: now,
              distanceAlongRouteMeters: pos.distanceAlongRouteMeters
            };
            mapDataService.getBusLiveDetails(pos.busId)
              .then((fresh) => {
                if (isMountedRef.current && fresh && selectedBusIdRef.current === pos.busId) {
                  setSelectedBusLiveDetails(fresh);
                }
              })
              .catch((err) => {
                console.warn('Failed to refresh throttled bus ETA:', err);
              })
              .finally(() => {
                isEtaFetchingRef.current = false;
              });
          }
        }
      }
    });

    // Handle bus status changes (e.g. offline, stale, delayed)
    const unsubStatus = socketClientManager.onBusStatus((status: BusStatusPayload) => {
      if (!isMountedRef.current) return;
      setLiveBusesMap((prev) => {
        if (!prev.has(status.busId)) return prev;
        const next = new Map(prev);
        const existing = next.get(status.busId)!;
        const effectiveStatus = (status.currentStatus ||
          (status as any).trackingStatus ||
          (status as any).status ||
          existing.trackingStatus) as TrackingTelemetryStatus;
        const isDelayed =
          (status as any).isDelayed ??
          (effectiveStatus === 'DELAYED' || existing.isDelayed);
        const isDeviated =
          (status as any).isDeviated ??
          (effectiveStatus === 'DEVIATED' || existing.isDeviated);

        next.set(status.busId, {
          ...existing,
          trackingStatus: effectiveStatus,
          isDelayed,
          isDeviated,
          lastReceivedAt: Date.now()
        });
        return next;
      });

      setSelectedEntity((prevEntity) => {
        if (prevEntity && prevEntity.type === 'BUS' && prevEntity.id === status.busId) {
          const effectiveStatus = (status.currentStatus ||
            (status as any).trackingStatus ||
            (status as any).status ||
            prevEntity.data?.trackingStatus) as TrackingTelemetryStatus;
          const isDelayed =
            (status as any).isDelayed ??
            (effectiveStatus === 'DELAYED' || prevEntity.data?.isDelayed);
          const isDeviated =
            (status as any).isDeviated ??
            (effectiveStatus === 'DEVIATED' || prevEntity.data?.isDeviated);

          return {
            ...prevEntity,
            data: {
              ...prevEntity.data,
              trackingStatus: effectiveStatus,
              isDelayed,
              isDeviated,
              lastReceivedAt: Date.now()
            }
          };
        }
        return prevEntity;
      });
    });

    // Reconcile missed events after reconnection so map state is never outdated
    const unsubReconcile = socketClientManager.onReconcile
      ? socketClientManager.onReconcile(() => {
          if (!isMountedRef.current) return;
          if (selectedRouteId) {
            socketClientManager.subscribeRoute(selectedRouteId);
          } else {
            loadFleetPositions();
            socketClientManager.subscribeFleet?.();
          }
          if (selectedBusIdRef.current) {
            mapDataService.getBusLiveDetails(selectedBusIdRef.current).then((live) => {
              if (isMountedRef.current && live && selectedBusIdRef.current === live.bus?.id) {
                setSelectedBusLiveDetails(live);
              }
            }).catch(console.warn);
          }
        })
      : () => {};

    return () => {
      if (selectedRouteId) {
        socketClientManager.unsubscribeRoute(selectedRouteId);
      } else {
        socketClientManager.unsubscribeFleet?.();
      }
      setSubscribedRoom(null);
      unsubAck();
      unsubPosition();
      unsubStatus();
      unsubReconcile();
    };
  }, [selectedRouteId, loadFleetPositions]);

  // On-demand user geolocation
  const handleRequestUserLocation = useCallback(async () => {
    setIsLocatingUser(true);
    setLocationError(null);

    try {
      const geo = await requestUserGeolocation();
      const coords = {
        lat: geo.coordinates.lat,
        lng: geo.coordinates.lng,
        accuracy: geo.accuracyMeters || 15
      };

      if (!isMountedRef.current) return;
      setUserCoords(coords);

      // Pan to user location
      setViewportTrigger({
        center: [coords.lat, coords.lng],
        zoom: 14,
        timestamp: Date.now()
      });

      // Select user location entity
      setSelectedEntity({
        type: 'USER_LOCATION',
        id: 'current-user-device',
        lat: coords.lat,
        lng: coords.lng,
        titleEn: 'Your Current Location',
        titleTa: 'உங்கள் தற்போதைய இருப்பிடம்',
        subtitleEn: `Accuracy: ~${Math.round(coords.accuracy)}m`,
        subtitleTa: `சுமார் ~${Math.round(coords.accuracy)}மீ துல்லியம்`,
        data: coords
      });

      // Fetch nearby bus stands
      setIsLoadingNearby(true);
      const stands = await mapDataService.getNearbyBusStands(coords.lat, coords.lng);
      if (isMountedRef.current) {
        setNearbyStands(stands);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setLocationError(err.message || 'Unable to determine your location');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLocatingUser(false);
        setIsLoadingNearby(false);
      }
    }
  }, []);

  // Recenter map to district center or route bounds
  const handleRecenter = useCallback(() => {
    if (routeGeometry && routeGeometry.polylineCoordinates.length > 1) {
      const lats = routeGeometry.polylineCoordinates.map((c) => c[0]);
      const lngs = routeGeometry.polylineCoordinates.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      setViewportTrigger({
        center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
        zoom: 13,
        bounds: [
          [minLat - 0.005, minLng - 0.005],
          [maxLat + 0.005, maxLng + 0.005]
        ],
        timestamp: Date.now()
      });
    } else {
      setViewportTrigger({
        center: districtInfo.center,
        zoom: districtInfo.zoom,
        timestamp: Date.now()
      });
    }
  }, [districtInfo.center, districtInfo.zoom, routeGeometry]);

  // Select a route programmatically
  const handleSelectRoute = useCallback(
    (routeId: string, directionId?: string) => {
      setSelectedRouteId(routeId);
      const targetRoute = districtRoutes.find((r) => r.id === routeId);
      const dir =
        directionId ||
        (targetRoute?.directions[0]?.id ?? '');
      setSelectedDirectionId(dir);
      safeSetItem(STORAGE_KEYS.SELECTED_ROUTE, routeId);

      // Update URL query parameters cleanly
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('routeId', routeId);
        if (dir) next.set('directionId', dir);
        if (targetRoute) next.set('routeNumber', targetRoute.routeNumber);
        return next;
      });
    },
    [districtRoutes, setSearchParams]
  );

  // Switch direction for current route
  const handleSwitchDirection = useCallback(
    (directionId: string) => {
      setSelectedDirectionId(directionId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('directionId', directionId);
        return next;
      });
    },
    [setSearchParams]
  );

  // Focus a specific marker on the map and fetch comprehensive live bus details if entity is BUS
  const handleSelectEntity = useCallback(
    async (entity: SelectedMapEntity) => {
      setSelectedEntity(entity);
      setViewportTrigger({
        center: [entity.lat, entity.lng],
        zoom: 15,
        timestamp: Date.now()
      });

      if (entity.type === 'BUS') {
        selectedBusIdRef.current = entity.id;
        lastEtaCalculationRef.current = {
          timestamp: Date.now(),
          distanceAlongRouteMeters: undefined
        };
        setIsLoadingBusDetails(true);
        try {
          const liveDetails = await mapDataService.getBusLiveDetails(entity.id);
          if (isMountedRef.current && liveDetails) {
            setSelectedBusLiveDetails(liveDetails);

            // If the selected bus is assigned to a route, dynamically load route geometry & stops
            if (liveDetails.routeDetails?.direction) {
              const rd = liveDetails.routeDetails;
              let polylineCoords: [number, number][] = [];
              let hasGeom = false;
              if (
                rd.direction.routePolyline &&
                Array.isArray(rd.direction.routePolyline.coordinates) &&
                rd.direction.routePolyline.coordinates.length > 1
              ) {
                polylineCoords = rd.direction.routePolyline.coordinates.map((c: any) => [c[1], c[0]]);
                hasGeom = true;
              } else if (rd.direction.stops && rd.direction.stops.length > 0) {
                polylineCoords = rd.direction.stops
                  .filter((s: any) => s.stop?.location?.coordinates)
                  .map((s: any) => [s.stop.location.coordinates[1], s.stop.location.coordinates[0]]);
              }

              setRouteGeometry({
                routeId: rd.route.id,
                directionId: rd.direction.id,
                routeNumber: rd.route.routeNumber,
                displayTitleEn: rd.route.displayTitleEn,
                displayTitleTa: rd.route.displayTitleTa,
                directionCode: rd.direction.directionCode,
                polylineCoordinates: polylineCoords,
                hasVerifiedGeometry: hasGeom,
                totalDistanceKm: rd.direction.totalDistanceKm,
                estimatedDurationMins: rd.direction.estimatedDurationMins,
                originStand: rd.direction.originStand,
                destinationStand: rd.direction.destinationStand,
                stops: rd.direction.stops || []
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load bus live details:', err);
        } finally {
          if (isMountedRef.current) {
            setIsLoadingBusDetails(false);
          }
        }
      } else {
        setSelectedBusLiveDetails(null);
      }
    },
    []
  );

  // Clear selected entity
  const handleClearSelectedEntity = useCallback(() => {
    setSelectedEntity(null);
    setSelectedBusLiveDetails(null);
    selectedBusIdRef.current = null;
  }, []);

  // Fit map viewport to include all live fleet buses
  const handleFitToFleet = useCallback(() => {
    const buses = Array.from(liveBusesMap.values());
    if (buses.length === 0) return;
    const lats = buses.map((b) => b.lat).filter((l) => typeof l === 'number' && !isNaN(l));
    const lngs = buses.map((b) => b.lng).filter((l) => typeof l === 'number' && !isNaN(l));
    if (lats.length === 0 || lngs.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    if (minLat === maxLat && minLng === maxLng) {
      setViewportTrigger({
        center: [minLat, minLng],
        zoom: 14,
        timestamp: Date.now()
      });
    } else {
      setViewportTrigger({
        center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
        zoom: 13,
        bounds: [
          [minLat - 0.005, minLng - 0.005],
          [maxLat + 0.005, maxLng + 0.005]
        ],
        timestamp: Date.now()
      });
    }
  }, [liveBusesMap]);

  // Fit map viewport to selected route polyline
  const handleFitToRoute = useCallback(() => {
    if (!routeGeometry || routeGeometry.polylineCoordinates.length < 2) return;
    const lats = routeGeometry.polylineCoordinates.map((c) => c[0]);
    const lngs = routeGeometry.polylineCoordinates.map((c) => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    setViewportTrigger({
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
      zoom: 13,
      bounds: [
        [minLat - 0.005, minLng - 0.005],
        [maxLat + 0.005, maxLng + 0.005]
      ],
      timestamp: Date.now()
    });
  }, [routeGeometry]);

  // Return to dashboard
  const handleReturnToDashboard = useCallback(() => {
    const routeParam = selectedRouteId ? `&routeId=${selectedRouteId}` : '';
    const dirParam = selectedDirectionId ? `&directionId=${selectedDirectionId}` : '';
    navigate(`/dashboard?district=${districtInfo.code.toLowerCase()}${routeParam}${dirParam}`);
  }, [districtInfo.code, navigate, selectedDirectionId, selectedRouteId]);

  // Aggregated Search Items Index
  const searchIndex = useMemo<SearchableMapItem[]>(() => {
    const items: SearchableMapItem[] = [];

    // 1. Bus stands
    for (const stand of busStands) {
      if (stand.location?.coordinates) {
        items.push({
          id: stand.id,
          type: 'BUS_STAND',
          code: stand.code,
          nameEn: stand.nameEn,
          nameTa: stand.nameTa,
          subtitleEn: `${stand.totalPlatforms} Platforms • Terminal`,
          subtitleTa: `${stand.totalPlatforms} நடைமேடைகள் • முனையம்`,
          lat: stand.location.coordinates[1],
          lng: stand.location.coordinates[0]
        });
      }
    }

    // 2. Route Stops
    if (routeGeometry?.stops) {
      for (const s of routeGeometry.stops) {
        if (s.stop?.location?.coordinates) {
          items.push({
            id: s.stop.id,
            type: 'BUS_STOP',
            code: s.stop.code,
            nameEn: s.stop.nameEn,
            nameTa: s.stop.nameTa,
            subtitleEn: `Stop #${s.sequenceOrder} • Route ${routeGeometry.routeNumber}`,
            subtitleTa: `நிறுத்தம் #${s.sequenceOrder} • தடம் ${routeGeometry.routeNumber}`,
            lat: s.stop.location.coordinates[1],
            lng: s.stop.location.coordinates[0],
            routeId: routeGeometry.routeId,
            directionId: routeGeometry.directionId
          });
        }
      }
    }

    // 3. Available Routes
    for (const r of districtRoutes) {
      items.push({
        id: r.id,
        type: 'ROUTE',
        routeNumber: r.routeNumber,
        nameEn: `Route ${r.routeNumber}: ${r.displayTitleEn}`,
        nameTa: `தடம் ${r.routeNumber}: ${r.displayTitleTa}`,
        subtitleEn: `${r.serviceCategory.replace('_', ' ')} • Madurai`,
        subtitleTa: `${r.serviceCategory.replace('_', ' ')} • மதுரை`,
        routeId: r.id
      });
    }

    return items;
  }, [busStands, routeGeometry, districtRoutes]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchIndex.filter(
      (item) =>
        item.nameEn.toLowerCase().includes(q) ||
        item.nameTa.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.routeNumber && item.routeNumber.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchIndex, searchQuery]);

  // Convert live buses map to array
  const liveBuses = useMemo(() => {
    return Array.from(liveBusesMap.values());
  }, [liveBusesMap]);

  // Filtered live buses according to selected fleet category and search keyword
  const filteredBuses = useMemo(() => {
    let list = Array.from(liveBusesMap.values());
    if (fleetSearch.trim()) {
      const q = fleetSearch.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.fleetNumber?.toLowerCase().includes(q) ||
          b.registrationNumber?.toLowerCase().includes(q) ||
          b.routeNumber?.toLowerCase().includes(q)
      );
    }

    switch (fleetFilter) {
      case 'MOVING':
        return list.filter((b) => (b.speedKmph || 0) > 5);
      case 'STATIONARY':
        return list.filter((b) => (b.speedKmph || 0) <= 5);
      case 'DELAYED_STALE':
        return list.filter(
          (b) =>
            b.trackingStatus === 'DELAYED' ||
            b.trackingStatus === 'STALE' ||
            b.freshness === 'DELAYED' ||
            b.freshness === 'STALE'
        );
      case 'OFFLINE':
        return list.filter(
          (b) =>
            b.trackingStatus === 'OFFLINE' ||
            b.trackingStatus === 'UNAVAILABLE' ||
            b.freshness === 'OFFLINE'
        );
      case 'REAL_GPS':
        return list.filter((b) => !b.isSimulated && b.source !== 'SIMULATOR');
      case 'SIMULATOR':
        return list.filter((b) => b.isSimulated || b.source === 'SIMULATOR');
      default:
        return list;
    }
  }, [liveBusesMap, fleetFilter, fleetSearch]);

  return {
    districtInfo,
    districtBackendRecord,
    districtRoutes,
    isLoadingRoutes,
    selectedRouteId,
    selectedDirectionId,
    routeGeometry,
    isLoadingRoute,
    routeLoadError,
    busStands,
    isLoadingStands,
    userCoords,
    isLocatingUser,
    locationError,
    nearbyStands,
    isLoadingNearby,
    liveBuses,
    filteredBuses,
    fleetFilter,
    setFleetFilter,
    fleetSearch,
    setFleetSearch,
    selectedBusLiveDetails,
    isLoadingBusDetails,
    socketStatus,
    subscribedRoom,
    selectedEntity,
    activeLayer,
    searchQuery,
    searchResults,
    isPanelCollapsed,
    activePanelTab,
    viewportTrigger,
    setSearchQuery,
    setActiveLayer,
    setIsPanelCollapsed,
    setActivePanelTab,
    handleRequestUserLocation,
    handleRecenter,
    handleSelectRoute,
    handleSwitchDirection,
    handleSelectEntity,
    handleClearSelectedEntity,
    handleReturnToDashboard,
    handleFitToFleet,
    handleFitToRoute
  };
}
