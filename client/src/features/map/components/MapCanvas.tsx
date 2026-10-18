/**
 * PERUNDHU (பேருந்து) — Leaflet Interactive Map Canvas
 * Coordinates reactive tile layers, route polylines, stand markers, sequence stops,
 * dynamic live buses, and responsive viewport sizing.
 */

import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  AttributionControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_LAYERS, MapLayerId, SelectedMapEntity, LiveBusMarkerData, RouteGeometryState } from '../types';
import { BusStandDto } from '../../../types/domain';
import { RoutePolyline } from './RoutePolyline';
import { BusStandMarker } from './BusStandMarker';
import { BusStopMarker } from './BusStopMarker';
import { BusLocationMarker } from './BusLocationMarker';
import { UserLocationMarker } from './UserLocationMarker';

interface MapCanvasProps {
  initialCenter: [number, number];
  initialZoom: number;
  viewportTrigger: {
    center: [number, number];
    zoom: number;
    bounds?: [[number, number], [number, number]];
    timestamp: number;
  };
  activeLayer: MapLayerId;
  isPanelCollapsed: boolean;
  busStands: BusStandDto[];
  routeGeometry: RouteGeometryState | null;
  liveBuses: LiveBusMarkerData[];
  userCoords: { lat: number; lng: number; accuracy: number } | null;
  selectedEntity: SelectedMapEntity | null;
  onSelectEntity: (entity: SelectedMapEntity) => void;
  onClearSelection: () => void;
  onExploreStandRoutes?: (standId: string) => void;
}

/**
 * Controller subcomponent running inside MapContainer context.
 * Coordinates smooth map movement and invalidates tile cache upon layout shifts.
 */
function MapViewportController({
  viewportTrigger,
  isPanelCollapsed
}: {
  viewportTrigger: MapCanvasProps['viewportTrigger'];
  isPanelCollapsed: boolean;
}) {
  const map = useMap();
  const lastTimestampRef = useRef<number>(viewportTrigger.timestamp);

  // Invalidate size whenever panel toggle or layout animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [isPanelCollapsed, map]);

  // Programmatic pan/fit when viewportTrigger updates
  useEffect(() => {
    if (viewportTrigger.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = viewportTrigger.timestamp;

      if (viewportTrigger.bounds) {
        map.fitBounds(viewportTrigger.bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true
        });
      } else {
        map.flyTo(viewportTrigger.center, viewportTrigger.zoom, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [viewportTrigger, map]);

  return null;
}

/**
 * Subcomponent to handle background map clicks.
 */
function MapClickHandler({ onClearSelection }: { onClearSelection: () => void }) {
  useMapEvents({
    click: () => {
      onClearSelection();
    }
  });
  return null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  initialCenter,
  initialZoom,
  viewportTrigger,
  activeLayer,
  isPanelCollapsed,
  busStands,
  routeGeometry,
  liveBuses,
  userCoords,
  selectedEntity,
  onSelectEntity,
  onClearSelection,
  onExploreStandRoutes
}) => {
  const layerConfig = MAP_LAYERS[activeLayer] || MAP_LAYERS.street;
  const tileUrl = layerConfig.isAvailable
    ? layerConfig.tileUrlTemplate
    : MAP_LAYERS.street.tileUrlTemplate;

  return (
    <div className="map-canvas-container" style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={6}
        maxZoom={19}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* OpenStreetMap Standard Tile Layer */}
        <TileLayer
          url={tileUrl}
          attribution={layerConfig.attribution || MAP_LAYERS.street.attribution}
          maxZoom={layerConfig.maxZoom}
        />

        <AttributionControl position="bottomright" prefix={false} />

        {/* Viewport and Click Handlers */}
        <MapViewportController
          viewportTrigger={viewportTrigger}
          isPanelCollapsed={isPanelCollapsed}
        />
        <MapClickHandler onClearSelection={onClearSelection} />

        {/* 1. Route Geometry Polyline */}
        {routeGeometry && (
          <RoutePolyline
            coordinates={routeGeometry.polylineCoordinates}
            hasVerifiedGeometry={routeGeometry.hasVerifiedGeometry}
          />
        )}

        {/* 2. Bus Stand Terminals */}
        {busStands.map((stand) => (
          <BusStandMarker
            key={`stand-${stand.id}`}
            stand={stand}
            isSelected={selectedEntity?.type === 'BUS_STAND' && selectedEntity?.id === stand.id}
            onSelect={onSelectEntity}
            onExploreRoutes={onExploreStandRoutes}
          />
        ))}

        {/* 3. Ordered Route Stops */}
        {routeGeometry?.stops.map((seq) => (
          <BusStopMarker
            key={`stop-${seq.stop.id}-${seq.sequenceOrder}`}
            stopSeq={seq}
            isSelected={selectedEntity?.type === 'BUS_STOP' && selectedEntity?.id === seq.stop.id}
            routeNumber={routeGeometry.routeNumber}
            onSelect={onSelectEntity}
          />
        ))}

        {/* 4. Live Real-Time Bus Markers */}
        {liveBuses.map((bus) => (
          <BusLocationMarker
            key={`bus-${bus.busId}`}
            bus={bus}
            isSelected={selectedEntity?.type === 'BUS' && selectedEntity?.id === bus.busId}
            onSelect={onSelectEntity}
          />
        ))}

        {/* 5. User Current Location */}
        {userCoords && <UserLocationMarker coords={userCoords} />}
      </MapContainer>
    </div>
  );
};
