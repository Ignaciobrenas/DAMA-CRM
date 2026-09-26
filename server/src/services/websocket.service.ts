import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface WsMessage {
  event: string;
  data: any;
  timestamp: string;
}

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  tenantId?: string;
  userId?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<ExtendedWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public init(server: HttpServer): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
      },
    });

    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      ws.isAlive = true;
      this.clients.add(ws);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send initial welcome handshake
      const welcome: WsMessage = {
        event: 'system:connected',
        data: { message: 'Conexión en tiempo real activa y blindada con DAMA-CRM' },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(welcome));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.event === 'ping') {
            ws.isAlive = true;
            ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
          } else if (parsed.event === 'auth:identify') {
            ws.tenantId = parsed.data?.tenantId || 'master';
            ws.userId = parsed.data?.userId;
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

    // High-concurrency connection hygiene: 30s heartbeat ping/pong keepalive
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('⚡ WebSocket High-Performance Engine initialized at /ws');
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

  public broadcastToTenant(tenantId: string, event: string, data: any): void {
    if (!this.wss || this.clients.size === 0) return;

    const payload: WsMessage = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);

    this.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (!client.tenantId || client.tenantId === tenantId || client.tenantId === 'master')
      ) {
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
