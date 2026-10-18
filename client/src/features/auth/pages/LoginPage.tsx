import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = `${t('auth.login_title')} — PERUNDHU`;
  }, [t]);

  // If user is already authenticated, redirect to next onboarding destination or previous intended page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/onboarding';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};
