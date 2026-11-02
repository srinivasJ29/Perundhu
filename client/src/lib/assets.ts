/**
 * PERUNDHU (பேருந்து) — Authentic Tamil Nadu Visual Asset Registry
 * Provides type-safe access to verified bus photography, district landmarks,
 * and bus stand visuals with full artist attributions and licensing compliance.
 */

export interface BusImageAsset {
  category: 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE';
  titleEn: string;
  titleTa: string;
  webp: string;
  thumb: string;
  jpg: string;
  altEn: string;
  altTa: string;
  livery: string;
  model: string;
  attribution: string;
}

export interface LandmarkImageAsset {
  districtCode: string;
  nameEn: string;
  nameTa: string;
  webp: string;
  thumb: string;
  jpg: string;
  altEn: string;
  altTa: string;
  attribution: string;
}

export interface BusStandImageAsset {
  code: string;
  nameEn: string;
  nameTa: string;
  webp: string;
  thumb: string;
  jpg: string;
  altEn: string;
  altTa: string;
  attribution: string;
}

export const BUS_CATEGORY_ASSETS: Record<'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE', BusImageAsset> = {
  ORDINARY_NON_AC: {
    category: 'ORDINARY_NON_AC',
    titleEn: 'TNSTC Town Bus (Ordinary)',
    titleTa: 'அரசு நகரப் பேருந்து (சாதாரண கட்டணம்)',
    webp: '/assets/buses/tnstc-ordinary-town-bus.webp',
    thumb: '/assets/buses/tnstc-ordinary-town-bus-thumb.webp',
    jpg: '/assets/buses/tnstc-ordinary-town-bus.jpg',
    altEn: 'Genuine Tamil Nadu State Transport Corporation (TNSTC) ordinary town transit bus in urban blue and white livery',
    altTa: 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழக சாதாரண கட்டண நகரப் பேருந்து (நீலம்-வெள்ளை நிறம்)',
    livery: 'TNSTC Urban Blue & White',
    model: 'Ashok Leyland 11M Viking',
    attribution: 'Photo by deadrat (Wikimedia Commons, CC BY-SA 4.0)'
  },
  DELUXE: {
    category: 'DELUXE',
    titleEn: 'TNSTC Mofussil Express (Deluxe)',
    titleTa: 'அரசு விரைவுப் பேருந்து (டீலக்ஸ்)',
    webp: '/assets/buses/tnstc-mofussil-deluxe.webp',
    thumb: '/assets/buses/tnstc-mofussil-deluxe-thumb.webp',
    jpg: '/assets/buses/tnstc-mofussil-deluxe.jpg',
    altEn: 'Authentic TNSTC mofussil point-to-point express bus in classic green and white livery',
    altTa: 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழக புறநகர் விரைவுப் பேருந்து (பச்சை-வெள்ளை நிறம்)',
    livery: 'TNSTC Green & White Mofussil Express',
    model: 'Ashok Leyland Viking BS-VI',
    attribution: 'Photo by Vishwa Sundar (Wikimedia Commons, CC BY-SA 4.0)'
  },
  ULTRA_DELUXE: {
    category: 'ULTRA_DELUXE',
    titleEn: 'SETC Air-Conditioned Coach (Ultra Deluxe)',
    titleTa: 'விரைவுப் போக்குவரத்துக் கழக குளிர்சாதனப் பேருந்து (அல்ட்ரா டீலக்ஸ்)',
    webp: '/assets/buses/setc-ultra-deluxe-coach.webp',
    thumb: '/assets/buses/setc-ultra-deluxe-coach-thumb.webp',
    jpg: '/assets/buses/setc-ultra-deluxe-coach.jpg',
    altEn: 'Authentic State Express Transport Corporation (SETC) long-distance air-conditioned coach',
    altTa: 'அரசு விரைவுப் போக்குவரத்துக் கழக (SETC) குளிர்சாதன நீண்டதூரப் பேருந்து',
    livery: 'SETC Signature Cream & Green Air-Conditioned',
    model: 'Ashok Leyland Prakash Vega Coach',
    attribution: 'Photo by Shreeram1999 (Wikimedia Commons, CC BY-SA 4.0)'
  }
};

