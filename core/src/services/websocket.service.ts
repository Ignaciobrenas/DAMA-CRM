import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface WsMessage {
  event: string;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial welcome message
      const welcome: WsMessage = {
        event: 'system:connected',
        data: { message: 'Conexión en tiempo real activa con DAMA-CRM' },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(welcome));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.event === 'ping') {
            ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
          } else if (parsed.event === 'omnichannel:typing') {
            this.broadcastExcept(ws, 'omnichannel:typing', parsed.data);
          } else if (parsed.event === 'chat:message') {
            this.broadcast('omnichannel:message', parsed.data);
          }
        } catch {
          // Ignore malformed client messages quietly
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    console.log('⚡ WebSocket Server initialized at /ws');
  }

  public broadcast(event: string, data: any): void {
    if (!this.wss || this.clients.size === 0) return;

    const payload: WsMessage = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(serialized);
        } catch {
          this.clients.delete(client);
        }
      }
    });
  }

  public broadcastExcept(sender: WebSocket, event: string, data: any): void {
    if (!this.wss || this.clients.size === 0) return;

    const payload: WsMessage = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);

    this.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        try {
          client.send(serialized);
        } catch {
          this.clients.delete(client);
        }
      }
    });
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
