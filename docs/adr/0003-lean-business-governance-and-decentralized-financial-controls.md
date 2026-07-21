# ADR 0003: Lean Business Governance & Decentralized Financial Controls

- **Status**: Approved
- **Deciders**: Hazem (Fintech & Business Lead), Aya (Chief Architect), Tarek (Market Strategist), Farida (Logistics)
- **Date**: 2026-07-21

## Context & Problem Statement
Zumra.shop is operating as a bootstrapped, lean project with limited launch capital and high technical leverage. The business strategy relies on rapid iteration, zero infrastructure bloat, and early cash-flow positivity in high-density Egyptian markets (e.g. El-Ataba). 

To avoid single-point bottlenecks, business governance and financial controls must be **decentralized across domain agents** while strictly upholding financial invariants.

## Decision Drivers
1. **Practical Business Learning**: Financial and business terminology must be mapped directly to domain code and explained in practical context for developer learning.
2. **Decentralized Agent Alignment**: Every technical subagent (Logistics, Backend, Database, AI) must autonomously enforce business/financial constraints within its own bounded context.
3. **Frugal Capital Allocation**: OPEX is kept near $0 by leveraging local high-spec hardware and AI/Vibe Coding, reserving launch funds exclusively for COD float and operational trust-building.

## Decentralized Financial Invariants Across Agents

```
                        +---------------------------------------+
                        |      Hazem (Business & Finance)      |
                        |   Strategic ROI & Ledger Governance   |
                        +-------------------+-------------------+
                                            |
         +------------------+---------------+-------------------+------------------+
         |                  |                                   |                  |
         v                  v                                   v                  v
+------------------+ +-------------------+             +------------------+ +------------------+
| Tarek (Market)   | | Farida (Logistics)|             | Omar (Backend)   | | Ziad (DB Arch)   |
| Business Rule:   | | Business Rule:    |             | Business Rule:   | | Business Rule:   |
| Zero-burn CAC &  | | COD Remittance    |             | Correlation ID   | | Immutable DDL &  |
| Positive Margin  | | Threshold Cap     |             | & Escrow Auth    | | Fast Balance Index|
+------------------+ +-------------------+             +------------------+ +------------------+
```

### Agent Integration & Governance Rules:

1. **Hazem (Business & Finance Lead):**
   - Defines Unit Economics, Ledger Invariants, and Capital Allocation.
   - Validates that every new feature contributes directly to ROI or Cash-Flow velocity.

2. **Tarek (Market & Trade Strategist):**
   - **Business Constraint:** No promotional discounts that result in negative gross margins.
   - **Rule:** Bulk pricing tier logic (`wholesale_price_tiers`) must always maintain minimum platform commission.

3. **Farida (Logistics & Fleet Ops):**
   - **Business Constraint:** Mitigate COD cash leakage and driver holdovers.
   - **Rule:** Enforce `COD_RECONCILIATION_THRESHOLD` (e.g., 5,000 EGP cap). Drivers exceeding cap cannot receive new dispatch assignments until cash is cleared.

4. **Omar (Backend Engineer) & Ziad (Database Architect):**
   - **Business Constraint:** Ironclad audit trail and data integrity.
   - **Rule:** All ledger mutations require a balanced `journal_entry` in SQLite/SQL Server with `correlation_id` header tracking.

5. **Nour (AI & Prompts Engineer):**
   - **Business Constraint:** Reduce customer support costs and speed up merchant onboarding.
   - **Rule:** Localized Voice-to-JSON parsing processes Egyptian dialect directly into structured order JSON without human intervention.

## Consequences
- **Positive**: Complete alignment between code implementation and business viability; zero wasted capital; self-funding growth trajectory.
- **Negative**: Feature releases must pass financial invariant validation before deployment.
