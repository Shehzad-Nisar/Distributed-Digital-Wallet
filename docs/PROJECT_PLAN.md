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
| **03** | **Real P2P Transfers & Idempotent 2PC Engine** | P0 | ✅ **COMPLETED** | Oct 2026 |
| **04** | **Merchant Services, QR Payments & Settlement** | P1 | ✅ **COMPLETED** | Oct 2026 |
| **05** | **Double-Entry Financial Ledger & Audit Reporting** | P0 | ✅ **COMPLETED** | Oct 2026 |
| **06** | **Multi-Currency & Cross-Border Exchange Engine** | P1 | ✅ **COMPLETED** | Oct 2026 |
| **07** | **Redis Caching & Asynchronous Queue Buffer** | P1 | ✅ **COMPLETED** | Oct 2026 |
| **08** | **High Concurrency Load Simulator & Chaos Injection** | P1 | 🔄 *Ready for Dev* | Target: Sprint 7 |
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
**Status:** ✅ *Completed*  
**Core Objective:** Full GAAP-compliant double-entry ledger ensuring zero-sum accounting and audit trail.

- [x] **Journal & Ledger Entries**: Centralized `LedgerService` maintaining immutable debit and credit entries for every transaction (deposits, withdrawals, transfers, and merchant payments via 2PC).
- [x] **Running Balance Verification**: Checksum assertions (`reconcileAccount`) comparing account balance with net sum of ledger entries.
- [x] **Ledger REST APIs**: Dedicated endpoints (`/api/ledger/entries`, `/api/ledger/accounts/{accountId}/entries`, `/api/ledger/transactions/{txId}/entries`, `/api/ledger/reconcile/{accountId}`).
- [x] **Statement Generation**: Export account monthly statements in CSV format (`/api/ledger/accounts/{accountId}/statement/csv`).
- [x] **Auditor Dashboard**: Dedicated frontend view for regulatory compliance, live zero-sum stream, invariant checks, and statement export.

---

### Phase 6: Multi-Currency & Cross-Border Exchange Engine
**Status:** ✅ **COMPLETED**  
**Core Objective:** Real-time currency conversion (USD, EUR, GBP, AED, PKR) with slippage limits and exchange rate feeds.

- [x] **FX Rate Service**: Live currency rate cache with spread margin calculation (`FxRateService`).
- [x] **Cross-Currency 2PC**: Atomic exchange where sender account debited in Currency A and recipient credited in Currency B.
- [x] **Multi-Currency Wallets**: Users can hold multiple sub-accounts under distinct currencies within the same shard.
- [x] **Currency Converter UI**: Interactive conversion widget with live preview before confirmation (`CurrencyExchange.tsx`).
- [x] **REST Endpoints**:
  - `GET /api/fx/rates`: Real-time interbank cross-rates matrix.
  - `GET /api/fx/quote` & `POST /api/fx/quote`: Guaranteed 60-second locked quotes.
  - `POST /api/fx/exchange`: 2PC multi-currency exchange with `X-Idempotency-Key` replay protection.

---

### Phase 7: Redis Caching & Asynchronous Queue Buffer
**Status:** ✅ **COMPLETED**  
**Core Objective:** Accelerate balance inquiries via dual-tier Redis caching, decouple heavy post-transaction side effects via an asynchronous message buffer, and broadcast instant WebSocket updates to connected clients.

- [x] **Redis Balance Cache**: Distributed caching (`wallet:balance:<id>`) with resilient local in-memory fallback, sub-millisecond retrieval, and active invalidation on 2PC commit (`BalanceCacheService`).
- [x] **Cache Eviction Invariant**: Automatically invalidates sender and receiver caches on 2PC transfers, FX exchanges, merchant QR payments, deposits, withdrawals, and account status updates.
- [x] **Asynchronous Queue Buffer**: Decoupled message buffer (`AsyncQueueBufferService`) isolating heavy side effects (notifications, audit event dispatch) from the synchronous ACID commit path.
- [x] **Async Consumer Worker**: Daemon thread worker (`AsyncTransactionEventConsumer`) draining events, managing dual-tier invalidation, and broadcasting push frames.
- [x] **Real-Time WebSocket Stream**: Configured native WebSocket endpoint (`/ws/wallet`) broadcasting instant transaction frames and balance updates with auto-reconnection and per-account subscription.
- [x] **System & Cache Dashboard UI**: Interactive metrics monitoring dashboard (`SystemBufferDashboard.tsx`) featuring real-time cache hit ratios, queue throughput, live WebSocket terminal stream, pre-warm cache, and purge controls.
- [x] **REST Endpoints**:
  - `GET /api/system/cache-stats`: Live Redis & local cache hit/miss statistics.
  - `POST /api/system/cache-clear`: Purge balance cache across tiers.
  - `GET /api/system/queue-stats`: Queue buffer throughput and active WebSocket connection count.
  - `POST /api/system/warm-cache`: Pre-warm account balance cache.
