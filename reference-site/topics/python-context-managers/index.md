---
title: Python with & context managers
sidebar_order: 30
languages: [python]
---

# Python `with` & context managers

The **`with`** statement runs setup and **guaranteed teardown** around a block, even when the block exits via `return`, `break`, or an exception. That pairing is a **context manager**.

**See also:** [Dunder methods (hook map)](../python-dunder-methods/) for `__enter__` / `__exit__` in the full special-method context; this page goes deeper on `contextlib` and async.

## Why this shows up in prep

- **Take-home / work-sample code:** files, DB connections, locks, timers — interviewers expect you to **not leak** resources.
- **Live coding:** you may implement a small “scope this operation” helper (timing, logging, temporary `chdir`).
- **Language trivia / senior loops:** how exceptions propagate through `__exit__`, what `contextlib.contextmanager` desugars to, or **`async with`** for async code.

Pure LeetCode-style DSA rarely needs `with`, but **Python fluency** questions do.

## Mental model

```text
with EXPR as VAR:
    BODY
```

Roughly desugars to:

```python
_cm = EXPR
_var = _cm.__enter__()
try:
    BODY  # uses _var if "as VAR" was given
finally:
    _cm.__exit__(*sys.exc_info())
```

The real interpreter passes exception info explicitly to `__exit__`; the point is: **`__exit__` always runs** after the block.

## Class-based context manager

Implement **`__enter__`** and **`__exit__`**. `__enter__`’s return value binds to `as name`.

```python
class timed_block:
    def __enter__(self):
        import time
        self._t0 = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc, tb):
        import time
        elapsed = time.perf_counter() - self._t0
        print(f"block took {elapsed:.4f}s")
        return False  # do not swallow the exception


with timed_block():
    ...
```

**`__exit__` return value:** if you return **`True`**, the exception (if any) is **suppressed** and execution continues after `with`. Returning **`False`** (or `None`) re-raises. Almost always return **`False`** unless you are deliberately implementing “catch and continue”.

## `contextlib.contextmanager` (generator style)

Write a **single `yield`**; code before `yield` is enter, code after is exit (like `finally`).

```python
from contextlib import contextmanager

@contextmanager
def temp_value(d, key, value):
    had = key in d
    old = d.get(key)
    d[key] = value
    try:
        yield d
    finally:
        if had:
            d[key] = old
        else:
            del d[key]
```

**Pitfall:** if the body raises, your code after `yield` still runs, but you usually want **`try` / `finally`** around `yield` so teardown is guaranteed (as above).

## Stdlib pieces worth knowing

| Tool | Use |
|------|-----|
| File-like objects | `open()` — canonical `with open(...) as f:` |
| `contextlib.closing(thing)` | Call `thing.close()` on exit when there is no native CM |
| `contextlib.suppress(OSError)` | Ignore specific exceptions inside the block |
| `contextlib.ExitStack` | Enter many managers dynamically (plugins, unknown count) — less common in short interviews, good “I know the stdlib” signal |

```python
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(p)) for p in paths]
    ...
# all files closed
```

## `async with` (async interviews)

**Same lifecycle as `with`**, but setup and teardown are **awaitable**: the interpreter **`await`s** `__aenter__` before the body and **`await`s** `__aexit__` after. Use it for **async sockets, HTTP responses, DB sessions, async locks** (`async with lock:`), and any API that exposes an **async context manager**.

- **`async with` is only legal inside `async def`** (or in an async generator’s body where the grammar allows it).
- **`__aenter__` / `__aexit__`** must be **`async def`** (or otherwise return **awaitables**). Teardown can **`await`** real I/O (e.g. `await stream.aclose()`).

Rough desugaring (concept only—the interpreter passes exception details explicitly):

