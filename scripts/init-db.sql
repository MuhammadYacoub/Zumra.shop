-- ============================================================================
-- Zumra.shop (زُمرة) — Database DDL (Portable SQLite / SQL Server)
-- Authors: Ziad (DB Arch), Hazem (Fintech), Farida (Logistics), Tarek (Market)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. Users & Roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- UUID v4
    role TEXT NOT NULL CHECK(role IN ('CUSTOMER', 'MERCHANT', 'AFFILIATE', 'DRIVER', 'ADMIN')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Wholesale Markets & Zonal Fleet Configuration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,                       -- e.g., 'ZONE-ATABA-01'
    code TEXT NOT NULL UNIQUE,                 -- 'ATABA', 'FAGALA'
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK(market_type IN ('EL_ATABA', 'EL_FAGALA', 'CUSTOM')),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    business_name TEXT NOT NULL,
    market_zone_id TEXT NOT NULL REFERENCES zones(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    referral_code TEXT NOT NULL UNIQUE,
    commission_rate NUMERIC NOT NULL DEFAULT 0.05, -- 5% default commission
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    zone_id TEXT NOT NULL REFERENCES zones(id),
    vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('MOTORCYCLE', 'TRICYCLE', 'VAN', 'PICKUP')),
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK(status IN ('OFFLINE', 'AVAILABLE', 'ON_DELIVERY')),
    current_lat NUMERIC,
    current_lng NUMERIC,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. Shipments & COD Reconciliation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    driver_id TEXT REFERENCES drivers(id),
    zone_id TEXT NOT NULL REFERENCES zones(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', 'RETURNED')),
    cod_amount NUMERIC NOT NULL DEFAULT 0.00,
    failed_reason TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    delivered_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cod_reconciliations (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id),
    total_collected NUMERIC NOT NULL,
    total_remitted NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'MATCHED', 'DISCREPANCY')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. Double-Entry Financial Ledger
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,                       -- e.g., 'ACC-1000-CASH'
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    currency TEXT NOT NULL DEFAULT 'EGP',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    correlation_id TEXT NOT NULL,             -- Traceability header
    reference_type TEXT NOT NULL CHECK(reference_type IN ('ORDER', 'PAYOUT', 'REFUND', 'COD_DEPOSIT', 'SYSTEM_ADJUSTMENT')),
    reference_id TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'POSTED' CHECK(status IN ('DRAFT', 'POSTED', 'VOIDED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_lines (
    id TEXT PRIMARY KEY,
    journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    entry_type TEXT NOT NULL CHECK(entry_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC NOT NULL CHECK(amount > 0),
    currency TEXT NOT NULL DEFAULT 'EGP',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_journal_entries_correlation ON journal_entries(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_account ON ledger_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_entry ON ledger_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_shipments_zone_status ON shipments(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_drivers_zone_status ON drivers(zone_id, status);
