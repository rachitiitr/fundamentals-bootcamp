# Agent instructions — adding lessons under `learnings/`

Read this **before** creating or editing anything in `learnings/`. For written *reference topics*
(`reference-site/topics/`) see the root [`AGENTS.md`](../AGENTS.md) instead; for file layout and
frontmatter see [`reference-site/README.md`](../reference-site/README.md).

---

## 1. The rule that breaks most often: links and the base path

The site is a **GitHub project page**, so everything is namespaced:

```text
https://rachitiitr.github.io/fundamentals-bootcamp/...
                             └──── base ────┘
```

`base: '/fundamentals-bootcamp/'` is set in
[`reference-site/.vitepress/config.ts`](../reference-site/.vitepress/config.ts).

**Never use `../` chains to reach outside a lesson folder.** They are computed against the *published
URL*, not the repo layout, and the two have different depths. A link written for the repo silently
walks past the base and 404s:

```text
page:  /fundamentals-bootcamp/lessons/javascript/01-async-generators/NOTES
link:  ../../../../apps/shared-rpc-ticker/src/data/binanceTradeStream.ts

  ..→ /fundamentals-bootcamp/lessons/javascript/
  ..→ /fundamentals-bootcamp/lessons/
  ..→ /fundamentals-bootcamp/          ← base
  ..→ /                                ← overshot!
  =  /apps/shared-rpc-ticker/...       ← 404 (no site at the domain root)
```

Use **site-absolute** paths instead. VitePress prepends the base automatically.

### 1a. …but only in files VitePress renders

This distinction matters and is easy to get wrong:

| File location | Rendered by | Link style to use |
|---|---|---|
| `learnings/<lang>/lessons/**/*.md` | **VitePress** (via the `reference-site/lessons/javascript` symlink) | **Site-absolute** — `/apps/...`, base added for you |
| Any other `learnings/**/*.md` (e.g. `learnings/javascript/README.md`) | `learnings-static-plugin.ts` middleware, plain markdown-it | **Relative** — base is *not* applied, so `/apps/...` would 404 |

If you are unsure which bucket a file is in: is it inside a `lessons/` directory? Then it is a
VitePress page.

---

## 2. URL cheat-sheet (for lesson `.md` pages)

Write the left-hand column; the base is added at build time.

| Linking to | Write |
|---|---|
| Another lesson page | `/lessons/javascript/<slug>/NOTES` |
| Worker exercise HTML | `/learnings/javascript/lessons/<slug>/<exercise>/index.html` |
| A source file in an app | `/apps/<app>/<path>/<file>.ts/` (**trailing slash**) |
| An app / directory listing | `/apps/<app>/` |
| A reference topic | `/topics/<slug>/` |
| Raw markdown | append `?raw=1` |

**Why the trailing slash on source files:** GitHub Pages picks `Content-Type` from the extension, so
a real `.ts` file would download instead of render. Each source file is published as a *directory*
containing `index.html` (highlighted view) and `raw.txt`. Omitting the slash still works — it just
costs a 301 redirect. See [`apps-source-plugin.ts`](../reference-site/.vitepress/apps-source-plugin.ts).

**Known trade-off:** site-absolute links resolve to `github.com/...` when the same file is read in
GitHub's repo view. The site is the primary reading surface, so it wins. Do not "fix" this by
reintroducing `../` chains.

---

## 3. Where lesson files go

```text
learnings/<lang>/lessons/<NN-slug>/
├── NOTES.md              # concept write-up  → /lessons/<lang>/<NN-slug>/NOTES
├── README.md             # exercise index    → /lessons/<lang>/<NN-slug>/README
└── <NN-exercise>/        # runnable exercise
    ├── index.html        #  → /learnings/<lang>/lessons/<NN-slug>/<NN-exercise>/index.html
    └── *.js
```

- **Zero-pad the numeric prefix** (`01-`, `02-`) — ordering is alphabetical.
- `reference-site/lessons/javascript` is a **symlink** to `learnings/javascript/lessons`. Only
  JavaScript is wired up today; a new language track needs its own symlink *and* a sidebar builder
  alongside [`lesson-sidebar.ts`](../reference-site/.vitepress/lesson-sidebar.ts).

---

## 4. Sidebar registration is automatic

Do **not** hand-edit the sidebar for a new lesson.
[`buildJavascriptLessonSidebar()`](../reference-site/.vitepress/lesson-sidebar.ts) scans the lessons
directory at build time and emits, per lesson folder:

1. `NOTES` — if `NOTES.md` exists
2. `README` — if `README.md` exists
3. one entry per subdirectory that contains an `index.html`

Consequences worth knowing:

- A lesson folder with **no** `NOTES.md`/`README.md` and no exercise `index.html` renders as an
  empty group.
- An exercise directory without `index.html` is **invisible** in the sidebar.
- Groups are collapsed by default except `02-workers` (hard-coded in `lesson-sidebar.ts`).

Only edit `config.ts` when adding a **top-level nav or "Start here"** entry, not per lesson.

---

## 5. Exercise HTML must be self-contained

Exercise pages are served as **real static files**, not VitePress routes — no bundler, no JSX, no
bare module specifiers. Use plain `.js` with relative imports and native browser APIs, matching
`02-workers/`. Worker scripts must be reachable at their own URL, so keep them beside `index.html`.

The theme forces a **full page load** for `/learnings/...` and `/apps/...` links via
`STATIC_SEGMENTS` in [`theme/index.ts`](../reference-site/.vitepress/theme/index.ts); without that
the SPA router would intercept them and 404. If you add another static-file prefix, add it there too.

---

## 6. Verify before you finish

```bash
npm run build:reference          # from repo root
```

Then audit for links that escape the base — **both greps must print nothing**:

```bash
cd reference-site/.vitepress/dist
grep -rhoE 'href="/[^"]*"' --include=*.html . | sed 's/href="//; s/"$//' \
  | grep -v '^/fundamentals-bootcamp' | grep -v '^//' | sort -u
grep -rhoE 'href="\.\./[^"]*"' --include=*.html . | sort -u
```

`ignoreDeadLinks: true` is set, so **a broken link will not fail the build** — the greps above are
your only safety net.

To exercise the real GitHub Pages behaviour (directory indexes, 301s) rather than the dev
middleware, serve the built output statically:

```bash
cd reference-site/.vitepress/dist && python3 -m http.server 8899
```

---

## 7. Housekeeping

- Add a **"See also"** link from a new lesson to the related `reference-site/topics/<slug>/` page,
  and back — see [`how-to-use-this-repo.md`](../reference-site/how-to-use-this-repo.md).
- Append a `sessions[]` entry to
  [`coordination/agent-prep-state.json`](../coordination/agent-prep-state.json).
- Files under `apps/` are published automatically on the next push; no config change is needed when
  you add an app or a source file.
