import React, { useState, useEffect } from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Filter,
  RefreshCw,
  Scale,
  Search,
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
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

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
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 font-sans text-black">
      {/* Title & Audit Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-black" />
          <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
            Transaction Ledger &amp; Multi-Criteria Search
          </h2>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-700">
          <Scale className="w-3.5 h-3.5 text-black" />
          <span>Double-Entry Bookkeeping: Σ Debits == Σ Credits</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleFilterSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword search */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Search Description / ID
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. wire, transfer, Daraz..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          {/* Account Filter */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Filter By Account
            </label>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-black transition"
            >
              <option value="">All Sharded Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} ({acc.user?.fullName?.split(' ')[0] || `Acc #${acc.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Min Amount (PKR)
            </label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-black transition"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Max Amount (PKR)
            </label>
            <input
              type="number"
              placeholder="100000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* Filter Buttons & Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-slate-800 font-semibold text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Filter className="w-3 h-3" />
              <span>Apply Predicates</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-black hover:border-slate-400 text-xs font-mono transition cursor-pointer shadow-2xs"
            >
              Reset
            </button>
          </div>

          {/* Sorting controls */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 uppercase text-[10px]">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-black text-xs focus:outline-none focus:border-black"
            >
              <option value="createdAt">Timestamp</option>
              <option value="amount">Amount</option>
              <option value="id">Transaction ID</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="p-1 rounded border border-slate-300 bg-white text-black hover:bg-slate-50 transition cursor-pointer"
              title={`Sort ${sortOrder.toUpperCase()}`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Transaction Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Transaction ID</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">From &rarr; To</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3 text-center">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-black" />
                  <span>Loading ledger records from sharded partitions...</span>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isExpanded = expandedTxId === tx.transactionId;
                const senderAcc = accounts.find((a) => a.id === tx.senderAccountId);
                const receiverAcc = accounts.find((a) => a.id === tx.receiverAccountId);

                return (
                  <React.Fragment key={tx.transactionId}>
                    <tr
                      onClick={() =>
                        setExpandedTxId(isExpanded ? null : tx.transactionId)
                      }
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-black max-w-[140px] truncate">
                        {tx.transactionId}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <span className="text-black font-medium">{senderAcc?.accountNumber || `#${tx.senderAccountId}`}</span>
                        <span className="text-slate-400 mx-1.5">&rarr;</span>
                        <span className="text-black font-medium">{receiverAcc?.accountNumber || `#${tx.receiverAccountId}`}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-black">
                        {Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'COMMITTED'
                              ? 'bg-black text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-black transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 mx-auto" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 mx-auto" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Double-Entry Ledger Drilldown Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={7} className="p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                            <span className="font-bold uppercase tracking-wider text-black">
                              Double-Entry Journal Verification (Tx: {tx.transactionId})
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Memo: {tx.description || 'N/A'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tx.ledgerEntries && tx.ledgerEntries.length > 0 ? (
                              tx.ledgerEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="p-3 rounded-lg border border-slate-200 bg-white font-mono text-xs space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        entry.type === 'DEBIT'
                                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                          : 'bg-black text-white'
                                      }`}
                                    >
                                      {entry.type === 'DEBIT' ? 'DEBIT [-]' : 'CREDIT [+]'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Entry #{entry.id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-slate-500">Account ID:</span>
                                    <span className="font-bold text-black">
                                      Account #{entry.accountId}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">Ledger Amount:</span>
                                    <span className="font-bold text-black">
                                      {Number(entry.amount).toFixed(2)} PKR
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                                    <span className="text-slate-400 text-[10px]">
                                      Balance After Entry:
                                    </span>
                                    <span className="font-bold text-slate-700 text-[11px]">
                                      {Number(entry.balanceAfter).toFixed(2)} PKR
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                                No ledger entries found for this transaction.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between font-mono text-xs text-slate-600 pt-2 border-t border-slate-200">
          <div>
            Page <strong className="text-black">{pageData.page + 1}</strong> of{' '}
            <strong className="text-black">{pageData.totalPages}</strong> ({pageData.totalElements} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pageData.first}
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pageData.last}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
