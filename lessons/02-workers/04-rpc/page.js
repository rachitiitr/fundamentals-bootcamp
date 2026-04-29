// Exercise 4 — page using the RPC helper
//
// What YOU need to do:
//   1. Create the worker.
//   2. const rpc = createRpc(worker);
//   3. Use rpc.call(method, ...args) inside the button handlers below.
//   4. Wrap calls in try/catch (or .catch) when you expect a rejection.

// ---------- DOM helpers (don't touch) ----------
const logEl = document.getElementById('log');
function logLine(s) {
  logEl.textContent += `[${new Date().toLocaleTimeString()}.${String(Date.now() % 1000).padStart(3,'0')}] ${s}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}
const addEl       = document.getElementById('add');
const helloEl     = document.getElementById('hello');
const parallelEl  = document.getElementById('parallel');
const errEl       = document.getElementById('errOnArgs');

// ---------- Worker + RPC (TODO) ----------
// const worker = ...
// const rpc = createRpc(worker);

// ---------- Button handlers (TODO) ----------
addEl.onclick = async () => {
  // TODO: const result = await rpc.call('add', 2, 3);
  //       logLine(`add(2,3) = ${result}`);
};

helloEl.onclick = async () => {
  // TODO: await rpc.call('delayedHello', 'alice', 1000)
};

parallelEl.onclick = async () => {
  // TODO: fire 3 calls at once, log each result, log total elapsed time
  //       const t0 = Date.now();
  //       const [a, b, c] = await Promise.all([...]);
  //       logLine(`done in ${Date.now() - t0}ms`);
};

errEl.onclick = async () => {
  // TODO: call add('a','b'); expect rejection; log the error message
};
