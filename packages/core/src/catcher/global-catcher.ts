import type { DevLensEngine, GlobalCatcherConfig, DetectedIssue } from '../types';

export function createGlobalCatcher(
  engine: DevLensEngine,
  config?: GlobalCatcherConfig | boolean,
) {
  const resolvedConfig: GlobalCatcherConfig =
    typeof config === 'boolean' || config === undefined ? {} : config;

  const catchWindowErrors = resolvedConfig.windowErrors !== false;
  const catchRejections = resolvedConfig.unhandledRejections !== false;
  const catchConsoleErrors = resolvedConfig.consoleErrors === true;

  let originalConsoleError: typeof console.error | null = null;

  function handleWindowError(event: ErrorEvent): void {
    if (!engine.isEnabled()) return;

    const issue: DetectedIssue = {
      id: `unhandled-error:${event.message}:${event.filename ?? ''}:${event.lineno ?? 0}`,
      timestamp: Date.now(),
      severity: 'error',
      category: 'unhandled-error',
      message: event.message || 'Unknown error',
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      stack: event.error?.stack,
      source: event.filename
        ? `${event.filename}:${event.lineno}:${event.colno}`
        : 'unknown',
      suggestion: event.filename
        ? `Unhandled error at ${event.filename}:${event.lineno} — wrap in try/catch or add error boundary`
        : 'Unhandled error — add error handling to locate the source',
    };

    engine.report(issue);
  }

  function handleUnhandledRejection(event: PromiseRejectionEvent): void {
    if (!engine.isEnabled()) return;

    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unknown rejection reason';

    const issue: DetectedIssue = {
      id: `unhandled-rejection:${message}`,
      timestamp: Date.now(),
      severity: 'error',
      category: 'unhandled-rejection',
      message: `Unhandled Promise rejection: ${message}`,
      details: {
        reason:
          reason instanceof Error
            ? { name: reason.name, message: reason.message }
            : reason,
      },
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'Promise',
      suggestion:
        'Add .catch() to the Promise or use try/catch with await',
    };

    engine.report(issue);
  }

  function installConsoleInterceptor(): void {
    if (typeof console === 'undefined') return;
    originalConsoleError = console.error;

    const saved = originalConsoleError;
    console.error = function devlensConsoleError(
      ...args: unknown[]
    ): void {
      saved.apply(console, args);

      if (!engine.isEnabled()) return;

      const message = args
        .map((arg) =>
          typeof arg === 'string' ? arg : JSON.stringify(arg),
        )
        .join(' ');

      const issue: DetectedIssue = {
        id: `unhandled-error:console:${message.slice(0, 100)}`,
        timestamp: Date.now(),
        severity: 'error',
        category: 'unhandled-error',
        message: `console.error: ${message}`,
        details: { args },
        source: 'console.error',
        suggestion:
          'A console.error was detected — investigate the error above',
      };

      engine.report(issue);
    };
  }

  function install(): void {
    if (typeof window === 'undefined') return;

    if (catchWindowErrors) {
      window.addEventListener('error', handleWindowError);
    }
    if (catchRejections) {
      window.addEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    }
    if (catchConsoleErrors) {
      installConsoleInterceptor();
    }
  }

  function uninstall(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    }
    if (originalConsoleError) {
      console.error = originalConsoleError;
      originalConsoleError = null;
    }
  }

  return { install, uninstall };
}
