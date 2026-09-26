-- =============================================================================
-- DAMA-CRM: Idempotent Migration for Portal del Empleado, Fichajes & Nóminas
-- Compatible with PostgreSQL (Docker Production) & SQLite (Local Development)
-- =============================================================================

-- 1. Create Notifications Table (Idempotent)
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT,
  "tenantId" TEXT DEFAULT 'master',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT DEFAULT 'info',
  "priority" TEXT DEFAULT 'normal',
  "actionUrl" TEXT,
  "metadata" TEXT,
  "read" BOOLEAN DEFAULT false NOT NULL,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_read_created" ON "notifications" ("tenantId", "read", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read_created" ON "notifications" ("userId", "read", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications" ("type");

-- 2. Create Employees Table (Idempotent)
CREATE TABLE IF NOT EXISTS "employees" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT UNIQUE,
  "tenantId" TEXT DEFAULT 'master',
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "jobTitle" TEXT,
  "department" TEXT,
  "hireDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "contractType" TEXT DEFAULT 'INDEFINIDO',
  "baseSalary" REAL DEFAULT 0.0 NOT NULL,
  "iban" TEXT,
  "status" TEXT DEFAULT 'ACTIVE' NOT NULL,
  "odooEmployeeId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_employees_tenant_status" ON "employees" ("tenantId", "status");
CREATE INDEX IF NOT EXISTS "idx_employees_email" ON "employees" ("email");

-- 3. Create Payrolls Table (Nóminas) (Idempotent)
CREATE TABLE IF NOT EXISTS "payrolls" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "employeeId" TEXT NOT NULL,
  "tenantId" TEXT DEFAULT 'master',
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "baseSalary" REAL DEFAULT 0.0 NOT NULL,
  "bonuses" REAL DEFAULT 0.0 NOT NULL,
  "deductions" REAL DEFAULT 0.0 NOT NULL,
  "netSalary" REAL DEFAULT 0.0 NOT NULL,
  "status" TEXT DEFAULT 'DRAFT' NOT NULL,
  "paidAt" TIMESTAMP,
  "pdfUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE,
  UNIQUE ("employeeId", "month", "year")
);

CREATE INDEX IF NOT EXISTS "idx_payrolls_tenant_year_month" ON "payrolls" ("tenantId", "year", "month");

-- 4. Create Time Records Table (Control Horario / Fichajes) (Idempotent)
CREATE TABLE IF NOT EXISTS "time_records" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "employeeId" TEXT NOT NULL,
  "userId" TEXT,
  "tenantId" TEXT DEFAULT 'master',
  "clockIn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "clockOut" TIMESTAMP,
  "durationMinutes" INTEGER DEFAULT 0,
  "type" TEXT DEFAULT 'WORK' NOT NULL,
  "reason" TEXT,
  "notes" TEXT,
  "ipAddress" TEXT,
  "location" TEXT,
  "odooAttendanceId" INTEGER,
  "status" TEXT DEFAULT 'VALID' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_time_records_tenant_clockin" ON "time_records" ("tenantId", "clockIn");
CREATE INDEX IF NOT EXISTS "idx_time_records_employee_clockin" ON "time_records" ("employeeId", "clockIn");
