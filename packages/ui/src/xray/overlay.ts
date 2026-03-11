import type { ComponentInfo, XRayConfig } from './types';

const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_STRING_LENGTH = 50;
const TOOLTIP_MARGIN = 8;

interface OverlayElements {
  highlight: HTMLDivElement;
  tooltip: HTMLDivElement;
}

function createElement(
  shadowRoot: ShadowRoot,
  className: string,
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  shadowRoot.appendChild(el);
  return el;
}

function truncate(value: string, maxLen: number): string {
  return value.length > maxLen ? value.slice(0, maxLen) + '\u2026' : value;
}

function formatValue(
  value: unknown,
  depth: number,
  maxDepth: number,
  maxStringLen: number,
): { text: string; cssClass: string } {
  if (value === null) return { text: 'null', cssClass: 'dl-xray-value null' };
  if (value === undefined)
    return { text: 'undefined', cssClass: 'dl-xray-value null' };
  if (typeof value === 'string')
    return {
      text: `"${truncate(value, maxStringLen)}"`,
      cssClass: 'dl-xray-value string',
    };
  if (typeof value === 'number')
    return { text: String(value), cssClass: 'dl-xray-value number' };
  if (typeof value === 'boolean')
    return { text: String(value), cssClass: 'dl-xray-value boolean' };
  if (Array.isArray(value))
    return {
      text: `Array(${value.length})`,
      cssClass: 'dl-xray-value null',
    };
  if (typeof value === 'object') {
    if (depth >= maxDepth)
      return { text: '{…}', cssClass: 'dl-xray-value null' };
    const keys = Object.keys(value as Record<string, unknown>).slice(0, 5);
    const preview = keys.join(', ');
    return {
      text: `{${truncate(preview, maxStringLen)}}`,
      cssClass: 'dl-xray-value null',
    };
  }
  return { text: String(value), cssClass: 'dl-xray-value' };
}

function buildSection(
  title: string,
  entries: Record<string, unknown>,
  maxDepth: number,
  maxStringLen: number,
): HTMLDivElement {
  const section = document.createElement('div');
  section.className = 'dl-xray-section';

  const titleEl = document.createElement('div');
  titleEl.className = 'dl-xray-section-title';
  titleEl.textContent = title;
  section.appendChild(titleEl);

  const keys = Object.keys(entries).slice(0, 8);
  for (const key of keys) {
    const entry = document.createElement('div');
    entry.className = 'dl-xray-entry';

    const keyEl = document.createElement('span');
    keyEl.className = 'dl-xray-key';
    keyEl.textContent = `${key}: `;
    entry.appendChild(keyEl);

    const { text, cssClass } = formatValue(
      entries[key],
      0,
      maxDepth,
      maxStringLen,
    );
    const valEl = document.createElement('span');
    valEl.className = cssClass;
    valEl.textContent = text;
    entry.appendChild(valEl);

    section.appendChild(entry);
  }

  if (Object.keys(entries).length > 8) {
    const more = document.createElement('div');
    more.className = 'dl-xray-entry';
    more.textContent = `… ${Object.keys(entries).length - 8} more`;
    section.appendChild(more);
  }

  return section;
}

function positionTooltip(
  tooltip: HTMLDivElement,
  rect: DOMRect,
): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipRect = tooltip.getBoundingClientRect();
  const tw = tooltipRect.width || 280;
  const th = tooltipRect.height || 150;

  let top: number;
  let left: number;

  // Prefer below element
  if (rect.bottom + TOOLTIP_MARGIN + th < vh) {
    top = rect.bottom + TOOLTIP_MARGIN;
  } else if (rect.top - TOOLTIP_MARGIN - th > 0) {
    top = rect.top - TOOLTIP_MARGIN - th;
  } else {
    top = Math.max(TOOLTIP_MARGIN, vh - th - TOOLTIP_MARGIN);
  }

  // Horizontal: align left edge with element, clamp to viewport
  left = rect.left;
  if (left + tw > vw - TOOLTIP_MARGIN) {
    left = vw - tw - TOOLTIP_MARGIN;
  }
  if (left < TOOLTIP_MARGIN) {
    left = TOOLTIP_MARGIN;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

export function createXRayOverlay(
  shadowRoot: ShadowRoot,
  config: XRayConfig = {},
) {
  const maxDepth = config.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxStringLen = config.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  const showProps = config.showProps !== false;
  const showState = config.showState !== false;
  const showClassNames = config.showClassNames !== false;
  const showIssues = config.showIssues !== false;

  const elements: OverlayElements = {
    highlight: createElement(shadowRoot, 'dl-xray-highlight'),
    tooltip: createElement(shadowRoot, 'dl-xray-tooltip'),
  };

  function show(info: ComponentInfo): void {
    const { highlight, tooltip } = elements;

    // Position highlight
    highlight.style.top = `${info.rect.top}px`;
    highlight.style.left = `${info.rect.left}px`;
    highlight.style.width = `${info.rect.width}px`;
    highlight.style.height = `${info.rect.height}px`;
    highlight.style.display = 'block';

    // Build tooltip content
    tooltip.innerHTML = '';

    // Header: <ComponentName>  [framework]
    const header = document.createElement('div');
    header.className = 'dl-xray-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'dl-xray-name';
    nameEl.textContent =
      info.framework === 'dom'
        ? `<${info.name}>`
        : `<${info.name}>`;
    header.appendChild(nameEl);

    const fwBadge = document.createElement('span');
    fwBadge.className = 'dl-xray-framework';
    fwBadge.textContent = info.framework;
    header.appendChild(fwBadge);

    tooltip.appendChild(header);

    // Props section
    if (showProps && info.props && Object.keys(info.props).length > 0) {
      tooltip.appendChild(
        buildSection('props', info.props, maxDepth, maxStringLen),
      );
    }

    // State section
    if (showState && info.state && Object.keys(info.state).length > 0) {
      tooltip.appendChild(
        buildSection('state', info.state, maxDepth, maxStringLen),
      );
    }

    // ClassNames
    if (showClassNames && info.classNames.length > 0) {
      const section = document.createElement('div');
      section.className = 'dl-xray-section';
      const title = document.createElement('div');
      title.className = 'dl-xray-section-title';
      title.textContent = 'class';
      section.appendChild(title);
      const cls = document.createElement('div');
      cls.className = 'dl-xray-classes';
      cls.textContent = info.classNames.join(' ');
      section.appendChild(cls);
      tooltip.appendChild(section);
    }

    // Issue count
    if (showIssues && info.issueCount > 0) {
      const badge = document.createElement('div');
      badge.className = 'dl-xray-issues';
      badge.textContent = `\u26A0 ${info.issueCount} DevLens issue${info.issueCount !== 1 ? 's' : ''}`;
      tooltip.appendChild(badge);
    }

    tooltip.style.display = 'block';
    positionTooltip(tooltip, info.rect);
  }

  function hide(): void {
    elements.highlight.style.display = 'none';
    elements.tooltip.style.display = 'none';
  }

  function destroy(): void {
    elements.highlight.remove();
    elements.tooltip.remove();
  }

  return { show, hide, destroy };
}
