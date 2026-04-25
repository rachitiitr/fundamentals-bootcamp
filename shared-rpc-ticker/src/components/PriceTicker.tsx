import { useRef } from 'react';
import { binanceTradeStream, type Trade } from '../data/binanceTradeStream';
import { useAsyncGenerator } from '../hooks/useAsyncGenerator';

interface Props {
  symbol: string;
}

/**
 * Big number display of the latest trade price for `symbol`.
 *
 * Also colors the price green/red based on whether it went up or down
 * compared to the previous tick — a nice visual confirmation that data
 * is flowing in real time.
 */
export function PriceTicker({ symbol }: Props) {
  const trade: Trade | undefined = useAsyncGenerator(
    () => binanceTradeStream(symbol),
    [symbol],
  );

  // Track the previous price so we can color the change.
  // useRef so we don't trigger re-renders just from updating it.
  const prevPriceRef = useRef<number | undefined>(undefined);
  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (trade && prevPriceRef.current !== undefined) {
    if (trade.price > prevPriceRef.current) direction = 'up';
    else if (trade.price < prevPriceRef.current) direction = 'down';
  }
  if (trade) prevPriceRef.current = trade.price;

  const color =
    direction === 'up' ? '#10b981' :
    direction === 'down' ? '#ef4444' :
    'var(--text-h)';

  return (
    <div className="price-ticker">
      <div className="symbol">{symbol}</div>
      <div className="price" style={{ color }}>
        {trade ? `$${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '— connecting —'}
      </div>
      {trade && (
        <div className="meta">
          qty {trade.quantity.toFixed(6)} · {trade.isBuyerMaker ? 'sell' : 'buy'} · trade #{trade.tradeId}
        </div>
      )}
    </div>
  );
}
