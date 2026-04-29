# Reference site (`reference-site/`)

VitePress-powered **topic index** for the prep-bootcamp monorepo: cross-language comparisons, language hubs, and optional LeetCode pointers. Hands-on lesson tracks stay under `learnings/`.

## Commands

```bash
npm install
npm run dev      # local preview
npm run build    # static output in .vitepress/dist
npm run preview  # serve built site
```

## Content conventions

### When to add a page here vs under `learnings/`

| Use **reference-site** | Use **`learnings/<lang>/lessons`** |
|------------------------|-------------------------------------|
| Lookup by concept (multiset, iterators) | Ordered narrative + exercises |
| Parallel snippets across languages | One primary language / environment |
| Short “interview refresh” | Long `NOTES.md`, runnable HTML/JS, etc. |

### File location

- Put topic pages under [`topics/`](./topics/) — one folder per topic with `index.md`, or a single `topic-name.md` at the top level.
- Register every page in [`.vitepress/config.ts`](./.vitepress/config.ts) `themeConfig.sidebar` (or it will not appear in the sidebar).

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

1. **One sentence** — what the concept is.
2. **When to use** — 2–4 bullets.
3. **Practice** — link out to LeetCode / docs (HTTPS links are always fine).
4. **Per-language sections** — `### C++`, `### Python`, `### JavaScript` with fenced code blocks.
5. **Language caveats** — short table or bullets where stdlib lies (e.g. JS has no `multiset`).

### Page body template — language-only topic (e.g. Python)

Use the [Python hub](./topics/python/index.md) pattern: motivation, minimal example, “see also” cross-links to shared topics.

### Linking to lesson sources

Markdown links that point **outside** `reference-site/` (for example into `learnings/` or `apps/`) are **not** VitePress routes. Options:

- Use **backticks** for repo paths so readers jump from the IDE: `` `learnings/javascript/lessons/02-workers/README.md` ``.
- Or keep markdown links for convenience in the GitHub file view; the site sets `ignoreDeadLinks: true` in [`.vitepress/config.ts`](./.vitepress/config.ts) so builds do not fail on those paths.

### LeetCode link pattern

Prefer named links in prose plus the structured `leetcode` frontmatter list for anything you might want to index later:

```markdown
- [LeetCode 220 — Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/)
```

## Sidebar

Configured explicitly in [`.vitepress/config.ts`](./.vitepress/config.ts). When you add a topic folder, append an entry under **Cross-language topics** or the appropriate **Language hub** child list.
