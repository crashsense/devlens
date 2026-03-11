/** Vanilla DOM extraction — fallback when no framework detected */

export interface DomElementData {
  tagName: string;
  classNames: string[];
  attributes: Record<string, string>;
}

const MAX_ATTRIBUTES = 10;

/** Attribute names worth showing */
const INTERESTING_ATTRS = new Set([
  'id',
  'role',
  'aria-label',
  'aria-describedby',
  'type',
  'name',
  'href',
  'src',
  'alt',
  'title',
  'placeholder',
  'value',
  'action',
  'method',
]);

export function extractDomInfo(element: HTMLElement): DomElementData {
  const tagName = element.tagName.toLowerCase();
  const classNames = Array.from(element.classList);

  const attributes: Record<string, string> = {};
  let count = 0;

  // Prioritize interesting attributes
  for (const attr of INTERESTING_ATTRS) {
    if (count >= MAX_ATTRIBUTES) break;
    const val = element.getAttribute(attr);
    if (val !== null) {
      attributes[attr] = val;
      count++;
    }
  }

  // Add data-* attributes
  for (const key of Object.keys(element.dataset)) {
    if (count >= MAX_ATTRIBUTES) break;
    const val = element.dataset[key];
    if (val !== undefined) {
      attributes[`data-${key}`] = val;
      count++;
    }
  }

  return { tagName, classNames, attributes };
}
