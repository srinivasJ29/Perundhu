/**
 * TNSTC Live Tracking — Madurai City Bus Network Dataset
 *
 * Ground-truth surveyed locations in Madurai, Tamil Nadu connecting major hubs:
 * Mattuthavani (MIBT), Periyar Bus Stand, Arappalayam, Palanganatham,
 * Thirunagar, Thirumangalam, Teppakulam, Alagarkoil, and Madurai Airport.
 */

import rawRoadPolylines from './maduraiRoadPolylines.json';

interface RoadPolylineItem {
  distanceKm: number;
  durationMins: number;
  coordinates: [number, number][];
}

const roadPolylines = rawRoadPolylines as unknown as Record<string, RoadPolylineItem>;

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
  },
  {
    districtCode: 'MDU',
    code: 'MDU-ALANGANALLUR',
    nameEn: 'Alanganallur Bus Stand',
    nameTa: 'அலங்காநல்லூர் பேருந்து நிலையம்',
    coordinates: [78.0945, 10.0435],
    standType: 'TOWN_STAND',
    totalPlatforms: 2
  },
  {
    districtCode: 'MDU',
    code: 'MDU-TMG',
    nameEn: 'Thirumangalam Bus Stand',
    nameTa: 'திருமங்கலம் பேருந்து நிலையம்',
    coordinates: [78.0011, 9.8244],
    standType: 'MOFUSSIL',
    totalPlatforms: 4
  },
  {
    districtCode: 'MDU',
    code: 'MDU-AIRPORT',
    nameEn: 'Madurai Airport Terminal',
    nameTa: 'மதுரை விமான நிலைய முனையம்',
    coordinates: [78.0933, 9.8345],
    standType: 'TOWN_STAND',
    totalPlatforms: 2
  },
  {
    districtCode: 'MDU',
    code: 'MDU-ALAGARKOIL',
    nameEn: 'Alagarkoil Bus Stand',
    nameTa: 'அழகர்கோவில் பேருந்து நிலையம்',
    coordinates: [78.2138, 10.0747],
    standType: 'TOWN_STAND',
    totalPlatforms: 2
  },
  {
    districtCode: 'MDU',
    code: 'MDU-ANUPPANADI',
    nameEn: 'Anuppanadi Bus Stand',
    nameTa: 'அனுப்பானடி பேருந்து நிலையம்',
    coordinates: [78.1565, 9.9085],
    standType: 'TOWN_STAND',
    totalPlatforms: 2
  }
];

