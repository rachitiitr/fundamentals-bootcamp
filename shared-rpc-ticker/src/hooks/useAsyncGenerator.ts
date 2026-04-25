import { useEffect, useState } from 'react';

/**
 * Bridge an async generator to React state.
 *
 * Every value yielded by the generator becomes the new state value.
 * On unmount (or when `deps` change), we:
 *   1. Set a `cancelled` flag so we stop calling `setState`.
 *   2. Call `gen.return()` which triggers the `finally` block in the
 *      generator (this is how our WebSocket gets closed).
 *
 * Note: React 18+ Strict Mode mounts effects twice in dev. That means
 * the generator will be created, immediately torn down, and then created
 * again. The `gen.return()` in cleanup is what makes this safe — without
 * it we'd leak a WebSocket on every Strict-Mode re-mount.
 *
 * @param factory  function that returns a fresh async generator. We take
 *                 a factory (not the generator itself) so each effect run
 *                 gets its own generator instance.
 * @param deps     React effect dependency list — re-subscribe when any
 *                 dep changes.
 */
export function useAsyncGenerator<T>(
  factory: () => AsyncGenerator<T, unknown, unknown>,
  deps: ReadonlyArray<unknown>,
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const gen = factory();

    (async () => {
      try {
        for await (const v of gen) {
          if (cancelled) break;
          setValue(v);
        }
      } catch (err) {
        // Surface to console for v0; we'll add error state plumbing later.
        if (!cancelled) console.error('[useAsyncGenerator]', err);
      }
    })();

    return () => {
      cancelled = true;
      // Triggers the `finally` block in the generator, which closes
      // resources like our WebSocket.
      void gen.return(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
