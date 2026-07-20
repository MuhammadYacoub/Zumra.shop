# ADR 0001: Immutable Double-Entry Ledger Architecture

- **Status**: Approved
- **Deciders**: Hazem (Fintech), Ziad (DB Arch), Aya (Chief Architect)
- **Date**: 2026-07-21

## Context & Problem Statement
In traditional Egyptian wholesale trade (e.g. El-Ataba, El-Fagala), high-volume transactions, Cash on Delivery (COD), and multi-party payouts (Merchant, Driver, Affiliate, Platform) create significant financial risk. Single-column account balance tracking is vulnerable to race conditions, silent corruption, and auditing failures.

## Decision Drivers
1. **Absolute Financial Integrity**: Every financial movement must be zero-sum (`Sum(Debits) == Sum(Credits)`).
2. **Auditability**: Journal entries must be immutable; ledger lines cannot be updated or deleted once posted.
3. **Traceability**: Every transaction must link back to an HTTP `correlation_id` and domain reference (Order ID, Payout ID).
4. **Database Portability**: Schema must run on SQLite during local development and seamlessly migrate to SQL Server for Staging/Production.

## Considered Options
1. **Option A**: Single-balance user accounts with mutation logs.
2. **Option B**: Immutable Double-Entry Ledger (`accounts`, `journal_entries`, `ledger_lines`).

## Decision Outcome
Chosen Option: **Option B**.

### Financial Invariants
- Each `journal_entry` contains 2 or more `ledger_lines`.
- Entries are categorized as `DEBIT` or `CREDIT`.
- Account types follow standard GAAP accounting rules:
  - `ASSET`: Debit increases balance, Credit decreases balance.
  - `LIABILITY`: Credit increases balance, Debit decreases balance.
  - `REVENUE`: Credit increases balance.
  - `EXPENSE`: Debit increases balance.

### Sample Double-Entry Flow (Order COD Collection)
```
Debit:  ACC-1010-CASH (Asset)             +1,000 EGP (Driver COD Escrow)
Credit: ACC-2010-PAYABLE-MERCHANT (Liab)  -  900 EGP (Merchant Net)
Credit: ACC-2020-PAYABLE-AFFILIATE (Liab) -   50 EGP (Affiliate Commission)
Credit: ACC-4010-REV-COMMISSION (Revenue)  -   50 EGP (Zumra Fee)
Total Debits = 1,000 EGP | Total Credits = 1,000 EGP (Balanced)
```

## Consequences
- **Positive**: Complete audit compliance, zero race-condition balance leakage, instant discrepancy detection.
- **Negative**: Increased row counts; requires database indexing on `journal_entries(correlation_id)` and `ledger_lines(account_id)`.
