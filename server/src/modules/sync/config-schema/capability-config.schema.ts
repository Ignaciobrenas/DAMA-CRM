import { ChannelCapabilities, ChannelCategory } from '../types/sync.types';

export interface CapabilityConfigField {
  /** Dot-separated path inside Connection.config */
  path: string;
  type: 'select' | 'boolean' | 'number' | 'string';
  label: string;
  description: string;
  options?: readonly { value: string; label: string }[];
  default: string | boolean | number;
  readBy: 'backend' | 'orchestrator';
}

export const ORDER_RELEASE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'on_hold', label: 'On Hold (Manual Approval)' },
] as const;

export const STOCK_SYNC_MODES = [
  { value: 'absolute', label: 'Absolute Quantity Override' },
  { value: 'delta', label: 'Incremental Delta Adjustment' },
  { value: 'warehouse_sum', label: 'Multi-Warehouse Aggregate' },
] as const;

export const PRICE_TAX_MODES = [
  { value: 'tax_excluded', label: 'Net Price (Tax Excluded)' },
  { value: 'tax_included', label: 'Gross Price (Tax Included)' },
] as const;

/**
 * Capability-driven Connection.config schema.
 * Any ChannelType declaring a capability automatically inherits these fields
 * without requiring platform-specific frontend forms.
 */
export const CAPABILITY_CONFIG_SCHEMA: Readonly<
  Record<string, readonly CapabilityConfigField[]>
> = {
  orders: [
    {
      path: 'orders.readiness.releaseStatus',
      type: 'select',
      label: 'Order Release Status',
      description: 'Target workflow status assigned once an imported order passes validation.',
      options: ORDER_RELEASE_STATUSES,
      default: 'confirmed',
      readBy: 'backend',
    },
    {
      path: 'orders.reconciliation.holdOnCustomerMismatch',
      type: 'boolean',
      label: 'Hold Order on Customer Tax ID Mismatch',
      description: 'Places orders on hold when the billing tax ID conflicts with an existing CRM account.',
      default: true,
      readBy: 'backend',
    },
  ],
  stock: [
    {
      path: 'stock.syncMode',
      type: 'select',
      label: 'Stock Synchronization Mode',
      description: 'Determines whether stock writes replace exact quantities or apply incremental deltas.',
      options: STOCK_SYNC_MODES,
      default: 'absolute',
      readBy: 'backend',
    },
    {
      path: 'stock.safetyBuffer',
      type: 'number',
      label: 'Safety Stock Buffer',
      description: 'Units withheld from external channels to prevent overselling.',
      default: 0,
      readBy: 'backend',
    },
  ],
  prices: [
    {
      path: 'prices.taxMode',
      type: 'select',
      label: 'Price Tax Mode',
      description: 'Indicates whether prices pushed to or read from this channel include VAT.',
      options: PRICE_TAX_MODES,
      default: 'tax_excluded',
      readBy: 'backend',
    },
  ],
  invoices: [
    {
      path: 'invoices.autoIssueOnDelivery',
      type: 'boolean',
      label: 'Auto-Issue Invoice from Delivery Note',
      description: 'Automatically generates an ERP invoice when a delivery note is finalized.',
      default: false,
      readBy: 'orchestrator',
    },
  ],
};

export function getDefaultCapabilities(category: ChannelCategory | string): ChannelCapabilities {
  switch (category) {
    case 'ERP':
      return {
        products: true,
        prices: true,
        tariffs: true,
        stock: true,
        orders: false,
        categories: false,
        shipments: false,
        returns: false,
        delivery_notes: true,
        customers: true,
        companies: true,
        contacts: true,
        deals: false,
        invoices: true,
        credit_notes: true,
        discounts: true,
      };
    case 'B2B':
      return {
        products: true,
        prices: true,
        tariffs: true,
        stock: true,
        orders: true,
        categories: true,
        shipments: false,
        returns: false,
        delivery_notes: false,
        customers: true,
        companies: true,
        contacts: true,
        deals: false,
        invoices: false,
        credit_notes: false,
        discounts: true,
      };
    case '3PL':
      return {
        products: false,
        prices: false,
        tariffs: false,
        stock: false,
        orders: false,
        categories: false,
        shipments: true,
        returns: true,
        delivery_notes: false,
        customers: false,
        companies: false,
        contacts: false,
        deals: false,
        invoices: false,
        credit_notes: false,
        discounts: false,
      };
    case 'CRM':
      return {
        products: false,
        prices: false,
        tariffs: false,
        stock: false,
        orders: false,
        categories: false,
        shipments: false,
        returns: false,
        delivery_notes: false,
        customers: true,
        companies: true,
        contacts: true,
        deals: true,
        invoices: false,
        credit_notes: false,
        discounts: true,
      };
    case 'B2C':
    default:
      return {
        products: true,
        prices: true,
        tariffs: false,
        stock: true,
        orders: true,
        categories: true,
        shipments: false,
        returns: false,
        delivery_notes: false,
        customers: true,
        companies: false,
        contacts: false,
        deals: false,
        invoices: false,
        credit_notes: false,
        discounts: true,
      };
  }
}
