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

## The pattern (why multiset)

For a **sliding window** of values you need to:

1. **Insert** a new value (duplicates allowed).
2. **Remove one copy** of the value that left the window (not “remove all”).
3. Sometimes **query sorted order**: e.g. “is there some `v` in the window with `|v - x| ≤ t`?” — that is `lower_bound(x - t)` then check `*it ≤ x + t`.

`Counter` / `Map` counts alone do not give (2) + (3) in one structure unless you pair them with something ordered.

## C++

`std::multiset` keeps elements sorted and allows duplicates. Use **`find` + `erase(iterator)`** to drop a single instance; `erase(value)` removes **all** copies of that value.

```cpp
#include <set>

// Add one copy
void add(std::multiset<long long>& ms, long long x) { ms.insert(x); }

// Remove ONE copy of x (call when x leaves the window)
void removeOne(std::multiset<long long>& ms, long long x) {
  auto it = ms.find(x);
  if (it != ms.end()) ms.erase(it);
}

// LeetCode 220-style: any v in ms with |v - x| <= t ?
bool hasCloseValue(const std::multiset<long long>& ms, long long x, long long t) {
  auto it = ms.lower_bound(x - t);
  return it != ms.end() && *it <= x + t;
}

// Example: two 1s, binary search on sorted order
std::multiset<int> ms;
ms.insert(1);
ms.insert(1);
auto it = ms.lower_bound(1);  // points at first 1
// Iterate in sorted order (duplicates appear in insertion order among equals)
for (int v : ms) { /* ... */ }
```

## Python

There is **no** multiset in the stdlib. For **sorted multiset** semantics in interviews / contests, **`SortedList`** from [sortedcontainers](https://grantjenks.com/docs/sortedcontainers/) is the usual choice when the environment allows it.

```python
from sortedcontainers import SortedList

def add(sl: SortedList, x: int) -> None:
    sl.add(x)

def remove_one(sl: SortedList, x: int) -> None:
    sl.remove(x)  # one copy; raises if missing — guard in real solutions

def has_close_value(sl: SortedList, x: int, t: int) -> bool:
    i = sl.bisect_left(x - t)
    return i < len(sl) and sl[i] <= x + t
```

**Stdlib-only:** you can keep a sorted `list` and use `bisect.insort` / `bisect_left` + `pop` — correct but **O(n)** per update because of list shifts. Fine for tiny windows or explanations; prefer `SortedList` or a different algorithm (e.g. buckets) when `n` or `k` is large.

`collections.Counter` is for **counts without sorted order** — good when you only need frequencies, not “nearest neighbor” in sorted value space:

```python
from collections import Counter
c = Counter([1, 1, 2])
c[1] -= 1  # one fewer copy of 1
```

## JavaScript

No multiset in the language. A common interview approach is a **sorted array** plus **binary search** for insert and remove-one (same logical API as `SortedList` / `multiset`).

```js
/** @param {number[]} arr sorted ascending */
function bisectLeft(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function multisetAdd(arr, x) {
  arr.splice(bisectLeft(arr, x), 0, x);
}

/** Remove one copy of x (assumes x is in arr at least once). */
function multisetRemoveOne(arr, x) {
  const i = bisectLeft(arr, x);
  if (i < arr.length && arr[i] === x) arr.splice(i, 1);
}

/** |v - x| <= t for some v in sorted arr? */
function hasCloseValue(arr, x, t) {
  const i = bisectLeft(arr, x - t);
  return i < arr.length && arr[i] <= x + t;
}
```

For **median** or **only min/max** in a window, other tools (two heaps, monotonic deque) can be better; use a multiset-like structure when you need **sorted duplicates** and **neighbor / range** queries on values.

## Language caveats (keep honest)

| Language   | Multiset in stdlib? |
|------------|---------------------|
| C++        | Yes — `std::multiset` |
| Python     | No — third-party or different algorithm |
| JavaScript | No — roll your own or use a library |
