import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Error details:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-cream p-4">
            <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-red-800 mb-2">¡Ocurrió un error!</h1>
                <p className="text-red-600 mb-4">
                  Lo sentimos por las molestias. Algo salió mal. Por favor, intenta recargar la página o vuelve al inicio.
                </p>
                {this.state.error && (
                  <details className="text-left mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <summary className="cursor-pointer font-medium text-red-700 mb-2">
                      Detalles técnicos (desarrollo)
                    </summary>
                    <div className="mt-2 text-xs font-mono text-red-800 overflow-auto">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      <div>
                        <strong>Componente:</strong> {this.state.error.componentStack}
                      </div>
                    </div>
                  </details>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-cream p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-red-800 mb-2">¡Algo salió mal</h1>
              <p className="text-red-600 mb-4">
                Lo sentimos por las molestias. Ha ocurrido un error inesperado.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors"
              >
                Recargar página
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