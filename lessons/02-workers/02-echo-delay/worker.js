// Exercise 2 — worker
//
// TODO: When you receive {text, delayMs}, wait delayMs and then reply with {echoed: text, after: delayMs}.
//       Use setTimeout. Do NOT use Atomics.wait or anything blocking — the worker should remain responsive.

// Your code here:
self.onmessage = (ev) => {
    if (ev.data.text) {
        setTimeout(() => {
            self.postMessage({echoed: ev.data.text, after: ev.data.delayMs})
        }, ev.data.delayMs);
    }
}