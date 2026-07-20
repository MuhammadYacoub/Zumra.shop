# Zumra.shop (زُمرة) — Smart E-commerce for Traditional Egyptian Markets

> **Zumra (زُمرة)**: A specialized B2B/B2C trade engine bridging traditional Egyptian wholesale hubs (e.g., El-Ataba, El-Fagala) with digital commerce, featuring an immutable Double-Entry Financial Ledger, Zonal Fleet Management, and Egyptian Dialect AI integration.

---

## 🏛️ Clean Architecture & 9-Agent Team

The project is driven by a specialized multi-agent engineering & business team:
1. **Aya (Chief Architect & Team Lead)** — Clean Architecture & Fastify Governance
2. **Tarek (Market & Trade Strategist)** — Wholesale Dynamics & Affiliate Models
3. **Farida (Logistics & Fleet Ops)** — Zonal Fleet Management & COD Risk Mitigation
4. **Hazem (Fintech & Accounting)** — Zero-Sum Double-Entry Ledger & Multi-Party Payouts
5. **Nour (AI & Prompt Engineer)** — Voice-to-JSON (Egyptian Slang) & SEO Slugs
6. **Omar (Backend Engineer)** — Fastify REST APIs & JWT/Redis Lifecycle
7. **Ziad (Database Architect)** — Portable SQLite/SQL Server Schema & Financial Indexes
8. **Khaled (DevOps & Git Master)** — Git Syncing, Correlation ID Tracing, PM2 Setup
9. **Documentation Agent** — Architecture Decision Records (ADRs) & System Manuals

---

## 📂 System Folder Hierarchy

```
Zumra.shop/
├── docs/                       # Architecture Decision Records & Diagrams
│   ├── adr/                    # ADRs (Ledger, Zonal Fleet, etc.)
│   ├── architecture-overview.md
│   └── schema-diagram.md
├── scripts/                    # Database DDL & Seed Execution Scripts
│   ├── init-db.sql
│   └── init-db.js
├── src/                        # Clean Architecture Source Code
│   ├── domain/                 # Domain Entities, Aggregates, Value Objects
│   ├── use-cases/              # Application Business Rules & Services
│   ├── infrastructure/         # Repositories, DB Drivers, Redis, Telemetry
│   └── interfaces/             # Fastify Controllers, HTTP Routes, Middlewares
├── .env.example                # Environment Variable Template
├── package.json                # Project Dependencies & Scripts
├── tsconfig.json               # Strict TypeScript & Path Aliases
└── README.md                   # System Documentation
```

---

## 🚀 Quick Start

1. **Environment Setup**:
   ```bash
   cp .env.example .env
   npm install
   ```

2. **Initialize Local Database**:
   ```bash
   npm run db:init
   ```

3. **Verify Codebase**:
   ```bash
   npm run lint
   ```

---

## 🔒 Financial Integrity Invariants
- **Double-Entry Balance**: `Sum(Debits) == Sum(Credits)` for every `journal_entry`.
- **COD Settlement Audit**: Driver cash collections are verified via `cod_reconciliations` before unlocking payouts.
- **Traceability**: Every transaction carries an explicit `correlation_id` header across HTTP logs and ledger lines.

---
*Powered by Google Antigravity & Zumra.shop Enterprise Engineering Team.*
