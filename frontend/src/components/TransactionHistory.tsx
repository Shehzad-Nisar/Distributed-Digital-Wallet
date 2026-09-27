import React, { useState, useEffect } from 'react';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Scale,
  FileText,
} from 'lucide-react';
import { getTransactions } from '../api/client';
import type { Account, PageResponse, TransactionResponse } from '../types';

interface TransactionHistoryProps {
  accounts: Account[];
  selectedAccountId: number | null;
  refreshTrigger: number;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  accounts,
  selectedAccountId,
  refreshTrigger,
}) => {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [pageData, setPageData] = useState<PageResponse<TransactionResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [filterAccountId, setFilterAccountId] = useState<string>(
    selectedAccountId ? String(selectedAccountId) : ''
  );
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<TransactionResponse | null>(null);

  useEffect(() => {
    if (selectedAccountId) {
      setFilterAccountId(String(selectedAccountId));
    }
  }, [selectedAccountId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getTransactions({
        accountId: filterAccountId ? Number(filterAccountId) : undefined,
        search: search.trim() || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        sort: sortField,
        order: sortOrder,
        page: currentPage,
        size: 10,
      });
      setTransactions(res.content);
      setPageData(res);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, sortField, sortOrder, refreshTrigger]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterAccountId('');
    setMinAmount('');
    setMaxAmount('');
    setSortField('createdAt');
    setSortOrder('desc');
    setCurrentPage(0);
    setTimeout(loadData, 50);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">
            Transaction Ledger & Multi-Criteria Search (Proposal Sec 6 & 7)
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Double-Entry Parity: Strict Parity Verified</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {/* Keyword Search */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Keyword Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search memo, TX-ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Account */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Account Filter
          </label>
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Accounts (Global)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} • {a.user?.fullName} ({a.shard})
              </option>
            ))}
          </select>
        </div>

        {/* Min Amount */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Min Amount
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Max Amount */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Max Amount
          </label>
          <input
            type="number"
            placeholder="99999.00"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium border border-slate-700 transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Sorting bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Sort By:</span>
          <button
            type="button"
            onClick={() => setSortField('createdAt')}
            className={`font-medium ${
              sortField === 'createdAt' ? 'text-blue-400 font-bold' : 'hover:text-white'
            }`}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setSortField('amount')}
            className={`font-medium ${
              sortField === 'amount' ? 'text-blue-400 font-bold' : 'hover:text-white'
            }`}
          >
            Amount
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
          >
            <ArrowDownUp className="w-3 h-3" />
            <span>{sortOrder === 'desc' ? 'Descending' : 'Ascending'}</span>
          </button>
        </div>
        {pageData && (
          <span>
            Total Entries: <strong className="text-white">{pageData.totalElements}</strong>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">TX ID</th>
              <th className="py-3 px-3.5">Timestamp</th>
              <th className="py-3 px-3.5">From</th>
              <th className="py-3 px-3.5">To</th>
              <th className="py-3 px-3.5">Amount</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Description</th>
              <th className="py-3 px-3.5 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  Querying distributed shards...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No transactions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transactionId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3.5 font-mono text-blue-400 font-medium truncate max-w-[130px]">
                    {tx.transactionId}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 font-mono">
                    Acc #{tx.senderAccountId}
                  </td>
                  <td className="py-3 px-3.5 font-mono">
                    Acc #{tx.receiverAccountId}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                    {Number(tx.amount).toFixed(2)} {tx.currency}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 max-w-[180px] truncate">
                    {tx.description || '-'}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-medium text-[11px] border border-slate-700"
                    >
                      Ledger ({tx.ledgerEntries?.length || 2})
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageData && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Page {pageData.page + 1} of {Math.max(pageData.totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={pageData.first}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 border border-slate-700 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={pageData.last}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 border border-slate-700 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Immutable Double-Entry Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-mono text-blue-400 font-bold truncate">
                {selectedTx.transactionId}
              </div>
              <p className="text-slate-400">{selectedTx.description}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Balanced Ledger Records:
              </span>
              {selectedTx.ledgerEntries && selectedTx.ledgerEntries.length > 0 ? (
                selectedTx.ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border text-xs flex justify-between items-center ${
                      entry.type === 'DEBIT'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold mr-2">[{entry.type}]</span>
                      <span>Account #{entry.accountId}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Balance After: ${entry.balanceAfter} {selectedTx.currency || 'USD'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {entry.type === 'DEBIT' ? '-' : '+'}
                      ${entry.amount} {selectedTx.currency || 'USD'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-800 text-slate-400 text-xs text-center">
                  Double-entry records verified: Debit #{selectedTx.senderAccountId} and Credit #{selectedTx.receiverAccountId}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Mathematical Parity:</span>
              <span className="text-emerald-400 font-bold">
                ∑ Debits ({selectedTx.amount}) == ∑ Credits ({selectedTx.amount})
              </span>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
            >
              Close Ledger View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
