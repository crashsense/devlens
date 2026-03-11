import type { DetectedIssue } from '@devlens/core';

/** Configuration for X-Ray Mode */
export interface XRayConfig {
  /** Key to hold for activation (default: 'Alt') */
  activationKey?: string;
  /** Show component props (default: true) */
  showProps?: boolean;
  /** Show component state (default: true) */
  showState?: boolean;
  /** Show CSS class names (default: true) */
  showClassNames?: boolean;
  /** Show DevLens issue count (default: true) */
  showIssues?: boolean;
  /** Max depth for nested value display (default: 2) */
  maxDepth?: number;
  /** Max string length for values (default: 50) */
  maxStringLength?: number;
}

/** Extracted component information */
export interface ComponentInfo {
  /** Detected framework */
  framework: 'react' | 'vue' | 'dom';
  /** Component or tag name */
  name: string;
  /** Props / attributes */
  props: Record<string, unknown> | null;
  /** State / hooks (React) or setupState (Vue) */
  state: Record<string, unknown> | null;
  /** CSS class names on the element */
  classNames: string[];
  /** Lowercase tag name */
  tagName: string;
  /** Element bounding rect */
  rect: DOMRect;
  /** Related DevLens issues */
  issueCount: number;
}

/** X-Ray mode instance */
export interface XRayInstance {
  /** Activate event listeners */
  enable(): void;
  /** Deactivate and hide overlay */
  disable(): void;
  /** Remove all resources */
  destroy(): void;
  /** Whether Alt is currently held and inspection is active */
  readonly isActive: boolean;
}

/** Function that returns current issues for cross-referencing */
export type IssueProvider = () => readonly DetectedIssue[];
