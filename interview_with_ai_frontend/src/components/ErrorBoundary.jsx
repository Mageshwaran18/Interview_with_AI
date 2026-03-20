import React from "react";

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0d1117",
            color: "#e6edf3",
            padding: "40px",
            textAlign: "center",
            fontFamily: "monospace",
            overflow: "auto",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              textAlign: "left",
              background: "#161b22",
              border: "2px solid #f85149",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h1 style={{ color: "#f85149", margin: "0 0 10px 0" }}>
              ❌ Component Error
            </h1>
            <p style={{ color: "#8b949e", margin: "0 0 15px 0" }}>
              An unexpected error occurred in the application.
            </p>

            {this.state.error && (
              <details style={{ marginBottom: "15px", cursor: "pointer" }}>
                <summary
                  style={{
                    padding: "10px",
                    background: "#0d1117",
                    borderRadius: "4px",
                    marginBottom: "10px",
                    color: "#58a6ff",
                    fontWeight: "bold",
                  }}
                >
                  Error Details
                </summary>
                <pre
                  style={{
                    background: "#0d1117",
                    padding: "10px",
                    borderRadius: "4px",
                    overflow: "auto",
                    color: "#f85149",
                    fontSize: "12px",
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            {this.state.errorInfo && (
              <details style={{ cursor: "pointer" }}>
                <summary
                  style={{
                    padding: "10px",
                    background: "#0d1117",
                    borderRadius: "4px",
                    marginBottom: "10px",
                    color: "#58a6ff",
                    fontWeight: "bold",
                  }}
                >
                  Stack Trace
                </summary>
                <pre
                  style={{
                    background: "#0d1117",
                    padding: "10px",
                    borderRadius: "4px",
                    overflow: "auto",
                    color: "#8b949e",
                    fontSize: "12px",
                    maxHeight: "300px",
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "10px 20px",
                  background: "#238636",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "10px",
                }}
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px",
                  background: "#58a6ff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Reload Page
              </button>
            </div>
          </div>

          <p style={{ marginTop: "40px", color: "#8b949e", fontSize: "12px" }}>
            Check the browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
