import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Erro interceptado na interface:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleReload() {
    window.location.reload();
  }


  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="bg-black/85 border-2 border-red-800 rounded-lg shadow-tibia-glow max-w-xl w-full p-6 text-center">
            <div className="flex justify-center mb-4 text-red-500">
              <AlertTriangle size={48} className="animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-medieval text-yellow-500 mb-2">
              Instabilidade Detectada no Módulo
            </h2>
            
            <p className="text-gray-300 text-sm font-sans mb-6">
              Ocorreu uma falha inesperada ao renderizar este componente. Os demais módulos do sistema continuam operacionais.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500 text-yellow-300 font-medieval px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm shadow-md"
              >
                <RotateCcw size={16} /> Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="bg-red-900/50 hover:bg-red-900 border border-red-500 text-white font-sans px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm"
              >
                <RefreshCw size={16} /> Recarregar Página
              </button>
            </div>

            {this.state.error && (
              <details className="text-left bg-black/60 border border-gray-800 rounded p-3 text-xs font-mono text-gray-400 overflow-x-auto">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-300 font-sans mb-2 select-none">
                  Detalhes Técnicos (Log do Erro)
                </summary>
                <p className="text-red-400 mb-1">{String(this.state.error)}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-gray-600 text-[10px] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
