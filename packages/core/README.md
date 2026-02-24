# @devlens/core

**Stop wasting 30 minutes hunting silent failures. DevLens finds them for you -- automatically.**

Your UI renders blank. No error in console. You add `console.log` everywhere until you discover `user.profile.settings` is `undefined` because the API silently returned a 500. Sound familiar?

DevLens detects these failures the moment they happen and tells you exactly what went wrong, where, and how to fix it.

## What It Catches

| Category | What It Detects | Example |
|----------|----------------|---------|
| **Network** | Failed API calls, 4xx/5xx responses, timeouts | `POST /api/users returned 500` |
| **Null Access** | Property access on null objects | `user.profile.avatar is null` |
| **Undefined Data** | Accessing undefined properties | `settings.theme is undefined` |
| **Render Data** | State values your UI depends on that are nullish | `"posts" is undefined in Dashboard` |
| **Unhandled Errors** | Uncaught exceptions and promise rejections | `TypeError: Cannot read property...` |
| **Type Mismatch** | Unexpected data types at runtime | `Expected string, got number` |

## Installation

```bash
npm install @devlens/core
```

## Quick Start -- 4 Lines to Full Coverage

```ts
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
  createDataGuardian,
} from '@devlens/core';

// 1. Create the engine
const engine = createDetectionEngine();

// 2. Auto-detect failed API calls (fetch + XHR)
const network = createNetworkInterceptor(engine);
network.install();

// 3. Catch uncaught errors + unhandled promise rejections
const catcher = createGlobalCatcher(engine);
catcher.install();

// 4. Detect null/undefined property access on any object
const guardian = createDataGuardian(engine);
const data = guardian.guard(apiResponse, 'apiResponse');

// Now this silently-failing access gets logged with full context:
console.log(data.user.profile.avatar);
```

## What You See in Console

Instead of silence or a cryptic error, DevLens gives you:

```
[NET] DevLens [ERROR] network: POST /api/users returned 500 Internal Server Error
  |- Status: 500
  |- Duration: 1234ms
  |- Suggestion: Server returned 500 -- check server logs
  \- Source: NetworkInterceptor

[NULL] DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"
  |- Path: user.profile.avatar
  |- Value: null
  |- Source: UserProfile
  \- Suggestion: Check if "avatar" is loaded/initialized before accessing
```

Every issue includes: **what** happened, **where** it happened, the actual **value** found, and a **suggestion** to fix it.

## Configuration

```ts
const engine = createDetectionEngine({
  enabled: true,                // auto-disabled in production
  minSeverity: 'warn',         // 'error' | 'warn' | 'info'
  throttleMs: 1000,            // prevent log spam
  maxIssues: 100,              // memory buffer limit
  modules: {
    network: {
      fetch: true,              // intercept fetch()
      xhr: true,                // intercept XMLHttpRequest
      ignoreUrls: ['/health', /\.hot-update\./],
      logSuccess: false,        // only log failures
    },
    guardian: {
      maxDepth: 5,              // proxy depth limit
      ignorePaths: ['_internal'],
    },
    catcher: {
      windowErrors: true,       // window.onerror
      unhandledRejections: true, // unhandled promises
      consoleErrors: false,     // console.error interception
    },
  },
  ignore: {
    urls: ['/analytics'],
    messages: [/ResizeObserver/],
  },
});
```

## API Reference

### Functions

| Export | Description |
|--------|-------------|
| `createDetectionEngine(config?)` | Creates the core engine that coordinates all detection modules |
| `createNetworkInterceptor(engine, config?)` | Intercepts `fetch()` and `XMLHttpRequest` to detect API failures |
| `createDataGuardian(engine, config?)` | Wraps objects in ES6 Proxy to detect null/undefined property access |
| `createGlobalCatcher(engine, config?)` | Captures `window.onerror` and unhandled promise rejections |
| `createConsoleReporter()` | Formatted console output with severity colors and structured details |

### Types

| Export | Description |
|--------|-------------|
| `DetectedIssue` | Full issue object with id, severity, category, message, path, suggestion, stack |
| `DevLensConfig` | Engine configuration |
| `DevLensEngine` | Engine instance interface (report, subscribe, getIssues, isEnabled) |
| `Reporter` | Custom reporter interface -- implement to send issues anywhere |
| `Severity` | `'error' \| 'warn' \| 'info'` |
| `IssueCategory` | `'network' \| 'null-access' \| 'undefined-data' \| 'render-data' \| ...` |
| `NetworkInterceptorConfig` | Network module config |
| `DataGuardianConfig` | Guardian module config |
| `GlobalCatcherConfig` | Catcher module config |

## Custom Reporter

Send issues to your own logging service:

```ts
import type { Reporter, DetectedIssue } from '@devlens/core';

const myReporter: Reporter = {
  report(issue: DetectedIssue) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  },
};

const engine = createDetectionEngine({ reporter: myReporter });
```

## Framework Adapters

| Package | Framework | What It Adds |
|---------|-----------|-------------|
| [@devlens/react](https://www.npmjs.com/package/@devlens/react) | React 17+ | Provider, ErrorBoundary, guarded hooks |
| [@devlens/vue](https://www.npmjs.com/package/@devlens/vue) | Vue 3.3+ | Plugin, auto error/warn handlers, guarded composables |
| [@devlens/ui](https://www.npmjs.com/package/@devlens/ui) | Any | Visual debug panel overlay |

## Why @devlens/core

- **Zero dependencies** -- nothing to audit, nothing to break
- **~20KB** ESM bundle, tree-shakeable
- **Dual ESM + CJS** output with full TypeScript declarations
- **Production-safe** -- auto-disabled when `NODE_ENV === 'production'`, zero overhead
- **Framework-agnostic** -- works with React, Vue, Svelte, vanilla JS, anything
- **Pluggable** -- custom reporters, custom validators, ignore patterns
- **Non-invasive** -- no global state pollution, clean install/uninstall lifecycle


## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v2.0 | Detection engine with network interceptor, data guardian, global catcher, console reporter | Current |
| v3.0 | AI-powered analysis -- integrate Claude and Gemini models to analyze detected issues, identify root-cause patterns across your issue history, and generate actionable fix suggestions | Planned |

The v3.0 AI integration will analyze patterns across your detected issues, identify root causes, and suggest fixes -- directly in your dev console or UI panel.

## License

MIT -- [GitHub](https://github.com/crashsense/devlens) -- [Changelog](https://github.com/crashsense/devlens/blob/main/CHANGELOG.md)
