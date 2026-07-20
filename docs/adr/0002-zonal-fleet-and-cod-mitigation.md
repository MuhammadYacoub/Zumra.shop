# ADR 0002: Zonal Fleet Management & COD Failed-Delivery Mitigation

- **Status**: Approved
- **Deciders**: Farida (Logistics), Tarek (Market), Aya (Chief Architect)
- **Date**: 2026-07-21

## Context & Problem Statement
Egyptian wholesale markets are dense urban environments with localized transit constraints (motorcycles, tricycles, pickups). Delivery rejection or driver cash holding (COD) poses operational risks if not managed within explicit geographic zones.

## Decision Drivers
1. **Zonal Partitioning**: Drivers are locked to designated market zones (e.g., `ZONE-ATABA-01`, `ZONE-FAGALA-01`) for rapid dispatch.
2. **COD Remittance Audit**: Drivers cannot accept new high-value orders if un-remitted cash exceeds threshold without a verified `cod_reconciliations` record.
3. **Failed-Delivery Protocols**: Max 2 delivery attempts before triggering an automated inventory return and ledger rollback.

## Technical Architecture
- `zones`: Primary geographic boundary and market context.
- `drivers`: Active state machine (`OFFLINE` -> `AVAILABLE` -> `ON_DELIVERY`).
- `shipments`: Tracks lifecycle (`PENDING` -> `ASSIGNED` -> `PICKED_UP` -> `DELIVERED` | `FAILED` -> `RETURNED`).
- `cod_reconciliations`: Audits daily cash handed over by drivers to market hubs.

## Risk Mitigation Matrix
| Scenario | Detection Mechanism | Operational Action | Financial Adjustment |
| :--- | :--- | :--- | :--- |
| **Driver Cash Holdover** | Unmatched COD > 5,000 EGP | Suspend driver dispatch status | Hold driver incentive payout |
| **Failed Delivery** | Customer refusal / Unreachable | Reroute shipment back to merchant | Reverse merchant payable, debit return fee |
| **Zone Overflow** | High pending orders in El-Ataba | Dynamic driver cross-zone transfer | Reallocate nearby available fleet |
