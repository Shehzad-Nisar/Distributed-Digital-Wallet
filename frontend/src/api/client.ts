import axios from 'axios';
import type {
  Account,
  ApiResponse,
  AuthResponse,
  CreateAccountRequest,
  CreateUserRequest,
  DepositRequest,
  LoginRequest,
  PageResponse,
  RegisterRequest,
  SystemHealth,
  TransactionResponse,
  TransferRequest,
  TransferResponse,
  User,
  WithdrawRequest,
  Merchant,
  MerchantOnboardPayload,
  QrCodeResponse,
  QrScanDetails,
  QrPaymentResponse,
  SettlementBatch,
  LedgerEntryResponse,
  ReconciliationResponse,
  FxRatesResponse,
  FxQuoteResponse,
  ExchangeRequest,
  ExchangeResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT Bearer Token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('transmoney_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const saveToken = (token: string) => {
  localStorage.setItem('transmoney_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('transmoney_token');
};

export const removeToken = () => {
  localStorage.removeItem('transmoney_token');
};

export const getHealth = async (): Promise<SystemHealth> => {
  const response = await api.get<SystemHealth>('/health');
  return response.data;
};

// --- Phase 1: Authentication & Identity ---
export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', request);
  if (response.data.data?.token) {
    saveToken(response.data.data.token);
  }
  return response.data.data;
};

export const register = async (request: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', request);
  if (response.data.data?.token) {
    saveToken(response.data.data.token);
  }
  return response.data.data;
};

export const getMe = async (): Promise<AuthResponse> => {
  const response = await api.get<ApiResponse<AuthResponse>>('/auth/me');
  return response.data.data;
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<ApiResponse<User[]>>('/users');
  return response.data.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (request: CreateUserRequest): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/users', request);
  return response.data.data;
};

// Accounts
export const getAccounts = async (userId?: number): Promise<Account[]> => {
  const params = userId ? { userId } : {};
  const response = await api.get<ApiResponse<Account[]>>('/accounts', { params });
  return response.data.data;
};

export const getAccountById = async (id: number): Promise<Account> => {
  const response = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
  return response.data.data;
};

export const getAccountBalance = async (id: number) => {
  const response = await api.get<ApiResponse<any>>(`/accounts/${id}/balance`);
  return response.data.data;
};

export const createAccount = async (request: CreateAccountRequest): Promise<Account> => {
  const response = await api.post<ApiResponse<Account>>('/accounts', request);
  return response.data.data;
};

// --- Phase 2: Banking & Account Lifecycle Operations ---
export const deposit = async (
  accountId: number,
  request: DepositRequest
): Promise<Account> => {
  const response = await api.post<ApiResponse<Account>>(
    `/accounts/${accountId}/deposit`,
    request
  );
  return response.data.data;
};

export const withdraw = async (
  accountId: number,
  request: WithdrawRequest
): Promise<Account> => {
  const response = await api.post<ApiResponse<Account>>(
    `/accounts/${accountId}/withdraw`,
    request
  );
  return response.data.data;
};

export const updateAccountStatus = async (
  accountId: number,
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED'
): Promise<Account> => {
  const response = await api.patch<ApiResponse<Account>>(
    `/accounts/${accountId}/status`,
    { status }
  );
  return response.data.data;
};

// Transfers (2PC) with distributed idempotency
export const executeTransfer = async (
  request: TransferRequest,
  idempotencyKey?: string
): Promise<TransferResponse> => {
  const key = idempotencyKey || request.idempotencyKey;
  const headers: Record<string, string> = {};
  if (key) {
    headers['X-Idempotency-Key'] = key;
  }

  const response = await api.post<ApiResponse<TransferResponse>>('/transfers', request, {
    headers,
  });
  return response.data.data;
};

// 2PC Recovery Sweep trigger
export const trigger2pcRecovery = async (staleSeconds: number = 30) => {
  const response = await api.post<ApiResponse<{ reconciledTransactions: number; staleThresholdSeconds: number }>>(
    '/transfers/recovery',
    null,
    { params: { staleSeconds } }
  );
  return response.data.data;
};

// Transactions with pagination, filtering & sorting
export const getTransactions = async (params: {
  accountId?: number;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<TransactionResponse>> => {
  const url = params.accountId
    ? `/accounts/${params.accountId}/transactions`
    : '/transactions';

  const response = await api.get<ApiResponse<PageResponse<TransactionResponse>>>(
    url,
    { params }
  );
  return response.data.data;
};

export const getTransactionById = async (
  transactionId: string
): Promise<TransactionResponse> => {
  const response = await api.get<ApiResponse<TransactionResponse>>(
    `/transactions/${transactionId}`
  );
  return response.data.data;
};

// --- Phase 4: Merchant Services, QR Code Payments & Batch Settlement ---
export const getMerchants = async (): Promise<Merchant[]> => {
  const response = await api.get<ApiResponse<Merchant[]>>('/merchants');
  return response.data.data;
};

export const getMerchantById = async (id: number): Promise<Merchant> => {
  const response = await api.get<ApiResponse<Merchant>>(`/merchants/${id}`);
  return response.data.data;
};

export const getMerchantByUserId = async (userId: number): Promise<Merchant> => {
  const response = await api.get<ApiResponse<Merchant>>(`/merchants/user/${userId}`);
  return response.data.data;
};

export const onboardMerchant = async (
  payload: MerchantOnboardPayload
): Promise<Merchant> => {
  const response = await api.post<ApiResponse<Merchant>>('/merchants/onboard', payload);
  return response.data.data;
};

export const generateQrCode = async (req: {
  merchantId: number;
  amount?: number;
  orderRef?: string;
  description?: string;
  isDynamic?: boolean;
  expiryMinutes?: number;
}): Promise<QrCodeResponse> => {
  const response = await api.post<ApiResponse<QrCodeResponse>>('/merchants/qr/generate', req);
  return response.data.data;
};

export const scanQrCode = async (qrPayload: string): Promise<QrScanDetails> => {
  const response = await api.post<ApiResponse<QrScanDetails>>('/merchants/qr/scan', {
    qrPayload,
  });
  return response.data.data;
};

export const payQrCode = async (payload: {
  qrPayload: string;
  payerAccountId: number;
  amount?: number;
  idempotencyKey?: string;
  notes?: string;
}): Promise<QrPaymentResponse> => {
  const headers: Record<string, string> = {};
  if (payload.idempotencyKey) {
    headers['X-Idempotency-Key'] = payload.idempotencyKey;
  }
  const response = await api.post<ApiResponse<QrPaymentResponse>>(
    '/merchants/qr/pay',
    payload,
    { headers }
  );
  return response.data.data;
};

export const settleMerchant = async (merchantId: number): Promise<SettlementBatch> => {
  const response = await api.post<ApiResponse<SettlementBatch>>(
    `/merchants/${merchantId}/settle`
  );
  return response.data.data;
};

export const getSettlementHistory = async (
  merchantId: number
): Promise<SettlementBatch[]> => {
  const response = await api.get<ApiResponse<SettlementBatch[]>>(
    `/merchants/${merchantId}/settlements`
  );
  return response.data.data;
};

// --- Phase 5: Double-Entry Financial Ledger & Audit Reporting ---
export const getLedgerEntriesByAccount = async (
  accountId: number
): Promise<LedgerEntryResponse[]> => {
  const response = await api.get<ApiResponse<LedgerEntryResponse[]>>(
    `/ledger/accounts/${accountId}/entries`
  );
  return response.data.data;
};

export const getAllLedgerEntries = async (): Promise<LedgerEntryResponse[]> => {
  const response = await api.get<ApiResponse<LedgerEntryResponse[]>>('/ledger/entries');
  return response.data.data;
};

export const reconcileAccount = async (
  accountId: number
): Promise<ReconciliationResponse> => {
  const response = await api.get<ApiResponse<ReconciliationResponse>>(
    `/ledger/reconcile/${accountId}`
  );
  return response.data.data;
};

export const downloadStatementCsv = async (accountId: number): Promise<void> => {
  const response = await api.get(`/ledger/accounts/${accountId}/statement/csv`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `statement_account_${accountId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// --- Phase 6: Multi-Currency & Cross-Border Exchange Engine ---
export const getFxRates = async (): Promise<FxRatesResponse> => {
  const response = await api.get<ApiResponse<FxRatesResponse>>('/fx/rates');
  return response.data.data;
};

export const getFxQuote = async (
  sourceCurrency: string,
  targetCurrency: string,
  amount: number
): Promise<FxQuoteResponse> => {
  const response = await api.get<ApiResponse<FxQuoteResponse>>('/fx/quote', {
    params: { sourceCurrency, targetCurrency, amount },
  });
  return response.data.data;
};

export const executeFxExchange = async (
  request: ExchangeRequest,
  idempotencyKey?: string
): Promise<ExchangeResponse> => {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }
  const response = await api.post<ApiResponse<ExchangeResponse>>(
    '/fx/exchange',
    request,
    { headers }
  );
  return response.data.data;
};

