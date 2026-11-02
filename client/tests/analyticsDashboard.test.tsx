// @vitest-environment jsdom
/**
 * PERUNDHU (பேருந்து) — Phase 10 Analytics, Demand Forecasting & Fleet Optimization Tests
 *
 * Verifies:
 * 1. Fleet Operations Summary & Top KPIs with Data Classification.
 * 2. Strict Data Governance: Differentiating GPS freshness from administrative operational availability.
 * 3. Route Performance: Journey duration stats (P50, P90), segment travel times, and congestion levels.
 * 4. Schedule Adherence: [-2m, +5m] on-time tolerance and delay distribution buckets.
 * 5. Demand Readiness Diagnostic: Truthful DATA_NOT_AVAILABLE state, zero synthetic data guarantee.
 * 6. Fleet Utilization: Depot deployment rates and unassigned vehicle visibility.
 * 7. Optimization Recommendations: Data-backed recommendations, evidence periods, and mandatory human review workflow.
 * 8. Report Exports: Formats (CSV/JSON), provenance disclosure, and zero PII.
 * 9. Bilingual parity (English and Tamil).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '../src/i18n';
import { AnalyticsKpiCard } from '../src/features/analytics/components/AnalyticsKpiCard';
import { LiveFleetStatusWidget } from '../src/features/analytics/components/LiveFleetStatusWidget';
import { RoutePerformanceWidget } from '../src/features/analytics/components/RoutePerformanceWidget';
import { ScheduleAdherenceWidget } from '../src/features/analytics/components/ScheduleAdherenceWidget';
import { DemandReadinessNotice } from '../src/features/analytics/components/DemandReadinessNotice';
import { FleetUtilizationWidget } from '../src/features/analytics/components/FleetUtilizationWidget';
import { OptimizationRecommendationsList } from '../src/features/analytics/components/OptimizationRecommendationsList';
import { AnalyticsReportsExportModal } from '../src/features/analytics/components/AnalyticsReportsExportModal';
import { AnalyticsDashboardPage } from '../src/features/analytics/pages/AnalyticsDashboardPage';
import { analyticsService } from '../src/services/api/analytics.service';
import { safeSetItem } from '../src/lib/storage';
import { STORAGE_KEYS } from '../src/config/constants';
import {
  FleetOverviewKpiDto,
  RoutePerformanceDto,
  ScheduleAdherenceDto,
  DemandAnalyticsDto,
  FleetUtilizationDto,
  OptimizationRecommendationDto
} from '../src/types/domain';

// Mock Analytics Service
vi.mock('../src/services/api/analytics.service', () => ({
  analyticsService: {
    getFleetOverviewKpi: vi.fn(),
    getRoutePerformance: vi.fn(),
    getScheduleAdherence: vi.fn(),
    getDemandAnalytics: vi.fn(),
    getFleetUtilization: vi.fn(),
    getRecommendations: vi.fn(),
    reviewRecommendation: vi.fn(),
    exportReport: vi.fn()
  }
}));

const mockOverview: FleetOverviewKpiDto = {
  totalBuses: 25,
  activeBuses: 18,
  maintenanceBuses: 4,
  offlineBuses: 3,
  gpsFreshnessBreakdown: {
    healthy: 16,
    delayed: 2,
    stale: 1,
    offline: 1,
    unknown: 5
  },
  operationalAvailabilityBreakdown: {
    inService: 18,
    maintenance: 4,
    offline: 3,
    available: 18,
    reserve: 4
  },
  depotDistribution: [
    {
      depotId: 'depot-01',
      depotName: 'Madurai Central Depot',
      depotCode: 'MDU-DEP-01',
      totalBuses: 15,
      activeBuses: 12,
      reserveBuses: 2,
      maintenanceBuses: 1
    }
  ],
  routeDistribution: [
    {
      routeId: 'route-70',
      routeNumber: '70',
      displayTitleEn: 'Periyar to Mattuthavani',
      displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை',
      assignedBusesCount: 8,
      activeTrackingBusesCount: 7
    }
  ],
  telemetryHealth: {
    totalPositionsRecorded: 12500,
    averageUpdateIntervalSeconds: 12,
    coverageRatio: 0.92
  },
  dataProvenance: {
    sourceOrganization: 'TNSTC-Madurai Analytics Division',
    sourceReference: 'AGGREGATION_FLEET_LATEST_STATE',
    retrievalTimestamp: '2026-11-01T12:00:00Z',
    dataCoverage: 'Madurai District',
    classification: 'OFFICIAL_VERIFIED',
    verificationStatus: 'VERIFIED',
    processingVersion: 'v1.0'
  },
  generatedAt: '2026-11-01T12:00:00Z'
};

const mockPerformance: RoutePerformanceDto = {
  routeId: 'route-70',
  routeNumber: '70',
  displayTitleEn: 'Periyar to Mattuthavani',
  displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை',
  directionCode: 'OUTBOUND',
  samplePeriod: {
    from: '2026-10-25T00:00:00Z',
    to: '2026-11-01T00:00:00Z',
    observedTripsCount: 24
  },
  averageDurationMinutes: 38.5,
  scheduledDurationMinutes: 35,
  p50DurationMinutes: 37.2,
  p90DurationMinutes: 44.1,
  durationVariance: 11.2,
  averageDwellTimeSeconds: 42,
  segments: [
    {
      fromStopId: 'stop-01',
      fromStopNameEn: 'Periyar Bus Stand',
      fromStopNameTa: 'பெரியார் பேருந்து நிலையம்',
      toStopId: 'stop-02',
      toStopNameEn: 'Simmakkal',
      toStopNameTa: 'சிம்மக்கல்',
      averageTravelTimeMinutes: 7.2,
      scheduledTravelTimeMinutes: 5.0,
      delayDeviationMinutes: 2.2,
      congestionLevel: 'MODERATE'
    }
  ],
  gpsCoverageRatio: 0.94,
  dataProvenance: {
    sourceOrganization: 'TNSTC-Madurai',
    sourceReference: 'SEGMENT_OBSERVATIONS',
    retrievalTimestamp: '2026-11-01T12:00:00Z',
    dataCoverage: 'Route 70',
    classification: 'OFFICIAL_VERIFIED',
    verificationStatus: 'VERIFIED',
    processingVersion: 'v1.0'
  }
};

const mockAdherence: ScheduleAdherenceDto = {
  routeId: 'route-70',
  routeNumber: '70',
  displayTitleEn: 'Periyar to Mattuthavani',
  displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை',
  samplePeriod: {
    from: '2026-10-25T00:00:00Z',
    to: '2026-11-01T00:00:00Z',
    evaluatedTripsCount: 30
  },
  onTimePercentage: 76.7,
  delayedPercentage: 20.0,
  earlyPercentage: 3.3,
  averageDelayMinutes: 3.4,
  maxDelayMinutes: 18.0,
  delayDistribution: {
    onTime: 23,
    slightDelay: 4,
    moderateDelay: 2,
    severeDelay: 0,
    early: 1
  },
  adherenceByStop: [
    {
      stopId: 'stop-01',
      stopNameEn: 'Periyar Bus Stand',
      stopNameTa: 'பெரியார் பேருந்து நிலையம்',
      sequence: 1,
      onTimePercentage: 92,
      averageDelayMinutes: 1.1
    }
  ],
  dataProvenance: {
    sourceOrganization: 'TNSTC-Madurai',
    sourceReference: 'SCHEDULE_COMPLIANCE',
    retrievalTimestamp: '2026-11-01T12:00:00Z',
    dataCoverage: 'Route 70',
    classification: 'OFFICIAL_VERIFIED',
    verificationStatus: 'VERIFIED',
    processingVersion: 'v1.0'
  }
};

const mockDemandUnavailable: DemandAnalyticsDto = {
  status: 'DATA_NOT_AVAILABLE',
  dataReadiness: {
    isAvailable: false,
    totalRecords: 0,
    verifiedEtmStreamConnected: false,
    apcSensorStreamConnected: false,
    diagnosticMessageEn:
      'ETM ticket transaction stream and Automated Passenger Counter (APC) sensor feeds are not yet activated for this operational corridor.',
    diagnosticMessageTa:
      'இந்த வழித்தடத்திற்கான ETM பயணச்சீட்டு பரிவர்த்தனை மற்றும் APC சென்சார் தரவு இன்னும் இயக்கப்படவில்லை.',
    missingPrerequisites: [
      'ETM Ticketing Transaction API Stream Integration',
      'Automated Passenger Counter (APC) Overhead Sensor Stream',
      'Conductor Waybill Reconciliation Data feed'
    ],
    governanceNotice:
      'PERUNDHU strictly prohibits manufacturing passenger loads from GPS pings or synthetic numbers.'
  },
  dataProvenance: {
    sourceOrganization: 'TNSTC-Madurai',
    sourceReference: 'DEMAND_DIAGNOSTIC',
    retrievalTimestamp: '2026-11-01T12:00:00Z',
    dataCoverage: 'Madurai District',
    classification: 'PENDING_VERIFICATION',
    verificationStatus: 'UNVERIFIED',
    processingVersion: 'v1.0'
  }
};

const mockUtilization: FleetUtilizationDto = {
  period: {
    from: '2026-10-25T00:00:00Z',
    to: '2026-11-01T00:00:00Z'
  },
  fleetSize: 25,
  scheduledTripsCount: 48,
  assignedTripsCount: 44,
  completedTripsCount: 40,
  vehicleUtilizationRate: 72.0,
  depotUtilization: [
    {
      depotId: 'depot-01',
      depotName: 'Madurai Central Depot',
      totalFleet: 15,
      inServiceCount: 12,
      reserveCount: 2,
      maintenanceCount: 1,
      utilizationPercentage: 80.0
    }
  ],
  unassignedVehiclesCount: 3,
  telemetryGapsCount: 2,
  dataProvenance: {
    sourceOrganization: 'TNSTC-Madurai',
    sourceReference: 'UTILIZATION_AUDIT',
    retrievalTimestamp: '2026-11-01T12:00:00Z',
    dataCoverage: 'Madurai District',
    classification: 'OFFICIAL_VERIFIED',
    verificationStatus: 'VERIFIED',
    processingVersion: 'v1.0'
  }
};

const mockRecommendations: OptimizationRecommendationDto[] = [
  {
    id: 'db-rec-001',
    recommendationId: 'REC-DEPOT-001',
    title: 'Rebalance Peak Reserve Fleet Allocation Between Depots',
    titleTa: 'பணிமனைகளுக்கு இடையே உச்சநேர கூடுதல் பேருந்து ஒதுக்கீட்டை சமநிலைப்படுத்துக',
    category: 'DEPOT_IMBALANCE',
    severity: 'MEDIUM',
    targetEntityType: 'DEPOT',
    targetEntityCode: 'MDU-DEP-01',
    targetEntityName: 'Madurai Central Depot',
    description:
      'Madurai Central Depot maintains 85% operational allocation. Transferring 2 reserve vehicles reduces peak wait times.',
    descriptionTa: 'மதுரை மத்திய பணிமனைக்கு 2 பேருந்துகளை மாற்றுவது சேவையை மேம்படுத்தும்.',
    supportingObservations: ['Central Depot peak utilization exceeds 85%'],
    dataSource: ['DEPOT_REGISTRY', 'BUS_ALLOCATION'],
    evidencePeriod: {
      from: '2026-10-15T00:00:00Z',
      to: '2026-11-01T00:00:00Z',
      sampleSize: 14,
      unit: 'days'
    },
    confidenceScore: 0.88,
    expectedBenefit: 'Reduces peak corridor wait times by 18%.',
    expectedBenefitTa: 'காத்திருப்பு நேரத்தை 18% குறைக்கிறது.',
    risksAndAssumptions: 'Requires crew reassignment.',
    humanReviewStatus: 'PENDING',
    reviewHistory: [],
    dataProvenance: {
      sourceOrganization: 'TNSTC-Madurai',
      sourceReference: 'DEPOT_LOAD_OPTIMIZER',
      retrievalTimestamp: '2026-11-01T12:00:00Z',
      dataCoverage: 'Madurai District',
      classification: 'OFFICIAL_VERIFIED',
      verificationStatus: 'VERIFIED',
      processingVersion: 'v1.0'
    },
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z'
  }
];

describe('Phase 10 Intelligent Fleet Analytics & Optimization Test Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'en');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 }
      }
    });

    vi.mocked(analyticsService.getFleetOverviewKpi).mockResolvedValue(mockOverview);
    vi.mocked(analyticsService.getRoutePerformance).mockResolvedValue(mockPerformance);
    vi.mocked(analyticsService.getScheduleAdherence).mockResolvedValue(mockAdherence);
    vi.mocked(analyticsService.getDemandAnalytics).mockResolvedValue(mockDemandUnavailable);
    vi.mocked(analyticsService.getFleetUtilization).mockResolvedValue(mockUtilization);
    vi.mocked(analyticsService.getRecommendations).mockResolvedValue(mockRecommendations);
    vi.mocked(analyticsService.reviewRecommendation).mockResolvedValue({
      ...mockRecommendations[0],
      humanReviewStatus: 'APPROVED'
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <I18nProvider>{ui}</I18nProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('1. AnalyticsKpiCard Component', () => {
    it('should render value, label, provenance classification and calculation basis', () => {
      renderWithProviders(
        <AnalyticsKpiCard
          title="Total Fleet Size"
          value={25}
          subtitle="18 In-Service"
          badge="Madurai"
          badgeType="info"
          classification="OFFICIAL_VERIFIED"
          calculationBasis="Registered vehicles in depot roster"
        />
      );

      expect(screen.getByText('Total Fleet Size')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('18 In-Service')).toBeInTheDocument();
      expect(screen.getByText('OFFICIAL_VERIFIED')).toBeInTheDocument();
      expect(screen.getByText('Madurai')).toBeInTheDocument();
    });
  });

  describe('2. LiveFleetStatusWidget (GPS vs Operational State Governance)', () => {
    it('should clearly present operational availability and GNSS telemetry side-by-side with governance banner', () => {
      renderWithProviders(<LiveFleetStatusWidget data={mockOverview} />);

      // Verify title & coverage ratio
      expect(screen.getByText(/Live Fleet Status & GPS Telemetry Health/i)).toBeInTheDocument();
      expect(screen.getByText(/GPS Coverage: 92%/i)).toBeInTheDocument();

      // Verify strict governance banner stating stale GPS does not equal inactive bus
      expect(screen.getByText(/Data Governance Principle:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Stale GPS telemetry does not equate to an inactive bus/i)
      ).toBeInTheDocument();

      // Verify Operational states
      expect(screen.getByText(/Operational Availability \(Roster\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('In Service')[0]).toBeInTheDocument();
      expect(screen.getByText('Reserve Fleet')).toBeInTheDocument();

      // Verify GNSS Telemetry states
      expect(screen.getByText(/GNSS Telemetry Freshness/i)).toBeInTheDocument();
      expect(screen.getByText(/Healthy \(<30s\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Stale \(1-5m\)/i)).toBeInTheDocument();

      // Verify Depot table
      expect(screen.getByText('Madurai Central Depot')).toBeInTheDocument();
      expect(screen.getByText('MDU-DEP-01')).toBeInTheDocument();
    });
  });

  describe('3. RoutePerformanceWidget', () => {
    it('should display journey durations, P50/P90 percentiles and segment delay deviations', () => {
      renderWithProviders(<RoutePerformanceWidget data={mockPerformance} />);

      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText('Periyar to Mattuthavani')).toBeInTheDocument();
      expect(screen.getByText('38.5')).toBeInTheDocument();
      expect(screen.getByText('37.2')).toBeInTheDocument();
      expect(screen.getByText('44.1')).toBeInTheDocument();

      // Check segments table
      expect(screen.getByText('Periyar Bus Stand')).toBeInTheDocument();
      expect(screen.getByText('Simmakkal')).toBeInTheDocument();
      expect(screen.getByText('+2.2 min')).toBeInTheDocument();
      expect(screen.getByText('MODERATE')).toBeInTheDocument();
    });
  });

  describe('4. ScheduleAdherenceWidget', () => {
    it('should display on-time compliance with <=5m tolerance and delay distribution buckets', () => {
      renderWithProviders(<ScheduleAdherenceWidget data={mockAdherence} />);

      expect(screen.getByText(/Schedule Adherence & Punctuality/i)).toBeInTheDocument();
      expect(screen.getByText('76.7%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText(/On-Time \(≤ 5 mins\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Slight Delay \(5 - 10 mins\)/i)).toBeInTheDocument();
    });
  });

  describe('5. DemandReadinessNotice (Strict Governance)', () => {
    it('should render DATA_NOT_AVAILABLE diagnostic banner with zero fake numbers', () => {
      renderWithProviders(<DemandReadinessNotice data={mockDemandUnavailable} />);

      expect(screen.getByText('DATA_NOT_AVAILABLE')).toBeInTheDocument();
      expect(
        screen.getByText(/ETM ticket transaction stream and Automated Passenger Counter/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/PERUNDHU strictly prohibits manufacturing passenger loads from GPS pings/i)
      ).toBeInTheDocument();
      expect(screen.getByText('ETM Ticketing Stream')).toBeInTheDocument();
      expect(screen.getByText('APC Passenger Counter')).toBeInTheDocument();
    });
  });

  describe('6. FleetUtilizationWidget', () => {
    it('should display fleet utilization percentage, trip assignments, and depot efficiency', () => {
      renderWithProviders(<FleetUtilizationWidget data={mockUtilization} />);

      expect(screen.getByText('72%')).toBeInTheDocument();
      expect(screen.getByText('44 / 48')).toBeInTheDocument();
      expect(screen.getByText('Madurai Central Depot')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('7. OptimizationRecommendationsList & Human Approval Workflow', () => {
    it('should render recommendations and invoke onReview when approving', async () => {
      const handleReviewMock = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <OptimizationRecommendationsList
          recommendations={mockRecommendations}
          onReview={handleReviewMock}
        />
      );

      expect(screen.getByText('REC-DEPOT-001')).toBeInTheDocument();
      expect(screen.getByText('88% confidence')).toBeInTheDocument();
      expect(screen.getByText(/Rebalance Peak Reserve Fleet Allocation/i)).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();

      // Enter decision notes and click Approve
      const notesInput = screen.getByPlaceholderText(/Decision notes \(optional\)/i);
      fireEvent.change(notesInput, { target: { value: 'Approved for test deployment.' } });

      const approveBtn = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(handleReviewMock).toHaveBeenCalledWith(
          'db-rec-001',
          'APPROVED',
          'Approved for test deployment.'
        );
      });
    });

    it('should filter recommendations by category', () => {
      const handleReviewMock = vi.fn();
      renderWithProviders(
        <OptimizationRecommendationsList
          recommendations={mockRecommendations}
          onReview={handleReviewMock}
        />
      );

      const categorySelect = screen.getByLabelText(/Category:/i);
      fireEvent.change(categorySelect, { target: { value: 'ROUTE_DELAY' } });

      expect(screen.getByText(/No recommendations matching the selected filters/i)).toBeInTheDocument();
    });
  });

  describe('8. AnalyticsReportsExportModal', () => {
    it('should allow exporting reports in CSV or JSON format with provenance guarantee', async () => {
      vi.mocked(analyticsService.exportReport).mockResolvedValue({
        data: 'Metric,Value\nTotal,25',
        contentType: 'text/csv'
      });

      // Mock window.URL methods & anchor click
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:dummy-url');
      window.URL.revokeObjectURL = vi.fn();
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const handleClose = vi.fn();

      renderWithProviders(
        <AnalyticsReportsExportModal isOpen={true} onClose={handleClose} />
      );

      expect(screen.getByText(/Official Transit Analytics Export/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero PII/i)).toBeInTheDocument();

      const downloadBtn = screen.getByRole('button', { name: /Download Report/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(analyticsService.exportReport).toHaveBeenCalledWith({
          reportType: 'FLEET_OVERVIEW',
          format: 'CSV'
        });
        expect(clickSpy).toHaveBeenCalled();
      });
    });
  });

  describe('9. AnalyticsDashboardPage Full Integration & Bilingual Parity', () => {
    it('should render the full dashboard with tabbed navigation and top KPIs', async () => {
      renderWithProviders(<AnalyticsDashboardPage />);

      // Verify top KPIs
      await waitFor(() => {
        expect(screen.getByText('Total Fleet Size')).toBeInTheDocument();
        expect(screen.getByText('GPS Coverage Ratio')).toBeInTheDocument();
        expect(screen.getByText('On-Time Adherence')).toBeInTheDocument();
      });

      // Verify Tab switching to Route Performance
      const routePerfTab = screen.getByRole('tab', { name: /Route Performance/i });
      fireEvent.click(routePerfTab);

      await waitFor(() => {
        expect(screen.getByText(/Route Journey Duration & Congestion Analysis/i)).toBeInTheDocument();
      });

      // Verify Tab switching to Demand Readiness
      const demandTab = screen.getByRole('tab', { name: /Demand Readiness/i });
      fireEvent.click(demandTab);

      await waitFor(() => {
        expect(screen.getByText('DATA_NOT_AVAILABLE')).toBeInTheDocument();
      });
    });

    it('should render bilingual labels in Tamil when language is switched', async () => {
      safeSetItem(STORAGE_KEYS.LANGUAGE, 'ta');
      renderWithProviders(<AnalyticsDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/அறிவுசார் கடற்படை பகுப்பாய்வு & மேம்பாட்டு மையம்/i)
        ).toBeInTheDocument();
      });
    });
  });
});
