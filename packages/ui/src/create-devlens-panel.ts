import type { Reporter } from '@devlens/core';
import type { PanelConfig, PanelInstance } from './types';
import type { XRayInstance } from './xray/types';
import { createPanel } from './panel';
import { createPanelReporter } from './panel-reporter';
import { createXRayMode } from './xray/xray-mode';

export function createDevLensPanel(config?: PanelConfig): {
  panel: PanelInstance;
  reporter: Reporter;
  destroy: () => void;
} {
  function makeNoopResult(): { panel: PanelInstance; reporter: Reporter; destroy: () => void } {
    const noop = (): void => {};
    const noopPanel: PanelInstance = {
      open: noop, close: noop, toggle: noop, addIssue: noop, clear: noop,
      getIssues: () => [], disable: noop, enable: noop, destroy: noop,
    };
    return { panel: noopPanel, reporter: { report: noop }, destroy: noop };
  }

  if (typeof document === 'undefined') return makeNoopResult();

  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      return makeNoopResult();
    }
  } catch {
    // process may not exist in browser
  }

  if (document.getElementById('devlens-ui-root')) return makeNoopResult();

  const host = document.createElement('div');
  host.id = 'devlens-ui-root';
  host.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0;width:100vw;height:100vh;overflow:visible;';
  document.body.appendChild(host);

  const panel = createPanel(host, config);
  const reporter = createPanelReporter(panel);

  let xray: XRayInstance | null = null;
  const xrayEnabled = config?.xray !== false;
  if (xrayEnabled) {
    const shadow = host.shadowRoot;
    if (shadow) {
      const xrayConfig = typeof config?.xray === 'object' ? config.xray : {};
      xray = createXRayMode(shadow, () => panel.getIssues(), xrayConfig);
      xray.enable();
    }
  }

  function destroy(): void {
    xray?.destroy();
    panel.destroy();
    host.remove();
  }

  return { panel, reporter, destroy };
}
