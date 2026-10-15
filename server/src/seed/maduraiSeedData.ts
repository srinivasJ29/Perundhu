/**
 * TNSTC Live Tracking — Madurai Pilot Demonstration Dataset
 *
 * NOTE ON DATA FIDELITY:
 * The geographic coordinates for Madurai bus stands (Mattuthavani, Periyar, Arappalayam,
 * Palanganatham) and major intersections (Goripalayam, Simmakkal, Thirunagar, Thirumangalam)
 * reflect real-world surveyed locations in Madurai, Tamil Nadu.
 *
 * Specific bus fleet registration numbers, timetable departure times, and intermediate
 * timing estimates are fictional demonstration records calibrated for testing and demo flows.
 * They MUST NOT be cited or presented to passengers as official TNSTC operational timetables.
 */

export interface SeedDistrict {
  code: string;
  nameEn: string;
  nameTa: string;
  headquarters: string;
}

export interface SeedBusStand {
  districtCode: string;
  code: string;
  nameEn: string;
  nameTa: string;
  coordinates: [number, number]; // [lng, lat]
  standType: 'INTERCITY_TERMINAL' | 'MOFUSSIL' | 'TOWN_STAND';
  totalPlatforms: number;
}

export interface SeedStop {
  districtCode: string;
  busStandCode?: string;
  code: string;
  nameEn: string;
  nameTa: string;
  coordinates: [number, number]; // [lng, lat]
  landmark?: string;
}

export interface SeedRoute {
  districtCode: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: 'TOWN_SERVICE' | 'MOFUSSIL' | 'EXPRESS';
}

export interface SeedDirection {
  routeNumber: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  originStandCode?: string;
  destinationStandCode?: string;
  originStopCode: string;
  destinationStopCode: string;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  coordinates: [number, number][]; // GeoJSON LineString coordinates
}

export interface SeedStopSequence {
  routeNumber: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  stopCode: string;
  sequenceOrder: number;
  distanceFromOriginKm: number;
  cumulativeDurationMinutes: number;
  isFareStage: boolean;
}

export interface SeedBus {
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE';
  status: 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';
}

export interface SeedTrip {
  tripCode: string;
  routeNumber: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  busRegistrationNumber?: string;
  departureTime: string;
  arrivalTime: string;
  operationalDays: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
}

export interface SeedTripStopTime {
  tripCode: string;
  stopCode: string;
  stopSequence: number;
  scheduledArrivalTime: string;
  scheduledDepartureTime: string;
}

// -----------------------------------------------------------------------------
// 1. Districts
// -----------------------------------------------------------------------------
export const seedDistricts: SeedDistrict[] = [
  {
    code: 'MDU',
    nameEn: 'Madurai',
    nameTa: 'மதுரை',
    headquarters: 'Madurai'
  }
];

// -----------------------------------------------------------------------------
// 2. Bus Stands
// -----------------------------------------------------------------------------
export const seedBusStands: SeedBusStand[] = [
  {
    districtCode: 'MDU',
    code: 'MDU-MGR',
    nameEn: 'Mattuthavani (M.G.R. Integrated Bus Stand)',
    nameTa: 'மாட்டுத்தாவணி (எம்.ஜி.ஆர் பேருந்து நிலையம்)',
    coordinates: [78.1633, 9.9472],
    standType: 'INTERCITY_TERMINAL',
    totalPlatforms: 8
  },
  {
    districtCode: 'MDU',
    code: 'MDU-PERIYAR',
    nameEn: 'Periyar Bus Stand',
    nameTa: 'பெரியார் பேருந்து நிலையம்',
    coordinates: [78.1132, 9.9168],
    standType: 'TOWN_STAND',
    totalPlatforms: 5
  },
  {
    districtCode: 'MDU',
    code: 'MDU-ARAPPALAYAM',
    nameEn: 'Arappalayam Bus Stand',
    nameTa: 'ஆரப்பாளையம் பேருந்து நிலையம்',
    coordinates: [78.1064, 9.9329],
    standType: 'MOFUSSIL',
    totalPlatforms: 4
  },
  {
    districtCode: 'MDU',
    code: 'MDU-PALANGANATHAM',
    nameEn: 'Palanganatham Bus Stand',
    nameTa: 'பழங்காநத்தம் பேருந்து நிலையம்',
    coordinates: [78.1011, 9.9022],
    standType: 'TOWN_STAND',
    totalPlatforms: 3
  }
];

