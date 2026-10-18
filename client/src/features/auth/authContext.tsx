import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserDto, UserRole } from '../../types/domain';
import { authService, LoginPayload, RegisterPayload } from '../../services/api/auth.service';
import { httpClient } from '../../services/api/client';
import { socketClientManager } from '../../services/socket/socketClient';
import { logger } from '../../lib/logger';

interface AuthContextValue {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (credentials: LoginPayload) => Promise<UserDto>;
  register: (payload: RegisterPayload) => Promise<UserDto>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// In-memory token reference for HTTP and Socket providers
let memoryAccessToken: string | null = null;

// Bind token providers immediately to HTTP and Socket clients
httpClient.setTokenProvider(() => memoryAccessToken);
socketClientManager.setTokenProvider(() => memoryAccessToken);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync memory token with state
  const updateToken = useCallback((token: string | null) => {
    memoryAccessToken = token;
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      logger.warn('Backend logout encountered error or session already expired', err);
    } finally {
      updateToken(null);
      setUser(null);
      socketClientManager.disconnect();
    }
  }, [updateToken]);

  /**
   * Initializes session via /auth/me or HttpOnly cookie refresh.
   */
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // First attempt to refresh token via HttpOnly cookie
      const refreshRes = await authService.refresh();
      if (refreshRes?.accessToken) {
        updateToken(refreshRes.accessToken);
        const me = await authService.getMe();
        setUser(me);
      }
    } catch {
      // Unauthenticated visitor is the expected standard state for passengers
      updateToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateToken]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (credentials: LoginPayload): Promise<UserDto> => {
      const result = await authService.login(credentials);
      updateToken(result.accessToken);
      setUser(result.user);
      return result.user;
    },
    [updateToken]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<UserDto> => {
      // 1. Create passenger account on backend
      await authService.register(payload);
      // 2. Automatically authenticate session with credentials
      const loginResult = await authService.login({
        email: payload.email,
        password: payload.password
      });
      updateToken(loginResult.accessToken);
      setUser(loginResult.user);
      return loginResult.user;
    },
    [updateToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      role: user?.role ?? null,
      login,
      register,
      logout,
      checkSession
    }),
    [user, accessToken, isLoading, login, register, logout, checkSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      login: async () => {
        throw new Error('useAuth must be used within an AuthProvider');
      },
      register: async () => {
        throw new Error('useAuth must be used within an AuthProvider');
      },
      logout: async () => {},
      checkSession: async () => {}
    };
  }
  return context;
}
