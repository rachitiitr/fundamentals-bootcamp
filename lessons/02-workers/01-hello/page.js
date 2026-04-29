// Exercise 1 — main thread (the "page")
//
// TODO 1: Create a Worker pointing at './worker.js'.
// TODO 2: Set up an onmessage handler that appends event.data to #log (use logLine helper).
// TODO 3: Wire up the buttons:
//   - #ping     → postMessage({type:'ping'}) to the worker
//   - #ping10   → send 10 pings in a row
//   - #block    → run a blocking sync loop for ~2 seconds (NO setTimeout — must block the main thread).
//                 While blocked, you'll notice the page is frozen (button stays pressed),
//                 but when it unblocks you'll see the worker's replies arrived during the freeze.

const logEl = document.getElementById('log');
function logLine(s) {
  logEl.textContent += `[${new Date().toLocaleTimeString()}] ${s}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}
const pingEl = document.getElementById('ping');
const ping10El = document.getElementById('ping10');
const blockEl = document.getElementById('block'); // 2s


// Your code here:
const worker = new Worker('worker.js');

worker.onmessage = ev => {
  logLine(JSON.stringify(ev.data));
};

pingEl.onclick = () => {
  worker.postMessage({type: 'ping'});
}

ping10El.onclick = () => {
  for (let i = 0; i < 10; i++)
    worker.postMessage({type: 'ping'});
}

blockEl.onclick = () => {
  const now = Date.now();
  while (Date.now() - now < 2000) {

  }
}
