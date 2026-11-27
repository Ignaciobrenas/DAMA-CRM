export type ChannelCategory = 'B2B' | 'B2C' | 'ERP' | '3PL' | 'CRM';

export type ConnectionTransportType = 'api' | 'database' | 'ftp' | 'sftp' | 'webhook' | 'file';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'warning'
  | 'maintenance'
  | 'testing';

export type ApiAuthType =
  | 'bearer'
  | 'basic_auth'
  | 'api_key'
  | 'api_key_body'
  | 'oauth_client_credentials'
  | 'oauth_authorization_code'
  | 'oauth_password'
  | 'soap_session'
  | 'custom';

export type EnvironmentStatus = 'active' | 'inactive' | 'maintenance';
export type EnvironmentHealth = 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';

export type ApiKeyType = 'api_key' | 'oauth' | 'bearer' | 'basic_auth' | 'custom' | 'webhook';
export type ApiKeyStatus = 'active' | 'inactive' | 'expiring' | 'expired';

export type TaskExecutionType = 'cron' | 'quick' | 'webhook' | 'manual';
export type SyncTaskStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'running'
  | 'completed'
  | 'error'
  | 'failed'
  | 'cancelled';

export type TaskDirection = 'import' | 'export' | 'bidirectional';
export type TaskOperationType =
  | 'full_sync'
  | 'incremental'
  | 'bulk_import'
  | 'bulk_export'
  | 'api_sync'
  | 'reconciliation';

export type TaskParameterType = 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';

export type SyncOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'bulk_create'
  | 'bulk_update'
  | 'bulk_delete'
  | 'import'
  | 'export';

export type SyncOperationStatus =
  | 'blocked'
  | 'queued'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export type SyncOperationEntityStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ChannelCapabilities {
  products: boolean;
  prices: boolean;
  tariffs: boolean;
  stock: boolean;
  orders: boolean;
  categories: boolean;
  shipments: boolean;
  returns: boolean;
  delivery_notes: boolean;
  customers: boolean;
  companies: boolean;
  contacts: boolean;
  deals: boolean;
  invoices: boolean;
  credit_notes: boolean;
  discounts: boolean;
}

export interface ApiCredentials {
  auth_type?: ApiAuthType;
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  header_name?: string;
  body_field_name?: string;
  client_id?: string;
  client_secret?: string;
  token_url?: string;
  scope?: string;
  auth_url?: string;
  redirect_uri?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  headers?: Record<string, string>;
  api_key?: string;
  api_secret?: string;
  use_json_body?: boolean;
  skip_grant_type?: boolean;
  skip_body_credentials?: boolean;
  raw_token_response?: boolean;
  token_response_field?: string;
  token_request_extra_fields?: Record<string, string>;
  [key: string]: unknown;
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  [key: string]: unknown;
}

export interface FtpCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  [key: string]: unknown;
}

export interface WebhookCredentials {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface FileCredentials {
  path: string;
  format: string;
  [key: string]: unknown;
}

export type ConnectionCredentials =
  | ApiCredentials
  | DatabaseCredentials
  | FtpCredentials
  | WebhookCredentials
  | FileCredentials
  | Record<string, unknown>;

export interface ApiKeyPermissionRule {
  category: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface TaskWorkflowConfig {
  mode: 'connector' | 'webhook';
  connectorKey?: string;
  operation?: string;
  webhookUrl?: string;
  authToken?: string;
  version?: string;
}

export interface TaskExecutionProgress {
  status: SyncTaskStatus;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  warnings: string[];
  currentBatch?: number;
  totalBatches?: number;
  startedAt?: string;
  lastUpdate: string;
  message?: string;
}

export interface TaskExecutionSummary {
  currentExecutionId?: string | null;
  lastExecutionId?: string | null;
  averageExecutionTimeMs: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastErrorMessage?: string | null;
}

export class SyncHttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'SyncHttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