// -----------------------------------------------------------------------------
// 3. Stops
// -----------------------------------------------------------------------------
export const seedStops: SeedStop[] = [
  // Mattuthavani & North East Corridor
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
    coordinates: [78.1465, 9.9360],
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
    coordinates: [78.1250, 9.9248],
    landmark: 'Vaigai River South Bank'
  },

  // Central City & Periyar Corridor
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
    coordinates: [78.1065, 9.9110],
    landmark: 'TPK Main Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-VSN',
    nameEn: 'Vasantha Nagar',
    nameTa: 'வசந்த நகர்',
    coordinates: [78.1020, 9.9065],
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

  // South / Thirumangalam Corridor
  {
    districtCode: 'MDU',
    code: 'STP-MDU-PYK',
    nameEn: 'Pykara',
    nameTa: 'பைக்காரா',
    coordinates: [78.0890, 9.8890],
    landmark: 'NH-44 Bypass Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TPK',
    nameEn: 'Thiruparankundram Temple',
    nameTa: 'திருப்பரங்குன்றம் முருகன் கோவில்',
    coordinates: [78.0712, 9.8785],
    landmark: 'Subramaniya Swamy Temple Car Street'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TRN',
    nameEn: 'Thirunagar',
    nameTa: 'திருநகர்',
    coordinates: [78.0645, 9.8710],
    landmark: 'Bus Stop 3rd Stop'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-KAP',
    nameEn: 'Kappalur Industrial Estate',
    nameTa: 'கப்பலூர் தொழிற்பேட்டை',
    coordinates: [78.0320, 9.8450],
    landmark: 'Toll Plaza Approach'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-TMG',
    code: 'STP-MDU-TMG',
    nameEn: 'Thirumangalam Bus Stand',
    nameTa: 'திருமங்கலம் பேருந்து நிலையம்',
    coordinates: [78.0011, 9.8244],
    landmark: 'Terminus'
  },

  // West & Arappalayam Corridor
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-ARAPPALAYAM',
    code: 'STP-MDU-ARP',
    nameEn: 'Arappalayam Bus Stand',
    nameTa: 'ஆரப்பாளையம் பேருந்து நிலையம்',
    coordinates: [78.1064, 9.9329],
    landmark: 'Mofussil Terminal Bays'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-ARS',
    nameEn: 'Arasaradi Junction',
    nameTa: 'அரசரடி சந்திப்பு',
    coordinates: [78.1015, 9.9245],
    landmark: 'Near Railway Colony'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-KAL',
    nameEn: 'Kalavasal',
    nameTa: 'காலவாசல்',
    coordinates: [78.0967, 9.9288],
    landmark: 'Theni Road Bypass Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-GUR',
    nameEn: 'Guru Theatre',
    nameTa: 'குரு தியேட்டர்',
    coordinates: [78.0995, 9.9385],
    landmark: 'Near Fatima College Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-RAD',
    nameEn: 'Radio Station',
    nameTa: 'வானொலி நிலையம்',
    coordinates: [78.1062, 9.9460],
    landmark: 'All India Radio Madurai'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-SAV',
    nameEn: 'Savadi (Samayanallur)',
    nameTa: 'சாவடி (சமயநல்லூர்)',
    coordinates: [78.0772, 9.9880],
    landmark: 'Savadi Bus Shelter'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-VAL',
    nameEn: 'Valasai',
    nameTa: 'வலசை',
    coordinates: [78.0865, 10.0240],
    landmark: 'Valasai Junction'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-ALANGANALLUR',
    code: 'STP-MDU-ALN',
    nameEn: 'Alanganallur Bus Stand',
    nameTa: 'அலங்காநல்லூர் பேருந்து நிலையம்',
    coordinates: [78.0945, 10.0435],
    landmark: 'Jallikattu Town Bus Terminus'
  },

  // East & Teppakulam / Anuppanadi Corridor
  {
    districtCode: 'MDU',
    code: 'STP-MDU-THV',
    nameEn: 'Therkuvasal (South Gate)',
    nameTa: 'தெற்குவாசல்',
    coordinates: [78.1195, 9.9125],
    landmark: 'Near Mahal Vadampokki St'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-KLV',
    nameEn: 'Keelavasal (East Gate)',
    nameTa: 'கீழவாசல்',
    coordinates: [78.1285, 9.9160],
    landmark: 'Near Vilakkuthoon (Lantern Pillar)'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-MUN',
    nameEn: 'Munichalai',
    nameTa: 'முனிச்சாலை',
    coordinates: [78.1345, 9.9152],
    landmark: 'Kamarajar Salai Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TEP',
    nameEn: 'Vandiyur Teppakulam',
    nameTa: 'வண்டியூர் தெப்பக்குளம்',
    coordinates: [78.1485, 9.9142],
    landmark: 'Mariamman Teppakulam Pond'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-ANUPPANADI',
    code: 'STP-MDU-ANP',
    nameEn: 'Anuppanadi Terminus',
    nameTa: 'அனுப்பானடி முனையம்',
    coordinates: [78.1565, 9.9085],
    landmark: 'Near Velammal Medical College'
  },

  // North / Alagarkoil Corridor
  {
    districtCode: 'MDU',
    code: 'STP-MDU-TAL',
    nameEn: 'Tallakulam',
    nameTa: 'தல்லாகுளம்',
    coordinates: [78.1345, 9.9340],
    landmark: 'Tamukkam Ground & Perumal Temple'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-PUD',
    nameEn: 'K. Pudhur',
    nameTa: 'கே. புதூர்',
    coordinates: [78.1450, 9.9485],
    landmark: 'Pudhur Bus Stand Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-SUR',
    nameEn: 'Surveyor Colony',
    nameTa: 'சர்வேயர் காலனி',
    coordinates: [78.1560, 9.9620],
    landmark: 'Alagar Kovil Main Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-OTH',
    nameEn: 'Othakadai',
    nameTa: 'ஒத்தக்கடை',
    coordinates: [78.1720, 9.9790],
    landmark: 'Yanaimalai Foothills Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-APT',
    nameEn: 'Appan Tirupathi',
    nameTa: 'அப்பன் திருப்பதி',
    coordinates: [78.1925, 10.0215],
    landmark: 'Srinivasa Perumal Temple'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-ALAGARKOIL',
    code: 'STP-MDU-AGK',
    nameEn: 'Alagarkoil Terminus',
    nameTa: 'அழகர்கோவில் முனையம்',
    coordinates: [78.2138, 10.0747],
    landmark: 'Kallazhagar Temple Foothills'
  },

  // South / Airport Corridor
  {
    districtCode: 'MDU',
    code: 'STP-MDU-VIL',
    nameEn: 'Villapuram',
    nameTa: 'வில்லாபுரம்',
    coordinates: [78.1155, 9.8940],
    landmark: 'Aruppukottai Main Road'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-AVN',
    nameEn: 'Avaniyapuram',
    nameTa: 'அவனியாபுரம்',
    coordinates: [78.1090, 9.8710],
    landmark: 'Jallikattu Ground Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-PRG',
    nameEn: 'Perungudi',
    nameTa: 'பெருங்குடி',
    coordinates: [78.0980, 9.8490],
    landmark: 'Airport Ring Road Link'
  },
  {
    districtCode: 'MDU',
    busStandCode: 'MDU-AIRPORT',
    code: 'STP-MDU-AIR',
    nameEn: 'Madurai Airport',
    nameTa: 'மதுரை விமான நிலையம்',
    coordinates: [78.0933, 9.8345],
    landmark: 'Departure Terminal Gate'
  },

  // Inter-Stand Connectors
  {
    districtCode: 'MDU',
    code: 'STP-MDU-SEL',
    nameEn: 'Sellur Bridge',
    nameTa: 'செல்லூர் பாலம்',
    coordinates: [78.1190, 9.9370],
    landmark: '50 Feet Road Junction'
  },
  {
    districtCode: 'MDU',
    code: 'STP-MDU-THN',
    nameEn: 'Thathaneri',
    nameTa: 'தத்தனேரி',
    coordinates: [78.1110, 9.9410],
    landmark: 'Dindigul Main Road'
  }
];

