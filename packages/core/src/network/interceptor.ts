import type {
  DevLensEngine,
  NetworkInterceptorConfig,
  DetectedIssue,
  Severity,
} from '../types';

function matchesPattern(url: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((p) =>
    typeof p === 'string' ? url.includes(p) : p.test(url),
  );
}

function generateIssueId(method: string, url: string, status: number): string {
  return `network:${method}:${url}:${status}`;
}

function severityFromStatus(status: number): Severity {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

function buildSuggestion(
  method: string,
  url: string,
  status: number,
): string {
  if (status >= 500)
    return `Server returned ${status} for ${method} ${url} — check server logs`;
  if (status === 404)
    return `Endpoint ${url} not found — verify the URL is correct`;
  if (status === 401 || status === 403)
    return `Authentication/authorization failed for ${url} — check credentials or permissions`;
  if (status >= 400)
    return `Client error ${status} for ${method} ${url} — check request parameters`;
  return `Request to ${url} completed with status ${status}`;
}

export function createNetworkInterceptor(
  engine: DevLensEngine,
  config?: NetworkInterceptorConfig | boolean,
) {
  const resolvedConfig: NetworkInterceptorConfig =
    typeof config === 'boolean' || config === undefined
      ? {}
      : config;

  const interceptFetch = resolvedConfig.fetch !== false;
  const interceptXhr = resolvedConfig.xhr !== false;
  const ignoreUrls = resolvedConfig.ignoreUrls ?? [];
  const logSuccess = resolvedConfig.logSuccess ?? false;

  let originalFetch: typeof globalThis.fetch | null = null;
  let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  let originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;

  function shouldIgnore(url: string): boolean {
    return ignoreUrls.length > 0 && matchesPattern(url, ignoreUrls);
  }

  function reportNetworkIssue(
    method: string,
    url: string,
    status: number,
    statusText: string,
    duration: number,
    error?: Error,
  ): void {
    if (!engine.isEnabled()) return;

    const severity = error ? 'error' : severityFromStatus(status);
    if (severity === 'info' && !logSuccess) return;

    const issue: DetectedIssue = {
      id: generateIssueId(method, url, status),
      timestamp: Date.now(),
      severity,
      category: 'network',
      message: error
        ? `${method} ${url} failed: ${error.message}`
        : `${method} ${url} returned ${status} ${statusText}`,
      details: {
        url,
        method,
        status,
        statusText,
        duration: `${duration}ms`,
      },
      suggestion: error
        ? `Network request to ${url} failed — check if the server is running and the URL is correct`
        : buildSuggestion(method, url, status),
      stack: error?.stack,
      source: 'NetworkInterceptor',
    };

    engine.report(issue);
  }

  function installFetchInterceptor(): void {
    if (typeof globalThis.fetch === 'undefined') return;
    originalFetch = globalThis.fetch;

    const savedFetch = originalFetch;
    globalThis.fetch = async function devlensFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const method = init?.method ?? 'GET';

      if (shouldIgnore(url)) {
        return savedFetch.call(globalThis, input, init);
      }

      const start = performance.now();

      try {
        const response = await savedFetch.call(globalThis, input, init);
        const duration = Math.round(performance.now() - start);

        if (!response.ok || logSuccess) {
          reportNetworkIssue(
            method.toUpperCase(),
            url,
            response.status,
            response.statusText,
            duration,
          );
        }

        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        reportNetworkIssue(
          method.toUpperCase(),
          url,
          0,
          'Network Error',
          duration,
          err instanceof Error ? err : new Error(String(err)),
        );
        throw err;
      }
    };
  }

  function installXhrInterceptor(): void {
    if (typeof XMLHttpRequest === 'undefined') return;

    originalXhrOpen = XMLHttpRequest.prototype.open;
    originalXhrSend = XMLHttpRequest.prototype.send;

    const savedOpen = originalXhrOpen;
    const savedSend = originalXhrSend;

    XMLHttpRequest.prototype.open = function devlensXhrOpen(
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ): void {
      (this as XMLHttpRequest & { _devlens_method: string })._devlens_method =
        method;
      (this as XMLHttpRequest & { _devlens_url: string })._devlens_url =
        typeof url === 'string' ? url : url.toString();
      return savedOpen.apply(
        this,
        [method, url, ...rest] as Parameters<typeof savedOpen>,
      );
    };

    XMLHttpRequest.prototype.send = function devlensXhrSend(
      body?: Document | XMLHttpRequestBodyInit | null,
    ): void {
      const xhr = this as XMLHttpRequest & {
        _devlens_method: string;
        _devlens_url: string;
      };
      const method = xhr._devlens_method ?? 'GET';
      const url = xhr._devlens_url ?? '';

      if (shouldIgnore(url)) {
        return savedSend.call(this, body);
      }

      const start = performance.now();

      const onLoadEnd = (): void => {
        const duration = Math.round(performance.now() - start);
        if (xhr.status >= 400 || logSuccess) {
          reportNetworkIssue(
            method.toUpperCase(),
            url,
            xhr.status,
            xhr.statusText,
            duration,
          );
        }
        xhr.removeEventListener('loadend', onLoadEnd);
        xhr.removeEventListener('error', onError);
      };

      const onError = (): void => {
        const duration = Math.round(performance.now() - start);
        reportNetworkIssue(
          method.toUpperCase(),
          url,
          0,
          'Network Error',
          duration,
          new Error('XMLHttpRequest network error'),
        );
        xhr.removeEventListener('loadend', onLoadEnd);
        xhr.removeEventListener('error', onError);
      };

      xhr.addEventListener('loadend', onLoadEnd);
      xhr.addEventListener('error', onError);

      return savedSend.call(this, body);
    };
  }

  function install(): void {
    if (typeof window === 'undefined') return;
    if (interceptFetch) installFetchInterceptor();
    if (interceptXhr) installXhrInterceptor();
  }

  function uninstall(): void {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
      originalFetch = null;
    }
    if (originalXhrOpen) {
      XMLHttpRequest.prototype.open = originalXhrOpen;
      originalXhrOpen = null;
    }
    if (originalXhrSend) {
      XMLHttpRequest.prototype.send = originalXhrSend;
      originalXhrSend = null;
    }
  }

  return { install, uninstall };
}
