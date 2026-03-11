# DevLens

### See through your UI. Catch what your eyes can't.

DevLens is a zero-config runtime error detection toolkit for JavaScript/TypeScript. It catches silent failures — null access, API errors, contract violations, hung promises — and surfaces them **instantly** with actionable context.

**v3.0 "The Lens Update"** is the biggest release yet: X-Ray Mode, Plugin Ecosystem, API Contract Guardian, AI Auto-Fix, Session Recording, Async Tracker, and framework-agnostic Web adapter.

```bash
npm install @devlens/core @devlens/react   # React
npm install @devlens/core @devlens/vue     # Vue
npm install @devlens/core @devlens/web     # Vanilla / Web Components
```

## Packages

| Package | Version | Size | Description |
|---------|---------|------|-------------|
| [`@devlens/core`](./packages/core) | 3.0.0 | ~22KB | Detection engine, plugins, interceptors, contract guardian, async tracker |
| [`@devlens/react`](./packages/react) | 3.0.0 | ~5KB | React provider, error boundary, guarded hooks |
| [`@devlens/vue`](./packages/vue) | 2.0.0 | ~5KB | Vue 3 plugin, guarded composables |
| [`@devlens/ui`](./packages/ui) | 2.0.0 | ~102KB | Visual panel, X-Ray Mode, inspector, session recording |
| [`@devlens/vite`](./packages/vite) | 2.0.0 | — | Vite plugin — embedded dashboard at `/__devlens__/` |
| [`@devlens/dashboard`](./packages/dashboard) | 2.0.0 | — | Standalone dashboard with AI analysis |
| [`@devlens/web`](./packages/web) | 0.1.0 | ~3KB | Vanilla JS / Web Components adapter |

---

## X-Ray Mode

**Hold `Alt` and hover over any element.** DevLens highlights it and shows:

- Component name (React, Vue, or DOM tag)
- Props and state (extracted from React fiber / Vue instance)
- CSS classnames
- Related DevLens issues for that component

No browser extension. No DevTools panel. Just hold Alt and look.

```ts
import { createDevLensPanel } from '@devlens/ui';

const { panel, reporter } = createDevLensPanel({
  xray: true, // enabled by default
});
```

---

## Quick Start

### React

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

### Vue

```ts
import { createApp } from 'vue';
import { createDevLensPlugin } from '@devlens/vue';

const app = createApp(App);
app.use(createDevLensPlugin());
app.mount('#app');
```

### Vanilla JS / Web Components

```ts
import { initDevLens } from '@devlens/web';

const { engine, destroy } = initDevLens();
// Network interceptor + global catcher auto-installed
```

---

## What DevLens Catches

### Network Errors (automatic)
```
[NET] DevLens [ERROR] network: POST /api/users returned 500 Internal Server Error
  |- Duration: 1234ms
  \- Suggestion: Server returned 500 - check server logs
```

### Null/Undefined Access (Proxy-based)
```tsx
const [user, setUser] = useGuardedState(initialUser, 'UserProfile');
// user.profile.avatar is null → DevLens logs:
// [NULL] DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"
```

### API Contract Violations (new in v3)
```ts
import { createApiContractPlugin } from '@devlens/core';

engine.registerPlugin(createApiContractPlugin({
  endpoints: ['/api/*'],
  ignoreFields: ['timestamp'],
}));
// Auto-learns response shapes, alerts when fields disappear or change type:
// [CONTRACT] DevLens [WARN] api-contract: Field "avatar" disappeared from GET /api/users response
```

### Hung Promises & Duplicate Requests (new in v3)
```ts
import { createAsyncTrackerPlugin } from '@devlens/core';

engine.registerPlugin(createAsyncTrackerPlugin({
  timeoutMs: 30000, // alert after 30s
}));
// [REJ] DevLens [WARN] Async operation "fetch GET /api/slow" pending for 31s — possible hung promise
```

---

## Plugin System (new in v3)

DevLens is now a platform. Register plugins with lifecycle management:

