import React from 'react';

/**
 * ErrorBoundary — Catches unhandled React render errors.
 * Prevents the entire app from crashing when a component throws.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e0e12',
          color: '#e2e2e8',
          fontFamily: 'sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8e8ea0', marginBottom: '2rem', maxWidth: '420px' }}>
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '999px',
              background: '#6750a4',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#1a1a1e',
              borderRadius: '0.75rem',
              color: '#ff8a80',
              fontSize: '0.75rem',
              maxWidth: '600px',
              overflowX: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
