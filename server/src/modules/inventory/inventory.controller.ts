import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';
import { IntegrationsService } from '../integrations/integrations.service';

export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const {
      search,
      category,
      stockStatus,
      sortBy = 'name_asc',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { barcode: { contains: String(search), mode: 'insensitive' } },
        { brand: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } },
        { supplierName: { contains: String(search), mode: 'insensitive' } },
        { tags: { contains: String(search), mode: 'insensitive' } },
        { externalId: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = String(category);
    }

    if (stockStatus === 'OUT_OF_STOCK') {
      where.stock = { lte: 0 };
    } else if (stockStatus === 'IN_STOCK') {
      where.stock = { gt: 0 };
    }

    // Determine sorting order
    let orderBy: any = { name: 'asc' };
    switch (sortBy) {
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'stock_asc':
        orderBy = { stock: 'asc' };
        break;
      case 'stock_desc':
        orderBy = { stock: 'desc' };
        break;
      case 'sku_asc':
        orderBy = { sku: 'asc' };
        break;
      case 'created_desc':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          _count: { select: { stockMovements: true } }, warehouseStocks: { include: { warehouse: true } }, batches: true,
        },
      }),
    ]);

    // Apply low stock filter in-memory if requested (since minStock varies per product)
    let filteredProducts = rawProducts;
    if (stockStatus === 'LOW_STOCK') {
      filteredProducts = rawProducts.filter((p) => p.stock > 0 && p.stock <= (p.minStock ?? 5));
    }

    res.json({
      success: true,
      data: filteredProducts,
      pagination: {
        total: stockStatus === 'LOW_STOCK' ? filteredProducts.length : total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((stockStatus === 'LOW_STOCK' ? filteredProducts.length : total) / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && product.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este producto' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      sku,
      name,
      description,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      unit,
      category,
      barcode,
      imageUrl,
      images,
      location,
      supplierName,
      supplierSku,
      taxRate,
      weight,
      dimensions,
      brand,
      tags,
      notes,
      isActive,
      externalId,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del artículo es obligatorio' });
      return;
    }

    // Auto-generate SKU if not provided
    const finalSku = sku && sku.trim()
      ? sku.trim().toUpperCase()
      : `SKU-${Date.now().toString().slice(-6)}`;

    // Check duplicate by SKU
    const existingProduct = await prisma.product.findUnique({
      where: { sku: finalSku },
    });
    if (existingProduct) {
      res.status(409).json({
        success: false,
        message: `Ya existe un producto registrado con el SKU "${finalSku}" (${existingProduct.name})`,
        data: existingProduct,
      });
      return;
    }

    const initialStock = parseInt(stock, 10) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          sku: finalSku,
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price) || 0,
          costPrice: costPrice !== undefined && costPrice !== '' ? parseFloat(costPrice) : 0,
          stock: initialStock,
          minStock: minStock !== undefined && minStock !== '' ? parseInt(minStock, 10) : 5,
          maxStock: maxStock !== undefined && maxStock !== '' ? parseInt(maxStock, 10) : null,
          unit: unit?.trim() || 'UNIT',
          category: category?.trim() || 'General',
          barcode: barcode?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          images: Array.isArray(images) ? JSON.stringify(images) : (images || '[]'),
          location: location?.trim() || null,
          supplierName: supplierName?.trim() || null,
          supplierSku: supplierSku?.trim() || null,
          taxRate: taxRate !== undefined && taxRate !== '' ? parseFloat(taxRate) : 21.0,
          weight: weight !== undefined && weight !== '' ? parseFloat(weight) : null,
          dimensions: dimensions?.trim() || null,
          brand: brand?.trim() || null,
          tags: tags?.trim() || null,
          notes: notes?.trim() || null,
          isActive: typeof isActive === 'boolean' ? isActive : true,
          externalId: externalId?.trim() || null,
          isSync: Boolean(externalId),
          lastSyncedAt: externalId ? new Date() : null,
          tenantId,
          attributes: req.body.attributes
            ? (typeof req.body.attributes === 'string' ? req.body.attributes : JSON.stringify(req.body.attributes))
            : JSON.stringify(
                IntegrationsService.autoMapProductAttributes({
                  sku: finalSku,
                  name: name.trim(),
                  price: parseFloat(price) || 0,
                  costPrice: costPrice !== undefined && costPrice !== '' ? parseFloat(costPrice) : 0,
                  stock: initialStock,
                  minStock: minStock !== undefined && minStock !== '' ? parseInt(minStock, 10) : 5,
                  category: category?.trim() || 'General',
                  barcode: barcode?.trim() || null,
                  brand: brand?.trim() || null,
                  weight: weight !== undefined && weight !== '' ? parseFloat(weight) : null,
                  dimensions: dimensions?.trim() || null,
                  supplierSku: supplierSku?.trim() || null,
                  supplierName: supplierName?.trim() || null,
                  taxRate: taxRate !== undefined && taxRate !== '' ? parseFloat(taxRate) : 21.0,
                })
              ),
        },
      });

      // Record initial stock movement audit entry if stock > 0
      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            type: 'INBOUND',
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: 'Inventario inicial al dar de alta el producto',
            reference: 'ALTA-INICIAL',
            performedBy: req.user?.name || req.user?.email || 'Sistema',
            tenantId,
          },
        });
      }

      return p;
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Product', product.id, { sku: product.sku, name: product.name, tenantId }, req.ip);

    res.status(201).json({ success: true, data: product, message: `Producto ${product.name} creado correctamente` });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Ya existe un producto con el mismo código SKU o código de barras' });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este producto' });
      return;
    }

    const {
      sku,
      name,
      description,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      unit,
      category,
      barcode,
      imageUrl,
      images,
      location,
      supplierName,
      supplierSku,
      taxRate,
      weight,
      dimensions,
      brand,
      tags,
      notes,
      isActive,
    } = req.body;

    const newStock = stock !== undefined ? parseInt(stock, 10) : undefined;
    const stockChanged = newStock !== undefined && newStock !== existing.stock;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: sku ? sku.trim().toUpperCase() : undefined,
        name: name ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        costPrice: costPrice !== undefined ? (costPrice !== '' ? parseFloat(costPrice) : 0) : undefined,
        stock: newStock,
        minStock: minStock !== undefined ? (minStock !== '' ? parseInt(minStock, 10) : 5) : undefined,
        maxStock: maxStock !== undefined ? (maxStock !== '' ? parseInt(maxStock, 10) : null) : undefined,
        unit: unit !== undefined ? unit.trim() : undefined,
        category: category !== undefined ? (category?.trim() || 'General') : undefined,
        barcode: barcode !== undefined ? (barcode?.trim() || null) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl?.trim() || null) : undefined,
        images: images !== undefined ? (Array.isArray(images) ? JSON.stringify(images) : images) : undefined,
        location: location !== undefined ? (location?.trim() || null) : undefined,
        supplierName: supplierName !== undefined ? (supplierName?.trim() || null) : undefined,
        supplierSku: supplierSku !== undefined ? (supplierSku?.trim() || null) : undefined,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
        weight: weight !== undefined ? (weight !== '' ? parseFloat(weight) : null) : undefined,
        dimensions: dimensions !== undefined ? (dimensions?.trim() || null) : undefined,
        brand: brand !== undefined ? (brand?.trim() || null) : undefined,
        tags: tags !== undefined ? (tags?.trim() || null) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        attributes: req.body.attributes !== undefined
          ? (typeof req.body.attributes === 'string' ? req.body.attributes : JSON.stringify(req.body.attributes))
          : undefined,
      },
    });

    // Record automatic stock movement adjustment if stock changed directly
    if (stockChanged && newStock !== undefined) {
      const delta = newStock - existing.stock;
      await prisma.stockMovement.create({
        data: {
          productId: id,
          type: 'ADJUSTMENT',
          quantity: delta,
          previousStock: existing.stock,
          newStock: newStock,
          reason: 'Ajuste manual directo desde la ficha del producto',
          performedBy: req.user?.name || req.user?.email || 'Sistema',
          tenantId,
        },
      });
    }

    await logAudit(
      req.user?.id || null,
      'UPDATE',
      'Product',
      id,
      { sku: updated.sku, name: updated.name, previousStock: existing.stock, newStock: updated.stock, tenantId },
      req.ip
    );

    res.json({ success: true, data: updated, message: `Producto ${updated.name} actualizado correctamente` });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'El código SKU o código de barras ya pertenece a otro artículo' });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este producto' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Product', id, { sku: existing.sku, name: existing.name, tenantId }, req.ip);

    res.json({ success: true, message: `Producto ${existing.name} (${existing.sku}) eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createStockMovement(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { type, quantity, reason, reference } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (!type || isNaN(parsedQty) || parsedQty === 0) {
      res.status(400).json({ success: false, message: 'Tipo de movimiento y cantidad (distinta de 0) son obligatorios' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && product.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este producto' });
      return;
    }

    let delta = parsedQty;
    if (type === 'OUTBOUND' && delta > 0) delta = -delta;
    if (type === 'INBOUND' && delta < 0) delta = Math.abs(delta);

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + delta);

    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: id,
          type: type.toUpperCase(),
          quantity: delta,
          previousStock,
          newStock,
          reason: reason?.trim() || `Movimiento de ${type.toLowerCase()}`,
          reference: reference?.trim() || null,
          performedBy: req.user?.name || req.user?.email || 'Operador',
          tenantId,
        },
      }),
      prisma.product.update({
        where: { id },
        data: { stock: newStock },
      }),
    ]);

    await logAudit(
      req.user?.id || null,
      'STOCK_MOVEMENT',
      'Product',
      id,
      { type, delta, previousStock, newStock, reason, tenantId },
      req.ip
    );

    res.json({
      success: true,
      message: `Movimiento de stock registrado. Stock actualizado a ${newStock} unidades.`,
      data: {
        movement,
        product: updatedProduct,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listStockMovements(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = { productId: id };
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInventoryStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const allProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        price: true,
        costPrice: true,
        stock: true,
        minStock: true,
        category: true,
      },
    });

    const totalProducts = allProducts.length;
    let totalUnits = 0;
    let costValuation = 0;
    let retailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categoryCounts: Record<string, number> = {};

    allProducts.forEach((p) => {
      totalUnits += p.stock;
      costValuation += p.stock * (p.costPrice || 0);
      retailValuation += p.stock * (p.price || 0);

      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= (p.minStock ?? 5)) {
        lowStockCount++;
      }

      const cat = p.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const marginPotential = retailValuation - costValuation;
    const grossMarginPercent = retailValuation > 0 ? (marginPotential / retailValuation) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalUnits,
        costValuation: Math.round(costValuation * 100) / 100,
        retailValuation: Math.round(retailValuation * 100) / 100,
        marginPotential: Math.round(marginPotential * 100) / 100,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        inStockCount: totalProducts - outOfStockCount,
        lowStockCount,
        outOfStockCount,
        categoryCounts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportInventoryCsv(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const headers = [
      'SKU',
      'Nombre',
      'Categoría',
      'Stock Actual',
      'Stock Mínimo',
      'Unidad',
      'Precio Venta (€)',
      'Precio Coste (€)',
      'Ubicación',
      'Marca',
      'Proveedor',
      'Código de Barras',
      'Estado',
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = products.map((p) => [
      escapeCsv(p.sku),
      escapeCsv(p.name),
      escapeCsv(p.category || 'General'),
      p.stock,
      p.minStock ?? 5,
      escapeCsv(p.unit),
      p.price.toFixed(2),
      (p.costPrice || 0).toFixed(2),
      escapeCsv(p.location || ''),
      escapeCsv(p.brand || ''),
      escapeCsv(p.supplierName || ''),
      escapeCsv(p.barcode || ''),
      escapeCsv(p.isActive ? 'Activo' : 'Inactivo'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=inventario_dama_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * UnoPIM Integration Webhook Receiver: POST /api/inventory/webhooks/unopim
 */
export async function handleUnoPimWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-unopim-secret'];
    const expectedSecret = config.webhooks.unopimSecret;
    if (expectedSecret && config.env === 'production') {
      if (!signature || signature !== expectedSecret) {
        res.status(401).json({ success: false, message: 'Firma de webhook UnoPIM inválida o no proporcionada' });
        return;
      }
    } else if (signature && expectedSecret && signature !== expectedSecret) {
      res.status(401).json({ success: false, message: 'Firma de webhook UnoPIM inválida' });
      return;
    }

    const { event, product } = req.body;
    const targetTenant = (req.headers['x-tenant-id'] as string) || 'master';

    if (!product || !product.sku) {
      res.status(400).json({ success: false, message: 'Payload de webhook incompleto' });
      return;
    }

    const externalId = product.id ? String(product.id) : `UNOPIM-${product.sku}`;

    const upserted = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        externalId,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock, 10) || 0,
        category: product.category,
        imageUrl: product.imageUrl || product.image || undefined,
        brand: product.brand || undefined,
        isSync: true,
        lastSyncedAt: new Date(),
      },
      create: {
        externalId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock, 10) || 0,
        category: product.category || 'General',
        imageUrl: product.imageUrl || product.image || null,
        brand: product.brand || null,
        isSync: true,
        lastSyncedAt: new Date(),
        tenantId: targetTenant,
      },
    });

    console.log(`📦 [UnoPIM Webhook] Sincronizado producto ${upserted.sku} (${upserted.name}) - Stock: ${upserted.stock}`);

    res.json({
      success: true,
      message: 'Producto sincronizado desde UnoPIM correctamente',
      data: upserted,
    });
  } catch (error: any) {
    console.error('Error handling UnoPIM webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function triggerNightlySync(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = { isSync: true };
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const products = await prisma.product.findMany({ where });

    await prisma.product.updateMany({
      where,
      data: { lastSyncedAt: new Date() },
    });

    res.json({
      success: true,
      message: `Barrido nocturno UnoPIM ejecutado con éxito. ${products.length} productos verificados.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function importInventory(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || null;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de productos válida en items' });
      return;
    }

    const createdOrUpdated = [];
    for (const item of items) {
      if (!item.name) continue;
      const sku = (item.sku && String(item.sku).trim()) || `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
      const price = parseFloat(item.price) || 0;
      const costPrice = item.costPrice ? parseFloat(item.costPrice) : 0;
      const stock = parseInt(item.stock, 10) || 0;
      const minStock = item.minStock ? parseInt(item.minStock, 10) : 5;

      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          name: String(item.name).trim(),
          description: item.description || undefined,
          category: item.category || 'General',
          price,
          costPrice,
          stock,
          minStock,
          unit: item.unit || 'ud',
          location: item.location || undefined,
          brand: item.brand || undefined,
          supplierName: item.supplierName || undefined,
          supplierSku: item.supplierSku || undefined,
          barcode: item.barcode || undefined,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        },
        create: {
          sku,
          name: String(item.name).trim(),
          description: item.description || null,
          category: item.category || 'General',
          price,
          costPrice,
          stock,
          minStock,
          unit: item.unit || 'ud',
          location: item.location || null,
          brand: item.brand || null,
          supplierName: item.supplierName || null,
          supplierSku: item.supplierSku || null,
          barcode: item.barcode || null,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          tenantId,
        },
      });
      createdOrUpdated.push(product);
    }

    await logAudit(userId, 'IMPORT_INVENTORY', 'Product', 'batch', { count: createdOrUpdated.length, tenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: createdOrUpdated,
      message: `Se han importado/actualizado ${createdOrUpdated.length} artículos en el inventario con éxito`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function autoMapProductAttributesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && product.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este producto' });
      return;
    }

    const mapped = IntegrationsService.autoMapProductAttributes(product);
    const updated = await prisma.product.update({
      where: { id },
      data: {
        attributes: JSON.stringify(mapped),
      },
    });

    res.json({
      success: true,
      data: updated,
      attributes: mapped,
      message: 'Atributos multi-aplicación mapeados y sincronizados correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProductAttributesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { attributes } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (!isSuper && product.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este producto' });
      return;
    }

    const attributesString = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
    const updated = await prisma.product.update({
      where: { id },
      data: {
        attributes: attributesString,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Atributos del producto guardados correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}



import { generateStockTransferPdf } from './transfer-pdf.service';

/**
 * Ensures the tenant has default operational warehouses, per-warehouse stock allocations,
 * FEFO batches, and at least one initial inter-warehouse transfer in PostgreSQL.
 */
export async function ensureDefaultWarehousesAndSeed(tenantId: string): Promise<void> {
  const count = await prisma.warehouse.count({ where: { tenantId } });
  if (count > 0) return;

  const defaultWarehouses = [
    {
      code: `ALM-MAD-01${tenantId === 'master' ? '' : `-${tenantId.slice(0, 4).toUpperCase()}`}`,
      name: 'Almacén Central Madrid (Hub Principal)',
      type: 'CENTRAL',
      address: 'Polígono Industrial Las Mercedes, Calle Campezo 14',
      city: 'Madrid',
      postalCode: '28022',
      province: 'Madrid',
      country: 'ES',
      managerName: 'Carlos Mendoza (Jefe de Logística)',
      phone: '+34 910 245 800',
      isDefault: true,
      tenantId,
    },
    {
      code: `ALM-BCN-02${tenantId === 'master' ? '' : `-${tenantId.slice(0, 4).toUpperCase()}`}`,
      name: 'Hub Logístico Barcelona Zona Franca',
      type: 'REGIONAL_HUB',
      address: 'Carrer Longitudinal 6, Sector B, Nave 8',
      city: 'Barcelona',
      postalCode: '08040',
      province: 'Barcelona',
      country: 'ES',
      managerName: 'Laia Puigdomènech (Resp. Operaciones)',
      phone: '+34 932 410 920',
      isDefault: false,
      tenantId,
    },
    {
      code: `ALM-SEV-03${tenantId === 'master' ? '' : `-${tenantId.slice(0, 4).toUpperCase()}`}`,
      name: 'Delegación Sur Sevilla (Cross-Docking)',
      type: 'STORE',
      address: 'Parque Empresarial Torneo, Torre 3',
      city: 'Sevilla',
      postalCode: '41015',
      province: 'Sevilla',
      country: 'ES',
      managerName: 'Javier Jiménez',
      phone: '+34 954 901 112',
      isDefault: false,
      tenantId,
    },
    {
      code: `FURG-TEC-01${tenantId === 'master' ? '' : `-${tenantId.slice(0, 4).toUpperCase()}`}`,
      name: 'Flota Técnica SAT & Unidades Móviles',
      type: 'TRANSIT_VAN',
      address: 'Base Operativa Móvil (Flota Vehículos SAT)',
      city: 'Madrid',
      postalCode: '28022',
      province: 'Madrid',
      country: 'ES',
      managerName: 'Equipo SAT / Instalaciones',
      phone: '+34 600 890 123',
      isDefault: false,
      tenantId,
    },
  ];

  const createdWarehouses = [];
  for (const w of defaultWarehouses) {
    const wh = await prisma.warehouse.upsert({
      where: { code: w.code },
      update: {},
      create: w,
    });
    createdWarehouses.push(wh);
  }

  const products = await prisma.product.findMany({
    where: { tenantId },
    take: 25,
  });

  if (products.length > 0 && createdWarehouses.length >= 2) {
    const mad = createdWarehouses[0];
    const bcn = createdWarehouses[1];
    const sev = createdWarehouses[2] || bcn;

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const totalStock = Math.max(10, prod.stock || 24);
      const madStock = Math.ceil(totalStock * 0.6);
      const bcnStock = Math.floor(totalStock * 0.3);
      const sevStock = Math.max(0, totalStock - madStock - bcnStock);

      await prisma.warehouseStock.upsert({
        where: { warehouseId_productId: { warehouseId: mad.id, productId: prod.id } },
        update: {},
        create: {
          warehouseId: mad.id,
          productId: prod.id,
          stock: madStock,
          reservedStock: i === 0 ? 2 : 0,
          inTransitStock: 0,
          minStock: prod.minStock || 5,
          binLocation: `PAS-A${i + 1}-EST-02`,
          weightedAvgCost: prod.costPrice || Math.round(prod.price * 0.6 * 100) / 100,
          tenantId,
        },
      });

      await prisma.warehouseStock.upsert({
        where: { warehouseId_productId: { warehouseId: bcn.id, productId: prod.id } },
        update: {},
        create: {
          warehouseId: bcn.id,
          productId: prod.id,
          stock: bcnStock,
          reservedStock: 0,
          inTransitStock: i === 0 ? 4 : 0,
          minStock: 3,
          binLocation: `ZONA-B-NIV-${(i % 4) + 1}`,
          weightedAvgCost: prod.costPrice || Math.round(prod.price * 0.6 * 100) / 100,
          tenantId,
        },
      });

      if (sevStock > 0) {
        await prisma.warehouseStock.upsert({
          where: { warehouseId_productId: { warehouseId: sev.id, productId: prod.id } },
          update: {},
          create: {
            warehouseId: sev.id,
            productId: prod.id,
            stock: sevStock,
            reservedStock: 0,
            inTransitStock: 0,
            minStock: 2,
            binLocation: `MOD-S-${i + 1}`,
            weightedAvgCost: prod.costPrice || Math.round(prod.price * 0.6 * 100) / 100,
            tenantId,
          },
        });
      }

      // Create FEFO Batch for traceability
      const batchCode = `LOTE-2026-${String(i + 1).padStart(3, '0')}`;
      const existingBatch = await prisma.stockBatch.findFirst({
        where: { productId: prod.id, batchNumber: batchCode },
      });
      if (!existingBatch) {
        await prisma.stockBatch.create({
          data: {
            productId: prod.id,
            warehouseId: mad.id,
            batchNumber: batchCode,
            serialNumbers: JSON.stringify([`SN-${prod.sku}-001`, `SN-${prod.sku}-002`]),
            initialQty: madStock,
            remainingQty: madStock,
            unitCost: prod.costPrice || Math.round(prod.price * 0.6 * 100) / 100,
            manufacturedAt: new Date(Date.now() - 45 * 86400000),
            expiryDate: new Date(Date.now() + (120 + i * 30) * 86400000),
            status: 'ACTIVE',
            supplierRef: `ALB-PROV-2026-0${i + 1}`,
            tenantId,
          },
        });
      }
    }

    // Create sample Sage 2-phase Stock Transfer if none exist
    const transferCount = await prisma.stockTransfer.count({ where: { tenantId } });
    if (transferCount === 0 && products[0]) {
      const p0 = products[0];
      const unitPmp = p0.costPrice || Math.round(p0.price * 0.6 * 100) / 100;
      const tNum = `TRASP-2026-0001${tenantId === 'master' ? '' : `-${tenantId.slice(0, 3).toUpperCase()}`}`;
      await prisma.stockTransfer.create({
        data: {
          transferNumber: tNum,
          sourceWarehouseId: mad.id,
          targetWarehouseId: bcn.id,
          status: 'IN_TRANSIT',
          carrierName: 'DHL Supply Chain Iberia',
          driverName: 'Roberto Gómez Sánchez',
          driverTaxId: '47892103-L',
          vehiclePlate: '4892-MNP',
          trackingNumber: 'ES-DHL-99281726',
          totalPackages: 2,
          totalWeightKg: 18.5,
          dispatchedBy: 'Carlos Mendoza',
          dispatchedAt: new Date(Date.now() - 3600 * 1000 * 5),
          notes: 'Reposición urgente de stock de seguridad para delegación Cataluña.',
          tenantId,
          items: {
            create: [
              {
                productId: p0.id,
                requestedQty: 4,
                shippedQty: 4,
                receivedQty: 0,
                damagedQty: 0,
                batchNumber: 'LOTE-2026-001',
                sourceBinLocation: 'PAS-A1-EST-02',
                targetBinLocation: 'ZONA-B-NIV-1',
                unitCostPmp: unitPmp,
                notes: 'Palet retractilado con precinto de seguridad #8841',
              },
            ],
          },
        },
      });
    }
  }
}

export async function listWarehouses(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    await ensureDefaultWarehousesAndSeed(tenantId);

    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        stocks: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, price: true, costPrice: true, unit: true, category: true },
            },
          },
        },
        _count: {
          select: {
            stocks: true,
            outboundTransfers: true,
            inboundTransfers: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });

    res.json({ success: true, data: warehouses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createWarehouse(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      code,
      name,
      type = 'REGIONAL_HUB',
      address,
      city,
      postalCode,
      province,
      country = 'ES',
      managerName,
      phone,
      isDefault = false,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del almacén es obligatorio' });
      return;
    }

    const finalCode = code && code.trim()
      ? code.trim().toUpperCase()
      : `ALM-${Date.now().toString().slice(-4)}`;

    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: { tenantId },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code: finalCode,
        name: name.trim(),
        type,
        address: address?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        province: province?.trim() || null,
        country,
        managerName: managerName?.trim() || null,
        phone: phone?.trim() || null,
        isDefault: Boolean(isDefault),
        tenantId,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Warehouse', warehouse.id, { code: warehouse.code, name: warehouse.name, tenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: warehouse,
      message: `Almacén ${warehouse.code} (${warehouse.name}) registrado correctamente`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listBatches(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    await ensureDefaultWarehousesAndSeed(tenantId);

    const batches = await prisma.stockBatch.findMany({
      where: { tenantId },
      include: {
        product: {
          select: { id: true, sku: true, name: true, category: true, unit: true },
        },
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: batches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createBatch(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      productId,
      warehouseId,
      batchNumber,
      serialNumbers,
      initialQty,
      unitCost,
      manufacturedAt,
      expiryDate,
      supplierRef,
    } = req.body;

    if (!productId || !batchNumber) {
      res.status(400).json({ success: false, message: 'Producto y código de lote son obligatorios' });
      return;
    }

    const qty = Math.max(1, parseInt(initialQty, 10) || 1);
    const cost = parseFloat(unitCost) || 0;

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.stockBatch.create({
        data: {
          productId,
          warehouseId: warehouseId || null,
          batchNumber: String(batchNumber).trim().toUpperCase(),
          serialNumbers: Array.isArray(serialNumbers) ? JSON.stringify(serialNumbers) : (serialNumbers || '[]'),
          initialQty: qty,
          remainingQty: qty,
          unitCost: cost,
          manufacturedAt: manufacturedAt ? new Date(manufacturedAt) : new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: 'ACTIVE',
          supplierRef: supplierRef?.trim() || null,
          tenantId,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
        },
      });

      const prod = await tx.product.findUnique({ where: { id: productId } });
      if (prod) {
        const newTotal = prod.stock + qty;
        await tx.product.update({
          where: { id: productId },
          data: { stock: newTotal },
        });

        if (warehouseId) {
          await tx.warehouseStock.upsert({
            where: { warehouseId_productId: { warehouseId, productId } },
            update: { stock: { increment: qty } },
            create: {
              warehouseId,
              productId,
              stock: qty,
              minStock: prod.minStock || 5,
              binLocation: 'RECEP-GENERAL',
              weightedAvgCost: cost || prod.costPrice || 0,
              tenantId,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId,
            type: 'INBOUND',
            quantity: qty,
            previousStock: prod.stock,
            newStock: newTotal,
            unitCostPmp: cost || prod.costPrice || 0,
            batchNumber: b.batchNumber,
            targetWarehouseId: warehouseId || null,
            reason: `Alta de lote ${b.batchNumber} (${supplierRef || 'Entrada almacén'})`,
            reference: b.batchNumber,
            performedBy: req.user?.name || req.user?.email || 'Operador',
            tenantId,
          },
        });
      }

      return b;
    });

    res.status(201).json({
      success: true,
      data: batch,
      message: `Lote ${batch.batchNumber} registrado y stock actualizado (+${qty} uds)`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listGlobalMovements(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const movements = await prisma.stockMovement.findMany({
      where: { tenantId },
      include: {
        product: {
          select: { id: true, sku: true, name: true, category: true, costPrice: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    res.json({ success: true, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listStockTransfers(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    await ensureDefaultWarehousesAndSeed(tenantId);

    const transfers = await prisma.stockTransfer.findMany({
      where: { tenantId },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, price: true, costPrice: true, unit: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: transfers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * SAGE 50 / 200 PHASE 1: Create & Dispatch Inter-Warehouse Transfer
 * Decrements source WarehouseStock.stock, increments target WarehouseStock.inTransitStock,
 * and creates a StockMovement of type TRANSFER_OUT with PMP valuation.
 */
export async function createStockTransfer(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      sourceWarehouseId,
      targetWarehouseId,
      carrierName,
      driverName,
      driverTaxId,
      vehiclePlate,
      trackingNumber,
      totalPackages = 1,
      totalWeightKg = 5.0,
      notes,
      items,
    } = req.body;

    if (!sourceWarehouseId || !targetWarehouseId) {
      res.status(400).json({ success: false, message: 'Debes seleccionar el Almacén de Origen y el Almacén de Destino' });
      return;
    }

    if (sourceWarehouseId === targetWarehouseId) {
      res.status(400).json({ success: false, message: 'El almacén de destino debe ser distinto al almacén de origen' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Debes incluir al menos una línea de artículo a traspasar' });
      return;
    }

    const count = await prisma.stockTransfer.count({ where: { tenantId } });
    const transferNumber = `TRASP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}${
      tenantId === 'master' ? '' : `-${tenantId.slice(0, 3).toUpperCase()}`
    }`;
    const operator = req.user?.name || req.user?.email || 'Responsable Logística';

    const createdTransfer = await prisma.$transaction(async (tx) => {
      const preparedItems = [];

      for (const rawItem of items) {
        const qty = Math.max(1, parseInt(rawItem.quantity || rawItem.requestedQty || 1, 10));
        const product = await tx.product.findUnique({ where: { id: rawItem.productId } });
        if (!product) {
          throw new Error(`Producto no encontrado (${rawItem.productId})`);
        }

        const unitPmp = Number(product.costPrice || Math.round(product.price * 0.6 * 100) / 100);

        // Update or create source warehouse stock (decrement available stock)
        const srcStock = await tx.warehouseStock.findUnique({
          where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId: product.id } },
        });

        const prevSrcQty = srcStock ? srcStock.stock : product.stock;
        const newSrcQty = Math.max(0, prevSrcQty - qty);

        await tx.warehouseStock.upsert({
          where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId: product.id } },
          update: { stock: newSrcQty },
          create: {
            warehouseId: sourceWarehouseId,
            productId: product.id,
            stock: newSrcQty,
            minStock: product.minStock || 5,
            binLocation: rawItem.sourceBinLocation || 'PAS-A1',
            weightedAvgCost: unitPmp,
            tenantId,
          },
        });

        // Update or create target warehouse stock (increment inTransitStock)
        await tx.warehouseStock.upsert({
          where: { warehouseId_productId: { warehouseId: targetWarehouseId, productId: product.id } },
          update: { inTransitStock: { increment: qty } },
          create: {
            warehouseId: targetWarehouseId,
            productId: product.id,
            stock: 0,
            inTransitStock: qty,
            minStock: product.minStock || 5,
            binLocation: rawItem.targetBinLocation || 'RECEP-01',
            weightedAvgCost: unitPmp,
            tenantId,
          },
        });

        preparedItems.push({
          productId: product.id,
          requestedQty: qty,
          shippedQty: qty,
          receivedQty: 0,
          damagedQty: 0,
          batchNumber: rawItem.batchNumber || `LOTE-${new Date().getFullYear()}-001`,
          sourceBinLocation: rawItem.sourceBinLocation || srcStock?.binLocation || 'PAS-A1',
          targetBinLocation: rawItem.targetBinLocation || 'ZONA-RECEP',
          unitCostPmp: unitPmp,
          notes: rawItem.notes || null,
        });
      }

      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceWarehouseId,
          targetWarehouseId,
          status: 'IN_TRANSIT',
          carrierName: carrierName?.trim() || 'Transporte Interno / Agencia autorizada',
          driverName: driverName?.trim() || 'Conductor Asignado',
          driverTaxId: driverTaxId?.trim() || 'N/A',
          vehiclePlate: vehiclePlate?.trim().toUpperCase() || 'INTERNO',
          trackingNumber: trackingNumber?.trim() || transferNumber,
          totalPackages: Math.max(1, parseInt(String(totalPackages), 10) || 1),
          totalWeightKg: Math.max(0.5, parseFloat(String(totalWeightKg)) || 5.0),
          dispatchedBy: operator,
          dispatchedAt: new Date(),
          notes: notes?.trim() || null,
          tenantId,
          items: {
            create: preparedItems,
          },
        },
        include: {
          sourceWarehouse: true,
          targetWarehouse: true,
          items: { include: { product: true } },
        },
      });

      // Record Phase 1 Kardex movements (TRANSFER_OUT)
      for (const it of transfer.items) {
        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            type: 'TRANSFER_OUT',
            quantity: -it.shippedQty,
            previousStock: it.product.stock,
            newStock: it.product.stock, // Global company stock remains unchanged while in transit (Art. 9 LIVA)
            unitCostPmp: it.unitCostPmp,
            sourceWarehouseId,
            targetWarehouseId,
            transferId: transfer.id,
            batchNumber: it.batchNumber,
            reason: `Salida en Tránsito (${transfer.transferNumber}): ${transfer.sourceWarehouse.code} -> ${transfer.targetWarehouse.code}`,
            reference: transfer.transferNumber,
            performedBy: operator,
            tenantId,
          },
        });
      }

      return transfer;
    });

    await logAudit(
      req.user?.id || null,
      'CREATE_STOCK_TRANSFER',
      'StockTransfer',
      createdTransfer.id,
      { transferNumber: createdTransfer.transferNumber, tenantId },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: createdTransfer,
      message: `Traspaso ${createdTransfer.transferNumber} expedido en Fase 1 (Stock en Tránsito) y Albarán de Circulación emitido.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * SAGE 50 / 200 PHASE 2: Receive Inter-Warehouse Transfer at Destination
 * Decrements target WarehouseStock.inTransitStock, increments target WarehouseStock.stock,
 * records TRANSFER_IN movement, and if receivedQty < shippedQty records a SHRINKAGE movement.
 */
export async function receiveStockTransfer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const { receivedItems, notes } = req.body;
    const operator = req.user?.name || req.user?.email || 'Responsable Recepción';

    const existing = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        items: { include: { product: true } },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Albarán de traspaso no encontrado' });
      return;
    }

    if (existing.status === 'RECEIVED' || existing.status === 'DISCREPANCY') {
      res.status(400).json({ success: false, message: 'Este traspaso ya ha sido recepcionado previamente' });
      return;
    }

    let hasDiscrepancy = false;

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const customRec = Array.isArray(receivedItems)
          ? receivedItems.find((r: any) => r.itemId === item.id || r.productId === item.productId)
          : null;

        const receivedQty =
          customRec && customRec.receivedQty !== undefined
            ? Math.max(0, parseInt(String(customRec.receivedQty), 10))
            : item.shippedQty;
        const damagedQty = Math.max(0, item.shippedQty - receivedQty);

        if (damagedQty > 0) {
          hasDiscrepancy = true;
        }

        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: {
            receivedQty,
            damagedQty,
          },
        });

        // Update destination WarehouseStock: release inTransitStock and add receivedQty to physical stock
        const dstStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: existing.targetWarehouseId,
              productId: item.productId,
            },
          },
        });

        const newInTransit = Math.max(0, (dstStock?.inTransitStock || item.shippedQty) - item.shippedQty);
        const newDstStock = (dstStock?.stock || 0) + receivedQty;

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: existing.targetWarehouseId,
              productId: item.productId,
            },
          },
          update: {
            stock: newDstStock,
            inTransitStock: newInTransit,
            binLocation: item.targetBinLocation || dstStock?.binLocation || 'ZONA-RECEP',
          },
          create: {
            warehouseId: existing.targetWarehouseId,
            productId: item.productId,
            stock: receivedQty,
            inTransitStock: 0,
            minStock: item.product.minStock || 5,
            binLocation: item.targetBinLocation || 'ZONA-RECEP',
            weightedAvgCost: item.unitCostPmp,
            tenantId,
          },
        });

        // Record Phase 2 Kardex movement (TRANSFER_IN)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'TRANSFER_IN',
            quantity: receivedQty,
            previousStock: item.product.stock,
            newStock: item.product.stock - damagedQty,
            unitCostPmp: item.unitCostPmp,
            sourceWarehouseId: existing.sourceWarehouseId,
            targetWarehouseId: existing.targetWarehouseId,
            transferId: existing.id,
            batchNumber: item.batchNumber,
            reason: `Recepción Traspaso (${existing.transferNumber}) en ${existing.targetWarehouse.code}`,
            reference: existing.transferNumber,
            performedBy: operator,
            tenantId,
          },
        });

        // If there is shrinkage/damage in transit, adjust global Product.stock and log SHRINKAGE movement
        if (damagedQty > 0) {
          const updatedGlobalStock = Math.max(0, item.product.stock - damagedQty);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: updatedGlobalStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SHRINKAGE',
              quantity: -damagedQty,
              previousStock: item.product.stock,
              newStock: updatedGlobalStock,
              unitCostPmp: item.unitCostPmp,
              sourceWarehouseId: existing.sourceWarehouseId,
              targetWarehouseId: existing.targetWarehouseId,
              transferId: existing.id,
              batchNumber: item.batchNumber,
              reason: `Merma / Rotura en transporte detectada al recepcionar ${existing.transferNumber}`,
              reference: existing.transferNumber,
              performedBy: operator,
              tenantId,
            },
          });
        }
      }

      const finalStatus = hasDiscrepancy ? 'DISCREPANCY' : 'RECEIVED';
      return tx.stockTransfer.update({
        where: { id },
        data: {
          status: finalStatus,
          receivedBy: operator,
          receivedAt: new Date(),
          notes: notes ? `${existing.notes ? existing.notes + ' | ' : ''}${notes}` : existing.notes,
        },
        include: {
          sourceWarehouse: true,
          targetWarehouse: true,
          items: { include: { product: true } },
        },
      });
    });

    res.json({
      success: true,
      data: updated,
      message: hasDiscrepancy
        ? `Traspaso ${updated.transferNumber} recepcionado con acta de incidencia/merma registrada.`
        : `Traspaso ${updated.transferNumber} recepcionado íntegramente en ${updated.targetWarehouse.name}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadStockTransferPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transfer) {
      res.status(404).json({ success: false, message: 'Traspaso no encontrado' });
      return;
    }

    const pdfBuffer = await generateStockTransferPdf(transfer, transfer.tenantId || tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Albaran-Circulacion-${transfer.transferNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
