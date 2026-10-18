import { STORAGE_KEYS, PILOT_CONFIG } from '../config/constants';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/storage';

export interface DistrictPreference {
  districtId?: string;
  nameEn: string;
  nameTa: string;
}

const DEFAULT_DISTRICT_PREFERENCE: DistrictPreference = {
  nameEn: PILOT_CONFIG.DISTRICT_NAME_EN,
  nameTa: PILOT_CONFIG.DISTRICT_NAME_TA
};

export const userPreferences = {
  getSelectedDistrict(): DistrictPreference {
    return safeGetItem<DistrictPreference>(
      STORAGE_KEYS.SELECTED_DISTRICT,
      DEFAULT_DISTRICT_PREFERENCE
    );
  },

  setSelectedDistrict(pref: DistrictPreference): void {
    safeSetItem(STORAGE_KEYS.SELECTED_DISTRICT, pref);
  },

  clearPreferences(): void {
    safeRemoveItem(STORAGE_KEYS.SELECTED_DISTRICT);
    safeRemoveItem(STORAGE_KEYS.RECENT_SEARCHES);
  }
};
