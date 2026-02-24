# @devlens/vue

**Automatic runtime error detection for Vue 3 apps. One plugin. Zero config.**

Vue's `app.config.errorHandler` gives you a raw error and a component name. That's it. No path, no context, no suggestion. You're on your own.

DevLens catches Vue errors, Vue warnings, failed API calls, null property access, and missing render data -- then tells you exactly what went wrong, where, and how to fix it.

## The Problem

Vue silently swallows many issues that cause blank UIs:

- `app.config.errorHandler` fires, but you forgot to set one -- error lost
- `app.config.warnHandler` fires in dev, but you never check the console
- A reactive ref is `null` because the API hasn't responded yet -- template renders blank
- Computed properties return `undefined` silently -- no error, no clue
- `fetch` fails with 500 -- the Promise resolves, you destructure `null`

**DevLens catches all of these the moment they happen, with full context.**

## Installation

```bash
npm install @devlens/core @devlens/vue
```

**Requirements:** Vue >= 3.3.0

## Setup -- 3 Lines

```ts
import { createApp } from 'vue';
import { createDevLensPlugin } from '@devlens/vue';

const app = createApp(App);
app.use(createDevLensPlugin());
app.mount('#app');
```

That's it. DevLens auto-installs:
- **Error handler** -- captures all Vue component errors via `app.config.errorHandler`
- **Warn handler** -- captures Vue warnings via `app.config.warnHandler`
- **Network interceptor** -- detects failed fetch/XHR calls
- **Global catcher** -- captures uncaught errors and unhandled promise rejections

## Guarded Ref -- Detect Null Access on Reactive Data

Replace `ref()` with `useGuardedRef()`. Same reactivity, but null/undefined property access is detected automatically:

```ts
import { useGuardedRef } from '@devlens/vue';

// In setup() or <script setup>
const user = useGuardedRef(initialUser, 'UserProfile');

// In your template:
// <img :src="user.profile.avatar" />
//
// If user.profile.avatar is null, DevLens immediately logs:
//
// [NULL] DevLens [WARN] null-access: Property "avatar" is null
//   at path "user.profile.avatar"
//   |- Path: user.profile.avatar
//   |- Value: null
//   |- Source: UserProfile
//   \- Suggestion: Check if "avatar" is loaded before accessing
```

**How it works:** The ref value is wrapped in an ES6 Proxy. When the source ref changes, the proxy is recreated. The original data is untouched -- the proxy only observes.

## Guarded Watch -- Monitor Data Dependencies

Watch multiple values for null/undefined. Perfect for components that depend on async data:

```ts
import { useGuardedWatch } from '@devlens/vue';

// In setup() or <script setup>
const user = ref(null);
const posts = ref(undefined);
const settings = ref({ theme: 'dark' });

useGuardedWatch({ user, posts, settings }, 'Dashboard');

// DevLens logs:
//
// [RENDER] DevLens [WARN] render-data: "user" is null in Dashboard
//   |- Path: Dashboard.user
//   |- Value: null
//   \- Suggestion: "user" is null -- check data loading in Dashboard
//
// [RENDER] DevLens [WARN] render-data: "posts" is undefined in Dashboard
//   |- Path: Dashboard.posts
//   |- Value: undefined
//   \- Suggestion: "posts" is undefined -- check data loading in Dashboard
```

Runs `immediate: true` and `deep: true`, so it catches issues on mount and on every change.

## Vue Error and Warning Capture

The plugin auto-installs `app.config.errorHandler` and `app.config.warnHandler`:

```
[ERR] DevLens [ERROR] unhandled-error: Vue error in UserProfile: Cannot read property of null
  |- Component: UserProfile
  |- Lifecycle Hook: mounted
  |- Source: Vue:UserProfile
  \- Suggestion: Error in mounted of UserProfile -- check the component logic

[ERR] DevLens [WARN] unhandled-error: Vue warning in Dashboard: Invalid prop type
  |- Component: Dashboard
  |- Source: Vue:Dashboard
  \- Suggestion: Check the Vue warning above -- it may indicate a potential issue
```

Every captured error includes the **component name**, **lifecycle hook**, and a **suggestion**.

## Configuration

```ts
app.use(createDevLensPlugin({
  enabled: true,
  minSeverity: 'warn',
  throttleMs: 1000,
  maxIssues: 100,
  modules: {
    network: {
      fetch: true,
      xhr: true,
      ignoreUrls: ['/health'],
    },
    catcher: {
      windowErrors: true,
      unhandledRejections: true,
    },
  },
  ignore: {
    messages: [/ResizeObserver/],
  },
}));
```

## API Reference

### Functions

| Export | Description |
|--------|-------------|
| `createDevLensPlugin(options?)` | Vue 3 plugin. Installs engine, error/warn handlers, network interceptor, global catcher. Returns plugin with `install()`, `uninstall()`, `getEngine()`. |
| `useDevLens()` | Composable that injects the `DevLensEngine` instance (or `null` if disabled). Use for custom reporting. |
| `useGuardedRef(initial, label?)` | Returns a reactive ref wrapped in a Proxy that detects null/undefined property access at any depth. |
| `useGuardedWatch(data, label?)` | Watches a `Record<string, unknown>` for null/undefined values. Runs immediately and deeply. |

### Types

| Export | Description |
|--------|-------------|
| `DevLensPluginOptions` | Same as `DevLensConfig` from `@devlens/core` |
| `DevLensKey` | Vue injection key (Symbol) for the engine instance |

## Works With

- **Vue 3.3+** -- Composition API and Options API
- **Nuxt 3** -- client-side only (DevLens is browser-side)
- **Vite, Vue CLI** -- any Vue 3 setup
- **@devlens/ui** -- add the [visual debug panel](https://www.npmjs.com/package/@devlens/ui) for a full browser overlay
- **Pinia, Vuex** -- state store data can be watched with `useGuardedWatch`

## Why @devlens/vue

- **3-line setup** -- `app.use()` and done
- **Zero config** -- error/warn handlers, network, global catcher all auto-installed
- **~5KB** ESM bundle -- negligible impact
- **Production-safe** -- auto-disabled in production, zero overhead, tree-shakeable
- **Non-invasive** -- no patching Vue internals, standard plugin API
- **Composition API native** -- `useGuardedRef` and `useGuardedWatch` work in `setup()` and `<script setup>`
- **Full TypeScript** -- complete type declarations, strict mode compatible

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Vue plugin with auto error/warn capture, guarded composables | Current |
| v2.0 | AI-powered analysis -- integrate Claude and Gemini models to analyze detected issues, explain root causes in the context of your Vue components, and suggest template/script fixes | Planned |

The v2.0 AI integration will understand Vue-specific patterns (reactivity pitfalls, lifecycle timing, prop validation) and provide targeted fix suggestions that account for your component structure.

## License

MIT -- [GitHub](https://github.com/crashsense/devlens) -- [Changelog](https://github.com/crashsense/devlens/blob/main/CHANGELOG.md)
