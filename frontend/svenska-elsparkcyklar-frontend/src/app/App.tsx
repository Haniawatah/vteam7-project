import React from 'react';
import AppRoutes from './routes';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable next line no console
    console.error('App render crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ margin: '0 0 8px' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <AppRoutes />
  </ErrorBoundary>
);

export default App;