# Distributed Digital Wallet Transaction System (TransMoney)

A high-performance, fault-tolerant distributed digital wallet backend architecture built with **Java 21**, **Spring Boot**, and **PostgreSQL**. Features an ACID-compliant **Two-Phase Commit (2PC) Coordinator** for cross-shard transfers, double-entry ledger bookkeeping, and pessimistic lock concurrency controls.

---

## 👥 Team Members
- **Shehzad Nisar**
- **Muhammad Ashraf**
- **Daniyal Ahmed**

---

## 🏛️ System Architecture
The project strictly follows the industry-standard **Layered / MVCS (Model-View-Controller-Service)** architecture:

```
backend/src/main/java/com/transmoney/backend/
├── controller/            # API Endpoints (Routing & HTTP request handlers)
│   ├── AccountController.java
│   ├── HealthController.java
│   ├── TransferController.java
│   └── UserController.java
├── service/               # Core Business Logic & Orchestration
│   ├── AccountService.java
│   ├── TransferService.java
│   ├── UserService.java
│   └── coordinator/
│       └── TwoPhaseCommitCoordinator.java   # 2PC Coordinator (Prepare, Vote, Commit)
├── repository/            # Data Access Layer (Spring Data JPA)
│   ├── AccountRepository.java
│   ├── LedgerEntryRepository.java
│   ├── MerchantRepository.java
│   ├── TransactionRepository.java
│   └── UserRepository.java
├── entity/                # Data Models & Schemas
│   ├── Account.java
│   ├── LedgerEntry.java
│   ├── Merchant.java
│   ├── Transaction.java
│   ├── User.java
│   └── enums/
│       ├── LedgerEntryType.java             # DEBIT, CREDIT
│       ├── ShardType.java                   # SHARD_1_NORTH, SHARD_2_CENTRAL, etc.
│       ├── TransactionStatus.java           # INITIATED, PREPARED, COMMITTED, FAILED
│       └── TransactionType.java             # P2P_TRANSFER, MERCHANT_PAYMENT, etc.
├── dto/                   # Data Transfer Objects
│   ├── request/
│   │   ├── CreateAccountRequest.java
│   │   ├── CreateUserRequest.java
│   │   └── TransferRequest.java
│   └── response/
│       ├── AccountBalanceResponse.java
│       ├── ApiResponse.java
│       ├── TransactionResponse.java
│       └── TransferResponse.java
└── exception/             # Centralized Exception Handling
    ├── GlobalExceptionHandler.java
    ├── InsufficientBalanceException.java
    ├── ResourceNotFoundException.java
    └── TransactionException.java
```

---

## ⚡ Core Features & Distributed Protocols

### 1. Two-Phase Commit (2PC) Coordinator
When a transfer occurs between accounts (especially across different geographical shards):
1. **Phase 1 (Prepare / Vote):**
   - Atomically acquires pessimistic locks on sender and receiver accounts in sorted deterministic order (preventing deadlocks).
   - Validates active status, currency compatibility, and verifies sufficient balance.
   - All participants cast a `VOTE_COMMIT`.
2. **Phase 2 (Commit / Rollback):**
   - If all parties vote commit: Sender account is debited, receiver account is credited, and transaction status moves to `COMMITTED`.
   - If any participant fails: Entire transaction transitions to `FAILED` and changes are rolled back.

### 2. Double-Entry Bookkeeping Ledger
Every transfer generates two immutably recorded ledger entries:
- A `DEBIT` entry against the sender's account.
- A `CREDIT` entry against the recipient's account.
- Mathematically satisfies: $\sum \text{Debits} == \sum \text{Credits}$ for auditability and regulatory compliance.

### 3. Sharding Strategy
Accounts are mapped to geographical/domain shards:
- `SHARD_1_NORTH`
- `SHARD_2_CENTRAL`
- `SHARD_3_SOUTH`
- `SHARD_4_ENTERPRISE`

---

## 🛠️ Tech Stack & Prerequisites

### Backend
- **Language:** Java 21 LTS (OpenJDK 21.0.12.1)
- **Framework:** Spring Boot 3.4.3
- **ORM / Persistence:** Spring Data JPA / Hibernate
- **Database:** PostgreSQL 17.2
- **Caching & Messaging:** Redis, RabbitMQ
- **Build Tool:** Maven 3.x (with included `mvnw.cmd` wrapper)

### Frontend (Planned)
- React
- TypeScript
- Vite

### DevOps
- Docker
- Kubernetes

---

## 🚀 Local Development Setup

### 1. Database Configuration
PostgreSQL is running natively on `localhost:5432`:
- **Database:** `transmoney_db`
- **Username:** `transmoney_user`
- **Password:** `transmoney_password`

Configured in `backend/src/main/resources/application.yml`.

### 2. Running the Backend Server
From the `backend` directory, launch the Spring Boot application:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The application starts on port `8080` with context path `/`.

