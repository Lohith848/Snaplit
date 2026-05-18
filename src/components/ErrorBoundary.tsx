import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">Oops! Something went wrong</h1>
          <p className="text-gray-400 mb-8 text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-2xl hover:bg-yellow-400 transition-colors"
          >
            <RefreshCw size={20} />
            Refresh App
          </button>
          <p className="text-gray-500 text-xs mt-6">Error ID: {Date.now()}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