- [x] **Automated Testing**: Verified cache hit/miss lifecycle, 2PC multi-shard cache eviction, async queue buffer event dispatch, and metrics endpoints in `RedisCacheAndAsyncQueueIntegrationTest.java`.

---

### Phase 8: High Concurrency Load Simulator & Chaos Injection
**Status:** ✅ **COMPLETED**  
**Core Objective:** Rigorous stress testing, concurrent 2PC benchmarking, deadlock verification under hot account contention, inter-shard network fault simulation, and automated coordinator crash recovery.

- [x] **Multi-Threaded 2PC Load Simulator Engine**: Built `LoadSimulatorService` executing configurable parallel worker pools (1 to 32 threads) running atomic 2PC transfers across distributed shards with zero-sum ledger conservation invariant verification.
- [x] **High-Contention Hot Account Scenario**: Simulates extreme traffic spikes targeting a single hot account simultaneously; validates deterministic hierarchical row locking (`Math.min/Math.max(senderId, receiverId)`) resulting in **0 Deadlocks**.
- [x] **Latency Percentiles & Telemetry Engine**: Precise calculation of P50 (median), P95, P99, average latency, throughput (TPS), duration, and success/failure counters.
- [x] **Chaos Monkey Fault Injection Engine**: Built `ChaosEngineeringService` simulating real-world distributed partition anomalies:
  - `LATENCY_SPIKE`: Inter-shard network WAN latency spikes (configurable 50ms - 2000ms).
  - `PREPARE_PARTITION`: Deterministic network partition during 2PC Phase 1 Prepare.
  - `COORDINATOR_CRASH`: Simulated coordinator node failure right after `PREPARED` log transition, triggering recovery sweep.
  - `PACKET_DROP`: Probabilistic inter-shard packet drops with configurable failure rates.
- [x] **Automated 2PC Recovery Sweep**: Validated recovery coordinator cleanup of orphaned `PREPARED` transactions without fund loss or balance corruption.
- [x] **Load & Chaos Management Dashboard UI**: Interactive operator dashboard (`ChaosSimulatorView.tsx`) featuring real-time concurrency sliders, hot contention toggle, latency percentile gauges (P50/P95/P99), fault injector controls, and automated recovery triggers.
- [x] **REST Endpoints**:
  - `POST /api/simulator/load-test`: Execute multi-threaded 2PC benchmark run.
  - `GET /api/simulator/status`: Real-time benchmark execution status and last result.
  - `POST /api/simulator/cancel`: Cancel active benchmark run.
  - `GET /api/simulator/chaos/config`: Current Chaos Monkey fault state and telemetry counters.
  - `POST /api/simulator/chaos/config`: Arm/disarm fault mode and configure latency/drop rates.
  - `POST /api/simulator/chaos/reset`: Reset Chaos Monkey to baseline none.
  - `POST /api/simulator/chaos/trigger-recovery`: Manually invoke 2PC orphaned transaction reconciliation sweep.
- [x] **Automated Testing**: 5/5 integration tests in `LoadSimulationAndChaosIntegrationTest.java` verifying concurrent load simulation, zero-sum money conservation, hot account contention, latency injection, coordinator crash and recovery sweep, and REST endpoints. All 35 project tests passing.

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

* **Automated Test Results**: **35/35 Tests Passed** (`mvnw.cmd test`, 0 failures, 0 errors)
  * `AuthAndAccountLifecycleIntegrationTest`: 2/2 tests pass (Auth, BCrypt, JWT, Deposit, Withdraw, Freeze).
  * `TwoPhaseCommitIntegrationTest`: 2/2 tests pass (Atomic 2PC commit, balance rollback on abort).
  * `TransactionSearchAndApiIntegrationTest`: 5/5 tests pass (Paginated queries, shard routing, OpenAPI).
  * `IdempotencyAnd2PCIntegrationTest`: 4/4 tests pass (Distributed idempotency, replay caching, recovery coordinator).
  * `MerchantAndQrPaymentIntegrationTest`: 6/6 tests pass (Onboarding, QR generation, 2PC QR payments, MDR fees, idempotency replay, tampered QR rejection, settlement batches).
  * `LedgerAndReconciliationIntegrationTest`: 2/2 tests pass (GAAP zero-sum double-entry ledger invariant & CSV statement export).
  * `MultiCurrencyAndFxIntegrationTest`: 5/5 tests pass (FX rates engine, quotes, cross-currency 2PC transfers, slippage protection abort, exchange idempotency replay).
  * `RedisCacheAndAsyncQueueIntegrationTest`: 3/3 tests pass (Cache hit/miss acceleration, 2PC multi-shard cache eviction, async queue buffer throughput, and system buffer endpoints).
  * `LoadSimulationAndChaosIntegrationTest`: 5/5 tests pass (Multi-threaded 2PC load benchmark, hot account contention with 0 deadlocks, latency injection, coordinator crash and recovery sweep, simulator and chaos REST endpoints).
  * `BackendApplicationTests`: 1/1 tests pass.
* **Frontend Verification**: TypeScript build `tsc -b && vite build` completed with **0 errors** in **783ms**.
