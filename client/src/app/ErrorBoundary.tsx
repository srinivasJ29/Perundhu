import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[PERUNDHU:FATAL_RENDER_ERROR]', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-background)',
            padding: 'var(--space-4)'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '540px',
              width: '100%',
              textAlign: 'center',
              borderColor: 'var(--color-coral-red)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-status-error-bg)',
                color: 'var(--color-coral-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4) auto'
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-deep-teal)', marginBottom: 'var(--space-2)' }}>
              பயன்பாட்டில் எதிர்பாராத பிழை ஏற்பட்டது
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              An unexpected application rendering error occurred.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-background)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-coral-red)',
                textAlign: 'left',
                margin: 'var(--space-4) 0',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}
            >
              {this.state.error?.message || 'Unknown render exception'}
            </div>

            <Button
              variant="primary"
              onClick={this.handleReset}
              icon={<RefreshCw size={16} />}
              style={{ width: '100%' }}
            >
              பக்கத்தைப் புதுப்பிக்கவும் (Reload Application)
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
