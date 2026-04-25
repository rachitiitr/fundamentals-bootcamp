# Prep Bootcamp

A hands-on bootcamp for learning the foundational concepts behind a
SharedWorker-based RPC framework — inspired by HRT's "HRTWorker" blog
post, but rebuilt from scratch with neutral naming.

## Lessons

| # | Folder | What you learn |
|---|---|---|
| **v0** ✅ | [`shared-rpc-ticker`](./shared-rpc-ticker) | Async generators, `useAsyncGenerator` React hook, direct WebSocket per component (the "before" picture) |
| v1 (next) | _coming_ | Move WS into a dedicated `Worker`. Manual `postMessage` proto-RPC. |
| v2 | _coming_ | Switch to `SharedWorker`. Multi-tab dedup. `onconnect`, `MessagePort`. |
| v3 | _coming_ | Generalized message protocol. UUIDs, conversations, multiplexing. |
| v4 | _coming_ | Cancel + error propagation. Robust state machine. |
| v5 | _coming_ | Base class + mixins (Connection / HostCall / ClientCall). |
| v6 | _coming_ | TypeScript experimental decorators (`@rpc` / `@remoteExecute`). |
| v7 | _coming_ | Fallback when SharedWorker is unavailable. Host/Client duality. |

## Quickstart

```bash
cd shared-rpc-ticker
npm install
npm run dev   # http://localhost:5173
```

Then open the page in **two browser tabs**, open **DevTools → Network →
WS**, and count the WebSocket connections. That count is the problem
later lessons will solve.

## Why this exists

Real-time dashboards (trading, monitoring, chat) commonly suffer from
the "N tabs × M widgets = N×M duplicate connections" problem. The fix is
elegant — a SharedWorker that hosts shared state and exposes a method-
call-like API to all tabs — but the implementation has surprising depth:
async generators, structured-clone serialization, decorators, mixins, and
careful lifecycle management.

This bootcamp builds that fix one tiny step at a time, each step
introducing exactly one new concept on top of a working app.
