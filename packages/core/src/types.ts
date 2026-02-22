/** Severity levels for detected issues */
export type Severity = 'error' | 'warn' | 'info';

/** Categories of detected issues */
export type IssueCategory =
  | 'network'
  | 'null-access'
  | 'undefined-data'
  | 'render-data'
  | 'unhandled-error'
  | 'unhandled-rejection'
  | 'type-mismatch';

/** A detected issue from any DevLens module */
export interface DetectedIssue {
  /** Unique ID for deduplication */
  id: string;
  /** When the issue was detected */
  timestamp: number;
  /** Severity of the issue */
  severity: Severity;
  /** Category for grouping */
  category: IssueCategory;
  /** Human-readable summary */
  message: string;
  /** Detailed context for debugging */
  details?: Record<string, unknown>;
  /** Property path that was accessed (e.g., "user.profile.avatar") */
  path?: string;
  /** The value that was found (null, undefined, etc.) */
  foundValue?: unknown;
  /** What was expected */
  expectedType?: string;
  /** Stack trace if available */
  stack?: string;
  /** Source component or module */
  source?: string;
  /** Suggested fix */
  suggestion?: string;
}

/** Configuration for DevLens */
export interface DevLensConfig {
  /** Enable/disable DevLens entirely (default: true in dev, false in prod) */
  enabled?: boolean;
  /** Which modules to activate */
  modules?: {
    network?: boolean | NetworkInterceptorConfig;
    guardian?: boolean | DataGuardianConfig;
    catcher?: boolean | GlobalCatcherConfig;
  };
  /** Severity threshold - only report issues at this level or above */
  minSeverity?: Severity;
  /** Custom reporter (default: console reporter) */
  reporter?: Reporter;
  /** Throttle interval in ms to avoid log spam (default: 1000) */
  throttleMs?: number;
  /** Max issues to keep in memory (default: 100) */
  maxIssues?: number;
  /** Patterns to ignore (URL patterns, property paths, etc.) */
  ignore?: IgnorePatterns;
}

export interface NetworkInterceptorConfig {
  /** Intercept fetch (default: true) */
  fetch?: boolean;
  /** Intercept XMLHttpRequest (default: true) */
  xhr?: boolean;
  /** URL patterns to ignore */
  ignoreUrls?: (string | RegExp)[];
  /** Log successful responses too (default: false) */
  logSuccess?: boolean;
  /** Custom response validator */
  validateResponse?: (response: NetworkResponse) => DetectedIssue | null;
}

export interface DataGuardianConfig {
  /** Max depth to track property access (default: 5) */
  maxDepth?: number;
  /** Property paths to ignore */
  ignorePaths?: string[];
  /** Log all property access, not just null/undefined (default: false) */
  verbose?: boolean;
}

export interface GlobalCatcherConfig {
  /** Catch window.onerror (default: true) */
  windowErrors?: boolean;
  /** Catch unhandled promise rejections (default: true) */
  unhandledRejections?: boolean;
  /** Catch console.error calls (default: false) */
  consoleErrors?: boolean;
}

export interface IgnorePatterns {
  /** URL patterns to ignore for network interceptor */
  urls?: (string | RegExp)[];
  /** Property paths to ignore for data guardian */
  paths?: (string | RegExp)[];
  /** Error message patterns to ignore */
  messages?: (string | RegExp)[];
}

export interface NetworkResponse {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: unknown;
  duration: number;
}

/** Reporter interface for outputting detected issues */
export interface Reporter {
  report(issue: DetectedIssue): void;
  reportBatch?(issues: DetectedIssue[]): void;
  clear?(): void;
}

/** Lifecycle hooks for the DevLens engine */
export interface DevLensPlugin {
  name: string;
  setup(engine: DevLensEngine): void;
  teardown?(): void;
}

/** The core engine interface exposed to plugins and adapters */
export interface DevLensEngine {
  report(issue: DetectedIssue): void;
  getConfig(): Readonly<DevLensConfig>;
  getIssues(): readonly DetectedIssue[];
  subscribe(callback: (issue: DetectedIssue) => void): () => void;
  isEnabled(): boolean;
}
