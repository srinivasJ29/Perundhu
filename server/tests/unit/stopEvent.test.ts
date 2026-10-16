import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import { StopEventService } from '../../src/modules/eta/stopEvent.service';
import { StopEvent } from '../../src/models/StopEvent';
import { LocationObservation } from '../../src/modules/location/location.types';
import { NextStopDetectionResult } from '../../src/modules/eta/eta.types';

describe('Stop Event Handling Service (Unit)', () => {
  let stopEventService: StopEventService;

  beforeEach(() => {
    vi.restoreAllMocks();
    stopEventService = new StopEventService({
      arrivalRadiusMeters: 50,
      departureRadiusMeters: 100,
      confirmationCount: 2
    });
  });

  const busId = new Types.ObjectId();
  const tripId = new Types.ObjectId();
  const stopId = new Types.ObjectId();

  function makeObs(
    trackingStatus: any = 'SIMULATED',
    recordedAt = new Date('2026-10-15T09:00:00Z')
  ): LocationObservation {
    return {
      busId,
      tripId,
      location: { type: 'Point', coordinates: [78.1145, 9.9175] },
      heading: 90,
      speedKmph: 0,
      accuracyMeters: 5,
      source: 'SIMULATOR',
      trackingStatus,
      recordedAt,
      receivedAt: recordedAt
    };
  }

  function makeDetection(
    status: any = 'ARRIVED',
    sequence = 1,
    isTerminalReached = false
  ): NextStopDetectionResult {
    return {
      tripId: tripId.toString(),
      tripCode: 'TRIP-70-01',
      busId: busId.toString(),
      status,
      currentStop: {
        id: stopId.toString(),
        code: 'STOP-01',
        nameEn: 'Periyar',
        nameTa: 'பெரியார்',
        sequence,
        location: [78.1145, 9.9175],
        distanceFromOriginMeters: 0
      },
      nextStop: {
        id: new Types.ObjectId().toString(),
        code: 'STOP-02',
        nameEn: 'Simmakkal',
        nameTa: 'சிம்மக்கல்',
        sequence: sequence + 1,
        location: [78.1189, 9.9252],
        distanceFromOriginMeters: 1200
      },
      remainingDistanceMeters: 1200,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 5000,
      progressRatio: 0,
      trackingStatus: 'SIMULATED',
      source: 'SIMULATOR',
      isTerminalReached,
      isCompleted: isTerminalReached,
      isCancelled: false,
      confidence: 0.9
    };
  }

  it('should NOT trigger ARRIVED event on a single noisy observation', async () => {
    vi.spyOn(StopEvent, 'findOneAndUpdate').mockResolvedValue({} as any);

    const obs1 = makeObs();
    const detection1 = makeDetection('ARRIVED', 1);

    // First observation: consecutive count = 1 (< confirmationCount 2)
    const event1 = await stopEventService.processStopEvents(obs1, detection1);
    expect(event1).toBeNull();
  });

  it('should confirm and record ARRIVED event after consecutive observations reach confirmation count', async () => {
    const recordSpy = vi.spyOn(stopEventService, 'recordEvent').mockResolvedValue(true);

    const obs1 = makeObs();
    const detection1 = makeDetection('ARRIVED', 1);

    // Sample 1
    const event1 = await stopEventService.processStopEvents(obs1, detection1);
    expect(event1).toBeNull();

    // Sample 2 (consecutive arrival observation)
    const event2 = await stopEventService.processStopEvents(obs1, detection1);
    expect(event2).toBe('ARRIVED');
    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ARRIVED',
        stopSequence: 1
      })
    );
  });

  it('should confirm DEPARTED event when vehicle status becomes DEPARTED after arrival', async () => {
    vi.spyOn(stopEventService, 'recordEvent').mockResolvedValue(true);

    const obs = makeObs();
    const arrivalDetection = makeDetection('ARRIVED', 1);

    // Arrive (2 samples)
    await stopEventService.processStopEvents(obs, arrivalDetection);
    await stopEventService.processStopEvents(obs, arrivalDetection);

    // Depart
    const departedDetection = makeDetection('DEPARTED', 1);
    const event = await stopEventService.processStopEvents(obs, departedDetection);

    expect(event).toBe('DEPARTED');
  });

  it('should trigger TERMINAL_REACHED event when terminal is reached', async () => {
    const recordSpy = vi.spyOn(stopEventService, 'recordEvent').mockResolvedValue(true);

    const obs = makeObs();
    const terminalDetection = makeDetection('TERMINAL_REACHED', 4, true);

    const event = await stopEventService.processStopEvents(obs, terminalDetection);

    expect(event).toBe('TERMINAL_REACHED');
    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'TERMINAL_REACHED',
        stopSequence: 4
      })
    );
  });

  it('should ignore stale or offline observations and not trigger arrivals', async () => {
    const recordSpy = vi.spyOn(stopEventService, 'recordEvent').mockResolvedValue(true);

    const staleObs = makeObs('STALE');
    const detection = makeDetection('ARRIVED', 1);

    const event = await stopEventService.processStopEvents(staleObs, detection);
    expect(event).toBeNull();
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it('should reset confirmation count when tripId changes', async () => {
    vi.spyOn(stopEventService, 'recordEvent').mockResolvedValue(true);

    const obs1 = makeObs();
    const detection1 = makeDetection('ARRIVED', 1);

    // Trip 1 sample 1
    await stopEventService.processStopEvents(obs1, detection1);

    // Switch to Trip 2
    const trip2Id = new Types.ObjectId();
    const obs2: LocationObservation = {
      ...obs1,
      tripId: trip2Id
    };
    const detection2: NextStopDetectionResult = {
      ...detection1,
      tripId: trip2Id.toString()
    };

    // First sample on Trip 2 should not trigger arrival (must start count from 1)
    const event = await stopEventService.processStopEvents(obs2, detection2);
    expect(event).toBeNull();
  });

  it('should handle idempotent duplicate writes (E11000) gracefully and log errors on unexpected failures', async () => {
    // Test already existing / upserted doc
    vi.spyOn(StopEvent, 'findOneAndUpdate').mockResolvedValueOnce({ _id: new Types.ObjectId() } as any);

    const inserted1 = await stopEventService.recordEvent({
      tripId: tripId.toString(),
      busId: busId.toString(),
      stopId: stopId.toString(),
      stopSequence: 1,
      eventType: 'ARRIVED',
      distanceToStopMeters: 0,
      recordedAt: new Date(),
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED'
    });
    expect(inserted1).toBe(true);

    // Test Mongo duplicate key error (code 11000) - handled idempotently
    const dupErr: any = new Error('E11000 duplicate key');
    dupErr.code = 11000;
    vi.spyOn(StopEvent, 'findOneAndUpdate').mockRejectedValueOnce(dupErr);

    const inserted2 = await stopEventService.recordEvent({
      tripId: tripId.toString(),
      busId: busId.toString(),
      stopId: stopId.toString(),
      stopSequence: 1,
      eventType: 'ARRIVED',
      distanceToStopMeters: 0,
      recordedAt: new Date(),
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED'
    });
    expect(inserted2).toBe(true);

    // Test unexpected database failure
    vi.spyOn(StopEvent, 'findOneAndUpdate').mockRejectedValueOnce(new Error('Database disconnected'));
    const failed = await stopEventService.recordEvent({
      tripId: tripId.toString(),
      busId: busId.toString(),
      stopId: stopId.toString(),
      stopSequence: 1,
      eventType: 'ARRIVED',
      distanceToStopMeters: 0,
      recordedAt: new Date(),
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED'
    });
    expect(failed).toBe(false);
  });
});
