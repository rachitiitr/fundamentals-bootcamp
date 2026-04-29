# Prep Bootcamp

A hands-on bootcamp for learning the foundational concepts behind a
SharedWorker-based RPC framework — inspired by public engineering
write-ups on browser-side worker RPC, but rebuilt from scratch with neutral naming.

This repo is a small **monorepo**: per-language learnings, the v0 demo app, and a **static reference site** for cross-language notes (see [`learnings/`](./learnings/README.md) and [`reference-site/`](./reference-site/README.md)).

## Repo layout

| Area               | Path                                                                               | Purpose                                                  |
| ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| JavaScript lessons | [`learnings/javascript/lessons/`](./learnings/javascript/lessons/)                 | Ordered modules (async generators, Web Workers, …)       |
| Python / C++       | [`learnings/python/`](./learnings/python/), [`learnings/cpp/`](./learnings/cpp/) | Placeholder trees for future tracks                      |
| v0 app             | [`apps/shared-rpc-ticker/`](./apps/shared-rpc-ticker/)                             | Async generators, `useAsyncGenerator`, WebSocket per tab |
| Quick reference    | [`reference-site/`](./reference-site/)                                             | VitePress site: topics, comparisons, LeetCode links      |

## Lessons (JavaScript track)

| #         | Folder                                                 | What you learn                                                                                            |
| --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **v0** ✅ | [`apps/shared-rpc-ticker`](./apps/shared-rpc-ticker)   | Async generators, `useAsyncGenerator` React hook, direct WebSocket per component (the "before" picture) |
| v1 (next) | _coming_                                               | Move WS into a dedicated `Worker`. Manual `postMessage` proto-RPC.                                        |
| v2        | _coming_                                               | Switch to `SharedWorker`. Multi-tab dedup. `onconnect`, `MessagePort`.                                    |
| v3        | _coming_                                               | Generalized message protocol. UUIDs, conversations, multiplexing.                                         |
| v4        | _coming_                                               | Cancel + error propagation. Robust state machine.                                                         |
| v5        | _coming_                                               | Base class + mixins (Connection / HostCall / ClientCall).                                                 |
| v6        | _coming_                                               | TypeScript experimental decorators (`@rpc` / `@remoteExecute`).                                           |
| v7        | _coming_                                               | Fallback when SharedWorker is unavailable. Host/Client duality.                                           |

Hands-on worker exercises: [`learnings/javascript/lessons/02-workers/`](./learnings/javascript/lessons/02-workers/README.md).

## Quickstart — from repo root (workspaces)

```bash
npm install
npm run dev:ticker      # v0 app → http://localhost:5173
npm run dev:reference   # reference handbook → http://localhost:5180 (see reference-site/.vitepress/config.ts)
```

Or run installs inside `apps/shared-rpc-ticker` or `reference-site` only if you are not using the root workspace.

## Quickstart — v0 app (standalone)

```bash
cd apps/shared-rpc-ticker
npm install
npm run dev   # http://localhost:5173
```

Then open the page in **two browser tabs**, open **DevTools → Network →
WS**, and count the WebSocket connections. That count is the problem
later lessons will solve.

## Quickstart — reference site (standalone)

```bash
cd reference-site
npm install
npm run dev
```

## Why this exists

Real-time dashboards (trading, monitoring, chat) commonly suffer from
the "N tabs × M widgets = N×M duplicate connections" problem. The fix is
elegant — a SharedWorker that hosts shared state and exposes a method-
call-like API to all tabs — but the implementation has surprising depth:
async generators, structured-clone serialization, decorators, mixins, and
careful lifecycle management.

This bootcamp builds that fix one tiny step at a time, each step
introducing exactly one new concept on top of a working app.

**See also:** [How to use this repo](./reference-site/how-to-use-this-repo.md) in the reference site for linking lessons ↔ topic pages.

## Interview prep & parallel agent chats

If you are using **multiple Cursor chats** to build tutorials without stepping on the same files, start from:

- **[coordination/PARALLEL_PREP_PLAN.md](./coordination/PARALLEL_PREP_PLAN.md)** — workstreams, end-of-chat ritual, how to merge JSON safely.
- **[coordination/agent-prep-state.json](./coordination/agent-prep-state.json)** — machine-readable backlog: claim items, log sessions, record `artifactPaths`.

The long-form concept backlog remains [`reference-site/topics/interview-syllabus/`](./reference-site/topics/interview-syllabus/index.md); the JSON tracks **execution** and **which chat touched what**.
