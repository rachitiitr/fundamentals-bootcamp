import { useState } from 'react';
import { PriceTicker } from './components/PriceTicker';
import { TradeList } from './components/TradeList';
import './App.css';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

/**
 * v0 — Crypto ticker dashboard, no workers yet.
 *
 * Each child component opens its OWN WebSocket. Open this app in two
 * browser tabs and check DevTools → Network → WS — you should see one
 * connection PER component PER tab. That's the inefficiency we'll fix
 * step by step in v1 (Worker), v2 (SharedWorker), and beyond.
 */
function App() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  return (
    <main className="app">
      <header>
        <h1>SharedRpc Ticker · v0</h1>
        <p className="tagline">
          Direct WebSocket connection per component. No worker yet.
          Open DevTools → Network → WS to count the connections.
        </p>
        <div className="symbol-picker">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className={s === symbol ? 'active' : ''}
              onClick={() => setSymbol(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <section className="dashboard">
        <PriceTicker symbol={symbol} />
        <TradeList symbol={symbol} />
      </section>

      <footer>
        <p>
          Tip: open this page in another tab and you'll see Binance WS
          connections double. That's exactly the problem SharedWorker
          (coming in v2) is going to solve.
        </p>
      </footer>
    </main>
  );
}

export default App;
