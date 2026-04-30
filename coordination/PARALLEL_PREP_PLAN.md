# Parallel agent prep — plan & rituals

This document pairs with **`agent-prep-state.json`**. Multiple Cursor chats (or other agents) should **read both first**, then claim work in JSON so sessions stay parallel-safe and tutorials stay consistent.

## Cursor rules (repo root)

- **[`.cursor/rules/reference-topics.mdc`](../.cursor/rules/reference-topics.mdc)** — Shape of **VitePress** topic pages (`reference-site/topics/`): problem-first, Mermaid, interview Q&A, wiring.
- **[`.cursor/rules/interactive-teaching.mdc`](../.cursor/rules/interactive-teaching.mdc)** — **In-chat** teaching style (roadmap, one beat at a time, check-in questions). Pair with **[`AGENTS.md`](../AGENTS.md)** so agents know **written tutorials** vs **live explanations**.

Learn-only chats that update **rules** or **this coordination folder** should still append **`sessions[]`** in **`agent-prep-state.json`** (use **`topicsCovered`** + **`artifactPaths`**).

## Goal

- **Interview target:** Python, React, TypeScript, system design, data structures, plus this repo’s **workers / real-time** spine (SharedWorker, WebSocket fan-out, low-latency UI patterns, etc.) — typical of **quant / trading-platform** and similar frontend+systems loops.
- **Repo goal:** After each chat, turn the conversation into **one durable artifact**: a new or materially improved tutorial (prefer `reference-site/topics/<slug>/index.md`) or an ordered lesson under `learnings/`, not a pile of low-signal markdown.

**Master backlog of concepts** (not execution state): [reference-site/topics/interview-syllabus/](../reference-site/topics/interview-syllabus/index.md).

## Planned backlog vs what the user actually talks about

- **At chat start:** agents (or the human) can still **suggest a few `items[]`** from the backlog — good default throughput and clear scope.
- **During the chat:** the user may **pivot** (Q&A, digressions, “explain padding”). That is normal; **do not force** the conversation to match the pre-picked row.
- **At chat end:** the **`sessions[]` log should reflect reality**, not only the claimed item:
  - Use **`topicsCovered`** (optional string list): short labels for **everything materially discussed** (e.g. `os: demand paging`, `cpp: struct padding`), even when **no** `itemIdsTouched` or when docs were never written.
  - Use **`artifactPaths`** for files that **actually changed**; leave empty if the chat was learn-only.
- **Growing the backlog:** if the chat surfaces a **new gap** (topic worth a future page), **append a new `items[]` row** with a **stable kebab-case `id`**, `status: "backlog"` (or `"done"` if you shipped it in the same session), `syllabusHint`, and `targetArtifacts`. Later chats can **claim** that id like any other item.

The **interview-syllabus** checklist remains the long-lived concept map; **`items[]`** is allowed to **grow** as you discover gaps — not frozen to the first brainstorm.

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
2. **Write or rewrite** the smallest set of files that captures that (prefer one topic page or one lesson folder), *when* something should land in-repo — skip if the chat was purely learning with no durable artifact.
3. **Quality bar** (avoid “markdown spam”):
   - Problem-first: what interviewers ask → mechanics → short traced example → **Interview Q&A** (concrete questions + crisp answers).
   - Prefer several **small** examples over one vague section ([how-to-use-this-repo](../reference-site/how-to-use-this-repo.md), [reference-site README](../reference-site/README.md)).
4. **Update the syllabus** when a page exists: flip `[ ]` → `[x]` and link in `reference-site/topics/interview-syllabus/index.md`.
5. **Update `agent-prep-state.json`** (see below) in the **same PR/commit** as content when possible — including **`topicsCovered`** on the session so the next chat sees **what was discussed**, not only which backlog row was claimed.
6. **New gaps:** if the chat uncovered a topic worth tracking, **add `items[]`** (and optionally a syllabus line later when a page exists).

## How to update `agent-prep-state.json`

- Bump **`updatedAt`** to ISO-8601 UTC when you finish edits.
- **`sessions`:** Append **one** object per chat close (never delete old sessions; truncate `summary` if huge). Prefer optional **`topicsCovered`**: short strings (topic area + hook), so **emergent** threads are visible even when **`itemIdsTouched`** is empty or differs from what you first suggested.
- **`items`:** For each work item you touched:
  - Set **`status`** to `done` if the tutorial + syllabus link (if applicable) is merged-quality; `in_progress` while active; `blocked` with **`notes`** if waiting on human.
  - Set **`lastSessionId`** to the session you appended.
  - Fill **`artifactPaths`** with real repo paths you created/changed.
- **`activeClaims`:** Clear your claim when done. Only one session should claim a given **`itemId`** at a time.

If two agents must merge JSON: **re-read the file**, append your session, apply your item updates, avoid clobbering others’ `artifactPaths` (merge arrays).

## Suggested chat prompts (copy-paste)

- “Read `coordination/agent-prep-state.json` and `coordination/PARALLEL_PREP_PLAN.md`. Claim item `<id>`. Produce topic page + syllabus link; then update JSON session log.”
- “Same as above but **only** improve `<path>` to meet the concrete-examples rule; one session log entry.”
- “We pivoted mid-chat — log **`topicsCovered`** on the session and **add `items[]`** for any new follow-up worth a future page.”

### Ad-hoc chats (no `items[]` row)

If the chat did **not** claim an `itemId` (e.g. Q&A only, then docs landed anyway), still **append one `sessions[]` object**: set **`itemIdsTouched`** to **`[]`** when nothing in **`items[]`** was the planned unit of work, set **`topicsCovered`** to what was actually discussed, write **`summary`** + **`artifactPaths`** (empty if no file edits), bump **`updatedAt`**. Future chats then see what shipped **and** what was taught, without a false **`items[].status`** change.

## Relationship to LeetCode 75

You already did ~40–50 problems (LC75-style). Use **`dsa`** workstream for **gaps**: heap patterns, graph templates, binary search on answer, interval merging, union-find — each as a **short topic page** with 1–2 LC links, not a dump of solutions.

## Appendix — JSON shapes (copy-paste when extending)

**`schemaVersion`:** `2` adds optional **`topicsCovered`** on each **`sessions[]`** entry (see [planned backlog vs emergent](#planned-backlog-vs-what-the-user-actually-talks-about) above). Older files may omit the field.

**`sessions[]` entry** (append one per chat close):

```json
{
  "id": "sess-2026-04-29-example",
  "endedAt": "2026-04-29T12:34:56Z",
  "workstreamId": "py",
  "itemIdsTouched": ["py-asyncio-core"],
  "topicsCovered": ["python: asyncio tasks vs threads", "python: cancellation edges"],
  "summary": "3–6 bullets worth of facts: what was taught, key tradeoffs, files changed.",
  "artifactPaths": [
    "reference-site/topics/python-asyncio/index.md",
    "reference-site/.vitepress/config.ts"
  ]
}
```

**`topicsCovered`:** optional; use when the chat **was not** fully described by `itemIdsTouched`, or when there was **no** claimed item. Labels can match syllabus themes, repo slugs, or freeform (“`os`: TLB shootdown — follow up”).

**`activeClaims[]` entry** (while a chat is open):

```json
{
  "itemId": "react-hooks-rendering",
  "sessionLabel": "cursor-chat-hooks-1",
  "claimedAt": "2026-04-29T10:00:00Z"
}
```

Add new **`items[]`** rows when you discover gaps; keep **`id`** kebab-case and stable so sessions can reference them.
