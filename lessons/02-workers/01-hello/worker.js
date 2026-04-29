// Exercise 1 — worker thread
//
// `self` is the worker's global scope. There is NO window, document, or DOM here.
// `console.log` works — output appears in the page's DevTools console.
//
// TODO: Set up self.onmessage. When you receive {type:'ping'}, reply with {type:'pong', at: Date.now()}.

console.log('[worker] booted');

// Your code here:
self.onmessage = ev => {
    if (ev.data.type === 'ping')
        self.postMessage({type: 'pong', at: Date.now()})
};