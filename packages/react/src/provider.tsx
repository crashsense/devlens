import { useEffect, useRef, type ReactNode } from 'react';
import type { DevLensConfig } from '@devlens/core';
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
} from '@devlens/core';
import { DevLensContext } from './context';

export interface DevLensProviderProps {
  children: ReactNode;
  config?: DevLensConfig;
}

function isProductionEnv(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    );
  } catch {
    return false;
  }
}

export function DevLensProvider({
  children,
  config = {},
}: DevLensProviderProps) {
  const engineRef = useRef<ReturnType<typeof createDetectionEngine> | null>(
    null,
  );
  const cleanupRef = useRef<(() => void) | null>(null);
  const installedRef = useRef(false);

  if (config.enabled === false || isProductionEnv()) {
    return <>{children}</>;
  }

  if (!engineRef.current) {
    engineRef.current = createDetectionEngine(config);
  }

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || installedRef.current) return;

    installedRef.current = true;

    const networkConfig =
      config.modules?.network === false ? undefined : config.modules?.network;
    const catcherConfig =
      config.modules?.catcher === false ? undefined : config.modules?.catcher;

    const interceptors: Array<{ uninstall(): void }> = [];

    if (networkConfig !== undefined || config.modules?.network !== false) {
      const network = createNetworkInterceptor(engine, networkConfig);
      network.install();
      interceptors.push(network);
    }

    if (catcherConfig !== undefined || config.modules?.catcher !== false) {
      const catcher = createGlobalCatcher(engine, catcherConfig);
      catcher.install();
      interceptors.push(catcher);
    }

    cleanupRef.current = () => {
      for (const interceptor of interceptors) {
        interceptor.uninstall();
      }
      installedRef.current = false;
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <DevLensContext.Provider value={engineRef.current}>
      {children}
    </DevLensContext.Provider>
  );
}
