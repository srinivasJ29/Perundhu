/**
 * PERUNDHU (பேருந்து) — Service Alert Business Service
 * Provides queries for official transit notices, service alerts, and disruption advisories.
 */

import { ServiceAlert } from '../../models/ServiceAlert';
import { ServiceAlertDto, ListAlertsQuery } from './alert.types';

export class AlertService {
  /**
   * Retrieves active, verified transit alerts matching criteria.
   */
  public async getAlerts(query: ListAlertsQuery = {}): Promise<ServiceAlertDto[]> {
    const filter: Record<string, any> = {};

    if (query.districtCode) {
      filter.districtCode = query.districtCode.toUpperCase();
    }

    if (query.routeNumber) {
      filter.affectedRouteNumbers = query.routeNumber;
    }

    if (query.severity) {
      filter.severity = query.severity;
    }

    if (query.alertType) {
      filter.alertType = query.alertType;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    } else {
      // Default to active alerts whose validity period includes right now
      const now = new Date();
      filter.isActive = true;
      filter.effectiveFrom = { $lte: now };
      filter.effectiveUntil = { $gte: now };
    }

    const docs = await ServiceAlert.find(filter)
      .sort({ severity: -1, effectiveFrom: -1 })
      .lean();

    return docs.map(this.mapToDto);
  }

  /**
   * Retrieves a single alert by ID.
   */
  public async getAlertById(id: string): Promise<ServiceAlertDto | null> {
    const doc = await ServiceAlert.findById(id).lean();
    return doc ? this.mapToDto(doc) : null;
  }

  private mapToDto(doc: any): ServiceAlertDto {
    return {
      id: doc._id.toString(),
      titleEn: doc.titleEn,
      titleTa: doc.titleTa,
      descriptionEn: doc.descriptionEn,
      descriptionTa: doc.descriptionTa,
      alertType: doc.alertType,
      severity: doc.severity,
      districtCode: doc.districtCode,
      affectedRouteNumbers: doc.affectedRouteNumbers || [],
      affectedStandCodes: doc.affectedStandCodes || [],
      effectiveFrom: doc.effectiveFrom.toISOString(),
      effectiveUntil: doc.effectiveUntil.toISOString(),
      isActive: doc.isActive,
      sourceOrganization: doc.sourceOrganization,
      sourceUrl: doc.sourceUrl,
      verifiedAt: doc.verifiedAt.toISOString()
    };
  }
}

export const alertService = new AlertService();
