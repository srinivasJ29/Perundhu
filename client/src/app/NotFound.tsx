import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)'
      }}
    >
      <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-sage-light)',
            color: 'var(--color-primary-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4) auto'
          }}
        >
          <Compass size={32} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-deep-teal)', marginBottom: 'var(--space-2)' }}>
          404 — {t('nav.not_found')}
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          {t('nav.not_found_desc')}
        </p>

        <Link to="/">
          <Button variant="primary" icon={<Home size={16} />} style={{ width: '100%' }}>
            {t('nav.back_home')}
          </Button>
        </Link>
      </Card>
    </div>
  );
};
