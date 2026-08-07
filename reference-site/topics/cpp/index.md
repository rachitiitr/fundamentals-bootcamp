---
title: C++ hub
---

# C++

Master backlog: [**Interview syllabus (master list)**](../interview-syllabus/) — C++ section.

Use this hub for **C++-only** notes (RAII, move semantics, STL implementation angles) and pointers into your future `learnings/cpp/lessons/` track.

## Topics

- [RAII, ownership & smart pointers — deterministic cleanup, `unique_ptr`, shared control blocks, cycles](../cpp-raii-smart-pointers/)
- [Virtual tables (vtables) — dynamic dispatch, C analog, interview Q&A](../cpp-vtables/)
- [Struct layout, padding & alignment — `sizeof`, `alignof`, reordering, interview Q&A](../cpp-struct-layout/)
- [Dynamic dispatch & object models](../dynamic-dispatch-and-object-model/) — vtables vs Python MRO vs JS prototypes (cross-language)

**Ctor lists vs member declaration order:** [construction cheat sheet (cross-language)](../dynamic-dispatch-and-object-model/#construction-cheat-sheet--three-languages)

## Ideas for dedicated pages

- `std::multiset` / `std::multimap` when you need sorted duplicates
- iterators invalidation rules for `vector` vs `deque`
- coroutines (C++20) vs generators in other languages

Cross-language “what is a multiset-like structure?” lives on [Multiset & ordered duplicates](../multiset/).

## Lesson track

Add ordered modules under `learnings/cpp/lessons/` when you start that track.
