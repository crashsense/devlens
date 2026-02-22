# DevLens

Automatic runtime error detection and logging for JavaScript applications.

DevLens detects silent failures in your app — null data, API errors, undefined properties — and logs them with actionable context. No manual `console.log` required.

## Why DevLens?

You've been here: the UI renders blank, no error in console, and you spend 30 minutes adding `console.log` everywhere to find that `user.profile.settings` is `undefined` because the API silently returned a 500.

DevLens fixes this by automatically detecting and logging:

- **API errors** — failed fetch/XHR calls, 4xx/5xx responses, network failures
- **Null/undefined access** — property access on null or undefined objects, before it crashes
- **Missing render data** — state values your UI depends on that are null/undefined
- **Unhandled errors** — global errors and unhandled promise rejections

Zero config. Dev-only. Drop it in and see everything.

## Installation

```bash
# React apps
npm install @devlens/core @devlens/react

# Vanilla JS
npm install @devlens/core
```

## Quick Start (React)

```tsx
import { DevLensProvider, DevLensErrorBoundary } from '@devlens/react';

function App() {
  return (
    <DevLensProvider>
      <DevLensErrorBoundary>
        <YourApp />
      </DevLensErrorBoundary>
    </DevLensProvider>
  );
}
```

That's it. Open your browser console and DevLens will start logging detected issues.

## Features

### Network Interceptor

Automatically intercepts `fetch` and `XMLHttpRequest` calls. No config needed.

```
🌐 DevLens [ERROR] network: POST /api/users returned 500 Internal Server Error
  ├─ Status: 500
  ├─ Duration: 1234ms
  ├─ Suggestion: Server returned 500 — check server logs
  └─ Source: NetworkInterceptor
```

### Data Guardian

Wraps objects in ES6 Proxy to detect null/undefined access with full path tracking.

```tsx
import { useGuardedState } from '@devlens/react';

function UserProfile() {
  const [user, setUser] = useGuardedState(initialUser, 'UserProfile');

  // If user.profile.avatar is null, DevLens auto-logs:
  // 💀 DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"
  return <img src={user.profile.avatar} />;
}
```

### Guarded Effect

Watch multiple data values for null/undefined in one call:

```tsx
import { useGuardedEffect } from '@devlens/react';

function Dashboard({ user, posts, settings }) {
  useGuardedEffect({ user, posts, settings }, 'Dashboard');

  // If any value is null/undefined, DevLens logs:
  // 🎨 DevLens [WARN] render-data: "posts" is undefined in Dashboard
  return <div>...</div>;
}
```

### Error Boundary

Enhanced React Error Boundary with DevLens integration:

```tsx
<DevLensErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
  onError={(error) => trackError(error)}
>
  <RiskyComponent />
</DevLensErrorBoundary>
```

## Vanilla JS Usage

```ts
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
  createDataGuardian,
} from '@devlens/core';

const engine = createDetectionEngine();

const network = createNetworkInterceptor(engine);
network.install();

const catcher = createGlobalCatcher(engine);
catcher.install();

const guardian = createDataGuardian(engine);
const data = guardian.guard(apiResponse, 'apiResponse');

// Accessing null/undefined properties now auto-logs
console.log(data.user.profile.avatar);
```

## Configuration

```tsx
<DevLensProvider
  config={{
    enabled: true,
    minSeverity: 'warn',
    throttleMs: 1000,
    maxIssues: 100,
    modules: {
      network: {
        fetch: true,
        xhr: true,
        ignoreUrls: ['/health', /\.hot-update\./],
        logSuccess: false,
      },
      guardian: {
        maxDepth: 5,
        ignorePaths: ['_internal'],
        verbose: false,
      },
      catcher: {
        windowErrors: true,
        unhandledRejections: true,
        consoleErrors: false,
      },
    },
    ignore: {
      urls: ['/analytics'],
      messages: [/ResizeObserver/],
    },
  }}
>
  <App />
</DevLensProvider>
```

## Production Safety

DevLens is designed for development only:

- Automatically disabled when `NODE_ENV === 'production'`
- `sideEffects: false` in package.json enables tree-shaking
- Provider renders children directly when disabled (zero overhead)
- No data is sent anywhere — everything stays in your browser console

## API Reference

### @devlens/core

| Export | Description |
|--------|-------------|
| `createDetectionEngine(config?)` | Creates the core engine |
| `createNetworkInterceptor(engine, config?)` | Fetch/XHR interceptor |
| `createDataGuardian(engine, config?)` | Proxy-based null detection |
| `createGlobalCatcher(engine, config?)` | Global error handler |
| `createConsoleReporter()` | Console output formatter |

### @devlens/react

| Export | Description |
|--------|-------------|
| `DevLensProvider` | Wrapper component, initializes DevLens |
| `DevLensErrorBoundary` | Error boundary with DevLens reporting |
| `useDevLens()` | Access the engine instance |
| `useGuardedState(initial, label?)` | useState with null detection |
| `useGuardedEffect(data, label?)` | Watch data for null/undefined |

## Roadmap

- **v1.0** — Console logging (current)
- **v2.0** — UI overlay with visual issue indicators
- **v3.0** — Vue.js support

## Contributing

Contributions welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT
