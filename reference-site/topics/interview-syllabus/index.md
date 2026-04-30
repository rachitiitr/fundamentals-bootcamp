---
title: Interview syllabus (master list)
sidebar_order: 1
---

# Interview syllabus — Python, JavaScript/TypeScript, C++, systems

One **backlog-style** list for SWE-style interviews: language internals, standard libraries, concurrency, OS, networks, and a thin slice of distributed systems / data stores. Use it to **pick the next tutorial** to add under `reference-site/topics/`.

**Legend**

- `[ ]` — no dedicated topic page in this repo yet (good candidate for a tutorial).
- `[x]` — there is already a **topic or hub** you can open today (link on the line).

**Unchecked** lines are **not** “unimportant” — they are the **roadmap**. When you add a tutorial, flip `[ ]` → `[x]` and link it here. Keep new pages **problem-first** with interview Q&A (see repo rules).

---

## Python

### Core language & execution model

- [ ] LEGB scope, `global` vs `nonlocal`, closure variable binding (late binding gotcha)
- [ ] Mutable default arguments, what happens and how to fix
- [ ] `*args` / `**kwargs`, unpacking, keyword-only args, `/` positional-only
- [ ] Comprehensions, generator expressions, scoping inside comprehensions
- [ ] Walrus operator `:=` — when it helps vs hurts readability
- [ ] Structural pattern matching (`match` / `case`) — basics for interviews
- [ ] `is` vs `==`, `None` checks, small integer caching (conceptual)
- [ ] Import system, packages, `__init__.py`, circular imports, `if __name__ == "__main__"`
- [ ] `__main__`, runnable modules, `-m`
- [ ] `pathlib` vs `os.path` — idiomatic file paths
- [ ] Introspection: `getattr`, `setattr`, `hasattr`, `dir` — boundaries in interviews
- [ ] Exceptions: `try` / `except` / `else` / `finally`, exception chaining, custom exceptions
- [ ] Context managers — `with`, `__enter__` / `__exit__`, suppressing exceptions  
  - [x] [with & context managers](../python-context-managers/) — `contextlib`, `@contextmanager`, `ExitStack`, `async with`

### Object model & OOP

- [ ] Classes, instances, `self`, class vs instance attributes  
  - See [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/) — tables + Python class-attribute gotcha
- [ ] Dunder methods: `__str__`, `__repr__`, `__eq__`, `__hash__` (consistency), `__lt__` and ordering  
  - [x] [Dunder methods (hooks) — full map + JS / C++](../python-dunder-methods/) — construction, `[]`, iteration, `with`, `__call__`, `__radd__`, …
- [ ] `__getattr__` vs `__getattribute__` — infinite recursion pitfall  
  - Covered briefly on [Dunder methods](../python-dunder-methods/); deep dives on descriptors / `__slots__` live on [Dynamic dispatch](../dynamic-dispatch-and-object-model/) and follow-up pages.
- [ ] Properties, `@property`, setters, deleters
- [ ] Descriptors — how `@property` and methods work under the hood
- [ ] `__slots__` — memory vs flexibility tradeoff
- [ ] Dataclasses (`@dataclass`) — `frozen`, `field`, `__post_init__`
- [ ] `abc.ABC`, abstract methods — interface-style design
- [x] Multiple inheritance, **MRO** (`mro()`, C3 linearization) — diamond problem — [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/)
- [x] `super()` — cooperative multiple inheritance — same page (Chapter 2)
- [ ] Protocols & structural subtyping (`typing.Protocol`) — “duck typing with teeth”
- [ ] Enums (`enum.Enum`) — identity vs value, `IntEnum` caveats

### Iteration & generators

- [ ] `__iter__` / `__next__`, iterator protocol, `StopIteration`  
  - [x] Protocol + parallels — [Dunder methods](../python-dunder-methods/) § iteration; generators — [Iterators & generators](../iterators-and-generators/)
- [ ] Generator functions, `yield`, generator objects, `send` / `throw` / `close` (awareness)
- [ ] `yield from` — delegation to another iterable or generator
- [ ] `itertools` — `chain`, `cycle`, `islice`, `groupby`, `tee`, `product`, `permutations`, `combinations`
- [ ] `functools` — `partial`, `reduce`, `lru_cache`, `cached_property`, `wraps`
- [ ] `operator.itemgetter` / `attrgetter` — sort keys and readability  
  - [x] Cross-language hub: [Iterators & generators](../iterators-and-generators/)

