import { ConnectorType } from '../integrations.types';
import { IPlatformConnector } from './connector.interface';

export class ConnectorRegistry {
  private static connectors = new Map<ConnectorType, IPlatformConnector>();

  public static register(connector: IPlatformConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public static get(id: ConnectorType): IPlatformConnector | undefined {
    return this.connectors.get(id);
  }

  public static getOrThrow(id: ConnectorType): IPlatformConnector {
    const conn = this.connectors.get(id);
    if (!conn) {
      throw new Error(`Conector '${id}' no registrado en ConnectorRegistry.`);
    }
    return conn;
  }

  public static getAll(): IPlatformConnector[] {
    return Array.from(this.connectors.values());
  }

  public static has(id: string): id is ConnectorType {
    return this.connectors.has(id as ConnectorType);
  }
}
