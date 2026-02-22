import { Component, type ReactNode, type ErrorInfo } from 'react';
import type { DevLensEngine, DetectedIssue } from '@devlens/core';
import { DevLensContext } from './context';

export interface DevLensErrorBoundaryProps {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class DevLensErrorBoundary extends Component<
  DevLensErrorBoundaryProps,
  ErrorBoundaryState
> {
  static contextType = DevLensContext;
  declare context: DevLensEngine | null;

  constructor(props: DevLensErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const engine = this.context;

    if (engine?.isEnabled()) {
      const issue: DetectedIssue = {
        id: `unhandled-error:render:${error.message}`,
        timestamp: Date.now(),
        severity: 'error',
        category: 'unhandled-error',
        message: `React render error: ${error.message}`,
        details: {
          componentStack: errorInfo.componentStack ?? 'unavailable',
        },
        stack: error.stack,
        source: 'DevLensErrorBoundary',
        suggestion:
          'A React component threw during render. Check the component stack above.',
      };
      engine.report(issue);
    }

    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      if (fallback !== undefined) {
        return fallback;
      }
      return (
        <div role="alert">
          <p>Something went wrong:</p>
          <pre>{error.message}</pre>
        </div>
      );
    }

    return children;
  }
}
