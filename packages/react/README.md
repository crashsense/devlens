# @devlens/react

**Drop in two components. Never miss a silent failure in React again.**

Your `useEffect` fetches data, but `user.profile` comes back `null`. The page renders blank -- no error, no crash, just... nothing. You open DevTools, add 15 `console.log` statements, and finally find it 20 minutes later.

DevLens catches it the moment it happens. Two lines of setup. Zero config.

## The Problem

React is great at catching render errors, but terrible at surfacing data problems:

- API returns `null` instead of an object -- no error, blank UI
- A prop is `undefined` because a parent didn't load yet -- silent failure
- `fetch` returns 500 -- the Promise resolves, `.json()` fails silently
- A deeply nested property is `null` -- `Cannot read property of null` only after the user clicks

**DevLens surfaces all of these instantly, with full context, before your users notice.**

## Installation

```bash
npm install @devlens/core @devlens/react
```

**Requirements:** React >= 17.0.0

## Setup -- 30 Seconds

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

That's it. Open your browser console. DevLens auto-installs:
- **Network interceptor** -- detects failed fetch/XHR calls
- **Global catcher** -- captures uncaught errors and unhandled rejections
- **Error boundary** -- catches React render errors with component stack traces

## Guarded State -- Catch Null Access Before It Crashes

Replace `useState` with `useGuardedState`. Same API, but now null/undefined property access is detected automatically:

```tsx
import { useGuardedState } from '@devlens/react';

function UserProfile() {
  const [user, setUser] = useGuardedState(initialUser, 'UserProfile');

  // If user.profile.avatar is null, DevLens immediately logs:
  //
  // [NULL] DevLens [WARN] null-access: Property "avatar" is null
  //   at path "user.profile.avatar"
  //   |- Path: user.profile.avatar
  //   |- Value: null
  //   |- Source: UserProfile
  //   \- Suggestion: Check if "avatar" is loaded/initialized before accessing

  return <img src={user.profile.avatar} />;
}
```

**How it works:** `useGuardedState` wraps your state in an ES6 Proxy that detects null/undefined access at any depth. The original state is untouched -- the proxy only observes.

## Guarded Effect -- Watch Data Dependencies

Monitor multiple values for null/undefined. Perfect for components that depend on async data:

```tsx
import { useGuardedEffect } from '@devlens/react';

function Dashboard({ user, posts, settings }) {
  // Watch all data dependencies in one call
  useGuardedEffect({ user, posts, settings }, 'Dashboard');

  // If posts is undefined (still loading), DevLens logs:
  //
  // [RENDER] DevLens [WARN] render-data: "posts" is undefined in Dashboard
  //   |- Path: Dashboard.posts
  //   |- Value: undefined
  //   \- Suggestion: "posts" is undefined -- check data loading in Dashboard

  return (
    <div>
      <h1>{user.name}</h1>
      {posts.map(p => <Post key={p.id} {...p} />)}
    </div>
  );
}
```

## Error Boundary -- Catch Render Crashes with Context

DevLens error boundary captures React render errors and reports them with full component stack traces:

```tsx
import { DevLensErrorBoundary } from '@devlens/react';

<DevLensErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
  onError={(error, errorInfo) => {
    // Optional: send to your error tracking service
    Sentry.captureException(error);
  }}
>
  <RiskyComponent />
</DevLensErrorBoundary>
```

**Features:**
- Render prop fallback with `error` and `reset` function
- `onError` callback for external error tracking integration
- Auto-reports to DevLens engine with component stack
- Default fallback UI if no custom fallback provided

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
      },
      guardian: { maxDepth: 5 },
      catcher: {
        windowErrors: true,
        unhandledRejections: true,
      },
    },
    ignore: {
      messages: [/ResizeObserver/],
    },
  }}
>
  <App />
</DevLensProvider>
```

## API Reference

### Components

| Export | Description |
|--------|-------------|
| `DevLensProvider` | Wraps your app. Initializes the detection engine, network interceptor, and global catcher. Renders only `children` when disabled. |
| `DevLensErrorBoundary` | React error boundary that auto-reports to DevLens. Supports render prop fallback with reset, `onError` callback. |

### Hooks

| Export | Description |
|--------|-------------|
| `useDevLens()` | Returns the `DevLensEngine` instance (or `null` if disabled). Use for custom reporting. |
| `useGuardedState(initial, label?)` | Drop-in `useState` replacement. Wraps state in a Proxy to detect null/undefined property access at any depth. |
| `useGuardedEffect(data, label?)` | Watches a `Record<string, unknown>` for null/undefined values. Runs on every render. |

### Types

| Export | Description |
|--------|-------------|
| `DevLensProviderProps` | Props for `DevLensProvider` (`children`, `config?`) |
| `DevLensErrorBoundaryProps` | Props for `DevLensErrorBoundary` (`children`, `fallback?`, `onError?`) |
| `DevLensConfig` | Re-exported from `@devlens/core` |
| `DetectedIssue` | Re-exported from `@devlens/core` |

## Works With

- **React 17, 18, 19** -- all supported
- **Next.js** -- client components only (DevLens is browser-side)
- **Remix, Vite, CRA** -- any React setup
- **@devlens/ui** -- add the [visual debug panel](https://www.npmjs.com/package/@devlens/ui) for a full browser overlay

## Why @devlens/react

- **30-second setup** -- wrap your app, done
- **Zero config** -- detects network, null access, render data, errors out of the box
- **~5KB** ESM bundle -- barely noticeable
- **Production-safe** -- auto-disabled in production, zero overhead, tree-shakeable
- **Non-invasive** -- no patching React internals, clean Proxy-based detection
- **Full TypeScript** -- complete type declarations, strict mode compatible

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v2.0 | React integration with guarded hooks and error boundary | Current |
| v3.0 | AI-powered analysis -- integrate Claude and Gemini models to analyze detected issues and generate root-cause explanations with fix suggestions | Planned |

The v3.0 AI integration will analyze patterns across your detected issues, identify root causes, and suggest fixes -- directly in your dev console or UI panel.

## License

MIT -- [GitHub](https://github.com/crashsense/devlens) -- [Changelog](https://github.com/crashsense/devlens/blob/main/CHANGELOG.md)
