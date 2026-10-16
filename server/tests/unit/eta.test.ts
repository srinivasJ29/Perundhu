import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import { EtaService } from '../../src/modules/eta/eta.service';
import { NextStopService } from '../../src/modules/eta/nextStop.service';
import {
  ScheduledTrip,
  RouteDirection,
  LatestBusPosition,
  LocationHistory
} from '../../src/models';
import { EnrichedStopItem, NextStopDetectionResult } from '../../src/modules/eta/eta.types';

describe('Dynamic ETA Prediction Service (Unit)', () => {
  let etaService: EtaService;
  let mockNextStopService: any;
  const fixedNow = new Date('2026-10-15T10:00:00.000Z').getTime();

  const tripId = new Types.ObjectId();
  const busId = new Types.ObjectId();
  const routeDirectionId = new Types.ObjectId();
  const routeId = new Types.ObjectId();
  const stop1Id = new Types.ObjectId();
  const stop2Id = new Types.ObjectId();
  const stop3Id = new Types.ObjectId();

  const sampleStops: EnrichedStopItem[] = [
    {
      id: stop1Id.toString(),
      code: 'STOP-01',
      nameEn: 'Periyar Bus Stand',
      nameTa: 'பெரியார் பேருந்து நிலையம்',
      sequence: 1,
      location: [78.1145, 9.9175],
      distanceFromOriginMeters: 0,
      scheduledArrival: '10:00',
      scheduledDeparture: '10:02'
    },
    {
      id: stop2Id.toString(),
      code: 'STOP-02',
      nameEn: 'Simmakkal',
      nameTa: 'சிம்மக்கல்',
      sequence: 2,
      location: [78.1189, 9.9252],
      distanceFromOriginMeters: 1250,
      scheduledArrival: '10:08',
      scheduledDeparture: '10:09'
    },
    {
      id: stop3Id.toString(),
      code: 'STOP-03',
      nameEn: 'Goripalayam',
      nameTa: 'கோரிப்பாளையம்',
      sequence: 3,
      location: [78.1255, 9.9328],
      distanceFromOriginMeters: 2500,
      scheduledArrival: '10:15',
      scheduledDeparture: '10:16'
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockNextStopService = {
      detectNextStopForTrip: vi.fn(),
      getOrderedStopsForTrip: vi.fn().mockResolvedValue(sampleStops),
      calculateStopAlongRouteDistances: vi.fn().mockImplementation((stops) => stops)
    };

    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    vi.spyOn(LocationHistory, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      })
    } as any);

    etaService = new EtaService(mockNextStopService as unknown as NextStopService, {
      maxPositionAgeMs: 120000, // 2 mins
      minEffectiveSpeedKmph: 10,
      maxEffectiveSpeedKmph: 80,
      defaultSpeedKmph: 25,
      defaultDwellSeconds: 30,
      clock: () => fixedNow
    });
  });

  function setupTripMocks(status = 'IN_TRANSIT') {
    vi.spyOn(ScheduledTrip, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: tripId,
        tripCode: 'TRIP-70-01',
        busId,
        routeDirectionId,
        status,
        isActive: true
      })
    } as any);

    vi.spyOn(RouteDirection, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: routeDirectionId,
          directionCode: 'OUTBOUND',
          routeId: { routeNumber: '70' },
          routePolyline: {
            type: 'LineString',
            coordinates: [
              [78.1145, 9.9175],
              [78.1189, 9.9252],
              [78.1255, 9.9328]
            ]
          }
        })
      })
    } as any);
  }

  it('should calculate rolling average speed correctly from recent location history', async () => {
    vi.spyOn(LocationHistory, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { speedKmph: 30, recordedAt: new Date(fixedNow - 5000) },
            { speedKmph: 34, recordedAt: new Date(fixedNow - 10000) },
            { speedKmph: 26, recordedAt: new Date(fixedNow - 15000) }
          ])
        })
      })
    } as any);

    const avgSpeed = await etaService.getRollingAverageSpeedKmph(busId);
    expect(avgSpeed).toBe(30); // (30 + 34 + 26) / 3 = 30
  });

  it('should calculate distance-based ETA using rolling speed with simulated truthfulness', async () => {
    setupTripMocks('IN_TRANSIT');

    // Bus is between stop 1 and stop 2 at distance 250m along route, speed 36 km/h (10 m/s)
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 250,
        speedKmph: 36,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        recordedAt: new Date(fixedNow - 10000) // 10s old (< 120s max age)
      })
    } as any);

    // Mock rolling speed: 36 km/h = 10 m/s
    vi.spyOn(etaService, 'getRollingAverageSpeedKmph').mockResolvedValue(36);

    const detectionResult: NextStopDetectionResult = {
      tripId: tripId.toString(),
      tripCode: 'TRIP-70-01',
      busId: busId.toString(),
      status: 'APPROACHING',
      currentStop: sampleStops[0],
      nextStop: sampleStops[1], // Stop 2 at 1250m
      remainingDistanceMeters: 1000,
      distanceAlongRouteMeters: 250,
      totalRouteDistanceMeters: 2500,
      progressRatio: 0.1,
      trackingStatus: 'SIMULATED',
      source: 'SIMULATOR',
      isTerminalReached: false,
      isCompleted: false,
      isCancelled: false,
      confidence: 0.85
    };
    mockNextStopService.detectNextStopForTrip.mockResolvedValue(detectionResult);

    const result = await etaService.calculateTripEta(tripId);

    expect(result).not.toBeNull();
    // Truthfulness guarantees
    expect(result?.isRealTimePrediction).toBe(false);
    expect(result?.predictionSource).toBe('SIMULATED_MOVEMENT');
    expect(result?.source).toBe('SIMULATOR');
    expect(result?.trackingStatus).toBe('SIMULATED');

    // Stop 2: remaining distance = 1250 - 250 = 1000m. At 10 m/s (36 km/h) => 100s
    expect(result?.nextStop?.stopId).toBe(stop2Id.toString());
    expect(result?.nextStop?.remainingDistanceMeters).toBe(1000);
    expect(result?.nextStop?.effectiveSpeedKmph).toBe(36);
    expect(result?.nextStop?.etaSeconds).toBe(100);

    // Stop 3: segment distance = 2500 - 1250 = 1250m => 125s + 30s dwell at Stop 2 => 100s + 125s + 30s = 255s
    expect(result?.downstreamStops).toHaveLength(2);
    const stop3Eta = result?.downstreamStops[1];
    expect(stop3Eta.stopId).toBe(stop3Id.toString());
    expect(stop3Eta.remainingDistanceMeters).toBe(2250);
    expect(stop3Eta.etaSeconds).toBe(255);
  });

  it('should fall back to default transit speed when vehicle is stationary or dwelling', async () => {
    setupTripMocks('IN_TRANSIT');

    // Bus is stopped at signal or stop (speed 0 km/h)
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 0,
        speedKmph: 0,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        recordedAt: new Date(fixedNow - 5000)
      })
    } as any);

    vi.spyOn(etaService, 'getRollingAverageSpeedKmph').mockResolvedValue(0);

    const detectionResult: NextStopDetectionResult = {
      tripId: tripId.toString(),
      tripCode: 'TRIP-70-01',
      busId: busId.toString(),
      status: 'APPROACHING',
      nextStop: sampleStops[1],
      remainingDistanceMeters: 1250,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 2500,
      progressRatio: 0,
      trackingStatus: 'SIMULATED',
      source: 'SIMULATOR',
      isTerminalReached: false,
      isCompleted: false,
      isCancelled: false,
      confidence: 0.8
    };
    mockNextStopService.detectNextStopForTrip.mockResolvedValue(detectionResult);

    const result = await etaService.calculateTripEta(tripId);

    // Should use default speed (25 km/h) rather than 0
    expect(result?.nextStop?.effectiveSpeedKmph).toBe(25);
    expect(result?.nextStop?.etaSeconds).toBeGreaterThan(0);
  });

  it('should account for dwelling bus without double counting dwell time', async () => {
    setupTripMocks('IN_TRANSIT');

    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 0,
        speedKmph: 0,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        recordedAt: new Date(fixedNow - 5000)
      })
    } as any);

    // Bus is currently dwelling (ARRIVED at stop 1)
    const detectionResult: NextStopDetectionResult = {
      tripId: tripId.toString(),
      tripCode: 'TRIP-70-01',
      busId: busId.toString(),
      status: 'ARRIVED',
      currentStop: sampleStops[0],
      nextStop: sampleStops[1],
      remainingDistanceMeters: 1250,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 2500,
      progressRatio: 0,
      trackingStatus: 'SIMULATED',
      source: 'SIMULATOR',
      isTerminalReached: false,
      isCompleted: false,
      isCancelled: false,
      confidence: 0.85
    };
    mockNextStopService.detectNextStopForTrip.mockResolvedValue(detectionResult);

    const result = await etaService.calculateTripEta(tripId);

    // When ARRIVED, remaining dwell for current stop (half dwell = 15s) is added to downstream ETA
    // Distance 1250m at 25 km/h (6.94 m/s) = 180s + 15s dwell = 195s
    expect(result?.nextStop?.etaSeconds).toBe(195);
  });

  it('should fall back to schedule when telemetry is missing', async () => {
    setupTripMocks('SCHEDULED');

    // No latest bus position available
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    mockNextStopService.detectNextStopForTrip.mockResolvedValue(null);

    const result = await etaService.calculateTripEta(tripId);

    expect(result).not.toBeNull();
    expect(result?.predictionSource).toBe('SCHEDULE_FALLBACK');
    expect(result?.isRealTimePrediction).toBe(false);
    expect(result?.confidence).toBe(0.45);
    expect(result?.downstreamStops).toHaveLength(3);
  });

  it('should fall back to schedule when position telemetry is stale (> maxPositionAgeMs)', async () => {
    setupTripMocks('IN_TRANSIT');

    // 5 minutes old position (> 2 minutes max age)
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 500,
        speedKmph: 25,
        trackingStatus: 'STALE',
        source: 'SIMULATOR',
        recordedAt: new Date(fixedNow - 300000)
      })
    } as any);

    mockNextStopService.detectNextStopForTrip.mockResolvedValue(null);

    const result = await etaService.calculateTripEta(tripId);

    expect(result?.predictionSource).toBe('SCHEDULE_FALLBACK');
    expect(result?.isRealTimePrediction).toBe(false);
  });

  it('should label LIVE_MOVEMENT and isRealTimePrediction true for physical GPS telemetry', async () => {
    setupTripMocks('IN_TRANSIT');

    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 500,
        speedKmph: 30,
        trackingStatus: 'ONLINE',
        source: 'PHYSICAL_GPS',
        recordedAt: new Date(fixedNow - 5000)
      })
    } as any);

    const detectionResult: NextStopDetectionResult = {
      tripId: tripId.toString(),
      tripCode: 'TRIP-70-01',
      busId: busId.toString(),
      status: 'IN_TRANSIT',
      nextStop: sampleStops[1],
      remainingDistanceMeters: 750,
      distanceAlongRouteMeters: 500,
      totalRouteDistanceMeters: 2500,
      progressRatio: 0.2,
      trackingStatus: 'ONLINE',
      source: 'PHYSICAL_GPS',
      isTerminalReached: false,
      isCompleted: false,
      isCancelled: false,
      confidence: 0.95
    };
    mockNextStopService.detectNextStopForTrip.mockResolvedValue(detectionResult);

    const result = await etaService.calculateTripEta(tripId);

    expect(result?.predictionSource).toBe('LIVE_MOVEMENT');
    expect(result?.isRealTimePrediction).toBe(true);
    expect(result?.confidence).toBe(0.9);
  });

  it('should return empty downstream stops for CANCELLED, COMPLETED, or TERMINAL_REACHED trips', async () => {
    // 1. CANCELLED
    setupTripMocks('CANCELLED');
    const cancelledResult = await etaService.calculateTripEta(tripId);
    expect(cancelledResult?.predictionSource).toBe('UNAVAILABLE');
    expect(cancelledResult?.isRealTimePrediction).toBe(false);
    expect(cancelledResult?.downstreamStops).toEqual([]);

    // 2. COMPLETED
    setupTripMocks('COMPLETED');
    const completedResult = await etaService.calculateTripEta(tripId);
    expect(completedResult?.predictionSource).toBe('UNAVAILABLE');
    expect(completedResult?.downstreamStops).toEqual([]);

    // 3. TERMINAL_REACHED
    setupTripMocks('IN_TRANSIT');
    mockNextStopService.detectNextStopForTrip.mockResolvedValue({
      isTerminalReached: true
    });
    const terminalResult = await etaService.calculateTripEta(tripId);
    expect(terminalResult?.predictionSource).toBe('UNAVAILABLE');
    expect(terminalResult?.downstreamStops).toEqual([]);
  });

  it('should never return negative ETA values or NaN', async () => {
    setupTripMocks('IN_TRANSIT');

    // Bus position reported beyond last stop distance (edge case)
    vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        busId,
        tripId,
        distanceAlongRouteMeters: 3000,
        speedKmph: 25,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        recordedAt: new Date(fixedNow - 5000)
      })
    } as any);

    mockNextStopService.detectNextStopForTrip.mockResolvedValue({
      status: 'IN_TRANSIT',
      nextStop: sampleStops[2]
    });

    const result = await etaService.calculateTripEta(tripId);
    expect(result?.downstreamStops.every((s) => s.etaSeconds >= 0)).toBe(true);
    expect(result?.downstreamStops.every((s) => Number.isFinite(s.etaSeconds))).toBe(true);
  });

  it('should resolve active trip and calculate ETA via calculateBusEta', async () => {
    setupTripMocks('IN_TRANSIT');

    vi.spyOn(ScheduledTrip, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: tripId,
        tripCode: 'TRIP-70-01',
        busId,
        routeDirectionId,
        status: 'IN_TRANSIT',
        isActive: true
      })
    } as any);

    const busResult = await etaService.calculateBusEta(busId);
    expect(busResult).not.toBeNull();
    expect(busResult?.tripId).toBe(tripId.toString());
  });

  it('should return null when calculateBusEta cannot find an active trip', async () => {
    vi.spyOn(ScheduledTrip, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    const busResult = await etaService.calculateBusEta(busId);
    expect(busResult).toBeNull();
  });
});
