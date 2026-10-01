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
  description: string;
  idempotencyKey?: string;
}

export interface TransferResponse {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
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