### Standard library — collections & algorithms

- [ ] `list`, `tuple`, `str` — copying, concatenation cost, when to use which
- [ ] `dict` — insertion order (3.7+), key requirements, hashability
- [ ] `set`, `frozenset` — typical interview uses (dedupe, membership)
- [ ] `collections.Counter` — multiset of hashable items (counts)
- [ ] `collections.defaultdict` — grouping patterns
- [ ] `collections.deque` — O(1) ends, amortized rotation, BFS
- [ ] `collections.namedtuple` / `NamedTuple` — lightweight records
- [ ] `collections.OrderedDict` — when it still matters vs `dict`
- [ ] `heapq` — min-heap patterns, `heapify`, `nlargest` / `nsmallest`
- [ ] `bisect` — binary search on sorted lists (stdlib only)
- [ ] Sorted multiset gap — `SortedList` vs rolling your own (see multiset topic)  
  - [x] [Multiset & ordered duplicates](../multiset/) — patterns across languages

### Typing & modern Python

- [ ] `typing` — `List`, `Dict`, `Optional`, `Union`, `Callable`, `TypeVar`, `Generic`
- [ ] `Protocol`, `TypedDict`, `Literal`, `Final`
- [ ] `isinstance` + unions, gradual typing limits

### Concurrency & I/O

- [ ] GIL — what it does and does **not** guarantee; when threads still help (I/O)
- [ ] `threading` — locks, `RLock`, `Event`, `Condition`, deadlocks
- [ ] `concurrent.futures` — `ThreadPoolExecutor`, `ProcessPoolExecutor`, `as_completed`
- [ ] `multiprocessing` — pickling constraints, `spawn` vs `fork` (platform)
- [ ] `asyncio` — event loop, `async` / `await`, tasks, `gather`, cancellation
- [ ] `asyncio` locks, queues, producers/consumers
- [ ] Async context managers and iterables (`async with`, `async for`)

### Memory, performance & C API (high level)

- [ ] Reference counting + cycle detector (`gc`) — when cycles matter
- [ ] `weakref` — caches, avoiding reference cycles
- [ ] Big-O for list/dict/set operations; when C implementations matter
- [ ] Profiling story — `cProfile`, line_profiler (name only is fine in interviews)

### Testing & packaging (talk track)

- [ ] `pytest` — fixtures, parametrize, monkeypatch vs mock
- [ ] `unittest.mock` — `patch`, where to mock
- [ ] Virtual environments, `pip`, editable installs — “how you ship code”

### Common coding-pattern topics (Python angle)

- [ ] Two pointers, sliding window, prefix sums — complexity in Python
- [ ] Graphs — adjacency list with `dict`/`list`, BFS/DFS, topological sort
- [ ] Dynamic programming — memoization (`functools.lru_cache`) vs tabulation
- [ ] String processing — immutability, building strings efficiently

---

## JavaScript & TypeScript

### Core JS semantics

