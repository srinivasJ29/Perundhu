/**
 * PERUNDHU (பேருந்து) — Map Integration Architecture & Types (Step 7)
 * Strictly typed contracts for Leaflet geospatial canvas, real-time bus telemetry,
 * bus stands, route stop sequences, and user location markers.
 */

import {
  DirectionStopSequenceDto,
  TrackingTelemetryStatus,
  LocationTelemetrySource
} from '../../types/domain';

export interface LatLngCoordinate {
  lat: number;
  lng: number;
}

export type GeoJsonCoordinateTuple = [number, number]; // [longitude, latitude]

export interface MapViewportState {
  center: LatLngCoordinate;
  zoom: number;
}

export type MapLayerId = 'street' | 'satellite' | 'hybrid';

export interface MapLayerConfig {
  id: MapLayerId;
  nameEn: string;
  nameTa: string;
  tileUrlTemplate: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  isAvailable: boolean;
  unavailableReasonEn?: string;
  unavailableReasonTa?: string;
}

export const MAP_LAYERS: Record<MapLayerId, MapLayerConfig> = {
  street: {
    id: 'street',
    nameEn: 'CARTO Voyager (Clean Transit)',
    nameTa: 'போக்குவரத்து வரைபடம் (CARTO)',
    tileUrlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    minZoom: 5,
    isAvailable: true
  },
  satellite: {
    id: 'satellite',
    nameEn: 'Satellite Imagery (Esri)',
    nameTa: 'செயற்கைக்கோள் படம் (Esri)',
    tileUrlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    minZoom: 5,
    isAvailable: true
  },
  hybrid: {
    id: 'hybrid',
    nameEn: 'Night Transit (Dark Matter)',
    nameTa: 'இரவு முறை வரைபடம் (CARTO)',
    tileUrlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    minZoom: 5,
    isAvailable: true
  }
};

export type MapEntityType = 'BUS_STAND' | 'BUS_STOP' | 'BUS' | 'USER_LOCATION';

export interface SelectedMapEntity {
  type: MapEntityType;
  id: string;
  lat: number;
  lng: number;
  titleEn: string;
  titleTa: string;
  subtitleEn?: string;
  subtitleTa?: string;
  data: any;
}

export interface LiveBusMarkerData {
  busId: string;
  tripId?: string;
  routeId?: string;
  directionId?: string;
  fleetNumber?: string;
  registrationNumber?: string;
  routeNumber?: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmph: number;
  progressRatio?: number;
  distanceAlongRouteMeters?: number;
  totalRouteDistanceMeters?: number;
  trackingStatus: TrackingTelemetryStatus;
  source: LocationTelemetrySource;
  isSimulated: boolean;
  isDelayed?: boolean;
  isDeviated?: boolean;
  recordedAt: string;
  lastReceivedAt: number; // Epoch timestamp in ms
}

export interface SearchableMapItem {
  id: string;
  type: 'BUS_STAND' | 'BUS_STOP' | 'ROUTE';
  code?: string;
  nameEn: string;
  nameTa: string;
  subtitleEn: string;
  subtitleTa: string;
  lat?: number;
  lng?: number;
  routeId?: string;
  directionId?: string;
  routeNumber?: string;
}

export interface RouteGeometryState {
  routeId: string;
  directionId: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  polylineCoordinates: [number, number][]; // [lat, lng] array ready for Leaflet
  hasVerifiedGeometry: boolean;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  stops: DirectionStopSequenceDto[];
}

/**
 * Converts GeoJSON [longitude, latitude] tuple to Leaflet { lat, lng }.
 */
export function geoJsonToLatLng(coords: [number, number]): LatLngCoordinate {
  return {
    lat: coords[1],
    lng: coords[0]
  };
}

/**
 * Converts Leaflet { lat, lng } to GeoJSON [longitude, latitude] tuple.
 */
export function latLngToGeoJson(coords: LatLngCoordinate): [number, number] {
  return [coords.lng, coords.lat];
}
