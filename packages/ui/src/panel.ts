import type { DetectedIssue, IssueCategory, Severity } from '@devlens/core';
import type { PanelConfig, PanelInstance, PanelState } from './types';
import { getPanelStyles } from './styles';
import { createPersistenceManager } from './persistence';
import { exportAsJSON, exportAsCSV, downloadFile } from './export';
// __DEVLENS_VERSION__ is replaced by tsup at build time (see tsup.config.ts define)
// Falls back to empty string in non-bundled environments (tests, typecheck)
declare const __DEVLENS_VERSION__: string;
const PANEL_VERSION: string = typeof __DEVLENS_VERSION__ !== 'undefined' ? __DEVLENS_VERSION__ : '';


const CATEGORY_LABELS: Record<IssueCategory, string> = {
  'network': '[NET]',
  'null-access': '[NULL]',
  'undefined-data': '[UNDEF]',
  'render-data': '[RENDER]',
  'unhandled-error': '[ERR]',
  'unhandled-rejection': '[REJ]',
  'type-mismatch': '[TYPE]',
  'api-contract': '[CONTRACT]',
};

const MAX_DISPLAYED_ISSUES = 200;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function matchesSearch(issue: DetectedIssue, search: string): boolean {
  if (!search) return true;
  const lower = search.toLowerCase();
  return (
    issue.message.toLowerCase().includes(lower) ||
    (issue.path?.toLowerCase().includes(lower) ?? false) ||
    issue.category.toLowerCase().includes(lower) ||
    (issue.source?.toLowerCase().includes(lower) ?? false)
  );
}

function filterIssues(issues: DetectedIssue[], filter: PanelState['filter']): DetectedIssue[] {
  return issues.filter((issue) => {
    if (filter.severity !== 'all' && issue.severity !== filter.severity) return false;
    if (filter.category !== 'all' && issue.category !== filter.category) return false;
    if (!matchesSearch(issue, filter.search)) return false;
    return true;
  });
}

