import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, AlertCircle, CheckCircle2, UserPlus, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../authContext';
import { signupSchema, SignupFormData } from '../schemas/authSchemas';
import { PasswordField } from './PasswordField';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/Alert';
import { normalizeError } from '../../../lib/error';

interface SignupFormProps {
  onSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form input state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // Validation and server state
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormData, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate single field on blur or change
  const validateField = (field: keyof SignupFormData, updatedData = formData) => {
    const result = signupSchema.safeParse(updatedData);

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

  const handleBlur = (field: keyof SignupFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (touched[field as keyof SignupFormData]) {
      validateField(field as keyof SignupFormData, updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    // Validate entire form against Zod schema
    const validationResult = signupSchema.safeParse(formData);
    if (!validationResult.success) {
      const newErrors: Partial<Record<keyof SignupFormData, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof SignupFormData;
        if (!newErrors[fieldName]) {
          newErrors[fieldName] = t(issue.message);
        }
      });
      setErrors(newErrors);
      setTouched({
        fullName: true,
        email: true,
        phone: true,
        password: true,
        confirmPassword: true,
        agreeToTerms: true
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? formData.phone.trim() : undefined
      });

      // Clear password fields from memory
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setSuccessMessage(t('auth.signup_success_desc'));

      // Brief transition before proceeding to next onboarding stage
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/onboarding', { replace: true });
        }
      }, 700);
    } catch (err: unknown) {
      const appErr = normalizeError(err);

      if (appErr.statusCode === 409) {
        setServerError(t('auth.error_account_exists'));
      } else if (appErr.statusCode === 429) {
        setServerError(t('auth.error_rate_limited'));
      } else if (appErr.isNetworkError) {
        setServerError(t('auth.error_network'));
      } else {
        setServerError(appErr.message || t('auth.error_generic'));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Card Header */}
      <div className="auth-card-header">
        <div className="auth-header-badge" aria-hidden="true">
          <UserPlus size={22} />
        </div>
        <h1 className="auth-card-title">
          {t('auth.signup_title')}
        </h1>
        <p className="auth-card-subtitle">
          {t('auth.signup_subtitle')}
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <Alert
          variant="success"
          title={t('auth.signup_success_title')}
          icon={<CheckCircle2 size={18} />}
        >
          <span>{successMessage}</span>
        </Alert>
      )}

      {/* Server Error Alert Banner */}
      {serverError && (
        <Alert variant="error" icon={<AlertCircle size={18} />}>
          <span>{serverError}</span>
        </Alert>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name Field */}
        <div className="auth-field-group">
          <label htmlFor="signup-fullname" className="form-label">
            {t('auth.fullname_label')}
          </label>
          <div className="auth-input-container">
            <span className="auth-input-icon" aria-hidden="true">
              <User size={18} />
            </span>
            <input
              id="signup-fullname"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder={t('auth.fullname_placeholder')}
              autoComplete="name"
              required
              disabled={isSubmitting}
              className={`form-input auth-input-with-icon ${errors.fullName ? 'form-input-error' : ''}`}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'signup-fullname-error' : undefined}
            />
          </div>
          {errors.fullName && (
            <span id="signup-fullname-error" className="form-error-text" role="alert">
              {errors.fullName}
            </span>
          )}
        </div>

        {/* Email Address Field */}
        <div className="auth-field-group">
          <label htmlFor="signup-email" className="form-label">
            {t('auth.email_label')}
          </label>
          <div className="auth-input-container">
            <span className="auth-input-icon" aria-hidden="true">
              <Mail size={18} />
            </span>
            <input
              id="signup-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder={t('auth.email_placeholder')}
              autoComplete="email"
              required
              disabled={isSubmitting}
              className={`form-input auth-input-with-icon ${errors.email ? 'form-input-error' : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <span id="signup-email-error" className="form-error-text" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Optional Phone Number Field */}
        <div className="auth-field-group">
          <label htmlFor="signup-phone" className="form-label">
            {t('auth.phone_label')}
          </label>
          <div className="auth-input-container">
            <span className="auth-input-icon" aria-hidden="true">
              <Phone size={18} />
            </span>
            <input
              id="signup-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder={t('auth.phone_placeholder')}
              autoComplete="tel"
              disabled={isSubmitting}
              className={`form-input auth-input-with-icon ${errors.phone ? 'form-input-error' : ''}`}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'signup-phone-error' : undefined}
            />
          </div>
          {errors.phone && (
            <span id="signup-phone-error" className="form-error-text" role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        {/* Password Field */}
        <PasswordField
          id="signup-password"
          label={t('auth.password_label')}
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder={t('auth.password_placeholder')}
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={errors.password}
        />

        {/* Confirm Password Field */}
        <PasswordField
          id="signup-confirm-password"
          label={t('auth.confirm_password_label')}
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder={t('auth.confirm_password_placeholder')}
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={errors.confirmPassword}
        />

        {/* Agreement Checkbox */}
        <div className="auth-field-group">
          <label className="auth-checkbox-row" htmlFor="signup-terms">
            <input
              id="signup-terms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
              disabled={isSubmitting}
              className="auth-checkbox-input"
              aria-invalid={!!errors.agreeToTerms}
              aria-describedby={errors.agreeToTerms ? 'signup-terms-error' : undefined}
            />
            <span>{t('auth.terms_checkbox_label')}</span>
          </label>
          {errors.agreeToTerms && (
            <span id="signup-terms-error" className="form-error-text" role="alert">
              {errors.agreeToTerms}
            </span>
          )}
        </div>

        {/* Primary Action Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !!successMessage}
          className="auth-submit-btn"
          icon={!isSubmitting ? <UserPlus size={18} aria-hidden="true" /> : undefined}
        >
          {isSubmitting ? t('auth.creating_account') : t('auth.create_account_button')}
        </Button>
      </form>

      {/* Card Footer: Navigation to Login */}
      <div className="auth-card-footer">
        <div>
          <span>{t('auth.have_account')}</span>
          <Link to="/login" className="auth-switch-link">
            {t('auth.sign_in_link')}
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
