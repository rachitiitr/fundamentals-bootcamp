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

- [**`this` binding**](../javascript-this-binding/) — default / implicit / explicit (`call`/`apply`/`bind`) / `new`, precedence, lexical arrows, prototype receivers, interview Q&A
- [**Object APIs, descriptors, `Proxy`, cloning**](../javascript-objects-interview/) — static `Object.*` helpers (`assign`, `keys` / `for...in`), `Object.create`, `defineProperty`, `freeze` / `seal`, `Reflect`/`receiver`, `structuredClone` vs JSON, interview Q&A

## Good candidates for JS-only pages

- Module graphs, ESM vs CJS
- Event loop microtasks vs macrotasks
- `Symbol.iterator` / async iterators in the browser

Add a new `.md` file under `topics/` and link it from this hub (and from `.vitepress/config.ts` when it should appear in the sidebar).
