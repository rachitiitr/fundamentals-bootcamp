import { useEffect, useState } from 'react';
import { binanceTradeStream, type Trade } from '../data/binanceTradeStream';

interface Props {
  symbol: string;
  /** Maximum number of trades to keep in the list. */
  max?: number;
}

/**
 * Rolling list of the most recent N trades.
 *
 * Note: this component opens its OWN WebSocket — separate from the one
 * the PriceTicker opens, even when both are showing the same symbol.
 * That's the v0 inefficiency we want you to *see*. Open DevTools →
 * Network → WS filter, and you'll count multiple sockets.
 *
 * Later, when we move the stream into a SharedWorker, both components
 * will share a single underlying WebSocket per symbol — and you'll see
 * the count drop in DevTools.
 */
export function TradeList({ symbol, max = 15 }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    let cancelled = false;
    const gen = binanceTradeStream(symbol);

    (async () => {
      for await (const t of gen) {
        if (cancelled) break;
        setTrades((prev) => {
          const next = [t, ...prev];
          if (next.length > max) next.length = max;
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
      void gen.return(undefined);
    };
  }, [symbol, max]);

  return (
    <div className="trade-list">
      <div className="trade-list-header">Recent trades · {symbol}</div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Side</th>
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">— waiting for trades —</td>
            </tr>
          )}
          {trades.map((t) => (
            <tr key={t.tradeId}>
              <td>{new Date(t.tradeTime).toLocaleTimeString()}</td>
              <td className={t.isBuyerMaker ? 'sell' : 'buy'}>
                ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td>{t.quantity.toFixed(6)}</td>
              <td className={t.isBuyerMaker ? 'sell' : 'buy'}>
                {t.isBuyerMaker ? 'SELL' : 'BUY'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
