# ADR 0005: Hybrid Product Cataloging & MarTech Event Architecture

- **Status**: Approved
- **Deciders**: Aya (Chief Architect), Nour (AI Engineer), Ziad (DB Architect), Omar (Backend Lead), Tarek (Market Expert)
- **Date**: 2026-07-21

## Context & Problem Statement
As Zumra.shop operates initially under a 1st Party (1P) Direct Sourcing Model and dogfoods its own platform as its primary merchant, adding, barcode-tagging, tracking, and marketing wholesale products must be frictionless, fast, and highly reliable. Wholesale Egyptian trade markets (El-Ataba, El-Fagala) use non-standardized packaging, local trade slang (e.g. "دستة", "ربطة", "طرد"), and variable SKU units. Furthermore, the platform requires an enterprise-grade MarTech event engine to integrate with multi-channel marketing platforms (Meta CAPI, GA4, TikTok Pixel, CDPs) and trigger B2B psychological marketing mechanics.

## Decision Drivers
1. **Frictionless Dogfooding & Cataloging**: Merchants and warehouse operators must be able to barcode-scan, auto-generate SKUs, or upload invoices via AI/OCR with minimal manual entry.
2. **Hybrid Barcoding Standard**: Full support for international standard barcodes (GS1/EAN-13/UPC) alongside internal custom QR/Barcode generation for non-barcoded wholesale goods.
3. **MarTech Plug-and-Play Integration**: Decoupled event-driven marketing pipeline allowing real-time streaming of platform user events to external marketing adapters without blocking HTTP request flows.
4. **B2B Merchant Psychology**: Native support for wholesale psychological mechanics (tiered bulk pricing, cash rebates, real-time stock scarcity, and trust badges).

## Considered Options
1. **Option A**: Monolithic synchronous catalog management with tightly coupled analytics code inside controllers.
2. **Option B**: Asynchronous Event-Driven Architecture with an Append-Only Catalog Engine, GS1/Internal SKU Generator, Redis Pub/Sub Event Bus, and Universal Marketing Adapters.

## Decision Outcome
Chosen Option: **Option B**.

### Technical Specifications & Architecture

```
                                [ Product Creation / OCR Ingestion ]
                                                 │
                                                 ▼
[ GS1 / Internal SKU Engine ] ◄──► [ Dynamic Product Catalog (JSONB Attributes) ]
                                                 │
                                                 ▼
                                     [ Domain Events Bus ]
                                                 │
                      ┌──────────────────────────┴──────────────────────────┐
                      ▼                                                     ▼
           [ Financial Ledger ]                               [ MarTech Event Dispatcher ]
      (COGS / Bulk Discount Engine)                               (Redis Pub/Sub Queue)
                                                                            │
                                                     ┌──────────────────────┼──────────────────────┐
                                                     ▼                      ▼                      ▼
                                              [ Meta CAPI ]              [ GA4 ]            [ TikTok / CDP ]
```

#### 1. Hybrid Product Cataloging & Barcode Ingestion Engine
- **SKU Resolution Order**:
  1. `GS1 / EAN-13 / UPC` barcode if present on packaging.
  2. `Zumra Generated SKU` (`ZUMRA-{CAT}-{RANDOM6}`) rendered via `bwip-js` / `jsbarcode`.
- **Slang Normalization (AI Layer)**:
  - Ingestion via OCR/LLM normalizes trade terms ("دستة" = 12 units, "طرد" = Master Carton, "ربطة" = Bundle).
  - Catalog attributes store flexible packaging hierarchies in PostgreSQL/SQLite `JSONB` columns.

#### 2. MarTech Event-Driven Engine Architecture
- **Event Bus**: Asynchronous Event Emitter over Redis Pub/Sub (`marketing.events`).
- **Core Marketing Events**:
  - `PRODUCT_VIEWED`, `PRODUCT_SEARCHED`, `CART_UPDATED`, `CHECKOUT_INITIATED`, `ORDER_COMPLETED`, `BULK_REBATE_EARNED`.
- **Universal Adapter Pipeline**:
  - Each marketing channel (Meta CAPI, Google Analytics 4, TikTok Pixel, Segment/RudderStack) implements a clean `IMarTechAdapter` interface.
  - Events are processed asynchronously with exponential backoff retries and idempotency tracking.

#### 3. B2B Psychological Marketing Triggers
- **Tiered Bulk Pricing Engine**: Dynamic pricing recalculation based on volume tiers (`1-4 Cartons`, `5-9 Cartons`, `10+ Cartons`).
- **Cashback & Rebate Integration**: Double-entry ledger integration for merchant loyalty cashbacks (`ACC-2030-PAYABLE-REBATE`).
- **Scarcity & Trust Signals**: Real-time stock reservation indicators ("Only 12 cartons remaining in El-Fagala warehouse").

## Consequences
- **Positive**:
  - Extremely low friction for product cataloging and barcode generation.
  - Non-blocking marketing analytics with zero latency impact on API endpoints.
  - Modular integration for future marketing channels (Plug-and-Play).
  - Direct alignment with Egyptian wholesale merchant behavior and B2B pricing psychology.
- **Negative**:
  - Requires maintaining Redis event workers for MarTech payload dispatches.
  - Requires continuous maintenance of the trade slang dictionary in the AI normalization layer.
