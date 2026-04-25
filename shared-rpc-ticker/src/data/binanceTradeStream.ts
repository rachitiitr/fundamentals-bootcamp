/**
 * v0 — direct WebSocket connection to Binance, no worker yet.
 *
 * This file intentionally lives in the React app (not a worker) so that
 * we can later "lift" it into a worker without changing the consumer code.
 *
 * Async-generator-shaped APIs are the perfect abstraction for streams:
 *   - The producer just `yield`s values.
 *   - The consumer just `for await`s them.
 *   - Cleanup (the `finally` block) runs automatically when the consumer
 *     stops iterating (e.g. when the component unmounts and our hook
 *     calls `gen.return()`).
 *
 * In v1 we'll move this exact function into a Worker. In v2 we'll move it
 * into a SharedWorker. The component code will not change.
 */

/** Shape of a single trade message from Binance. */
export interface Trade {
  /** Symbol, e.g. "BTCUSDT" */
  symbol: string;
  /** Trade price (parsed to number for convenience). */
  price: number;
  /** Trade quantity. */
  quantity: number;
  /** Trade time in milliseconds since epoch. */
  tradeTime: number;
  /** Unique trade id from Binance. */
  tradeId: number;
  /** True if the buyer is the market maker (seller-initiated). */
  isBuyerMaker: boolean;
}

/**
 * Raw payload Binance sends on the `<symbol>@trade` stream.
 * Documented at https://binance-docs.github.io/apidocs/spot/en/#trade-streams
 */
interface RawTradeMessage {
  e: 'trade';        // event type
  E: number;         // event time
  s: string;         // symbol
  t: number;         // trade id
  p: string;         // price (string!)
  q: string;         // quantity (string!)
  T: number;         // trade time
  m: boolean;        // is buyer the market maker
  M?: boolean;       // ignore
}

/**
 * Subscribe to live trades for one symbol on Binance.
 *
 * @param symbol e.g. "BTCUSDT" — case-insensitive, lowercased before use.
 * @returns an AsyncGenerator that yields a {@link Trade} for every print.
 *
 * The generator runs forever until the consumer breaks out of the loop
 * (or calls `.return()` / `.throw()`). On termination, the underlying
 * WebSocket is closed in the `finally` block.
 */
export async function* binanceTradeStream(
  symbol: string,
): AsyncGenerator<Trade, void, void> {
  const stream = `${symbol.toLowerCase()}@trade`;
  const url = `wss://stream.binance.com:9443/ws/${stream}`;

  const ws = new WebSocket(url);

  // We bridge the event-driven WebSocket API to an async-iterable one
  // using a tiny in-memory queue + a "resolver" promise. When a message
  // arrives, we either fulfill a waiting consumer or buffer it.
  const buffer: Trade[] = [];
  let resolveNext: ((value: IteratorResult<Trade>) => void) | null = null;
  let rejectNext: ((reason: unknown) => void) | null = null;
  let closed = false;

  ws.addEventListener('message', (ev) => {
    try {
      const raw = JSON.parse(ev.data as string) as RawTradeMessage;
      const trade: Trade = {
        symbol: raw.s,
        price: parseFloat(raw.p),
        quantity: parseFloat(raw.q),
        tradeTime: raw.T,
        tradeId: raw.t,
        isBuyerMaker: raw.m,
      };

      if (resolveNext) {
        const r = resolveNext;
        resolveNext = null;
        rejectNext = null;
        r({ value: trade, done: false });
      } else {
        buffer.push(trade);
      }
    } catch (err) {
      // If the message is malformed, surface the error to the consumer.
      if (rejectNext) {
        const r = rejectNext;
        resolveNext = null;
        rejectNext = null;
        r(err);
      }
    }
  });

  ws.addEventListener('close', () => {
    closed = true;
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      rejectNext = null;
      r({ value: undefined, done: true });
    }
  });

  ws.addEventListener('error', () => {
    // Treat error as close — the WS will fire 'close' right after anyway.
    closed = true;
    if (rejectNext) {
      const r = rejectNext;
      resolveNext = null;
      rejectNext = null;
      r(new Error(`WebSocket error for ${url}`));
    }
  });

  try {
    while (true) {
      // Drain anything we already buffered before awaiting.
      if (buffer.length > 0) {
        yield buffer.shift()!;
        continue;
      }
      if (closed) return;

      // Park until the next message (or close/error).
      const next = await new Promise<IteratorResult<Trade>>((resolve, reject) => {
        resolveNext = resolve;
        rejectNext = reject;
      });

      if (next.done) return;
      yield next.value;
    }
  } finally {
    // Critically important: when the consumer stops iterating
    // (component unmount, error, etc.), close the socket so we don't
    // leak connections. This `finally` runs because of `gen.return()`.
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  }
}
