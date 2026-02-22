export { createNetworkInterceptor } from './network/interceptor';
export { createDataGuardian } from './guardian/data-guardian';
export { createGlobalCatcher } from './catcher/global-catcher';
export { createDetectionEngine } from './engine/detection-engine';
export { createConsoleReporter } from './reporter/console-reporter';

export type {
  Severity,
  IssueCategory,
  DetectedIssue,
  DevLensConfig,
  NetworkInterceptorConfig,
  DataGuardianConfig,
  GlobalCatcherConfig,
  IgnorePatterns,
  NetworkResponse,
  Reporter,
  DevLensPlugin,
  DevLensEngine,
} from './types';
