export const WS_URL = "ws://127.0.0.1:8000/ws/factory";

let instance = null;

function createFactoryWebSocket() {
  let socket = null;
  const listeners = new Map();
  let destroyed = false;

  function connect() {
    if (destroyed) return;
    socket = new WebSocket(WS_URL);

    socket.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const type = msg.type;
      if (!type) return;
      listeners.get(type)?.forEach((fn) => fn(msg));
    });

    socket.addEventListener("close", () => {
      if (!destroyed) setTimeout(connect, 3000);
    });

    socket.addEventListener("error", (err) => {
      console.error("[WebSocket] 연결 오류:", err);
    });
  }

  connect();

  return {
    on(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    off(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    destroy() {
      destroyed = true;
      socket?.close();
      instance = null;
    },
  };
}

export function getFactoryWebSocket() {
  if (!instance) instance = createFactoryWebSocket();
  return instance;
}
