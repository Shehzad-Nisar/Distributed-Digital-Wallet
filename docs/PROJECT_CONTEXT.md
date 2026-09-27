# Distributed Digital Wallet (TransMoney) - Project Context & Memory Handover

> **Saved Date:** September 27, 2026  
> **Workspace:** `e:\Projects\Disributed-Digital_Wallet`  
> **Repository:** `Shehzad-Nisar/Distributed-Digital-Wallet`  
> **Branch:** `main`

---

## 👥 1. Team Members
- **Shehzad Nisar**
- **Muhammad Ashraf**
- **Daniyal Ahmed**

---

## 🏛️ 2. Architectural Design (Layered MVCS)
The project follows an industry-standard **Model-View-Controller-Service (MVCS)** architecture:

```
backend/src/main/java/com/transmoney/backend/
├── controller/            # REST API Endpoints & Request Routing
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
├── dto/                   # Request & Response Data Transfer Objects
│   ├── request/
│   │   ├── CreateAccountRequest.java
│   │   ├── CreateUserRequest.java
│   │   └── TransferRequest.java
│   └── response/
│       ├── AccountBalanceResponse.java
│       ├── ApiResponse.java
│       ├── TransactionResponse.java
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
- **Maven Configuration:** `backend/pom.xml` configured with `<java.version>21</java.version>`.

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

---

## 📂 4. Clean Workspace File Tree
The root workspace has been completely cleaned and organized:
```
Disributed-Digital_Wallet/
├── backend/            # Spring Boot application source code and Maven wrapper
├── docs/               # Project proposals, architecture diagrams, and context handover
│   ├── Distributed_Digital_Wallet_Proposal.docx
│   ├── Distributed_Digital_Wallet_Proposal_Condensed.docx
│   ├── architecture-overview.jpeg
│   └── PROJECT_CONTEXT.md
├── .gitignore          # Configured for Java, Maven, IDE, OS
├── docker-compose.yml  # Docker container configuration
└── README.md           # 200+ lines comprehensive documentation (Architecture, 2PC, APIs)
```

---

## 🚀 5. Starting Point for Next Chat
1. Launch PostgreSQL if not already active:
   `& "D:\tools\pgsql\pgsql\bin\postgres.exe" -D "D:\tools\pgsql\data"`
2. Verify all Java source files under `backend/src/main/java/com/transmoney/backend/` have complete production code.
3. Boot the backend server via `.\mvnw.cmd spring-boot:run`.
4. Run integration tests or begin implementing frontend (React + Vite + TypeScript) / Redis caching / RabbitMQ messaging as outlined in the tech stack.
