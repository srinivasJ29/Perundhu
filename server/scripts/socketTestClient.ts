/**
 * PERUNDHU — Socket.IO Real-Time Tracking Developer Test Client
 *
 * Usage:
 *   npx tsx scripts/socketTestClient.ts [--url http://localhost:5000] [--bus <busId>] [--route <routeId>] [--token <jwt>]
 *
 * Examples:
 *   npx tsx scripts/socketTestClient.ts
 *   npx tsx scripts/socketTestClient.ts --bus 6ad04f9acac25e5e811df250
 *   npx tsx scripts/socketTestClient.ts --route 6ad04f9acac25e5e811df249
 */

import { io, Socket } from 'socket.io-client';

// =============================================================================
// CLI Arguments Parser
// =============================================================================
const args = process.argv.slice(2);
function getArg(flag: string, defaultValue?: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}

const serverUrl = getArg('--url', process.env.SERVER_URL || 'http://localhost:5000')!;
const targetBusId = getArg('--bus');
const targetRouteId = getArg('--route');
const authToken = getArg('--token');

console.log('='.repeat(75));
console.log('   PERUNDHU (பேருந்து) — Real-Time WebSocket Developer Client');
console.log('='.repeat(75));
console.log(`Connecting to server: ${serverUrl}`);
console.log(`Authentication: ${authToken ? 'JWT Bearer token supplied' : 'Public Guest / Passenger'}`);

// =============================================================================
// Socket.IO Client Setup
// =============================================================================
const socket: Socket = io(serverUrl, {
  transports: ['websocket', 'polling'],
  auth: authToken ? { token: authToken } : undefined
});

socket.on('connect', async () => {
  console.log(`[CONNECTED] Socket ID: ${socket.id}`);
  console.log('---------------------------------------------------------------------------');

  let busId = targetBusId;
  let routeId = targetRouteId;

  // If no IDs were supplied, discover from server REST API
  if (!busId && !routeId) {
    try {
      console.log('No --bus or --route supplied. Discovering active buses from REST API...');
      const response = await fetch(`${serverUrl}/api/v1/buses`);
      if (response.ok) {
        const body: any = await response.json();
        const buses = body.data?.buses || body.data || [];
        if (buses.length > 0) {
          busId = buses[0]._id || buses[0].id;
          console.log(`Discovered active bus: ${buses[0].fleetNumber || buses[0].registrationNumber} (${busId})`);
        }
      }
    } catch {
      console.log('Could not fetch bus list from REST API. Using fallback demo ObjectId.');
      busId = '6ad04f9acac25e5e811df250';
    }
  }

  // Subscribe to Bus
  if (busId) {
    console.log(`[SUBSCRIBING] Requesting subscription to bus:${busId}`);
    socket.emit('subscribe:bus', { busId });
  }

  // Subscribe to Route
  if (routeId) {
    console.log(`[SUBSCRIBING] Requesting subscription to route:${routeId}`);
    socket.emit('subscribe:route', { routeId });
  }
});

socket.on('connect_error', (err) => {
  console.error(`[CONNECTION ERROR] ${err.message}`);
});

socket.on('disconnect', (reason) => {
  console.log(`[DISCONNECTED] Reason: ${reason}`);
});

// =============================================================================
// Real-Time Event Handlers
// =============================================================================
socket.on('subscription:ack', (payload) => {
  console.log(`\n>>> [SUBSCRIPTION ACK] Room: ${payload.channel} | Status: ${payload.status}`);
  if (payload.snapshot) {
    console.log('    Initial Snapshot:', JSON.stringify(payload.snapshot, null, 2));
  }
});

socket.on('subscription:error', (payload) => {
  console.error(`\n>>> [SUBSCRIPTION ERROR] Code: ${payload.code} | Error: ${payload.error}`);
});

socket.on('unsubscription:ack', (payload) => {
  console.log(`\n>>> [UNSUBSCRIPTION ACK] Room: ${payload.channel}`);
});

socket.on('bus:position', (pos) => {
  console.log(
    `\n[BUS POSITION] Bus: ${pos.busId} | Coords: [${pos.coordinates[0].toFixed(5)}, ${pos.coordinates[1].toFixed(5)}] | Speed: ${pos.speedKmph} km/h | Heading: ${pos.heading}° | Status: ${pos.trackingStatus} (${pos.source})`
  );
  if (pos.distanceAlongRouteMeters !== undefined) {
    console.log(
      `               Progress: ${((pos.progressRatio || 0) * 100).toFixed(1)}% (${Math.round(pos.distanceAlongRouteMeters)}m / ${Math.round(pos.totalRouteDistanceMeters || 0)}m)`
    );
  }
});

socket.on('bus:status', (status) => {
  console.log(
    `\n>>> [STATUS CHANGE] Bus: ${status.busId} | Previous: ${status.previousStatus} -> Current: ${status.currentStatus}`
  );
});

socket.on('bus:next-stop', (data) => {
  console.log(
    `\n>>> [NEXT STOP] Bus: ${data.busId} | Next: ${data.nextStop.nameEn} (${data.nextStop.code}) | Dist: ${Math.round(data.nextStop.distanceToStopMeters)}m | Status: ${data.nextStop.status}`
  );
});

socket.on('bus:stop-event', (event) => {
  console.log(
    `\n>>> [STOP EVENT] Bus: ${event.busId} | Event: ${event.eventType} at Stop: ${event.stopNameEn} (Seq: ${event.sequence})`
  );
});

socket.on('bus:eta', (eta) => {
  console.log(
    `\n>>> [DYNAMIC ETA] Bus: ${eta.busId} | Speed: ${eta.effectiveSpeedKmph} km/h | Source: ${eta.predictionSource} (RealTime: ${eta.isRealTimePrediction})`
  );
  if (eta.predictions && eta.predictions.length > 0) {
    console.log('    Upcoming Stops:');
    for (const pred of eta.predictions.slice(0, 3)) {
      console.log(
        `      - ${pred.stopNameEn}: ~${pred.estimatedArrivalMinutes} min (${Math.round(pred.distanceToStopMeters)}m)`
      );
    }
  }
});

// =============================================================================
// Graceful Exit
// =============================================================================
process.on('SIGINT', () => {
  console.log('\n\nGracefully disconnecting test client...');
  if (targetBusId) {
    socket.emit('unsubscribe:bus', { busId: targetBusId });
  }
  if (targetRouteId) {
    socket.emit('unsubscribe:route', { routeId: targetRouteId });
  }
  setTimeout(() => {
    socket.disconnect();
    console.log('Test client disconnected. Goodbye!');
    process.exit(0);
  }, 300);
});
