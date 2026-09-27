-- Idempotent migration for enriched Inventory and Stock Movements

-- 1. Add new columns to products table idempotently
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "maxStock" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'UNIT';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplierName" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplierSku" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 21.0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dimensions" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 2. Create stock_movements table idempotently
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "performedBy" TEXT,
    "tenantId" TEXT DEFAULT 'master',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- 3. Create indexes idempotently
CREATE INDEX IF NOT EXISTS "products_tenantId_category_idx" ON "products"("tenantId", "category");
CREATE INDEX IF NOT EXISTS "products_tenantId_sku_idx" ON "products"("tenantId", "sku");
CREATE INDEX IF NOT EXISTS "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "stock_movements_tenantId_createdAt_idx" ON "stock_movements"("tenantId", "createdAt");

-- 4. Add foreign key relation idempotently
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_productId_fkey'
    ) THEN
        ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
