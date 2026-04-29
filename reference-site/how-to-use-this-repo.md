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

Worker exercises need HTTP (not `file://`); see `learnings/javascript/lessons/02-workers/serve.sh`.

## Conventions for new topic pages

See [reference-site README](./README.md) for frontmatter and a copy-paste template for comparison pages.
