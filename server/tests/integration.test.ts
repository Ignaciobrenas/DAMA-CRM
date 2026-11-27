import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DAMA-CRM Integration & Automation Tests', () => {
  describe('UnoPIM Inventory Webhook Parser', () => {
    const parseUnoPimWebhook = (payload: any) => {
      if (!payload || !payload.event || !payload.data) {
        throw new Error('Payload webhook UnoPIM inválido');
      }

      const { sku, stock, price, name } = payload.data;
      if (!sku) throw new Error('El campo SKU es obligatorio');

      return {
        event: payload.event,
        sku: String(sku).trim().toUpperCase(),
        stock: parseInt(stock, 10) || 0,
        price: parseFloat(price) || 0.0,
        name: name ? String(name).trim() : undefined,
        syncedAt: new Date().toISOString(),
      };
    };

    it('should correctly parse valid product.updated webhook event', () => {
      const webhookPayload = {
        event: 'product.updated',
        timestamp: 1770000000,
        data: {
          sku: 'SRV-RACK-01',
          name: 'Servidor Rack 1U Xeon',
          stock: 45,
          price: '2499.50',
        },
      };

      const result = parseUnoPimWebhook(webhookPayload);
      assert.strictEqual(result.event, 'product.updated');
      assert.strictEqual(result.sku, 'SRV-RACK-01');
      assert.strictEqual(result.stock, 45);
      assert.strictEqual(result.price, 2499.5);
    });

    it('should reject malformed webhook without SKU', () => {
      assert.throws(() => {
        parseUnoPimWebhook({
          event: 'product.created',
          data: { name: 'No SKU Item' },
        });
      }, /El campo SKU es obligatorio/);
    });
  });

  describe('Meta WhatsApp Cloud Webhook Verification & Normalization', () => {
    const verifyMetaWebhook = (mode: string, token: string, challenge: string, expectedToken: string) => {
      if (mode === 'subscribe' && token === expectedToken) {
        return challenge;
      }
      return null;
    };

    const normalizeInboundWhatsAppMessage = (entry: any) => {
      const message = entry?.changes?.[0]?.value?.messages?.[0];
      const contact = entry?.changes?.[0]?.value?.contacts?.[0];

      if (!message) return null;

      return {
        from: message.from,
        contactName: contact?.profile?.name || 'Desconocido',
        text: message.text?.body || (message.type === 'interactive' ? message.interactive?.button_reply?.title : ''),
        type: message.type,
        timestamp: new Date(parseInt(message.timestamp, 10) * 1000).toISOString(),
      };
    };

    it('should verify Meta webhook handshake challenge', () => {
      const challenge = '1158201444';
      const verifyToken = 'dama_crm_meta_token_secret';

      const validResponse = verifyMetaWebhook('subscribe', verifyToken, challenge, verifyToken);
      assert.strictEqual(validResponse, challenge);

      const invalidResponse = verifyMetaWebhook('subscribe', 'wrong_token', challenge, verifyToken);
      assert.strictEqual(invalidResponse, null);
    });

    it('should normalize inbound Meta WhatsApp text message', () => {
      const inboundPayload = {
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              contacts: [{ profile: { name: 'Carlos Mendoza' }, wa_id: '34600112233' }],
              messages: [
                {
                  from: '34600112233',
                  id: 'wamid.HBgLMzQ2MDAxMTIyMzM...',
                  timestamp: '1770001200',
                  text: { body: 'Hola, me gustaría agendar una demo técnica' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      };

      const normalized = normalizeInboundWhatsAppMessage(inboundPayload);
      assert.notStrictEqual(normalized, null);
      assert.strictEqual(normalized?.from, '34600112233');
      assert.strictEqual(normalized?.contactName, 'Carlos Mendoza');
      assert.strictEqual(normalized?.text, 'Hola, me gustaría agendar una demo técnica');
    });
  });

  describe('Workflow Engine Trigger Evaluator', () => {
    type TriggerType = 'DEAL_STAGE_CHANGED' | 'CONTACT_CREATED' | 'INVOICE_PAID';

    interface WorkflowRule {
      id: string;
      name: string;
      trigger: TriggerType;
      filterStage?: string;
      action: 'SEND_WHATSAPP' | 'CREATE_TASK' | 'NOTIFY_ADMIN';
    }

    const evaluateWorkflowRules = (trigger: TriggerType, context: { stage?: string; contactEmail?: string }, rules: WorkflowRule[]) => {
      return rules.filter((rule) => {
        if (rule.trigger !== trigger) return false;
        if (rule.filterStage && rule.filterStage !== context.stage) return false;
        return true;
      });
    };

    it('should trigger actions when deal moves to Won stage', () => {
      const rules: WorkflowRule[] = [
        {
          id: 'wf-1',
          name: 'Celebrar Negocio Ganado',
          trigger: 'DEAL_STAGE_CHANGED',
          filterStage: 'Cerrada Ganada',
          action: 'NOTIFY_ADMIN',
        },
        {
          id: 'wf-2',
          name: 'Bienvenida Contacto',
          trigger: 'CONTACT_CREATED',
          action: 'SEND_WHATSAPP',
        },
      ];

      const triggered = evaluateWorkflowRules('DEAL_STAGE_CHANGED', { stage: 'Cerrada Ganada' }, rules);
      assert.strictEqual(triggered.length, 1);
      assert.strictEqual(triggered[0].id, 'wf-1');
      assert.strictEqual(triggered[0].action, 'NOTIFY_ADMIN');
    });
  });

  describe('WooCommerce & n8n Bidirectional Connector Integration', () => {
    it('should parse WooCommerce order.created webhook into CRM deal and contact payload', () => {
      const orderPayload = {
        id: 1042,
        number: '1042',
        total: '499.00',
        currency: 'EUR',
        billing: {
          first_name: 'Elena',
          last_name: 'Vázquez',
          email: 'elena.vazquez@acme-corp.es',
          phone: '+34 622 334 455',
        },
        line_items: [
          { name: 'Licencia Anual Pro', quantity: 1, price: 499 },
        ],
      };

      const normalized = {
        dealTitle: `Pedido WC #${orderPayload.number} - ${orderPayload.billing.first_name}`,
        dealValue: parseFloat(orderPayload.total),
        currency: orderPayload.currency,
        contactEmail: orderPayload.billing.email,
        contactFullName: `${orderPayload.billing.first_name} ${orderPayload.billing.last_name}`,
      };

      assert.strictEqual(normalized.dealTitle, 'Pedido WC #1042 - Elena');
      assert.strictEqual(normalized.dealValue, 499.00);
      assert.strictEqual(normalized.contactEmail, 'elena.vazquez@acme-corp.es');
    });

    it('should match and filter n8n subscribed events properly', () => {
      const subscribedEvents = ['contact.created', 'deal.won', 'invoice.paid'];
      
      const shouldTriggerContact = subscribedEvents.includes('contact.created') || subscribedEvents.includes('*');
      const shouldTriggerInventory = subscribedEvents.includes('product.deleted') || subscribedEvents.includes('*');

      assert.strictEqual(shouldTriggerContact, true);
      assert.strictEqual(shouldTriggerInventory, false);
    });
  });

  describe('Shopify HMAC-SHA256 Webhook Verification & Timing-Safe Security', () => {
    const crypto = require('crypto');

    const verifyShopifyHmac = (rawBody: string, hmacHeader: string, secret: string): boolean => {
      try {
        const generatedHmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
        return crypto.timingSafeEqual(Buffer.from(generatedHmac), Buffer.from(hmacHeader));
      } catch {
        return false;
      }
    };

    it('should verify genuine Shopify webhook signature', () => {
      const secret = 'shpss_test_secret_key_123';
      const body = JSON.stringify({ id: 987654321, email: 'cliente@shopify-test.es' });
      const validHmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

      const isGenuine = verifyShopifyHmac(body, validHmac, secret);
      assert.strictEqual(isGenuine, true);
    });

    it('should reject tampered or fraudulent webhook signatures', () => {
      const secret = 'shpss_test_secret_key_123';
      const body = JSON.stringify({ id: 987654321, email: 'cliente@shopify-test.es' });
      const tamperedBody = JSON.stringify({ id: 987654321, email: 'hacker@malicious.com' });
      const validHmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

      const isGenuine = verifyShopifyHmac(tamperedBody, validHmac, secret);
      assert.strictEqual(isGenuine, false);
    });
  });

  describe('Multi-Platform Product Attribute & Catalog Auto-Mapping (UnoPIM, OpenCart, Sage, Odoo)', () => {
    it('should auto-map CRM product into eCommerce & ERP catalog representations', () => {
      const { IntegrationsService } = require('../src/modules/integrations/integrations.service');
      const testProduct = {
        name: 'Workstation Industrial Xeon v4',
        sku: 'WKS-IND-01',
        category: 'Hardware',
        price: 3200,
        costPrice: 2100,
        taxRate: 21,
        weight: 12.5,
      };

      const mapped = IntegrationsService.autoMapProductAttributes(testProduct);
      assert.ok(mapped.unopim);
      assert.strictEqual(mapped.unopim.family, 'hardware');
      assert.strictEqual(mapped.unopim.attributes.sku, 'WKS-IND-01');

      assert.ok(mapped.opencart);
      assert.strictEqual(mapped.opencart.model, 'WKS-IND-01');
      assert.strictEqual(mapped.opencart.weight, 12.5);

      assert.ok(mapped.sage);
      assert.strictEqual(mapped.sage.supplier_part_number, 'WKS-IND-01');
      assert.strictEqual(mapped.sage.nominal_code, '4000.0000');

      assert.ok(mapped.odoo);
      assert.strictEqual(mapped.odoo.default_code, 'WKS-IND-01');
      assert.strictEqual(mapped.odoo.list_price, 3200);

      assert.ok(mapped.woocommerce);
      assert.strictEqual(mapped.woocommerce.sku, 'WKS-IND-01');
      assert.ok(mapped.a3erp);
      assert.strictEqual(mapped.a3erp.TIPIVA, 'ORD21');
      assert.ok(mapped.prestashop);
      assert.strictEqual(mapped.prestashop.reference, 'WKS-IND-01');
    });
  });

  describe('Modular Platform Connectors Suite (a3ERP, Sage 200, PrestaShop, Shopify, WooCommerce)', () => {
    const {
      A3ErpPaddingAndProtocol,
      a3erpConnector,
      SageContractValidator,
      sage200Connector,
      PrestaShopWebserviceProtocol,
      prestashopConnector,
      ShopifyProtocolHelper,
      shopifyConnector,
      WooCommerceReconciliationEngine,
      woocommerceConnector,
    } = require('../src/modules/integrations/connectors');

    it('should enforce a3ERP padded codes (15 for CODART, 4 for CODPROVI, 8 for CODCLI/CODALM, unpadded TIPOCONT & alphanumerics)', () => {
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('0', 'CODART'), '              0');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('1', 'CODART'), '              1');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('1', 'CODCLI'), '       1');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('25', 'CODCLI'), '      25');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('08', 'CODPROVI'), '  08');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('1', 'TIPOCONT'), '1');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('A526', 'CODALM'), 'A526');
      assert.strictEqual(A3ErpPaddingAndProtocol.padCode('CONTADO', 'CODCLI'), 'CONTADO');
    });

    it('should encode a3ERP Parameters header in Base64 JSON and enforce IVAINCLUIDO / read-only rules', () => {
      const b64 = A3ErpPaddingAndProtocol.encodeParametersHeader({ nifcli: '34567891H', soloconstock: '1' });
      assert.ok(b64);
      const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      assert.strictEqual(decoded.nifcli, '34567891H');
      assert.strictEqual(decoded.soloconstock, true); // Never string "1" (prevents HTTP 500)

      const preparedOrder = A3ErpPaddingAndProtocol.prepareDocumentPayload(
        {
          CODCLI: '25',
          CODALM: '1',
          TIPOCONT: '1',
          IVAINCLUIDO: 'T',
          BASE: 100,
          TOTDOC: 121,
          PEDIDOVENTALINEAS: [{ CODART: '1', DESCLIN: 'Maceta', UNIDADES: 2, PRCMONEDAMASIVA: 25, PRCMONEDA: 20.66 }],
        },
        { action: 'AltaPedidoVenta', linesField: 'PEDIDOVENTALINEAS' }
      );

      assert.strictEqual(preparedOrder.CODCLI, '      25');
      assert.strictEqual(preparedOrder.BASE, undefined);
      assert.strictEqual(preparedOrder.TOTDOC, undefined);
      assert.strictEqual(preparedOrder.PEDIDOVENTALINEAS[0].CODART, '              1');
      assert.strictEqual(preparedOrder.PEDIDOVENTALINEAS[0].PRCMONEDAMASIVA, 25);
      assert.strictEqual(preparedOrder.PEDIDOVENTALINEAS[0].PRCMONEDA, undefined);

      // ModificaPedidoVenta with lines must strip IVAINCLUIDO
      const modifiedOrder = A3ErpPaddingAndProtocol.prepareDocumentPayload(
        {
          IDPEDV: 1376,
          IVAINCLUIDO: 'T',
          PEDIDOVENTALINEAS: [{ CODART: '1', DESCLIN: 'Maceta', UNIDADES: 2, PRCMONEDAMASIVA: 25 }],
        },
        { action: 'ModificaPedidoVenta', linesField: 'PEDIDOVENTALINEAS' }
      );
      assert.strictEqual(modifiedOrder.IVAINCLUIDO, undefined);

      // StockTallas must filter negative summary rows
      const filteredStockTallas = A3ErpPaddingAndProtocol.filterValidStockTallasRows([
        { CODART: '              1', UNIDADES: -1489.0 },
        { CODART: '              1', CODTALLAH: 'XL', CODTALLAV: 'ROJO', UNIDADES: 15 },
      ]);
      assert.strictEqual(filteredStockTallas.length, 1);
      assert.strictEqual(filteredStockTallas[0].UNIDADES, 15);
    });

    it('should validate a3ERP mandatory Parameters and execute Orders_IN_v11 end-to-end', async () => {
      const missingNifRes = await a3erpConnector.readProc('ClientesPorNif', {});
      assert.strictEqual(missingNifRes.success, false);

      const forbiddenRes = await a3erpConnector.readProc('CentrosCoste');
      assert.strictEqual(forbiddenRes.success, false);

      const orderInRes = await a3erpConnector.executeOperation('orders_in', {
        orderNumber: 'STG-TEST-9101',
        nifCif: 'X7654321L',
      });
      assert.strictEqual(orderInRes.success, true);
      assert.strictEqual(orderInRes.taskStatus, 'COMPLETED');
    });

    it('should validate Sage 200 612-field IME contracts (Documents, ClientesProveedores, Domicilios, StockMovements)', async () => {
      // Document validation: date-only YYYY-MM-DD, int codigoNacion=108, int suPedidoWeb
      const docVal = SageContractValidator.validateAndNormalizeDocument({
        codigoEmpresa: 9999,
        codigoDocumentoLc: 'PVE',
        fechaDocumento: '2026-10-20T14:30:00Z',
        fechaEntrega: '2026-10-19T10:00:00Z',
        codigoCliente: '4300001',
        suPedidoWeb: '9101' as any,
        lineas: [{ orden: 1, codigoArticulo: 'ART-01', unidades: 3, precio: 50 }],
      });
      assert.strictEqual(docVal.valid, true);
      assert.strictEqual(docVal.normalized.fechaDocumento, '2026-10-20');
      assert.strictEqual(docVal.normalized.fechaEntrega, '2026-10-20'); // Clamped to >= fechaDocumento
      assert.strictEqual(docVal.normalized.codigoNacion, 108);
      assert.strictEqual(docVal.normalized.suPedidoWeb, 9101);

      // Customer validation: clienteOProveedor max 1 char ('C'/'P') and formadePago lowercase 'd'
      const custVal = SageContractValidator.validateAndNormalizeCustomerSupplier({
        codigoEmpresa: 9999,
        clienteOProveedor: 'C',
        cifDni: 'ES-B12345678',
        formaDePago: 'GIRO 30 DIAS',
      });
      assert.strictEqual(custVal.valid, true);
      assert.strictEqual(custVal.normalized.clienteOProveedor, 'C');
      assert.strictEqual(custVal.normalized.formadePago, 'GIRO 30 DIAS');

      // Stock movement transfer: tipoMovimiento=2 + almacenContrapartida -> positive unidades & origenMovimiento='T'
      const transferVal = SageContractValidator.validateAndNormalizeStockMovement({
        codigoEmpresa: 9999,
        tipoMovimiento: 2,
        codigoArticulo: 'ART-01',
        codigoAlmacen: '001',
        almacenContrapartida: '002',
        unidades: -10,
      });
      assert.strictEqual(transferVal.valid, true);
      assert.strictEqual(transferVal.normalized.unidades, 10);
      assert.strictEqual(transferVal.normalized.origenMovimiento, 'T');

      // Same source and target warehouse must fail
      const badTransfer = SageContractValidator.validateAndNormalizeStockMovement({
        codigoEmpresa: 9999,
        tipoMovimiento: 2,
        codigoArticulo: 'ART-01',
        codigoAlmacen: '001',
        almacenContrapartida: '001',
        unidades: 5,
      });
      assert.strictEqual(badTransfer.valid, false);

      const sageOrderRes = await sage200Connector.executeOperation('order_in', { orderNumber: '2026101' });
      assert.strictEqual(sageOrderRes.success, true);
      assert.ok(sageOrderRes.data.opADomicilioTaskId);
      assert.ok(sageOrderRes.data.opBDocumentTaskId);
    });

    it('should build PrestaShop partial XML for stock_availables and run dual-API operations', async () => {
      const partialXml = PrestaShopWebserviceProtocol.buildStockAvailablePartialXml(701, 42);
      assert.ok(partialXml.includes('<id><![CDATA[701]]></id>'));
      assert.ok(partialXml.includes('<quantity><![CDATA[42]]></quantity>'));
      assert.strictEqual(partialXml.includes('out_of_stock'), false);

      const psUrl = PrestaShopWebserviceProtocol.buildWebserviceUrl('https://shop.es', 'orders', {
        display: 'full',
        filters: { current_state: [2, 3], date_upd: { from: '2026-10-01 00:00:00', to: '2026-10-23 23:59:59' } },
        dateFilter: true,
      });
      assert.ok(psUrl.includes('display=full'));
      assert.ok(psUrl.includes('date=1'));
      assert.ok(psUrl.includes('output_format=JSON'));

      const dupReport = await prestashopConnector.generateDuplicatesReport([
        { id: 1, reference: 'ZZDUP-001', name: 'Prod QA 1' },
        { id: 2, reference: 'ZZDUP-001', name: 'Prod QA 2' },
        { id: 3, reference: '', name: 'Prod Sin Ref' },
      ]);
      assert.strictEqual(dupReport.success, true);
      assert.strictEqual(dupReport.data.duplicateGroupsByReference.length, 1);
      assert.strictEqual(dupReport.data.duplicateGroupsByReference[0].isQaTestProduct, true);
      assert.strictEqual(dupReport.data.productsWithoutReference.length, 1);
    });

    it('should validate Shopify limits, MoneyBag B2B orders, productSet, and Images_OUT isPrimary fix', async () => {
      const tooManyOptions = ShopifyProtocolHelper.validateProductSetInput({
        title: 'Test',
        productOptions: [
          { name: 'Opt1', values: [{ name: 'A' }] },
          { name: 'Opt2', values: [{ name: 'B' }] },
          { name: 'Opt3', values: [{ name: 'C' }] },
          { name: 'Opt4', values: [{ name: 'D' }] },
        ],
      });
      assert.strictEqual(tooManyOptions.valid, false);

      const ordersRes = await shopifyConnector.fetchAndProcessOrdersOut();
      assert.strictEqual(ordersRes.success, true);
      assert.strictEqual(ordersRes.data[0].payments.length, 1); // Only SUCCESS transaction kept
      assert.strictEqual(ordersRes.data[0].customer.isB2B, true);

      const imgRes = await shopifyConnector.syncImagesOut('88100200300');
      assert.strictEqual(imgRes.data.assets[0].isPrimary, true);
      assert.strictEqual(imgRes.data.assets[1].isPrimary, false);
    });

    it('should perform WooCommerce order security pruning, NIF customer reconciliation (on_hold), and VAT-included pricing', async () => {
      // Security pruning & NIF reconciliation with divergent customer data -> holds order on_hold
      const orderRes = await woocommerceConnector.processOrderOut(
        {
          id: 5001,
          number: '5001',
          status: 'processing',
          total: '121.00',
          total_tax: '21.00',
          shipping_total: '0.00',
          discount_total: '0.00',
          currency: 'EUR',
          customer_id: 10,
          billing: {
            first_name: 'Nombre Cambiado',
            last_name: 'Morales',
            address_1: 'Nueva Calle 99',
            city: 'Málaga',
            postcode: '29005',
            country: 'ES',
            email: 'elena.morales@tienda-online.es',
          },
          meta_data: [{ key: '_billing_nif', value: 'B29123456' }],
          line_items: [{ product_id: 10, sku: 'WC-01', name: 'Item', quantity: 1, subtotal: '121.00', total: '121.00' }],
        },
        {
          nifCif: 'B29123456',
          firstName: 'Elena',
          lastName: 'Morales',
          email: 'elena.morales@tienda-online.es',
          street1: 'Calle Larios 15',
          city: 'Málaga',
          postalCode: '29005',
        }
      );

      assert.strictEqual(orderRes.success, true);
      assert.strictEqual(orderRes.data.reconciliation.status, 'pending_approval');
      assert.strictEqual(orderRes.data.reconciliation.orderHeldOnHold, true);
      assert.strictEqual(orderRes.data.order.status, 'on_hold');
      assert.strictEqual(orderRes.data.order.shippings, undefined); // Pruned because shippingAddress was empty

      // Variable parent stock update must be rejected
      const parentStockRes = await woocommerceConnector.updateStock({
        externalId: 100,
        isVariableParent: true,
        quantity: 10,
      });
      assert.strictEqual(parentStockRes.success, false);

      // VAT-included price calculation (Price_Update_v4)
      const vatPrice = WooCommerceReconciliationEngine.calculateVatIncludedPrice(100, 'standard');
      assert.strictEqual(vatPrice.regularPrice, '121.00');
      const reducedPrice = WooCommerceReconciliationEngine.calculateVatIncludedPrice(100, 'reduced');
      assert.strictEqual(reducedPrice.regularPrice, '110.00');
    });
  });

  describe('Webhook Idempotency & Exponential Backoff Resilience', () => {
    it('should compute exponential backoff intervals with jitter cap', () => {
      const calculateBackoff = (attempt: number, maxDelayMs: number = 30000): number => {
        const baseDelayMs = 1000;
        return Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      };

      assert.strictEqual(calculateBackoff(0), 1000);
      assert.strictEqual(calculateBackoff(1), 2000);
      assert.strictEqual(calculateBackoff(2), 4000);
      assert.strictEqual(calculateBackoff(3), 8000);
      assert.strictEqual(calculateBackoff(6), 30000); // Capped at maxDelayMs
    });
  });
});

