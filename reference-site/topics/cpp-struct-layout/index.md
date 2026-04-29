---
title: C++ struct layout, padding & alignment
sidebar_order: 35
languages: [cpp]
---

# C++ struct layout, padding & alignment

You need this when **ABI boundaries** matter (FFI, network structs, on-disk layouts), when you **profile** unexpected memory blowups, or when an interviewer asks why **`sizeof`** is not “sum of member sizes.”

---

## Problem

The compiler lays out `struct` members so each field starts at an address **aligned for its type** and so the whole `struct` can be used in **arrays** without misalignment. That often inserts **padding bytes** you did not write in source.

**Pain:** bigger structs → more cache footprint; wrong assumptions about layout → **UB** if you violate type aliasing or `reinterpret_cast` recklessly.

---

## Mechanics

### Alignment

Each type `T` has **`alignof(T)`** (implementation-defined, but stable per platform/ABI). A **valid address** for a `T` object is a multiple of `alignof(T)`.

Typical 64-bit LP64-style intuition (not a guarantee on every embedded ABI):

| Type | Common `alignof` |
|------|------------------|
| `char` | 1 |
| `int` | 4 |
| `double` | 8 |
| pointer | 8 |

### Struct alignment and size

For `struct S`:

1. Each member starts at an offset **divisible by** `alignof(member type)`.
2. **`alignof(S)`** is usually the **max** of members’ alignments (unless overridden with `alignas`).
3. **`sizeof(S)`** is usually rounded up to a multiple of **`alignof(S)`** so that **`S a[2];`** packs without placing `a[1]` on an illegal address (**tail padding**).

### Padding

**Insertion padding** gaps appear **between** members to satisfy (1). **Tail padding** appears **after the last member** to satisfy (3).

---

## Small examples

### `char` then `int` (insertion padding)

```cpp
struct A {
  char c;  // offset 0
  int i;   // align 4 → starts at offset 4 → 3 bytes padding after c
};
// Typical LP64: sizeof(A) == 8
```

### `char` then `double` (more insertion padding)

```cpp
struct B {
  char c;
  double d; // align 8 → often starts at offset 8
};
// Typical: sizeof(B) == 16
```

### Tail padding after a smaller last member

```cpp
struct C {
  double d; // offset 0, size 8
  char c;   // offset 8, size 1
};
// alignof(C) often 8 → sizeof(C) often 16 (7 bytes tail padding)
```

### Reordering can shrink the struct

```cpp
struct Fat {
  char a;
  double x;
  char b;
  double y;
};

struct Slim {
  double x;
  double y;
  char a;
  char b;
};
// On typical ABIs, sizeof(Slim) < sizeof(Fat)
```

---

## Cache line angle (why interviewers bridge here)

Padding is **not** “the OS decided.” It is **compiler + ABI + CPU alignment rules**. It still affects **performance**: a `std::vector<BigPaddedStruct>` wastes **cache lines** on unused padding. For **CPU cache vs VM**, see [Virtual memory — matrix locality](../virtual-memory/#matrix-locality-tlb-cache).

---

## `alignas` and `#pragma pack` (names only)

- **`alignas(N)`** raises alignment (or relaxes in limited cases per rules) — use sparingly and deliberately.
- **`#pragma pack`** (MSVC/GCC extension family) **reduces** padding for packed wire formats — can cause **slower or illegal** unaligned accesses on strict platforms; treat as **I/O structs**, not general domain models.

---

## Common interview questions

**Why does padding exist?**  
To place every member at a **legal and efficient** address for its type and to keep **`sizeof(T)`** compatible with **array** layout.

**Who inserts padding — the OS?**  
Mostly the **compiler** following the **ABI** and **alignment** rules.

**How do you predict `sizeof`?**  
Walk offsets: round up each offset to `alignof(member)`; add `sizeof(last)`; round total up to `alignof(struct)`.

**Why is misaligned `double` bad?**  
May be **slower** (split loads across cache lines / pages) or **trap** on some ISAs; **atomics** often require natural alignment.

**When is reordering fields OK?**  
When you **do not** rely on a stable public layout — reorder for size; for **network/disk**, prefer **explicit layout** (`#pragma pack`, `std::bit_cast` discipline, or serialization schema) instead of “whatever the compiler picked.”

---

## Recap

**`alignof` / `sizeof`** come from **alignment rules + tail padding**, not from adding your member sizes naively. **Reorder** members to pack small fields together; keep **packed structs** for **I/O**, not general code, unless you understand the platform cost.
