import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ERROR BOUNDARY CAUGHT:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page">
          <div className="error-boundary-card">
            <h1 className="error-boundary-heading">❌ Component Error</h1>
            <p className="error-boundary-desc">
              An unexpected error occurred in the application.
            </p>

            {this.state.error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-summary">
                  Error Details
                </summary>
                <pre className="error-boundary-pre error-boundary-pre-error">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            {this.state.errorInfo && (
              <details className="error-boundary-details">
                <summary className="error-boundary-summary">
                  Stack Trace
                </summary>
                <pre className="error-boundary-pre error-boundary-pre-stack">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={() => window.location.href = "/"}
                className="error-boundary-btn error-boundary-btn-home"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="error-boundary-btn error-boundary-btn-reload"
              >
                Reload Page
              </button>
            </div>
          </div>

          <p className="error-boundary-hint">
            Check the browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
