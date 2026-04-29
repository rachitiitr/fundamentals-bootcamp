# Parallel agent prep — plan & rituals

This document pairs with **`agent-prep-state.json`**. Multiple Cursor chats (or other agents) should **read both first**, then claim work in JSON so sessions stay parallel-safe and tutorials stay consistent.

## Goal

- **Interview target:** Python, React, TypeScript, system design, data structures, plus this repo’s **workers / real-time** spine (SharedWorker, WebSocket fan-out, low-latency UI patterns, etc.) — typical of **quant / trading-platform** and similar frontend+systems loops.
- **Repo goal:** After each chat, turn the conversation into **one durable artifact**: a new or materially improved tutorial (prefer `reference-site/topics/<slug>/index.md`) or an ordered lesson under `learnings/`, not a pile of low-signal markdown.

**Master backlog of concepts** (not execution state): [reference-site/topics/interview-syllabus/](../reference-site/topics/interview-syllabus/index.md).

## Workstreams (assign one primary per chat)

| ID          | Focus                                                     | Typical outputs                                             | Touch paths (prefer these)                                                                       |
| ----------- | --------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `dsa`       | LeetCode patterns beyond LC75; complexity; “why this DS”  | Problem walkthroughs, links in topic pages                  | `reference-site/topics/*`, small code in `learnings/python/exercises` if needed                  |
| `py`        | Python internals, stdlib, asyncio, GIL, testing story     | `reference-site/topics/python-*`                            | `reference-site/topics/`, `learnings/python/`                                                    |
| `react-ts`  | Hooks, reconciliation, TS generics, DOM/event loop        | `reference-site/topics/javascript-*` or new `topics/ts-*`   | `reference-site/topics/`, `apps/shared-rpc-ticker/` for demos                                    |
| `sysdesign` | Stock/notification style; distributed primitives; numbers | Design notes + **interview Q&A** section on topic pages     | `reference-site/topics/` (new slugs like `system-design-notifications`)                          |
| `workers`   | SharedWorker, dedicated Worker, RPC, multi-tab            | Lessons + exercises                                         | `learnings/javascript/lessons/`, `apps/shared-rpc-ticker/`, `reference-site/topics/javascript/` |
| `meta`      | Syllabus index, hub pages, VitePress nav, quality passes  | Update interview-syllabus checkboxes, hub links             | `reference-site/.vitepress/config.ts`, `reference-site/topics/interview-syllabus/`               |

**Parallelism rule:** One chat should set **`items[].status`** to **`in_progress`** for at most **one** item `id` in a workstream at a time, and should **not** edit the same **target file paths** as another active session. If two chats need the same file, **sequence** them or split scope (e.g. one chat = outline + Q&A, next = code blocks + Mermaid).

**Claim protocol:** At chat start, append to **`activeClaims`**: `{ "itemId": "<id>", "sessionLabel": "<short name>", "claimedAt": "<ISO8601 UTC>" }`. Remove your object when the session ends (success or handoff).

## End-of-chat ritual (every agent)

1. **Summarize** in 3–6 bullets what was decided or taught (facts, tradeoffs, pitfalls).
2. **Write or rewrite** the smallest set of files that captures that (prefer one topic page or one lesson folder).
3. **Quality bar** (avoid “markdown spam”):
   - Problem-first: what interviewers ask → mechanics → short traced example → **Interview Q&A** (concrete questions + crisp answers).
   - Prefer several **small** examples over one vague section ([how-to-use-this-repo](../reference-site/how-to-use-this-repo.md), [reference-site README](../reference-site/README.md)).
4. **Update the syllabus** when a page exists: flip `[ ]` → `[x]` and link in `reference-site/topics/interview-syllabus/index.md`.
5. **Update `agent-prep-state.json`** (see below) in the **same PR/commit** as content when possible.

## How to update `agent-prep-state.json`

- Bump **`updatedAt`** to ISO-8601 UTC when you finish edits.
- **`sessions`:** Append **one** object per chat close (never delete old sessions; truncate `summary` if huge).
- **`items`:** For each work item you touched:
  - Set **`status`** to `done` if the tutorial + syllabus link (if applicable) is merged-quality; `in_progress` while active; `blocked` with **`notes`** if waiting on human.
  - Set **`lastSessionId`** to the session you appended.
  - Fill **`artifactPaths`** with real repo paths you created/changed.
- **`activeClaims`:** Clear your claim when done. Only one session should claim a given **`itemId`** at a time.

If two agents must merge JSON: **re-read the file**, append your session, apply your item updates, avoid clobbering others’ `artifactPaths` (merge arrays).

## Suggested chat prompts (copy-paste)

- “Read `coordination/agent-prep-state.json` and `coordination/PARALLEL_PREP_PLAN.md`. Claim item `<id>`. Produce topic page + syllabus link; then update JSON session log.”
- “Same as above but **only** improve `<path>` to meet the concrete-examples rule; one session log entry.”

## Relationship to LeetCode 75

You already did ~40–50 problems (LC75-style). Use **`dsa`** workstream for **gaps**: heap patterns, graph templates, binary search on answer, interval merging, union-find — each as a **short topic page** with 1–2 LC links, not a dump of solutions.

## Appendix — JSON shapes (copy-paste when extending)

**`sessions[]` entry** (append one per chat close):

```json
{
  "id": "sess-2026-04-29-example",
  "endedAt": "2026-04-29T12:34:56Z",
  "workstreamId": "py",
  "itemIdsTouched": ["py-asyncio-core"],
  "summary": "3–6 bullets worth of facts: what was taught, key tradeoffs, files changed.",
  "artifactPaths": [
    "reference-site/topics/python-asyncio/index.md",
    "reference-site/.vitepress/config.ts"
  ]
}
```

**`activeClaims[]` entry** (while a chat is open):

```json
{
  "itemId": "react-hooks-rendering",
  "sessionLabel": "cursor-chat-hooks-1",
  "claimedAt": "2026-04-29T10:00:00Z"
}
```

Add new **`items[]`** rows when you discover gaps; keep **`id`** kebab-case and stable so sessions can reference them.
