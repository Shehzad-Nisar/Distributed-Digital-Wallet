# Distributed Digital Wallet Transaction System (TransMoney)

A high-performance, fault-tolerant distributed digital wallet architecture built with **Java 21**, **Spring Boot 3**, **PostgreSQL 17**, and **React 19**. Features an ACID-compliant **Two-Phase Commit (2PC) Coordinator** for cross-border/cross-shard money transfers, deterministic pessimistic deadlock prevention, and immutable double-entry ledger bookkeeping.

---

## 👥 Course & Team Attribution
- **Course:** Distributed Database Systems
- **Instructor:** Sir Umair
- **Target Submission:** September 28, 2026
- **Team Members:**
  - **Shehzad Nisar** (B22110006147)
  - **Muhammad Ashraf** (B22110006090)
  - **Daniyal Ahmed** (B21110006024)

---

## 🏛️ System Architecture

The project strictly follows the industry-standard **Layered / MVCS (Model-View-Controller-Service)** architecture:

```
Distributed-Digital_Wallet/
├── backend/                                   # Spring Boot 3.4.3 Application (Port 8080)
│   ├── src/main/java/com/transmoney/backend/
│   │   ├── config/
│   │   │   ├── CorsConfig.java                # Cross-Origin Resource Sharing (allows frontend dev server)
│   │   │   ├── DataInitializer.java           # Auto-seeds Country Accounts (US, UK, SG, UAE) & 2PC Prime Transfer
│   │   │   └── OpenApiConfig.java             # OpenAPI 3.0 / Swagger UI Configuration
│   │   ├── controller/                        # REST Controllers with Swagger @Tag and @Operation
│   │   │   ├── AccountController.java         # /api/accounts, /api/accounts/{id}/transactions
│   │   │   ├── HealthController.java          # /api/health (live PostgreSQL connection probe)
│   │   │   ├── TransferController.java        # /api/transfers (2PC), /api/transactions
│   │   │   └── UserController.java            # /api/users
│   │   ├── service/                           # Core Business Logic
│   │   │   ├── AccountService.java
│   │   │   ├── TransferService.java           # Dynamic search/sort specification & PageResponse mapping
│   │   │   ├── UserService.java
│   │   │   └── coordinator/
│   │   │       └── TwoPhaseCommitCoordinator.java  # 2PC Engine (Sorted Pessimistic Lock, Vote, Commit)
│   │   ├── repository/                        # Spring Data JPA Repositories
│   │   │   ├── AccountRepository.java         # findByIdForUpdate (PESSIMISTIC_WRITE)
│   │   │   ├── LedgerEntryRepository.java
│   │   │   ├── MerchantRepository.java
│   │   │   ├── TransactionRepository.java     # Extends JpaSpecificationExecutor
│   │   │   └── UserRepository.java
│   │   ├── entity/                            # PostgreSQL JPA Entities
│   │   │   ├── Account.java                   # Sharded account state & versioning
│   │   │   ├── LedgerEntry.java               # Immutable Double-Entry Ledger (DEBIT, CREDIT)
│   │   │   ├── Merchant.java                  # Global merchant directory
│   │   │   ├── Transaction.java               # Distributed transaction audit trail
│   │   │   └── enums/
│   │   │       ├── ShardType.java             # SHARD_1_US, SHARD_2_UK, SHARD_3_SG, SHARD_4_UAE
│   │   │       ├── TransactionStatus.java     # INITIATED, PREPARED, COMMITTED, FAILED
│   │   │       └── TransactionType.java       # P2P_TRANSFER, MERCHANT_PAYMENT, DEPOSIT, WITHDRAWAL
│   │   └── dto/                               # Data Transfer Objects & Pagination Metadata
│   └── src/main/resources/
│       ├── application.yml                    # Database & Hibernate configurations
│       └── static/                            # Synchronized React Production Build (Served at /)
│
├── frontend/                                  # React 19 + TypeScript + Vite + Tailwind CSS v4 (Port 5173)
│   ├── src/
│   │   ├── api/client.ts                      # Axios API client
│   │   ├── types/index.ts                     # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Header.tsx                     # Live DB probe, Swagger link, team info
│   │   │   ├── ShardClusterView.tsx           # Multi-Country Geo-Partition Visualizer
│   │   │   ├── TransferConsole.tsx            # Live 2PC Consensus Execution Visualizer
│   │   │   └── TransactionHistory.tsx         # Multi-Criteria Search, Sort & Ledger Drilldown
│   │   └── App.tsx                            # Main Application Dashboard
│   └── vite.config.ts                         # Tailwind v4 plugin & /api proxy to Spring Boot (port 8080)
│
└── TransMoney_Postman_Collection.json         # Complete Postman Collection ready for evaluator import
```

---

## ⚡ Core Distributed Database Protocols

### 1. Two-Phase Commit (2PC) Cross-Shard Coordinator
Cross-border transfers span distinct database partitions sitting in different regions:
1. **Phase 0 (Deterministic Pessimistic Locking):**
   - Locks sender and receiver accounts in **strictly ascending account ID order** (`Math.min` before `Math.max`) using `SELECT ... FOR UPDATE` (`PESSIMISTIC_WRITE`).
   - Mathematically eliminates distributed deadlocks between concurrent transfers.
2. **Phase 1 (Prepare / Vote):**
   - Checks active status, currency consistency, and verifies sender balance sufficiency.
   - If conditions pass, participant votes `VOTE_COMMIT`. If insufficient balance, votes `VOTE_ABORT` and transaction rolls back without touching balances.
3. **Phase 2 (Commit / Rollback):**
   - Atomically updates balances across shards.
   - Writes immutable double-entry ledger rows and commits transaction status to `COMMITTED`.

### 2. Double-Entry Bookkeeping Ledger
Every transfer generates two immutably recorded ledger entries:
- A `DEBIT` entry against the sender's account.
- A `CREDIT` entry against the recipient's account.
- Mathematically satisfies: $\sum \text{Debits} == \sum \text{Credits}$ for auditability.

### 3. Multi-Country Shard Topology
Accounts are mapped to geographical financial hubs:
- 🇺🇸 **`SHARD_1_US`**: United States (North America • New York / AWS `us-east-1`)
- 🇬🇧 **`SHARD_2_UK`**: United Kingdom (Europe • London / AWS `eu-west-2`)
- 🇸🇬 **`SHARD_3_SG`**: Singapore (Asia-Pacific • Singapore / AWS `ap-southeast-1`)
- 🇦🇪 **`SHARD_4_UAE`**: United Arab Emirates (Middle East • Dubai DIFC Treasury)

---

## 🛠️ Prerequisites

1. **Java 21 LTS** (`java -version` returns Java 21)
2. **PostgreSQL 17.2** running on port `5432` with database `transmoney_db` (credentials: `transmoney_user` / `transmoney_password`)
3. **Node.js v20+** and **npm** (for Frontend dev server)

---

## 🚀 Quick Start Guide (Step-by-Step Commands)

### Step 1: Ensure PostgreSQL is Running
Verify PostgreSQL is ready to accept connections:
```powershell
& "D:\tools\pgsql\pgsql\bin\pg_isready.exe" -h localhost -p 5432
```
*(If stopped, start PostgreSQL via `& "D:\tools\pgsql\pgsql\bin\postgres.exe" -D "D:\tools\pgsql\data"`)*

---

### Step 2: Start the Spring Boot Backend Server
Open a terminal in the project directory:

```powershell
cd e:\Projects\Disributed-Digital_Wallet\backend
$env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd spring-boot:run
```