// -----------------------------------------------------------------------------
// 3. Stops
// -----------------------------------------------------------------------------
export const seedStops: SeedStop[] = [
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-MGR',
    code: 'STP-MDU-MGR',
    nameEn: 'Mattuthavani Terminal',
    nameTa: 'மாட்டுத்தாவணி முனையம்',
    coordinates: [78.1633, 9.9472],
    landmark: 'Platform Bay 1-4'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-KKN',
    nameEn: 'K.K. Nagar Arch',
    nameTa: 'கே.கே. நகர் வளைவு',
    coordinates: [78.1518, 9.9388],
    landmark: 'Opposite District Court Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-APO',
    nameEn: 'Apollo Hospital',
    nameTa: 'அப்பல்லோ மருத்துவமனை',
    coordinates: [78.1465, 9.936],
    landmark: 'Lake View Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-ANN',
    nameEn: 'Anna Bus Stand',
    nameTa: 'அண்ணா பேருந்து நிலையம்',
    coordinates: [78.1388, 9.9315],
    landmark: 'Near Gandhi Memorial Museum turn'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-GOR',
    nameEn: 'Goripalayam Junction',
    nameTa: 'கோரிப்பாளையம் சந்திப்பு',
    coordinates: [78.1322, 9.9288],
    landmark: 'Near American College'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-SIM',
    nameEn: 'Simmakkal',
    nameTa: 'சிம்மக்கல்',
    coordinates: [78.125, 9.9248],
    landmark: 'Vaigai River South Bank'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-PERIYAR',
    code: 'STP-MDU-PER',
    nameEn: 'Periyar Bus Stand',
    nameTa: 'பெரியார் பேருந்து நிலையம்',
    coordinates: [78.1132, 9.9168],
    landmark: 'Near Madurai Railway Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-MDC',
    nameEn: 'Madura College',
    nameTa: 'மதுரா கல்லூரி',
    coordinates: [78.1065, 9.911],
    landmark: 'TPK Main Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-VSN',
    nameEn: 'Vasantha Nagar',
    nameTa: 'வசந்த நகர்',
    coordinates: [78.102, 9.9065],
    landmark: 'Andalpuram Overbridge'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-PALANGANATHAM',
    code: 'STP-MDU-PAL',
    nameEn: 'Palanganatham Junction',
    nameTa: 'பழங்காநத்தம் சந்திப்பு',
    coordinates: [78.1011, 9.9022],
    landmark: 'Roundabout'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-PYK',
    nameEn: 'Pykara',
    nameTa: 'பைக்காரா',
    coordinates: [78.089, 9.889],
    landmark: 'NH-44 Bypass Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TRN',
    nameEn: 'Thirunagar',
    nameTa: 'திருநகர்',
    coordinates: [78.0645, 9.871],
    landmark: 'Bus Stop 3rd Stop'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-KAP',
    nameEn: 'Kappalur Industrial Estate',
    nameTa: 'கப்பலூர் தொழிற்பேட்டை',
    coordinates: [78.032, 9.845],
    landmark: 'Toll Plaza Approach'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TMG',
    nameEn: 'Thirumangalam Bus Stand',
    nameTa: 'திருமங்கலம் பேருந்து நிலையம்',
    coordinates: [78.0011, 9.8244],
    landmark: 'Terminus'
  }
];

// -----------------------------------------------------------------------------
// 4. Routes
// -----------------------------------------------------------------------------
export const seedRoutes: SeedRoute[] = [
  {
    districtCode: 'MDU',
    routeNumber: '77',
    displayTitleEn: 'Mattuthavani to Thirumangalam',
    displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
    serviceCategory: 'TOWN_SERVICE'
  },
  {
    districtCode: 'MDU',
    routeNumber: '70',
    displayTitleEn: 'Mattuthavani to Periyar Bus Stand',
    displayTitleTa: 'மாட்டுத்தாவணி - பெரியார்',
    serviceCategory: 'TOWN_SERVICE'
  }
];

