import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Something went wrong</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              An unexpected error occurred in this module. Our team has been notified.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-left text-xs font-mono text-slate-700 overflow-x-auto mb-5 border border-slate-200">
              {this.state.error?.message || 'Unknown Application Error'}
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={this.handleReset}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

