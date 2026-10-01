# TransMoney: Enterprise Distributed Digital Wallet — Project Master Plan

**Project:** TransMoney Distributed Digital Wallet System  
**Architecture:** Multi-Shard Distributed Database (PostgreSQL 17) + Spring Boot 3 Core + React 19 / Vite Web Client  
**Current Milestone:** Phase 1 & Phase 2 Complete  
**Last Updated:** October 2026  

---

## Executive Summary & Progress Dashboard

TransMoney is an enterprise-grade digital wallet application engineered with high-throughput distributed database principles, strict financial ACID transaction semantics, and production fintech standards (modeled after Revolut and Wise).

| Phase | Milestone | Priority | Status | Completion Date |
|:---:|---|:---:|:---:|:---:|
| **01** | **Real Identity, Authentication & Session Security** | P0 | ✅ **COMPLETED** | Oct 2026 |
| **02** | **Wallet & Multi-Shard Account Lifecycle** | P0 | ✅ **COMPLETED** | Oct 2026 |
| **03** | **Real P2P Transfers & Idempotent 2PC Engine** | P0 | 🔄 *Ready for Dev* | Target: Sprint 2 |
| **04** | **Merchant Services, QR Payments & Settlement** | P1 | ⏳ *Planned* | Target: Sprint 3 |
| **05** | **Double-Entry Financial Ledger & Audit Reporting** | P0 | ⏳ *Planned* | Target: Sprint 4 |
| **06** | **Multi-Currency & Cross-Border Exchange Engine** | P1 | ⏳ *Planned* | Target: Sprint 5 |
| **07** | **Redis Caching & Asynchronous Queue Buffer** | P1 | ⏳ *Planned* | Target: Sprint 6 |
| **08** | **High Concurrency Load Simulator & Chaos Injection** | P1 | ⏳ *Planned* | Target: Sprint 7 |
| **09** | **Real-Time Fraud Detection, Velocity & Rate Limiting** | P1 | ⏳ *Planned* | Target: Sprint 8 |
| **10** | **Dockerization, Prometheus/Grafana & CI/CD** | P0 | ⏳ *Planned* | Target: Sprint 9 |

---

## Detailed Phase Breakdown & Progress Tracking

### Phase 1: Real Identity, Authentication & Session Security
**Status:** ✅ **COMPLETED**  
**Core Objective:** Replace demo user switching with production-grade BCrypt password hashing, HMAC-SHA256 JWT tokens, and stateful/stateless session management.

- [x] **Password Cryptography**: Configured `BCryptPasswordEncoder` bean in `SecurityConfig.java`.
- [x] **JWT Token Engine**: Implemented `JwtTokenProvider.java` generating signed HMAC SHA-256 tokens with role and email claims.
- [x] **User Entity Enhancement**: Added secure password and role fields (`password` with `@JsonIgnore` protection).
- [x] **Authentication Endpoints**:
  - `POST /api/auth/register`: Secure sign-up with auto-provisioning of regional shard wallet.
  - `POST /api/auth/login`: BCrypt authentication returning JWT and account profile.
  - `GET /api/auth/me`: Token-backed profile resolution.
- [x] **Frontend Security Interceptor**: Configured Axios request interceptor injecting `Authorization: Bearer <token>`.
- [x] **UI & Evaluator Presets**: Built tabbed Sign In / Sign Up modal in `AuthModal.tsx` with 1-click test profile buttons.
- [x] **Automated Testing**: Verified full sign-up, login, and JWT validation via `AuthAndAccountLifecycleIntegrationTest.java`.

---

### Phase 2: Wallet & Multi-Shard Account Lifecycle
**Status:** ✅ **COMPLETED**  
**Core Objective:** Enable real wallet funding (Deposit), bank payouts (Withdraw), and dynamic account governance (Freeze / Unfreeze / Close).

