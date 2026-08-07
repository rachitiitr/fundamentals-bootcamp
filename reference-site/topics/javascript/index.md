---
title: JavaScript hub
---

# JavaScript

Master backlog: [**Interview syllabus (master list)**](../interview-syllabus/) — JavaScript & TypeScript sections.

Language-specific topics and links to the main lesson track.

## Lesson track

- [Async generators — full notes](/lessons/javascript/01-async-generators/NOTES) (VitePress page — sidebar stays)
- [Web Workers exercises](/lessons/javascript/02-workers/README)
- v0 app — clone repo and run `apps/shared-rpc-ticker` (not mounted on this site)

Cross-language:

- [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/) — prototypes, `class` / `extends`, `super`, `this`, `static`, prototype vs arrow-method `this` & desugar sketch vs Python/C++

**Construction & defaults:** [construction cheat sheet (cross-language)](../dynamic-dispatch-and-object-model/#construction-cheat-sheet--three-languages)

## Interview refresh

- [**Closures, lexical scope & hoisting**](../javascript-closures-scope/) — execution and lexical environments, scope-chain lookup, `var` / function / `let` / `const`, precise TDZ semantics, loop callbacks, lifetime, React stale closures, tracing drills
- [**`this` binding**](../javascript-this-binding/) — default / implicit / explicit (`call`/`apply`/`bind`) / `new`, precedence, lexical arrows, prototype receivers, interview Q&A
- [**Object APIs, descriptors, `Proxy`, cloning**](../javascript-objects-interview/) — static `Object.*` helpers (`assign`, `keys` / `for...in`), `Object.create`, `defineProperty`, `freeze` / `seal`, `Reflect`/`receiver`, `structuredClone` vs JSON, interview Q&A
- [**Event loop, microtasks & real-time UIs**](../browser-event-loop/) — task vs microtask, render step, `requestAnimationFrame`, React 18 batching, layout thrash, coalescing high-frequency ticks (HRT-style price grid), interview Q&A
- [**Promises and `async` / `await`**](../javascript-promises-async-await/) — settlement and assimilation, chaining, `await` continuations, combinators, floating errors, fail-fast vs cancellation, `AbortController`, interview traces
- [**Frame pipeline — `rAF`, `rIC` & `useLayoutEffect`**](../browser-frame-pipeline/) — where each scheduling API lives in the per-frame pipeline, flicker-free measurement, idle background work, decision tree, interview Q&A

## React (library patterns)

- [**`cloneElement` — prop injection, tabs, wrap vs clone**](../react-clone-element/) — `Children` / `isValidElement`, shallow merge, refs, when to prefer context or render props

## Frontend security (4-beat series)

Senior / staff-level security topics for FE loops — problem-first tutorials with attack traces, Mermaid diagrams, and a Q&A section per page.

- [**Series hub**](../frontend-security/) — threat model, the 3 trust boundaries, how the beats connect.
- [**Beat 1 — XSS & injection**](../frontend-security-xss/) — reflected / stored / DOM / mutation, React-specific traps (`dangerouslySetInnerHTML`, `javascript:` URLs, SSR JSON injection), DOMPurify, Trusted Types.
- [**Beat 2 — Cross-origin attacks**](../frontend-security-cross-origin/) — same-origin policy, CORS preflight, CSRF + `SameSite`, clickjacking + `frame-ancestors`, `postMessage` abuse.
- [**Beat 3+4 — Auth, sessions, security headers & supply chain**](../frontend-security-auth-and-headers/) — cookies vs `localStorage`, JWT pitfalls, OAuth + PKCE, CSP / HSTS / COOP-COEP, SRI, npm hygiene, prototype pollution.

## Good candidates for JS-only pages

- Module graphs, ESM vs CJS
- `Symbol.iterator` / async iterators in the browser

Add a new `.md` file under `topics/` and link it from this hub (and from `.vitepress/config.ts` when it should appear in the sidebar).
