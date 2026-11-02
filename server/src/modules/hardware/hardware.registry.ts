import {
  IGpsHardwareAdapter,
  BandwidthEstimate
} from './hardware.types';
import { ais140HttpAdapter } from './adapters/ais140.adapter';
import { teltonikaJsonAdapter } from './adapters/teltonika.adapter';
import { genericTrackerAdapter } from './adapters/genericTracker.adapter';
import { driverAppMobileAdapter } from './adapters/driverApp.adapter';
import { etmFallbackAdapter } from './adapters/etmFallback.adapter';

export class GpsAdapterRegistry {
  private adapters: Map<string, IGpsHardwareAdapter> = new Map();

  constructor() {
    this.register(ais140HttpAdapter);
    this.register(teltonikaJsonAdapter);
    this.register(genericTrackerAdapter);
    this.register(driverAppMobileAdapter);
    this.register(etmFallbackAdapter);
  }

  public register(adapter: IGpsHardwareAdapter): void {
    this.adapters.set(adapter.adapterId.toLowerCase(), adapter);
  }

  public getAdapter(adapterId: string): IGpsHardwareAdapter | undefined {
    return this.adapters.get(adapterId.toLowerCase());
  }

  /**
   * Automatically resolves the best matching adapter based on headers and payload signatures.
   */
  public detectAdapter(payload: unknown, headers?: Record<string, any>): IGpsHardwareAdapter | undefined {
    // 1. Explicit header override (e.g. 'x-adapter-id': 'ais140')
    if (headers && headers['x-adapter-id']) {
      const explicit = this.getAdapter(String(headers['x-adapter-id']));
      if (explicit) return explicit;
    }

    // 2. Scan adapters by canHandle()
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(payload, headers)) {
        return adapter;
      }
    }

    // 3. Fallback to generic IoT adapter if JSON with coordinates
    return this.adapters.get('generic');
  }

  public listAdapters(): Array<{
    id: string;
    name: string;
    protocol: string;
    defaultSource: string;
    documentation: string;
  }> {
    return Array.from(this.adapters.values()).map(a => ({
      id: a.adapterId,
      name: a.adapterName,
      protocol: a.supportedProtocol,
      defaultSource: a.defaultSource,
      documentation: a.vendorDocumentationRef || 'Standard specification'
    }));
  }

  /**
   * Pre-calculated technical bandwidth profiles for transport cellular SIM planning.
   */
  public getBandwidthEstimates(): BandwidthEstimate[] {
    return [
      {
        adapterId: 'ais140',
        protocol: 'HTTP',
        averagePacketBytes: 185,
        packetsPerHourAt10s: 360,
        kbPerHour: 65,
        kbPerShift8h: 520,
        mbPerMonth26Days: 13.5,
        recommendedSimDataPlan: '50 MB – 100 MB / month M2M pooled SIM',
        offlineBufferCapacityPoints: 10000,
        notes: 'Standard MoRTH ASCII CSV packet. Minimal cellular protocol overhead.'
      },
      {
        adapterId: 'teltonika',
        protocol: 'HTTP',
        averagePacketBytes: 280,
        packetsPerHourAt10s: 360,
        kbPerHour: 98,
        kbPerShift8h: 784,
        mbPerMonth26Days: 20.4,
        recommendedSimDataPlan: '100 MB / month IoT SIM',
        offlineBufferCapacityPoints: 8000,
        notes: 'JSON AVL packet including GNSS satellites, HDOP, ignition status, and battery voltage.'
      },
      {
        adapterId: 'generic',
        protocol: 'HTTP',
        averagePacketBytes: 220,
        packetsPerHourAt10s: 360,
        kbPerHour: 77,
        kbPerShift8h: 616,
        mbPerMonth26Days: 16.0,
        recommendedSimDataPlan: '50 MB – 100 MB / month IoT SIM',
        offlineBufferCapacityPoints: 5000,
        notes: 'Compact JSON telemetry format.'
      },
      {
        adapterId: 'driver-app',
        protocol: 'HTTPS',
        averagePacketBytes: 320,
        packetsPerHourAt10s: 360,
        kbPerHour: 112,
        kbPerShift8h: 896,
        mbPerMonth26Days: 23.3,
        recommendedSimDataPlan: '1 GB / month smartphone crew SIM',
        offlineBufferCapacityPoints: 2000,
        notes: 'HTTPS encrypted mobile app payload. Includes driver session tokens.'
      },
      {
        adapterId: 'etm',
        protocol: 'HTTPS',
        averagePacketBytes: 250,
        packetsPerHourAt10s: 60, // Ticket-bound / 1-minute heartbeat rather than 10s
        kbPerHour: 15,
        kbPerShift8h: 120,
        mbPerMonth26Days: 3.1,
        recommendedSimDataPlan: '50 MB / month shared AFCS SIM',
        offlineBufferCapacityPoints: 500,
        notes: 'Handheld battery constraints restrict streaming to event-based or reduced intervals.'
      }
    ];
  }
}

export const gpsAdapterRegistry = new GpsAdapterRegistry();

