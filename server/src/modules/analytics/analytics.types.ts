import { IDataProvenance, DataClassification } from '../../models/DataProvenance';
import { RecommendationCategory, RecommendationSeverity, HumanReviewStatus, TargetEntityType, IReviewHistoryItem } from '../../models/OptimizationRecommendation';

export { DataClassification, RecommendationCategory, RecommendationSeverity, HumanReviewStatus, TargetEntityType, IReviewHistoryItem };

export interface FleetOverviewKpiDto {
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  offlineBuses: number;
  gpsFreshnessBreakdown: {
    healthy: number;
    delayed: number;
    stale: number;
    offline: number;
    unknown: number;
  };
  operationalAvailabilityBreakdown: {
    inService: number;
    maintenance: number;
    offline: number;
    available: number;
    reserve: number;
  };
  depotDistribution: Array<{
    depotId: string;
    depotName: string;
    depotCode: string;
    totalBuses: number;
    activeBuses: number;
    reserveBuses: number;
    maintenanceBuses: number;
  }>;
  routeDistribution: Array<{
    routeId: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
    assignedBusesCount: number;
    activeTrackingBusesCount: number;
  }>;
  telemetryHealth: {
    totalPositionsRecorded: number;
    averageUpdateIntervalSeconds: number;
    coverageRatio: number;
  };
  dataProvenance: IDataProvenance;
  generatedAt: string;
}

export interface RoutePerformanceDto {
  routeId: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  directionCode: string;
  samplePeriod: {
    from: string;
    to: string;
    observedTripsCount: number;
  };
  averageDurationMinutes: number;
  scheduledDurationMinutes: number;
  p50DurationMinutes: number;
  p90DurationMinutes: number;
  durationVariance: number;
  averageDwellTimeSeconds: number;
  segments: Array<{
    fromStopId: string;
    fromStopNameEn: string;
    fromStopNameTa: string;
    toStopId: string;
    toStopNameEn: string;
    toStopNameTa: string;
    averageTravelTimeMinutes: number;
    scheduledTravelTimeMinutes: number;
    delayDeviationMinutes: number;
    congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CONGESTED';
  }>;
  gpsCoverageRatio: number;
  dataProvenance: IDataProvenance;
}

export interface ScheduleAdherenceDto {
  routeId: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  samplePeriod: {
    from: string;
    to: string;
    evaluatedTripsCount: number;
  };
  onTimePercentage: number;
  delayedPercentage: number;
  earlyPercentage: number;
  averageDelayMinutes: number;
  maxDelayMinutes: number;
  delayDistribution: {
    onTime: number;
    slightDelay: number;
    moderateDelay: number;
    severeDelay: number;
    early: number;
  };
  adherenceByStop: Array<{
    stopId: string;
    stopNameEn: string;
    stopNameTa: string;
    sequence: number;
    onTimePercentage: number;
    averageDelayMinutes: number;
  }>;
  dataProvenance: IDataProvenance;
}

export interface DemandAnalyticsDto {
  status: 'DATA_AVAILABLE' | 'DATA_NOT_AVAILABLE';
  dataReadiness: {
    isAvailable: boolean;
    totalRecords: number;
    verifiedEtmStreamConnected: boolean;
    apcSensorStreamConnected: boolean;
    diagnosticMessageEn: string;
    diagnosticMessageTa: string;
    missingPrerequisites: string[];
    governanceNotice: string;
  };
  summary?: {
    totalBoardings: number;
    totalAlightings: number;
    busiestStop?: {
      stopId: string;
      stopNameEn: string;
      stopNameTa: string;
      boardings: number;
    };
    peakHour?: {
      hour: number;
      label: string;
      boardings: number;
    };
  };
  hourlyPattern?: Array<{
    hour: number;
    label: string;
    boardings: number;
    alightings: number;
  }>;
  stopDemand?: Array<{
    stopId: string;
    stopNameEn: string;
    stopNameTa: string;
    boardings: number;
    alightings: number;
  }>;
  dataProvenance: IDataProvenance;
}

export interface FleetUtilizationDto {
  period: {
    from: string;
    to: string;
  };
  fleetSize: number;
  scheduledTripsCount: number;
  assignedTripsCount: number;
  completedTripsCount: number;
  vehicleUtilizationRate: number;
  depotUtilization: Array<{
    depotId: string;
    depotName: string;
    totalFleet: number;
    inServiceCount: number;
    reserveCount: number;
    maintenanceCount: number;
    utilizationPercentage: number;
  }>;
  unassignedVehiclesCount: number;
  telemetryGapsCount: number;
  dataProvenance: IDataProvenance;
}

export interface OptimizationRecommendationDto {
  id: string;
  recommendationId: string;
  title: string;
  titleTa: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  targetEntityType: TargetEntityType;
  targetEntityId?: string;
  targetEntityCode?: string;
  targetEntityName?: string;
  description: string;
  descriptionTa: string;
  supportingObservations: string[];
  dataSource: string[];
  evidencePeriod: {
    from: string;
    to: string;
    sampleSize: number;
    unit: string;
  };
  confidenceScore: number;
  expectedBenefit: string;
  expectedBenefitTa: string;
  risksAndAssumptions: string;
  humanReviewStatus: HumanReviewStatus;
  reviewHistory: Array<{
    status: HumanReviewStatus;
    reviewedBy: string;
    reviewerRole: string;
    decisionNotes?: string;
    timestamp: string;
  }>;
  appliedAction?: {
    isApplied: boolean;
    appliedAt?: string;
    appliedBy?: string;
    appliedNotes?: string;
  };
  dataProvenance: IDataProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecommendationInput {
  status: HumanReviewStatus;
  decisionNotes?: string;
}

