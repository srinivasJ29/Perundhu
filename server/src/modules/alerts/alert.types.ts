/**
 * PERUNDHU (பேருந்து) — Service Alert DTOs and Contracts
 */

import { AlertType, AlertSeverity } from '../../models/ServiceAlert';

export interface ServiceAlertDto {
  id: string;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  alertType: AlertType;
  severity: AlertSeverity;
  districtCode: string;
  affectedRouteNumbers: string[];
  affectedStandCodes?: string[];
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  sourceOrganization: string;
  sourceUrl?: string;
  verifiedAt: string;
}

export interface ListAlertsQuery {
  districtCode?: string;
  routeNumber?: string;
  severity?: AlertSeverity;
  alertType?: AlertType;
  isActive?: boolean;
}