// -----------------------------------------------------------------------------
// 4. Routes (8 Comprehensive Madurai City Corridors)
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
  },
  {
    districtCode: 'MDU',
    routeNumber: '48P',
    displayTitleEn: 'Arappalayam to Thirumangalam',
    displayTitleTa: 'ஆரப்பாளையம் - திருமங்கலம்',
    serviceCategory: 'TOWN_SERVICE'
  },
  {
    districtCode: 'MDU',
    routeNumber: '22P',
    displayTitleEn: 'Periyar to Thirunagar',
    displayTitleTa: 'பெரியார் - திருநகர்',
    serviceCategory: 'TOWN_SERVICE'
  },
  {
    districtCode: 'MDU',
    routeNumber: '4A',
    displayTitleEn: 'Arappalayam to Anuppanadi (Teppakulam)',
    displayTitleTa: 'ஆரப்பாளையம் - அனுப்பானடி (தெப்பக்குளம்)',
    serviceCategory: 'TOWN_SERVICE'
  },
  {
    districtCode: 'MDU',
    routeNumber: '44',
    displayTitleEn: 'Periyar to Alagarkoil',
    displayTitleTa: 'பெரியார் - அழகர்கோவில்',
    serviceCategory: 'MOFUSSIL'
  },
  {
    districtCode: 'MDU',
    routeNumber: '10A',
    displayTitleEn: 'Periyar to Madurai Airport',
    displayTitleTa: 'பெரியார் - மதுரை விமான நிலையம்',
    serviceCategory: 'EXPRESS'
  },
  {
    districtCode: 'MDU',
    routeNumber: '2G',
    displayTitleEn: 'Mattuthavani to Arappalayam',
    displayTitleTa: 'மாட்டுத்தாவணி - ஆரப்பாளையம்',
    serviceCategory: 'TOWN_SERVICE'
  }
];

