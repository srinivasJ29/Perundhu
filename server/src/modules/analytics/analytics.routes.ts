import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Secure all analytics endpoints under RBAC (ADMIN)
router.use(authenticate);
router.use(requireRole('ADMIN'));

// 1. Live Fleet Operations Summary & KPIs
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));

// 2. Route Performance Analytics
router.get('/routes/performance', (req, res, next) =>
  analyticsController.getRoutePerformance(req, res, next)
);

// 3. Schedule Adherence Analytics
router.get('/routes/schedule-adherence', (req, res, next) =>
  analyticsController.getScheduleAdherence(req, res, next)
);

// 4. Passenger Demand Analytics (With strict governance data readiness)
router.get('/demand', (req, res, next) => analyticsController.getDemand(req, res, next));

// 5. Fleet Utilization Analytics
router.get('/fleet/utilization', (req, res, next) =>
  analyticsController.getFleetUtilization(req, res, next)
);

// 6. Intelligent Fleet Optimization Recommendations
router.get('/recommendations', (req, res, next) =>
  analyticsController.getRecommendations(req, res, next)
);

// 7. Human Review of Recommendations
router.patch('/recommendations/:id/review', (req, res, next) =>
  analyticsController.reviewRecommendation(req, res, next)
);

// 8. Reports Generation and CSV/JSON Export
router.get('/reports/export', (req, res, next) =>
  analyticsController.exportReport(req, res, next)
);

export const analyticsRouter = router;
