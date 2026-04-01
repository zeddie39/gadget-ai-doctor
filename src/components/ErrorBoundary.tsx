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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
          <div className="max-w-md w-full text-center bg-slate-800/80 backdrop-blur-md border border-slate-400/15 rounded-3xl py-12 px-8 shadow-2xl">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-2xl font-bold text-slate-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 p-4 bg-slate-900/60 rounded-xl border border-slate-400/10">
                <summary className="text-slate-500 cursor-pointer text-sm font-medium">
                  Error details
                </summary>
                <pre className="text-red-400 text-xs mt-3 whitespace-pre-wrap break-words font-mono bg-black/20 p-3 rounded-lg">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl border-none bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-sm cursor-pointer transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-indigo-500/40"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-xl border border-slate-400/20 bg-transparent text-slate-400 font-semibold text-sm cursor-pointer transition-colors hover:border-slate-400/40"
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
