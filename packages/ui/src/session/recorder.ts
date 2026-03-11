import type { DetectedIssue } from '@devlens/core';
import type {
  SessionRecorder,
  SessionRecorderConfig,
  SessionMetadata,
  TimelineEvent,
  DevLensSession,
} from './types';

declare const __DEVLENS_VERSION__: string;
const VERSION: string =
  typeof __DEVLENS_VERSION__ !== 'undefined' ? __DEVLENS_VERSION__ : '';

const DEFAULT_MAX_EVENTS = 5000;

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function buildMetadata(): SessionMetadata {
  return {
    browser: detectBrowser(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
    userAgent: navigator.userAgent,
    devlensVersion: VERSION,
  };
}

function getTargetSelector(element: EventTarget | null): string {
  if (!element || !(element instanceof HTMLElement)) return '';
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const cls = element.className && typeof element.className === 'string'
    ? `.${element.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`
    : '';
  return `${tag}${id}${cls}`;
}

function getTargetText(element: EventTarget | null): string {
  if (!element || !(element instanceof HTMLElement)) return '';
  const text = element.textContent?.trim() ?? '';
  return text.slice(0, 50);
}

export function createSessionRecorder(
  sessionId: string,
  issueSubscriber: (cb: (issue: DetectedIssue) => void) => () => void,
  config: SessionRecorderConfig = {},
): SessionRecorder {
  const maxEvents = config.maxEvents ?? DEFAULT_MAX_EVENTS;
  const captureClicks = config.captureClicks !== false;
  const captureInputs = config.captureInputs !== false;
  const captureNavigation = config.captureNavigation !== false;

  const timeline: TimelineEvent[] = [];
  const issues: DetectedIssue[] = [];
  let startTime = 0;
  let recording = false;
  let unsubIssues: (() => void) | null = null;
  const cleanups: Array<() => void> = [];

  function elapsed(): number {
    return Date.now() - startTime;
  }

  function push(event: TimelineEvent): void {
    timeline.push(event);
    if (timeline.length > maxEvents) {
      timeline.splice(0, timeline.length - maxEvents);
    }
  }

  function onIssue(issue: DetectedIssue): void {
    issues.push(issue);
    push({ t: elapsed(), type: 'issue', data: { issueId: issue.id, message: issue.message, severity: issue.severity, category: issue.category } });
  }

  function onClick(e: MouseEvent): void {
    if (!recording) return;
    push({
      t: elapsed(),
      type: 'interaction',
      data: { action: 'click', target: getTargetSelector(e.target), text: getTargetText(e.target) },
    });
  }

  function onInput(e: Event): void {
    if (!recording) return;
    const target = e.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      push({
        t: elapsed(),
        type: 'interaction',
        data: { action: 'input', target: getTargetSelector(target), value: target.value.slice(0, 100) },
      });
    }
  }

  function onPopState(): void {
    if (!recording) return;
    push({
      t: elapsed(),
      type: 'navigation',
      data: { url: window.location.href },
    });
  }

  function start(): void {
    if (recording) return;
    recording = true;
    startTime = Date.now();

    push({ t: 0, type: 'navigation', data: { url: window.location.href } });

    unsubIssues = issueSubscriber(onIssue);

    if (captureClicks) {
      document.addEventListener('click', onClick, true);
      cleanups.push(() => document.removeEventListener('click', onClick, true));
    }
    if (captureInputs) {
      document.addEventListener('input', onInput, true);
      cleanups.push(() => document.removeEventListener('input', onInput, true));
    }
    if (captureNavigation) {
      window.addEventListener('popstate', onPopState);
      cleanups.push(() => window.removeEventListener('popstate', onPopState));
    }
  }

  function stop(): void {
    if (!recording) return;
    recording = false;
    unsubIssues?.();
    unsubIssues = null;
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  }

  function getSession(): DevLensSession {
    return {
      version: '1.0',
      sessionId,
      exportedAt: new Date().toISOString(),
      metadata: buildMetadata(),
      timeline: [...timeline],
      issues: [...issues],
    };
  }

  function destroy(): void {
    stop();
    timeline.length = 0;
    issues.length = 0;
  }

  return { start, stop, getSession, destroy };
}
