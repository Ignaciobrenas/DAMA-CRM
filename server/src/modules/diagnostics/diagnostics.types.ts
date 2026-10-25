export interface SystemTelemetry {
  service: string;
  version: string;
  status: 'OPERATIONAL' | 'DEGRADED';
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  port: number;
  nodeVersion: string;
  platform: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    heapPercentage: number;
  };
  database: {
    connected: boolean;
    engine: string;
    latencyMs: number;
    counts: Record<string, number>;
  };
  security: {
    helmetActive: boolean;
    rateLimitingActive: boolean;
    rbacActive: boolean;
    tlsHstsActive: boolean;
  };
  integrations: Array<{
    id: string;
    name: string;
    category: string;
    status: 'ACTIVE' | 'CONFIGURED' | 'PENDING';
    endpoint: string;
    details: string;
  }>;
}

export interface EndpointDescriptor {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Sistema' | 'CRM' | 'Facturación' | 'Logística' | 'Servicios' | 'Soporte' | 'Proyectos' | 'RRHH' | 'Comunicación' | 'Integraciones';
  description: string;
  requiresAuth: boolean;
  sampleBody?: any;
}
