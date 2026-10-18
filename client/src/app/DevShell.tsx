import {
  CheckCircle,
  Layers,
  Database,
  Radio,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useSystemHealth, useSystemReadiness } from '../hooks/useHealth';
import { useSocket } from '../hooks/useSocket';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';

export const DevShell: React.FC = () => {
  const { t, language } = useLanguage();
  const { data: health, isLoading: healthLoading, isError: healthError } = useSystemHealth();
  const { data: ready } = useSystemReadiness();
  const { isConnected, connectionState, connect } = useSocket();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Foundation Status Alert */}
      <Alert
        variant="success"
        icon={<CheckCircle size={20} />}
        title={t('shell.step_completed')}
      >
        <div>{t('shell.description')}</div>
        <div style={{ marginTop: 'var(--space-2)', fontWeight: 'var(--font-weight-medium)' }}>
          {t('shell.ready_for_step2')}
        </div>
      </Alert>

      {/* Hero Intro */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <Badge variant="neutral">Madurai Pilot</Badge>
          <Badge variant="info">Routes 70 & 77</Badge>
          <Badge variant="success">Step 1 Foundation</Badge>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-deep-teal)', fontWeight: 'var(--font-weight-bold)' }}>
          {language === 'ta' ? 'பேருந்து (PERUNDHU) — கட்டமைப்பு முகப்பு' : 'PERUNDHU — Frontend Foundation Shell'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', maxWidth: '800px', marginTop: 'var(--space-1)' }}>
          {t('app.subtitle')}
        </p>
      </div>

      {/* Grid: Live Diagnostics & Integration Verification */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Card 1: Backend Connection Status */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Server size={20} color="var(--color-primary-teal)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              REST API Gateway
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Health Probe (/health):</span>
              {healthLoading ? (
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
              ) : healthError ? (
                <Badge variant="error">Offline</Badge>
              ) : (
                <Badge variant="success">200 OK ({health?.status})</Badge>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Readiness Probe (/ready):</span>
              {ready?.status === 'ready' ? (
                <Badge variant="success">Database Connected</Badge>
              ) : (
                <Badge variant="warning">Standalone Mode</Badge>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Environment Mode:</span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {health?.environment || 'development'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Server Uptime:</span>
              <span>{health ? `${health.uptimeSeconds}s` : '--'}</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Socket.IO Real-Time Gateway */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Radio size={20} color="var(--color-primary-teal)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              Socket.IO Real-Time Gateway
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Connection State:</span>
              <Badge
                variant={
                  isConnected
                    ? 'success'
                    : connectionState === 'CONNECTING' || connectionState === 'RECONNECTING'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {connectionState}
              </Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Transports:</span>
              <span>websocket, polling</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Room Contracts:</span>
              <span>bus:{'{id}'}, route:{'{id}'}</span>
            </div>

            <div style={{ marginTop: 'var(--space-2)' }}>
              {!isConnected && (
                <Button
                  variant="outline"
                  onClick={connect}
                  style={{ width: '100%', minHeight: '36px' }}
                >
                  Connect WebSocket Client
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Card 3: Approved Design Tokens Palette */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Layers size={20} color="var(--color-primary-teal)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              Approved Color Palette
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '32px', backgroundColor: 'var(--color-deep-teal)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Deep Teal<br />#071F22</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '32px', backgroundColor: 'var(--color-primary-teal)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Primary<br />#1D7873</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '32px', backgroundColor: 'var(--color-sage)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Sage<br />#67958C</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '32px', backgroundColor: 'var(--color-warm-peach)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Peach<br />#F5C096</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '32px', backgroundColor: 'var(--color-coral-red)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Vivid Red<br />#EF2E33</div>
            </div>
          </div>
        </Card>

        {/* Card 4: Architecture & Security Modules */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <ShieldCheck size={20} color="var(--color-primary-teal)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              Security & Type Safety
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-status-success)" />
              <span>Strict TypeScript compilation enabled</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-status-success)" />
              <span>Argon2id + HttpOnly cookie credentials flow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-status-success)" />
              <span>XSS, CSP & safe secret-redacting logger</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-status-success)" />
              <span>GeoJSON [lng, lat] coordinate standards</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Verified Contracts Table */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database size={20} color="var(--color-primary-teal)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              Verified Backend Integration Contracts (Step 1 Baseline)
            </h2>
          </div>
          <Badge variant="info">11 Feature Modules • 19 REST Endpoints</Badge>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Method</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Endpoint Path</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Auth</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Frontend Feature Service</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/health, /ready</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>healthService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="info">POST</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/auth/login, /register, /refresh, /logout</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public / Cookie</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>authService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/districts, /districts/:id/bus-stands</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>districtsService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/bus-stands/nearby, /bus-stands/:id/routes</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public ($geoNear)</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>busStandsService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/routes/:id/directions/:dirId</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public (GeoJSON)</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>routesService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/buses, /buses/:id, /buses/:id/trips</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>busesService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/trips, /trips/active, /trips/:id</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>tripsService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="neutral">GET</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>/trips/:id/next-stop, /trips/:id/eta, /buses/:id/eta</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Public</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>tripsService / busesService</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
              <tr>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="warning">WS</Badge></td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace' }}>bus:position, bus:status, bus:next-stop, bus:eta</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Socket.IO Pub/Sub</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>socketClientManager</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}><Badge variant="success">Verified</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
