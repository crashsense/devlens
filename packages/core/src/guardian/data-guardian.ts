import type {
  DevLensEngine,
  DataGuardianConfig,
  DetectedIssue,
  IssueCategory,
} from '../types';

const SKIP_PROPERTIES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  'toJSON',
  'toString',
  'valueOf',
  'length',
  'then',
  'catch',
  'finally',
  '$$typeof',
  '_owner',
  '_store',
  'ref',
  'key',
  '_self',
  '_source',
  'displayName',
  'nodeType',
]);

const NON_PROXYABLE_TYPES = new Set([
  '[object Date]',
  '[object RegExp]',
  '[object Map]',
  '[object Set]',
  '[object WeakMap]',
  '[object WeakSet]',
  '[object Error]',
  '[object Promise]',
  '[object ArrayBuffer]',
  '[object DataView]',
  '[object Int8Array]',
  '[object Uint8Array]',
  '[object Float32Array]',
  '[object Float64Array]',
]);

function isProxyable(value: unknown): value is object {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' && typeof value !== 'function') return false;
  const tag = Object.prototype.toString.call(value);
  return !NON_PROXYABLE_TYPES.has(tag);
}

export function createDataGuardian(
  engine: DevLensEngine,
  config?: DataGuardianConfig | boolean,
) {
  const resolvedConfig: DataGuardianConfig =
    typeof config === 'boolean' || config === undefined ? {} : config;

  const maxDepth = resolvedConfig.maxDepth ?? 5;
  const ignorePaths = new Set(resolvedConfig.ignorePaths ?? []);
  const verbose = resolvedConfig.verbose ?? false;

  const proxyCache = new WeakMap<object, object>();

  function shouldIgnorePath(path: string): boolean {
    if (ignorePaths.size === 0) return false;
    return ignorePaths.has(path);
  }

  function reportAccess(
    path: string,
    value: null | undefined,
    label: string,
  ): void {
    if (!engine.isEnabled()) return;
    if (shouldIgnorePath(path)) return;

    const isNull = value === null;
    const category: IssueCategory = isNull ? 'null-access' : 'undefined-data';
    const prop = path.split('.').pop() ?? path;

    const issue: DetectedIssue = {
      id: `${category}:${path}`,
      timestamp: Date.now(),
      severity: 'warn',
      category,
      message: `Property "${prop}" is ${isNull ? 'null' : 'undefined'} at path "${path}"`,
      path,
      foundValue: value,
      expectedType: 'non-nullish value',
      source: label,
      suggestion: `Check if "${prop}" is loaded/initialized before accessing. Full path: ${path}`,
    };

    engine.report(issue);
  }

  function createProxy<T extends object>(
    target: T,
    label: string,
    parentPath: string,
    depth: number,
  ): T {
    if (depth > maxDepth) return target;

    const cached = proxyCache.get(target);
    if (cached) return cached as T;

    const proxy = new Proxy(target, {
      get(obj, prop, receiver): unknown {
        if (typeof prop === 'symbol') {
          return Reflect.get(obj, prop, receiver);
        }

        if (SKIP_PROPERTIES.has(prop)) {
          return Reflect.get(obj, prop, receiver);
        }

        const currentPath = parentPath ? `${parentPath}.${prop}` : prop;
        const value = Reflect.get(obj, prop, receiver);

        if (value === null || value === undefined) {
          const hasOwn =
            Object.prototype.hasOwnProperty.call(obj, prop) ||
            prop in obj;
          if (hasOwn) {
            reportAccess(currentPath, value as null | undefined, label);
          } else if (verbose) {
            reportAccess(currentPath, value as null | undefined, label);
          }
          return value;
        }

        if (typeof value === 'function') {
          return value;
        }

        if (isProxyable(value)) {
          return createProxy(
            value as object,
            label,
            currentPath,
            depth + 1,
          );
        }

        return value;
      },

      has(obj, prop): boolean {
        return Reflect.has(obj, prop);
      },

      ownKeys(obj): (string | symbol)[] {
        return Reflect.ownKeys(obj);
      },

      getOwnPropertyDescriptor(
        obj,
        prop,
      ): PropertyDescriptor | undefined {
        return Reflect.getOwnPropertyDescriptor(obj, prop);
      },

      set(obj, prop, value, receiver): boolean {
        return Reflect.set(obj, prop, value, receiver);
      },

      deleteProperty(obj, prop): boolean {
        return Reflect.deleteProperty(obj, prop);
      },
    });

    proxyCache.set(target, proxy);
    return proxy as T;
  }

  function guard<T extends object>(target: T, label?: string): T {
    if (target === null || target === undefined) {
      const nullLabel = label ?? 'unknown';
      const issue: DetectedIssue = {
        id: `null-access:${nullLabel}:root`,
        timestamp: Date.now(),
        severity: 'error',
        category: target === null ? 'null-access' : 'undefined-data',
        message: `Attempted to guard a ${target === null ? 'null' : 'undefined'} value (label: "${nullLabel}")`,
        path: nullLabel,
        foundValue: target,
        source: nullLabel,
        suggestion: `The value passed to guard() is ${target === null ? 'null' : 'undefined'}. Ensure data is loaded before guarding.`,
      };
      engine.report(issue);
      return target;
    }

    if (!isProxyable(target)) return target;
    return createProxy(target, label ?? 'guarded', '', 0);
  }

  function guardDeep<T extends object>(target: T, label?: string): T {
    if (target === null || target === undefined) return guard(target, label);
    if (!isProxyable(target)) return target;

    const seen = new WeakSet<object>();
    const resolvedLabel = label ?? 'guarded';

    function walkAndProxy(obj: object, path: string, depth: number): void {
      if (depth > maxDepth) return;
      if (seen.has(obj)) return;
      seen.add(obj);

      const keys = Object.keys(obj);
      for (const key of keys) {
        const value = (obj as Record<string, unknown>)[key];
        if (value !== null && value !== undefined && isProxyable(value)) {
          const childPath = path ? `${path}.${key}` : key;
          createProxy(value as object, resolvedLabel, childPath, depth + 1);
          walkAndProxy(value as object, childPath, depth + 1);
        }
      }
    }

    walkAndProxy(target, '', 0);
    return createProxy(target, resolvedLabel, '', 0);
  }

  function unguardAll(): void {
 }

  return { guard, guardDeep, unguardAll };
}
