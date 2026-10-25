import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../authContext';
import { loginSchema, LoginFormData } from '../schemas/authSchemas';
import { PasswordField } from './PasswordField';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/Alert';
import { normalizeError } from '../../../lib/error';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form input state (passwords are in component memory only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Field validation and server error state
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = (field: keyof LoginFormData, value: string) => {
    const result = loginSchema.safeParse({
      email: field === 'email' ? value : email,
      password: field === 'password' ? value : password
    });

    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      setErrors((prev) => ({
        ...prev,
        [field]: issue ? t(issue.message) : undefined
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === 'email' ? email : password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    // Validate entire form against Zod schema
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const newErrors: { email?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof LoginFormData;
        if (!newErrors[fieldName]) {
          newErrors[fieldName] = t(issue.message);
        }
      });
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password
      });

      // Clear password from memory upon success
      setPassword('');

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to intended destination or onboarding
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/onboarding';
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const appErr = normalizeError(err);

      if (appErr.statusCode === 401) {
        setServerError(t('auth.error_invalid_credentials'));
      } else if (appErr.statusCode === 429) {
        setServerError(t('auth.error_rate_limited'));
      } else if (appErr.isNetworkError) {
        setServerError(t('auth.error_network'));
      } else {
        setServerError(appErr.message || t('auth.error_generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Card Header */}
      <div className="auth-card-header">
        <div className="auth-header-badge" aria-hidden="true">
          <LogIn size={22} />
        </div>
        <h1 className="auth-card-title">
          {t('auth.login_title')}
        </h1>
        <p className="auth-card-subtitle">
          {t('auth.login_subtitle')}
        </p>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <Alert variant="error" icon={<AlertCircle size={18} />}>
          <span>{serverError}</span>
        </Alert>
      )}

      {/* Quick Demo Credentials Autofill */}
      <div className="auth-demo-credentials-box">
        <span className="auth-demo-label">Demo Credentials:</span>
        <div className="auth-demo-buttons">
          <button
            type="button"
            className="auth-demo-chip"
            onClick={() => {
              setEmail('admin@tnstc.perundhu.gov.in');
              setPassword('PerundhuAdmin@2026');
              setErrors({});
            }}
            title="Fill Admin Credentials"
          >
            🛡️ Admin
          </button>
          <button
            type="button"
            className="auth-demo-chip"
            onClick={() => {
              setEmail('passenger@example.com');
              setPassword('Passenger@123');
              setErrors({});
            }}
            title="Fill Passenger Credentials"
          >
            👤 Passenger
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email Field */}
        <div className="auth-field-group">
          <label htmlFor="login-email" className="form-label">
            {t('auth.email_label')}
          </label>
          <div className="auth-input-container">
            <span className="auth-input-icon" aria-hidden="true">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  validateField('email', e.target.value);
                }
              }}
              onBlur={() => handleBlur('email')}
              placeholder={t('auth.email_placeholder')}
              autoComplete="email"
              required
              disabled={isSubmitting}
              className={`form-input auth-input-with-icon ${errors.email ? 'form-input-error' : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <span id="login-email-error" className="form-error-text" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Password Field */}
        <PasswordField
          id="login-password"
          label={t('auth.password_label')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched.password) {
              validateField('password', e.target.value);
            }
          }}
          onBlur={() => handleBlur('password')}
          placeholder={t('auth.password_placeholder')}
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          error={errors.password}
        />

        {/* Primary Action Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="auth-submit-btn"
          icon={!isSubmitting ? <LogIn size={18} aria-hidden="true" /> : undefined}
        >
          {isSubmitting ? t('auth.signing_in') : t('auth.sign_in_button')}
        </Button>
      </form>

      {/* Card Footer: Navigation to Signup */}
      <div className="auth-card-footer">
        <div>
          <span>{t('auth.no_account')}</span>
          <Link to="/signup" className="auth-switch-link">
            {t('auth.sign_up_link')}
          </Link>
        </div>
        <div className="auth-security-guarantee">
          <ShieldCheck size={14} style={{ color: 'var(--color-primary-teal)' }} />
          <span>TNSTC Citizen Transit Portal • 256-bit SSL Encrypted</span>
        </div>
      </div>
    </>
  );
};
