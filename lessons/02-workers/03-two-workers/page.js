// Exercise 3 — page (DOM scaffolding done; you only write the Worker bits)
//
// What YOU need to do:
//   1. Create workerA and workerB, both from './worker.js'.
//   2. Hook up each worker's onmessage to log into the corresponding pre.
//   3. Inside incA / incB / readA / readB handlers below, postMessage
//      the right thing to the right worker.

// ---------- DOM helpers (don't touch) ----------
const logA = document.getElementById('logA');
const logB = document.getElementById('logB');
function appendTo(el, msg) {
  el.textContent += JSON.stringify(msg) + '\n';
  el.scrollTop = el.scrollHeight;
}
const incAEl  = document.getElementById('incA');
const incBEl  = document.getElementById('incB');
const readAEl = document.getElementById('readA');
const readBEl = document.getElementById('readB');

// ---------- Workers (TODO: create the two workers) ----------
const workerA = new Worker("worker.js")
const workerB = new Worker("worker.js")

// ---------- onmessage handlers (TODO) ----------
workerA.onmessage = (ev) => {
  appendTo(logA, JSON.stringify(ev.data))
}
workerB.onmessage = (ev) => {
  appendTo(logB, JSON.stringify(ev.data))
}

// ---------- Button handlers (TODO: postMessage to the right worker) ----------
incAEl.onclick  = () => { 
  workerA.postMessage({op: 'increment'})
};

incBEl.onclick  = () => { 
  workerB.postMessage({op: 'increment'})
};

readAEl.onclick = () => { 
  workerA.postMessage({op: 'get'})
};

readBEl.onclick = () => { 
  workerB.postMessage({op: 'get'})
};

