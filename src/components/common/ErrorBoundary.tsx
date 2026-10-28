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
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            padding: '36px 24px',
            borderRadius: '20px',
            background: 'var(--md-sys-color-surface-container, #f9fafb)',
            border: '1px solid var(--md-sys-color-outline-variant, rgba(0,0,0,0.08))',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: 'var(--md-sys-color-primary-container, #CEEAD6)',
              color: 'var(--md-sys-color-primary, #1E8E3E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>refresh</span>
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 10px',
              color: 'var(--md-sys-color-on-surface, #111827)'
            }}>
              Kuch Gadbad Ho Gayi (Something Went Wrong)
            </h1>

            <p style={{
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant, #6b7280)',
              lineHeight: 1.6,
              margin: '0 0 24px'
            }}>
              Chinta mat kijiye, aapka cart data bilkul safe hai. Page reload karke dekhein ya storefront par wapas jayein.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="sdsm-btn sdsm-btn--primary"
                onClick={this.handleReload}
                style={{ padding: '10px 22px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                className="sdsm-btn sdsm-btn--outlined"
                onClick={this.handleGoHome}
                style={{ padding: '10px 22px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
