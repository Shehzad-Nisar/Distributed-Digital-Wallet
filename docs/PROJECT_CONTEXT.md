# Distributed Digital Wallet (TransMoney) - Project Context & Memory Handover

> **Saved Date:** September 27, 2026, 19:20 PKT  
> **Workspace:** `e:\Projects\Disributed-Digital_Wallet`  
> **Repository:** `Shehzad-Nisar/Distributed-Digital-Wallet`  
> **Branch:** `main` (Latest commit: `89c2f19` - clean working tree, fully synced with `origin/main`)  
> **Target Submission Date:** September 28, 2026 (Initial Backend Submission for Sir Umair)  
> **Course:** Distributed Database Systems

---

## 👥 1. Team Members
- **Shehzad Nisar** (B22110006147)
- **Muhammad Ashraf** (B22110006090)
- **Daniyal Ahmed** (B21110006024)

---

## 🏛️ 2. Current Implementation Status (100% Production Code)
All 34 files in the backend are completely implemented, compiled, and verified:

```
backend/src/main/java/com/transmoney/backend/
├── BackendApplication.java
├── controller/            # REST API Endpoints & Request Routing
│   ├── AccountController.java          # POST /api/accounts, GET /api/accounts/{id}, GET /api/accounts/{id}/balance
│   ├── HealthController.java           # GET /api/health (with live PostgreSQL ping check)
│   ├── TransferController.java         # POST /api/transfers, GET /api/transactions/{id}, GET /api/transfers/{id}
│   └── UserController.java             # POST /api/users, GET /api/users/{id}, GET /api/users
├── service/               # Core Business Logic & Orchestration
│   ├── AccountService.java
│   ├── TransferService.java
│   ├── UserService.java
│   └── coordinator/
│       └── TwoPhaseCommitCoordinator.java   # 2PC Coordinator (Deterministic Pessimistic Locking, Prepare, Vote, Commit)
├── repository/            # Data Access Layer (Spring Data JPA)
│   ├── AccountRepository.java          # Includes findByIdForUpdate (PESSIMISTIC_WRITE)
│   ├── LedgerEntryRepository.java
│   ├── MerchantRepository.java
│   ├── TransactionRepository.java
│   └── UserRepository.java
├── entity/                # Data Models & Schemas (PostgreSQL Tables)
│   ├── Account.java                    # Shard mapping, balance, versioning
│   ├── LedgerEntry.java                # Immutable Double-Entry rows (DEBIT, CREDIT)
│   ├── Merchant.java
│   ├── Transaction.java                # 2PC status (INITIATED, PREPARED, COMMITTED, FAILED)
│   ├── User.java
│   └── enums/
│       ├── LedgerEntryType.java        # DEBIT, CREDIT
│       ├── ShardType.java              # SHARD_1_NORTH, SHARD_2_CENTRAL, SHARD_3_SOUTH, SHARD_4_ENTERPRISE
│       ├── TransactionStatus.java      # INITIATED, PREPARED, COMMITTED, FAILED
│       └── TransactionType.java        # P2P_TRANSFER, MERCHANT_PAYMENT, DEPOSIT, WITHDRAWAL
├── dto/                   # Request & Response Data Transfer Objects
│   ├── request/
│   │   ├── CreateAccountRequest.java
│   │   ├── CreateUserRequest.java
│   │   └── TransferRequest.java
│   └── response/
│       ├── AccountBalanceResponse.java
│       ├── ApiResponse.java            # Standardized { success, message, data, timestamp }
│       ├── TransactionResponse.java    # Full audit response with nested ledger entries
│       └── TransferResponse.java
└── exception/             # Centralized Exception Handling (@RestControllerAdvice)
    ├── GlobalExceptionHandler.java
    ├── InsufficientBalanceException.java
    ├── ResourceNotFoundException.java
    └── TransactionException.java
```

---

## ⚙️ 3. Environment & Local Infrastructure

