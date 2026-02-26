// ============================================
// Bootstrap: polyfill fetch for --no-experimental-fetch mode
//
// On memory-constrained hosts (o2switch, 4 GB address space),
// Node's built-in undici uses WebAssembly which OOMs.
// We run with --no-experimental-fetch to disable undici entirely,
// then polyfill fetch/Request/Response/Headers with node-fetch.
// ============================================

import nodeFetch, { Request, Response, Headers } from "node-fetch";

// Polyfill globals that @hono/node-server and other libs expect
if (!globalThis.fetch) {
    // @ts-expect-error node-fetch types differ slightly from native
    globalThis.fetch = nodeFetch;
}
if (!globalThis.Request) {
    // @ts-expect-error
    globalThis.Request = Request;
}
if (!globalThis.Response) {
    // @ts-expect-error
    globalThis.Response = Response;
}
if (!globalThis.Headers) {
    // @ts-expect-error
    globalThis.Headers = Headers;
}

// Now load the actual server
await import("./server.js");
