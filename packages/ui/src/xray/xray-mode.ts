import type { XRayConfig, XRayInstance, ComponentInfo, IssueProvider } from './types';
import { extractReactInfo } from './extractors/react';
import { extractVueInfo } from './extractors/vue';
import { extractDomInfo } from './extractors/dom';
import { createXRayOverlay } from './overlay';

const DEVLENS_ROOT_ID = 'devlens-ui-root';

function isInsideDevLens(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.id === DEVLENS_ROOT_ID) return true;
    current = current.parentElement;
  }
  return false;
}

function countRelatedIssues(
  getIssues: IssueProvider,
  componentName: string,
): number {
  if (!componentName || componentName === 'Unknown') return 0;
  const issues = getIssues();
  const nameLower = componentName.toLowerCase();
  return issues.filter((issue) => {
    const source = issue.source?.toLowerCase() ?? '';
    return source.includes(nameLower);
  }).length;
}

export function createXRayMode(
  shadowRoot: ShadowRoot,
  getIssues: IssueProvider,
  config: XRayConfig = {},
): XRayInstance {
  const activationKey = config.activationKey ?? 'Alt';
  const overlay = createXRayOverlay(shadowRoot, config);

  let active = false;
  let enabled = false;
  let rafId: number | null = null;
  let lastTarget: HTMLElement | null = null;

  function inspect(clientX: number, clientY: number): void {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element || !(element instanceof HTMLElement)) {
      overlay.hide();
      lastTarget = null;
      return;
    }

    if (element === lastTarget) return;
    lastTarget = element;

    if (isInsideDevLens(element)) {
      overlay.hide();
      return;
    }

    const rect = element.getBoundingClientRect();
    const classNames = Array.from(element.classList);
    const tagName = element.tagName.toLowerCase();

    // Try React → Vue → fallback DOM
    const reactData = extractReactInfo(element);
    if (reactData) {
      const info: ComponentInfo = {
        framework: 'react',
        name: reactData.name,
        props: reactData.props,
        state: reactData.state,
        classNames,
        tagName,
        rect,
        issueCount: countRelatedIssues(getIssues, reactData.name),
      };
      overlay.show(info);
      return;
    }

    const vueData = extractVueInfo(element);
    if (vueData) {
      const info: ComponentInfo = {
        framework: 'vue',
        name: vueData.name,
        props: vueData.props,
        state: vueData.state,
        classNames,
        tagName,
        rect,
        issueCount: countRelatedIssues(getIssues, vueData.name),
      };
      overlay.show(info);
      return;
    }

    const domData = extractDomInfo(element);
    const info: ComponentInfo = {
      framework: 'dom',
      name: domData.tagName,
      props: Object.keys(domData.attributes).length > 0 ? domData.attributes : null,
      state: null,
      classNames: domData.classNames,
      tagName: domData.tagName,
      rect,
      issueCount: 0,
    };
    overlay.show(info);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === activationKey && !active) {
      active = true;
      document.body.style.cursor = 'crosshair';
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.key === activationKey) {
      active = false;
      document.body.style.cursor = '';
      overlay.hide();
      lastTarget = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  }

  function onMouseMove(e: MouseEvent): void {
    if (!active) return;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      inspect(e.clientX, e.clientY);
    });
  }

  function enable(): void {
    if (enabled) return;
    enabled = true;
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('mousemove', onMouseMove, true);
  }

  function disable(): void {
    if (!enabled) return;
    enabled = false;
    active = false;
    document.body.style.cursor = '';
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('keyup', onKeyUp, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    overlay.hide();
    lastTarget = null;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function destroy(): void {
    disable();
    overlay.destroy();
  }

  return {
    enable,
    disable,
    destroy,
    get isActive() {
      return active;
    },
  };
}
