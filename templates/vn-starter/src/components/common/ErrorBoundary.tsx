import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@services/logger";
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("Application error", error, info);
  }
  render(): ReactNode {
    return this.state.failed ? (
      <main className="page">
        <h1>Something went wrong</h1>
        <p>Your saved progress has not been deleted.</p>
        <button onClick={() => window.location.reload()}>Reload application</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
