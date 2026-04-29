# Lesson 1 — Async Generators, the Event Loop, and Push→Pull Bridges

> Foundations needed before we touch Workers. By the end of this you can read every line of [`apps/shared-rpc-ticker/src/data/binanceTradeStream.ts`](../../../../apps/shared-rpc-ticker/src/data/binanceTradeStream.ts) and explain why it works.

---

## 1. Loops & Iteration

| Loop | Iterates over | Use for |
|---|---|---|
| `for...in` | **keys** of an object (mostly indexes for arrays — strings!) | rarely — legacy footgun |
| `for...of` | **values** of an iterable | arrays, strings, Maps, Sets, generators |
| `for await...of` | values of an **async iterable** | streams, async generators, websockets |

**Rule:** in modern JS, default to `for...of`. Use `for...in` only for object property enumeration.

---

## 2. Iterator Protocol

A value is **iterable** if it has `[Symbol.iterator]()` returning an **iterator**.
An iterator has `.next()` returning `{ value, done }`.

```js
const arr = [10, 20, 30];
const it = arr[Symbol.iterator]();
it.next(); // { value: 10, done: false }
it.next(); // { value: 20, done: false }
it.next(); // { value: 30, done: false }
it.next(); // { value: undefined, done: true }
```

`for...of` is just a thin wrapper around "keep calling `.next()` until `done`."

---

## 3. Generators (`function*` + `yield`)

The easiest way to create an iterator. The function body is **paused at every `yield`**, **resumed by `.next()`**.

```js
function* counter() {
  yield 1;
  yield 2;
  yield 3;
}
[...counter()];   // [1, 2, 3]
```

### Key properties
- **Lazy** — body runs only when consumed.
- **Pausable** — preserves state at every yield.
- **Composable** — can pipe through `map`, `filter`, `take`.
- **Infinite** — `while(true) yield ...` works lazily; consumer breaks when done.
- **Generators don't loop on their own** — you write `while`/`for` *inside* the generator body. The consumer just resumes.

### `yield` is bidirectional
- `yield x` produces `x` to the consumer **immediately**.
- `yield x` evaluates to **whatever the consumer passes to the *next* `.next(v)` call**.
- The first `.next()` arg is **ignored** (no yield is paused yet).

```js
function* g() {
  const a = yield 'first';     // .next(v) gives v to a
  console.log('a =', a);
}
const it = g();
it.next();                     // { value: 'first', done: false }
it.next('hello');              // logs "a = hello"
```

`for...of` and `for await...of` always call `.next()` with no arguments, so this 2-way feature isn't accessible from those loops. It IS accessible via `gen.return()` and `gen.throw()`.

---

## 4. The `n + 1` Rule

To fully drain a generator with `n` yields, you need **n + 1** `.next()` calls.

- The generator pauses **at** `yield`, not after.
- The extra call is the one that runs past the last yield, finds end-of-function, and returns `{ done: true }`.
- `for...of` makes this invisible because the loop bails on `done: true` instead of binding the value.

---

## 5. `try/finally` and `gen.return()`

`gen.return()` injects a `return` at the current pause point. `return` propagates through any open `try` blocks, **running their `finally`** on the way out.

```js
function* g() {
  try {
    yield 1;
    yield 2;
  } finally {
    console.log('cleanup');
  }
}

const it = g();
it.next();        // { value: 1, done: false }
it.return();      // logs "cleanup", returns { value: undefined, done: true }
```

`for...of` and `for await...of` automatically call `gen.return()` when the loop exits via `break` or thrown error. This is why `try { … } finally { ws.close() }` in our `binanceTradeStream` cleans up automatically on unmount.

**Important:** `finally` does NOT run on garbage collection. Always call `.return()` explicitly (which our `useAsyncGenerator` hook does on unmount).

---

## 6. Promises

A Promise represents a value that *will* resolve later.

```js
const p = new Promise((resolve, reject) => { ... executor ... });
p.then(cb);          // cb runs as a MICROTASK after p settles
```

**The executor runs synchronously, immediately.** This is why we can do:
```js
let resolveNext;
const pending = new Promise(r => { resolveNext = r });
// resolveNext is now populated, on this same line
```

`.then(cb)` returns a **new Promise** whose value is whatever `cb` returns. The original promise is unchanged.

---

## 7. async / await

`async function` always returns a Promise. `await x` pauses the function until `x` settles, then evaluates to the resolved value.

Conceptually identical to generators (pause/resume). Pre-2017, `async/await` was implemented *using* generators (Babel `co`). Today, V8 has dedicated bytecode but the model is the same.

---

## 8. Async Generators

```js
async function* g() {
  yield 1;
  await sleep(100);
  yield 2;
}

for await (const v of g()) console.log(v);
```

Each `.next()` returns a **Promise of `{ value, done }`**. Body runs sync up to the next `yield`/`await`/`return`, then suspends. The consumer's `for await` is a microtask continuation.

**Critical: an async generator without `await` somewhere in its body is broken.** Without `await`, the engine never gets to run callbacks (timers, websocket handlers). Tab freezes.