// -----------------------------------------------------------------------------
// GeoJSON Polylines
// -----------------------------------------------------------------------------

// Route Polylines: Genuine turn-by-turn road curves along authorized TNSTC bus routes
const r77Coordinates: [number, number][] = roadPolylines.r77.coordinates;
const r70Coordinates: [number, number][] = roadPolylines.r70.coordinates;
const r48PCoordinates: [number, number][] = roadPolylines.r48P.coordinates;
const r22PCoordinates: [number, number][] = roadPolylines.r22P.coordinates;
const r4ACoordinates: [number, number][] = roadPolylines.r4A.coordinates;
const r44Coordinates: [number, number][] = roadPolylines.r44.coordinates;
const r10ACoordinates: [number, number][] = roadPolylines.r10A.coordinates;
const r2GCoordinates: [number, number][] = roadPolylines.r2G.coordinates;

// -----------------------------------------------------------------------------
// 5. Route Directions
// -----------------------------------------------------------------------------
export const seedDirections: SeedDirection[] = [
  // Route 77 (Mattuthavani ⇄ Thirumangalam)
  {
    routeNumber: '77',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-MGR',
    destinationStandCode: 'MDU-TMG',
    originStopCode: 'STP-MDU-MGR',
    destinationStopCode: 'STP-MDU-TMG',
    totalDistanceKm: roadPolylines.r77.distanceKm,
    estimatedDurationMins: roadPolylines.r77.durationMins,
    coordinates: r77Coordinates
  },
  {
    routeNumber: '77',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-TMG',
    destinationStandCode: 'MDU-MGR',
    originStopCode: 'STP-MDU-TMG',
    destinationStopCode: 'STP-MDU-MGR',
    totalDistanceKm: roadPolylines.r77.distanceKm,
    estimatedDurationMins: roadPolylines.r77.durationMins,
    coordinates: [...r77Coordinates].reverse()
  },

  // Route 70 (Mattuthavani ⇄ Periyar)
  {
    routeNumber: '70',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-MGR',
    destinationStandCode: 'MDU-PERIYAR',
    originStopCode: 'STP-MDU-MGR',
    destinationStopCode: 'STP-MDU-PER',
    totalDistanceKm: roadPolylines.r70.distanceKm,
    estimatedDurationMins: roadPolylines.r70.durationMins,
    coordinates: r70Coordinates
  },
  {
    routeNumber: '70',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-PERIYAR',
    destinationStandCode: 'MDU-MGR',
    originStopCode: 'STP-MDU-PER',
    destinationStopCode: 'STP-MDU-MGR',
    totalDistanceKm: roadPolylines.r70.distanceKm,
    estimatedDurationMins: roadPolylines.r70.durationMins,
    coordinates: [...r70Coordinates].reverse()
  },

  // Route 48P (Arappalayam ⇄ Thirumangalam)
  {
    routeNumber: '48P',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-ARAPPALAYAM',
    destinationStandCode: 'MDU-TMG',
    originStopCode: 'STP-MDU-ARP',
    destinationStopCode: 'STP-MDU-TMG',
    totalDistanceKm: roadPolylines.r48P.distanceKm,
    estimatedDurationMins: roadPolylines.r48P.durationMins,
    coordinates: r48PCoordinates
  },
  {
    routeNumber: '48P',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-TMG',
    destinationStandCode: 'MDU-ARAPPALAYAM',
    originStopCode: 'STP-MDU-TMG',
    destinationStopCode: 'STP-MDU-ARP',
    totalDistanceKm: roadPolylines.r48P.distanceKm,
    estimatedDurationMins: roadPolylines.r48P.durationMins,
    coordinates: [...r48PCoordinates].reverse()
  },

  // Route 22P (Periyar ⇄ Thirunagar)
  {
    routeNumber: '22P',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-PERIYAR',
    destinationStandCode: 'MDU-PALANGANATHAM',
    originStopCode: 'STP-MDU-PER',
    destinationStopCode: 'STP-MDU-TRN',
    totalDistanceKm: roadPolylines.r22P.distanceKm,
    estimatedDurationMins: roadPolylines.r22P.durationMins,
    coordinates: r22PCoordinates
  },
  {
    routeNumber: '22P',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-PALANGANATHAM',
    destinationStandCode: 'MDU-PERIYAR',
    originStopCode: 'STP-MDU-TRN',
    destinationStopCode: 'STP-MDU-PER',
    totalDistanceKm: roadPolylines.r22P.distanceKm,
    estimatedDurationMins: roadPolylines.r22P.durationMins,
    coordinates: [...r22PCoordinates].reverse()
  },

  // Route 4A (Arappalayam ⇄ Anuppanadi)
  {
    routeNumber: '4A',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-ARAPPALAYAM',
    destinationStandCode: 'MDU-ANUPPANADI',
    originStopCode: 'STP-MDU-ARP',
    destinationStopCode: 'STP-MDU-ANP',
    totalDistanceKm: roadPolylines.r4A.distanceKm,
    estimatedDurationMins: roadPolylines.r4A.durationMins,
    coordinates: r4ACoordinates
  },
  {
    routeNumber: '4A',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-ANUPPANADI',
    destinationStandCode: 'MDU-ARAPPALAYAM',
    originStopCode: 'STP-MDU-ANP',
    destinationStopCode: 'STP-MDU-ARP',
    totalDistanceKm: roadPolylines.r4A.distanceKm,
    estimatedDurationMins: roadPolylines.r4A.durationMins,
    coordinates: [...r4ACoordinates].reverse()
  },

  // Route 44 (Periyar ⇄ Alagarkoil)
  {
    routeNumber: '44',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-PERIYAR',
    destinationStandCode: 'MDU-ALAGARKOIL',
    originStopCode: 'STP-MDU-PER',
    destinationStopCode: 'STP-MDU-AGK',
    totalDistanceKm: roadPolylines.r44.distanceKm,
    estimatedDurationMins: roadPolylines.r44.durationMins,
    coordinates: r44Coordinates
  },
  {
    routeNumber: '44',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-ALAGARKOIL',
    destinationStandCode: 'MDU-PERIYAR',
    originStopCode: 'STP-MDU-AGK',
    destinationStopCode: 'STP-MDU-PER',
    totalDistanceKm: roadPolylines.r44.distanceKm,
    estimatedDurationMins: roadPolylines.r44.durationMins,
    coordinates: [...r44Coordinates].reverse()
  },

  // Route 10A (Periyar ⇄ Madurai Airport)
  {
    routeNumber: '10A',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-PERIYAR',
    destinationStandCode: 'MDU-AIRPORT',
    originStopCode: 'STP-MDU-PER',
    destinationStopCode: 'STP-MDU-AIR',
    totalDistanceKm: roadPolylines.r10A.distanceKm,
    estimatedDurationMins: roadPolylines.r10A.durationMins,
    coordinates: r10ACoordinates
  },
  {
    routeNumber: '10A',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-AIRPORT',
    destinationStandCode: 'MDU-PERIYAR',
    originStopCode: 'STP-MDU-AIR',
    destinationStopCode: 'STP-MDU-PER',
    totalDistanceKm: roadPolylines.r10A.distanceKm,
    estimatedDurationMins: roadPolylines.r10A.durationMins,
    coordinates: [...r10ACoordinates].reverse()
  },

  // Route 2G (Mattuthavani ⇄ Arappalayam)
  {
    routeNumber: '2G',
    directionCode: 'OUTBOUND',
    originStandCode: 'MDU-MGR',
    destinationStandCode: 'MDU-ARAPPALAYAM',
    originStopCode: 'STP-MDU-MGR',
    destinationStopCode: 'STP-MDU-ARP',
    totalDistanceKm: roadPolylines.r2G.distanceKm,
    estimatedDurationMins: roadPolylines.r2G.durationMins,
    coordinates: r2GCoordinates
  },
  {
    routeNumber: '2G',
    directionCode: 'INBOUND',
    originStandCode: 'MDU-ARAPPALAYAM',
    destinationStandCode: 'MDU-MGR',
    originStopCode: 'STP-MDU-ARP',
    destinationStopCode: 'STP-MDU-MGR',
    totalDistanceKm: roadPolylines.r2G.distanceKm,
    estimatedDurationMins: roadPolylines.r2G.durationMins,
    coordinates: [...r2GCoordinates].reverse()
  }
];