- [x] **Deposit Pipeline**: Built `deposit(accountId, DepositRequest)` supporting Credit Card and Bank Wire funding.
- [x] **Withdrawal Engine**: Built `withdraw(accountId, WithdrawRequest)` with balance checks and destination bank routing.
- [x] **Account Governance**: Added `updateAccountStatus(accountId, UpdateAccountStatusRequest)` for `ACTIVE`, `FROZEN`, and `CLOSED` states.
- [x] **Security Guard**: Enforced transaction blocking on frozen/closed accounts.
- [x] **REST Endpoints**:
  - `POST /api/accounts/{id}/deposit`
  - `POST /api/accounts/{id}/withdraw`
  - `PATCH /api/accounts/{id}/status`
- [x] **Frontend Banking Controls**:
  - Integrated `DepositWithdrawModal.tsx` with instant funding and withdrawal forms.
  - Added Freeze/Unfreeze account status actions in the header wallet manager.
- [x] **Automated Testing**: Verified deposit, withdrawal, and freeze enforcement in `AuthAndAccountLifecycleIntegrationTest.java`.

---

#### Phase 3: Real P2P Transfers & Idempotent 2PC Engine
**Status:** ✅ *COMPLETED*  
**Core Objective:** Fortify cross-shard Two-Phase Commit with distributed idempotency, optimistic locking, and network failure recovery.

- [x] **Idempotency Keys**: Accept `X-Idempotency-Key` header on all transfers to prevent accidental duplicate debits (`IdempotencyService`).
- [x] **Distributed Locks**: Deterministic hierarchical lock acquisition order (`Math.min` -> `Math.max`) prevents deadlocks across shard partitions.
- [x] **Transaction Recovery Coordinator**: Background scheduled worker (`@Scheduled`) scanning and aborting orphaned `PREPARED` 2PC transactions.
- [x] **Deadlock Detection & Cross-Shard State**: Enforced strict `INITIATED` -> `PREPARED` -> `COMMITTED` transitions.
- [x] **Frontend 2PC Stepper**: Real-time visual animation for Prepare and Commit phases with recovery triggers in `TransferConsole.tsx`.

---

### Phase 4: Merchant Services, QR Payments & Settlement
**Status:** ✅ *COMPLETED*  
**Core Objective:** Support business/merchant accounts with instant QR code payments, cryptographic signature verification, point-of-sale terminals, and end-of-day settlements.

- [x] **Merchant Account Types**: Expanded `Merchant` entity with `merchantCode`, user mapping, business category, secret key, and MDR fee rate.
- [x] **Dynamic & Static QR Codes**: Cryptographically signed HMAC-SHA256 QR payloads with expiry tracking, Base64 PNG, and crisp vector SVG generation (`QrCodeService`).
- [x] **Scan-to-Pay UI**: Interactive QR decoder in `MerchantPortal.tsx` with one-click demo invoices, fee preview, and 2PC execution.
- [x] **Point of Sale Generator**: POS terminal supporting both fixed-amount dynamic invoices and open-amount persistent static QR codes.
- [x] **Merchant Settlement Portal**: End-of-day batch settlement engine with MDR platform fee deduction, settlement history, and volume tracking (`SettlementBatch`).
- [x] **REST Endpoints**:
  - `POST /api/merchants/onboard`
  - `GET /api/merchants` & `GET /api/merchants/{id}` & `GET /api/merchants/user/{userId}`
  - `POST /api/merchants/qr/generate`
  - `POST /api/merchants/qr/scan`
  - `POST /api/merchants/qr/pay` (supports `X-Idempotency-Key`)
  - `POST /api/merchants/{id}/settle`
  - `GET /api/merchants/{id}/settlements`

---

### Phase 5: Double-Entry Financial Ledger & Audit Reporting
**Status:** 🔄 *Ready for Development*  
**Core Objective:** Full GAAP-compliant double-entry ledger ensuring zero-sum accounting and audit trail.

- [ ] **Journal & Ledger Entries**: Maintain immutable debit and credit pairs for every financial movement.
- [ ] **Running Balance Verification**: Checksum assertions comparing account balance with sum of ledger entries.
- [ ] **Statement Generation**: Export account monthly statements in CSV and formatted PDF formats.
- [ ] **Auditor Dashboard**: Dedicated view for regulatory compliance and invariant checks.

---

