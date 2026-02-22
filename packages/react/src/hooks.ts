import { useContext, useState, useMemo, useEffect, useRef } from 'react';
import type { DevLensEngine, DetectedIssue } from '@devlens/core';
import { createDataGuardian } from '@devlens/core';
import { DevLensContext } from './context';

export function useDevLens(): DevLensEngine | null {
  return useContext(DevLensContext);
}

export function useGuardedState<T extends object>(
  initialState: T | (() => T),
  label?: string,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const engine = useDevLens();
  const [state, setState] = useState<T>(initialState);

  const guardedState = useMemo(() => {
    if (!engine || !engine.isEnabled()) return state;
    if (state === null || state === undefined) return state;
    if (typeof state !== 'object') return state;

    const guardian = createDataGuardian(engine);
    return guardian.guard(state, label);
  }, [state, engine, label]);

  return [guardedState, setState];
}

export function useGuardedEffect(
  data: Record<string, unknown>,
  label?: string,
): void {
  const engine = useDevLens();
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!engine || !engine.isEnabled()) return;

    const currentData = dataRef.current;
    const resolvedLabel = label ?? 'useGuardedEffect';

    const entries = Object.entries(currentData);
    for (const [key, value] of entries) {
      if (value === null || value === undefined) {
        const issue: DetectedIssue = {
          id: `render-data:${resolvedLabel}:${key}`,
          timestamp: Date.now(),
          severity: 'warn',
          category: 'render-data',
          message: `Render data "${key}" is ${value === null ? 'null' : 'undefined'} in ${resolvedLabel}`,
          path: `${resolvedLabel}.${key}`,
          foundValue: value,
          expectedType: 'non-nullish value',
          source: resolvedLabel,
          suggestion: `"${key}" is ${value === null ? 'null' : 'undefined'} — this may cause the UI to not render correctly. Check data loading.`,
        };
        engine.report(issue);
      }
    }
  });
}
