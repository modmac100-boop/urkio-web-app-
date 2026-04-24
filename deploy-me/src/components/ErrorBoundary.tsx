import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-8 max-w-md">
            The application encountered an unexpected error. We've been notified and are working on it.
          </p>
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-8 max-w-lg w-full overflow-auto text-start">
            <p className="text-rose-400 font-mono text-xs break-all">
              {this.state.error?.toString()}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Return to Sanctuary
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
