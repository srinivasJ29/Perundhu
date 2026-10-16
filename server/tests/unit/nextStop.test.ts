import { describe, it, expect, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { NextStopService } from '../../src/modules/eta/nextStop.service';
import { EnrichedStopItem } from '../../src/modules/eta/eta.types';

describe('Next-Stop Detection Service (Unit)', () => {
  let nextStopService: NextStopService;

  beforeEach(() => {
    nextStopService = new NextStopService({
      arrivalRadiusMeters: 50,
      departureRadiusMeters: 100
    });
  });

  // Sample 4-stop ordered sequence along Madurai pilot corridor:
  // Stop 1: Periyar (0m)
  // Stop 2: Simmakkal (1200m)
  // Stop 3: Goripalayam (2400m)
  // Stop 4: Mattuthavani (5000m - Terminal)
  function createSampleStops(): EnrichedStopItem[] {
    return [
      {
        id: new Types.ObjectId().toString(),
        code: 'MDU-STOP-001',
        nameEn: 'Periyar Bus Stand',
        nameTa: 'பெரியார் பேருந்து நிலையம்',
        sequence: 1,
        location: [78.1145, 9.9175],
        distanceFromOriginMeters: 0,
        scheduledArrival: '09:00',
        scheduledDeparture: '09:02'
      },
      {
        id: new Types.ObjectId().toString(),
        code: 'MDU-STOP-002',
        nameEn: 'Simmakkal',
        nameTa: 'சிம்மக்கல்',
        sequence: 2,
        location: [78.1189, 9.9252],
        distanceFromOriginMeters: 1200,
        scheduledArrival: '09:08',
        scheduledDeparture: '09:09'
      },
      {
        id: new Types.ObjectId().toString(),
        code: 'MDU-STOP-003',
        nameEn: 'Goripalayam',
        nameTa: 'கோரிப்பாளையம்',
        sequence: 3,
        location: [78.1250, 9.9320],
        distanceFromOriginMeters: 2400,
        scheduledArrival: '09:16',
        scheduledDeparture: '09:17'
      },
      {
        id: new Types.ObjectId().toString(),
        code: 'MDU-STOP-004',
        nameEn: 'Mattuthavani Integrated Bus Terminus',
        nameTa: 'மாட்டுத்தாவணி பேருந்து நிலையம்',
        sequence: 4,
        location: [78.1520, 9.9480],
        distanceFromOriginMeters: 5000,
        scheduledArrival: '09:35',
        scheduledDeparture: '09:40'
      }
    ];
  }

  it('should detect Stop 1 as next stop when bus is before the first stop', () => {
    const stops = createSampleStops();
    const tripId = new Types.ObjectId().toString();

    // Bus is 150m before origin (distance: -150m, outside 50m arrival radius)
    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-70-OUT-01',
      undefined,
      stops,
      [78.1130, 9.9160],
      -150,
      5000,
      20
    );

    expect(result.status).toBe('APPROACHING');
    expect(result.nextStop?.sequence).toBe(1);
    expect(result.nextStop?.code).toBe('MDU-STOP-001');
    expect(result.remainingDistanceMeters).toBe(150);
    expect(result.isTerminalReached).toBe(false);
  });

  it('should detect bus ARRIVED at Stop 1 when within arrival radius (0m - 50m)', () => {
    const stops = createSampleStops();
    const tripId = new Types.ObjectId().toString();

    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-70-OUT-01',
      undefined,
      stops,
      [78.1145, 9.9175],
      15, // 15m from Stop 1 (within 50m radius)
      5000,
      0
    );

    expect(result.status).toBe('ARRIVED');
    expect(result.currentStop?.sequence).toBe(1);
    expect(result.nextStop?.sequence).toBe(2);
    expect(result.remainingDistanceMeters).toBe(1185); // 1200 - 15
  });

  it('should detect DEPARTED status when bus moves past Stop 1 within departure radius', () => {
    const stops = createSampleStops();
    const tripId = new Types.ObjectId().toString();

    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-70-OUT-01',
      undefined,
      stops,
      [78.1150, 9.9180],
      65, // 65m along route (departed Stop 1, < 100m departure radius, with speed)
      5000,
      25
    );

    expect(result.status).toBe('DEPARTED');
    expect(result.currentStop?.sequence).toBe(1);
    expect(result.nextStop?.sequence).toBe(2);
  });

  it('should detect APPROACHING status for Stop 2 when bus is midway between Stop 1 and Stop 2', () => {
    const stops = createSampleStops();
    const tripId = new Types.ObjectId().toString();

    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-70-OUT-01',
      undefined,
      stops,
      [78.1165, 9.9210],
      600, // 600m along route
      5000,
      35
    );

    expect(result.status).toBe('APPROACHING');
    expect(result.nextStop?.sequence).toBe(2);
    expect(result.nextStop?.code).toBe('MDU-STOP-002');
    expect(result.remainingDistanceMeters).toBe(600); // 1200 - 600
  });

  it('should detect TERMINAL_REACHED when bus reaches destination terminal', () => {
    const stops = createSampleStops();
    const tripId = new Types.ObjectId().toString();

    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-70-OUT-01',
      undefined,
      stops,
      [78.1520, 9.9480],
      4980, // Within 50m of Mattuthavani 5000m terminal
      5000,
      5
    );

    expect(result.status).toBe('TERMINAL_REACHED');
    expect(result.isTerminalReached).toBe(true);
    expect(result.currentStop?.sequence).toBe(4);
    expect(result.remainingDistanceMeters).toBe(0);
  });

  it('should handle repeated stops correctly on circular or complex routes', () => {
    const repeatedStopId = new Types.ObjectId().toString();
    const circularStops: EnrichedStopItem[] = [
      {
        id: repeatedStopId, // Same physical stop visited twice
        code: 'PERIYAR',
        nameEn: 'Periyar',
        nameTa: 'பெரியார்',
        sequence: 1,
        location: [78.1145, 9.9175],
        distanceFromOriginMeters: 0
      },
      {
        id: new Types.ObjectId().toString(),
        code: 'RAILWAY',
        nameEn: 'Railway Junction',
        nameTa: 'ரயில் நிலையம்',
        sequence: 2,
        location: [78.1120, 9.9190],
        distanceFromOriginMeters: 800
      },
      {
        id: new Types.ObjectId().toString(),
        code: 'TOWN_HALL',
        nameEn: 'Town Hall Road',
        nameTa: 'டவுன் ஹால் ரோடு',
        sequence: 3,
        location: [78.1160, 9.9210],
        distanceFromOriginMeters: 1800
      },
      {
        id: repeatedStopId, // Second visit to Periyar
        code: 'PERIYAR',
        nameEn: 'Periyar (Return Terminus)',
        nameTa: 'பெரியார் (திரும்புதல்)',
        sequence: 4,
        location: [78.1145, 9.9175],
        distanceFromOriginMeters: 3000
      }
    ];

    const tripId = new Types.ObjectId().toString();

    // Bus on return leg at 2200m
    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-CIRCULAR',
      undefined,
      circularStops,
      [78.1155, 9.9200],
      2200,
      3000,
      30
    );

    // Next stop should be sequence 4 (the return visit to Periyar), not sequence 1
    expect(result.nextStop?.sequence).toBe(4);
    expect(result.remainingDistanceMeters).toBe(800); // 3000 - 2200
  });

  it('should handle single stop or empty list gracefully', () => {
    const emptyStops: EnrichedStopItem[] = [];
    const tripId = new Types.ObjectId().toString();

    const result = nextStopService.evaluateNextStopFromProgress(
      tripId,
      'TRIP-EMPTY',
      undefined,
      emptyStops,
      [78.0, 9.0],
      0,
      0,
      0
    );

    expect(result.status).toBe('TERMINAL_REACHED');
  });
});
