import { ConnectorRegistry } from '../core/connector.registry';
import { a3erpConnector } from './a3erp';
import { sage200Connector, sage50Connector, sageOneConnector } from './sage';
import { prestashopConnector } from './prestashop';
import { shopifyConnector } from './shopify';
import { woocommerceConnector } from './woocommerce';
import {
  googleCalendarConnector,
  n8nConnector,
  odooConnector,
  opencartConnector,
  stripeConnector,
  zapierConnector,
} from './ecosystem';

const ALL_CONNECTORS = [
  a3erpConnector,
  sage200Connector,
  sage50Connector,
  sageOneConnector,
  prestashopConnector,
  shopifyConnector,
  woocommerceConnector,
  odooConnector,
  opencartConnector,
  n8nConnector,
  stripeConnector,
  zapierConnector,
  googleCalendarConnector,
];

for (const connector of ALL_CONNECTORS) {
  ConnectorRegistry.register(connector);
}

export * from './a3erp';
export * from './sage';
export * from './prestashop';
export * from './shopify';
export * from './woocommerce';
export * from './ecosystem';
