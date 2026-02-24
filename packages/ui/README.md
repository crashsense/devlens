# @devlens/ui

**A visual debug panel that shows every runtime issue in your app -- right in the browser.**

Console logs scroll away. You miss the warning that fired 30 seconds ago. You can't filter, you can't search, you can't export.

DevLens UI gives you a floating debug panel -- isolated in Shadow DOM, fully filterable, searchable, and exportable. One line of code.

## What You Get

- **Floating panel** -- toggle with Ctrl+Shift+D, never leaves your viewport
- **Two views** -- issue list (sortable) and timeline (chronological)
- **Filter by severity** -- error, warn, info, or all
- **Filter by category** -- network, null-access, render-data, and more
- **Full-text search** -- find any issue by message content
- **Issue details** -- click any issue to see path, value, source, suggestion, and stack trace
- **Session persistence** -- issues survive page reloads via localStorage
- **Export** -- download all issues as JSON or CSV for sharing or analysis
- **Badge count** -- see issue count at a glance with pulse animation on new issues
- **Dark and light themes** -- matches your preference
- **Shadow DOM isolation** -- panel styles never conflict with your app
- **Production-safe** -- auto-disabled in production, zero overhead

## Installation

```bash
npm install @devlens/core @devlens/ui
```

## Quick Start -- One Line

```ts
import { createDetectionEngine } from '@devlens/core';
import { createDevLensPanel, createPanelReporter } from '@devlens/ui';

// Create the panel
const { panel, reporter, destroy } = createDevLensPanel({
  position: 'bottom-right',  // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme: 'dark',             // 'dark' | 'light'
  hotkey: 'ctrl+shift+d',   // customizable hotkey
});

// Connect to the detection engine
const engine = createDetectionEngine({ reporter });

// That's it. Issues now appear in the panel.
```

## With React

```tsx
import { DevLensProvider } from '@devlens/react';
import { createDevLensPanel } from '@devlens/ui';

const { reporter } = createDevLensPanel({ theme: 'dark' });

function App() {
  return (
    <DevLensProvider config={{ reporter }}>
      <YourApp />
    </DevLensProvider>
  );
}
```

## With Vue

```ts
import { createDevLensPlugin } from '@devlens/vue';
import { createDevLensPanel } from '@devlens/ui';

const { reporter } = createDevLensPanel({ theme: 'dark' });

app.use(createDevLensPlugin({ reporter }));
```

## Panel Configuration

```ts
createDevLensPanel({
  position: 'bottom-right',   // toggle button position
  theme: 'dark',              // 'dark' | 'light'
  hotkey: 'ctrl+shift+d',    // keyboard shortcut to toggle
  panelWidth: 420,            // panel width in pixels
  panelHeight: 520,           // panel height in pixels
  defaultOpen: false,         // start with panel open?
});
```

## Panel Controls

| Action | How |
|--------|-----|
| Toggle panel | Click the floating button or press Ctrl+Shift+D |
| Filter by severity | Click Error / Warn / Info / All buttons |
| Filter by category | Select from the category dropdown |
| Search issues | Type in the search bar |
| View issue details | Click any issue row to expand |
| Switch views | Toggle between List and Timeline |
| Export JSON | Click the JSON button in the header |
| Export CSV | Click the CSV button in the header |
| Clear all issues | Click the CLR button in the header |

## License System

@devlens/ui includes a license key system for gating premium features:

```ts
import { createLicenseManager, createFeatureGate, generateLicenseKey } from '@devlens/ui';

// Generate a key (for testing or your license server)
const key = generateLicenseKey();
// => "DL-0AK3-M8X2-PQR5-TN7W"

// Create license manager
const license = createLicenseManager();
license.activate(key);
console.log(license.isPro()); // true

// Gate features
const gate = createFeatureGate(license);
gate.isEnabled('timeline-view');      // true (Pro)
gate.isEnabled('export-json');        // true (Pro)
gate.isEnabled('search');             // true (Free)
```

**Free features:** issue-detail, search

**Pro features:** timeline-view, session-persistence, export-json, export-csv, category-filter

## API Reference

### Functions

| Export | Description |
|--------|-------------|
| `createDevLensPanel(config?)` | Creates the floating panel. Returns `{ panel, reporter, destroy }`. SSR-safe (returns noop in non-browser). |
| `createPanelReporter(panel)` | Creates a `Reporter` adapter that feeds issues to the panel. |
| `createPanel(host, config?)` | Low-level panel constructor (attach to your own host element). |
| `createPersistenceManager()` | localStorage-backed issue persistence (max 200 issues). |
| `exportAsJSON(issues)` | Serialize issues array to formatted JSON string. |
| `exportAsCSV(issues)` | Serialize issues array to CSV string with headers. |
| `downloadFile(content, filename, mimeType)` | Trigger browser file download. |
| `createLicenseManager()` | License key management with localStorage persistence. |
| `createFeatureGate(license)` | Feature access control based on license status. |
| `generateLicenseKey()` | Generate a valid `DL-XXXX-XXXX-XXXX-XXXX` license key with checksum. |

### Types

| Export | Description |
|--------|-------------|
| `PanelConfig` | `{ position?, theme?, hotkey?, panelWidth?, panelHeight?, defaultOpen? }` |
| `PanelInstance` | Panel with `open()`, `close()`, `toggle()`, `addIssue()`, `clear()`, `getIssues()`, `destroy()` |
| `LicenseManager` | `getStatus()`, `getInfo()`, `activate(key)`, `deactivate()`, `isPro()` |
| `LicenseInfo` | `{ status: LicenseStatus, key: string \| null, expiresAt: number \| null }` |
| `LicenseStatus` | `'free' \| 'pro' \| 'invalid'` |
| `FeatureGate` | `isEnabled(feature)`, `getFreeFeatures()`, `getProFeatures()`, `getAllFeatures()` |
| `Feature` | `'timeline-view' \| 'session-persistence' \| 'export-json' \| 'export-csv' \| 'issue-detail' \| 'search' \| 'category-filter'` |
| `PersistenceManager` | `save(issues)`, `load()`, `clear()` |

## Technical Details

- **~37KB** ESM bundle (panel UI, styles, license system)
- **Shadow DOM** -- panel styles are completely isolated, never leak into your app
- **Dual ESM + CJS** output with full TypeScript declarations
- **SSR-safe** -- returns noop instances when `document` is unavailable
- **Production-safe** -- auto-disabled when `NODE_ENV === 'production'`
- **z-index: 2147483647** -- panel always floats above your app

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Debug panel with filtering, search, export, persistence, license gating | Current |
| v2.0 | AI-powered panel -- integrate Claude and Gemini models to analyze detected issues in real time, show root-cause explanations and AI-generated fix suggestions directly in the panel | Planned |

The v2.0 AI integration will add an "Analyze" button to each issue. Click it, and an LLM analyzes the issue context (path, value, stack trace, surrounding issues) to explain why it happened and suggest the exact code fix.

## License

MIT -- [GitHub](https://github.com/crashsense/devlens) -- [Changelog](https://github.com/crashsense/devlens/blob/main/CHANGELOG.md)
