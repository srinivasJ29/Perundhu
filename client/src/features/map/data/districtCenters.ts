/**
 * PERUNDHU (பேருந்து) — Canonical District Geographic Centers
 * Precise geographic coordinates for all 38 districts of Tamil Nadu.
 * Enables automatic map centering on any selected district without hardcoding Madurai for everything.
 */

export interface DistrictCenterInfo {
  code: string;
  id: string;
  nameEn: string;
  nameTa: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  isPilot: boolean;
}

export const TAMIL_NADU_CENTER: [number, number] = [11.1271, 78.6569];

export const DISTRICT_CENTERS: Record<string, DistrictCenterInfo> = {
  mdu: {
    code: 'MDU',
    id: 'madurai',
    nameEn: 'Madurai',
    nameTa: 'மதுரை',
    center: [9.9252, 78.1198],
    zoom: 13,
    isPilot: true
  },
  madurai: {
    code: 'MDU',
    id: 'madurai',
    nameEn: 'Madurai',
    nameTa: 'மதுரை',
    center: [9.9252, 78.1198],
    zoom: 13,
    isPilot: true
  },
  ari: {
    code: 'ARI',
    id: 'ariyalur',
    nameEn: 'Ariyalur',
    nameTa: 'அரியலூர்',
    center: [11.1399, 79.0754],
    zoom: 12,
    isPilot: false
  },
  cgl: {
    code: 'CGL',
    id: 'chengalpattu',
    nameEn: 'Chengalpattu',
    nameTa: 'செங்கல்பட்டு',
    center: [12.6841, 79.9836],
    zoom: 12,
    isPilot: false
  },
  chn: {
    code: 'CHN',
    id: 'chennai',
    nameEn: 'Chennai',
    nameTa: 'சென்னை',
    center: [13.0827, 80.2707],
    zoom: 12,
    isPilot: false
  },
  cbe: {
    code: 'CBE',
    id: 'coimbatore',
    nameEn: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    center: [11.0168, 76.9558],
    zoom: 12,
    isPilot: false
  },
  cud: {
    code: 'CUD',
    id: 'cuddalore',
    nameEn: 'Cuddalore',
    nameTa: 'கடலூர்',
    center: [11.748, 79.7714],
    zoom: 12,
    isPilot: false
  },
  dhp: {
    code: 'DHP',
    id: 'dharmapuri',
    nameEn: 'Dharmapuri',
    nameTa: 'தர்மபுரி',
    center: [12.1211, 78.1582],
    zoom: 12,
    isPilot: false
  },
  dgl: {
    code: 'DGL',
    id: 'dindigul',
    nameEn: 'Dindigul',
    nameTa: 'திண்டுக்கல்',
    center: [10.3673, 77.9803],
    zoom: 12,
    isPilot: false
  },
  erd: {
    code: 'ERD',
    id: 'erode',
    nameEn: 'Erode',
    nameTa: 'ஈரோடு',
    center: [11.341, 77.7172],
    zoom: 12,
    isPilot: false
  },
  klk: {
    code: 'KLK',
    id: 'kallakurichi',
    nameEn: 'Kallakurichi',
    nameTa: 'கள்ளக்குறிச்சி',
    center: [11.7384, 78.9639],
    zoom: 12,
    isPilot: false
  },
  kan: {
    code: 'KAN',
    id: 'kancheepuram',
    nameEn: 'Kancheepuram',
    nameTa: 'காஞ்சிபுரம்',
    center: [12.8342, 79.7036],
    zoom: 12,
    isPilot: false
  },
  krk: {
    code: 'KRK',
    id: 'kanniyakumari',
    nameEn: 'Kanniyakumari',
    nameTa: 'கன்னியாகுமரி',
    center: [8.0883, 77.5385],
    zoom: 12,
    isPilot: false
  },
  kar: {
    code: 'KAR',
    id: 'karur',
    nameEn: 'Karur',
    nameTa: 'கரூர்',
    center: [10.9601, 78.0766],
    zoom: 12,
    isPilot: false
  },
  kgi: {
    code: 'KGI',
    id: 'krishnagiri',
    nameEn: 'Krishnagiri',
    nameTa: 'கிருஷ்ணகிரி',
    center: [12.5186, 78.2137],
    zoom: 12,
    isPilot: false
  },
  myd: {
    code: 'MYD',
    id: 'mayiladuthurai',
    nameEn: 'Mayiladuthurai',
    nameTa: 'மயிலாடுதுறை',
    center: [11.1075, 79.6522],
    zoom: 12,
    isPilot: false
  },
  ngp: {
    code: 'NGP',
    id: 'nagapattinam',
    nameEn: 'Nagapattinam',
    nameTa: 'நாகப்பட்டினம்',
    center: [10.7672, 79.8449],
    zoom: 12,
    isPilot: false
  },
  nmk: {
    code: 'NMK',
    id: 'namakkal',
    nameEn: 'Namakkal',
    nameTa: 'நாமக்கல்',
    center: [11.2189, 78.1674],
    zoom: 12,
    isPilot: false
  },
  nil: {
    code: 'NIL',
    id: 'nilgiris',
    nameEn: 'Nilgiris',
    nameTa: 'நீலகிரி',
    center: [11.4102, 76.695],
    zoom: 12,
    isPilot: false
  },
  per: {
    code: 'PER',
    id: 'perambalur',
    nameEn: 'Perambalur',
    nameTa: 'பெரம்பலூர்',
    center: [11.2333, 78.8824],
    zoom: 12,
    isPilot: false
  },
  pdk: {
    code: 'PDK',
    id: 'pudukkottai',
    nameEn: 'Pudukkottai',
    nameTa: 'புதுக்கோட்டை',
    center: [10.3797, 78.8208],
    zoom: 12,
    isPilot: false
  },
  rmd: {
    code: 'RMD',
    id: 'ramanathapuram',
    nameEn: 'Ramanathapuram',
    nameTa: 'ராமநாதபுரம்',
    center: [9.3639, 78.8395],
    zoom: 12,
    isPilot: false
  },
  ran: {
    code: 'RAN',
    id: 'ranipet',
    nameEn: 'Ranipet',
    nameTa: 'இராணிப்பேட்டை',
    center: [12.9224, 79.333],
    zoom: 12,
    isPilot: false
  },
  slm: {
    code: 'SLM',
    id: 'salem',
    nameEn: 'Salem',
    nameTa: 'சேலம்',
    center: [11.6643, 78.146],
    zoom: 12,
    isPilot: false
  },
  svg: {
    code: 'SVG',
    id: 'sivagangai',
    nameEn: 'Sivagangai',
    nameTa: 'சிவகங்கை',
    center: [9.8433, 78.4809],
    zoom: 12,
    isPilot: false
  },
  tsi: {
    code: 'TSI',
    id: 'tenkasi',
    nameEn: 'Tenkasi',
    nameTa: 'தென்காசி',
    center: [8.9594, 77.315],
    zoom: 12,
    isPilot: false
  },
  tjv: {
    code: 'TJV',
    id: 'thanjavur',
    nameEn: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    center: [10.787, 79.1378],
    zoom: 12,
    isPilot: false
  },
  tni: {
    code: 'TNI',
    id: 'theni',
    nameEn: 'Theni',
    nameTa: 'தேனி',
    center: [10.0104, 77.4768],
    zoom: 12,
    isPilot: false
  },
  thv: {
    code: 'THV',
    id: 'thiruvallur',
    nameEn: 'Thiruvallur',
    nameTa: 'திருவள்ளூர்',
    center: [13.1432, 79.9074],
    zoom: 12,
    isPilot: false
  },
  tvr: {
    code: 'TVR',
    id: 'thiruvarur',
    nameEn: 'Thiruvarur',
    nameTa: 'திருவாரூர்',
    center: [10.7725, 79.6365],
    zoom: 12,
    isPilot: false
  },
  tck: {
    code: 'TCK',
    id: 'thoothukudi',
    nameEn: 'Thoothukudi',
    nameTa: 'தூத்துக்குடி',
    center: [8.7642, 78.1348],
    zoom: 12,
    isPilot: false
  },
  tcp: {
    code: 'TCP',
    id: 'tiruchirappalli',
    nameEn: 'Tiruchirappalli',
    nameTa: 'திருச்சிராப்பள்ளி',
    center: [10.7905, 78.7047],
    zoom: 12,
    isPilot: false
  },
  tnv: {
    code: 'TNV',
    id: 'tirunelveli',
    nameEn: 'Tirunelveli',
    nameTa: 'திருநெல்வேலி',
    center: [8.7139, 77.7567],
    zoom: 12,
    isPilot: false
  },
  tpt: {
    code: 'TPT',
    id: 'tirupathur',
    nameEn: 'Tirupathur',
    nameTa: 'திருப்பத்தூர்',
    center: [12.4925, 78.5678],
    zoom: 12,
    isPilot: false
  },
  tup: {
    code: 'TUP',
    id: 'tiruppur',
    nameEn: 'Tiruppur',
    nameTa: 'திருப்பூர்',
    center: [11.1085, 77.3411],
    zoom: 12,
    isPilot: false
  },
  tvm: {
    code: 'TVM',
    id: 'tiruvannamalai',
    nameEn: 'Tiruvannamalai',
    nameTa: 'திருவண்ணாமலை',
    center: [12.2253, 79.0747],
    zoom: 12,
    isPilot: false
  },
  vel: {
    code: 'VEL',
    id: 'vellore',
    nameEn: 'Vellore',
    nameTa: 'வேலூர்',
    center: [12.9165, 79.1325],
    zoom: 12,
    isPilot: false
  },
  vlp: {
    code: 'VLP',
    id: 'viluppuram',
    nameEn: 'Viluppuram',
    nameTa: 'விழுப்புரம்',
    center: [11.9401, 79.4861],
    zoom: 12,
    isPilot: false
  },
  vnr: {
    code: 'VNR',
    id: 'virudhunagar',
    nameEn: 'Virudhunagar',
    nameTa: 'விருதுநகர்',
    center: [9.5872, 77.9514],
    zoom: 12,
    isPilot: false
  }
};

/**
 * Resolves a district identifier, code, or name to its authentic center coordinates.
 */
export function getDistrictCenterInfo(identifier?: string | null): DistrictCenterInfo {
  if (!identifier) {
    return DISTRICT_CENTERS.mdu;
  }

  const key = identifier.toLowerCase().trim();
  const direct = DISTRICT_CENTERS[key];
  if (direct) {
    return direct;
  }

  // Search by code or name
  for (const info of Object.values(DISTRICT_CENTERS)) {
    if (
      info.code.toLowerCase() === key ||
      info.id.toLowerCase() === key ||
      info.nameEn.toLowerCase() === key ||
      info.nameTa.toLowerCase() === key
    ) {
      return info;
    }
  }

  // Fallback to Madurai pilot default
  return DISTRICT_CENTERS.mdu;
}
