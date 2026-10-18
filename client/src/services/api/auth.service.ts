import { httpClient } from './client';
import {
  UserDto,
  LoginResult,
  TokenRefreshResult
} from '../../types/domain';
import { ApiSuccessResponse } from '../../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<UserDto> {
    const res = await httpClient.post<ApiSuccessResponse<UserDto>>('/auth/register', payload, {
      skipAuth: true
    });
    return res.data;
  },

  async login(credentials: LoginPayload): Promise<LoginResult> {
    const res = await httpClient.post<ApiSuccessResponse<LoginResult>>('/auth/login', credentials, {
      skipAuth: true
    });
    return res.data;
  },

  async refresh(refreshToken?: string): Promise<TokenRefreshResult> {
    const res = await httpClient.post<ApiSuccessResponse<TokenRefreshResult>>(
      '/auth/refresh',
      refreshToken ? { refreshToken } : undefined,
      { skipAuth: true }
    );
    return res.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await httpClient.post<void>(
      '/auth/logout',
      refreshToken ? { refreshToken } : undefined
    );
  },

  async getMe(): Promise<UserDto> {
    const res = await httpClient.get<ApiSuccessResponse<UserDto>>('/auth/me');
    return res.data;
  }
};
