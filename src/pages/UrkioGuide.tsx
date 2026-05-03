import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UrkioConsultant } from '../components/UrkioConsultant';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-500 opacity-80">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function UrkioGuide({ user, userData }: any) {
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <ErrorBoundary>
        <UrkioConsultant user={user} userData={userData} />
      </ErrorBoundary>
    </div>
  );
}

