/** All panel styles — injected into Shadow DOM for isolation */
export function getPanelStyles(theme: "dark" | "light"): string {
  const isDark = theme === "dark";

  const colors = isDark
    ? {
        bg: "#1e1e2e",
        bgSecondary: "#262637",
        bgTertiary: "#2e2e42",
        bgHover: "#33334a",
        text: "#e2e2f0",
        textSecondary: "#9898b0",
        textMuted: "#6a6a82",
        border: "#3a3a52",
        borderLight: "#2e2e42",
        brand: "#6366f1",
        brandHover: "#818cf8",
        error: "#ef4444",
        errorBg: "rgba(239,68,68,0.12)",
        warn: "#f59e0b",
        warnBg: "rgba(245,158,11,0.12)",
        info: "#3b82f6",
        infoBg: "rgba(59,130,246,0.12)",
        scrollThumb: "#4a4a62",
        scrollTrack: "transparent",
        shadow: "rgba(0,0,0,0.5)",
        badge: "#ef4444",
      }
    : {
        bg: "#ffffff",
        bgSecondary: "#f8f8fc",
        bgTertiary: "#f0f0f6",
        bgHover: "#eaeaf2",
        text: "#1a1a2e",
        textSecondary: "#5a5a72",
        textMuted: "#8a8aa2",
        border: "#e2e2ea",
        borderLight: "#eeeef4",
        brand: "#6366f1",
        brandHover: "#4f46e5",
        error: "#dc2626",
        errorBg: "rgba(220,38,38,0.08)",
        warn: "#d97706",
        warnBg: "rgba(217,119,6,0.08)",
        info: "#2563eb",
        infoBg: "rgba(37,99,235,0.08)",
        scrollThumb: "#c8c8d4",
        scrollTrack: "transparent",
        shadow: "rgba(0,0,0,0.15)",
        badge: "#dc2626",
      };

  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: ${colors.text};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ─── Toggle Button ─── */
    .dl-toggle {
      position: fixed;
      z-index: 2147483647;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1px solid ${colors.border};
      background: ${colors.bgSecondary};
      color: ${colors.text};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 12px ${colors.shadow};
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      user-select: none;
      pointer-events: auto;
    }

    .dl-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 20px ${colors.shadow};
      background: ${colors.bgTertiary};
    }

    .dl-toggle:active {
      transform: scale(0.96);
    }

    .dl-toggle.bottom-right { bottom: 16px; right: 16px; }
    .dl-toggle.bottom-left  { bottom: 16px; left: 16px; }
    .dl-toggle.top-right    { top: 16px; right: 16px; }
    .dl-toggle.top-left     { top: 16px; left: 16px; }

    /* ─── Dashboard Open Button (optional, shown above toggle when dashboardUrl is set) ─── */
    .dl-dashboard-btn {
      position: fixed;
      z-index: 2147483647;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid ${colors.border};
      background: ${colors.bgSecondary};
      color: ${colors.textSecondary};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0;
      padding: 0;
      box-shadow: 0 2px 8px ${colors.shadow};
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      user-select: none;
      pointer-events: auto;
    }

    .dl-dashboard-btn svg {
      display: block;
      flex-shrink: 0;
    }

    .dl-dashboard-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 4px 16px ${colors.shadow};
      background: ${colors.brand};
      color: #fff;
      border-color: ${colors.brand};
    }

    .dl-dashboard-btn:active {
      transform: scale(0.96);
    }

    /* Position: bottom anchors sit 66px above the main toggle (42px + 8px gap + 16px margin) */
    .dl-dashboard-btn.bottom-right { bottom: 66px; right: 16px; }
    .dl-dashboard-btn.bottom-left  { bottom: 66px; left: 16px; }
    /* Position: top anchors sit 66px below the main toggle */
    .dl-dashboard-btn.top-right    { top: 66px; right: 16px; }
    .dl-dashboard-btn.top-left     { top: 66px; left: 16px; }

    .dl-toggle-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: ${colors.badge};
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      pointer-events: none;
    }

    .dl-toggle-badge.hidden { display: none; }

    @keyframes dl-pulse {
      0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
      70% { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
      100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    }

    .dl-toggle.pulse {
      animation: dl-pulse 0.6s ease-out;
    }

    /* ─── Panel Container ─── */
    .dl-panel {
      position: fixed;
      z-index: 2147483646;
      background: ${colors.bg};
      border: 1px solid ${colors.border};
      border-radius: 12px;
      box-shadow: 0 8px 32px ${colors.shadow};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(12px) scale(0.97);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .dl-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto !important;
    }

    .dl-panel.bottom-right { bottom: 68px; right: 16px; }
    .dl-panel.bottom-left  { bottom: 68px; left: 16px; }
    .dl-panel.top-right    { top: 68px; right: 16px; }
    .dl-panel.top-left     { top: 68px; left: 16px; }

    /* ─── Header ─── */
    .dl-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid ${colors.border};
      background: ${colors.bgSecondary};
      gap: 8px;
      flex-shrink: 0;
    }

    .dl-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dl-title {
      font-size: 13px;
      font-weight: 700;
      color: ${colors.brand};
      letter-spacing: -0.01em;
    }

    .dl-issue-count {
      font-size: 11px;
      font-weight: 600;
      color: ${colors.textSecondary};
      background: ${colors.bgTertiary};
      padding: 2px 7px;
      border-radius: 6px;
    }

    .dl-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dl-header-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      height: 26px;
      border: 1px solid transparent;
      border-radius: 5px;
      background: transparent;
      color: ${colors.textSecondary};
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.03em;
      transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
      user-select: none;
      white-space: nowrap;
    }

    .dl-header-btn svg {
      flex-shrink: 0;
      opacity: 0.75;
    }

    .dl-btn-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .dl-header-btn:hover {
      background: ${colors.bgTertiary};
      border-color: ${colors.border};
      color: ${colors.text};
    }

    .dl-header-btn:hover svg {
      opacity: 1;
    }

    .dl-header-btn--danger {
      color: ${colors.textMuted};
    }

    .dl-header-btn--danger:hover {
      background: ${colors.errorBg};
      border-color: ${colors.error};
      color: ${colors.error};
    }

    .dl-header-btn--close {
      width: 26px;
      padding: 0;
      justify-content: center;
      border-radius: 50%;
    }

    .dl-header-btn--close:hover {
      background: ${colors.bgTertiary};
      border-color: ${colors.border};
      color: ${colors.text};
    }

    /* ─── Filter Bar ─── */
    .dl-filters {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-bottom: 1px solid ${colors.borderLight};
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .dl-severity-btn {
      padding: 3px 10px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      background: transparent;
      color: ${colors.textSecondary};
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.12s ease;
      white-space: nowrap;
    }

    .dl-severity-btn:hover {
      background: ${colors.bgTertiary};
      color: ${colors.text};
    }

    .dl-severity-btn.active {
      background: ${colors.brand};
      border-color: ${colors.brand};
      color: #fff;
    }

    .dl-severity-btn.active-error {
      background: ${colors.error};
      border-color: ${colors.error};
      color: #fff;
    }

    .dl-severity-btn.active-warn {
      background: ${colors.warn};
      border-color: ${colors.warn};
      color: #fff;
    }

    .dl-severity-btn.active-info {
      background: ${colors.info};
      border-color: ${colors.info};
      color: #fff;
    }

    .dl-category-row {
      display: flex;
      gap: 3px;
      flex-wrap: wrap;
      width: 100%;
    }

    .dl-category-btn {
      padding: 2px 6px;
      border: 1px solid ${colors.borderLight};
      border-radius: 4px;
      background: transparent;
      color: ${colors.textMuted};
      cursor: pointer;
      font-size: 9px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.03em;
      transition: all 0.12s ease;
      white-space: nowrap;
    }

    .dl-category-btn:hover {
      background: ${colors.bgTertiary};
      color: ${colors.textSecondary};
    }

    .dl-category-btn.active {
      background: ${colors.bgTertiary};
      border-color: ${colors.brand};
      color: ${colors.brand};
    }

    .dl-search {
      flex: 1;
      min-width: 100px;
      padding: 4px 10px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      background: ${colors.bgSecondary};
      color: ${colors.text};
      font-size: 11px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.12s ease, background 0.12s ease;
      pointer-events: auto;
    }

    .dl-search::placeholder {
      color: ${colors.textMuted};
    }

    .dl-search:focus {
      border-color: ${colors.brand};
      background: ${colors.bg};
    }

    /* ─── Issue List ─── */
    .dl-issue-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .dl-issue-list::-webkit-scrollbar {
      width: 6px;
    }

    .dl-issue-list::-webkit-scrollbar-track {
      background: ${colors.scrollTrack};
    }

    .dl-issue-list::-webkit-scrollbar-thumb {
      background: ${colors.scrollThumb};
      border-radius: 3px;
    }

    .dl-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: ${colors.textMuted};
      gap: 8px;
    }

    .dl-empty-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .dl-empty-text {
      font-size: 13px;
      font-weight: 500;
    }

    .dl-empty-sub {
      font-size: 11px;
      opacity: 0.7;
    }

    /* ─── Issue Row ─── */
    .dl-issue {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid ${colors.borderLight};
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .dl-issue:hover {
      background: ${colors.bgHover};
    }

    .dl-issue:last-child {
      border-bottom: none;
    }

    .dl-issue-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: 6px;
    }

    .dl-issue-icon.error { background: ${colors.errorBg}; }
    .dl-issue-icon.warn  { background: ${colors.warnBg}; }
    .dl-issue-icon.info  { background: ${colors.infoBg}; }

    .dl-issue-body {
      flex: 1;
      min-width: 0;
    }

    .dl-issue-message {
      font-size: 12px;
      font-weight: 500;
      color: ${colors.text};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    .dl-issue-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
    }

    .dl-issue-category {
      font-size: 10px;
      font-weight: 600;
      color: ${colors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .dl-issue-time {
      font-size: 10px;
      color: ${colors.textMuted};
    }

    .dl-issue-severity {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .dl-issue-severity.error { background: ${colors.errorBg}; color: ${colors.error}; }
    .dl-issue-severity.warn  { background: ${colors.warnBg}; color: ${colors.warn}; }
    .dl-issue-severity.info  { background: ${colors.infoBg}; color: ${colors.info}; }

    /* ─── Issue Detail (Expanded) ─── */
    .dl-issue-detail {
      padding: 0 14px 10px 48px;
      display: none;
    }

    .dl-issue.expanded .dl-issue-detail {
      display: block;
    }

    .dl-issue.expanded {
      background: ${colors.bgSecondary};
    }

    .dl-detail-row {
      display: flex;
      gap: 8px;
      padding: 3px 0;
      font-size: 11px;
    }

    .dl-detail-label {
      color: ${colors.textMuted};
      flex-shrink: 0;
      min-width: 72px;
      font-weight: 600;
    }

    .dl-detail-value {
      color: ${colors.textSecondary};
      word-break: break-all;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
    }

    .dl-detail-suggestion {
      margin-top: 6px;
      padding: 6px 10px;
      background: ${colors.bgTertiary};
      border-radius: 6px;
      font-size: 11px;
      color: ${colors.textSecondary};
      border-left: 3px solid ${colors.brand};
    }

    .dl-detail-stack {
      margin-top: 6px;
      padding: 6px 10px;
      background: ${colors.bgTertiary};
      border-radius: 6px;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      color: ${colors.textMuted};
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
    }

    /* ─── Timeline View ─── */
    .dl-timeline {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 14px;
    }

    .dl-timeline::-webkit-scrollbar {
      width: 6px;
    }

    .dl-timeline::-webkit-scrollbar-thumb {
      background: ${colors.scrollThumb};
      border-radius: 3px;
    }

    .dl-timeline-item {
      display: flex;
      gap: 12px;
      padding-bottom: 16px;
      position: relative;
    }

    .dl-timeline-item:last-child {
      padding-bottom: 0;
    }

    .dl-timeline-line {
      position: absolute;
      left: 9px;
      top: 20px;
      bottom: 0;
      width: 2px;
      background: ${colors.border};
    }

    .dl-timeline-item:last-child .dl-timeline-line {
      display: none;
    }

    .dl-timeline-dot {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      z-index: 1;
    }

    .dl-timeline-dot.error { background: ${colors.errorBg}; border: 2px solid ${colors.error}; }
    .dl-timeline-dot.warn  { background: ${colors.warnBg}; border: 2px solid ${colors.warn}; }
    .dl-timeline-dot.info  { background: ${colors.infoBg}; border: 2px solid ${colors.info}; }

    .dl-timeline-content {
      flex: 1;
      min-width: 0;
    }

    .dl-timeline-time {
      font-size: 10px;
      color: ${colors.textMuted};
      margin-bottom: 2px;
    }

    .dl-timeline-message {
      font-size: 12px;
      color: ${colors.text};
      font-weight: 500;
      line-height: 1.4;
    }

    .dl-timeline-category {
      font-size: 10px;
      color: ${colors.textMuted};
      margin-top: 2px;
    }

    /* ─── Footer ─── */
    .dl-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px;
      border-top: 1px solid ${colors.border};
      background: ${colors.bgSecondary};
      flex-shrink: 0;
    }

    .dl-footer-label {
      font-size: 10px;
      color: ${colors.textMuted};
      font-weight: 500;
      opacity: 0.8;
      letter-spacing: 0.02em;
    }

    .dl-view-toggle {
      display: flex;
      gap: 2px;
      background: ${colors.bgTertiary};
      border-radius: 6px;
      padding: 2px;
    }

    .dl-view-btn {
      padding: 3px 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: ${colors.textMuted};
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      font-family: inherit;
      transition: all 0.1s ease;
    }

    .dl-view-btn:hover {
      color: ${colors.textSecondary};
    }

    .dl-view-btn.active {
      background: ${colors.bg};
      color: ${colors.text};
      box-shadow: 0 1px 3px ${colors.shadow};
    }

    /* ─── X-Ray Mode ─── */
    .dl-xray-highlight {
      position: fixed;
      pointer-events: none;
      border: 2px solid ${colors.brand};
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.08);
      z-index: 2147483645;
      display: none;
      transition: top 0.08s ease, left 0.08s ease, width 0.08s ease, height 0.08s ease;
    }

    .dl-xray-tooltip {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      max-width: 360px;
      min-width: 200px;
      background: ${colors.bg};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 8px 32px ${colors.shadow};
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      font-size: 11px;
      line-height: 1.5;
      color: ${colors.text};
      display: none;
      overflow: hidden;
    }

    .dl-xray-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${colors.borderLight};
    }

    .dl-xray-name {
      font-weight: 700;
      color: ${colors.brand};
      font-size: 12px;
    }

    .dl-xray-framework {
      font-size: 9px;
      font-weight: 600;
      color: ${colors.textMuted};
      background: ${colors.bgTertiary};
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dl-xray-section { margin-top: 6px; }

    .dl-xray-section-title {
      font-size: 9px;
      font-weight: 700;
      color: ${colors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 2px;
    }

    .dl-xray-entry {
      display: flex;
      gap: 6px;
      padding: 1px 0;
    }

    .dl-xray-key {
      color: ${colors.textSecondary};
      flex-shrink: 0;
    }

    .dl-xray-value {
      color: ${colors.text};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dl-xray-value.string { color: #a5d6a7; }
    .dl-xray-value.number { color: #90caf9; }
    .dl-xray-value.boolean { color: #f48fb1; }
    .dl-xray-value.null { color: ${colors.textMuted}; font-style: italic; }

    .dl-xray-classes {
      color: ${colors.textSecondary};
      font-size: 10px;
      word-break: break-all;
    }

    .dl-xray-issues {
      margin-top: 6px;
      padding: 4px 8px;
      background: ${colors.errorBg};
      border-radius: 4px;
      color: ${colors.error};
      font-size: 10px;
      font-weight: 600;
    }
  `;
}
