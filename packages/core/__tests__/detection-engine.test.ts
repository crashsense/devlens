import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDetectionEngine } from '../src/engine/detection-engine';
import type { DetectedIssue, Reporter } from '../src/types';

function makeIssue(overrides: Partial<DetectedIssue> = {}): DetectedIssue {
  return {
    id: 'test:issue:1',
    timestamp: Date.now(),
    severity: 'error',
    category: 'network',
    message: 'Test issue',
    ...overrides,
  };
}

function makeMockReporter(): Reporter {
  return {
    report: vi.fn(),
    reportBatch: vi.fn(),
    clear: vi.fn(),
  };
}

describe('createDetectionEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a working engine', () => {
    const engine = createDetectionEngine();
    expect(engine).toBeDefined();
    expect(engine.report).toBeTypeOf('function');
    expect(engine.getConfig).toBeTypeOf('function');
    expect(engine.getIssues).toBeTypeOf('function');
    expect(engine.subscribe).toBeTypeOf('function');
    expect(engine.isEnabled).toBeTypeOf('function');
  });

  it('reports issues to the configured reporter', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({ reporter, enabled: true });

    vi.stubGlobal('window', {});

    const issue = makeIssue();
    engine.report(issue);

    expect(reporter.report).toHaveBeenCalledWith(issue);

    vi.unstubAllGlobals();
  });

  it('deduplicates issues within throttle window', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: true,
      throttleMs: 5000,
    });

    vi.stubGlobal('window', {});

    const issue = makeIssue({ id: 'dup:test' });
    engine.report(issue);
    engine.report(issue);
    engine.report(issue);

    expect(reporter.report).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('allows same id after throttle window expires', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: true,
      throttleMs: 10,
    });

    vi.stubGlobal('window', {});

    const issue = makeIssue({ id: 'throttle:test' });
    engine.report(issue);
    expect(reporter.report).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('filters by minSeverity', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: true,
      minSeverity: 'warn',
    });

    vi.stubGlobal('window', {});

    engine.report(makeIssue({ id: 'a', severity: 'info' }));
    expect(reporter.report).toHaveBeenCalledTimes(0);

    engine.report(makeIssue({ id: 'b', severity: 'warn' }));
    expect(reporter.report).toHaveBeenCalledTimes(1);

    engine.report(makeIssue({ id: 'c', severity: 'error' }));
    expect(reporter.report).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });

  it('respects ignore.messages patterns', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: true,
      ignore: {
        messages: ['ignore-me', /^skip/],
      },
    });

    vi.stubGlobal('window', {});

    engine.report(makeIssue({ id: 'a', message: 'please ignore-me now' }));
    expect(reporter.report).toHaveBeenCalledTimes(0);

    engine.report(makeIssue({ id: 'b', message: 'skip this one' }));
    expect(reporter.report).toHaveBeenCalledTimes(0);

    engine.report(makeIssue({ id: 'c', message: 'valid issue' }));
    expect(reporter.report).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('notifies subscribers on new issues', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({ reporter, enabled: true });
    const callback = vi.fn();

    vi.stubGlobal('window', {});

    const unsubscribe = engine.subscribe(callback);

    engine.report(makeIssue({ id: 'sub:1' }));
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    engine.report(makeIssue({ id: 'sub:2' }));
    expect(callback).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('respects maxIssues buffer limit', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: true,
      maxIssues: 3,
      throttleMs: 0,
    });

    vi.stubGlobal('window', {});

    engine.report(makeIssue({ id: 'buf:1', message: 'first' }));
    engine.report(makeIssue({ id: 'buf:2', message: 'second' }));
    engine.report(makeIssue({ id: 'buf:3', message: 'third' }));
    engine.report(makeIssue({ id: 'buf:4', message: 'fourth' }));

    const issues = engine.getIssues();
    expect(issues).toHaveLength(3);
    expect(issues[0].message).toBe('second');
    expect(issues[2].message).toBe('fourth');

    vi.unstubAllGlobals();
  });

  it('getConfig returns frozen config', () => {
    const engine = createDetectionEngine({ throttleMs: 500 });
    const config = engine.getConfig();
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.throttleMs).toBe(500);
  });

  it('does not report when disabled', () => {
    const reporter = makeMockReporter();
    const engine = createDetectionEngine({
      reporter,
      enabled: false,
    });

    engine.report(makeIssue());
    expect(reporter.report).not.toHaveBeenCalled();
  });
});
