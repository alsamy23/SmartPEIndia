
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { logError } from '../services/logService';
import { isBenignError } from '../services/telemetryService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught rendering error:', error, errorInfo);
    logError(error, 'react_error', { componentStack: errorInfo.componentStack });
  }

  private handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || event.message;
    const msg = error instanceof Error ? error.message : String(error || '');
    if (isBenignError(msg, error)) return;

    console.error('Caught global error:', event.error);
    logError(error, 'error');
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (!reason) return; // Ignore empty rejections

    let message = "Unknown promise rejection";
    if (reason instanceof Error) {
      message = reason.message;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason !== null && typeof reason === 'object') {
      try {
        message = JSON.stringify(reason);
      } catch (e) {
        message = "Object rejection (could not stringify)";
      }
    }

    if (isBenignError(message, reason)) {
      return; // Ignore benign environment noise
    }

    console.warn('Caught unhandled promise rejection:', reason);
    try {
      logError(message, 'promise_rejection', { 
        rawReason: reason,
        location: window.location.href,
        userAgent: navigator.userAgent
      }).catch(() => {});
    } catch (e) {}
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-xl shadow-rose-500/10">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Something went wrong</h1>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              The application encountered an unexpected error. This might be due to a temporary connection issue or a system glitch.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 text-left overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Details</p>
                <p className="text-xs font-mono text-rose-600 break-words font-bold">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center space-x-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
              >
                <RefreshCcw size={16} />
                <span>Reload App</span>
              </button>
              <button
                onClick={() => { window.location.assign('/'); }}
                className="flex items-center justify-center space-x-2 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Home size={16} />
                <span>Go Home</span>
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
