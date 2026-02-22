import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDataGuardian } from '../src/guardian/data-guardian';
import type { DevLensEngine, DetectedIssue } from '../src/types';

function makeEngine(): DevLensEngine & { reported: DetectedIssue[] } {
  const reported: DetectedIssue[] = [];
  return {
    reported,
    report: vi.fn((issue: DetectedIssue) => reported.push(issue)),
    getConfig: vi.fn(() => ({})),
    getIssues: vi.fn(() => reported),
    subscribe: vi.fn(() => () => {}),
    isEnabled: vi.fn(() => true),
  };
}

describe('createDataGuardian', () => {
  let engine: ReturnType<typeof makeEngine>;

  beforeEach(() => {
    engine = makeEngine();
  });

  describe('guard()', () => {
    it('wraps an object and returns a proxy', () => {
      const guardian = createDataGuardian(engine);
      const original = { name: 'test', value: 42 };
      const guarded = guardian.guard(original, 'test');

      expect(guarded.name).toBe('test');
      expect(guarded.value).toBe(42);
    });

    it('reports null property access', () => {
      const guardian = createDataGuardian(engine);
      const obj = { user: null as string | null };
      const guarded = guardian.guard(obj, 'state');

      const _value = guarded.user;

      expect(engine.report).toHaveBeenCalledTimes(1);
      const issue = engine.reported[0];
      expect(issue.category).toBe('null-access');
      expect(issue.path).toBe('user');
      expect(issue.foundValue).toBeNull();
    });

    it('reports undefined property access', () => {
      const guardian = createDataGuardian(engine);
      const obj = { profile: undefined as string | undefined };
      const guarded = guardian.guard(obj, 'state');

      const _value = guarded.profile;

      expect(engine.report).toHaveBeenCalledTimes(1);
      const issue = engine.reported[0];
      expect(issue.category).toBe('undefined-data');
      expect(issue.path).toBe('profile');
    });

    it('does NOT report valid property access', () => {
      const guardian = createDataGuardian(engine);
      const obj = { name: 'Alice', age: 30 };
      const guarded = guardian.guard(obj, 'user');

      const _name = guarded.name;
      const _age = guarded.age;

      expect(engine.report).not.toHaveBeenCalled();
    });

    it('tracks deep access paths', () => {
      const guardian = createDataGuardian(engine);
      const obj = {
        user: {
          profile: {
            avatar: null as string | null,
          },
        },
      };
      const guarded = guardian.guard(obj, 'state');

      const _avatar = guarded.user.profile.avatar;

      expect(engine.report).toHaveBeenCalledTimes(1);
      expect(engine.reported[0].path).toBe('user.profile.avatar');
    });

    it('works with arrays', () => {
      const guardian = createDataGuardian(engine);
      const obj = { items: [1, 2, 3] };
      const guarded = guardian.guard(obj, 'list');

      expect(guarded.items.length).toBe(3);
      expect(guarded.items.map((x: number) => x * 2)).toEqual([2, 4, 6]);
      expect(guarded.items.filter((x: number) => x > 1)).toEqual([2, 3]);
    });

    it('skips Symbol properties', () => {
      const guardian = createDataGuardian(engine);
      const sym = Symbol('test');
      const obj = { [sym]: 'value' };
      const guarded = guardian.guard(obj, 'sym-test');

      const _val = guarded[sym];
      expect(engine.report).not.toHaveBeenCalled();
    });

    it('does not proxy Date objects', () => {
      const guardian = createDataGuardian(engine);
      const date = new Date();
      const obj = { created: date };
      const guarded = guardian.guard(obj, 'dates');

      expect(guarded.created).toBe(date);
      expect(guarded.created instanceof Date).toBe(true);
    });

    it('returns null/undefined target as-is and reports', () => {
      const guardian = createDataGuardian(engine);

      const result = guardian.guard(null as unknown as object, 'null-test');
      expect(result).toBeNull();
      expect(engine.report).toHaveBeenCalledTimes(1);
      expect(engine.reported[0].severity).toBe('error');
    });
  });

  describe('guardDeep()', () => {
    it('handles circular references without infinite loop', () => {
      const guardian = createDataGuardian(engine);
      const obj: Record<string, unknown> = { name: 'circular' };
      obj.self = obj;

      expect(() => guardian.guardDeep(obj, 'circular')).not.toThrow();
    });

    it('respects maxDepth', () => {
      const guardian = createDataGuardian(engine, { maxDepth: 2 });
      const obj = {
        level1: {
          level2: {
            level3: {
              deep: null as string | null,
            },
          },
        },
      };
      const guarded = guardian.guardDeep(obj, 'deep-test');

      const _deep = guarded.level1.level2.level3.deep;
      expect(engine.report).not.toHaveBeenCalled();
    });
  });
});