export function createPanel(
  container: HTMLElement,
  config: PanelConfig = {},
): PanelInstance {
  const position = config.position ?? 'bottom-right';
  const panelWidth = config.panelWidth ?? 420;
  const panelHeight = config.panelHeight ?? 520;
  const theme = config.theme ?? 'dark';
  const hotkey = config.hotkey ?? 'ctrl+shift+d';

  const state: PanelState = {
    isOpen: config.defaultOpen ?? false,
    issues: [],
    filter: { severity: 'all', category: 'all', search: '' },
    activeView: 'list',
    selectedIssueId: null,
  };

  const shadow = container.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = getPanelStyles(theme);
  shadow.appendChild(styleEl);

  const toggleBtn = el('button', `dl-toggle ${position}`);
  toggleBtn.setAttribute('aria-label', 'Toggle DevLens panel');
  toggleBtn.title = `DevLens (${hotkey})`;
  toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><circle cx="11" cy="11" r="3" fill="currentColor" stroke="none"/></svg>`;

  const badge = el('span', 'dl-toggle-badge hidden');
  badge.textContent = '0';
  toggleBtn.appendChild(badge);
  shadow.appendChild(toggleBtn);

  // Optional dashboard-open button — rendered above the main toggle when dashboardUrl is set
  if (config.dashboardUrl) {
    const dashboardUrl = config.dashboardUrl;
    const dashBtn = el('button', `dl-dashboard-btn ${position}`);
    dashBtn.setAttribute('aria-label', 'Open DevLens Dashboard');
    dashBtn.title = 'Open DevLens Dashboard';
    dashBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    dashBtn.addEventListener('click', () => {
      window.open(dashboardUrl, 'devlens-dashboard');
    });
    shadow.appendChild(dashBtn);
  }

  let issueCountEl: HTMLElement;
  let searchInput: HTMLInputElement;
  let timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  const panel = el('div', `dl-panel ${position}`);
  panel.style.width = `${panelWidth}px`;
  panel.style.height = `${panelHeight}px`;
  if (state.isOpen) panel.classList.add('open');

  const header = buildHeader();
  panel.appendChild(header);

  const filters = buildFilters();
  panel.appendChild(filters);

  const issueList = el('div', 'dl-issue-list');
  panel.appendChild(issueList);

  const timeline = el('div', 'dl-timeline');
  timeline.style.display = 'none';
  panel.appendChild(timeline);

  const footer = buildFooter();
  panel.appendChild(footer);

  shadow.appendChild(panel);


  function buildHeader(): HTMLElement {
    const h = el('div', 'dl-header');

    const left = el('div', 'dl-header-left');
    const title = el('span', 'dl-title');
    title.textContent = 'DevLens';
    left.appendChild(title);

    issueCountEl = el('span', 'dl-issue-count');
    issueCountEl.textContent = '0 issues';
    left.appendChild(issueCountEl);

    h.appendChild(left);

    const actions = el('div', 'dl-header-actions');

    // Export JSON button
    const exportJsonBtn = el('button', 'dl-header-btn');
    exportJsonBtn.title = 'Export as JSON';
    exportJsonBtn.setAttribute('aria-label', 'Export as JSON');
    exportJsonBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm6 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-1-4h2V4H7v5z"/>
      </svg>
      <span class="dl-btn-label">JSON</span>
    `;
    exportJsonBtn.addEventListener('click', () => {
      const json = exportAsJSON(state.issues);
      downloadFile(json, `devlens-issues-${Date.now()}.json`, 'application/json');
    });
    actions.appendChild(exportJsonBtn);

    // Export CSV button
    const exportCsvBtn = el('button', 'dl-header-btn');
    exportCsvBtn.title = 'Export as CSV';
    exportCsvBtn.setAttribute('aria-label', 'Export as CSV');
    exportCsvBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zM9.5 3V0L14 4.5H9.5V3zM3.5 9.5l1.5 1.5-1.5 1.5.7.7L6 11l-1.8-1.8-.7.7zm5.5 3H10V9h-1v2.5l-1-.5v1l1 .5zm1.5-3.5v4h1V9h-1z"/>
      </svg>
      <span class="dl-btn-label">CSV</span>
    `;
    exportCsvBtn.addEventListener('click', () => {
      const csv = exportAsCSV(state.issues);
      downloadFile(csv, `devlens-issues-${Date.now()}.csv`, 'text/csv');
    });
    actions.appendChild(exportCsvBtn);

    // Clear button
    const clearBtn = el('button', 'dl-header-btn dl-header-btn--danger');
    clearBtn.title = 'Clear all issues';
    clearBtn.setAttribute('aria-label', 'Clear all issues');
    clearBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
      </svg>
      <span class="dl-btn-label">CLR</span>
    `;
    clearBtn.addEventListener('click', () => clearIssues());
    actions.appendChild(clearBtn);

    // Close button
    const closeBtn = el('button', 'dl-header-btn dl-header-btn--close');
    closeBtn.title = 'Close panel';
    closeBtn.setAttribute('aria-label', 'Close panel');
    closeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    `;
    closeBtn.addEventListener('click', () => closePanel());
    actions.appendChild(closeBtn);

    h.appendChild(actions);
    return h;
  }

  function buildFilters(): HTMLElement {
    const f = el('div', 'dl-filters');

    const severities: Array<{ label: string; value: Severity | 'all'; activeClass: string }> = [
      { label: 'All', value: 'all', activeClass: 'active' },
      { label: 'Error', value: 'error', activeClass: 'active-error' },
      { label: 'Warn', value: 'warn', activeClass: 'active-warn' },
      { label: 'Info', value: 'info', activeClass: 'active-info' },
    ];

    for (const sev of severities) {
      const btn = el('button', 'dl-severity-btn');
      btn.textContent = sev.label;
      btn.dataset.severity = sev.value;
      if (sev.value === state.filter.severity) {
        btn.classList.add(sev.activeClass);
      }
      btn.addEventListener('click', () => {
        state.filter.severity = sev.value;
        updateFilterButtons();
        renderIssues();
      });
      f.appendChild(btn);
    }

    searchInput = el('input', 'dl-search') as HTMLInputElement;
    searchInput.type = 'text';
    searchInput.placeholder = 'Search issues...';
    // Ensure search input receives events regardless of parent pointer-events
    searchInput.style.pointerEvents = 'auto';
    searchInput.addEventListener('input', () => {
      state.filter.search = searchInput.value;
      renderIssues();
    });
    // Prevent keyboard events from bubbling to host app (avoid shortcut conflicts)
    searchInput.addEventListener('keydown', (e) => e.stopPropagation());
    searchInput.addEventListener('keyup', (e) => e.stopPropagation());
    f.appendChild(searchInput);

    return f;
  }

  function buildFooter(): HTMLElement {
    const f = el('div', 'dl-footer');

    const label = el('span', 'dl-footer-label');
    const versionSuffix = PANEL_VERSION ? ` v${PANEL_VERSION}` : '';
    label.textContent = `DevLens${versionSuffix}`;
    f.appendChild(label);

    const viewToggle = el('div', 'dl-view-toggle');

    const listBtn = el('button', 'dl-view-btn active');
    listBtn.textContent = 'List';
    listBtn.addEventListener('click', () => switchView('list'));
    viewToggle.appendChild(listBtn);

    const timelineBtn = el('button', 'dl-view-btn');
    timelineBtn.textContent = 'Timeline';
    timelineBtn.addEventListener('click', () => switchView('timeline'));
    viewToggle.appendChild(timelineBtn);

    f.appendChild(viewToggle);
    return f;
  }

  function updateFilterButtons(): void {
    const buttons = shadow.querySelectorAll('.dl-severity-btn');
    buttons.forEach((btn) => {
      const htmlBtn = btn as HTMLElement;
      htmlBtn.classList.remove('active', 'active-error', 'active-warn', 'active-info');
      const val = htmlBtn.dataset.severity;
      if (val === state.filter.severity) {
        if (val === 'all') htmlBtn.classList.add('active');
        else htmlBtn.classList.add(`active-${val}`);
      }
    });
  }

  function updateBadge(): void {
    const count = state.issues.length;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('hidden', count === 0);
    issueCountEl.textContent = `${count} issue${count !== 1 ? 's' : ''}`;
  }

  function pulseToggle(): void {
    toggleBtn.classList.remove('pulse');
    void toggleBtn.offsetWidth;
    toggleBtn.classList.add('pulse');
  }

  function renderIssues(): void {
    const filtered = filterIssues(state.issues, state.filter);

    if (state.activeView === 'list') {
      renderListView(filtered);
    } else {
      renderTimelineView(filtered);
    }
  }

  function renderListView(filtered: DetectedIssue[]): void {
    issueList.innerHTML = '';

    if (filtered.length === 0) {
      const empty = el('div', 'dl-empty');
      const icon = el('div', 'dl-empty-icon');
      icon.textContent = '--';
      empty.appendChild(icon);
      const text = el('div', 'dl-empty-text');
      text.textContent = 'No issues detected';
      empty.appendChild(text);
      const sub = el('div', 'dl-empty-sub');
      sub.textContent = state.issues.length > 0 ? 'Try adjusting your filters' : 'DevLens is watching...';
      empty.appendChild(sub);
      issueList.appendChild(empty);
      return;
    }

    const displayed = filtered.slice(-MAX_DISPLAYED_ISSUES);
    for (const issue of displayed) {
      issueList.appendChild(createIssueRow(issue));
    }

    issueList.scrollTop = issueList.scrollHeight;
  }

  function createIssueRow(issue: DetectedIssue): HTMLElement {
    const row = el('div', 'dl-issue');

    const iconWrap = el('div', `dl-issue-icon ${issue.severity}`);
    iconWrap.textContent = CATEGORY_LABELS[issue.category] ?? '[DL]';
    row.appendChild(iconWrap);

    const body = el('div', 'dl-issue-body');

    const message = el('div', 'dl-issue-message');
    message.textContent = issue.message;
    message.title = issue.message;
    body.appendChild(message);

    const meta = el('div', 'dl-issue-meta');

    const category = el('span', 'dl-issue-category');
    category.textContent = issue.category;
    meta.appendChild(category);

    const time = el('span', 'dl-issue-time');
    time.textContent = relativeTime(issue.timestamp);
    time.dataset.timestamp = String(issue.timestamp);
    meta.appendChild(time);

    const sevBadge = el('span', `dl-issue-severity ${issue.severity}`);
    sevBadge.textContent = issue.severity;
    meta.appendChild(sevBadge);

    body.appendChild(meta);
    row.appendChild(body);

    const detail = buildDetailView(issue);
    row.appendChild(detail);

    row.addEventListener('click', () => {
      const isExpanded = row.classList.contains('expanded');
      const allExpanded = shadow.querySelectorAll('.dl-issue.expanded');
      allExpanded.forEach((r) => r.classList.remove('expanded'));
      if (!isExpanded) {
        row.classList.add('expanded');
        state.selectedIssueId = issue.id;
      } else {
        state.selectedIssueId = null;
      }
    });

    return row;
  }

  function buildDetailView(issue: DetectedIssue): HTMLElement {
    const detail = el('div', 'dl-issue-detail');

    if (issue.path) {
      detail.appendChild(createDetailRow('Path', issue.path));
    }

    if (issue.foundValue !== undefined) {
      const val = issue.foundValue === null ? 'null' : String(issue.foundValue);
      detail.appendChild(createDetailRow('Value', val));
    }

    if (issue.source) {
      detail.appendChild(createDetailRow('Source', issue.source));
    }

    if (issue.details) {
      for (const [key, value] of Object.entries(issue.details)) {
        const displayVal = typeof value === 'string' ? value : JSON.stringify(value);
        detail.appendChild(createDetailRow(key, displayVal));
      }
    }

    if (issue.suggestion) {
      const suggestion = el('div', 'dl-detail-suggestion');
      suggestion.textContent = issue.suggestion;
      detail.appendChild(suggestion);
    }

    if (issue.stack) {
      const stack = el('div', 'dl-detail-stack');
      stack.textContent = issue.stack.split('\n').slice(0, 5).join('\n');
      detail.appendChild(stack);
    }

    return detail;
  }

  function createDetailRow(label: string, value: string): HTMLElement {
    const row = el('div', 'dl-detail-row');
    const labelEl = el('span', 'dl-detail-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    const valueEl = el('span', 'dl-detail-value');
    valueEl.textContent = value;
    row.appendChild(valueEl);
    return row;
  }

  function renderTimelineView(filtered: DetectedIssue[]): void {
    timeline.innerHTML = '';

    if (filtered.length === 0) {
      const empty = el('div', 'dl-empty');
      const icon = el('div', 'dl-empty-icon');
      icon.textContent = '--';
      empty.appendChild(icon);
      const text = el('div', 'dl-empty-text');
      text.textContent = 'No issues to display';
      empty.appendChild(text);
      timeline.appendChild(empty);
      return;
    }

    const displayed = filtered.slice(-MAX_DISPLAYED_ISSUES);
    for (const issue of displayed) {
      timeline.appendChild(createTimelineItem(issue));
    }

    timeline.scrollTop = timeline.scrollHeight;
  }

  function createTimelineItem(issue: DetectedIssue): HTMLElement {
    const item = el('div', 'dl-timeline-item');

    const line = el('div', 'dl-timeline-line');
    item.appendChild(line);

    const dot = el('div', `dl-timeline-dot ${issue.severity}`);
    item.appendChild(dot);

    const content = el('div', 'dl-timeline-content');

    const time = el('div', 'dl-timeline-time');
    time.textContent = relativeTime(issue.timestamp);
    time.dataset.timestamp = String(issue.timestamp);
    content.appendChild(time);

    const message = el('div', 'dl-timeline-message');
    message.textContent = issue.message;
    content.appendChild(message);

    const cat = el('div', 'dl-timeline-category');
    cat.textContent = `${CATEGORY_LABELS[issue.category] ?? ''} ${issue.category}`;
    content.appendChild(cat);

    item.appendChild(content);
    return item;
  }

  function switchView(view: 'list' | 'timeline'): void {
    state.activeView = view;
    issueList.style.display = view === 'list' ? '' : 'none';
    timeline.style.display = view === 'timeline' ? '' : 'none';

    const viewBtns = shadow.querySelectorAll('.dl-view-btn');
    viewBtns.forEach((btn, i) => {
      btn.classList.toggle('active', (i === 0 && view === 'list') || (i === 1 && view === 'timeline'));
    });

    renderIssues();
  }

  function openPanel(): void {
    state.isOpen = true;
    panel.classList.add('open');
  }

  function closePanel(): void {
    state.isOpen = false;
    panel.classList.remove('open');
  }

  function togglePanel(): void {
    if (state.isOpen) closePanel();
    else openPanel();
  }

  function handleHotkey(e: KeyboardEvent): void {
    const parts = hotkey.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsCtrl = parts.includes('ctrl');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');
    const needsMeta = parts.includes('meta');

    if (
      e.key.toLowerCase() === key &&
      e.ctrlKey === needsCtrl &&
      e.shiftKey === needsShift &&
      e.altKey === needsAlt &&
      e.metaKey === needsMeta
    ) {
      e.preventDefault();
      togglePanel();
    }
  }

  function updateRelativeTimes(): void {
    const timeEls = shadow.querySelectorAll('[data-timestamp]');
    timeEls.forEach((timeEl) => {
      const ts = Number((timeEl as HTMLElement).dataset.timestamp);
      if (ts) (timeEl as HTMLElement).textContent = relativeTime(ts);
    });
  }

  toggleBtn.addEventListener('click', togglePanel);
  document.addEventListener('keydown', handleHotkey);
  timeUpdateInterval = setInterval(updateRelativeTimes, 5000);

  renderIssues();

  const persistence = createPersistenceManager();
  const restoredIssues = persistence.load();
  if (restoredIssues.length > 0) {
    state.issues = restoredIssues;
    updateBadge();
    renderIssues();
  }
  function addIssue(issue: DetectedIssue): void {
    state.issues.push(issue);
    if (state.issues.length > 1000) {
      state.issues = state.issues.slice(-500);
    }
    updateBadge();
    pulseToggle();
    renderIssues();
    persistence.save(state.issues);
  }
  function clearIssues(): void {
    state.issues = [];
    state.selectedIssueId = null;
    updateBadge();
    renderIssues();
    persistence.clear();
  }

  function getIssues(): readonly DetectedIssue[] {
    return [...state.issues];
  }

  function destroy(): void {
    document.removeEventListener('keydown', handleHotkey);
    if (timeUpdateInterval !== null) {
      clearInterval(timeUpdateInterval);
      timeUpdateInterval = null;
    }
    shadow.innerHTML = '';
  }

  return {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    addIssue,
    clear: clearIssues,
    getIssues,
    destroy,
  };
}
