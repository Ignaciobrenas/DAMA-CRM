import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error Boundary caught:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl shadow-blue-900/5 dark:shadow-none text-center transition-all">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold mb-2 tracking-tight">Se ha producido un error inesperado</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              La aplicación ha detectado una excepción en la vista. Puedes recargar la página o volver al inicio para continuar.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-left mb-6 overflow-x-auto text-[11px] font-mono text-red-600 dark:text-red-300 max-h-32 shadow-inner">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                Recargar página
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-all border border-slate-200 dark:border-transparent active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
