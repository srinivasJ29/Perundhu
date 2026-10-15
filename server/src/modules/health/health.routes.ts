import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

router.get('/health', (req, res) => healthController.getHealth(req, res));
router.get('/ready', (req, res) => healthController.getReadiness(req, res));

export const healthRoutes = router;
