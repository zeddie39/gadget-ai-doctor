import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '1.5rem',
            padding: '3rem 2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: '0.75rem',
            }}>
              Something went wrong
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}>
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148, 163, 184, 0.1)',
              }}>
                <summary style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Error details
                </summary>
                <pre style={{
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = 'none';
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.4)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.2)';
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
