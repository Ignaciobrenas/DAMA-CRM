import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  A3ErpWorkflowHelpers,
  a3erpConnector,
  SageContractValidator,
  sage200Connector,
  PrestaShopMediaUploader,
  prestashopConnector,
  shopifyConnector,
  woocommerceConnector,
} from '../src/modules/integrations/connectors';
import {
  ConnectorRegistry,
  IntegrationsConfigStore,
  buildThirdPartyIntegrationsCatalog,
} from '../src/modules/integrations/core';

describe('Full Platform Connectors Protocol & Workflow Suite', () => {
  describe('Core Registry & Third-Party Catalog', () => {
    it('should register all modular platform connectors and expose the 15-app catalog', () => {
      const registered = ConnectorRegistry.getAll().map((c) => c.id);
      for (const expected of ['a3erp', 'sage_200', 'prestashop', 'shopify', 'woocommerce']) {
        assert.ok(registered.includes(expected as any), `Missing registered connector: ${expected}`);
      }

      const publicCfg = IntegrationsConfigStore.getPublicConfig();
      const catalog = buildThirdPartyIntegrationsCatalog(publicCfg, 'https://crm.dama.local');
      assert.strictEqual(catalog.length, 15);
      assert.ok(catalog.some((a) => a.id === 'a3erp'));
      assert.ok(catalog.some((a) => a.id === 'sage_200'));
      assert.ok(catalog.some((a) => a.id === 'prestashop'));
      assert.ok(catalog.some((a) => a.id === 'shopify'));
      assert.ok(catalog.some((a) => a.id === 'woocommerce'));
    });
  });

  describe('a3ERP Full Workflows (Sit.a3ERP.Api REST v2.4)', () => {
    it('should extract article variants when TALLAS !== F and filter StockTallas negative summary rows', async () => {
      const variants = A3ErpWorkflowHelpers.extractArticleVariants({
        CODART: '              1',
        ID: 2,
        DESCART: 'Kit Industrial',
        PRCVENTA: 100,
        PRCSTANDARD: 100,
        TIPIVA: 'ORD21',
        OBSOLETO: 'F',
        BLOQUEADO: 'F',
        TALLAS: 'SML',
        UNIDADESSTOCK: 30,
        grupoTalla_: { talla1: 'S', talla2: 'M', talla3: 'L' },
        coloresDisponibles: [{ codigoColor_: 'NEG', color: { color_: 'Negro' } }],
        codigoAlternativo: 'ALT-01',
      });
      assert.strictEqual(variants.length, 3);
      assert.strictEqual(variants[0].sku, '1-S-NEG');
      assert.strictEqual(variants[0].alternativeCode, 'ALT-01');

      const stockRes = await a3erpConnector.readStockWithTallas('1');
      assert.strictEqual(stockRes.success, true);
      assert.strictEqual(stockRes.data!.filteredOutNegativeSummaryRows, 1);
      assert.ok(stockRes.data!.stockTallas.every((row) => row.UNIDADES >= 0));
    });

    it('should execute readAllPages, readReplog, softDeleteCliente, facturaAlbaranVenta, and imprimeFactura PDF', async () => {
      const allPages = await a3erpConnector.readAllPages('Articulos', undefined, 50, 5);
      assert.strictEqual(allPages.success, true);
      assert.ok((allPages.data?.length || 0) >= 2);

      const replog = await a3erpConnector.readReplog('2026-01-01T00:00:00');
      assert.strictEqual(replog.success, true);
      assert.ok(Array.isArray(replog.data));

      const softDel = await a3erpConnector.softDeleteCliente('25');
      assert.strictEqual(softDel.success, true);
      assert.strictEqual(softDel.data?.CODCLI, '      25');
      assert.strictEqual(softDel.data?.OBSOLETO, 'T');
      assert.strictEqual(softDel.data?.BLOQUEADO, 'T');

      const missingAlbaran = await a3erpConnector.facturaAlbaranVenta({});
      assert.strictEqual(missingAlbaran.success, false);

      const factRes = await a3erpConnector.facturaAlbaranVenta({ IDALBV: 500, SERIE: 'FAC' });
      assert.strictEqual(factRes.success, true);
      assert.strictEqual(factRes.taskStatus, 'COMPLETED');

      const pdfRes = await a3erpConnector.imprimeFactura('venta', 1001);
      assert.strictEqual(pdfRes.success, true);
      assert.strictEqual(pdfRes.data?.mimeType, 'application/pdf');
      assert.ok(Buffer.from(pdfRes.data!.pdfBase64, 'base64').toString('utf8').startsWith('%PDF'));
    });

    it('should execute ensure_customer and reject legacy AltaDireccion cleanly', async () => {
      const ensureRes = await a3erpConnector.executeOperation('ensure_customer', {
        nifCif: '34567891H',
        firstName: 'Marta',
        lastName: 'López',
        postalCode: '08008',
      });
      assert.strictEqual(ensureRes.success, true);
      assert.ok(ensureRes.data?.codCli);

      const altaDirRes = await a3erpConnector.writeCustom('Clientes', 'AltaDireccion', { CODCLI: '1' });
      assert.strictEqual(altaDirRes.success, false);
      assert.ok(altaDirRes.message.includes('cdsDIRENT'));
    });
  });

  describe('Sage 200 Full Workflows (REST TmpIME + GraphQL ES256)', () => {
    it('should validate 77-field TmpIME_Articulos contract and import via REST and GraphQL', async () => {
      const invalidItem = SageContractValidator.validateAndNormalizeItem({ codigoEmpresa: 9999 });
      assert.strictEqual(invalidItem.valid, false);

      const invalidBool = SageContractValidator.validateAndNormalizeItem({
        codigoEmpresa: 9999,
        descripcionArticulo: 'Test',
        obsoletoLc: 1 as any,
      });
      assert.strictEqual(invalidBool.valid, false);

      const restItem = await sage200Connector.createItem(
        { codigoArticulo: 'SAGE-ITEM-01', descripcionArticulo: 'Motor Trifásico 5kW', precioVenta: 450 },
        'rest'
      );
      assert.strictEqual(restItem.success, true);
      assert.strictEqual(restItem.data?.transportUsed, 'rest');

      const gqlItem = await sage200Connector.createItem(
        { codigoArticulo: 'SAGE-ITEM-02', descripcionArticulo: 'Variador Frecuencia', precioVenta: 320 },
        'graphql'
      );
      assert.strictEqual(gqlItem.success, true);
      assert.strictEqual(gqlItem.data?.transportUsed, 'graphql');
      assert.strictEqual(gqlItem.operation, 'mutation importItem');
    });

    it('should compute Stock_Move_v13 transfer plan from GraphQL stock and execute Inventories import', async () => {
      const planRes = await sage200Connector.computeStockTransferPlan({
        codigoArticulo: 'SAGE200-ENT-SUITE',
        sourceWarehouse: '001',
        targetWarehouse: '002',
        desiredTargetStock: 14, // offline mock has 4 in wh 002 -> delta +10
        execute: false,
      });
      assert.strictEqual(planRes.success, true);
      assert.strictEqual(planRes.data.transferRequired, true);
      assert.strictEqual(planRes.data.delta, 10);
      assert.strictEqual(planRes.data.plannedMovement.unidades, 10);
      assert.strictEqual(planRes.data.plannedMovement.origenMovimiento, 'T');
      assert.strictEqual(planRes.data.plannedMovement.codigoAlmacen, '001');
      assert.strictEqual(planRes.data.plannedMovement.almacenContrapartida, '002');

      const invRes = await sage200Connector.createInventory({
        inventario: 'INV-2026',
        codigoArticulo: 'SAGE200-ENT-SUITE',
        codigoAlmacen: '001',
        unidadesStock: 20,
        unidadesInventario: 19,
      });
      assert.strictEqual(invRes.success, true);
      assert.strictEqual(invRes.taskStatus, 'COMPLETED');

      const stockOut = await sage200Connector.syncStockOut();
      assert.strictEqual(stockOut.success, true);
      assert.ok((stockOut.data?.length || 0) >= 1);
    });
  });

  describe('PrestaShop Dual-API Workflows (Webservice XML + PS9 Admin API)', () => {
    it('should resolve Orders_OUT_v13 with 5 batch calls and update order state via order_histories XML', async () => {
      const ordersRes = await prestashopConnector.fetchAndProcessOrdersOut('master');
      assert.strictEqual(ordersRes.success, true);
      assert.ok((ordersRes.data?.length || 0) >= 1);
      assert.strictEqual(ordersRes.data![0].metadata?.batchCallsExecuted, 5);
      assert.strictEqual(ordersRes.data![0].totals.taxAmount, 42);

      const stateRes = await prestashopConnector.updateOrderState({ orderId: 501, orderStateId: 4 });
      assert.strictEqual(stateRes.success, true);
      assert.ok(stateRes.data!.xmlPayload.includes('<id_order_state><![CDATA[4]]></id_order_state>'));
    });

    it('should execute Product_Upsert_v12, Variants_IN_v1, Stock_Update_v11 lookup, and multipart image POST', async () => {
      const prodRes = await prestashopConnector.upsertProductIn({
        sku: 'PS9-TEST-01',
        name: 'Chaqueta Impermeable PS9',
        basePrice: 100,
        categoryIds: [2, 12],
        defaultCategoryId: 12,
      });
      assert.strictEqual(prodRes.success, true);
      assert.strictEqual(prodRes.data?.reference, 'PS9-TEST-01');

      const varRes = await prestashopConnector.syncVariantsIn({
        productId: 701,
        attributeGroupId: 1,
        newOptionValues: [{ name: 'XXL', langId: 1 }],
        variants: [{ sku: 'PS9-TEST-01-XXL', optionValueIds: [11, 24] }],
      });
      assert.strictEqual(varRes.success, true);
      assert.strictEqual(varRes.data.createdOptionValuesCount, 1);
      assert.strictEqual(varRes.data.combinations.length, 1);

      const stockRes = await prestashopConnector.updateStock({ productId: 701, quantity: 33 });
      assert.strictEqual(stockRes.success, true);
      assert.ok(stockRes.data!.xmlPayload.includes('<quantity><![CDATA[33]]></quantity>'));

      // PS9 Admin API image edit MUST force POST (never PUT)
      const editImg = await prestashopConnector.uploadProductImage({
        productId: 701,
        imageId: 55,
        mode: 'admin_api',
        fileName: 'updated.jpg',
      });
      assert.strictEqual(editImg.success, true);
      assert.strictEqual(editImg.data.method, 'POST');
      assert.strictEqual(editImg.data.isEdit, true);
      assert.ok(editImg.data.endpoint.endsWith('/admin-api/products/images/55'));

      const mp = PrestaShopMediaUploader.buildMultipartBody({
        fieldName: 'image',
        fileName: 'test.png',
        mimeType: 'image/png',
        contentBase64: Buffer.from('PNG').toString('base64'),
      });
      assert.ok(mp.contentType.startsWith('multipart/form-data; boundary='));
      assert.ok(mp.body.includes('filename="test.png"'));
    });
  });

  describe('Shopify Admin GraphQL API & B2B Workflows', () => {
    it('should execute Relay pagination, PriceLists query, and B2B metafieldsSet with 25-item chunking & guards', async () => {
      const allOrders = await shopifyConnector.fetchAllOrdersOut({ financialStatus: 'paid' }, 'master', 3);
      assert.strictEqual(allOrders.success, true);
      assert.ok((allOrders.data?.length || 0) >= 1);

      const priceLists = await shopifyConnector.queryPriceLists(10);
      assert.strictEqual(priceLists.success, true);
      assert.ok(Array.isArray(priceLists.data));

      // Missing 'validado' tag must be rejected
      const blockedB2B = await shopifyConnector.syncB2BCompanyMetafields({
        ownerId: '301',
        customerTags: ['B2B'],
        metafields: [{ namespace: 'sage', key: 'cod_cliente_sage', value: '4300199' }],
      });
      assert.strictEqual(blockedB2B.success, false);

      // 30 metafields must split into 2 batches (25 + 5), protect immutable taxRegistrationId, map NET_60
      const thirtyMetafields = Array.from({ length: 30 }, (_, i) => ({
        namespace: 'b2b',
        key: `field_${i}`,
        value: `val_${i}`,
      }));
      const okB2B = await shopifyConnector.syncB2BCompanyMetafields({
        ownerId: '301',
        customerTags: ['validado', 'B2B'],
        paymentTermLabel: '60 DIAS',
        metafields: thirtyMetafields,
        attemptedUpdates: { taxRegistrationId: 'B00000000' },
      });
      assert.strictEqual(okB2B.success, true);
      assert.strictEqual(okB2B.data.batchesExecuted, 2);
      assert.strictEqual(okB2B.data.paymentTermsType, 'NET_60');
      assert.deepStrictEqual(okB2B.data.blockedImmutableFields, ['taxRegistrationId']);
    });

    it('should execute productSet anti-duplicate lookup using configured skuField', async () => {
      const prodRes = await shopifyConnector.upsertProductIn({
        sku: 'SHP-UNIT-01',
        barcode: '8412345678999',
        name: 'Producto Shopify Unit',
        basePrice: 99.5,
      });
      assert.strictEqual(prodRes.success, true);
      assert.ok(prodRes.data.productId.startsWith('gid://shopify/Product/'));
    });
  });

  describe('WooCommerce REST API v3 Full Workflows', () => {
    it('should reject non-processing orders (Exit Not Processing) and execute paginated fetchOrdersOut', async () => {
      const pendingRes = await woocommerceConnector.processOrderOut({ id: 9999, status: 'pending' });
      assert.strictEqual(pendingRes.success, false);
      assert.ok(pendingRes.message.includes('status processing'));

      const ordersRes = await woocommerceConnector.fetchOrdersOut({ status: 'processing', perPage: 20, maxPages: 2 });
      assert.strictEqual(ordersRes.success, true);
      assert.ok((ordersRes.data?.length || 0) >= 1);
    });

    it('should execute product upsert with variations batch, validate 100-item /batch cap, and create notes/refunds', async () => {
      const varProd = await woocommerceConnector.upsertProductIn({
        sku: 'WC-VAR-PARENT',
        name: 'Camiseta Técnica Variable',
        type: 'variable',
        basePrice: 20,
        options: [{ name: 'Talla', values: ['M', 'L'] }],
        variants: [
          { sku: 'WC-VAR-M', title: 'Talla M', price: 20, stockQuantity: 10, options: [{ name: 'Talla', value: 'M' }] },
          { sku: 'WC-VAR-L', title: 'Talla L', price: 20, stockQuantity: 15, options: [{ name: 'Talla', value: 'L' }] },
        ],
      });
      assert.strictEqual(varProd.success, true);
      assert.strictEqual(varProd.data?.variationsBatchCount, 2);

      const okBatch = await woocommerceConnector.executeBatch('products', {
        update: [{ id: 1, regular_price: '24.20' }],
      });
      assert.strictEqual(okBatch.success, true);

      const oversizedBatch = await woocommerceConnector.executeBatch('products', {
        create: Array.from({ length: 101 }, (_, i) => ({ name: `Item ${i}` })),
      });
      assert.strictEqual(oversizedBatch.success, false);

      const noteRes = await woocommerceConnector.createOrderNote({
        orderId: 4920,
        note: 'Verificado por departamento comercial',
        customerNote: false,
      });
      assert.strictEqual(noteRes.success, true);

      const refundRes = await woocommerceConnector.createOrderRefund({
        orderId: 4920,
        amount: 25,
        reason: 'Devolución parcial',
        apiRefund: true,
        apiRestock: true,
        computeTotals: true,
      });
      assert.strictEqual(refundRes.success, true);
      assert.strictEqual(refundRes.data.amount, '25.00');
      assert.strictEqual(refundRes.data.compute_totals, true);
    });
  });
});