export const DISTRICT_LANDMARK_ASSETS: Record<string, LandmarkImageAsset> = {
  MDU: {
    districtCode: 'MDU',
    nameEn: 'Meenakshi Amman Temple',
    nameTa: 'மீனாட்சி அம்மன் கோவில் கோபுரம்',
    webp: '/assets/landmarks/madurai-meenakshi-temple.webp',
    thumb: '/assets/landmarks/madurai-meenakshi-temple-thumb.webp',
    jpg: '/assets/landmarks/madurai-meenakshi-temple.jpg',
    altEn: 'Magnificent architectural Gopuram of the Arulmigu Meenakshi Sundareswarar Temple in Madurai',
    altTa: 'மதுரை அருள்மிகு மீனாட்சி சுந்தரேஸ்வரர் கோவில் ராஜகோபுரம்',
    attribution: 'Photo by Kumar Appaiah (Wikimedia Commons, CC BY-SA 2.5)'
  },
  CHN: {
    districtCode: 'CHN',
    nameEn: 'Chennai Central Station',
    nameTa: 'சென்னை சென்ட்ரல் ரயில் & போக்குவரத்து முனையம்',
    webp: '/assets/landmarks/chennai-central.webp',
    thumb: '/assets/landmarks/chennai-central-thumb.webp',
    jpg: '/assets/landmarks/chennai-central.jpg',
    altEn: 'Historic facade of Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station in Chennai',
    altTa: 'சென்னை புரட்சித் தலைவர் டாக்டர் எம்.ஜி.ஆர் சென்ட்ரல் ரயில் நிலையம்',
    attribution: 'Photo by Ganesh Mohan T (Wikimedia Commons, CC BY-SA 4.0)'
  },
  TNJ: {
    districtCode: 'TNJ',
    nameEn: 'Brihadisvara Temple',
    nameTa: 'தஞ்சை பெருவுடையார் கோவில் (பெரிய கோவில்)',
    webp: '/assets/landmarks/thanjavur-brihadisvara-temple.webp',
    thumb: '/assets/landmarks/thanjavur-brihadisvara-temple-thumb.webp',
    jpg: '/assets/landmarks/thanjavur-brihadisvara-temple.jpg',
    altEn: 'Granite Vimana of the Great Living Chola Temple at Thanjavur',
    altTa: 'தஞ்சாவூர் அருள்மிகு பிரகதீஸ்வரர் கோவில் விமானம்',
    attribution: 'Photo by RMUKU83 (Wikimedia Commons, CC BY-SA 4.0)'
  },
  TRY: {
    districtCode: 'TRY',
    nameEn: 'Tiruchirappalli Rockfort',
    nameTa: 'திருச்சிராப்பள்ளி மலைக்கோட்டை',
    webp: '/assets/landmarks/tiruchirappalli-rockfort.webp',
    thumb: '/assets/landmarks/tiruchirappalli-rockfort-thumb.webp',
    jpg: '/assets/landmarks/tiruchirappalli-rockfort.jpg',
    altEn: 'Historic Tiruchirappalli Rock Fort temple hill rising above the Kaveri basin',
    altTa: 'திருச்சிராப்பள்ளி உச்சிப் பிள்ளையார் மலைக்கோட்டை',
    attribution: 'Photo by Pravinyeapuri (Wikimedia Commons, CC BY-SA 4.0)'
  }
};

export const BUS_STAND_ASSETS: Record<string, BusStandImageAsset> = {
  'MDU-MGR': {
    code: 'MDU-MGR',
    nameEn: 'M.G.R. Integrated Bus Stand (Mattuthavani)',
    nameTa: 'எம்.ஜி.ஆர் ஒருங்கிணைந்த பேருந்து நிலையம் (மாட்டுத்தாவணி)',
    webp: '/assets/bus-stands/madurai-mattuthavani-terminal.webp',
    thumb: '/assets/bus-stands/madurai-mattuthavani-terminal-thumb.webp',
    jpg: '/assets/bus-stands/madurai-mattuthavani-terminal.jpg',
    altEn: 'Entrance arch and passenger concourse of Madurai M.G.R. Integrated Bus Terminus at Mattuthavani',
    altTa: 'மதுரை எம்.ஜி.ஆர் ஒருங்கிணைந்த பேருந்து முனையம் (மாட்டுத்தாவணி நுழைவாயில்)',
    attribution: 'Photo by Jaishink (Wikimedia Commons, CC BY-SA 4.0)'
  },
  'MDU-PER': {
    code: 'MDU-PER',
    nameEn: 'Periyar Bus Stand',
    nameTa: 'பெரியார் பேருந்து நிலையம்',
    webp: '/assets/bus-stands/madurai-periyar-terminal.webp',
    thumb: '/assets/bus-stands/madurai-periyar-terminal-thumb.webp',
    jpg: '/assets/bus-stands/madurai-periyar-terminal.jpg',
    altEn: 'Modernized multi-level terminal bays of Periyar Bus Stand in Madurai',
    altTa: 'மதுரை பெரியார் மத்திய பேருந்து நிலையம் புதிய முனையம்',
    attribution: 'Photo by TNSE Mahalingam VNR (Wikimedia Commons, CC BY-SA 4.0)'
  }
};

export function getBusCategoryAsset(category: 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE'): BusImageAsset {
  return BUS_CATEGORY_ASSETS[category] || BUS_CATEGORY_ASSETS.ORDINARY_NON_AC;
}

export function getDistrictLandmarkAsset(districtCode: string): LandmarkImageAsset | undefined {
  return DISTRICT_LANDMARK_ASSETS[districtCode.toUpperCase()];
}

export function getBusStandAsset(standCode: string): BusStandImageAsset | undefined {
  return BUS_STAND_ASSETS[standCode.toUpperCase()];
}

export function getHeroBusAsset() {
  return {
    webp: '/assets/buses/tnstc-hero-madurai.webp',
    jpg: '/assets/buses/tnstc-mofussil-deluxe.jpg',
    altEn: 'Authentic Tamil Nadu State Transport Corporation (TNSTC) government bus in signature green and white express livery',
    altTa: 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழக விரைவுப் பேருந்து (பச்சை-வெள்ளை நிறம்)',
    attribution: 'Photo by Vishwa Sundar (Wikimedia Commons, CC BY-SA 4.0)'
  };
}

