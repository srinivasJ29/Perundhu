import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyticsService
} from '../../../services/api/analytics.service';
import { ManagementNav } from '../../management/components/ManagementNav';
import { AnalyticsKpiCard } from '../components/AnalyticsKpiCard';
import { LiveFleetStatusWidget } from '../components/LiveFleetStatusWidget';
import { RoutePerformanceWidget } from '../components/RoutePerformanceWidget';
import { ScheduleAdherenceWidget } from '../components/ScheduleAdherenceWidget';
import { DemandReadinessNotice } from '../components/DemandReadinessNotice';
import { FleetUtilizationWidget } from '../components/FleetUtilizationWidget';
import { OptimizationRecommendationsList } from '../components/OptimizationRecommendationsList';
import { AnalyticsReportsExportModal } from '../components/AnalyticsReportsExportModal';
import { useLanguage } from '../../../hooks/useLanguage';
import { HumanReviewStatus } from '../../../types/domain';
import {
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Bus,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import '../styles/analytics.css';

type AnalyticsTab =
  | 'OVERVIEW'
  | 'ROUTE_PERFORMANCE'
  | 'SCHEDULE_ADHERENCE'
  | 'DEMAND'
  | 'UTILIZATION'
  | 'RECOMMENDATIONS';

export const AnalyticsDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('OVERVIEW');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsService.getFleetOverviewKpi()
  });

  const routePerfQuery = useQuery({
    queryKey: ['analytics', 'route-performance'],
    queryFn: () => analyticsService.getRoutePerformance()
  });

  const adherenceQuery = useQuery({
    queryKey: ['analytics', 'schedule-adherence'],
    queryFn: () => analyticsService.getScheduleAdherence()
  });

  const demandQuery = useQuery({
    queryKey: ['analytics', 'demand'],
    queryFn: () => analyticsService.getDemandAnalytics()
  });

  const utilizationQuery = useQuery({
    queryKey: ['analytics', 'fleet-utilization'],
    queryFn: () => analyticsService.getFleetUtilization()
  });

  const recsQuery = useQuery({
    queryKey: ['analytics', 'recommendations'],
    queryFn: () => analyticsService.getRecommendations()
  });

  // Mutation for Human Review of Recommendations
  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes
    }: {
      id: string;
      status: HumanReviewStatus;
      notes?: string;
    }) => analyticsService.reviewRecommendation(id, { status, decisionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'recommendations'] });
    }
  });

  const handleReview = async (id: string, status: HumanReviewStatus, notes?: string) => {
    await reviewMutation.mutateAsync({ id, status, notes });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const kpis = overviewQuery.data;
  const adherence = adherenceQuery.data;

  return (
    <div className="analytics-page-container" data-testid="analytics-dashboard-page">
      <ManagementNav />

      {/* Page Header */}
      <div className="analytics-header">
        <div className="title-area">
          <h1>
            {isTa
              ? 'அறிவுசார் கடற்படை பகுப்பாய்வு & மேம்பாட்டு மையம்'
              : 'Intelligent Fleet Analytics & Optimization Hub'}
          </h1>
          <p>
            {isTa
              ? 'மதுரை மண்டல பொதுப்போக்குவரத்து நேரலை இயக்கத் திறன் மற்றும் அட்டவணை சீரமைப்பு'
              : 'Madurai Pilot District — Real-time Operations, Telemetry Health & AI Timetable Optimization'}
          </p>
        </div>

        <div className="analytics-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            title={isTa ? 'புதுப்பி' : 'Refresh Data'}
          >
            <RefreshCw size={14} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download size={14} />
            <span>{isTa ? 'அறிக்கை பதிவிறக்கம்' : 'Export Reports'}</span>
          </button>
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <div className="analytics-kpi-grid">
        <AnalyticsKpiCard
          title={isTa ? 'மொத்த கடற்படை' : 'Total Fleet Size'}
          value={kpis ? kpis.totalBuses : '—'}
          subtitle={
            kpis
              ? `${kpis.activeBuses} ${isTa ? 'சேவையில் உள்ளவை' : 'Active In-Service'}`
              : undefined
          }
          badge={kpis ? `${kpis.depotDistribution.length} Depots` : undefined}
          badgeType="info"
          icon={<Bus size={18} />}
          classification="OFFICIAL_VERIFIED"
          calculationBasis="Madurai Division registered vehicle registry"
        />

        <AnalyticsKpiCard
          title={isTa ? 'ஜிபிஎஸ் பரப்பு விகிதம்' : 'GPS Coverage Ratio'}
          value={kpis ? `${(kpis.telemetryHealth.coverageRatio * 100).toFixed(0)}%` : '—'}
          subtitle={
            kpis
              ? `${kpis.gpsFreshnessBreakdown.healthy} ${isTa ? 'சீரான சிக்னல்' : 'Healthy Telemetry'}`
              : undefined
          }
          badge={kpis?.telemetryHealth.coverageRatio && kpis.telemetryHealth.coverageRatio > 0.8 ? 'Optimal' : 'Needs Sync'}
          badgeType={kpis?.telemetryHealth.coverageRatio && kpis.telemetryHealth.coverageRatio > 0.8 ? 'success' : 'warning'}
          icon={<Radio size={18} />}
          classification="OFFICIAL_VERIFIED"
          calculationBasis="Active GNSS pings received within 30 seconds"
        />

        <AnalyticsKpiCard
          title={isTa ? 'நேரந்தவறாமை விகிதம்' : 'On-Time Adherence'}
          value={adherence ? `${adherence.onTimePercentage}%` : '—'}
          subtitle={
            adherence
              ? `${isTa ? 'சராசரி தாமதம்:' : 'Avg Delay:'} +${adherence.averageDelayMinutes} mins`
              : undefined
          }
          badge="≤5m Tolerance"
          badgeType="success"
          icon={<CheckCircle2 size={18} />}
          classification="OFFICIAL_VERIFIED"
          calculationBasis="ScheduledTrip vs StopEvent timestamps within -2m to +5m"
        />

        <AnalyticsKpiCard
          title={isTa ? 'மேம்பாட்டு பரிந்துரைகள்' : 'Pending AI Actions'}
          value={recsQuery.data ? recsQuery.data.filter((r) => r.humanReviewStatus === 'PENDING').length : '—'}
          subtitle={isTa ? 'மனித ஒப்புதலுக்காக காத்திருப்பவை' : 'Awaiting Administrative Review'}
          badge="Human-in-Loop"
          badgeType="warning"
          icon={<Sliders size={18} />}
          classification="OFFICIAL_VERIFIED"
          calculationBasis="Generated via route chokepoints and depot reserve balance"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="analytics-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'OVERVIEW'}
          className={`analytics-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          <Bus size={16} />
          <span>{isTa ? 'கடற்படை & ஜிபிஎஸ் நிலை' : 'Fleet & Telemetry Health'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ROUTE_PERFORMANCE'}
          className={`analytics-tab-btn ${activeTab === 'ROUTE_PERFORMANCE' ? 'active' : ''}`}
          onClick={() => setActiveTab('ROUTE_PERFORMANCE')}
        >
          <TrendingUp size={16} />
          <span>{isTa ? 'வழித்தட பயண நேரம்' : 'Route Performance'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'SCHEDULE_ADHERENCE'}
          className={`analytics-tab-btn ${activeTab === 'SCHEDULE_ADHERENCE' ? 'active' : ''}`}
          onClick={() => setActiveTab('SCHEDULE_ADHERENCE')}
        >
          <Clock size={16} />
          <span>{isTa ? 'நேரந்தவறாமை' : 'Schedule Adherence'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'DEMAND'}
          className={`analytics-tab-btn ${activeTab === 'DEMAND' ? 'active' : ''}`}
          onClick={() => setActiveTab('DEMAND')}
        >
          <ShieldCheck size={16} />
          <span>{isTa ? 'பயணிகள் தேவை & தயார்நிலை' : 'Demand Readiness'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'UTILIZATION'}
          className={`analytics-tab-btn ${activeTab === 'UTILIZATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('UTILIZATION')}
        >
          <BarChart3 size={16} />
          <span>{isTa ? 'பணிமனை பயன்பாடு' : 'Depot Utilization'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'RECOMMENDATIONS'}
          className={`analytics-tab-btn ${activeTab === 'RECOMMENDATIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('RECOMMENDATIONS')}
        >
          <Sliders size={16} />
          <span>{isTa ? 'மேம்பாட்டுப் பரிந்துரைகள்' : 'Optimization Recommendations'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="analytics-tab-content">
        {activeTab === 'OVERVIEW' && (
          <>
            {overviewQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading fleet status...'}</div>}
            {overviewQuery.data && <LiveFleetStatusWidget data={overviewQuery.data} />}
          </>
        )}

        {activeTab === 'ROUTE_PERFORMANCE' && (
          <>
            {routePerfQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading route performance...'}</div>}
            {routePerfQuery.data && <RoutePerformanceWidget data={routePerfQuery.data} />}
          </>
        )}

        {activeTab === 'SCHEDULE_ADHERENCE' && (
          <>
            {adherenceQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading adherence metrics...'}</div>}
            {adherenceQuery.data && <ScheduleAdherenceWidget data={adherenceQuery.data} />}
          </>
        )}

        {activeTab === 'DEMAND' && (
          <>
            {demandQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading demand status...'}</div>}
            {demandQuery.data && <DemandReadinessNotice data={demandQuery.data} />}
          </>
        )}

        {activeTab === 'UTILIZATION' && (
          <>
            {utilizationQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading utilization...'}</div>}
            {utilizationQuery.data && <FleetUtilizationWidget data={utilizationQuery.data} />}
          </>
        )}

        {activeTab === 'RECOMMENDATIONS' && (
          <>
            {recsQuery.isLoading && <div className="loading-spinner">{isTa ? 'ஏற்றுகிறது...' : 'Loading recommendations...'}</div>}
            {recsQuery.data && (
              <OptimizationRecommendationsList
                recommendations={recsQuery.data}
                onReview={handleReview}
                isLoading={reviewMutation.isPending}
              />
            )}
          </>
        )}
      </div>

      {/* Export Reports Modal */}
      <AnalyticsReportsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
