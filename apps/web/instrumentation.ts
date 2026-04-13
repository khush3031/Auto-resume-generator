/**
 * Next.js Server Instrumentation  (runs once on server startup, Node.js only)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * What it does:
 *  - Patches the global `fetch` that Next.js server components / server actions use
 *  - Logs every outgoing request from Next.js → NestJS API using the
 *    same "logging-only" format as request-tracker-pro (method, path, status, ms)
 *  - Adds an X-Request-Source header so NestJS logs can identify Next.js SSR calls
 */

export async function register() {
  // Only run in the Node.js runtime (not Edge).
  // process.env.NEXT_RUNTIME is set to 'nodejs' for server components.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const isApiCall = url.startsWith(API_BASE);

    // Inject tracing header so NestJS logs can identify Next.js SSR calls
    if (isApiCall) {
      init = {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          'X-Request-Source': 'nextjs-ssr',
        },
      };
    }

    const start = Date.now();
    let status = 0;

    try {
      const response = await originalFetch(input, init);
      status = response.status;
      return response;
    } catch (err) {
      status = 0; // network error / connection refused
      throw err;
    } finally {
      if (isApiCall) {
        const duration = Date.now() - start;
        const path = url.replace(API_BASE, '') || '/';
        const statusLabel = status === 0 ? 'ERR' : String(status);

        // Same text format as request-tracker-pro logging-only adapter:
        // [RequestTracker] METHOD /path → STATUS (Xms)
        const line = `[RequestTracker] ${method} ${path} → ${statusLabel} (${duration}ms)`;

        if (status === 0 || status >= 500) {
          console.error(line);
        } else if (status >= 400) {
          console.warn(line);
        } else {
          console.log(line);
        }
      }
    }
  };

  console.log(
    '[RequestTracker] Next.js SSR fetch logger active — logging all calls to',
    API_BASE,
  );
}
