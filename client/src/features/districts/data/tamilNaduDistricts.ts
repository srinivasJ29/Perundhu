import { DistrictItem } from '../types';

/**
 * PERUNDHU (பேருந்து) — Canonical 38-District Catalogue of Tamil Nadu
 *
 * NOTE ON DATA INTEGRITY & AVAILABILITY:
 * All 38 administrative districts of Tamil Nadu are catalogued here.
 * In compliance with the backend-first roadmap, MADURAI is configured as the
 * initial surveyed pilot corridor with active live telemetry (Routes 70 & 77).
 * All other 37 districts remain in 'COMING_SOON' rollout state until their
 * respective bus stops, route polylines, and telematics are deployed.
 */
export const TAMIL_NADU_DISTRICTS: DistrictItem[] = [
  {
    id: 'ariyalur',
    code: 'ARI',
    nameEn: 'Ariyalur',
    nameTa: 'அரியலூர்',
    headquartersEn: 'Ariyalur',
    headquartersTa: 'அரியலூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'chengalpattu',
    code: 'CGL',
    nameEn: 'Chengalpattu',
    nameTa: 'செங்கல்பட்டு',
    headquartersEn: 'Chengalpattu',
    headquartersTa: 'செங்கல்பட்டு',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'chennai',
    code: 'CHN',
    nameEn: 'Chennai',
    nameTa: 'சென்னை',
    headquartersEn: 'Chennai',
    headquartersTa: 'சென்னை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'coimbatore',
    code: 'CBE',
    nameEn: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    headquartersEn: 'Coimbatore',
    headquartersTa: 'கோயம்புத்தூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'cuddalore',
    code: 'CUD',
    nameEn: 'Cuddalore',
    nameTa: 'கடலூர்',
    headquartersEn: 'Cuddalore',
    headquartersTa: 'கடலூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'dharmapuri',
    code: 'DHP',
    nameEn: 'Dharmapuri',
    nameTa: 'தருமபுரி',
    headquartersEn: 'Dharmapuri',
    headquartersTa: 'தருமபுரி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'dindigul',
    code: 'DGL',
    nameEn: 'Dindigul',
    nameTa: 'திண்டுக்கல்',
    headquartersEn: 'Dindigul',
    headquartersTa: 'திண்டுக்கல்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'erode',
    code: 'ERD',
    nameEn: 'Erode',
    nameTa: 'ஈரோடு',
    headquartersEn: 'Erode',
    headquartersTa: 'ஈரோடு',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'kallakurichi',
    code: 'KLK',
    nameEn: 'Kallakurichi',
    nameTa: 'கள்ளக்குறிச்சி',
    headquartersEn: 'Kallakurichi',
    headquartersTa: 'கள்ளக்குறிச்சி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'kancheepuram',
    code: 'KCH',
    nameEn: 'Kancheepuram',
    nameTa: 'காஞ்சிபுரம்',
    headquartersEn: 'Kancheepuram',
    headquartersTa: 'காஞ்சிபுரம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'kanniyakumari',
    code: 'KKI',
    nameEn: 'Kanniyakumari',
    nameTa: 'கன்னியாகுமரி',
    headquartersEn: 'Nagercoil',
    headquartersTa: 'நாகர்கோவில்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'karur',
    code: 'KRR',
    nameEn: 'Karur',
    nameTa: 'கரூர்',
    headquartersEn: 'Karur',
    headquartersTa: 'கரூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'krishnagiri',
    code: 'KRI',
    nameEn: 'Krishnagiri',
    nameTa: 'கிருஷ்ணகிரி',
    headquartersEn: 'Krishnagiri',
    headquartersTa: 'கிருஷ்ணகிரி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'madurai',
    code: 'MDU',
    nameEn: 'Madurai',
    nameTa: 'மதுரை',
    headquartersEn: 'Madurai',
    headquartersTa: 'மதுரை',
    status: 'AVAILABLE',
    isPilot: true
  },
  {
    id: 'mayiladuthurai',
    code: 'MYD',
    nameEn: 'Mayiladuthurai',
    nameTa: 'மயிலாடுதுறை',
    headquartersEn: 'Mayiladuthurai',
    headquartersTa: 'மயிலாடுதுறை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'nagapattinam',
    code: 'NGP',
    nameEn: 'Nagapattinam',
    nameTa: 'நாகப்பட்டினம்',
    headquartersEn: 'Nagapattinam',
    headquartersTa: 'நாகப்பட்டினம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'namakkal',
    code: 'NKL',
    nameEn: 'Namakkal',
    nameTa: 'நாமக்கல்',
    headquartersEn: 'Namakkal',
    headquartersTa: 'நாமக்கல்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'nilgiris',
    code: 'NIL',
    nameEn: 'Nilgiris',
    nameTa: 'நீலகிரி',
    headquartersEn: 'Udhagamandalam',
    headquartersTa: 'உதகமண்டலம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'perambalur',
    code: 'PBL',
    nameEn: 'Perambalur',
    nameTa: 'பெரம்பலூர்',
    headquartersEn: 'Perambalur',
    headquartersTa: 'பெரம்பலூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'pudukkottai',
    code: 'PDK',
    nameEn: 'Pudukkottai',
    nameTa: 'புதுக்கோட்டை',
    headquartersEn: 'Pudukkottai',
    headquartersTa: 'புதுக்கோட்டை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'ramanathapuram',
    code: 'RMD',
    nameEn: 'Ramanathapuram',
    nameTa: 'இராமநாதபுரம்',
    headquartersEn: 'Ramanathapuram',
    headquartersTa: 'இராமநாதபுரம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'ranipet',
    code: 'RPT',
    nameEn: 'Ranipet',
    nameTa: 'இராணிப்பேட்டை',
    headquartersEn: 'Ranipet',
    headquartersTa: 'இராணிப்பேட்டை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'salem',
    code: 'SLM',
    nameEn: 'Salem',
    nameTa: 'சேலம்',
    headquartersEn: 'Salem',
    headquartersTa: 'சேலம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'sivaganga',
    code: 'SVG',
    nameEn: 'Sivaganga',
    nameTa: 'சிவகங்கை',
    headquartersEn: 'Sivaganga',
    headquartersTa: 'சிவகங்கை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tenkasi',
    code: 'TSI',
    nameEn: 'Tenkasi',
    nameTa: 'தென்காசி',
    headquartersEn: 'Tenkasi',
    headquartersTa: 'தென்காசி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'thanjavur',
    code: 'TNJ',
    nameEn: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    headquartersEn: 'Thanjavur',
    headquartersTa: 'தஞ்சாவூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'theni',
    code: 'THI',
    nameEn: 'Theni',
    nameTa: 'தேனி',
    headquartersEn: 'Theni',
    headquartersTa: 'தேனி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'thoothukudi',
    code: 'TUT',
    nameEn: 'Thoothukudi',
    nameTa: 'தூத்துக்குடி',
    headquartersEn: 'Thoothukudi',
    headquartersTa: 'தூத்துக்குடி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tiruchirappalli',
    code: 'TPJ',
    nameEn: 'Tiruchirappalli',
    nameTa: 'திருச்சிராப்பள்ளி',
    headquartersEn: 'Tiruchirappalli',
    headquartersTa: 'திருச்சிராப்பள்ளி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tirunelveli',
    code: 'TNV',
    nameEn: 'Tirunelveli',
    nameTa: 'திருநெல்வேலி',
    headquartersEn: 'Tirunelveli',
    headquartersTa: 'திருநெல்வேலி',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tirupathur',
    code: 'TPT',
    nameEn: 'Tirupathur',
    nameTa: 'திருப்பத்தூர்',
    headquartersEn: 'Tirupathur',
    headquartersTa: 'திருப்பத்தூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tiruppur',
    code: 'TPR',
    nameEn: 'Tiruppur',
    nameTa: 'திருப்பூர்',
    headquartersEn: 'Tiruppur',
    headquartersTa: 'திருப்பூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tiruvallur',
    code: 'TVL',
    nameEn: 'Tiruvallur',
    nameTa: 'திருவள்ளூர்',
    headquartersEn: 'Tiruvallur',
    headquartersTa: 'திருவள்ளூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tiruvannamalai',
    code: 'TVM',
    nameEn: 'Tiruvannamalai',
    nameTa: 'திருவண்ணாமலை',
    headquartersEn: 'Tiruvannamalai',
    headquartersTa: 'திருவண்ணாமலை',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'tiruvarur',
    code: 'TVR',
    nameEn: 'Tiruvarur',
    nameTa: 'திருவாரூர்',
    headquartersEn: 'Tiruvarur',
    headquartersTa: 'திருவாரூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'vellore',
    code: 'VLR',
    nameEn: 'Vellore',
    nameTa: 'வேலூர்',
    headquartersEn: 'Vellore',
    headquartersTa: 'வேலூர்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'viluppuram',
    code: 'VLP',
    nameEn: 'Viluppuram',
    nameTa: 'விழுப்புரம்',
    headquartersEn: 'Viluppuram',
    headquartersTa: 'விழுப்புரம்',
    status: 'COMING_SOON',
    isPilot: false
  },
  {
    id: 'virudhunagar',
    code: 'VNR',
    nameEn: 'Virudhunagar',
    nameTa: 'விருதுநகர்',
    headquartersEn: 'Virudhunagar',
    headquartersTa: 'விருதுநகர்',
    status: 'COMING_SOON',
    isPilot: false
  }
];

export const TOTAL_DISTRICTS_COUNT = TAMIL_NADU_DISTRICTS.length; // 38
export const ACTIVE_PILOT_DISTRICT_CODE = 'MDU';
