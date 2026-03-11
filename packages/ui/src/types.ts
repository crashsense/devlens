import type { DetectedIssue, IssueCategory, Severity } from '@devlens/core';

/** Configuration for the DevLens UI panel */
import type { XRayConfig } from './xray/types';

export interface PanelConfig {
  /** Position of the toggle button (default: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Panel width in pixels (default: 420) */
  panelWidth?: number;
  /** Panel height in pixels (default: 520) */
  panelHeight?: number;
  /** Start with panel open (default: false) */
  defaultOpen?: boolean;
  /** Theme (default: 'dark') */
  theme?: 'dark' | 'light';
  /** Hotkey to toggle panel (default: 'ctrl+shift+d') */
  hotkey?: string;
  /**
   * URL of the DevLens hosted dashboard (e.g. `'http://localhost:5173/__devlens__'`).
   * When set, a small dashboard-open button appears above the toggle button.
   */
  dashboardUrl?: string;
  /** X-Ray Mode: hold Alt + hover to inspect components. true to enable with defaults, object for config, false to disable. (default: true) */
  xray?: boolean | XRayConfig;
  /** Automatically open the dashboard on first detected issue. (default: false) */
  autoOpenDashboard?: boolean;
}

/** Internal state of the panel */
export interface PanelState {
  isOpen: boolean;
  issues: DetectedIssue[];
  filter: {
    severity: Severity | 'all';
    category: IssueCategory | 'all';
    search: string;
  };
  activeView: 'list' | 'timeline';
  selectedIssueId: string | null;
}

export interface PanelInstance {
  open(): void;
  close(): void;
  toggle(): void;
  addIssue(issue: DetectedIssue): void;
  clear(): void;
  getIssues(): readonly DetectedIssue[];
  /** Hide the panel toggle button and panel entirely. Issues still collected. */
  disable(): void;
  /** Show the panel toggle button again. */
  enable(): void;
  destroy(): void;
}
