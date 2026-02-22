import type {
  DevLensConfig,
  DevLensEngine,
  DetectedIssue,
  Reporter,
  Severity,
} from '../types';
import { createConsoleReporter } from '../reporter/console-reporter';

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

function matchesAnyPattern(
  value: string | undefined,
  patterns: (string | RegExp)[],
): boolean {
  if (!value || patterns.length === 0) return false;
  return patterns.some((p) =>
    typeof p === 'string' ? value.includes(p) : p.test(value),
  );
}

export function createDetectionEngine(
  config: DevLensConfig = {},
): DevLensEngine {
  const resolvedConfig: Required<
    Pick<DevLensConfig, 'enabled' | 'minSeverity' | 'throttleMs' | 'maxIssues'>
  > &
    DevLensConfig = {
    enabled: config.enabled ?? true,
    minSeverity: config.minSeverity ?? 'info',
    throttleMs: config.throttleMs ?? 1000,
    maxIssues: config.maxIssues ?? 100,
    ...config,
  };

  const reporter: Reporter =
    resolvedConfig.reporter ?? createConsoleReporter();
  const issues: DetectedIssue[] = [];
  const subscribers = new Set<(issue: DetectedIssue) => void>();
  const lastReportedAt = new Map<string, number>();

  function isEnabled(): boolean {
    if (!resolvedConfig.enabled) return false;
    if (typeof window === 'undefined') return false;
    try {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'production'
      ) {
        return false;
      }
    } catch {
      // process may not be defined in browser
    }
    return true;
  }

  function meetsMinSeverity(severity: Severity): boolean {
    return (
      SEVERITY_RANK[severity] >= SEVERITY_RANK[resolvedConfig.minSeverity]
    );
  }

  function isThrottled(id: string, now: number): boolean {
    const lastTime = lastReportedAt.get(id);
    if (lastTime === undefined) return false;
    return now - lastTime < resolvedConfig.throttleMs;
  }

  function isIgnored(issue: DetectedIssue): boolean {
    const ignore = resolvedConfig.ignore;
    if (!ignore) return false;

    if (
      ignore.urls &&
      matchesAnyPattern(
        issue.details?.url as string | undefined,
        ignore.urls,
      )
    ) {
      return true;
    }

    if (ignore.paths && matchesAnyPattern(issue.path, ignore.paths)) {
      return true;
    }

    if (ignore.messages && matchesAnyPattern(issue.message, ignore.messages)) {
      return true;
    }

    return false;
  }

  function addToBuffer(issue: DetectedIssue): void {
    issues.push(issue);
    if (issues.length > resolvedConfig.maxIssues) {
      issues.shift();
    }
  }

  function report(issue: DetectedIssue): void {
    if (!isEnabled()) return;
    if (!meetsMinSeverity(issue.severity)) return;

    const now = Date.now();
    if (isThrottled(issue.id, now)) return;
    if (isIgnored(issue)) return;

    lastReportedAt.set(issue.id, now);
    addToBuffer(issue);

    reporter.report(issue);

    for (const callback of subscribers) {
      try {
        callback(issue);
      } catch {
        // subscriber errors should not break the engine
      }
    }
  }

  function getConfig(): Readonly<DevLensConfig> {
    return Object.freeze({ ...resolvedConfig });
  }

  function getIssues(): readonly DetectedIssue[] {
    return [...issues];
  }

  function subscribe(
    callback: (issue: DetectedIssue) => void,
  ): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }

  return {
    report,
    getConfig,
    getIssues,
    subscribe,
    isEnabled,
  };
}
