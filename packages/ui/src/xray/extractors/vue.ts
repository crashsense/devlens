/** Vue 3 component extraction — get component info from DOM elements */

export interface VueComponentData {
  name: string;
  props: Record<string, unknown> | null;
  state: Record<string, unknown> | null;
}

interface VueComponentInstance {
  type?: { name?: string; __name?: string };
  props?: Record<string, unknown>;
  setupState?: Record<string, unknown>;
}

/**
 * Vue 3 attaches `__vueParentComponent` to DOM elements rendered
 * by a component. This gives direct access to the component instance.
 */
function getVueInstance(element: HTMLElement): VueComponentInstance | null {
  const instance = (element as unknown as Record<string, unknown>)
    .__vueParentComponent;
  if (!instance || typeof instance !== 'object') return null;
  return instance as VueComponentInstance;
}

function getComponentName(instance: VueComponentInstance): string {
  return (
    instance.type?.name ||
    instance.type?.__name ||
    'AnonymousComponent'
  );
}

function filterState(
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!raw) return null;
  const filtered: Record<string, unknown> = {};
  let hasEntries = false;
  for (const key of Object.keys(raw)) {
    // Skip Vue internal keys (start with _ or $)
    if (key.startsWith('_') || key.startsWith('$')) continue;
    const value = raw[key];
    if (typeof value === 'function') continue;
    filtered[key] = value;
    hasEntries = true;
  }
  return hasEntries ? filtered : null;
}

function filterProps(
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!raw) return null;
  const filtered: Record<string, unknown> = {};
  let hasEntries = false;
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'function') continue;
    filtered[key] = value;
    hasEntries = true;
  }
  return hasEntries ? filtered : null;
}

export function extractVueInfo(
  element: HTMLElement,
): VueComponentData | null {
  const instance = getVueInstance(element);
  if (!instance) return null;

  return {
    name: getComponentName(instance),
    props: filterProps(instance.props),
    state: filterState(instance.setupState),
  };
}