```python
# async with EXPR as VAR:
#     BODY

_cm = EXPR
_var = await _cm.__aenter__()  # VAR binds to _var when "as VAR" is used
try:
    ...  # BODY — can use await inside
finally:
    # __aexit__ may run cleanup coroutines; interpreter awaits the result
    await _cm.__aexit__(exc_type, exc, tb)
```

### Class-based async context manager (definition)

Define **`__aenter__`** and **`__aexit__`** as async methods. Return **`False`** from `__aexit__` to propagate exceptions (same rule as sync `__exit__`).

```python
import asyncio
import time


class async_timed_block:
    """Async context manager: async __aenter__ / __aexit__."""

    async def __aenter__(self):
        # Runs once when entering the `async with` block (after await).
        self._t0 = time.perf_counter()
        return self  # becomes `t` in `async with async_timed_block() as t:`

    async def __aexit__(self, exc_type, exc, tb):
        # Always runs after the block (success, return, or exception).
        elapsed = time.perf_counter() - self._t0
        print(f"async block took {elapsed:.3f}s")  # e.g. async block took 0.105s
        return False  # False → re-raise any exception from the body; True would swallow it


async def main():
    async with async_timed_block() as t:
        # t is the object returned by __aenter__ (here, `self`).
        await asyncio.sleep(0.1)  # body work (I/O, other tasks, etc.)
        # After this block, __aexit__ runs (then prints elapsed time).


asyncio.run(main())
# Expected console order:
# 1) (body runs ~0.1s)
# 2) async block took 0.10xs
```

### `@asynccontextmanager` (definition)

Like `@contextmanager`, but the function is **`async def`** and you **`yield`** once inside **`async with`** / try/finally. Import from **`contextlib`**.

```python
import asyncio
from contextlib import asynccontextmanager


@asynccontextmanager
async def managed_counter():
    # Setup (runs when entering `async with`).
    state = {"count": 0}
    print("enter: counter starts at", state["count"])  # enter: counter starts at 0
    try:
        yield state  # bound to `c` below; body runs here
    finally:
        # Teardown — runs even if body raised.
        print("exit: final count was", state["count"])  # exit: final count was 2


async def main():
    async with managed_counter() as c:
        c["count"] += 1  # user mutates the yielded object
        print("inside:", c)  # inside: {'count': 1}
        c["count"] += 1
        print("inside:", c)  # inside: {'count': 2}
    # After block: finally runs → prints exit line


asyncio.run(main())
# Expected console order:
# enter: counter starts at 0
# inside: {'count': 1}
# inside: {'count': 2}
# exit: final count was 2
```

### Real-world-style usage (not full HTTP stack)

Libraries such as **aiohttp**, **httpx**, **asyncpg** expose **`async with`** on connections or responses. The **pattern** is always: enter acquires the resource; exit releases it.

```python
# Illustrative only — shape matches aiohttp/httpx/asyncpg APIs:

async def fetch_status(session, url: str) -> int:
    async with session.get(url) as resp:
        # resp is open for the whole block; headers often ready here
        # body = await resp.read()  # optional: read bytes
        return resp.status  # e.g. 200 — after return, session closes resp in __aexit__


# async with lock:  # asyncio.Lock — acquire on enter, release on exit
#     ... critical section ...
```

### Sync `with` vs `async with` (quick contrast)

| | Sync `with` | `async with` |
|---|-------------|--------------|
| Methods | `__enter__`, `__exit__` | `__aenter__`, `__aexit__` |
| Body | normal def | **`async def`**; body may **`await`** |
| Teardown | synchronous | may **`await`** I/O in `__aexit__` |

## How this differs from other languages (one line each)

- **C++:** RAII destructors — no `with` keyword; scope ends → destructor runs.
- **Java:** `try-with-resources` (`AutoCloseable`).
- **JavaScript:** no direct equivalent in older JS; `using` / explicit `try/finally` in modern patterns.

## See also

- [Python hub](../python/) — other Python-only notes
- [Iterators & generators](../iterators-and-generators/) — different dunder story (`__iter__` / `__next__`)
