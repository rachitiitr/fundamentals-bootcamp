// Exercise 5 — worker hosting Binance WebSockets
//
// Wire format (recap):
//   incoming:  { id, method:'subscribe',   args:[symbol] }
//              { id, method:'unsubscribe' }
//   outgoing:  { id, type:'next',     value: trade }
//              { id, type:'complete' }
//              { id, type:'error',    error }
//
// Behaviour:
//   - First subscriber to a symbol → open a WebSocket to
//     wss://stream.binance.com:9443/ws/<symbol>@trade
//   - Each new trade message → fan out to ALL subscribers of that symbol.
//   - Last subscriber unsubscribes → close the WS.
//
// Data structures (suggestion):
//   const symbolToConn = new Map();       // symbol → { ws, subscribers:Set<id> }
//   const idToSymbol   = new Map();       // id     → symbol  (so unsubscribe knows which conn)
//
// Important — log clearly:
//   console.log('[worker] WS open for', symbol)
//   console.log('[worker] WS close for', symbol)
// so you can verify exactly one socket per symbol regardless of subscriber count.

// Your code here:
