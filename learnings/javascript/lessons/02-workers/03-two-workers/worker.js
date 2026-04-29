// Exercise 3 — worker (used by both A and B instances)
//
// On boot, set self.MY_ID to a random short string (e.g. Math.random().toString(36).slice(2,7)).
// Maintain a counter starting at 0.
//
// Handle messages:
//   {type:'inc'}  → counter++, reply {id: self.MY_ID, counter}
//   {type:'read'} → reply {id: self.MY_ID, counter}
//
// Each spawn of this file gets its OWN self, MY_ID, counter — no sharing.

// Your code here:
self.MY_ID = Math.random().toString(36).slice(2,7)
self.ctr = 0
self.onmessage = ev => {
    if (ev.data.op === 'increment') {
        self.ctr += 1
    } else if (ev.data.op === 'get') {
        self.postMessage({ctr: self.ctr, id: self.MY_ID})
    }
}