// Helper: Coordinates list for Route 77
const r77Coordinates: [number, number][] = [
  [78.1633, 9.9472], // Mattuthavani
  [78.1518, 9.9388], // KK Nagar
  [78.1465, 9.936],  // Apollo
  [78.1388, 9.9315], // Anna Stand
  [78.1322, 9.9288], // Goripalayam
  [78.125, 9.9248],  // Simmakkal
  [78.1132, 9.9168], // Periyar
  [78.1065, 9.911],  // Madura College
  [78.102, 9.9065],  // Vasantha Nagar
  [78.1011, 9.9022], // Palanganatham
  [78.089, 9.889],   // Pykara
  [78.0645, 9.871],  // Thirunagar
  [78.032, 9.845],   // Kappalur
  [78.0011, 9.8244]  // Thirumangalam
];

// Helper: Coordinates list for Route 70 (Direct trunk)
const r70Coordinates: [number, number][] = [
  [78.1633, 9.9472], // Mattuthavani
  [78.1518, 9.9388], // KK Nagar
  [78.1465, 9.936],  // Apollo
  [78.1388, 9.9315], // Anna Stand
  [78.1322, 9.9288], // Goripalayam
  [78.125, 9.9248],  // Simmakkal
  [78.1132, 9.9168]  // Periyar
];

// -----------------------------------------------------------------------------
// 5. Route Directions
// -----------------------------------------------------------------------------
export const seedDirections: SeedDirection[] = [
  // Route 77 OUTBOUND
  {
    routeNumber: '77',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-MGR',
    destinationStandCode: 'MDU-PALANGANATHAM',
    originStopCode: 'STP-MDU-MGR',
    destinationStopCode: 'STP-MDU-TMG',
    totalDistanceKm: 22.8,
    estimatedDurationMins: 55,
    coordinates: r77Coordinates
  },
  // Route 77 INBOUND (Reversed)
  {
    routeNumber: '77',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-PALANGANATHAM',
    destinationStandCode: 'MDU-MGR',
    originStopCode: 'STP-MDU-TMG',
    destinationStopCode: 'STP-MDU-MGR',
    totalDistanceKm: 22.8,
    estimatedDurationMins: 55,
    coordinates: [...r77Coordinates].reverse()
  },
  // Route 70 OUTBOUND
  {
    routeNumber: '70',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-MGR',
    destinationStandCode: 'MDU-PERIYAR',
    originStopCode: 'STP-MDU-MGR',
    destinationStopCode: 'STP-MDU-PER',
    totalDistanceKm: 7.6,
    estimatedDurationMins: 24,
    coordinates: r70Coordinates
  },
  // Route 70 INBOUND (Reversed)
  {
    routeNumber: '70',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-PERIYAR',
    destinationStandCode: 'MDU-MGR',
    originStopCode: 'STP-MDU-PER',
    destinationStopCode: 'STP-MDU-MGR',
    totalDistanceKm: 7.6,
    estimatedDurationMins: 24,
    coordinates: [...r70Coordinates].reverse()
  }
];