```ts
import { createDetectionEngine, createApiContractPlugin, createAsyncTrackerPlugin } from '@devlens/core';

const engine = createDetectionEngine();

engine.registerPlugin(createApiContractPlugin());
engine.registerPlugin(createAsyncTrackerPlugin());

// Query plugins
engine.listPlugins();           // [contractPlugin, asyncPlugin]
engine.getPlugin('api-contract'); // contractPlugin

// Cleanup
engine.unregisterPlugin('async-tracker');
engine.destroy(); // tears down all plugins
```

Write your own:
```ts
const myPlugin: DevLensPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  setup(engine) {
    // subscribe to issues, register interceptors, etc.
  },
  teardown() {
    // cleanup
  },
};
engine.registerPlugin(myPlugin);
```

---

## AI Auto-Fix (new in v3)

The dashboard AI doesn't just explain problems — it generates patches:

```ts
import { generatePatch } from '@devlens/dashboard';

const patch = await generatePatch(issue, 'gemini-2.5-flash');
// patch.file → "src/components/UserProfile.tsx"
// patch.diff → unified diff you can apply
// patch.explanation → "Add null check before accessing avatar"
```

---

## Session Recording & QA Handoff (new in v3)

QA finds a bug. Instead of writing "I clicked the button and it broke", they export a `.devlens` file. Dev imports it and sees everything.

```ts
import { createSessionRecorder, exportSession } from '@devlens/ui';

const recorder = createSessionRecorder('session-123', engine.subscribe);
recorder.start();

// ... QA uses the app, issues are detected ...

// Export for dev team
exportSession(recorder.getSession());
// Downloads: devlens-session-session-123-1741700000.devlens
```

Import in dashboard:
```ts
import { parseSessionFile, readFileAsText } from '@devlens/ui';

const text = await readFileAsText(file);
const { success, session, error } = parseSessionFile(text);
```

---

## UI Panel & Dashboard

```ts
import { createDevLensPanel } from '@devlens/ui';

const { panel, reporter } = createDevLensPanel({
  position: 'bottom-right',
  theme: 'dark',
  hotkey: 'ctrl+shift+d',
  dashboardUrl: '/__devlens__/', // opens full dashboard
  xray: true,
});
```

**Panel features**: Issue list, timeline view, severity/category filtering, search, JSON/CSV export, session persistence, X-Ray Mode.

**Dashboard features**: Full-screen issue explorer, AI analysis (Gemini/Claude/GPT), source code context, pattern detection.

### Vite Integration

```ts
// vite.config.ts
import devlens from '@devlens/vite';

export default {
  plugins: [devlens()],
  // Dashboard auto-available at http://localhost:5173/__devlens__/
};
```

---

## Configuration

```tsx
<DevLensProvider
  config={{
    enabled: true,
    minSeverity: 'warn',
    throttleMs: 1000,
    maxIssues: 100,
    modules: {
      network: { fetch: true, xhr: true, ignoreUrls: ['/health'] },
      guardian: { maxDepth: 5 },
      catcher: { windowErrors: true, unhandledRejections: true },
    },
    ignore: { messages: [/ResizeObserver/] },
  }}
>
  <App />
</DevLensProvider>
```

## Production Safety

- Auto-disabled when `NODE_ENV === 'production'`
- `sideEffects: false` — tree-shakeable
- Zero overhead when disabled — provider renders children directly
- No data sent anywhere — everything stays in your browser

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Console logging — network, null detection, error boundaries | Done |
| v2.0 | UI panel overlay + Vue support + Inspector + Dashboard | Done |
| **v3.0** | **X-Ray Mode, Plugin System, API Contract, AI Auto-Fix, Session Recording, Async Tracker, @devlens/web** | **Current** |
| v4.0 | Svelte/Solid/Angular adapters, browser extension, deeper AI integration | Planned |

## Contributing

Contributions welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT — [GitHub](https://github.com/crashsense/devlens) — [Changelog](./CHANGELOG.md)
