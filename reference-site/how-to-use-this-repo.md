# How to use this repo

There are **two** ways content is organized. They link to each other; neither replaces the other.

## 1. Lessons (depth, order matters)

Under `learnings/<language>/lessons/` you build **sequences** — e.g. async generators notes, then Web Worker exercises that assume you read those notes.

- Long explanations stay in lesson folders (for example `NOTES.md`).
- Runnable HTML/JS exercises stay next to those notes.

**Tip:** From a topic page on this site, deep-link to a lesson folder when you want “full lecture” detail.

## 2. Reference site (breadth, lookup)

This VitePress app under `reference-site/` is for **refresh by concept**:

- One page ≈ one main idea (multiset, iterators, `with` / context managers, …).
- Cross-language pages use **sections per language** and call out **stdlib gaps** (JavaScript has no `std::multiset`).
- Optional **LeetCode** (or other) links when a pattern shows up in interviews.

**Tip:** From `NOTES.md` in a lesson, add a line like: “See also: `reference-site/topics/iterators-and-generators`”.

## Running locally

```bash
cd reference-site
npm install
npm run dev
```

```bash
cd apps/shared-rpc-ticker
npm install
npm run dev
```

The handbook defaults to **port 5180** (see `reference-site/.vitepress/config.ts`) so it does not collide with the v0 ticker on **5173**. Lesson **Markdown** is part of the site at **`/lessons/javascript/...`** (with sidebar). **`/learnings/...`** is only for **worker HTML/JS** on the same dev/preview process — if you open `http://localhost:5173/learnings/...` while the ticker is on 5173, you will get 404. When the dev server starts, check the **`[learnings]`** log lines for the correct port.

Worker exercises need HTTP (not `file://`). With the reference dev server running, open them under **`/learnings/...`** on **that** host and port (e.g. `…/learnings/javascript/lessons/02-workers/01-hello/index.html`), or keep using `learnings/javascript/lessons/02-workers/serve.sh` on port 8080 if you prefer.

## Conventions for new topic pages

See [reference-site README](./README.md) for frontmatter and a copy-paste template for comparison pages.