---

## 📡 API Reference & Verification

### 1. Health Check
```http
GET http://localhost:8080/api/health
```
**Response:**
```json
{
  "status": "UP",
  "service": "TransMoney Digital Wallet Backend",
  "database": "Connected (PostgreSQL)"
}
```

### 2. Create User
```http
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "fullName": "Alice Johnson",
  "email": "alice@example.com",
  "phoneNumber": "+923001234567"
}
```

### 3. Create Account
```http
POST http://localhost:8080/api/accounts
Content-Type: application/json

{
  "userId": 1,
  "accountNumber": "ACC-ALICE-001",
  "currency": "PKR",
  "initialBalance": 10000.00,
  "shard": "SHARD_3_SOUTH"
}
```

### 4. Execute Cross-Shard 2PC Transfer
```http
POST http://localhost:8080/api/transfers
Content-Type: application/json

{
  "senderAccountId": 1,
  "receiverAccountId": 2,
  "amount": 2500.00,
  "currency": "PKR",
  "description": "Cross-shard P2P settlement"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Transfer completed successfully via 2PC coordinator",
  "data": {
    "transactionId": "TX-42bcfdbe-3ea4-48f8-a006-25f190e29b18",
    "status": "COMMITTED",
    "amount": 2500.00,
    "currency": "PKR",
    "timestamp": "2026-09-27T14:48:47.387994"
  }
}
```

### 5. Check Balance
```http
GET http://localhost:8080/api/accounts/1/balance
```
**Response:**
```json
{
  "success": true,
  "message": "Account balance retrieved successfully",
  "data": {
    "accountId": 1,
    "accountNumber": "ACC-ALICE-001",
    "balance": 7500.00,
    "currency": "PKR",
    "shard": "SHARD_3_SOUTH",
    "status": "ACTIVE"
  }
}
```

### 6. Get Transaction Status & Ledger Audit
```http
GET http://localhost:8080/api/transactions/TX-42bcfdbe-3ea4-48f8-a006-25f190e29b18
```

### 7. Search, Sort & Filter Transactions (Proposal Sections 6 & 7)
Filter transactions by keyword, amount range, date range, or sort order:
```http
GET http://localhost:8080/api/accounts/1/transactions?search=P2P&minAmount=100&maxAmount=5000&sort=createdAt&order=desc&page=0&size=20
```

Or query globally across all accounts:
```http
GET http://localhost:8080/api/transactions?minAmount=500&sort=amount&order=desc
```

---

## 🖥️ Interactive Web Console & Swagger UI

### 1. Interactive Demo Console
Once the backend is running, open your web browser to:
👉 **`http://localhost:8080/`**

- **Live Shards Topology:** Displays real-time balances and active shard mapping.
- **Interactive 2PC Transfer Trigger:** Execute live cross-shard transfers with real-time 3-step visualizer (Pessimistic Locking $\rightarrow$ Phase 1 Prepare/Vote $\rightarrow$ Phase 2 Commit).
- **Audit Ledger:** Live double-entry bookkeeping validation ($\sum \text{Debits} == \sum \text{Credits}$).
- **Search & Filter:** Instant multi-parameter transaction filtering.

### 2. Interactive Swagger / OpenAPI Docs
Test all REST endpoints with live payload validation in Swagger UI:
👉 **`http://localhost:8080/swagger-ui.html`**

OpenAPI JSON specification:
👉 **`http://localhost:8080/v3/api-docs`**

---

## 🧪 Automated Integration Tests

Run the full verification suite (all 8 tests pass against PostgreSQL):

```powershell
cd backend
$env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd test
```

### Verified Scenarios:
1. `TwoPhaseCommitIntegrationTest.testSuccessfulCrossShardTransfer`: Validates full 2PC lifecycle, balance updates, and strict double-entry debits/credits parity.
2. `TwoPhaseCommitIntegrationTest.testInsufficientBalanceRejection`: Validates Phase 1 vote abort and guarantees zero balance changes on failed transfers.
3. `TransactionSearchAndApiIntegrationTest.testSearchByKeyword`: Verifies partial keyword search over transaction memo/ID.
4. `TransactionSearchAndApiIntegrationTest.testNumericRangeFilterAndSort`: Verifies B-tree numerical range filtering and custom sorting.
5. `TransactionSearchAndApiIntegrationTest.testGlobalTransactionsEndpoint`: Validates global search with page metadata.
6. `TransactionSearchAndApiIntegrationTest.testSwaggerOpenApiDocs`: Verifies OpenAPI 3.0 specification generation.
7. `TransactionSearchAndApiIntegrationTest.testStaticDashboardServed`: Verifies embedded single-page dashboard serving.
8. `BackendApplicationTests.contextLoads`: Verifies Spring ApplicationContext boots cleanly.
