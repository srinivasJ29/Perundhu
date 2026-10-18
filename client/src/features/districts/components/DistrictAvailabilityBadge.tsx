import React from 'react';
import { Radio, Clock } from 'lucide-react';
import { DistrictAvailability } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';

interface DistrictAvailabilityBadgeProps {
  status: DistrictAvailability;
  isPilot?: boolean;
}

export const DistrictAvailabilityBadge: React.FC<DistrictAvailabilityBadgeProps> = ({
  status,
  isPilot = false
}) => {
  const { t } = useLanguage();

  if (status === 'AVAILABLE' && isPilot) {
    return (
      <Badge variant="success" style={{ gap: '5px' }}>
        <Radio size={11} aria-hidden="true" style={{ animation: 'pulse 1.5s infinite' }} />
        <span>{t('districts.status_available')}</span>
      </Badge>
    );
  }

  if (status === 'AVAILABLE') {
    return (
      <Badge variant="success">
        <span>{t('districts.status_available')}</span>
      </Badge>
    );
  }

  if (status === 'COMING_SOON') {
    return (
      <Badge variant="neutral" style={{ gap: '4px' }}>
        <Clock size={11} aria-hidden="true" />
        <span>{t('districts.status_coming_soon')}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="warning">
      <span>{t('districts.status_unavailable')}</span>
    </Badge>
  );
};
