/**
 * PERUNDHU (பேருந்து) — Application Constants
 */

export const APP_NAME_EN = 'PERUNDHU';
export const APP_NAME_TA = 'பேருந்து';
export const APP_TAGLINE_EN = 'TNSTC Live Bus Tracking System';
export const APP_TAGLINE_TA = 'தமிழ்நாடு அரசுப் போக்குவரத்துக் கழக நேரலை பேருந்து கண்காணிப்பு';

export const STORAGE_KEYS = {
  LANGUAGE: 'perundhu:pref:language',
  AUTH_TOKEN: 'perundhu:session:access_token',
  SELECTED_DISTRICT: 'perundhu:pref:district',
  SELECTED_ROUTE: 'perundhu:pref:route',
  SELECTED_DIRECTION: 'perundhu:pref:direction',
  RECENT_SEARCHES: 'perundhu:pref:recent_searches'
} as const;

export const SUPPORTED_LANGUAGES = ['ta', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ta'; // Tamil default for citizens

// Verified Madurai Pilot Parameters
export const PILOT_CONFIG = {
  DISTRICT_NAME_EN: 'Madurai',
  DISTRICT_NAME_TA: 'மதுரை',
  PILOT_ROUTES: ['70', '77'],
  PILOT_BUS_STANDS: ['Periyar', 'Mattuthavani', 'Arappalayam']
} as const;

// Geographic bounding box for Tamil Nadu (WGS84 validation)
export const TAMIL_NADU_BOUNDS = {
  MIN_LAT: 8.0,
  MAX_LAT: 13.5,
  MIN_LNG: 76.2,
  MAX_LNG: 80.35
} as const;

// Center coordinates for Madurai pilot corridor [lat, lng]
export const MADURAI_CENTER_COORDINATES: [number, number] = [9.9252, 78.1198];

// Socket reconnect and rate limit configuration
export const REALTIME_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL_MS: 3000,
  PING_TIMEOUT_MS: 20000,
  MAX_CONCURRENT_ROOMS: 15
} as const;
