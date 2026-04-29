---
layout: home

hero:
  name: Prep Bootcamp
  text: Reference
  tagline: Quick refresh across JS, Python, and C++ — beside your hands-on lesson tracks.
  actions:
    - theme: brand
      text: Interview syllabus
      link: /topics/interview-syllabus/
    - theme: alt
      text: How to use this repo
      link: /how-to-use-this-repo
    - theme: alt
      text: Iterators & generators
      link: /topics/iterators-and-generators/

features:
  - title: Lessons
    details: Ordered, runnable tracks live under learnings/javascript (and future python/cpp).
  - title: Topics
    details: Sidebar pages for concepts like multiset, iterators, [virtual memory & paging](/topics/virtual-memory/), [C++ vtables](/topics/cpp-vtables/), or [Python `with` & context managers](/topics/python-context-managers/).
  - title: Comparisons
    details: Parallel snippets and optional LeetCode links on one page — honest caveats per language.
---

## Where things live

| What | Repo path |
|------|-----------|
| JS lesson modules | In-handbook tree: [`/lessons/javascript/…`](/lessons/javascript/02-workers/README); worker HTML still under [`/learnings/…`](/learnings/javascript/lessons/02-workers/01-hello/index.html) |
| v0 SharedWorker bootcamp app | `apps/shared-rpc-ticker/` |
| This site (source) | `reference-site/` |

Use the **sidebar** for topic-based navigation. The [**Interview syllabus (master list)**](/topics/interview-syllabus/) is the backlog of Python, JS/TS, C++, and systems topics to turn into tutorials. Add new pages under `topics/` and register them in `.vitepress/config.ts`.
