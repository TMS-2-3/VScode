export class NetworkClient {
  constructor(handlers) {
    this.handlers = handlers;
    this.ws = null;
    this.connected = false;
    this.reconnectTimer = 0;
    this.pingTimer = 0;
  }

  connect() {
    if (!location.host || location.protocol === "file:") {
      this.connected = false;
      this.handlers.onUnavailable?.("通信対戦を使うには server.js から開いてください。");
      return;
    }

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}`);
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.connected = true;
      this.startPing();
      this.handlers.onOpen?.();
    });

    ws.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      this.handlers.onMessage?.(message);
    });

    ws.addEventListener("close", () => {
      this.connected = false;
      this.stopPing();
      this.handlers.onClose?.();
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 1200);
    });
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(data));
    return true;
  }

  startPing() {
    this.stopPing();
    const sendPing = () => this.send({ type: "ping", t: performance.now() });
    sendPing();
    this.pingTimer = setInterval(sendPing, 1000);
  }

  stopPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = 0;
  }
}