---

## 9. The Event Loop

```
LOOP forever:
  1. Run ONE macrotask to completion (= until call stack empty)
  2. Drain ALL microtasks (each runs to call-stack-empty)
```

| Triggered by | Goes into |
|---|---|
| `setTimeout`, `setInterval` callbacks | macrotask |
| DOM events (click, scroll, message) | macrotask |
| Network response (fetch low-level) | macrotask |
| Initial script execution | macrotask 0 |
| `.then(cb)` after settled promise | microtask |
| `await x` continuation | microtask |
| `queueMicrotask(cb)` | microtask |

**Microtasks always drain before the next macrotask.** Microtasks fire in **FIFO** order regardless of which API queued them. `.then(cb)` on an already-settled promise enqueues `cb` immediately.

### Where the runtime threads live
JS itself is single-threaded. The runtime (browser/Node, written in C++) uses internal threads for timers, network, file I/O. These never touch JS state. They only **queue completion macrotasks** for the main thread to pick up.

### Where your script runs
Your `<script>` (or `node script.js`) is **macrotask 0** — runs top-to-bottom on the main thread. After it ends, your script "doesn't exist anymore" — only the callbacks it registered (timers, `.then`, listeners) live on in queues.

---

## 10. Push→Pull Bridge (the killer pattern)

Bridges any push source (timer, WebSocket, DOM events) to a pull-based async generator. The whole worker/RPC framework in this bootcamp rests on this.

### Core idea: deferred Promise

Grab the resolver out of `new Promise()` and call it from elsewhere:

```js
let resolveNext;
const pending = new Promise(r => { resolveNext = r });

// later, anywhere:
resolveNext('hello');

// elsewhere:
const v = await pending;  // 'hello'
```

### Lossy version (drops values when consumer is slow)

```js
async function* tick(intervalMs) {
  let resolveNext;
  let pending = new Promise(r => { resolveNext = r });

  const id = setInterval(() => {
    const r = resolveNext;
    pending = new Promise(res => { resolveNext = res });   // SWAP before resolving!
    r(Date.now());
  }, intervalMs);

  try {
    while (true) yield await pending;
  } finally {
    clearInterval(id);
  }
}
```

**Why "swap before resolving"?** If you resolve the same `pending` and don't make a new one, the next `await pending` returns instantly (already settled). Loop spins, CPU melts.

**Why lossy?** If consumer is slower than producer, ticks between `.next()` calls overwrite `pending` and resolve unawaited promises that are silently GC'd. Values lost.

### Lossless version (buffer)

```js
async function* tick(intervalMs) {
  const buffer = [];
  let resolveNext = null;

  const id = setInterval(() => {
    const value = Date.now();
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r(value);                          // wake waiter directly
    } else {
      buffer.push(value);                // queue for later
    }
  }, intervalMs);

  try {
    while (true) {
      if (buffer.length > 0) yield buffer.shift();
      else yield await new Promise(res => { resolveNext = res });
    }
  } finally {
    clearInterval(id);
  }
}
```

**The 6-line decision** that turns lossy into lossless:
```js
if (resolveNext) {  /* wake directly */ }
else            {  /* queue */         }
```

This is **exactly** the structure of `binanceTradeStream.ts`.

### Three policies for slow-consumer scenarios

| Policy | When to use |
|---|---|
| **Buffer (queue)** | Need every value (audit log, trades) |
| **Latest-only (conflate)** | Display state (price, cursor) |
| **Backpressure** | Producer is in your control |

Note: when the buffered generator's `finally` runs, the buffer is **silently discarded**. Don't put critical side effects (DB writes, analytics) in the consumer of a buffered stream.

---

## 11. When to use async generators

✅ **Streaming HTTP / SSE / WebSockets** — Binance, OpenAI streaming, etc.
✅ **Paginated APIs** — yield items, fetch next page lazily
✅ **DB cursors** — `for await (const row of cursor)`
✅ **Polling** — "keep checking, give me each new value"
✅ **Wrapping callback APIs** that you'd otherwise do with `EventEmitter` + `.on()`

❌ **Single-value async work** — just use `async/await`
❌ **High-frequency event streams with complex operators** (debounce, merge, retry) — RxJS Observables compose better

---

## Exercises Done

### Ex 1 — `take(iterable, n)` ✅
First `n` values of any iterable. Demonstrates lazy composition with infinite sources.

```js
function* take(iterable, n) {
  let i = 0;
  for (const x of iterable) {
    if (i++ >= n) return;
    yield x;
  }
}
```

### Ex 2 — `map` and `filter` ✅
Generic transforms over any iterable. Lazy chaining works even with infinite sources.

```js
function* map(iterable, fn) {
  for (const x of iterable) yield fn(x);
}
function* filter(iterable, predicate) {
  for (const x of iterable) if (predicate(x)) yield x;
}
```

### Ex 2.5 — `tick(intervalMs)` (Approach 1: sleep)
Simple async generator pacing values with `await sleep`.

