import type { DetectedIssue, Reporter } from "@devlens/core";
import { generateSessionId } from "./protocol";
import { createAdapter } from "./adapter";
import { getInspectorHTML } from "./inspector-html";

export interface InspectorConfig {
  width?: number;
  height?: number;
  sessionId?: string;
  /**
   * URL of the DevLens Dashboard app.
   * When set, `open()` navigates to this URL (with `?session=<id>`).
   * When omitted, falls back to the legacy Blob-URL popup.
   *
   * Example: `'http://localhost:5174'` or `'https://dashboard.devlens.dev'`
   */
  dashboardUrl?: string;
}

export interface InspectorInstance {
  sendIssue(issue: DetectedIssue): void;
  sendClear(): void;
  open(): void;
  close(): void;
  destroy(): void;
  readonly connected: boolean;
  readonly isOpen: boolean;
  readonly sessionId: string;
  /** Full URL to open the dashboard for this session */
  readonly dashboardLink: string;
}

const NOOP_INSTANCE: InspectorInstance = {
  sendIssue: () => {},
  sendClear: () => {},
  open: () => {},
  close: () => {},
  destroy: () => {},
  connected: false,
  isOpen: false,
  sessionId: "",
  dashboardLink: "",
};

export function createDevLensInspector(
  config?: InspectorConfig,
): InspectorInstance {
  if (typeof document === "undefined") {
    return NOOP_INSTANCE;
  }

  try {
    if (
      typeof process !== "undefined" &&
      process.env?.NODE_ENV === "production"
    ) {
      return NOOP_INSTANCE;
    }
  } catch {
    // process may not exist in browser
  }

  const sessionId = config?.sessionId ?? generateSessionId();
  const width = config?.width ?? 1200;
  const height = config?.height ?? 800;
  const dashboardUrl = config?.dashboardUrl;
  const adapter = createAdapter(sessionId);

  let inspectorWindow: Window | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function getDashboardLink(): string {
    if (dashboardUrl) {
      const base = dashboardUrl.replace(/\/$/, "");
      return `${base}?session=${sessionId}`;
    }
    return "";
  }

  function open(): void {
    if (inspectorWindow && !inspectorWindow.closed) {
      inspectorWindow.focus();
      return;
    }

    if (dashboardUrl) {
      // Dashboard mode — open the hosted dashboard URL in a new tab
      const url = getDashboardLink();
      inspectorWindow = window.open(url, `devlens-dashboard-${sessionId}`);
    } else {
      const html = getInspectorHTML(sessionId);
      inspectorWindow = window.open(
        "",
        `devlens-inspector-${sessionId}`,
        `width=${width},height=${height},menubar=no,toolbar=no,status=no`,
      );

      if (inspectorWindow) {
        inspectorWindow.document.open();
        inspectorWindow.document.write(html);
        inspectorWindow.document.close();
      }
    }

    if (inspectorWindow) {
      adapter.start(inspectorWindow);
      startPoll();
    }
  }

  function startPoll(): void {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (inspectorWindow && inspectorWindow.closed) {
        inspectorWindow = null;
        adapter.stop();
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    }, 500);
  }

  function close(): void {
    if (inspectorWindow && !inspectorWindow.closed) {
      inspectorWindow.close();
    }
    inspectorWindow = null;
    adapter.stop();
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function destroy(): void {
    close();
  }

  return {
    sendIssue: (issue: DetectedIssue) => adapter.sendIssue(issue),
    sendClear: () => adapter.sendClear(),
    open,
    close,
    destroy,
    get connected() {
      return adapter.connected;
    },
    get isOpen() {
      return inspectorWindow !== null && !inspectorWindow.closed;
    },
    sessionId,
    get dashboardLink() {
      return getDashboardLink();
    },
  };
}

export function createInspectorReporter(
  inspector: InspectorInstance,
): Reporter {
  let opened = false;
  return {
    report(issue: DetectedIssue): void {
      if (!opened) {
        inspector.open();
        opened = true;
      }
      inspector.sendIssue(issue);
    },
  };
}
