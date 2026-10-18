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
      {/* Outer casing shadow for map contrast */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: '#071F21',
          weight: 7,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />

      {/* Main route stroke in brand primary teal */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: hasVerifiedGeometry ? '#1D7772' : '#67958C',
          weight: 4.5,
          opacity: 0.9,
          dashArray: hasVerifiedGeometry ? undefined : '6, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />
    </>
  );
};
