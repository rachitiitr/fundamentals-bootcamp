# Reference site (`reference-site/`)

VitePress-powered **topic index** for the prep-bootcamp monorepo: cross-language comparisons, language hubs, and optional LeetCode pointers. Hands-on lesson tracks stay under `learnings/`.

```bash
npm install
npm run dev      # local preview (port 5180 by default — see .vitepress/config.ts)
npm run build    # static output in .vitepress/dist
npm run preview  # serve built site
```

Lesson **Markdown** is mirrored into this package via [`lessons/javascript`](./lessons/javascript) (symlink → `../learnings/javascript/lessons`) so VitePress can render **`/lessons/javascript/...`** with the **normal sidebar**. **Worker HTML/JS** still lives under **`/learnings/javascript/lessons/...`** (middleware static).

## Content conventions

### When to add a page here vs under `learnings/`

| Use **reference-site** | Use **`learnings/<lang>/lessons`** |
|------------------------|-------------------------------------|
| Lookup by concept (multiset, iterators) | Ordered narrative + exercises |
| Parallel snippets across languages | One primary language / environment |
| Short “interview refresh” | Long `NOTES.md`, runnable HTML/JS, etc. |

**Concrete examples:** Use **worked numbers, short scenarios, or before/after** wherever they make the next step obvious — addressing and bit layouts, but also **protocols, faults, concurrency, and comparisons**. Multiple smaller examples across a long page are fine when each serves a different idea; avoid one thin example deep in the doc while other sections stay purely abstract.

### File location

- Put topic pages under [`topics/`](./topics/) — one folder per topic with `index.md`, or a single `topic-name.md` at the top level.
- The [**Interview syllabus (master list)**](./topics/interview-syllabus/) (`topics/interview-syllabus/index.md`) tracks Python, JS/TS, C++, and systems interview topics; check items off and link new pages as you add tutorials.
- Register topic pages in [`.vitepress/config.ts`](./.vitepress/config.ts) `themeConfig.sidebar` (under `/`) when they should appear in the default sidebar.
- **JavaScript lesson tree** under `/lessons/javascript/...` is generated in [`.vitepress/lesson-sidebar.ts`](./.vitepress/lesson-sidebar.ts) from the symlinked folder [`lessons/javascript/`](./lessons/javascript).

### Frontmatter (recommended)

Use YAML frontmatter at the top of each topic file. Only `title` is required for VitePress; the rest are **your** conventions for search, future automation, or filters.

```yaml
---
title: Multiset & ordered duplicates
sidebar_order: 20
languages: [cpp, python, javascript]
leetcode:
  - url: https://leetcode.com/problems/contains-duplicate-iii/
    name: Contains Duplicate III (220)
---
```

| Field | Purpose |
|-------|---------|
| `title` | Sidebar / `<title>` (can differ from first `#` heading). |
| `sidebar_order` | Optional: use when sorting sidebar items manually in config. |
| `languages` | Optional: which languages this page compares or applies to. |
| `leetcode` | Optional: list of `{ url, name }` practice problems. |

### Page body template — cross-language topic

1. **One sentence** — what the concept is (or **the problem** it solves — see repo-root [`AGENTS.md`](../AGENTS.md) for interview-oriented “problem first” pages).
2. **When to use** — 2–4 bullets.
3. **Practice** — link out to LeetCode / docs (HTTPS links are always fine).
4. **Per-language sections** — `### C++`, `### Python`, `### JavaScript` with fenced code blocks.
5. **Language caveats** — short table or bullets where stdlib lies (e.g. JS has no `multiset`).

For **interview prep** pages, add a closing **common interview questions** section and keep **Mermaid** + code where they clarify the idea (same as `AGENTS.md`).

### Page body template — language-only topic (e.g. Python)

Use the [Python hub](./topics/python/index.md) pattern: motivation, minimal example, “see also” cross-links to shared topics.

### Linking to lesson sources

- **Markdown (NOTES, README)** — link to **`/lessons/javascript/<lesson>/NOTES`** (or `README`). Same VitePress app: sidebar, search, and nav stay.
- **Worker exercises (`index.html`, `.js`)** — link to **`/learnings/javascript/lessons/<lesson>/<exercise>/index.html`** on the same dev/preview port. Those URLs use the [static middleware](./.vitepress/learnings-static-plugin.ts); `router.onBeforeRouteChange` in [`.vitepress/theme/index.ts`](./.vitepress/theme/index.ts) forces a **full page load** for `/learnings/...` so the dev server can answer.
- **Legacy `/learnings/javascript/lessons/.../*.md` URLs** — redirected with **302** to the matching `/lessons/javascript/...` page.
- **`?raw=1`** on other `/learnings/**/*.md` (if any) still returns raw `text/markdown`.
- **App sources (`/apps/**`)** — every file under the repo's `apps/` workspaces is browsable as syntax-highlighted HTML via [`apps-source-plugin.ts`](./.vitepress/apps-source-plugin.ts). Start at **`/apps/`** for a directory listing. Because GitHub Pages picks `Content-Type` from the extension (a `.ts` file would download, not render), each source file is emitted as a **directory** holding `index.html` (highlighted view) and `raw.txt` (plain text) — so `/apps/<app>/src/foo.ts` redirects to `/apps/<app>/src/foo.ts/` and renders. `node_modules`, `dist` and lockfiles are excluded; the dev middleware mirrors the static layout exactly.

Examples:

- [Async generators NOTES](/lessons/javascript/01-async-generators/NOTES)
- [Workers README](/lessons/javascript/02-workers/README)
- [Exercise 1 HTML](/learnings/javascript/lessons/02-workers/01-hello/index.html)

`ignoreDeadLinks` stays on for any legacy `../../../learnings/...` links in markdown.

### LeetCode link pattern

Prefer named links in prose plus the structured `leetcode` frontmatter list for anything you might want to index later:

```markdown
- [LeetCode 220 — Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/)
```

## Sidebar

- **Topics & home** — edit the `/` entry in [`config.ts`](./.vitepress/config.ts) `themeConfig.sidebar`.
- **JavaScript lessons** — auto-built from the repo tree in [`.vitepress/lesson-sidebar.ts`](./.vitepress/lesson-sidebar.ts) (shown whenever the path starts with `/lessons/`).
