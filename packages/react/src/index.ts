export { DevLensProvider } from './provider';
export type { DevLensProviderProps } from './provider';
export { DevLensErrorBoundary } from './error-boundary';
export type { DevLensErrorBoundaryProps } from './error-boundary';
export { useDevLens, useGuardedState, useGuardedEffect } from './hooks';
export { DevLensContext } from './context';

export type {
  DevLensConfig,
  DetectedIssue,
  Severity,
  IssueCategory,
} from '@devlens/core';
