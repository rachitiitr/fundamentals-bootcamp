// Exercise 4 — worker exposing methods over a tiny RPC protocol
//
// Wire format (recap):
//   incoming:  { id, method, args }
//   outgoing:  { id, ok: true,  result }
//              { id, ok: false, error: { message, stack } }
//
// Methods to expose:
//   add(a, b)                  → number, throws if either arg isn't a number
//   delayedHello(name, ms)     → resolves after `ms` with `Hello, ${name}!`
//
// TODO: Build a small dispatcher. Keep it simple — a `methods` object whose values
//       are async functions; look up by name; await; reply.

// Your code here:
