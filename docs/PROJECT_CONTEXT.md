# Distributed Digital Wallet (TransMoney) - Project Context & Memory Handover

> **Saved Date:** September 27, 2026, 19:30 PKT  
> **Workspace:** `e:\Projects\Disributed-Digital_Wallet`  
> **Repository:** `Shehzad-Nisar/Distributed-Digital-Wallet`  
> **Branch:** `main`  
> **Target Submission Date:** September 28, 2026 (Backend Submission for Sir Umair)  
> **Course:** Distributed Database Systems

---

## 👥 1. Team Members
- **Shehzad Nisar** (B22110006147)
- **Muhammad Ashraf** (B22110006090)
- **Daniyal Ahmed** (B21110006024)

---

## 🏛️ 2. Current Implementation Status (100% Production Code & Verified)
All components in the backend are fully implemented, compiled, and verified with **8 out of 8 automated integration tests passing**:

```
backend/src/main/java/com/transmoney/backend/
├── BackendApplication.java
├── config/
│   ├── DataInitializer.java            # Automatic seed provisioning (Alice, Bob, Charlie, Daraz, Merchants, Demo 2PC TX)
│   └── OpenApiConfig.java              # Swagger / OpenAPI 3.0 specification & metadata
├── controller/                         # REST API Endpoints & Request Routing (Documented with @Tag & @Operation)
│   ├── AccountController.java          # POST /api/accounts, GET /api/accounts/{id}, GET /api/accounts/{id}/balance, GET /api/accounts/{id}/transactions
│   ├── HealthController.java           # GET /api/health (with live PostgreSQL ping check)
│   ├── TransferController.java         # POST /api/transfers, GET /api/transactions/{id}, GET /api/transfers/{id}, GET /api/transactions
│   └── UserController.java             # POST /api/users, GET /api/users/{id}, GET /api/users
├── service/                            # Core Business Logic & Orchestration
│   ├── AccountService.java
│   ├── TransferService.java            # Includes searchTransactions with Specification filtering and PageResponse mapping
│   ├── UserService.java
│   └── coordinator/
│       └── TwoPhaseCommitCoordinator.java   # 2PC Coordinator (Deterministic Pessimistic Locking, Prepare, Vote, Commit)
├── repository/                         # Data Access Layer (Spring Data JPA)
│   ├── AccountRepository.java          # Includes findByIdForUpdate (PESSIMISTIC_WRITE)
│   ├── LedgerEntryRepository.java
│   ├── MerchantRepository.java
│   ├── TransactionRepository.java      # Extends JpaSpecificationExecutor for dynamic multi-criteria search
│   ├── UserRepository.java
│   └── specification/
│       └── TransactionSpecification.java   # Dynamic CriteriaBuilder predicates (search, amounts, dates, type, status)
├── entity/                             # Data Models & Schemas (PostgreSQL Tables)
│   ├── Account.java                    # Shard mapping, balance, versioning
│   ├── LedgerEntry.java                # Immutable Double-Entry rows (DEBIT, CREDIT)
│   ├── Merchant.java                   # Merchant directory (FoodPanda, Daraz, K-Electric)
│   ├── Transaction.java                # 2PC status (INITIATED, PREPARED, COMMITTED, FAILED)
│   ├── User.java
│   └── enums/
│       ├── LedgerEntryType.java        # DEBIT, CREDIT
│       ├── ShardType.java              # SHARD_1_NORTH, SHARD_2_CENTRAL, SHARD_3_SOUTH, SHARD_4_ENTERPRISE
│       ├── TransactionStatus.java      # INITIATED, PREPARED, COMMITTED, FAILED
│       └── TransactionType.java        # P2P_TRANSFER, MERCHANT_PAYMENT, DEPOSIT, WITHDRAWAL
├── dto/                                # Request & Response Data Transfer Objects
│   ├── request/
│   │   ├── CreateAccountRequest.java
│   │   ├── CreateUserRequest.java
│   │   └── TransferRequest.java
│   └── response/
│       ├── AccountBalanceResponse.java
│       ├── ApiResponse.java            # Standardized { success, message, data, timestamp }
│       ├── PageResponse.java           # Standardized pagination metadata { content, page, size, totalElements, totalPages }
│       ├── TransactionResponse.java    # Full audit response with nested ledger entries
│       └── TransferResponse.java
└── exception/                          # Centralized Exception Handling (@RestControllerAdvice)
    ├── GlobalExceptionHandler.java
    ├── InsufficientBalanceException.java
    ├── ResourceNotFoundException.java
    └── TransactionException.java

backend/src/main/resources/
├── application.yml
└── static/
    └── index.html                      # Embedded Visual Demo Console (Live Shards, 2PC Trigger, Audit Ledger)
```

---

## ⚙️ 3. Environment & Local Infrastructure

### Java 21 LTS
- **Installed Path:** `C:\Users\Muhammad Ashrafz\.jdk\jdk-21.0.12.1+1`
- **Environment:** `JAVA_HOME` and `PATH` are set.
- **Maven Configuration:** `backend/pom.xml` configured with `<java.version>21</java.version>`, Spring Boot `3.4.3`, springdoc-openapi `2.8.5`, and Lombok.

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
- **Run Application Command:**
  ```powershell
  cd e:\Projects\Disributed-Digital_Wallet\backend
  $env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd spring-boot:run
  ```
- **Run Tests Command:**
  ```powershell
  $env:JAVA_HOME = "$HOME\.jdk\jdk-21.0.12.1+1"; $env:Path = "$HOME\.jdk\jdk-21.0.12.1+1\bin;" + $env:Path; .\mvnw.cmd test
  ```

### React + TypeScript Frontend
- **Directory:** `e:\Projects\Disributed-Digital_Wallet\frontend`
- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Axios
- **Port:** `5173` (with auto-proxy of `/api` to port `8080`)
- **Run Dev Server:**
  ```powershell
  cd e:\Projects\Disributed-Digital_Wallet\frontend
  npm run dev
  ```
- **Build Production Bundle:**
  ```powershell
  cd e:\Projects\Disributed-Digital_Wallet\frontend
  npm run build
  ```
- **Direct Spring Boot Serving:** The production bundle is also synced into `backend/src/main/resources/static/`, so running the Spring Boot backend alone automatically serves the full React UI directly at `http://localhost:8080/`.

---

## 🧪 4. Verified Protocols & Automated Tests
Test classes:
1. [`TwoPhaseCommitIntegrationTest.java`](file:///e:/Projects/Disributed-Digital_Wallet/backend/src/test/java/com/transmoney/backend/TwoPhaseCommitIntegrationTest.java)
2. [`TransactionSearchAndApiIntegrationTest.java`](file:///e:/Projects/Disributed-Digital_Wallet/backend/src/test/java/com/transmoney/backend/TransactionSearchAndApiIntegrationTest.java)
3. [`BackendApplicationTests.java`](file:///e:/Projects/Disributed-Digital_Wallet/backend/src/test/java/com/transmoney/backend/BackendApplicationTests.java)

- **Status:** **All 8 tests PASS (BUILD SUCCESS)** against local PostgreSQL 17.2.
- **Protocol 1: Deadlock-Free Pessimistic Locking:**
  - Locks sender and receiver accounts in deterministic sorted ID order (`Math.min` before `Math.max`) via `PESSIMISTIC_WRITE`.
- **Protocol 2: Cross-Shard 2PC Lifecycle:**
  - `Phase 1 (Prepare / Vote)`: Verifies account active status, currency match, and balance sufficiency.
  - `Phase 2 (Commit)`: Balances updated atomically, transaction marked `COMMITTED`, and double-entry ledger rows generated.
- **Protocol 3: Double-Entry Bookkeeping:**
  - Mathematically verified: $\sum \text{Debits} == \sum \text{Credits}$.
- **Protocol 4: Consistency on Abort:**
  - If sender balance is insufficient, abort is voted, `InsufficientBalanceException` thrown, and balances remain strictly untouched.
- **Protocol 5: Search, Sort & Filtering (Proposal Sections 6 & 7):**
  - Keyword search across description/transaction ID, numeric range filtering (`minAmount`, `maxAmount`), date ranges (`startDate`, `endDate`), and sorting (`createdAt`, `amount`, `id`) with pagination metadata (`PageResponse`).
- **Protocol 6: OpenAPI / Swagger Specification:**
  - Accessible at `http://localhost:8080/swagger-ui.html` and `http://localhost:8080/v3/api-docs`.
- **Protocol 7: Embedded Demo Dashboard:**
  - Accessible directly at `http://localhost:8080/` with live shard visualization, interactive 2PC execution, and live double-entry audit ledger.

---

## 🌟 5. Ready for Evaluation & Demoing (Sir Umair - Sep 28)
When the application starts:
1. **Interactive Demo Dashboard:** Open `http://localhost:8080/`
2. **Interactive Swagger Documentation:** Open `http://localhost:8080/swagger-ui.html`
3. **Pre-Seeded Accounts:**
   - Alice Khan: `ACC-ALICE-001` on `SHARD_3_SOUTH`
   - Bob Malik: `ACC-BOB-002` on `SHARD_2_CENTRAL`
   - Charlie Tariq: `ACC-CHARLIE-003` on `SHARD_1_NORTH`
   - Daraz Merchant: `ACC-DARAZ-004` on `SHARD_4_ENTERPRISE`
