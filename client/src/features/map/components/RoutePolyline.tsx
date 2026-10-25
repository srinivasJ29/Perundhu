/**
 * PERUNDHU (பேருந்து) — Route Polyline Vector Layer
 * Draws high-contrast dual-line polyline representing verified corridor transit path.
 */

import React from 'react';
import { Polyline } from 'react-leaflet';

interface RoutePolylineProps {
  coordinates: [number, number][]; // [lat, lng] array
  hasVerifiedGeometry: boolean;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  coordinates,
  hasVerifiedGeometry
}) => {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return (
    <>
      {/* Outer casing shadow for map contrast in pure black */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: '#0A0A0A',
          weight: 7,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />

      {/* Main route stroke in high-visibility vibrant electric yellow */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: hasVerifiedGeometry ? '#FACC15' : '#EAB308',
          weight: 4.5,
          opacity: 1,
          dashArray: hasVerifiedGeometry ? undefined : '6, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />
    </>
  );
};
