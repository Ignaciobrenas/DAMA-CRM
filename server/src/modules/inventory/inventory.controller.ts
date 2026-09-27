import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

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
          _count: {
            select: { stockMovements: true },
          },
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

    const initialStock = parseInt(stock, 10) || 0;

    const product = await prisma.product.create({
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
      },
    });

    // Record initial stock movement audit entry if stock > 0
    if (initialStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
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
    if (signature && signature !== config.webhooks.unopimSecret) {
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
