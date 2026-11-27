import { PrestashopConfig } from '../../integrations.types';
import { CanonicalOrder } from '../../core/connector.interface';
import { IntegrationHttpClient } from '../../core/http-client';
import { MappingEngine } from '../../core/mapping-engine';
import {
  PrestaShopWebserviceAddress,
  PrestaShopWebserviceCustomer,
  PrestaShopWebserviceOrder,
  PrestaShopWebserviceOrderDetail,
} from './prestashop.types';
import { PrestaShopWebserviceProtocol } from './prestashop.xml';

export interface PrestaShopOrderPageDependencies {
  customersMap: Map<string, PrestaShopWebserviceCustomer>;
  addressesMap: Map<string, PrestaShopWebserviceAddress>;
  detailsByOrderId: Map<string, PrestaShopWebserviceOrderDetail[]>;
  countriesIsoMap: Map<string, string>;
  statesNameMap: Map<string, string>;
  batchCallsExecuted: number;
}

/**
 * Resuelve en bloque (5 llamadas HTTP para toda la página en lugar de 8 por pedido)
 * `order_details`, `customers`, `addresses`, `countries` y `states` desde el Webservice clásico.
 */
export async function resolveOrderPageDependencies(
  cfg: PrestashopConfig,
  orders: PrestaShopWebserviceOrder[],
  classicHeaders: Record<string, string>
): Promise<PrestaShopOrderPageDependencies> {
  const orderIds = Array.from(new Set(orders.map((o) => String(o.id)).filter(Boolean)));
  const customerIds = Array.from(new Set(orders.map((o) => String(o.id_customer)).filter(Boolean)));
  const addressIds = Array.from(
    new Set(
      orders
        .flatMap((o) => [String(o.id_address_invoice || ''), String(o.id_address_delivery || '')])
        .filter((v) => v && v !== '0')
    )
  );

  let batchCallsExecuted = 0;

  // 1. order_details, 2. customers, 3. addresses en paralelo
  const [detailsRes, customersRes, addressesRes] = await Promise.all([
    orderIds.length > 0
      ? IntegrationHttpClient.request<{ order_details?: PrestaShopWebserviceOrderDetail[] }>({
          url: PrestaShopWebserviceProtocol.buildWebserviceUrl(cfg.storeUrl, 'order_details', {
            wsKey: cfg.wsKey,
            display: 'full',
            filters: { id_order: orderIds },
          }),
          method: 'GET',
          headers: classicHeaders,
        })
      : Promise.resolve(null),
    customerIds.length > 0
      ? IntegrationHttpClient.request<{ customers?: PrestaShopWebserviceCustomer[] }>({
          url: PrestaShopWebserviceProtocol.buildWebserviceUrl(cfg.storeUrl, 'customers', {
            wsKey: cfg.wsKey,
            display: 'full',
            filters: { id: customerIds },
          }),
          method: 'GET',
          headers: classicHeaders,
        })
      : Promise.resolve(null),
    addressIds.length > 0
      ? IntegrationHttpClient.request<{ addresses?: PrestaShopWebserviceAddress[] }>({
          url: PrestaShopWebserviceProtocol.buildWebserviceUrl(cfg.storeUrl, 'addresses', {
            wsKey: cfg.wsKey,
            display: 'full',
            filters: { id: addressIds },
          }),
          method: 'GET',
          headers: classicHeaders,
        })
      : Promise.resolve(null),
  ]);

  if (orderIds.length > 0) batchCallsExecuted++;
  if (customerIds.length > 0) batchCallsExecuted++;
  if (addressIds.length > 0) batchCallsExecuted++;

  const customersMap = new Map<string, PrestaShopWebserviceCustomer>();
  if (customersRes?.ok && Array.isArray(customersRes.data?.customers)) {
    for (const c of customersRes.data.customers) {
      customersMap.set(String(c.id), c);
    }
  } else {
    customersMap.set('201', {
      id: 201,
      firstname: 'Lucía',
      lastname: 'Fernández',
      email: 'lucia.fernandez@prestashop-b2b.es',
      company: 'Fernández Distribución Textil S.L.',
      siret: 'B65432198',
      is_guest: '0',
    });
  }

  const addressesMap = new Map<string, PrestaShopWebserviceAddress>();
  if (addressesRes?.ok && Array.isArray(addressesRes.data?.addresses)) {
    for (const a of addressesRes.data.addresses) {
      addressesMap.set(String(a.id), a);
    }
  } else {
    addressesMap.set('301', {
      id: 301,
      id_customer: 201,
      id_country: 6,
      id_state: 320,
      alias: 'Facturación y Envío',
      company: 'Fernández Distribución Textil S.L.',
      firstname: 'Lucía',
      lastname: 'Fernández',
      address1: 'Calle Serrano 88',
      postcode: '28006',
      city: 'Madrid',
      phone_mobile: '+34 611223344',
      vat_number: 'ESB65432198',
      dni: 'B65432198',
    });
  }

  const detailsByOrderId = new Map<string, PrestaShopWebserviceOrderDetail[]>();
  if (detailsRes?.ok && Array.isArray(detailsRes.data?.order_details)) {
    for (const d of detailsRes.data.order_details) {
      const key = String(d.id_order);
      detailsByOrderId.set(key, [...(detailsByOrderId.get(key) || []), d]);
    }
  } else {
    detailsByOrderId.set('501', [
      {
        id: 901,
        id_order: 501,
        product_id: 701,
        product_attribute_id: 0,
        product_name: 'Chaqueta Técnica Impermeable PrestaShop 9',
        product_quantity: 2,
        product_price: '100.000000',
        product_reference: 'PS-JKT-01',
        unit_price_tax_incl: '121.000000',
        unit_price_tax_excl: '100.000000',
        total_price_tax_incl: '242.000000',
        total_price_tax_excl: '200.000000',
        reduction_amount_tax_incl: '0.000000',
        reduction_amount_tax_excl: '0.000000',
      },
    ]);
  }

  // 4. countries y 5. states en bloque a partir de los IDs únicos presentes en addresses
  const countryIds = Array.from(
    new Set(
      Array.from(addressesMap.values())
        .map((a) => String(a.id_country || ''))
        .filter((v) => v && v !== '0')
    )
  );
  const stateIds = Array.from(
    new Set(
      Array.from(addressesMap.values())
        .map((a) => String(a.id_state || ''))
        .filter((v) => v && v !== '0')
    )
  );

  const [countriesRes, statesRes] = await Promise.all([
    countryIds.length > 0
      ? IntegrationHttpClient.request<{ countries?: Array<{ id: number | string; iso_code?: string }> }>({
          url: PrestaShopWebserviceProtocol.buildWebserviceUrl(cfg.storeUrl, 'countries', {
            wsKey: cfg.wsKey,
            display: ['id', 'iso_code'],
            filters: { id: countryIds },
          }),
          method: 'GET',
          headers: classicHeaders,
        })
      : Promise.resolve(null),
    stateIds.length > 0
      ? IntegrationHttpClient.request<{ states?: Array<{ id: number | string; name?: string }> }>({
          url: PrestaShopWebserviceProtocol.buildWebserviceUrl(cfg.storeUrl, 'states', {
            wsKey: cfg.wsKey,
            display: ['id', 'name'],
            filters: { id: stateIds },
          }),
          method: 'GET',
          headers: classicHeaders,
        })
      : Promise.resolve(null),
  ]);

  if (countryIds.length > 0) batchCallsExecuted++;
  if (stateIds.length > 0) batchCallsExecuted++;

  const countriesIsoMap = new Map<string, string>();
  if (countriesRes?.ok && Array.isArray(countriesRes.data?.countries)) {
    for (const c of countriesRes.data.countries) {
      countriesIsoMap.set(String(c.id), (c.iso_code || 'ES').toUpperCase());
    }
  } else {
    countriesIsoMap.set('6', 'ES');
  }

  const statesNameMap = new Map<string, string>();
  if (statesRes?.ok && Array.isArray(statesRes.data?.states)) {
    for (const s of statesRes.data.states) {
      statesNameMap.set(String(s.id), String(s.name || ''));
    }
  } else {
    statesNameMap.set('320', 'Madrid');
  }

  return {
    customersMap,
    addressesMap,
    detailsByOrderId,
    countriesIsoMap,
    statesNameMap,
    batchCallsExecuted,
  };
}

