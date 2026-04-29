---
layout: home

hero:
  name: Prep Bootcamp
  text: Reference
  tagline: Quick refresh across JS, Python, and C++ — beside your hands-on lesson tracks.
  actions:
    - theme: brand
      text: How to use this repo
      link: /how-to-use-this-repo
    - theme: alt
      text: Iterators & generators
      link: /topics/iterators-and-generators/

features:
  - title: Lessons
    details: Ordered, runnable tracks live under learnings/javascript (and future python/cpp).
  - title: Topics
    details: Sidebar pages for concepts like multiset, iterators, or Python-only context managers.
  - title: Comparisons
    details: Parallel snippets and optional LeetCode links on one page — honest caveats per language.
---

## Where things live

| What | Repo path |
|------|-----------|
| JS lesson modules | `learnings/javascript/lessons/` |
| v0 SharedWorker bootcamp app | `apps/shared-rpc-ticker/` |
| This site (source) | `reference-site/` |

Use the **sidebar** for topic-based navigation. Add new pages under `topics/` and register them in `.vitepress/config.ts`.
