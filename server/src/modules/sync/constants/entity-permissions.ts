import { TaskDirection } from '../types/sync.types';

export interface RequiredPermission {
  resource: string;
  action: string;
}

const ENTITY_RESOURCE_MAP: Record<string, string> = {
  products: 'inventory',
  stock: 'inventory',
  prices: 'inventory',
  categories: 'inventory',
  orders: 'invoices',
  invoices: 'invoices',
  delivery_notes: 'invoices',
  customers: 'companies',
  companies: 'companies',
  contacts: 'contacts',
  deals: 'deals',
  shipments: 'logistics',
  returns: 'logistics',
};

/**
 * Derives required DAMA-CRM RBAC permissions for executing a sync task type
 * based on its business entity type and direction.
 */
export function getRequiredPermissions(
  dataEntityType?: string | null,
  direction?: TaskDirection | string | null
): RequiredPermission[] {
  const resource = (dataEntityType && ENTITY_RESOURCE_MAP[dataEntityType]) || 'integrations';
  if (direction === 'import') {
    return [
      { resource, action: 'create' },
      { resource, action: 'update' },
    ];
  }
  if (direction === 'export') {
    return [{ resource, action: 'read' }];
  }
  return [
    { resource, action: 'read' },
    { resource, action: 'update' },
  ];
}