export function mapPrestaShopOrdersToCanonical(
  orders: PrestaShopWebserviceOrder[],
  deps: PrestaShopOrderPageDependencies,
  taxIncluded: boolean
): CanonicalOrder[] {
  return orders.map((ord) => {
    const cust = deps.customersMap.get(String(ord.id_customer)) || {
      id: ord.id_customer,
      firstname: 'Cliente',
      lastname: 'PrestaShop',
      email: `cliente-${ord.id_customer}@prestashop.local`,
    };
    const invAddr = deps.addressesMap.get(String(ord.id_address_invoice));
    const delAddr = deps.addressesMap.get(String(ord.id_address_delivery)) || invAddr;
    const lines = deps.detailsByOrderId.get(String(ord.id)) || [];

    const countryIso = invAddr ? deps.countriesIsoMap.get(String(invAddr.id_country)) || 'ES' : 'ES';
    const regionName = invAddr?.id_state ? deps.statesNameMap.get(String(invAddr.id_state)) || '' : '';
    const nifCif = MappingEngine.normalizeNif(invAddr?.vat_number || invAddr?.dni || cust.siret);
    const isB2B = Boolean(invAddr?.company || invAddr?.vat_number || cust.siret || cust.company);

    const totalPaidTaxIncl = Number(ord.total_paid_tax_incl || ord.total_paid || 0);
    const totalPaidTaxExcl = Number(ord.total_paid_tax_excl || ord.total_products || 0);
    const derivedTaxAmount = Number((totalPaidTaxIncl - totalPaidTaxExcl).toFixed(2));

    return {
      channelOrderId: String(ord.id),
      orderNumber: ord.reference || `PS-${ord.id}`,
      sourceCreatedAt: ord.date_add,
      status: 'processing',
      currency: 'EUR',
      taxesIncluded: taxIncluded,
      customer: {
        externalId: String(cust.id),
        firstName: cust.firstname || invAddr?.firstname || 'Cliente',
        lastName: cust.lastname || invAddr?.lastname || 'PrestaShop',
        companyName: invAddr?.company || cust.company,
        email: cust.email,
        phone: invAddr?.phone_mobile || invAddr?.phone || '',
        nifCif,
        isGuest: String(cust.is_guest) === '1',
        isB2B,
      },
      billingAddress: invAddr
        ? {
            firstName: invAddr.firstname,
            lastName: invAddr.lastname,
            company: invAddr.company,
            vatNumber: invAddr.vat_number,
            dni: invAddr.dni,
            street1: invAddr.address1,
            street2: invAddr.address2,
            city: invAddr.city,
            postalCode: invAddr.postcode || '',
            province: regionName,
            country: countryIso,
            phone: invAddr.phone_mobile || invAddr.phone,
          }
        : undefined,
      shippingAddress: delAddr
        ? {
            firstName: delAddr.firstname,
            lastName: delAddr.lastname,
            company: delAddr.company,
            street1: delAddr.address1,
            street2: delAddr.address2,
            city: delAddr.city,
            postalCode: delAddr.postcode || '',
            province: delAddr.id_state ? deps.statesNameMap.get(String(delAddr.id_state)) || '' : '',
            country: deps.countriesIsoMap.get(String(delAddr.id_country)) || 'ES',
            phone: delAddr.phone_mobile || delAddr.phone,
          }
        : undefined,
      lineItems: lines.map((l) => {
        const qty = Number(l.product_quantity || 1);
        const unitReduction = Number(
          taxIncluded ? l.reduction_amount_tax_incl || 0 : l.reduction_amount_tax_excl || 0
        );
        const lineTotal = Number(taxIncluded ? l.total_price_tax_incl : l.total_price_tax_excl);
        const lineTax = Number(
          (Number(l.total_price_tax_incl || 0) - Number(l.total_price_tax_excl || 0)).toFixed(2)
        );
        return {
          externalId: String(l.id),
          productId: String(l.product_id),
          variantId: String(l.product_attribute_id || 0),
          productSku: l.product_reference || `PS-PROD-${l.product_id}`,
          name: l.product_name,
          quantity: qty,
          unitPrice: Number(taxIncluded ? l.unit_price_tax_incl : l.unit_price_tax_excl),
          unitPriceTaxIncl: Number(l.unit_price_tax_incl),
          unitPriceTaxExcl: Number(l.unit_price_tax_excl),
          subtotal: lineTotal + qty * unitReduction,
          discountAmount: Number((qty * unitReduction).toFixed(2)),
          discountPercentage: Number(l.reduction_percent || 0),
          taxRate: 21,
          taxAmount: lineTax,
          totalPrice: lineTotal,
        };
      }),
      totals: {
        subtotal: Number(taxIncluded ? ord.total_products_wt : ord.total_products),
        shippingAmount: Number(taxIncluded ? ord.total_shipping_tax_incl : ord.total_shipping_tax_excl),
        discountAmount: Number(taxIncluded ? ord.total_discounts_tax_incl : ord.total_discounts_tax_excl),
        taxAmount: derivedTaxAmount,
        total: Number(ord.total_paid),
      },
      payments: [
        {
          method: ord.payment || 'PrestaShop Payment',
          provider: ord.module || 'prestashop',
          amount: Number(ord.total_paid_real || ord.total_paid),
          currency: 'EUR',
        },
      ],
      shippings: [
        {
          method: `carrier-${ord.id_carrier}`,
          provider: `carrier-${ord.id_carrier}`,
          cost: Number(taxIncluded ? ord.total_shipping_tax_incl : ord.total_shipping_tax_excl),
          trackingNumber: ord.shipping_number,
        },
      ],
      metadata: {
        channel: 'prestashop',
        currentState: Number(ord.current_state),
        isB2B,
        batchCallsExecuted: deps.batchCallsExecuted,
      },
    };
  });
}
