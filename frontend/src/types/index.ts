export type ShardType = 'SHARD_1_NORTH' | 'SHARD_2_CENTRAL' | 'SHARD_3_SOUTH' | 'SHARD_4_ENTERPRISE';

export type TransactionStatus = 'INITIATED' | 'PREPARED' | 'COMMITTED' | 'FAILED';

export type TransactionType = 'P2P_TRANSFER' | 'MERCHANT_PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
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
}

export interface SystemHealth {
  status: string;
  service: string;
  database: string;
}
