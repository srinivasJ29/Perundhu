import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireRole } from './auth.middleware';
import { authLimiter } from './auth.limiter';
import { validate } from '../../common/validation';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation';

const router = Router();

// Public Authentication Endpoints (Rate Limited)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

// Authenticated Endpoints
router.get('/me', authenticate, authController.me);

// Role-Guarded Test / Verification Endpoint
router.get('/admin-check', authenticate, requireRole('ADMIN'), authController.adminCheck);

export const authRoutes = router;
