# Changelog


## 🚀 3.0.0 — "The Lens Update" (2026-03-11)

> **This is the biggest DevLens release ever.** 7 new features, 1 new package, and the architecture foundation for everything that comes next. DevLens is no longer just an error detector — it's a **development lens** that lets you see through your UI.

### ⭐ Headline: X-Ray Mode

**Hold `Alt` + hover over any element.** DevLens highlights the element and shows a tooltip with:

- Component name (React, Vue, or plain DOM)
- Props and state (extracted from React fiber / Vue instance)
- CSS classnames
- Number of DevLens issues related to that component

No browser extension needed. No DevTools panel to open. Just hold Alt and look. This is why it's called Dev**Lens**.

- `@devlens/ui` v2.0.0 — New `xray/` module: `createXRayMode()`, overlay rendering inside existing Shadow DOM, React fiber extraction (`__reactFiber$`), Vue 3 instance extraction (`__vueParentComponent`), vanilla DOM fallback. rAF-throttled mousemove, viewport-aware tooltip positioning. Enabled by default — disable with `xray: false` in PanelConfig.

### ⭐ Plugin Ecosystem

DevLens is now a **platform**. The engine supports first-class plugins with lifecycle management.

- `@devlens/core` v3.0.0 — **Breaking**: `DevLensEngine` interface now includes `registerPlugin()`, `unregisterPlugin()`, `getPlugin()`, `listPlugins()`, and `destroy()`. Existing code that creates engines works unchanged. Code that mocks the engine interface (tests) needs to add the new methods.
- New plugin API: `engine.registerPlugin({ name, version, setup, teardown })` — setup receives the engine, teardown is called on unregister or destroy.

### ⭐ API Contract Guardian

DevLens now auto-learns your API response shapes and alerts when they change unexpectedly.

- `@devlens/core` v3.0.0 — New `contract/` module: `createApiContractPlugin()`. Auto-infers JSON response shape on first request, compares subsequent responses, reports `api-contract` issues when fields disappear or change type. Configurable with `endpoints`, `ignoreFields`, `maxShapes`. New issue category: `api-contract` with `[CONTRACT]` console label.

### ⭐ AI Auto-Fix with Patch Generation

The AI no longer just explains problems — it generates code patches you can copy and apply.

- `@devlens/dashboard` v2.0.0 — New `generatePatch()` function. Uses existing source-fetcher pipeline to provide source code context to AI, then asks for a unified diff patch. Returns `PatchResult { file, diff, explanation }`. Supports all existing AI models (Gemini, Claude, GPT).

### ⭐ Session Export/Import — QA-to-Dev Handoff

QA finds a bug → exports a `.devlens` session file → Dev imports it → sees exactly what QA saw. No more "I can't reproduce it."

- `@devlens/ui` v2.0.0 — New `session/` module:
  - `createSessionRecorder()` — records user interactions (clicks, inputs, navigation), DevLens issues, and network events into a timeline
  - `exportSession()` — downloads a `.devlens` JSON file with full session data (metadata, timeline, issues)
  - `parseSessionFile()` / `readFileAsText()` — import and validate `.devlens` files
  - `.devlens` file format v1.0: `{ version, sessionId, exportedAt, metadata, timeline[], issues[] }`

### ⭐ Async Flow Tracker

Detect hung promises, duplicate concurrent requests, and forgotten async operations.

- `@devlens/core` v3.0.0 — New `async/` module: `createAsyncTrackerPlugin()`. Wraps `fetch` to track async operation lifecycle. Reports `warn` when a fetch is pending longer than `timeoutMs` (default: 30s). Reports `info` on duplicate concurrent requests to the same endpoint. Configurable via `AsyncTrackerConfig`.

### ⭐ New Package: @devlens/web

Framework-agnostic adapter for vanilla JavaScript and Web Components.

- **@devlens/web** v0.1.0 — `initDevLens(config)` returns `{ engine, destroy() }`. Auto-installs network interceptor and global catcher. Zero framework dependencies. Works with Web Components, vanilla JS, Lit, Stencil, or any non-React/Vue setup.

### Breaking Changes

