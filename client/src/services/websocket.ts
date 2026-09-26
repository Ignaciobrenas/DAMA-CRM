type WsListener = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<WsListener>> = new Map();
  private reconnectTimeout: any = null;
  private isConnected = false;

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running in development with Vite port 5173, point to backend on port 4000
    let host = window.location.host;
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:4000`;
    }
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('⚡ Conectado a WebSockets DAMA-CRM');
        this.emit('connection:change', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event) {
            this.emit(parsed.event, parsed.data);
          }
        } catch {
          // Quietly handle parse failures
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection:change', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.emit('connection:change', { connected: false });
      };
    } catch {
      this.isConnected = false;
      this.emit('connection:change', { connected: false });
      this.scheduleReconnect();
    }
  }

  public isWsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach((callback) => callback(data));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 4000);
  }

  public on(event: string, callback: WsListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return cleanup unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public send(event: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }
}

export const wsClient = new WebSocketClient();
