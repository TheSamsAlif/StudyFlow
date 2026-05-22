// WebSocket helper for real-time admin → student notifications
const listeners = new Set();
let socket = null;
let reconnectTimer = null;
let pingTimer = null;
let currentToken = null;

function buildWsUrl(token) {
  const httpUrl = process.env.REACT_APP_BACKEND_URL || "";
  const wsUrl = httpUrl.replace(/^http/, "ws");
  return `${wsUrl}/api/ws?token=${encodeURIComponent(token)}`;
}

export function connectWS(token) {
  currentToken = token;
  if (socket && (socket.readyState === 0 || socket.readyState === 1)) return;
  try {
    socket = new WebSocket(buildWsUrl(token));
  } catch (e) {
    scheduleReconnect();
    return;
  }
  socket.onopen = () => {
    pingTimer = setInterval(() => {
      try { socket?.send("ping"); } catch {}
    }, 25000);
  };
  socket.onmessage = (ev) => {
    let payload;
    try { payload = JSON.parse(ev.data); }
    catch { return; }
    if (!payload || typeof payload !== "object") return;
    listeners.forEach((fn) => {
      try { fn(payload); } catch {}
    });
  };
  socket.onclose = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    socket = null;
    if (currentToken) scheduleReconnect();
  };
  socket.onerror = () => { try { socket?.close(); } catch {} };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (currentToken) connectWS(currentToken);
  }, 4000);
}

export function disconnectWS() {
  currentToken = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  try { socket?.close(); } catch {}
  socket = null;
}

export function onWSEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