- **@devlens/core**: `DevLensEngine` interface now requires `registerPlugin`, `unregisterPlugin`, `getPlugin`, `listPlugins`, `destroy` methods. If you mock the engine in tests, add these methods to your mock.
- **@devlens/core**: New `IssueCategory` value `'api-contract'` — any code with exhaustive category checks needs updating.
- **@devlens/ui**: Package bumped to v2.0.0 due to new `PanelConfig.xray` option and `session/` module. No existing API removed.

### Version Matrix

| Package | Old | New |
|---------|-----|-----|
| `@devlens/core` | 2.0.3 | **3.0.0** |
| `@devlens/react` | 2.0.3 | **3.0.0** |
| `@devlens/vue` | 1.0.3 | **2.0.0** |
| `@devlens/ui` | 1.3.0 | **2.0.0** |
| `@devlens/dashboard` | 1.0.0 | **2.0.0** |
| `@devlens/vite` | 1.0.0 | **2.0.0** |
| `@devlens/web` | — | **0.1.0** (new) |

---

## 0.2.0 (2026-02-26)

### Changes

- **@devlens/ui** v1.3.0 -- Panel UX polish + bug fixes + dashboard opener
  - **Fix**: Duplicate panel on page refresh / React StrictMode double-invocation -- `createDevLensPanel()` now checks if `#devlens-ui-root` already exists and skips re-init
  - **Fix**: Toggle button now shows a proper DevLens lens icon (SVG) instead of plain `DL` text; hovering shows the keyboard shortcut in a tooltip
  - **Fix**: Search input was not receiving keyboard events due to missing `pointer-events: auto` -- now explicitly set; keydown/keyup also stop propagation to prevent shortcut conflicts with the host app
  - **Fix**: Header buttons (JSON, CSV, CLR, ×) redesigned with SVG icons + labels -- cleaner, more polished appearance with distinct hover states; CLR button turns red on hover
  - **Fix**: Footer version label now reflects the actual `@devlens/core` version injected at build time (was hardcoded `v1.0.0`)
  - **New**: `createDashboardOpener(config)` -- opens the hosted DevLens dashboard in a new window/tab, tracks open/close state, exposes `open()`, `close()`, `isOpen`, `sessionId`, `dashboardLink`
  - **New**: `createDashboardReporter(opener)` -- reporter adapter that auto-opens the dashboard on the first detected issue
  - **New**: `PanelConfig.dashboardUrl` -- when set, a small dashboard-open button (monitor icon) appears above the main panel toggle for quick manual access

---

## 0.1.0 (2026-02-25)


### New Packages

- **@devlens/dashboard** v0.1.0 -- Standalone React dashboard app (inspired by Stately Inspector)
  - Full dashboard UI: Issues list, Timeline, AI Analysis, Settings
  - BroadcastChannel + postMessage communication with the host app
  - Severity/category filtering, full-text search, issue detail expansion
  - AI-powered analysis with model selector (Gemini, Claude, GPT)
  - JSON/CSV export, session clearing
  - Connection status indicator
  - Session ID from URL query parameter (`?session=<id>`)
  - Relative asset paths -- works when served at any base path

- **@devlens/vite** v0.1.0 -- Vite plugin for embedded dashboard
  - Zero-config: add `devlens()` to Vite plugins, dashboard auto-available at `/__devlens__/`
  - No extra terminal, no extra command -- dashboard served by the same dev server
  - Uses `sirv` + `configureServer` middleware (same pattern as Vue DevTools, Vitest UI, UnoCSS Inspector)
  - Pre-built dashboard client embedded as static assets (~216KB JS, ~12KB CSS)
  - Prints `➜  DevLens: /__devlens__` in terminal alongside Vite's URLs
  - Dev-only (`apply: 'serve'`) -- zero overhead in production builds
  - Configurable base path via `devlens({ base: '/my-path' })`

### Changes

- **@devlens/ui** v1.2.0 -- `createDevLensInspector()` now supports `dashboardUrl` option
  - When `dashboardUrl` is set, `open()` navigates to the hosted dashboard URL instead of a Blob popup
  - New properties: `sessionId`, `dashboardLink` on `InspectorInstance`
  - Legacy Blob-URL popup mode fully preserved (backward compatible)

## 1.1.0 (2026-02-24)

### New Features

