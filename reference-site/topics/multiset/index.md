---
title: Multiset & ordered duplicates
sidebar_order: 20
languages: [cpp, python, javascript]
leetcode:
  - url: https://leetcode.com/problems/contains-duplicate-iii/
    name: Contains Duplicate III (220)
---

# Multiset & ordered duplicates

A **multiset** keeps sorted elements and allows duplicates. Classic use: sliding window where you care about **order** and **frequency**, not just min/max.

## Practice link

- [LeetCode 220 — Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/) — hard; window size `k`, value gap at most `t`; multiset / balanced-tree / bucket approaches.

## C++

`std::multiset` is the interview default when you need **sorted** multiset semantics.

```cpp
#include <set>
std::multiset<int> ms;
ms.insert(1);
ms.insert(1); // two 1s
auto it = ms.lower_bound(x); // binary search on sorted order
```

## Python

There is **no** multiset in the stdlib. Common substitutes:

- `sortedlist` from **sortedcontainers** (if allowed in contest / env).
- `heapq` for min-heap patterns (not a full multiset).
- `collections.Counter` when you only need counts, not global sorted order.

```python
from collections import Counter
c = Counter([1, 1, 2])
```

## JavaScript

No multiset in the language. Typical patterns:

- **Sorted map** libraries or **two heaps** for streaming median-style problems.
- For LC-style interviews, mirror the Python constraint: use what the platform allows (often a `TreeMap`-like structure from a helper lib, or reframe to a heap / bucket solution).

```js
// No stdlib multiset — often use Map for counts + separate structure for order
const counts = new Map();
function add(x) {
  counts.set(x, (counts.get(x) ?? 0) + 1);
}
```

## Language caveats (keep honest)

| Language   | Multiset in stdlib? |
|------------|---------------------|
| C++        | Yes — `std::multiset` |
| Python     | No — third-party or different algorithm |
| JavaScript | No — roll your own or use a library |
