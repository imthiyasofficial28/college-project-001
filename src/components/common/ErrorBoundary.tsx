import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: any;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[CUOIS ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('cuois_auth_token');
    } catch {}
    window.location.href = window.location.pathname;
  };

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#0E1524] border border-rose-500/40 shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-serif font-bold text-slate-100">
                Application Recovery Gate
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected runtime error occurred during view rendering. The application intercepted the error to prevent an empty screen.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-auto">
              <p className="font-bold text-rose-400">Error Diagnostic:</p>
              {/* @ts-ignore */}
              <p className="break-all">{this.state.errorMessage || 'Unknown execution failure'}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Reset Session</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Completely Developed & Architected by Imthiyas
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
