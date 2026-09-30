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
  User,
  WithdrawRequest,
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

// Transfers (2PC)
export const executeTransfer = async (
  request: TransferRequest
): Promise<TransactionResponse> => {
  const response = await api.post<ApiResponse<any>>('/transfers', request);
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
