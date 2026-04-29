---
title: Iterators & generators
sidebar_order: 10
languages: [javascript, python, cpp]
---

# Iterators & generators

Short mental model: an **iterator** yields values one-at-a-time; a **generator** is syntax that builds iterators for you (`yield` / `function*`).

## JavaScript

- **Iterable** — object with `[Symbol.iterator]()`.
- **Iterator** — `{ next() -> { value, done } }`.
- **Generator** — `function*` + `yield`.
- **Async generator** — `async function*` + `yield`; consumed with `for await...of`.

Deep dive (event loop, WebSocket pull bridge): full lesson notes in the repo:

- [Lesson 1 notes — async generators](/lessons/javascript/01-async-generators/NOTES)

```js
function* countTo(n) {
  for (let i = 1; i <= n; i++) yield i;
}
for (const x of countTo(3)) console.log(x);
```

## Python

- **Iterator** — object with `__next__`; iterables implement `__iter__`.
- **Generator** — function containing `yield`; returns a generator iterator.

```python
def count_to(n: int):
    for i in range(1, n + 1):
        yield i

for x in count_to(3):
    print(x)
```

## C++

- **Input iterators** and ranges drive `for (auto x : container)`.
- **Coroutines** (C++20) can model generator-like control flow; unlike JS/Python there is no single `yield` keyword story in “classic” pre-coroutine C++.

```cpp
#include <vector>
#include <iostream>

int main() {
  std::vector<int> v{1, 2, 3};
  for (int x : v) std::cout << x << '\n';
}
```

## Interview angle

Be ready to implement **merge k sorted lists** style patterns — same iterator head-pull idea across languages, different heap APIs.
