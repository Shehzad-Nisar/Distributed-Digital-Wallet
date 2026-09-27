import axios from 'axios';
import type {
  Account,
  ApiResponse,
  PageResponse,
  SystemHealth,
  TransactionResponse,
  TransferRequest,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async (): Promise<SystemHealth> => {
  const response = await api.get<SystemHealth>('/health');
  return response.data;
};

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

export const executeTransfer = async (
  request: TransferRequest
): Promise<TransactionResponse> => {
  const response = await api.post<ApiResponse<any>>('/transfers', request);
  return response.data.data;
};

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
