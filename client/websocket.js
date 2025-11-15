// client/websocket.js
const wsClient = (function () {
  let ws = null;
  let handlers = { open: null, message: null, close: null, error: null };
  let url = null;

  function connect(u) {
    url = u || url;
    if (!url) throw new Error('ws url missing');
    if (ws && ws.readyState === WebSocket.OPEN) return ws;
    ws = new WebSocket(url);
    ws.addEventListener('open', () => handlers.open && handlers.open());
    ws.addEventListener('message', (ev) => {
      try { const data = JSON.parse(ev.data); handlers.message && handlers.message(data); } catch (e) { console.warn('ws parse', e); }
    });
    ws.addEventListener('close', () => handlers.close && handlers.close());
    ws.addEventListener('error', (err) => handlers.error && handlers.error(err));
    return ws;
  }

  function on(name, cb) { handlers[name] = cb; }
  function send(obj) { if (!ws || ws.readyState !== WebSocket.OPEN) return console.warn('ws not open'); ws.send(JSON.stringify(obj)); }
  return { connect, on, send };
})();
