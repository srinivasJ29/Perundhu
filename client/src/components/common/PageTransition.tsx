/**
 * PERUNDHU (பேருந்து) — Advanced Page Transition Container
 * Wraps page content with spatial cubic-bezier entrance animation (translate, scale, blur, opacity)
 * and guarantees instant scroll-to-top on route changes.
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  disableScrollReset?: boolean;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  disableScrollReset = false
}) => {
  const location = useLocation();

  useEffect(() => {
    if (!disableScrollReset) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior
      });
    }
  }, [location.pathname, disableScrollReset]);

  return (
    <div className={`advanced-page-wrapper ${className}`}>
      {children}
    </div>
  );
};
