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
  ChevronRight,
  Smartphone,
  Wallet,
  Receipt,
  Search,
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
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionResponse | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');

  // Active account selection
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts.find((a) => a.user?.id === currentUser?.id) ||
    accounts[0];

  const userAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  // Dynamic currency accounts to display (distinct currencies across accounts)
  const currencyPots =
    userAccounts.length > 1
      ? userAccounts
      : accounts.filter((a, idx, arr) => arr.findIndex((x) => x.currency === a.currency) === idx).slice(0, 5);

  // Recent contacts / beneficiaries derived from distinct users
  const recentBeneficiaries = accounts
    .filter((a) => a.user?.id && a.user?.id !== currentUser?.id)
    .filter((a, idx, arr) => arr.findIndex((x) => x.user?.fullName === a.user?.fullName) === idx)
    .slice(0, 5);

  useEffect(() => {
    if (!activeAccount) return;
    setLoadingTxs(true);
    getTransactions({
      accountId: activeAccount.id,
      page: 0,
      size: 8,
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
  const formatMoney = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Dynamic Card Attributes calculated deterministically from activeAccount
  const getDynamicCardNumber = (acc: Account | undefined) => {
    if (!acc) return '•••• •••• •••• 4289';
    const accStr = String(acc.accountNumber || '').replace(/[^0-9]/g, '');
    const padded = (accStr + '8942105820491823').slice(0, 16);
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  const getDynamicExpiry = (acc: Account | undefined) => {
    if (!acc?.createdAt) return '10/29';
    try {
      const d = new Date(acc.createdAt);
      const expMonth = String(d.getMonth() + 1).padStart(2, '0');
      const expYear = String((d.getFullYear() + 4) % 100).padStart(2, '0');
      return `${expMonth}/${expYear}`;
    } catch {
      return '10/29';
    }
  };

  const getDynamicCvv = (acc: Account | undefined) => {
    if (!acc) return '842';
    const num = (acc.id * 173 + 31) % 900 + 100;
    return String(num);
  };

  // Clean human branch translations
  const getHumanRegion = (shard: string | undefined) => {
    if (!shard) return 'Global Multi-Currency Hub';
    const s = shard.toUpperCase();
    if (s.includes('US') || s.includes('NORTH')) return 'New York Hub (US)';
    if (s.includes('UK') || s.includes('CENTRAL')) return 'London Hub (UK)';
    if (s.includes('SG') || s.includes('SOUTH')) return 'Singapore Hub (APAC)';
    if (s.includes('UAE') || s.includes('EAST')) return 'Dubai Hub (ME)';
    return shard.replace('SHARD_', '').replace('_', ' ') + ' Hub';
  };

  // Currency flag & label mapping
  const getCurrencyMeta = (curr: string | undefined) => {
    switch (curr) {
      case 'USD':
        return { flag: '🇺🇸', name: 'US Dollar', symbol: '$' };
      case 'GBP':
        return { flag: '🇬🇧', name: 'British Pound', symbol: '£' };
      case 'EUR':
        return { flag: '🇪🇺', name: 'Euro', symbol: '€' };
      case 'AED':
        return { flag: '🇦🇪', name: 'UAE Dirham', symbol: 'د.إ' };
      case 'SGD':
        return { flag: '🇸🇬', name: 'Singapore Dollar', symbol: 'S$' };
      case 'PKR':
      default:
        return { flag: '🇵🇰', name: 'Pakistani Rupee', symbol: '₨' };
    }
  };

  // Filtered transactions
  const filteredTxs = recentTxs.filter((tx) => {
    if (txFilter === 'in') return tx.recipientAccountId === activeAccount?.id;
    if (txFilter === 'out') return tx.senderAccountId === activeAccount?.id;
    return true;
  });

  const activeMeta = getCurrencyMeta(activeAccount?.currency);
  const cardHolderName = currentUser?.fullName || activeAccount?.user?.fullName || 'Personal Account';

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-200">
      {/* Studio Greeting & Account Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {cardHolderName.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of your balances, international accounts, and spending
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">{getHumanRegion(activeAccount?.shard)}</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left Main Focus + Right Debit Card Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Balance Hero, Quick Send, and Multi-Currency Shelf */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Balance Canvas */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
            {/* Top row: Label + Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Available balance</span>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
                  title={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span>{activeMeta.flag}</span>
                  <span>{activeAccount?.currency || 'PKR'}</span>
                </span>
                {isFrozen && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Card frozen
                  </span>
                )}
              </div>
            </div>

            {/* Prominent Amount */}
            <div className="flex items-baseline gap-2.5 mb-6">
              <span className="text-xl sm:text-2xl font-semibold text-slate-400">
                {activeAccount?.currency || 'PKR'}
              </span>
              <span className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 font-mono">
                {hideBalance ? '••••••••' : formatMoney(activeAccount?.balance)}
              </span>
            </div>

            {/* Account Details Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 pb-6 border-b border-slate-100 text-xs">
              <span className="text-slate-400">Account number:</span>
              <span className="font-mono font-semibold text-slate-800">
                {activeAccount?.accountNumber || 'ACC-0000'}
              </span>
              <button
                onClick={() => copyToClipboard(activeAccount?.accountNumber || '')}
                className="p-1 hover:text-emerald-700 text-slate-400 transition cursor-pointer"
                title="Copy account number"
              >
                {copiedAcc ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="text-slate-300 mx-1">•</span>
              <span className="text-slate-500">Tier-1 Safeguarded</span>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              <button
                onClick={() => onNavigateTab('transfer')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Send money</span>
              </button>

              <button
                onClick={onOpenDeposit}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-98"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Add money</span>
              </button>

              <button
                onClick={onOpenWithdraw}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer active:scale-98"
              >
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
                <span>Withdraw</span>
              </button>

              <button
                onClick={() => onNavigateTab('exchange')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer active:scale-98"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                <span>Convert</span>
              </button>
            </div>
          </div>

          {/* Quick Send to Recent Contacts (Neobank Signature Feature) */}
          {recentBeneficiaries.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-900">Send again</span>
                <button
                  onClick={() => onNavigateTab('transfer')}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  All recipients
                </button>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto pb-1">
                {recentBeneficiaries.map((b, idx) => {
                  const avatarColorClasses = [
                    'bg-emerald-50 text-emerald-800 border-emerald-200',
                    'bg-sky-50 text-sky-800 border-sky-200',
                    'bg-indigo-50 text-indigo-800 border-indigo-200',
                    'bg-amber-50 text-amber-800 border-amber-200',
                    'bg-rose-50 text-rose-800 border-rose-200',
                  ];
                  const colorClass = avatarColorClasses[idx % avatarColorClasses.length];

                  return (
                    <button
                      key={b.id}
                      onClick={() => onNavigateTab('transfer')}
                      className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
                    >
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-sm font-semibold transition shadow-2xs group-hover:scale-105 ${colorClass}`}>
                        {b.user?.fullName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 group-hover:text-slate-900 truncate max-w-[70px]">
                        {b.user?.fullName?.split(' ')[0] || 'User'}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => onNavigateTab('transfer')}
                  className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-dashed border-slate-300 group-hover:border-slate-400 flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-700">
                    New
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Multi-Currency Accounts Shelf */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Multi-currency balances
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hold, receive, and spend like a local in global currencies
                </p>
              </div>

              <button
                onClick={onOpenCreateAccount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open balance</span>
              </button>
            </div>

            {/* Currency list with clean studio rows */}
            <div className="divide-y divide-slate-100">
              {currencyPots.map((acc) => {
                const isSelected = acc.id === activeAccount?.id;
                const meta = getCurrencyMeta(acc.currency);

                return (
                  <div
                    key={`shelf-${acc.id}`}
                    onClick={() => onSelectAccount(acc.id)}
                    className={`py-3.5 px-3 rounded-2xl flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50/90 ring-1 ring-slate-200'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {meta.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {acc.accountNumber} • {getHumanRegion(acc.shard).split('(')[0].trim()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 font-mono block">
                        {hideBalance ? '••••••' : `${meta.symbol} ${formatMoney(acc.balance)}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {acc.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Physical Debit Card & Activity Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Debit Card Studio Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Digital debit card</span>
              <button
                onClick={() => setShowCardDetails(!showCardDetails)}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{showCardDetails ? 'Hide details' : 'Show details'}</span>
              </button>
            </div>

            {/* Standard Proportion Matte Physical Card */}
            <div
              className={`w-full h-52 sm:h-56 rounded-2xl p-5 relative shadow-md overflow-hidden flex flex-col justify-between transition-all duration-300 border ${
                isFrozen
                  ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-700 text-white'
                  : 'bg-gradient-to-br from-[#0e2c1e] via-[#092015] to-[#040e09] border-emerald-900/80 text-white'
              }`}
            >
              {/* Subtle metallic sheen */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />

              {/* Frozen Lock Overlay */}
              {isFrozen && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-20">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-amber-300 flex items-center gap-2 text-xs font-medium shadow-md">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Card locked</span>
                  </div>
                </div>
              )}

              {/* Top row: Brand & NFC symbol */}
              <div className="flex items-center justify-between z-10">
                <span className="font-bold text-base tracking-wider uppercase font-mono text-white">
                  TransMoney
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 border border-white/15 font-mono font-medium tracking-wider">
                    DEBIT
                  </span>
                  <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a8.5 8.5 0 0 0 0-14M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>
              </div>

              {/* Center: Gold EMV Chip */}
              <div className="z-10 flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300/80 shadow-2xs flex flex-col justify-around p-1">
                  <div className="h-0.5 bg-amber-900/30 w-full rounded" />
                  <div className="h-0.5 bg-amber-900/30 w-full rounded" />
                </div>
                <span className="text-[10px] text-white/70 font-mono tracking-wider">
                  {activeAccount?.currency || 'PKR'}
                </span>
              </div>

              {/* Bottom: Card Number & Cardholder */}
              <div className="z-10 space-y-1">
                <div className="flex items-center justify-between font-mono text-sm tracking-widest text-white font-semibold">
                  <span>
                    {showCardDetails
                      ? getDynamicCardNumber(activeAccount)
                      : `•••• •••• •••• ${String(activeAccount?.id || '42').padStart(4, '0')}`}
                  </span>
                  <span className="text-[11px] text-white/70 font-normal">
                    {getDynamicExpiry(activeAccount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="uppercase font-semibold tracking-wide text-white/90 truncate max-w-[170px]">
                    {cardHolderName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/70">
                      CVV {showCardDetails ? getDynamicCvv(activeAccount) : '•••'}
                    </span>
                    <div className="flex -space-x-1.5 opacity-80">
                      <div className="w-4 h-4 rounded-full bg-amber-400/90" />
                      <div className="w-4 h-4 rounded-full bg-rose-500/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card quick actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">Security control</span>
              {activeAccount && (
                <button
                  onClick={() => onStatusToggle(activeAccount)}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                    isFrozen
                      ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isFrozen ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isFrozen ? 'Unlock card' : 'Lock card'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Activity Feed Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transactions for {activeAccount?.accountNumber || 'active account'}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTxFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  txFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTxFilter('in')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  txFilter === 'in'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Money in
              </button>
              <button
                onClick={() => setTxFilter('out')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  txFilter === 'out'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Money out
              </button>
            </div>

            {/* Transactions List */}
            {loadingTxs ? (
              <div className="py-10 flex items-center justify-center text-slate-400 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading activity...</span>
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-slate-500">No transactions recorded yet.</p>
                <button
                  onClick={() => onNavigateTab('transfer')}
                  className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  Make your first transfer &rarr;
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTxs.map((tx, index) => {
                  const isSender = tx.senderAccountId === activeAccount?.id;
                  const isSuccess = tx.status === 'COMMITTED';
                  const rawDate = tx.timestamp || (tx as any).createdAt;
                  const formattedDate = rawDate
                    ? new Date(rawDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  const txRef = tx.transactionId || (tx as any).transactionReference || `#${index + 1}`;

                  return (
                    <div
                      key={`tx-row-${tx.transactionId || index}`}
                      onClick={() => setSelectedTxDetail(selectedTxDetail?.transactionId === tx.transactionId ? null : tx)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isSender
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isSender ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block truncate max-w-[150px] sm:max-w-[180px]">
                            {tx.description?.replace(/Cross-shard\s*/i, 'Instant ') ||
                              (isSender ? 'Payment sent' : 'Payment received')}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold block font-mono ${
                            isSender ? 'text-slate-900' : 'text-emerald-700'
                          }`}
                        >
                          {isSender ? '-' : '+'}
                          {formatMoney(tx.amount)} {tx.currency}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isSuccess ? 'Completed' : tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Receipt Modal / Drawer if row clicked */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Transfer receipt</span>
              </div>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-3xl font-bold font-mono text-slate-900 block">
                {formatMoney(selectedTxDetail.amount)} {selectedTxDetail.currency}
              </span>
              <span className="text-xs text-emerald-700 font-medium mt-1 inline-block px-2.5 py-0.5 rounded-full bg-emerald-50">
                Payment completed
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-medium text-slate-900 truncate max-w-[200px]">
                  {selectedTxDetail.transactionId || 'TX-DEFAULT'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sender Account</span>
                <span className="font-mono font-medium text-slate-900">
                  {selectedTxDetail.senderAccountId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Recipient Account</span>
                <span className="font-mono font-medium text-slate-900">
                  {selectedTxDetail.recipientAccountId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Execution Hub</span>
                <span className="font-medium text-slate-900">
                  {getHumanRegion(selectedTxDetail.shardId)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTxDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Trust & Regulatory Footer Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Regulated multi-currency digital wallet
            </h4>
            <p className="text-[11px] text-slate-500">
              Customer balances are safeguarded across licensed Tier-1 partner financial institutions with continuous reconciliation.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('core')}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 shrink-0 flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 transition"
        >
          <span>View core banking infrastructure</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
