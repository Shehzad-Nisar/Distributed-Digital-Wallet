# TransMoney Distributed Digital Wallet - Entity Relationship (ER) Diagram

**Course:** Distributed Database Systems (Sir Umair)  
**Database Engine:** PostgreSQL 17  
**Schema Model:** Horizontally Sharded Ledger Architecture  

---

## 1. Visual Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS {
        bigint user_id PK
        string full_name
        string email UK
        string phone_number
        string password
        string role
        timestamp created_at
        timestamp updated_at
    }

    ACCOUNTS {
        bigint account_id PK
        bigint user_id FK
        string account_number UK
        decimal balance
        string currency
        string shard
        string status
        bigint version
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        bigint id PK
        string transaction_id UK
        bigint sender_account_id FK
        bigint receiver_account_id FK
        decimal amount
        string currency
        decimal target_amount
        string target_currency
        decimal exchange_rate
        string description
        string type
        string status
        timestamp created_at
        timestamp updated_at
    }

    LEDGER_ENTRIES {
        bigint entry_id PK
        bigint transaction_id FK
        bigint account_id FK
        string entry_type
        decimal amount
        decimal balance_after
        timestamp created_at
    }

    IDEMPOTENCY_RECORDS {
        bigint id PK
        string idempotency_key UK
        string request_hash
        string status
        int status_code
        text response_payload
        string transaction_id
        string error_message
        timestamp created_at
        timestamp updated_at
    }

    MERCHANTS {
        bigint merchant_id PK
        string merchant_code UK
        string name
        string category
        bigint account_id FK
        bigint user_id FK
        decimal fee_rate_percent
        decimal accumulated_gross
        decimal accumulated_fees
        decimal accumulated_net_settled
        decimal unsettled_balance
        string secret_key
        string status
        timestamp created_at
        timestamp updated_at
    }

    SETTLEMENT_BATCHES {
        bigint id PK
        string batch_reference UK
        bigint merchant_id FK
        string merchant_name
        bigint settlement_account_id FK
        int transaction_count
        decimal gross_volume
        decimal total_fees
        decimal net_settlement_amount
        string status
        timestamp created_at
    }

    %% Entity Cardinalities & Relationships
    USERS ||--o{ ACCOUNTS : "1-to-Many (User owns 1..N Accounts)"
    USERS ||--o{ MERCHANTS : "1-to-Many (User registers 0..N Merchant Businesses)"
    ACCOUNTS ||--o{ TRANSACTIONS : "1-to-Many (Source Account sends Transfers)"
    ACCOUNTS ||--o{ TRANSACTIONS : "1-to-Many (Destination Account receives Transfers)"
    ACCOUNTS ||--o{ LEDGER_ENTRIES : "1-to-Many (Account records immutable debits/credits)"
    ACCOUNTS ||--o{ MERCHANTS : "1-to-1 (Merchant linked to Operating Wallet Account)"
    ACCOUNTS ||--o{ SETTLEMENT_BATCHES : "1-to-Many (Settlement Account receives net batch payout)"
    TRANSACTIONS ||--|{ LEDGER_ENTRIES : "1-to-2 (Each Tx generates exactly 1 DEBIT & 1 CREDIT entry)"
    MERCHANTS ||--o{ SETTLEMENT_BATCHES : "1-to-Many (Merchant accumulates periodic settlements)"
```

---

## 2. Relational Schema & Partitioning Specification

### 1. `users` (Identity & Security Partition)
- **Primary Key:** `user_id` (`BIGSERIAL`)
- **Key Fields:** `email` (Unique), `full_name`, `password` (BCrypt hash), `role` (`ROLE_USER`, `ROLE_ADMIN`).
- **Relationship:** One user can own multiple multi-currency accounts across regional shards.

### 2. `accounts` (Distributed Shard Partition)
- **Primary Key:** `account_id` (`BIGSERIAL`)
- **Foreign Key:** `user_id -> users(user_id)`
- **Key Fields:**
  - `shard`: Regional partition (`SHARD_1_NORTH`, `SHARD_2_CENTRAL`, `SHARD_3_SOUTH`, `SHARD_4_ENTERPRISE`).
  - `balance`: Exact financial precision (`DECIMAL(18,2)`).
  - `currency`: ISO-4217 code (`PKR`, `USD`, `EUR`, `GBP`, `AED`).
  - `version`: Optimistic lock versioning token (`BIGINT`).
- **Indexes:**
  - `idx_account_number` (`UNIQUE` on `account_number`)
  - `idx_account_user_id` (B-Tree on `user_id`)
  - `idx_account_shard` (B-Tree on `shard` for partition pruning)

### 3. `transactions` (Global 2PC Transaction Log)
- **Primary Key:** `id` (`BIGSERIAL`)
- **Key Fields:**
  - `transaction_id`: UUIDv4 tracking identifier (`TX-...`).
  - `sender_account_id` & `receiver_account_id`: Source and destination accounts.
  - `amount`, `currency`, `target_amount`, `target_currency`, `exchange_rate` (FX Conversion).
  - `status`: Two-Phase Commit state machine (`INITIATED`, `PREPARED`, `COMMITTED`, `ABORTED`, `FAILED`).
- **Indexes:**
  - `idx_tx_transaction_id` (`UNIQUE`)
  - `idx_tx_sender_account`
  - `idx_tx_receiver_account`
  - `idx_tx_created_at_amount` (Composite index for high-speed chronological queries)

### 4. `ledger_entries` (Immutable GAAP Double-Entry Journal)
- **Primary Key:** `entry_id` (`BIGSERIAL`)
- **Foreign Key:** `transaction_id -> transactions(id)`
- **Key Fields:**
  - `account_id`: Account experiencing balance change.
  - `entry_type`: `DEBIT` (outflow) or `CREDIT` (inflow).
  - `amount`: Transaction increment.
  - `balance_after`: Snapshot balance after atomic commit.
- **Mathematical Invariant:** For every committed transaction:
  $$\sum \text{Debit} - \sum \text{Credit} = 0.00$$

### 5. `idempotency_records` (Distributed Deduplication Store)
- **Primary Key:** `id` (`BIGSERIAL`)
- **Key Fields:**
  - `idempotency_key`: Client-generated UUIDv4 key.
  - `request_hash`: SHA-256 payload digest.
  - `status`: `PENDING`, `COMPLETED`, `FAILED`.
  - `response_payload`: Cached atomic response for duplicate replay.

### 6. `merchants` & `settlement_batches` (Commercial Clearing)
- Supports business operations, point-of-sale QR code payments, accumulated gross transactions, fee deduction (e.g. 1.5%), and scheduled net settlement batch execution.