- **@devlens/ui** v1.1.0 -- Inspector: separate browser window for issue debugging
  - `createDevLensInspector()` opens a dedicated inspector popup window
  - `createInspectorReporter()` reporter adapter that auto-opens the inspector on first issue
  - Full sidebar navigation: Issues, Timeline, AI Analysis, Settings tabs
  - BroadcastChannel communication with postMessage fallback
  - AI Analysis tab: analyze issues with Gemini/Claude/GPT models, get root-cause detection, pattern analysis, and fix suggestions
  - Issue detail expansion with path, value, source, suggestion, and stack trace
  - Severity and category filtering, full-text search
  - JSON/CSV export and session clearing
  - Connection status indicator with ping/pong health check
  - SSR-safe and production-safe (auto-disabled)
  - ~75KB ESM bundle (includes panel + inspector)

---

## 2.0.3 / 1.0.4 / 1.0.3 (2026-02-24, 02:46 UTC)

### Bug Fixes

- **@devlens/core** v2.0.3, **@devlens/react** v2.0.3 -- Fixed CJS/ESM module resolution (critical)
  - `package.json` declared `main: ./dist/index.cjs` and `exports.require: ./dist/index.cjs`, but tsup outputs `index.js` for CJS
  - This caused `MODULE_NOT_FOUND` errors in Webpack and any CJS consumer
  - Fixed: `main` now points to `./dist/index.js`, `module` to `./dist/index.mjs`, matching the actual build output
  - Aligned with the correct pattern already used by @devlens/ui and @devlens/vue

### Changes

- **@devlens/ui** v1.0.4, **@devlens/vue** v1.0.3 -- Version bump to depend on @devlens/core 2.0.3
- Added `npm run validate` script to verify all declared dist files exist after build

### Verified

- TDZ bug (ui panel crash on `buildHeader()`) was already fixed in v1.0.3 source and published dist -- confirmed no regression

### Published

- `@devlens/core@2.0.3` -- 2026-02-24 02:45 UTC
- `@devlens/react@2.0.3` -- 2026-02-24 02:46 UTC
- `@devlens/ui@1.0.4` -- 2026-02-24 02:46 UTC
- `@devlens/vue@1.0.3` -- 2026-02-24 02:46 UTC

---

## 2.0.2 / 1.0.3 / 1.0.2 (2026-02-24)

### Bug Fixes

- **@devlens/core** v2.0.2 -- Fixed console reporter noise: consolidated all detail lines into a single `consoleFn()` call to prevent per-line stack traces in browsers
- **@devlens/core** v2.0.2 -- Fixed multi-reporter: engine now composes custom reporter with console reporter so both panel and console receive issues
- **@devlens/ui** v1.0.3 -- Fixed TDZ crash: moved `let` declarations before `buildHeader()` call

### Changes

- **@devlens/react** v2.0.2, **@devlens/vue** v1.0.2 -- Version bump to depend on @devlens/core 2.0.2

## 2.0.0 (2026-02-24)

### Breaking Changes

- **@devlens/core**: Console reporter output format changed -- emoji icons replaced with text labels ([NET], [NULL], [UNDEF], [RENDER], [ERR], [REJ], [TYPE])
- **@devlens/core**: Tree-drawing characters in console output replaced with ASCII (`|-` and `\-`)

### New Packages

- **@devlens/ui** v1.0.0 -- Visual debug panel overlay
  - Floating panel with Shadow DOM isolation
  - Issue list and timeline views
  - Severity filtering, category filtering, search
  - Session persistence (localStorage)
  - Export issues as JSON or CSV
  - Hotkey toggle (Ctrl+Shift+D)
  - Dark/light theme support
  - License key system with feature gating (Free vs Pro)
  - Production-safe (auto-disabled)

- **@devlens/vue** v1.0.0 -- Vue 3 integration
  - Vue plugin with auto error/warn handler integration
  - useGuardedRef() -- reactive ref with null/undefined detection
  - useGuardedWatch() -- watch data for null/undefined
  - useDevLens() -- inject engine instance

### Changes

- **@devlens/react** v2.0.0 -- Updated to use @devlens/core v2.0.0

## 1.0.0 (2026-02-22)

### Initial Release

- **@devlens/core** -- Detection engine, network interceptor, data guardian, global catcher, console reporter
- **@devlens/react** -- React provider, error boundary, guarded state/effect hooks
