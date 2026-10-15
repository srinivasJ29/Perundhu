import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { getRefreshTokenCookieOptions } from './auth.tokens';
import { UnauthorizedError } from '../../common/errors';
import { env } from '../../config/env';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/login
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await authService.login(req.body, meta);

      // Set HttpOnly refresh token cookie
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!token) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const meta = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await authService.refresh(token, meta);

      // Rotate cookie
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      await authService.logout(token);

      // Clear cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: `${env.API_PREFIX}/auth`
      });

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/me
   */
  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await authService.getCurrentUser(userId);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/admin-check (Test/verification endpoint for RBAC)
   */
  public adminCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        message: 'Admin access verified',
        user: req.user
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
