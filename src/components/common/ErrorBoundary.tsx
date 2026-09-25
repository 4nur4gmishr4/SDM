import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--md-sys-color-surface, #ffffff)',
          color: 'var(--md-sys-color-on-surface, #1f2937)',
          fontFamily: 'var(--md-sys-typescale-font-family, sans-serif)',
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            padding: '36px 24px',
            borderRadius: '16px',
            background: 'var(--md-sys-color-surface-container, #f9fafb)',
            border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.1))',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: 'var(--md-sys-color-error-container, #ffebee)',
              color: 'var(--md-sys-color-error, #b00020)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>error_outline</span>
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 8px',
              color: 'var(--md-sys-color-on-surface, #111827)'
            }}>
              Something went wrong
            </h1>

            <p style={{
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant, #6b7280)',
              lineHeight: 1.5,
              margin: '0 0 24px'
            }}>
              An unexpected error occurred while rendering this page. Our team has been notified. You can try refreshing or return to the main storefront.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="sdm-btn sdm-btn--primary"
                onClick={this.handleReload}
                style={{ padding: '10px 20px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                className="sdm-btn sdm-btn--outlined"
                onClick={this.handleGoHome}
                style={{ padding: '10px 20px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
                <span>Back to Home</span>
              </button>
            </div>

            {this.state.error && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                background: 'var(--md-sys-color-surface, #ffffff)',
                border: '1px solid var(--md-sys-color-outline-variant, #e5e7eb)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--md-sys-color-on-surface-variant, #4b5563)'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}>
                  Technical Details (Debug Log)
                </summary>
                <pre style={{
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--md-sys-color-error, #b00020)'
                }}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