- [ ] Primitives vs objects, boxing, `typeof` quirks
- [ ] `==` vs `===`, type coercion rules (high level)
- [ ] `var` / `let` / `const`, temporal dead zone, block scope
- [ ] Hoisting — functions vs `var`; `let`/`const` not hoisted like `var`
- [ ] Closures — lexical environment, common loop/callback bugs, fixes
- [x] [`this` — default, implicit, explicit (`call`/`apply`/`bind`), arrow functions](../javascript-this-binding/)
- [ ] `new`, constructors, `class`, `extends`, `super` — see [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/) Chapter 2–4
- [x] Prototypes — `__proto__` vs `prototype` (conceptual); delegation — [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/)
- [ ] Private fields (`#`), static blocks
- [ ] Destructuring, rest/spread, default values
- [ ] `Array` methods — `map`/`filter`/`reduce`, mutating vs non-mutating
- [x] [`Object.assign`, shallow spread, enumeration, descriptors, `Proxy`, cloning](../javascript-objects-interview/) — static toolbox + interview Q&A
- [ ] `Map` vs object, `Set`, `WeakMap` / `WeakSet` — use cases
- [ ] `JSON.stringify` / `parse` — pitfalls (dates, `undefined`, cycles); **`structuredClone`** contrast — see [JavaScript object APIs § JSON vs structuredClone](../javascript-objects-interview/#json-vs-structuredclone)
- [ ] Modules — ESM vs CommonJS, static vs dynamic `import()`, default vs named exports
- [ ] Strict mode — why it exists, top-level `this` in modules
- [ ] Error types, `Promise` rejection vs sync throw in `async` functions  
  - [x] Cross-language hub: [Iterators & generators](../iterators-and-generators/) — `Symbol.iterator`, `function*`, `for await`

### Event loop & asynchrony

- [ ] Call stack, task queues, macrotasks vs microtasks (`queueMicrotask`, `Promise.then`)
- [ ] `setTimeout` / `setInterval` — timing guarantees (none), throttling
- [ ] Promises — states, chaining, error propagation, `Promise.all` / `race` / `allSettled`
- [ ] `async` / `await` — desugaring mental model
- [ ] Async iteration — `Symbol.asyncIterator`, `for await...of`
- [ ] `AbortController` — canceling `fetch` and other async work

### TypeScript (if the loop includes TS)

- [ ] Structural typing vs nominal (TS is structural)
- [ ] `interface` vs `type` — practical differences in interviews
- [ ] Generics — constraints, defaults, inference failures
- [ ] Utility types — `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`
- [ ] Discriminated unions, exhaustiveness checking (`never`)
- [ ] `readonly`, `const` assertions, immutability patterns
- [ ] `unknown` vs `any`, type narrowing (`typeof`, `in`, predicates)
- [ ] Declaration merging, ambient modules (awareness)

### Browser / runtime (when “frontend” or Node appears)

- [ ] DOM events — bubbling vs capturing, delegation, `preventDefault` / `stopPropagation`
- [ ] Layout thrashing, `requestAnimationFrame` (high level)
- [ ] `fetch`, CORS — simple vs preflight, credentials
- [ ] `localStorage` / `sessionStorage` vs cookies — security sketch
- [ ] Web Workers — isolation, `postMessage`, transferable objects (lesson track exists)
- [ ] Node.js — event loop phases vs browser, libuv at a high level
- [ ] Streams in Node — backpressure concept

### Language hub

- [x] [JavaScript hub](../javascript/) — lesson links and JS-only page ideas

---

## C++

### Build, linkage & ODR

- [ ] Translation units, headers vs sources, include guards / `#pragma once`
- [ ] One Definition Rule (ODR) — what can appear where
- [ ] Internal vs external linkage, `inline` functions / variables (C++17)
- [ ] `static` keyword overload (file scope, class member, local function)

### Types, lifetimes & safety

- [ ] Value categories — lvalue, xvalue, prvalue; glvalue vs rvalue
- [ ] References — lvalue ref, const ref, rvalue ref, ref collapsing, forwarding refs
- [ ] `std::move` — cast to rvalue; does not move by itself
- [ ] Rule of Zero / Three / Five — when to write special members
- [ ] Copy vs move constructors/assignment; when move is implicitly deleted
- [ ] Copy elision, RVO, NRVO — mandatory elision cases (C++17+)
- [ ] RAII — constructors acquire, destructors release
- [ ] Smart pointers — `unique_ptr`, `shared_ptr`, `weak_ptr`, deleters, `make_shared` / `make_unique`
- [ ] Circular `shared_ptr` + `weak_ptr` fix
- [ ] `const`, `constexpr`, `consteval`, `constinit` — interview-level distinctions
- [ ] `noexcept` — move in containers, optimization + termination
- [ ] `static` local initialization, destruction order fiasco (awareness)

### Memory model & objects

- [ ] Object lifetime, storage duration — automatic, static, dynamic, thread-local
- [ ] `new` / `delete`, `new[]` / `delete[]`, alignment, `aligned_new`
- [ ] Placement new — when it appears (low-level / embedded interviews)
- [ ] Strict aliasing, type punning, `std::bit_cast` (C++20)
- [ ] Undefined behavior vs unspecified vs implementation-defined — classic examples

### Templates & generics

- [ ] Function and class templates, dependent names, `typename`
- [ ] SFINAE — substitution failure; `std::enable_if` patterns
- [ ] Concepts (`requires`, `std::same_as`, custom concepts) — C++20
- [ ] Variadic templates, fold expressions (basics)
- [ ] CRTP — curiously recurring template pattern (name and use)

### STL containers & iterators

- [ ] `vector`, `deque`, `list`, `forward_list` — iterator invalidation rules
- [ ] `map` / `multimap` / `set` / `multiset` — ordering, complexity  
  - [x] [Multiset & ordered duplicates](../multiset/) — `std::multiset` patterns
- [ ] `unordered_map` / `unordered_set` — hashing, rehash, iterator invalidation
- [ ] `priority_queue` — underlying container, comparator, `pair` tricks
- [ ] `stack`, `queue`, `priority_queue` adapters
- [ ] Iterator categories — input/output/forward/bidirectional/random access
- [ ] `algorithm` — `lower_bound` / `upper_bound`, `sort`, `nth_element`, `partition`
- [ ] `string_view` — non-owning, lifetime pitfalls

### Object model & polymorphism

- [x] [Object layout, padding, alignment (`alignof`, `alignas`)](../cpp-struct-layout/)
- [ ] Virtual functions, dynamic dispatch, vptr/vtable  
  - [x] [Virtual tables (vtables)](../cpp-vtables/)
  - [x] [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/) — C++ vs Python vs JavaScript
- [ ] Pure virtual, abstract classes, interfaces
- [ ] `override` / `final` — catch errors at compile time
- [ ] Slicing — why polymorphism + value semantics hurts
- [ ] `dynamic_cast` — RTTI cost and failure modes

### Concurrency & memory order

- [ ] Data races, `std::thread`, `join` / `detach`
- [ ] `mutex`, `lock_guard`, `unique_lock`, deadlock avoidance
- [ ] `condition_variable` — predicate pattern, spurious wakeup
- [ ] `atomic` — compare-and-swap, memory orders (`relaxed`, `acquire`/`release`, `seq_cst`) at interview depth
- [ ] `future` / `promise`, `async` — fire-and-forget pitfalls

### Modern C++ features (sprinkle by level)

- [ ] Lambdas — captures, default captures, mutable, generic lambdas
- [ ] `std::optional`, `std::variant`, `std::any` — when and tradeoffs
- [ ] `std::span` — non-owning range over contiguous memory
- [ ] Ranges (C++20) — `views`, laziness (name-level)
- [ ] Coroutines (C++20) — co_await mental model vs JS/Python generators

### Error handling & IO

- [ ] Exceptions vs error codes — when each wins in C++ APIs
- [ ] `noexcept` specifications (legacy) vs unconditional `noexcept` on move
- [ ] `iostream` vs `fmt` / `std::format` — interview practicality

### Language hub

- [x] [C++ hub](../cpp/) — existing topics and ideas for new pages

---

## Systems, OS, architecture & networks

### Operating systems — memory & processes

- [ ] Processes vs threads — address space sharing, creation cost
- [ ] `fork`, `exec`, copy-on-write after fork
- [x] [Virtual memory, paging, page faults, demand paging, TLB vs cache, RSS/VIRT, backing store, `CR3`](../virtual-memory/)
- [x] [Page tables, multi-level tables, TLB — translation path](../virtual-memory/#multi-level-page-tables) (same page — [TLB vs data cache](../virtual-memory/#tlb-vs-data-cache))
- [x] [Swapping / thrashing, working set](../virtual-memory/#thrashing-and-working-set) — definitions on [virtual memory](../virtual-memory/#locality-and-working-set)
- [ ] `mmap` — file-backed vs anonymous memory
- [ ] Stack vs heap — growth direction concept, guard pages (high level)
- [ ] Dynamic linking, shared libraries, PLT/GOT (conceptual)

### OS — scheduling & synchronization

- [ ] Preemption, time slices, context switch cost
- [ ] Mutexes, semaphores, condition variables, monitors
- [ ] Deadlock — four conditions, mitigation (ordering, timeout, detection)
- [ ] Livelock, starvation — definitions
- [ ] Readers-writers problem — interview variants

### OS — storage & filesystem

- [ ] Files vs file descriptors, `open`/`read`/`write`/`close` mental model
- [ ] Inodes, hard links vs symbolic links
- [ ] `fsync`, durability, write-ahead logging (bridge to databases)

### Computer architecture (short list)

- [ ] CPU pipeline concept, branch prediction (high level)
- [ ] Cache hierarchy L1/L2/L3 — locality, cache lines (see also [matrix + cache line story](../virtual-memory/#matrix-locality-tlb-cache))
- [ ] False sharing — two cores write different variables on same cache line
- [ ] Memory barriers — why atomics and lock-free talk about “ordering”

### Networking

- [ ] TCP vs UDP — reliability, ordering, use cases
- [ ] TCP handshake / teardown — states, why TIME_WAIT exists (sketch)
- [ ] Flow control vs congestion control — names and purpose
- [ ] DNS — hierarchy, TTL, CNAME vs A
- [ ] HTTP — methods, idempotency, safe methods, status codes
- [ ] HTTP/2 vs HTTP/1.1 — multiplexing, server push (awareness)
- [ ] TLS — certificates, chain of trust, what HTTPS gives you (high level)
- [ ] WebSockets vs HTTP long polling — when each fits
- [ ] NAT — why it exists; connection vs connectionless (conceptual)

### Databases & storage engines (interview breadth)

- [ ] Relational model, keys, joins, normalization (1NF–3NF at high level)
- [ ] Indexes — B-tree/B+tree intuition, clustered vs non-clustered
- [ ] Transactions — ACID; isolation levels (read committed, repeatable read, serializable)
- [ ] Locks vs MVCC — snapshot isolation story
- [ ] N+1 query problem, eager loading
- [ ] Write-ahead log (WAL), crash recovery sketch
- [ ] Replication — primary/replica, async vs sync replication tradeoffs
- [ ] Sharding vs partitioning — why and pain points

### Distributed systems (concept checklist)

- [ ] Latency vs throughput, tail latency
- [ ] Timeouts, retries, exponential backoff, jitter
- [ ] Idempotency keys — duplicate requests
- [ ] Load balancing — layer 4 vs layer 7 (names)
- [ ] CAP theorem — relaxed interpretations in practice
- [ ] Linearizability vs eventual consistency (definitions)
- [ ] Leader election, consensus — Raft/Paxos “what problem they solve”
- [ ] Heartbeats, failure detection, split-brain (conceptual)
- [ ] Message queues — at-least-once vs at-most-once vs exactly-once (marketing vs reality)
- [ ] Rate limiting — token bucket vs leaky bucket (names + behavior)

### Data structures & algorithms (cross-language meta)

- [ ] Big-O, recurrences, amortized analysis — Master theorem (when asked)
- [ ] Arrays, linked lists, stacks, queues, deque — tradeoffs
- [ ] Hash tables — collisions, resizing, expected O(1)
- [ ] Binary search variants, lower_bound patterns
- [ ] Heaps / priority queues — `heapify`, `decrease-key` story
- [ ] Trees — BST, balanced trees (AVL/red-black at “exists + why” level), tries
- [ ] Graphs — BFS/DFS, weighted shortest path (Dijkstra), Bellman-Ford awareness, topological sort
- [ ] Union-find — path compression, union by rank
- [ ] Sorting — stability, `O(n log n)` lower bound for comparison sorts
- [ ] Bit tricks — XOR swap idea, subset masks (interviews)
- [ ] Bloom filters — false positives only, use cases
- [ ] Consistent hashing — why large distributed caches use it

### Security basics (systems-facing)

- [ ] Same-origin policy, CSRF, XSS — what they are mitigations names
- [ ] SQL injection — parameterized queries
- [ ] AuthN vs AuthZ
- [ ] Symmetric vs asymmetric crypto — TLS uses both (hand-wavy OK)
- [ ] Hashing for passwords — why not plain SHA-256 alone

### Tooling & practical systems

- [ ] Git — commits, branches, merge vs rebase (when to use which carefully)
- [ ] `git bisect` — debugging regressions (mention)
- [ ] Docker — images vs containers, layers, cgroups/namespaces (one sentence each)
- [ ] Make vs CMake vs language-native build (awareness for C++)

---

## How to turn a line into a topic page

1. Create `reference-site/topics/<slug>/index.md` (problem → mechanics → practice → **interview Q&A**).
2. Add the page to `.vitepress/config.ts` and to the relevant **hub** (`python/`, `javascript/`, `cpp/`) or cross-language section.
3. Flip this syllabus line from `[ ]` to `[x]` and link to the new page.

When a section grows huge, split into sub-pages but keep this file as the **index of indices** (link out to “Python concurrency”, “C++ memory model”, etc.).
