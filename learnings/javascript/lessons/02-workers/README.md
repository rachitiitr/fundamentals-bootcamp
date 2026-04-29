# Lesson 2 — Web Workers (Hands-On)

5 exercises that take you from "what is a Worker?" to "I just rebuilt a streaming ticker on top of a Worker." After this lesson, reading the v1 source will be trivial.

## How to run

Workers can't be loaded from `file://` URLs — you need an HTTP server. From this folder:

```bash
./serve.sh
# or
python3 -m http.server 8080
```

Then open: `http://localhost:8080/01-hello/`

Re-load the page each time you change worker code (DevTools → disable cache while DevTools open is helpful).

## DevTools tips

- **Console** — your `console.log`s from inside a Worker show up here, prefixed with the worker file name.
- **Sources panel** → there's a separate "thread" entry for each Worker. You can set breakpoints in worker code.
- **Application → Storage → Service workers / shared workers** — relevant later (lesson 3+).

## The exercises

| # | Folder | Goal | New concept |
|---|---|---|---|
| 1 | `01-hello/` | Page sends "ping" to worker, worker logs it | `new Worker()`, `postMessage`, `onmessage`, `self` global |
| 2 | `02-echo-delay/` | Worker echoes whatever the page sends, with 500ms delay | Worker can do async work; bidirectional messaging |
| 3 | `03-two-workers/` | Spawn 2 different workers from one page; verify isolation | Workers don't share memory; each has its own globals |
| 4 | `04-rpc/` | Build a tiny `call(method, args)` helper that returns a Promise | Correlation IDs, promise-based wrapper over postMessage |
| 5 | `05-streaming-ticker/` | Move Binance WS into a worker, page subscribes via async generator | Streaming protocol, push-to-pull bridge across thread boundary |

By exercise 5 you'll have written essentially the same code that lesson v1 of [`apps/shared-rpc-ticker`](../../../../apps/shared-rpc-ticker) will become — just without the React/Vite overhead.

## Cheat sheet — Web Worker primitives

### In the page
```js
// Spawn a worker (URL is relative to the HTML file)
const w = new Worker('worker.js');

// Send a message — value is structured-cloned
w.postMessage({ type: 'ping', n: 42 });

// Receive replies
w.onmessage = (event) => {
  console.log('got reply:', event.data);
};
w.onerror = (e) => console.error('worker errored:', e.message);

// Stop the worker (terminate immediately, no cleanup)
w.terminate();
```

### Inside the worker (`worker.js`)
```js
// `self` is the worker's global scope (DedicatedWorkerGlobalScope)
// No DOM, no window, but you have: setTimeout, fetch, WebSocket, etc.

self.onmessage = (event) => {
  console.log('worker got:', event.data);
  self.postMessage({ reply: 'pong' });
};

// You can throw / log errors; the page sees them via w.onerror
```

### What can be sent via `postMessage`?
The **structured clone algorithm**:
- ✅ Plain objects, arrays, Maps, Sets, Dates, RegExp, ArrayBuffer, Blob, ImageData
- ✅ Strings, numbers, booleans, null, undefined
- ❌ Functions, DOM nodes, anything with prototype methods (lost!)
- ❌ Class instances arrive as plain objects (no methods)

### Module workers (modern, supports `import`)
```js
const w = new Worker('worker.js', { type: 'module' });
// then in worker.js you can:
import { foo } from './shared.js';
```
Useful later. For these exercises, classic (non-module) workers are simpler.

## What's NOT in this lesson (saved for later)

- `SharedWorker` — lesson 3 (the real prize)
- `MessagePort` / `MessageChannel` — lesson 3 (used by SharedWorker)
- `Transferable` objects (zero-copy transfers) — bonus topic, mention only
- Service Workers — different mental model, skipped entirely

## Done? Move to lesson 3 (SharedWorker)
