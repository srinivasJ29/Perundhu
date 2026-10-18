import React from 'react';
import { cn } from '../../utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className,
  ...props
}) => {
  return (
    <div className={cn('alert', `alert-${variant}`, className)} role="alert" {...props}>
      {icon && <span style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</span>}
      <div style={{ flex: '1 1 auto' }}>
        {title && (
          <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
            {title}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