// -----------------------------------------------------------------------------
// 6. Route Stop Sequences
// -----------------------------------------------------------------------------
const r77StopsOutbound = [
  { code: 'STP-MDU-MGR', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-KKN', km: 1.5, mins: 4, fare: false },
  { code: 'STP-MDU-APO', km: 2.3, mins: 6, fare: false },
  { code: 'STP-MDU-ANN', km: 3.4, mins: 9, fare: true },
  { code: 'STP-MDU-GOR', km: 4.5, mins: 12, fare: true },
  { code: 'STP-MDU-SIM', km: 5.7, mins: 16, fare: false },
  { code: 'STP-MDU-PER', km: 7.6, mins: 22, fare: true },
  { code: 'STP-MDU-MDC', km: 8.8, mins: 25, fare: false },
  { code: 'STP-MDU-VSN', km: 9.7, mins: 28, fare: false },
  { code: 'STP-MDU-PAL', km: 10.6, mins: 31, fare: true },
  { code: 'STP-MDU-PYK', km: 12.8, mins: 36, fare: false },
  { code: 'STP-MDU-TRN', km: 16.2, mins: 43, fare: true },
  { code: 'STP-MDU-KAP', km: 19.5, mins: 49, fare: false },
  { code: 'STP-MDU-TMG', km: 22.8, mins: 55, fare: true }
];

export const seedStopSequences: SeedStopSequence[] = [
  // Route 77 Outbound
  ...r77StopsOutbound.map((item, idx) => ({
    routeNumber: '77',
    directionCode: 'OUTBOUND' as const,
    stopCode: item.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: item.km,
    cumulativeDurationMinutes: item.mins,
    isFareStage: item.fare
  })),

  // Route 77 Inbound (Reversed milestones)
  ...[...r77StopsOutbound].reverse().map((item, idx) => ({
    routeNumber: '77',
    directionCode: 'INBOUND' as const,
    stopCode: item.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: Number((22.8 - item.km).toFixed(1)),
    cumulativeDurationMinutes: Number((55 - item.mins).toFixed(0)),
    isFareStage: item.fare
  })),

  // Route 70 Outbound (First 7 stops)
  ...r77StopsOutbound.slice(0, 7).map((item, idx) => ({
    routeNumber: '70',
    directionCode: 'OUTBOUND' as const,
    stopCode: item.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: item.km,
    cumulativeDurationMinutes: item.mins,
    isFareStage: item.fare
  })),

  // Route 70 Inbound (Reversed)
  ...[...r77StopsOutbound.slice(0, 7)].reverse().map((item, idx) => ({
    routeNumber: '70',
    directionCode: 'INBOUND' as const,
    stopCode: item.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: Number((7.6 - item.km).toFixed(1)),
    cumulativeDurationMinutes: Number((22 - item.mins).toFixed(0)),
    isFareStage: item.fare
  }))
];

// -----------------------------------------------------------------------------
// 7. Buses (Fleet Assets)
// -----------------------------------------------------------------------------
export const seedBuses: SeedBus[] = [
  {
    registrationNumber: 'TN-58-N-2144',
    fleetNumber: 'MDU-MGR-084',
    depotName: 'Madurai Central Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2311',
    fleetNumber: 'MDU-MGR-092',
    depotName: 'Madurai Central Depot',
    vehicleType: 'DELUXE',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-1980',
    fleetNumber: 'MDU-PRY-045',
    depotName: 'Periyar Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'IN_SERVICE'
  }
];

// -----------------------------------------------------------------------------
// 8. Scheduled Trips & Timetable
// -----------------------------------------------------------------------------
export const seedTrips: SeedTrip[] = [
  {
    tripCode: 'TRIP-77-OUT-0830',
    routeNumber: '77',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2144',
    departureTime: '08:30',
    arrivalTime: '09:25',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-77-IN-0945',
    routeNumber: '77',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2144',
    departureTime: '09:45',
    arrivalTime: '10:40',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-70-OUT-0800',
    routeNumber: '70',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-1980',
    departureTime: '08:00',
    arrivalTime: '08:24',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-70-IN-0845',
    routeNumber: '70',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-1980',
    departureTime: '08:45',
    arrivalTime: '09:09',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  }
];

// Helper to calculate interpolated HH:mm times
function addMinutesToHHMM(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + minutes;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// 9. Trip Stop Times
// -----------------------------------------------------------------------------
export const seedTripStopTimes: SeedTripStopTime[] = [
  // Stops for TRIP-77-OUT-0830
  ...r77StopsOutbound.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:30', item.mins);
    const depTime = idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1);
    return {
      tripCode: 'TRIP-77-OUT-0830',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: depTime
    };
  }),

  // Stops for TRIP-70-OUT-0800
  ...r77StopsOutbound.slice(0, 7).map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:00', item.mins);
    const depTime = idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1);
    return {
      tripCode: 'TRIP-70-OUT-0800',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: depTime
    };
  })
];
