# ADR 0004: Logistics Operating & Zonal Fleet Management Model

- **Status**: Approved
- **Deciders**: Farida (Logistics & Fleet Ops), Tarek (Market Strategist), Hazem (Fintech & Business Lead), Ziad (DB Arch), Aya (Chief Architect)
- **Date**: 2026-07-21

## Context & Problem Statement
Traditional Egyptian wholesale trading hubs (e.g., El-Ataba, El-Fagala) are characterized by ultra-high density, narrow thoroughfares, heavy traffic, and predominant Cash-on-Delivery (COD) transactions. Single-tier delivery models (such as pure gig-economy "Uberization" or pure full-time salaried fleets) fail due to high cash leakage risks, unpredictable peak volumes, and localized transit bottlenecks.

To bridge wholesale trade with digital commerce, Zumra.shop requires an aligned operating model governing drivers, merchant pickups, zonal expansion, and financial ledger synchronization.

## Alignment Matrix: Business & Technical Integration

```
                         +-----------------------------------+
                         |    Farida (Logistics Ops Lead)    |
                         |  Zonal Fleet & Pickup Framework   |
                         +-----------------+-----------------+
                                           |
               +---------------------------+---------------------------+
               v                                                       v
+------------------------------+                       +------------------------------+
|   Tarek (Market Strategist)  |                       |  Hazem (Fintech & Business)  |
|  Merchant Tiering & Pickups  |                       | Double-Entry Ledger & Risk   |
+------------------------------+                       +------------------------------+
| • Tier-1 Bulk: Hub Pickups   |                       | • 5,000 EGP COD Driver Cap   |
| • Tier-2 Shops: Milk-Runs    |                       | • Instant InstaPay Remit     |
| • JIT Cross-Docking Orders   |                       | • Lean OPEX Hybrid Driver Cost|
+------------------------------+                       +------------------------------+
```

## Strategic Decisions

### 1. Hybrid Driver Operating Model & Compensation Structure
- **First-Mile Zonal Pickups (طياري التجميع والسحب من التجار)**:
  - **Status**: Salaried Core Captains (مرتب أساسي + بونص سحب per-pickup ~5-10 EGP).
  - **Role**: Perform batched zonal sweeps (Milk Runs) across 10-15 merchants per run in El-Ataba / El-Fagala. They NEVER deliver directly to end-customers. They deposit all collected items at the market Micro-Hub.
- **Last-Mile Customer Delivery (طياري التوصيل للعميل النهائي)**:
  - **Status**: Freelance / Gig Drivers (Uberization) & 3PL Partners.
  - **Compensation**: Paid per successful customer delivery drop (Per-Drop Fee ~35-50 EGP).
  - **Role**: Load pre-consolidated single-box customer orders from the Micro-Hub and follow batched delivery routes to end-customers in designated target zones.
- **Gig / Uberization Risk Restriction**: Restricted to prepaid/digital orders or low-value COD (< 1,000 EGP) until building a verified Zumra Credit Rating.

### 2. Merchant Classification & Two-Stage Routing Pipeline
- **Stage 1: First-Mile Merchant Sweeps (Zonal Consolidation)**: Drivers sweep merchants *by geographical lane*, NOT by individual customer orders. One driver collects items for 50 different customer orders across 10 neighboring shops in a single pass to the Hub.
- **Stage 2: Hub Assembly & Multi-Merchant Order Consolidation**: The Micro-Hub sorting team receives items from multiple First-Mile sweeps and packs Customer A's items (from Merchant X in El-Ataba and Merchant Y in El-Fagala) into **1 single consolidated parcel**.
- **Stage 3: Last-Mile Delivery Dispatch**: A single Last-Mile driver receives 15-20 pre-packed customer parcels from the Hub and delivers them along an optimized customer route.
- **Tier-1 Wholesalers (جملة الجملة)**: Scheduled Bulk Pickups twice daily (Morning/Afternoon shifts) using vans or heavy tricycles.
- **Tier-2 Merchant Shops (محلات التجزئة والجملة المتوسطة)**: "Milk-Run" routing sweeps where motorcycles sweep specific market lanes (e.g., Harat El-Yahoud) to consolidate multi-merchant packages into the Micro-Hub.
- **Just-In-Time (JIT) Cross-Docking**: Instant driver dispatch for non-inventory merchants upon customer order creation.

### 3. Merchant-Centric Zonal Expansion
- Expansion follows **Supply Clusters** (where wholesale merchants concentrate) rather than arbitrary geographic radius.
- **Phase 1 (Supply Hubs)**: `ZONE-ATABA-01` (Electronics, Home Appliances, Apparel) and `ZONE-FAGALA-01` (Stationery, Printing, Office Supplies).
- **Phase 2 (Receiving Micro-Hubs)**: Distribution hubs in Giza, Nasr City, and 6th of October for rapid Last-Mile dispatch.
- **Phase 3 (Governorate Feeder Lines)**: Inter-governorate logistics transport to Delta and Upper Egypt commercial centers.

### 4. Financial Ledger & Risk Resolution
- **COD Remittance & Escrow**: Cash collected by drivers debits `ACC-1010-CASH-DRIVER` (Asset). Remittance at hub or via instant digital wallet (InstaPay) credits driver escrow and clears the 5,000 EGP dispatch lock limit.
- **Multi-Merchant Order Consolidation**: Cross-zone multi-item orders are routed to the market Micro-Hub for single-box consolidation before dispatching to the customer.
- **Failed Delivery Handling**: Max 2 delivery attempts. Failed orders trigger automated inventory return and a double-entry ledger rollback (`REFUND`), deducting a nominal return handling fee from the merchant's payable balance (`ACC-2010-PAYABLE-MERCHANT`) to preserve platform net margins.

## Financial & Operational Invariants
1. `Driver.unremittedCodBalance <= 5,000 EGP` for new dispatch assignments.
2. `Sum(Debits) == Sum(Credits)` on all COD collections, hub reconciliations, and return rollbacks.
3. Every shipment movement carries a unique `correlation_id` header across HTTP logs and database entries.

## Consequences
- **Positive**: Zero cash leakage, low fixed OPEX, seamless integration between wholesale merchant workflows and accounting ledger.
- **Negative**: Requires operational management of local Micro-Hubs within crowded wholesale markets.
