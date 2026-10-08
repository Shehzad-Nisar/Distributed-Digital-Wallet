export type ShardType =
  | 'SHARD_1_NORTH'
  | 'SHARD_2_CENTRAL'
  | 'SHARD_3_SOUTH'
  | 'SHARD_4_ENTERPRISE'
  | 'SHARD_1_US'
  | 'SHARD_2_UK'
  | 'SHARD_3_SG'
  | 'SHARD_4_UAE';

export type TransactionStatus = 'INITIATED' | 'PREPARED' | 'COMMITTED' | 'FAILED';

export type TransactionType = 'P2P_TRANSFER' | 'MERCHANT_PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
  accounts: Account[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  shard?: ShardType;
  initialBalance?: number;
  currency?: string;
}

export interface DepositRequest {
  amount: number;
  paymentMethod?: string;
  referenceNotes?: string;
}

export interface WithdrawRequest {
  amount: number;
  destinationBank: string;
  destinationAccountNumber: string;
  referenceNotes?: string;
}

export interface UpdateAccountStatusRequest {
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

export interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  currency: string;
  shard: ShardType;
  status: string;
  version: number;
  user?: User;
}

export interface LedgerEntryDto {
  id: number;
  type: LedgerEntryType;
  accountId: number;
  amount: number;
  balanceAfter: number;
  timestamp: string;
}

export interface TransactionResponse {
  transactionId: string;
  status: TransactionStatus;
  type: TransactionType;
  amount: number;
  currency: string;
  targetAmount?: number;
  targetCurrency?: string;
  exchangeRate?: number;
  senderAccountId: number;
  receiverAccountId: number;
  description: string;
  ledgerEntries: LedgerEntryDto[];
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface TransferRequest {
  senderAccountId: number;
  receiverAccountId: number;
  amount: number;
  currency: string;
  targetCurrency?: string;
  expectedRate?: number;
  minTargetAmount?: number;
  maxSlippagePercent?: number;
  description: string;
  idempotencyKey?: string;
}

export interface TransferResponse {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  targetAmount?: number;
  targetCurrency?: string;
  exchangeRate?: number;
  senderAccountId?: number;
  receiverAccountId?: number;
  senderShard?: string;
  receiverShard?: string;
  isCrossShard?: boolean;
  idempotencyKey?: string;
  cachedReplay?: boolean;
  timestamp: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface CreateAccountRequest {
  userId: number;
  accountNumber: string;
  currency: string;
  initialBalance: number;
  shard: ShardType;
}

export interface SystemHealth {
  status: string;
  service: string;
  database: string;
}

export interface Merchant {
  id: number;
  merchantCode: string;
  name: string;
  category: string;
  accountId: number;
  accountNumber?: string;
  shard?: string;
  feeRatePercent: number;
  accumulatedGross: number;
  accumulatedFees: number;
  accumulatedNetSettled: number;
  unsettledBalance: number;
  status: string;
  createdAt: string;
}

export interface MerchantOnboardPayload {
  userId?: number;
  businessName: string;
  category: string;
  accountId?: number;
  feeRatePercent?: number;
}

export interface QrCodeResponse {
  qrPayload: string;
  qrImageDataUrl: string;
  qrSvg: string;
  merchantId: number;
  merchantCode: string;
  merchantName: string;
  accountId: number;
  accountNumber?: string;
  amount?: number;
  currency: string;
  orderRef?: string;
  isDynamic: boolean;
  expiresAt?: string;
  signature?: string;
}

export interface QrScanDetails {
  valid: boolean;
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  merchantCategory?: string;
  merchantAccountId?: number;
  merchantAccountNumber?: string;
  merchantShard?: string;
  amount?: number;
  currency?: string;
  orderRef?: string;
  isDynamic?: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  feeRatePercent?: number;
  estimatedFee?: number;
  estimatedNetAmount?: number;
  message?: string;
}

export interface QrPaymentResponse {
  transactionId: string;
  status: TransactionStatus;
  payerAccountId: number;
  payerAccountNumber?: string;
  payerShard?: string;
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  merchantAccountId: number;
  merchantAccountNumber?: string;
  merchantShard?: string;
  grossAmount: number;
  feeAmount?: number;
  netAmount?: number;
  currency: string;
  orderRef?: string;
  idempotencyKey?: string;
  cachedReplay: boolean;
  timestamp: string;
}

export interface SettlementBatch {
  batchReference: string;
  merchantId: number;
  merchantName: string;
  settlementAccountId: number;
  settlementAccountNumber?: string;
  transactionCount: number;
  grossVolume: number;
  totalFees: number;
  netSettlementAmount: number;
  status: string;
  settlementDate: string;
}

// --- Phase 5: Double-Entry Financial Ledger & Audit Reporting ---
export interface LedgerEntryResponse {
  id: number;
  transactionId: string;
  accountId: number;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface ReconciliationResponse {
  accountId: number;
  accountNumber: string;
  currency: string;
  currentBalance: number;
  calculatedLedgerBalance: number;
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
  totalEntries: number;
  statusMessage: string;
}

// --- Phase 6: Multi-Currency & Cross-Border Exchange Engine ---
export interface FxRatesResponse {
  baseCurrency: string;
  timestamp: string;
  defaultSpreadPercent: number;
  supportedCurrencies: string[];
  ratesAgainstUsd: Record<string, number>;
  directPairs: Record<string, number>;
}

export interface FxQuoteResponse {
  quoteId: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  marketRate: number;
  effectiveRate: number;
  spreadMarginPercent: number;
  spreadFeeAmount: number;
  grossTargetAmount: number;
  netTargetAmount: number;
  minGuaranteedAmount: number;
  issuedAt: string;
  expiresAt: string;
  validitySeconds: number;
}

export interface ExchangeRequest {
  sourceAccountId: number;
  targetAccountId: number;
  sourceAmount: number;
  quoteId?: string;
  expectedRate?: number;
  minTargetAmount?: number;
  maxSlippagePercent?: number;
  description?: string;
  idempotencyKey?: string;
}

export interface ExchangeResponse {
  transactionId: string;
  status: TransactionStatus;
  sourceAccountId: number;
  sourceAccountNumber?: string;
  sourceShard?: string;
  sourceAmount: number;
  sourceCurrency: string;
  sourceBalanceAfter: number;
  targetAccountId: number;
  targetAccountNumber?: string;
  targetShard?: string;
  targetAmount: number;
  targetCurrency: string;
  targetBalanceAfter: number;
  exchangeRate: number;
  feeAmount?: number;
  isCrossShard: boolean;
  idempotencyKey?: string;
  cachedReplay: boolean;
  timestamp: string;
}

// --- Phase 7: Redis Cache, Async Queue & Real-Time WebSocket Types ---
export interface CacheStatsResponse {
  hits: number;
  misses: number;
  evictions: number;
  inMemoryEntries: number;
  redisConnected: boolean;
  hitRatePercentage: number;
}

export interface QueueStatsResponse {
  totalEnqueued: number;
  totalProcessed: number;
  pendingBufferSize: number;
  activeWebSocketConnections: number;
  queueStatus: string;
}

export interface TransactionEvent {
  eventId: string;
  eventType: string;
  transactionId: string;
  transactionType: string;
  senderAccountId?: number;
  receiverAccountId?: number;
  amount: number;
  currency: string;
  targetAmount?: number;
  targetCurrency?: string;
  senderNewBalance?: number;
  receiverNewBalance?: number;
  description?: string;
  timestamp: string;
}