```js
async function* tick(intervalMs) {
  try {
    while (true) {
      yield Date.now();
      await sleep(intervalMs);
    }
  } finally {
    console.log('cleanup');
  }
}
```

**Bug discovered:** without `while(true)`, only ONE value yields then the body falls off → `finally` fires immediately. Generators don't loop on their own.

### Ex 2.6 — `tick` (Approach 2: deferred promise + buffer)
Same shape as `binanceTradeStream`. Empirically observed:
- Lossy version: dropped 5 of every 6 ticks when consumer was 5× slower than producer.
- Buffered version: zero loss, values cluster on consumer wake-ups but all delivered.

### Ex 3 — `fromEvent(target, eventName)` ✅
Push→pull bridge for DOM events. Same shape as `tick` but with `addEventListener` / `removeEventListener` instead of `setInterval` / `clearInterval`.

```js
async function* fromEvent(target, eventName) {
  let resolveNext;
  let promise = new Promise(r => { resolveNext = r });
  const cb = (event) => {
    const r = resolveNext;
    promise = new Promise(res => { resolveNext = res });
    r(event);
  };
  target.addEventListener(eventName, cb);
  try {
    while (true) yield await promise;
  } finally {
    target.removeEventListener(eventName, cb);
  }
}
```

**Lesson:** the same bridge pattern works for ANY push source (timer, DOM, WebSocket). Replace one event registration with another, keep the generator skeleton identical.

### Ex 4 — `merge(a, b)` ✅ (after multiple iterations)

Goal: yield values from two async iterables as they arrive.

#### Initial buggy attempt
```js
async function* merge(a, b) {
  let p1 = null, p2 = null;
  while (true) {
    if (p1 == null) p1 = a.next();
    if (p2 == null) p2 = b.next();
    const cur = await Promise.race([p1, p2]);
    p1.then(() => p1 = null);    // ❌ stale callbacks accumulate
    p2.then(() => p2 = null);    // ❌ same problem
    yield cur;                    // ❌ yields envelope, not value
  }
}
```

**Bugs:**
1. **Yielded envelope** — `cur` is `{value, done}`, not the inner value.
2. **Stale `.then` callbacks** — `.then(() => p2 = null)` on the slow promise accumulates one callback per iteration. When slow finally resolves, ALL the callbacks fire in FIFO microtask order, zeroing `p2` repeatedly — including AFTER you've reassigned it on a later iteration. Crash on `p2.then(...)` reading a null.

#### Fix: tag the winner via `.then(...)` wrap
```js
async function* merge(a, b) {
  let p1 = null, p2 = null;
  while (true) {
    if (p1 == null) p1 = a.next().then(result => ({ result, id: 0 }));
    if (p2 == null) p2 = b.next().then(result => ({ result, id: 1 }));
    const cur = await Promise.race([p1, p2]);
    if (cur.id === 0) p1 = null;     // ✅ sync, no .then microtask
    else              p2 = null;
    if (cur.result.done) continue;
    yield cur.result.value;
  }
}
```

**Why this works:**
- Race winner identity is **encoded in the resolved value** (`id: 0` or `id: 1`), not deduced via stale callbacks.
- We null sync, no `.then(() => x = null)` accumulation.
- Envelope unwrapping is explicit (`cur.result.value`).
- Variadic-friendly version uses `slots = [...]` array indexed by `idx`.

---

## Mental Models to Keep

1. **Stack empties → drain all microtasks → run one macrotask → drain all microtasks → ...**
2. **`yield x` in an async generator = "resolve the .next() Promise with `{value:x, done:false}` AND suspend."**
3. **Promise executor runs SYNC. `.then` callbacks run as MICROTASKS.**
4. **An async generator without `await` somewhere is broken — never yields the thread to event loop.**
5. **`finally` is the cleanup hook. Triggered by `gen.return()` (which `break` calls automatically).**
6. **Push→pull bridge = deferred promise + (optional) buffer.** This is the structural backbone of all real-time streaming code.
7. **Don't use `.then(() => x = null)` to track promise consumption.** Encode identity in the resolved value instead.

---

## What Comes Next (v1 onwards)

| Version | Concept |
|---|---|
| v1 | Move `binanceTradeStream` into a **dedicated Worker**. Manual `postMessage` proto-RPC. |
| v2 | Switch to **SharedWorker**. Multi-tab dedup. `onconnect`, `MessagePort`. |
| v3 | Generalized message protocol. UUIDs, conversations, multiplexing. |
| v4 | Cancel + error propagation. Robust state machine. |
| v5 | Base class + mixins (Connection / HostCall / ClientCall). |
| v6 | TypeScript experimental decorators (`@rpc`). |
| v7 | Fallback when SharedWorker unavailable. Host/Client duality. |

The push→pull bridge from this lesson reappears in v2+ as the bridge between **MessagePort.onmessage** and our consumer-facing async generators across worker boundaries. Same pattern, different transport.

---

**See also:** A shorter cross-language iterator overview (JS / Python / C++) lives in the handbook at **`/topics/iterators-and-generators/`** (run `npm run dev:reference` from the repo root after `npm install`).
