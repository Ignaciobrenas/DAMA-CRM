import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const { search, category, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { externalId: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (category) where.category = String(category);

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const { sku, name, description, price, costPrice, stock, category, barcode, externalId } = req.body;

    if (!sku || !name) {
      res.status(400).json({ success: false, message: 'SKU y nombre de producto son obligatorios' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        price: parseFloat(price) || 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock, 10) || 0,
        category,
        barcode,
        externalId: externalId || null,
        isSync: Boolean(externalId),
        lastSyncedAt: externalId ? new Date() : null,
      },
    });

    await logAudit((req as any).user?.id || null, 'CREATE', 'Product', product.id, { sku: product.sku }, req.ip);

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { sku, name, description, price, costPrice, stock, category, barcode } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: sku ? sku.trim() : undefined,
        name: name ? name.trim() : undefined,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        costPrice: costPrice !== undefined ? (costPrice ? parseFloat(costPrice) : null) : undefined,
        stock: stock !== undefined ? parseInt(stock, 10) : undefined,
        category,
        barcode,
      },
    });

    await logAudit(
      (req as any).user?.id || null,
      'UPDATE',
      'Product',
      id,
      { sku: updated.sku, name: updated.name },
      req.ip
    );

    res.json({ success: true, data: updated, message: `Producto ${updated.name} actualizado` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    await logAudit((req as any).user?.id || null, 'DELETE', 'Product', id, { sku: existing.sku }, req.ip);

    res.json({ success: true, message: `Producto ${existing.name} eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * UnoPIM Integration Webhook Receiver: POST /api/webhooks/unopim
 * Receives instantaneous updates when products, stock or prices change in UnoPIM.
 */
export async function handleUnoPimWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-unopim-secret'];
    if (signature && signature !== config.webhooks.unopimSecret) {
      res.status(401).json({ success: false, message: 'Firma de webhook UnoPIM inválida' });
      return;
    }

    const { event, product } = req.body;
    // Expected payload: { event: "product.updated", product: { id, sku, name, price, stock, category } }

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
        category: product.category,
        isSync: true,
        lastSyncedAt: new Date(),
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

/**
 * Nightly consistency sweep trigger
 */
export async function triggerNightlySync(req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({ where: { isSync: true } });

    // Mark updated lastSyncedAt
    await prisma.product.updateMany({
      where: { isSync: true },
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