- The backend initializes on **`http://localhost:8080`**.
- [`DataInitializer.java`](file:///e:/Projects/Disributed-Digital_Wallet/backend/src/main/java/com/transmoney/backend/config/DataInitializer.java) automatically seeds the international accounts on startup.
- **Bonus:** Spring Boot automatically serves the compiled React application directly at **`http://localhost:8080/`**!

---

### Step 3: (Optional) Start the React Frontend Dev Server
If you want to run the React development server with hot-reload:
Open a second terminal:

```powershell
cd e:\Projects\Disributed-Digital_Wallet\frontend
npm run dev
```

- The Vite server launches at **`http://localhost:5173`**.
- All `/api` requests are automatically proxied to Spring Boot at `http://localhost:8080`.

---

## 🖥️ Live Interactive Interfaces

| Interface | URL | Purpose |
| :--- | :--- | :--- |
| **TransMoney Live Console** | **`http://localhost:8080/`** or **`http://localhost:5173/`** | Visual Shard Topology, Interactive 2PC Execution Visualizer, Search & Double-Entry Ledger Drilldown |
| **Interactive Swagger Docs** | **`http://localhost:8080/swagger-ui.html`** | Interactive OpenAPI 3.0 API documentation and live request testing |
| **OpenAPI Specification** | **`http://localhost:8080/v3/api-docs`** | Raw OpenAPI JSON schema definition |
| **Postman Collection** | [`TransMoney_Postman_Collection.json`](file:///e:/Projects/Disributed-Digital_Wallet/TransMoney_Postman_Collection.json) | Ready-to-import Postman collection in project root |

---

## 🌟 Pre-Seeded Country Accounts & Demo Data

The system automatically initializes with these multi-country accounts:

| Country & Shard | Account Number | User Name | Initial Balance | Currency |
| :--- | :--- | :--- | :--- | :--- |
| 🇺🇸 **United States** (`SHARD_1_US`) | `ACC-US-001` | **Alice Smith** | **$9,500.00** | **USD** |
| 🇬🇧 **United Kingdom** (`SHARD_2_UK`) | `ACC-UK-002` | **Bob Jones** | **$3,000.00** | **USD** |
| 🇸🇬 **Singapore** (`SHARD_3_SG`) | `ACC-SG-003` | **Charlie Tanaka** | **$5,000.00** | **USD** |
| 🇦🇪 **UAE / Global** (`SHARD_4_UAE`) | `ACC-UAE-004` | **Emirates Global Treasury** | **$100,000.00** | **USD** |

- **Global Merchants:** Amazon Web Services (US), Deliveroo London (UK), Grab Southeast Asia (SG), Emirates Global Aviation (UAE).
- **Initial 2PC Wire:** Pre-executed transfer of **$500.00 USD** from Alice (US) to Bob (UK) so transaction and ledger histories are populated immediately.

---

## 🧪 Running Automated Tests

Run the full verification suite against live PostgreSQL:

```powershell
cd e:\Projects\Disributed-Digital_Wallet\backend
$env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd test
```

### Verified Scenarios (All 8 Tests PASS):
1. `TwoPhaseCommitIntegrationTest.testSuccessfulCrossShardTransfer`: Validates full cross-shard 2PC lifecycle, balance updates, and strict double-entry debits/credits parity.
2. `TwoPhaseCommitIntegrationTest.testInsufficientBalanceRejection`: Validates Phase 1 vote abort and guarantees zero balance changes on failed transfers.
3. `TransactionSearchAndApiIntegrationTest.testSearchByKeyword`: Verifies partial keyword search over transaction memo/ID (Proposal Section 6).
4. `TransactionSearchAndApiIntegrationTest.testNumericRangeFilterAndSort`: Verifies B-tree numerical range filtering and custom sorting (Proposal Section 6).
5. `TransactionSearchAndApiIntegrationTest.testGlobalTransactionsEndpoint`: Validates global search with page metadata (Proposal Section 7).
6. `TransactionSearchAndApiIntegrationTest.testSwaggerOpenApiDocs`: Verifies OpenAPI 3.0 specification generation.
7. `TransactionSearchAndApiIntegrationTest.testStaticDashboardServed`: Verifies embedded single-page dashboard serving.
8. `BackendApplicationTests.contextLoads`: Verifies Spring Boot ApplicationContext boots cleanly.

---

## 📡 Key REST API Endpoints

### 1. Health Probe
```http
GET http://localhost:8080/api/health
```

### 2. Execute 2PC Cross-Border Transfer
```http
POST http://localhost:8080/api/transfers
Content-Type: application/json

{
  "senderAccountId": 65,
  "receiverAccountId": 66,
  "amount": 500.00,
  "currency": "USD",
  "description": "Cross-Border 2PC Wire: US Shard to UK Shard"
}
```

### 3. Multi-Criteria Transaction Search & Filter (Proposal Sec 6 & 7)
```http
GET http://localhost:8080/api/accounts/65/transactions?search=Wire&minAmount=100&maxAmount=1000&sort=createdAt&order=desc&page=0&size=20
```

### 4. Global Transactions Search
```http
GET http://localhost:8080/api/transactions?minAmount=500&sort=amount&order=desc
```
