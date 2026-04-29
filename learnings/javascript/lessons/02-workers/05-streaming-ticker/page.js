// Exercise 5 — page using streaming RPC
//
// What YOU need to do:
//   1. Create the worker + rpc.
//   2. Implement priceLoop()  — for await on rpc.callStream('subscribe','BTCUSDT'),
//                               update priceEl + metaEl on each trade.
//   3. Implement tradesLoop() — for await on rpc.callStream('subscribe','BTCUSDT'),
//                               keep a rolling array of last 10 trades, render to tradesEl.
//   4. Wire #start to launch BOTH loops; #stop to cancel both.
//
// Cancellation tip:
//   Use AbortController-style flag, or wrap the for-await in a try/finally and
//   call gen.return() from outside. Pick whatever feels natural.

// ---------- DOM helpers (don't touch) ----------
const priceEl  = document.getElementById('price');
const metaEl   = document.getElementById('meta');
const tradesEl = document.getElementById('trades');
const startEl  = document.getElementById('start');
const stopEl   = document.getElementById('stop');

// ---------- Worker + RPC (TODO) ----------
// const worker = ...
// const rpc = createRpc(worker);

// ---------- Stream consumers (TODO) ----------
// async function priceLoop()  { ... }
// async function tradesLoop() { ... }

// ---------- Buttons (TODO: launch and cancel both loops) ----------
startEl.onclick = () => { /* TODO */ };
stopEl.onclick  = () => { /* TODO */ };
