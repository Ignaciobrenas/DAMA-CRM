-- =============================================================================
-- DAMA-CRM: Idempotent Migration - Modules & UI Accessibility
-- Supports: PostgreSQL (Production Docker) & SQLite (Local Development)
-- =============================================================================

-- 1. Ensure settings column exists in tenants table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'settings'
    ) THEN
        ALTER TABLE "tenants" ADD COLUMN "settings" TEXT DEFAULT '{}';
    END IF;
END $$;

-- 2. Ensure preferences column exists in users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "preferences" TEXT DEFAULT '{}';
    END IF;
END $$;

-- 3. Create indexes safely if not exist
CREATE INDEX IF NOT EXISTS "idx_tenants_slug_status" ON "tenants" ("slug", "status");
CREATE INDEX IF NOT EXISTS "idx_users_tenant_active" ON "users" ("tenantId", "isActive");
