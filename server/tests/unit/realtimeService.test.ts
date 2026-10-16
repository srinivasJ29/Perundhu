import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { Server } from 'socket.io';
import { RealtimeTrackingService } from '../../src/modules/realtime/realtime.service';
import { RealtimeEvents } from '../../src/modules/realtime/realtime.types';
import { PipelineProcessingResult, LocationObservation } from '../../src/modules/location/location.types';

describe('Real-Time Tracking Service (Unit)', () => {
  let mockIo: any;
  let mockRoomBroadcaster: any;
  let service: RealtimeTrackingService;
  let mockNextStopService: any;
  let mockEtaService: any;
  let mockStopEventService: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockRoomBroadcaster = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };

    mockIo = {
      to: vi.fn().mockReturnValue(mockRoomBroadcaster),
      engine: { clientsCount: 5 }
    };

    mockNextStopService = {
      detectNextStopForTrip: vi.fn().mockResolvedValue(null)
    };

    mockEtaService = {
      calculateTripEta: vi.fn().mockResolvedValue(null)
    };

    mockStopEventService = {
      processStopEvents: vi.fn().mockResolvedValue(null)
    };

    service = new RealtimeTrackingService(
      mockNextStopService,
      mockEtaService,
      mockStopEventService
    );
    service.attachServer(mockIo as unknown as Server);
  });

  function createMockObservation(overrides?: Partial<LocationObservation>): LocationObservation {
    return {
      busId: new Types.ObjectId(),
      tripId: new Types.ObjectId(),
      routeId: new Types.ObjectId(),
      directionId: new Types.ObjectId(),
      location: { type: 'Point', coordinates: [78.1158, 9.9178] },
      heading: 90,
      speedKmph: 40,
      accuracyMeters: 5,
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED',
      validationStatus: 'VALID',
      recordedAt: new Date(),
      receivedAt: new Date(),
      progressRatio: 0.25,
      distanceAlongRouteMeters: 2500,
      totalRouteDistanceMeters: 10000,
      ...overrides
    };
  }

  function createPipelineResult(
    accepted = true,
    persistedLatest = true,
    obsOverrides?: Partial<LocationObservation>
  ): PipelineProcessingResult {
    const observation = createMockObservation(obsOverrides);
    return {
      accepted,
      observation,
      validationResult: {
        isValid: accepted,
        status: accepted ? 'VALID' : 'REJECTED',
        errors: accepted ? [] : ['Validation failed'],
        warnings: []
      },
      freshness: { classification: 'FRESH', ageMs: 100 },
      persistedLatest,
      persistedHistory: false
    };
  }

  it('should not broadcast if server is not attached', async () => {
    service.detachServer();
    const result = createPipelineResult(true, true);
    const broadcasted = await service.broadcastAcceptedObservation(result);
    expect(broadcasted).toBe(false);
    expect(mockIo.to).not.toHaveBeenCalled();
  });

  it('should NOT broadcast if observation was not accepted or not persisted', async () => {
    const rejectedResult = createPipelineResult(false, false);
    const broadcasted = await service.broadcastAcceptedObservation(rejectedResult);

    expect(broadcasted).toBe(false);
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(mockRoomBroadcaster.emit).not.toHaveBeenCalled();
  });

  it('should broadcast accepted observation to bus and route rooms', async () => {
    const busId = new Types.ObjectId();
    const routeId = new Types.ObjectId();
    const result = createPipelineResult(true, true, { busId, routeId });

    const broadcasted = await service.broadcastAcceptedObservation(result);

    expect(broadcasted).toBe(true);
    expect(mockIo.to).toHaveBeenCalledWith(`bus:${busId.toString()}`);
    expect(mockRoomBroadcaster.to).toHaveBeenCalledWith(`route:${routeId.toString()}`);
    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_POSITION,
      expect.objectContaining({
        busId: busId.toString(),
        routeId: routeId.toString(),
        speedKmph: 40,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR'
      })
    );
  });

  it('should enforce truthful labeling: SIMULATOR source is NEVER labeled LIVE', async () => {
    const busId = new Types.ObjectId();
    // Simulate an observation with 'LIVE' trackingStatus erroneously passed with SIMULATOR source
    const result = createPipelineResult(true, true, {
      busId,
      source: 'SIMULATOR',
      trackingStatus: 'LIVE' as any
    });

    await service.broadcastAcceptedObservation(result);

    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_POSITION,
      expect.objectContaining({
        source: 'SIMULATOR',
        trackingStatus: 'SIMULATED' // Automatically corrected to truthful SIMULATED status
      })
    );
  });

  it('should suppress duplicate unchanged observations within deduplication interval', async () => {
    const busId = new Types.ObjectId();
    const result1 = createPipelineResult(true, true, { busId });
    const result2 = createPipelineResult(true, true, { busId }); // Same coordinates & speed

    const first = await service.broadcastAcceptedObservation(result1);
    expect(first).toBe(true);
    expect(mockRoomBroadcaster.emit).toHaveBeenCalledTimes(1);

    // Immediate second identical emission
    const second = await service.broadcastAcceptedObservation(result2);
    expect(second).toBe(false);
    // Should NOT have emitted a second time
    expect(mockRoomBroadcaster.emit).toHaveBeenCalledTimes(1);
  });

  it('should broadcast if position moves significantly despite short time interval', async () => {
    const busId = new Types.ObjectId();
    const result1 = createPipelineResult(true, true, {
      busId,
      location: { type: 'Point', coordinates: [78.1158, 9.9178] }
    });
    // Move ~100m north
    const result2 = createPipelineResult(true, true, {
      busId,
      location: { type: 'Point', coordinates: [78.1158, 9.9188] }
    });

    const first = await service.broadcastAcceptedObservation(result1);
    expect(first).toBe(true);

    const second = await service.broadcastAcceptedObservation(result2);
    expect(second).toBe(true);
    expect(mockRoomBroadcaster.emit).toHaveBeenCalledTimes(2);
  });

  it('should emit bus:status when trackingStatus changes', async () => {
    const busId = new Types.ObjectId();
    const result1 = createPipelineResult(true, true, {
      busId,
      trackingStatus: 'SIMULATED'
    });
    const result2 = createPipelineResult(true, true, {
      busId,
      trackingStatus: 'DEVIATED'
    });

    await service.broadcastAcceptedObservation(result1);
    await service.broadcastAcceptedObservation(result2);

    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_STATUS,
      expect.objectContaining({
        busId: busId.toString(),
        previousStatus: 'SIMULATED',
        currentStatus: 'DEVIATED'
      })
    );
  });

  it('should evaluate and emit next-stop and ETA events when trip is assigned', async () => {
    const busId = new Types.ObjectId();
    const tripId = new Types.ObjectId();
    const routeId = new Types.ObjectId();

    mockNextStopService.detectNextStopForTrip.mockResolvedValue({
      tripId: tripId.toString(),
      status: 'APPROACHING',
      nextStop: {
        id: 'stop-123',
        code: 'STP01',
        nameEn: 'Periyar Bus Stand',
        nameTa: 'பெரியார் பேருந்து நிலையம்',
        sequence: 1,
        distanceFromOriginMeters: 500
      }
    });

    mockEtaService.calculateTripEta.mockResolvedValue({
      tripId: tripId.toString(),
      tripCode: 'TRIP-01',
      routeId: routeId.toString(),
      isRealTimePrediction: false,
      predictionSource: 'SIMULATED_MOVEMENT',
      generatedAt: new Date().toISOString(),
      downstreamStops: [
        {
          stopId: 'stop-123',
          stopCode: 'STP01',
          stopNameEn: 'Periyar Bus Stand',
          stopNameTa: 'பெரியார் பேருந்து நிலையம்',
          stopSequence: 1,
          estimatedArrivalAt: new Date().toISOString(),
          etaMinutes: 5,
          remainingDistanceMeters: 1200,
          effectiveSpeedKmph: 30
        }
      ]
    });

    mockStopEventService.processStopEvents.mockResolvedValue('ARRIVAL');

    const result = createPipelineResult(true, true, { busId, tripId, routeId });
    await service.broadcastAcceptedObservation(result);

    // Allow async evaluations to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_NEXT_STOP,
      expect.objectContaining({
        busId: busId.toString(),
        tripId: tripId.toString(),
        nextStop: expect.objectContaining({
          id: 'stop-123',
          code: 'STP01'
        })
      })
    );

    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_STOP_EVENT,
      expect.objectContaining({
        busId: busId.toString(),
        eventType: 'ARRIVAL'
      })
    );

    expect(mockRoomBroadcaster.emit).toHaveBeenCalledWith(
      RealtimeEvents.BUS_ETA,
      expect.objectContaining({
        busId: busId.toString(),
        tripId: tripId.toString(),
        isRealTimePrediction: false,
        predictionSource: 'SIMULATED_MOVEMENT'
      })
    );
  });
});