### Phase 6: Multi-Currency & Cross-Border Exchange Engine
**Status:** ⏳ *Planned*  
**Core Objective:** Real-time currency conversion (USD, EUR, GBP, AED, PKR) with slippage limits and exchange rate feeds.

- [ ] **FX Rate Service**: Live currency rate cache with spread margin calculation.
- [ ] **Cross-Currency 2PC**: Atomic exchange where sender account debited in Currency A and recipient credited in Currency B.
- [ ] **Multi-Currency Wallets**: Users can hold multiple sub-accounts under distinct currencies within the same shard.
- [ ] **Currency Converter UI**: Interactive conversion widget with live preview before confirmation.

---

### Phase 7: Redis Caching & Asynchronous Queue Buffer
**Status:** ⏳ *Planned*  
**Core Objective:** Accelerate balance inquiries and offload heavy audit notifications to an asynchronous message broker.

- [ ] **Redis Balance Cache**: Cache frequently read balances with cache-invalidation on 2PC commit.
- [ ] **Message Queue Integration**: Decouple notification emails, webhooks, and analytics via message queue.
- [ ] **WebSocket Push Updates**: Real-time push updates to frontend whenever an account receives an inbound transfer.

---

### Phase 8: High Concurrency Load Simulator & Chaos Injection
**Status:** ⏳ *Planned*  
**Core Objective:** Rigorous stress testing, concurrent 2PC benchmarking, and network partition resiliency testing.

- [ ] **Load Generation Script**: Multi-threaded simulator generating 1,000+ transfers/sec.
- [ ] **Chaos Monkey Fault Injection**: Simulate network drops, delayed coordinator responses, and shard connection crashes.
- [ ] **Performance Benchmarking Report**: Latency percentiles (p50, p95, p99) under high-contention accounts.

---

### Phase 9: Real-Time Fraud Detection, Velocity & Rate Limiting
**Status:** ⏳ *Planned*  
**Core Objective:** Rule-based fraud scoring and IP/device rate limiting to safeguard wallet funds.

- [ ] **Velocity Checker**: Detect and block abnormal velocity (e.g., > 5 transfers within 60 seconds).
- [ ] **Large Transfer Flagging**: Trigger manual review or 2FA challenge for transfers exceeding $10,000 threshold.
- [ ] **IP & Account Rate Limiting**: Token-bucket algorithm via Bucket4j or Redis.

---

### Phase 10: Dockerization, Prometheus/Grafana & CI/CD
**Status:** ⏳ *Planned*  
**Core Objective:** One-click deployment with container orchestration, monitoring, and automated pipelines.

- [ ] **Production Docker Compose**: Multi-container setup with backend, PostgreSQL multi-shard schemas, Redis, and frontend.
- [ ] **Prometheus Metrics**: Export 2PC throughput, commit/abort ratios, and database connection pool health.
- [ ] **Grafana Dashboard**: Pre-configured dashboards visualizing financial transaction velocity and system health.
- [ ] **GitHub Actions CI/CD**: Automated unit and integration test execution on pull requests.

---

## Verification & Quality Assurance Summary

* **Automated Test Results**: 20/20 Tests Passed (`mvnw.cmd test`, 0 failures, 0 errors)
  * `AuthAndAccountLifecycleIntegrationTest`: 2/2 tests pass (Auth, BCrypt, JWT, Deposit, Withdraw, Freeze).
  * `TwoPhaseCommitIntegrationTest`: 2/2 tests pass (Atomic 2PC commit, balance rollback on abort).
  * `TransactionSearchAndApiIntegrationTest`: 5/5 tests pass (Paginated queries, shard routing, OpenAPI).
  * `IdempotencyAnd2PCIntegrationTest`: 4/4 tests pass (Distributed idempotency, replay caching, recovery coordinator).
  * `MerchantAndQrPaymentIntegrationTest`: 6/6 tests pass (Onboarding, QR generation, 2PC QR payments, MDR fees, idempotency replay, tampered QR rejection, settlement batches).
  * `BackendApplicationTests`: 1/1 tests pass.
* **Frontend Verification**: TypeScript build `tsc -b && vite build` completed with **0 errors** in **1.64s**.
