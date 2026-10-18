import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { cn } from '../../../utils/cn';

export interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  showIcon?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  error,
  helperText,
  id,
  className,
  showIcon = true,
  disabled,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();
  const inputId = id || `password-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="auth-field-group">
      <label htmlFor={inputId} className="form-label">
        {label}
      </label>

      <div className="auth-input-container">
        {showIcon && (
          <span className="auth-input-icon" aria-hidden="true">
            <Lock size={18} />
          </span>
        )}

        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          className={cn(
            'form-input',
            showIcon && 'auth-input-with-icon',
            'auth-input-with-toggle',
            error && 'form-input-error',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          disabled={disabled}
          {...props}
        />

        <button
          type="button"
          className="auth-password-toggle-btn"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={isVisible ? t('auth.hide_password') : t('auth.show_password')}
          title={isVisible ? t('auth.hide_password') : t('auth.show_password')}
        >
          {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>

      {error && (
        <span id={errorId} className="form-error-text" role="alert">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={helperId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
