# Zumra.shop (زُمرة) Architecture Overview

## Clean Architecture Layers

Zumra.shop enforces strict separation of concerns following Clean Architecture principles:

```
                  +-----------------------------------+
                  |          HTTP / REST              |
                  |     (Fastify Controllers)         |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |          Use Cases                |
                  |  (Business Rules / Workflows)    |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |           Domain Layer            |
                  | (Entities, Value Objects, Events) |
                  +-----------------+-----------------+
                                    ^
                                    |
                  +-----------------+-----------------+
                  |       Infrastructure Layer        |
                  |  (SQLite Repository, Redis, Log)  |
                  +-----------------------------------+
```

### Layer Rules
1. **Domain Layer (`src/domain/`)**: Pure TypeScript entities and domain invariants (e.g. Ledger balance check, Order rules). Zero external framework dependencies.
2. **Use Cases Layer (`src/use-cases/`)**: Application orchestrators (e.g. `CreateOrderUseCase`, `ProcessCODReconciliationUseCase`, `DistributeAffiliatePayoutUseCase`).
3. **Infrastructure Layer (`src/infrastructure/`)**: Concrete implementations of database persistence (SQLite repository adapter), Redis session store, telemetry, logger.
4. **Interfaces Layer (`src/interfaces/`)**: Fastify REST HTTP endpoints, DTO schema validations, JWT auth hooks, Correlation ID propagation middleware.

---

## 9-Agent Enterprise Roster & Capabilities

- **Aya (Chief Architect)**: Clean Architecture enforcer, Fastify plugin structure, modular boundaries.
- **Tarek (Market Strategist)**: Egyptian wholesale market dynamics, tiered bulk pricing, affiliate merchant acquisition.
- **Farida (Logistics Ops)**: Zonal dispatch algorithms, driver route optimization, COD failed-delivery mitigation.
- **Hazem (Fintech Architect)**: Double-entry ledger invariants, zero-sum balancing, multi-party escrow clearing.
- **Nour (AI & Prompts)**: Voice-to-JSON Egyptian dialect parsing (Ammiya), Arabic SEO slug generation.
- **Omar (Backend Lead)**: Fastify REST routes, JWT bearer + Redis whitelist authentication, controller logic.
- **Ziad (Database Architect)**: Portable SQL DDL, index tuning, SQLite (Dev) to SQL Server (Prod) migration pathways.
- **Khaled (DevOps Master)**: Git repository sync, correlation ID request tracing, PM2 & Docker containerization.
- **Documentation Agent**: System architecture decision records (ADRs), ERDs, and API specs.
