import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Unlock,
  Copy,
  Check,
  ArrowRightLeft,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import type { Account, TransactionResponse, User } from '../types';
import { getTransactions } from '../api/client';

interface WalletHomeProps {
  accounts: Account[];
  currentUser: User | null;
  selectedAccountId: number | null;
  onSelectAccount: (id: number) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCreateAccount: () => void;
  onNavigateTab: (tab: 'transfer' | 'merchant' | 'exchange' | 'ledger' | 'core') => void;
  onStatusToggle: (acc: Account) => void;
  refreshTrigger: number;
}

export const WalletHome: React.FC<WalletHomeProps> = ({
  accounts,
  currentUser,
  selectedAccountId,
  onSelectAccount,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCreateAccount,
  onNavigateTab,
  onStatusToggle,
  refreshTrigger,
}) => {
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);
  const [showCardDetails, setShowCardDetails] = useState<boolean>(false);
  const [recentTxs, setRecentTxs] = useState<TransactionResponse[]>([]);
  const [loadingTxs, setLoadingTxs] = useState<boolean>(false);

  // Determine active account
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts.find((a) => a.user?.id === currentUser?.id) ||
    accounts[0];

  const userAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  // Accounts to display in multi-currency pots: either user accounts or global selection
  const currencyPots = userAccounts.length > 0 ? userAccounts : accounts.slice(0, 6);

  useEffect(() => {
    if (!activeAccount) return;
    setLoadingTxs(true);
    getTransactions({
      accountId: activeAccount.id,
      page: 0,
      size: 5,
      sort: 'createdAt',
      order: 'desc',
    })
      .then((res) => {
        setRecentTxs(res.content || []);
      })
      .catch((err) => {
        console.error('Error fetching recent transactions:', err);
      })
      .finally(() => {
        setLoadingTxs(false);
      });
  }, [activeAccount?.id, refreshTrigger]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const isFrozen = activeAccount?.status === 'FROZEN';

  // Format currency
  const formatMoney = (val: number | string | undefined, _curr: string = 'PKR') => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Neobank Hero: Total Balance & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Total Account Balance Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
                  Primary Account Balance
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase font-mono">
                  {activeAccount?.currency || 'PKR'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition cursor-pointer"
                  title={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {activeAccount && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isFrozen
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {activeAccount.status}
                  </span>
                )}
              </div>
            </div>

            {/* Large Balance Display */}
            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-black">
                  {hideBalance
                    ? '••••••••'
                    : formatMoney(activeAccount?.balance, activeAccount?.currency)}
                </span>
                <span className="text-lg sm:text-2xl font-bold text-slate-500">
                  {activeAccount?.currency || 'PKR'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-mono">
                  Account Number:
                </span>
                <span className="text-xs font-bold font-mono text-black">
                  {activeAccount?.accountNumber || 'ACC-0000'}
                </span>
                <button
                  onClick={() => copyToClipboard(activeAccount?.accountNumber || '')}
                  className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 transition cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedAcc ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('transfer')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-medium text-xs transition cursor-pointer shadow-xs active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Send Money</span>
            </button>

            <button
              onClick={onOpenDeposit}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Add Money</span>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => onNavigateTab('exchange')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-300 hover:border-black text-black font-medium text-xs transition cursor-pointer shadow-2xs active:scale-98"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Convert FX</span>
            </button>
          </div>
        </div>

        {/* Right: SadaPay / Revolut Style Virtual Debit Card */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div
            className={`w-full h-56 rounded-2xl p-6 text-white relative shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              isFrozen
                ? 'bg-linear-to-br from-slate-700 via-slate-800 to-slate-900 opacity-90'
                : 'bg-linear-to-br from-neutral-900 via-neutral-950 to-black border border-neutral-800'
            }`}
          >
            {/* Top row: Brand & Contactless */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-wider uppercase font-mono">
                  TransMoney
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono tracking-widest uppercase">
                  DEBIT
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isFrozen && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-mono font-bold">
                    CARD FROZEN
                  </span>
                )}
                <Smartphone className="w-5 h-5 text-neutral-400" />
              </div>
            </div>

            {/* Chip Graphic */}
            <div className="z-10 flex items-center gap-4 my-auto">
              <div className="w-10 h-7 rounded bg-amber-200/90 border border-amber-300/80 shadow-inner flex flex-col justify-around p-1">
                <div className="h-0.5 bg-amber-600/40 w-full" />
                <div className="h-0.5 bg-amber-600/40 w-full" />
              </div>
              <div className="text-neutral-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a8.5 8.5 0 0 0 0-14M15.5 21.5a12 12 0 0 0 0-19" />
                </svg>
              </div>
            </div>

            {/* Bottom Details */}
            <div className="z-10 space-y-1">
              <div className="flex items-center justify-between font-mono text-sm tracking-widest">
                <span>
                  {showCardDetails
                    ? `4289 9012 ${String(activeAccount?.id || '10').padStart(4, '0')} 8842`
                    : `•••• •••• •••• ${String(activeAccount?.id || '42').padStart(4, '0')}`}
                </span>
                <span className="text-xs text-neutral-400">EXP 10/29</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs uppercase font-medium tracking-wider text-neutral-300 truncate max-w-[180px]">
                  {currentUser?.fullName || activeAccount?.user?.fullName || 'CARDHOLDER'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  CVV: {showCardDetails ? '842' : '•••'}
                </span>
              </div>
            </div>

            {/* Subtle background circles for card feel */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-12 top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card Controls Below */}
          <div className="flex items-center justify-between pt-3 px-1">
            <button
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="text-xs text-slate-600 hover:text-black font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{showCardDetails ? 'Hide Card Details' : 'Show Card Details'}</span>
            </button>

            {activeAccount && (
              <button
                onClick={() => onStatusToggle(activeAccount)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                  isFrozen
                    ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-black hover:text-black'
                }`}
              >
                {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isFrozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Wise-Style Multi-Currency Balances (Currency Pots) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-black">
              Multi-Currency Accounts &amp; Pots
            </h3>
            <p className="text-xs text-slate-500">
              Hold and spend in multiple currencies with transparent real-time conversions
            </p>
          </div>

          <button
            onClick={onOpenCreateAccount}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-medium transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Currency Account</span>
          </button>
        </div>

        {/* Currency Pots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currencyPots.map((acc, index) => {
            const isSelected = acc.id === activeAccount?.id;
            return (
              <div
                key={`pot-${acc.id}-${index}`}
                onClick={() => onSelectAccount(acc.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative bg-white ${
                  isSelected
                    ? 'border-black ring-2 ring-black/10 shadow-sm'
                    : 'border-slate-200 hover:border-slate-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs">
                      {acc.currency === 'USD' ? '$' : acc.currency === 'GBP' ? '£' : acc.currency === 'EUR' ? '€' : acc.currency === 'SGD' ? 'S$' : acc.currency === 'AED' ? 'د.إ' : '₨'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-black block leading-tight">
                        {acc.currency} Wallet
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {acc.accountNumber}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-lg font-black text-black block font-mono">
                    {hideBalance ? '••••••' : formatMoney(acc.balance, acc.currency)} {acc.currency}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{acc.user?.fullName?.split(' ')[0] || 'Personal'}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {acc.shard ? acc.shard.replace('SHARD_', '').replace('_', ' ') : 'Global'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recent Activity & Transactions Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-black">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Live activity for {activeAccount?.accountNumber || 'active wallet'}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('ledger')}
            className="flex items-center gap-1 text-xs font-semibold text-black hover:underline cursor-pointer"
          >
            <span>View All Statements</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingTxs ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading recent activity...</span>
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            <button
              onClick={() => onNavigateTab('transfer')}
              className="text-xs text-black font-semibold hover:underline cursor-pointer"
            >
              Make your first transfer &rarr;
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTxs.map((tx, index) => {
              const isSender = tx.senderAccountId === activeAccount?.id;
              const isSuccess = tx.status === 'COMMITTED';

              return (
                <div
                  key={`tx-${tx.transactionId || index}-${index}`}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSender
                          ? 'bg-neutral-100 text-neutral-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSender ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-black block">
                        {tx.description || (isSender ? 'Transfer Sent' : 'Transfer Received')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {new Date(tx.timestamp || (tx as any).createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • Ref: {tx.transactionId?.substring(0, 12) || (tx as any).transactionReference?.substring(0, 12) || `#${(tx as any).id || 'tx'}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black block font-mono ${
                        isSender ? 'text-black' : 'text-emerald-600'
                      }`}
                    >
                      {isSender ? '-' : '+'}
                      {formatMoney(tx.amount, tx.currency)} {tx.currency}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700'
                          : tx.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Verified Security & 2PC Trust Banner (Clean Neobank Footer) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-black">
              Bank-Grade Atomic Protection
            </h4>
            <p className="text-[11px] text-slate-500">
              Transactions are guaranteed by Two-Phase Commit consensus across regional vaults with zero risk of partial failure.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('core')}
          className="text-xs font-semibold text-black hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>Inspect Infrastructure Console</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
