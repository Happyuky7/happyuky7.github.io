import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * The app had no error boundary at all, so any render error unmounted the whole
 * root and left the bare <body> showing - a solid black page with no navbar, no
 * footer and no way out except a manual refresh.
 *
 * This catches that. It is deliberately plain: no translations, no router, no
 * lazy imports, nothing that could itself be the thing that just failed.
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep it in the console for debugging a live incident; there is no
    // reporting backend to send it to.
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>

        <p style={{ color: "#9ca3af", margin: 0, maxWidth: "32rem" }}>
          The page failed to load. Reloading usually fixes it - this normally
          happens right after the site has been updated.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              backgroundColor: "#00ff84",
              color: "#0a0a0a",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>

          <a
            href="/"
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
