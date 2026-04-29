// Exercise 4 — generic RPC wrapper
//
// Goal: createRpc(worker) returns { call(method, ...args) → Promise<result> }
//
// Implementation hints:
//   - Generate a unique id per call (counter or crypto.randomUUID()).
//   - Maintain a Map of id → { resolve, reject }.
//   - On worker message: look up the entry by id, resolve/reject, delete from map.
//   - On worker.onerror (top-level worker crash): reject ALL pending entries.
//
// TODO: Implement createRpc. Expose it on window so page.js can use it.

window.createRpc = function createRpc(worker) {
  // Your code here:
};
