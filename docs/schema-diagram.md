# Zumra.shop Database Schema ERD

```mermaid
erDiagram
    users ||--o{ merchants : "owns"
    users ||--o{ affiliates : "owns"
    users ||--o{ drivers : "owns"

    zones ||--o{ merchants : "located_in"
    zones ||--o{ drivers : "assigned_to"
    zones ||--o{ shipments : "delivered_in"

    drivers ||--o{ shipments : "delivers"
    drivers ||--o{ cod_reconciliations : "remits"

    journal_entries ||--|{ ledger_lines : "contains"
    accounts ||--o{ ledger_lines : "records"

    users {
        string id PK
        string role "CUSTOMER|MERCHANT|AFFILIATE|DRIVER|ADMIN"
        string name
        string phone
        string email
        string status
    }

    zones {
        string id PK
        string code "ATABA|FAGALA"
        string name_ar
        string market_type
    }

    drivers {
        string id PK
        string user_id FK
        string zone_id FK
        string vehicle_type
        string status "OFFLINE|AVAILABLE|ON_DELIVERY"
    }

    shipments {
        string id PK
        string order_id FK
        string driver_id FK
        string zone_id FK
        string status "PENDING|ASSIGNED|PICKED_UP|DELIVERED|FAILED"
        numeric cod_amount
    }

    accounts {
        string id PK
        string code UNIQUE
        string name
        string type "ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE"
    }

    journal_entries {
        string id PK
        string correlation_id
        string reference_type "ORDER|PAYOUT|REFUND|COD_DEPOSIT"
        string reference_id
        string status
    }

    ledger_lines {
        string id PK
        string journal_entry_id FK
        string account_id FK
        string entry_type "DEBIT|CREDIT"
        numeric amount
    }
```
