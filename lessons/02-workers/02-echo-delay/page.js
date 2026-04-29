// Exercise 2 — page
//
// TODO 1: Create a Worker.
// TODO 2: Wire onmessage to log each reply.
// TODO 3: Send button: postMessage({text: input value, delayMs: 1000}).
// TODO 4: Burst button: send 5 messages with text 'msg-0' .. 'msg-4', each 1000ms delay.
//          Confirm replies arrive together ~1 second later (worker handles them concurrently).

const logEl = document.getElementById('log');
function logLine(s) {
  logEl.textContent += `[${new Date().toLocaleTimeString()}.${String(Date.now() % 1000).padStart(3,'0')}] ${s}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

// Your code here:
const worker = new Worker("worker.js")

const textEl = document.getElementById("text")
const sendEl = document.getElementById("send")
const sendBurstEl = document.getElementById("sendBurst")

worker.onmessage = ev => {
  logLine(JSON.stringify(ev.data))
}

sendEl.onclick = () => {
  worker.postMessage({text: textEl.value, delayMs: 1000});
}


sendBurstEl.onclick = () => {
  worker.postMessage({text: 'msg-0', delayMs: 1000});
  worker.postMessage({text: 'msg-1', delayMs: 1000});
  worker.postMessage({text: 'msg-2', delayMs: 1000});
  worker.postMessage({text: 'msg-3', delayMs: 1000});
  worker.postMessage({text: 'msg-4', delayMs: 1000});
}