### Java 21 LTS
- **Installed Path:** `C:\Users\Muhammad Ashrafz\.jdk\jdk-21.0.12.1+1`
- **Environment:** `JAVA_HOME` and `PATH` are set.
- **Maven Configuration:** `backend/pom.xml` configured with `<java.version>21</java.version>`, Spring Boot `3.4.3`, and Lombok annotation processing.

### PostgreSQL 17.2 (Native Local Setup)
- **Binaries:** `D:\tools\pgsql\pgsql\bin`
- **Data Cluster:** `D:\tools\pgsql\data`
- **Port:** `5432`
- **Database:** `transmoney_db`
- **Username:** `transmoney_user`
- **Password:** `transmoney_password`
- **Start Command:**
  ```powershell
  & "D:\tools\pgsql\pgsql\bin\postgres.exe" -D "D:\tools\pgsql\data"
  ```
- **Check Status Command:**
  ```powershell
  & "D:\tools\pgsql\pgsql\bin\pg_isready.exe" -h localhost -p 5432
  ```

### Spring Boot Backend
- **Directory:** `e:\Projects\Disributed-Digital_Wallet\backend`
- **Port:** `8080`
- **Run Command:**
  ```powershell
  cd e:\Projects\Disributed-Digital_Wallet\backend
  $env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd spring-boot:run
  ```
- **Run Tests Command:**
  ```powershell
  $env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd test
  ```

---

## 🧪 4. Verified Protocols & Automated Tests
Test class: [`TwoPhaseCommitIntegrationTest.java`](file:///e:/Projects/Disributed-Digital_Wallet/backend/src/test/java/com/transmoney/backend/TwoPhaseCommitIntegrationTest.java)
- **Status:** **All 3 tests PASS (BUILD SUCCESS)** against local PostgreSQL 17.2.
- **Protocol 1: Deadlock-Free Pessimistic Locking:**
  - Locks sender and receiver accounts in deterministic sorted ID order (`Math.min` before `Math.max`).
- **Protocol 2: Cross-Shard 2PC Lifecycle:**
  - `Phase 1 (Prepare / Vote)`: Verifies account active status, currency match, and balance sufficiency.
  - `Phase 2 (Commit)`: Balances updated atomically, transaction marked `COMMITTED`, and double-entry ledger rows generated.
- **Protocol 3: Double-Entry Bookkeeping:**
  - Mathematically verified: $\sum \text{Debits} == \sum \text{Credits} == \$2500.00$.
- **Protocol 4: Consistency on Abort:**
  - If sender balance is insufficient, abort is voted, `InsufficientBalanceException` thrown, and balances remain strictly untouched.

---

## 🎯 5. Immediate Game Plan for Next Chat (Submission Preparation for Sir Umair)
Sir Umair instructed that the **Back End** is the primary focus for the 28th submission:

1. **Transaction Search, Sort & Filtering Endpoint (Proposal Section 6 & 7):**
   - Implement `GET /api/accounts/{id}/transactions?search=&sort=&order=&minAmount=&maxAmount=&startDate=&endDate=`
   - Enable text search by description/merchant and numeric range filtering.
2. **Swagger / OpenAPI Documentation:**
   - Add `springdoc-openapi-starter-webmvc-ui` dependency to `pom.xml`.
   - Expose interactive API docs at `http://localhost:8080/swagger-ui.html` so the evaluator can test all endpoints in the browser without needing Postman.
3. **Automatic Seed Data (`DataInitializer`):**
   - Pre-populate Alice (`SHARD_3_SOUTH`, balance: 10,000 PKR), Bob (`SHARD_2_CENTRAL`, balance: 1,000 PKR), and Charlie (`SHARD_1_NORTH`) on startup so demoing is instantaneous.
4. **Embedded Visual Demo Dashboard (Optional, in `src/main/resources/static/index.html`):**
   - Lightweight, responsive single-page dashboard served directly by Spring Boot at `http://localhost:8080/` showing live shards, account balances, a 2PC transfer trigger, and the live double-entry audit ledger.
