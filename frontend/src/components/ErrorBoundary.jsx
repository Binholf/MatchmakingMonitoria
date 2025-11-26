import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for debugging
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div style={{ padding: 20 }}>
          <h2>Ocorreu um erro ao carregar esta página.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {error && error.toString()}
            {info && info.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