// -----------------------------------------------------------------------------
// 6. Route Stop Sequences Definitions
// -----------------------------------------------------------------------------
const r77Stops = [
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
  { code: 'STP-MDU-TPK', km: 14.5, mins: 40, fare: true },
  { code: 'STP-MDU-TRN', km: 16.2, mins: 43, fare: true },
  { code: 'STP-MDU-KAP', km: 19.5, mins: 49, fare: false },
  { code: 'STP-MDU-TMG', km: 22.8, mins: 55, fare: true }
];

const r48PStops = [
  { code: 'STP-MDU-ARP', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-ARS', km: 1.2, mins: 4, fare: false },
  { code: 'STP-MDU-PER', km: 2.8, mins: 9, fare: true },
  { code: 'STP-MDU-MDC', km: 4.0, mins: 13, fare: false },
  { code: 'STP-MDU-VSN', km: 4.9, mins: 16, fare: false },
  { code: 'STP-MDU-PAL', km: 5.8, mins: 19, fare: true },
  { code: 'STP-MDU-PYK', km: 8.0, mins: 25, fare: false },
  { code: 'STP-MDU-TPK', km: 10.2, mins: 31, fare: true },
  { code: 'STP-MDU-TRN', km: 12.0, mins: 36, fare: true },
  { code: 'STP-MDU-KAP', km: 16.5, mins: 44, fare: false },
  { code: 'STP-MDU-TMG', km: 21.5, mins: 52, fare: true }
];

const r22PStops = [
  { code: 'STP-MDU-PER', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-MDC', km: 1.2, mins: 4, fare: false },
  { code: 'STP-MDU-VSN', km: 2.1, mins: 7, fare: false },
  { code: 'STP-MDU-PAL', km: 3.0, mins: 10, fare: true },
  { code: 'STP-MDU-PYK', km: 5.2, mins: 16, fare: false },
  { code: 'STP-MDU-TPK', km: 7.4, mins: 21, fare: true },
  { code: 'STP-MDU-TRN', km: 9.2, mins: 26, fare: true }
];

const r4AStops = [
  { code: 'STP-MDU-ARP', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-ARS', km: 1.2, mins: 4, fare: false },
  { code: 'STP-MDU-PER', km: 2.8, mins: 9, fare: true },
  { code: 'STP-MDU-THV', km: 3.8, mins: 13, fare: false },
  { code: 'STP-MDU-KLV', km: 4.9, mins: 17, fare: true },
  { code: 'STP-MDU-MUN', km: 5.7, mins: 20, fare: false },
  { code: 'STP-MDU-TEP', km: 7.3, mins: 24, fare: true },
  { code: 'STP-MDU-ANP', km: 8.8, mins: 28, fare: true }
];

const r44Stops = [
  { code: 'STP-MDU-PER', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-SIM', km: 1.9, mins: 6, fare: false },
  { code: 'STP-MDU-GOR', km: 3.1, mins: 10, fare: true },
  { code: 'STP-MDU-TAL', km: 4.2, mins: 14, fare: false },
  { code: 'STP-MDU-PUD', km: 6.5, mins: 20, fare: true },
  { code: 'STP-MDU-SUR', km: 8.8, mins: 25, fare: false },
  { code: 'STP-MDU-OTH', km: 12.0, mins: 32, fare: true },
  { code: 'STP-MDU-APT', km: 16.5, mins: 40, fare: false },
  { code: 'STP-MDU-AGK', km: 21.0, mins: 48, fare: true }
];

const r10AStops = [
  { code: 'STP-MDU-PER', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-THV', km: 1.5, mins: 5, fare: false },
  { code: 'STP-MDU-VIL', km: 3.8, mins: 11, fare: true },
  { code: 'STP-MDU-AVN', km: 6.9, mins: 18, fare: true },
  { code: 'STP-MDU-PRG', km: 9.8, mins: 24, fare: false },
  { code: 'STP-MDU-AIR', km: 12.4, mins: 30, fare: true }
];

const r2GStops = [
  { code: 'STP-MDU-MGR', km: 0.0, mins: 0, fare: true },
  { code: 'STP-MDU-KKN', km: 1.5, mins: 5, fare: false },
  { code: 'STP-MDU-ANN', km: 2.8, mins: 9, fare: true },
  { code: 'STP-MDU-GOR', km: 3.9, mins: 12, fare: true },
  { code: 'STP-MDU-SEL', km: 5.0, mins: 15, fare: false },
  { code: 'STP-MDU-THN', km: 5.8, mins: 17, fare: false },
  { code: 'STP-MDU-ARP', km: 6.5, mins: 20, fare: true }
];

// Helper to generate Outbound and Inbound sequence records
function makeSequencePair(
  routeNumber: string,
  stops: Array<{ code: string; km: number; mins: number; fare: boolean }>,
  totalKm: number,
  totalMins: number
): SeedStopSequence[] {
  const outbound: SeedStopSequence[] = stops.map((s, idx) => ({
    routeNumber,
    directionCode: 'OUTBOUND' as const,
    stopCode: s.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: s.km,
    cumulativeDurationMinutes: s.mins,
    isFareStage: s.fare
  }));

  const inbound: SeedStopSequence[] = [...stops].reverse().map((s, idx) => ({
    routeNumber,
    directionCode: 'INBOUND' as const,
    stopCode: s.code,
    sequenceOrder: idx + 1,
    distanceFromOriginKm: Number((totalKm - s.km).toFixed(1)),
    cumulativeDurationMinutes: Math.max(0, totalMins - s.mins),
    isFareStage: s.fare
  }));

  return [...outbound, ...inbound];
}

export const seedStopSequences: SeedStopSequence[] = [
  ...makeSequencePair('77', r77Stops, 22.8, 55),
  ...makeSequencePair('70', r77Stops.slice(0, 7), 7.6, 22),
  ...makeSequencePair('48P', r48PStops, 21.5, 52),
  ...makeSequencePair('22P', r22PStops, 9.2, 26),
  ...makeSequencePair('4A', r4AStops, 8.8, 28),
  ...makeSequencePair('44', r44Stops, 21.0, 48),
  ...makeSequencePair('10A', r10AStops, 12.4, 30),
  ...makeSequencePair('2G', r2GStops, 6.5, 20)
];

// -----------------------------------------------------------------------------
// 7. Buses (Fleet Assets Across Depots)
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
  },
  {
    registrationNumber: 'TN-58-N-2450',
    fleetNumber: 'MDU-ARP-112',
    depotName: 'Arappalayam Depot',
    vehicleType: 'DELUXE',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2512',
    fleetNumber: 'MDU-PRY-078',
    depotName: 'Periyar Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2601',
    fleetNumber: 'MDU-ARP-125',
    depotName: 'Arappalayam Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2788',
    fleetNumber: 'MDU-PRY-094',
    depotName: 'Periyar Depot',
    vehicleType: 'DELUXE',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2830',
    fleetNumber: 'MDU-AIR-015',
    depotName: 'Periyar Depot',
    vehicleType: 'ULTRA_DELUXE',
    status: 'IN_SERVICE'
  },
  {
    registrationNumber: 'TN-58-N-2915',
    fleetNumber: 'MDU-MGR-108',
    depotName: 'Madurai Central Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'IN_SERVICE'
  }
];

// -----------------------------------------------------------------------------
// 8. Scheduled Trips & Timetable (Every Route has an Active Scheduled Trip)
// -----------------------------------------------------------------------------
export const seedTrips: SeedTrip[] = [
  // Route 77
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

  // Route 70
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
  },

  // Route 48P
  {
    tripCode: 'TRIP-48P-OUT-0815',
    routeNumber: '48P',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2450',
    departureTime: '08:15',
    arrivalTime: '09:07',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-48P-IN-0930',
    routeNumber: '48P',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2450',
    departureTime: '09:30',
    arrivalTime: '10:22',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },

  // Route 22P
  {
    tripCode: 'TRIP-22P-OUT-0820',
    routeNumber: '22P',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2512',
    departureTime: '08:20',
    arrivalTime: '08:46',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-22P-IN-0900',
    routeNumber: '22P',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2512',
    departureTime: '09:00',
    arrivalTime: '09:26',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },

  // Route 4A
  {
    tripCode: 'TRIP-4A-OUT-0810',
    routeNumber: '4A',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2601',
    departureTime: '08:10',
    arrivalTime: '08:38',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-4A-IN-0850',
    routeNumber: '4A',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2601',
    departureTime: '08:50',
    arrivalTime: '09:18',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },

  // Route 44
  {
    tripCode: 'TRIP-44-OUT-0745',
    routeNumber: '44',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2788',
    departureTime: '07:45',
    arrivalTime: '08:33',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-44-IN-0900',
    routeNumber: '44',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2788',
    departureTime: '09:00',
    arrivalTime: '09:48',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },

  // Route 10A
  {
    tripCode: 'TRIP-10A-OUT-0805',
    routeNumber: '10A',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2830',
    departureTime: '08:05',
    arrivalTime: '08:35',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-10A-IN-0915',
    routeNumber: '10A',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2830',
    departureTime: '09:15',
    arrivalTime: '09:45',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },

  // Route 2G
  {
    tripCode: 'TRIP-2G-OUT-0825',
    routeNumber: '2G',
    directionCode: 'OUTBOUND',
    busRegistrationNumber: 'TN-58-N-2915',
    departureTime: '08:25',
    arrivalTime: '08:45',
    operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    tripCode: 'TRIP-2G-IN-0905',
    routeNumber: '2G',
    directionCode: 'INBOUND',
    busRegistrationNumber: 'TN-58-N-2915',
    departureTime: '09:05',
    arrivalTime: '09:25',
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
  // TRIP-77-OUT-0830
  ...r77Stops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:30', item.mins);
    return {
      tripCode: 'TRIP-77-OUT-0830',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-70-OUT-0800
  ...r77Stops.slice(0, 7).map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:00', item.mins);
    return {
      tripCode: 'TRIP-70-OUT-0800',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-48P-OUT-0815
  ...r48PStops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:15', item.mins);
    return {
      tripCode: 'TRIP-48P-OUT-0815',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-22P-OUT-0820
  ...r22PStops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:20', item.mins);
    return {
      tripCode: 'TRIP-22P-OUT-0820',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-4A-OUT-0810
  ...r4AStops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:10', item.mins);
    return {
      tripCode: 'TRIP-4A-OUT-0810',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-44-OUT-0745
  ...r44Stops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('07:45', item.mins);
    return {
      tripCode: 'TRIP-44-OUT-0745',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-10A-OUT-0805
  ...r10AStops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:05', item.mins);
    return {
      tripCode: 'TRIP-10A-OUT-0805',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  }),

  // TRIP-2G-OUT-0825
  ...r2GStops.map((item, idx) => {
    const arrTime = addMinutesToHHMM('08:25', item.mins);
    return {
      tripCode: 'TRIP-2G-OUT-0825',
      stopCode: item.code,
      stopSequence: idx + 1,
      scheduledArrivalTime: arrTime,
      scheduledDepartureTime: idx === 0 ? arrTime : addMinutesToHHMM(arrTime, 1)
    };
  })
];
