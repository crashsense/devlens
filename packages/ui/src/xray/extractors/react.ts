/** React fiber extraction — get component info from DOM elements */

interface FiberNode {
  tag: number;
  type: { displayName?: string; name?: string } | string | null;
  memoizedProps: Record<string, unknown> | null;
  memoizedState: unknown;
  return: FiberNode | null;
  next?: FiberNode | null;
}

export interface ReactComponentData {
  name: string;
  props: Record<string, unknown> | null;
  state: Record<string, unknown> | null;
}

/**
 * Find the React fiber key on a DOM element.
 * React attaches `__reactFiber$<hash>` (React 18+) or
 * `__reactInternalInstance$<hash>` (React 16-17) to host DOM nodes.
 */
function findFiberKey(element: HTMLElement): string | undefined {
  return Object.keys(element).find(
    (k) =>
      k.startsWith('__reactFiber$') ||
      k.startsWith('__reactInternalInstance$'),
  );
}

function getFiber(element: HTMLElement): FiberNode | null {
  const key = findFiberKey(element);
  if (!key) return null;
  return (element as unknown as Record<string, FiberNode>)[key] ?? null;
}

/** Walk up the fiber tree to find the nearest user component (function or class) */
function findComponentFiber(fiber: FiberNode): FiberNode | null {
  let current: FiberNode | null = fiber;
  // Safety: max 50 hops to avoid infinite loops on corrupt trees
  let hops = 0;
  while (current && hops < 50) {
    // tag 0 = FunctionComponent, tag 1 = ClassComponent
    if (current.tag === 0 || current.tag === 1) {
      return current;
    }
    current = current.return;
    hops++;
  }
  return null;
}

function getComponentName(fiber: FiberNode): string {
  const type = fiber.type;
  if (type === null || type === undefined) return 'Unknown';
  if (typeof type === 'string') return type;
  return type.displayName || type.name || 'Anonymous';
}

const SKIP_PROP_KEYS = new Set(['children', 'key', 'ref', '__self', '__source']);

function filterProps(
  raw: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!raw) return null;
  const filtered: Record<string, unknown> = {};
  let hasEntries = false;
  for (const [key, value] of Object.entries(raw)) {
    if (SKIP_PROP_KEYS.has(key)) continue;
    if (typeof value === 'function') continue;
    filtered[key] = value;
    hasEntries = true;
  }
  return hasEntries ? filtered : null;
}

/**
 * Extract hook state values from a function component fiber.
 * Function component state is a linked list starting at `fiber.memoizedState`.
 * Each node: `{ memoizedState, next }`.
 */
function extractHookState(
  fiber: FiberNode,
): Record<string, unknown> | null {
  const memoized = fiber.memoizedState;
  if (!memoized || typeof memoized !== 'object') return null;

  const result: Record<string, unknown> = {};
  let node = memoized as { memoizedState?: unknown; next?: unknown } | null;
  let index = 0;
  // Walk the hooks linked list (max 30 hooks to prevent runaway)
  while (node && typeof node === 'object' && index < 30) {
    const val = (node as { memoizedState?: unknown }).memoizedState;
    // Skip refs, effects, and functions — only keep serializable state
    if (
      val !== undefined &&
      typeof val !== 'function' &&
      !(val && typeof val === 'object' && 'current' in (val as Record<string, unknown>))
    ) {
      result[`hook_${index}`] = val;
    }
    node = (node as { next?: unknown }).next as typeof node;
    index++;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function extractClassState(
  fiber: FiberNode,
): Record<string, unknown> | null {
  const memoized = fiber.memoizedState;
  if (!memoized || typeof memoized !== 'object') return null;
  // Class component state is a plain object
  if (Array.isArray(memoized)) return null;
  const obj = memoized as Record<string, unknown>;
  const filtered: Record<string, unknown> = {};
  let hasEntries = false;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'function') continue;
    filtered[key] = value;
    hasEntries = true;
  }
  return hasEntries ? filtered : null;
}

export function extractReactInfo(
  element: HTMLElement,
): ReactComponentData | null {
  const fiber = getFiber(element);
  if (!fiber) return null;

  const componentFiber = findComponentFiber(fiber);
  if (!componentFiber) return null;

  const name = getComponentName(componentFiber);
  const props = filterProps(componentFiber.memoizedProps);

  // tag 0 = FunctionComponent, tag 1 = ClassComponent
  const state =
    componentFiber.tag === 1
      ? extractClassState(componentFiber)
      : extractHookState(componentFiber);

  return { name, props, state };
}
