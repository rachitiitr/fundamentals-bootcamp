// Exercise 5 — RPC helper extended with streaming support
//
// Build on your Ex 4 RPC. Add `callStream(method, ...args)` returning an
// async generator. Each {type:'next', value} message yields the value;
// {type:'complete'} ends the generator; {type:'error'} throws into it.
//
// Cleanup pattern (CRITICAL):
//   - When the consumer breaks out of `for await`, the generator's
//     `finally` block runs.
//   - In that finally, postMessage({id, method:'unsubscribe'}) so the
//     worker can reference-count and close the WebSocket if no one
//     is left.
//
// Hint: same correlation-id Map as Ex 4, but each entry holds a
// "next-promise" + "resolveNext" instead of a single resolve/reject.
// Same push→pull bridge pattern from your tickBuffered exercise!

window.createRpc = function createRpc(worker) {
  // Your code here:
};
