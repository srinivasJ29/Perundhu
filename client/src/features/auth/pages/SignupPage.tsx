import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';

export const SignupPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('auth.signup_title')} — PERUNDHU`;
  }, [t]);

  // If already authenticated, redirect to next onboarding destination
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};
