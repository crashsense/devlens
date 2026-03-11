import type { DetectedIssue } from '@devlens/core';

export interface SessionMetadata {
  browser: string;
  viewport: string;
  url: string;
  userAgent: string;
  devlensVersion: string;
}

export type TimelineEventType = 'navigation' | 'network' | 'interaction' | 'issue';

export interface TimelineEvent {
  t: number;
  type: TimelineEventType;
  data: Record<string, unknown>;
}

export interface DevLensSession {
  version: '1.0';
  sessionId: string;
  exportedAt: string;
  metadata: SessionMetadata;
  timeline: TimelineEvent[];
  issues: DetectedIssue[];
}

export interface SessionRecorderConfig {
  maxEvents?: number;
  captureClicks?: boolean;
  captureInputs?: boolean;
  captureNavigation?: boolean;
}

export interface SessionRecorder {
  start(): void;
  stop(): void;
  getSession(): DevLensSession;
  destroy(): void;
}
