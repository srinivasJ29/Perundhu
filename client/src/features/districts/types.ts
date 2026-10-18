/**
 * PERUNDHU (பேருந்து) — District Domain Types (Step 4)
 */

export type DistrictAvailability = 'AVAILABLE' | 'COMING_SOON' | 'UNAVAILABLE' | 'UNKNOWN';

export interface DistrictItem {
  /** Stable unique identifier (e.g. 'madurai', 'chennai') */
  id: string;
  /** Official district abbreviation code (e.g. 'MDU', 'CHN') */
  code: string;
  /** Standard English name (matching the 38 official districts) */
  nameEn: string;
  /** Standard Tamil name (தமிழ்) */
  nameTa: string;
  /** District headquarters in English */
  headquartersEn: string;
  /** District headquarters in Tamil */
  headquartersTa: string;
  /** Application availability state */
  status: DistrictAvailability;
  /** Flag indicating initial surveyed pilot corridor */
  isPilot: boolean;
  /** Reconciled MongoDB ObjectId from backend when loaded */
  backendId?: string;
  /** Total verified bus stands in database if known */
  totalBusStands?: number;
}

export interface DistrictFilterOptions {
  query?: string;
  statusFilter?: DistrictAvailability | 'ALL';
}
