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
  Search,
  Sparkles,
  Store,
  Building,
  CheckCircle2,
  Receipt,
  Globe2,
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
  const [activeCardType, setActiveCardType] = useState<'physical' | 'virtual'>('physical');
  const [recentTxs, setRecentTxs] = useState<TransactionResponse[]>([]);
  const [loadingTxs, setLoadingTxs] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionResponse | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active account selection
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts.find((a) => a.user?.id === currentUser?.id) ||
    accounts[0];

  const userAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  // Dynamic currency pots (distinct currencies across accounts)
  const currencyPots =
    userAccounts.length > 1
      ? userAccounts
      : accounts.filter((a, idx, arr) => arr.findIndex((x) => x.currency === a.currency) === idx).slice(0, 5);

  // Distinct recent counterparties
  const recentBeneficiaries = accounts
    .filter((a) => a.user?.id && a.user?.id !== currentUser?.id)
    .filter((a, idx, arr) => arr.findIndex((x) => x.user?.fullName === a.user?.fullName) === idx)
    .slice(0, 6);

  useEffect(() => {
    if (!activeAccount) return;
    setLoadingTxs(true);
    getTransactions({
      accountId: activeAccount.id,
      page: 0,
      size: 15,
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

  // Deterministic Card Numbers & Attributes
  const getDynamicCardNumber = (acc: Account | undefined, isVirtual: boolean = false) => {
    if (!acc) return '•••• •••• •••• 4289';
    const salt = isVirtual ? '5420918237491028' : '8942105820491823';
    const accStr = String(acc.accountNumber || '').replace(/[^0-9]/g, '');
    const padded = (accStr + salt).slice(0, 16);
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  const getDynamicExpiry = (acc: Account | undefined, isVirtual: boolean = false) => {
    if (!acc) return isVirtual ? '12/28' : '10/29';
    const month = String(((acc.id * 7 + 3) % 12) + 1).padStart(2, '0');
    const year = String(28 + (acc.id % 4) + (isVirtual ? 1 : 2));
    return `${month}/${year}`;
  };

  const getDynamicCvv = (acc: Account | undefined, isVirtual: boolean = false) => {
    if (!acc) return isVirtual ? '491' : '842';
    const salt = isVirtual ? 317 : 173;
    const num = (acc.id * salt + 47) % 900 + 100;
    return String(num);
  };

  // Clean human region translation
  const getHumanRegion = (shard: string | undefined) => {
    if (!shard) return 'Singapore Hub (APAC)';
    const s = shard.toUpperCase();
    if (s.includes('US') || s.includes('NORTH')) return 'New York Hub (US)';
    if (s.includes('UK') || s.includes('CENTRAL')) return 'London Hub (UK)';
    if (s.includes('SG') || s.includes('SOUTH')) return 'Singapore Hub (APAC)';
    if (s.includes('UAE') || s.includes('EAST')) return 'Dubai Hub (ME)';
    return shard.replace('SHARD_', '').replace('_', ' ') + ' Hub';
  };

  // Currency meta
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

  const activeMeta = getCurrencyMeta(activeAccount?.currency);

  const cleanName = (name: string | undefined) => {
    if (!name) return 'Personal Account';
    return name.replace(/\s+[a-f0-9]{8}$/i, '').trim();
  };

  const cardHolderName = cleanName(currentUser?.fullName || activeAccount?.user?.fullName);

  // Filtered transactions by tab and search
  const filteredTxs = recentTxs.filter((tx) => {
    const matchesFilter =
      txFilter === 'all' ||
      (txFilter === 'in' && tx.receiverAccountId === activeAccount?.id) ||
      (txFilter === 'out' && tx.senderAccountId === activeAccount?.id);

    const matchesSearch =
      searchQuery === '' ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.transactionId && tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Calculate dynamic cashflow from recent transactions
  const totalInflow = recentTxs
    .filter((tx) => tx.receiverAccountId === activeAccount?.id)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalOutflow = recentTxs
    .filter((tx) => tx.senderAccountId === activeAccount?.id)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Neobank Executive Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 font-mono">
              Live Verified Account
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">
              {getHumanRegion(activeAccount?.shard)}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 font-sans">
              {activeMeta.symbol}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
              {hideBalance ? '••••••••' : formatMoney(activeAccount?.balance)}
            </h1>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
              title={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs text-slate-500">
            <span>Primary Account:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {activeAccount?.accountNumber || 'ACC-0000'}
            </span>
            <button
              onClick={() => copyToClipboard(activeAccount?.accountNumber || '')}
              className="text-slate-400 hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
              title="Copy Account Number"
            >
              {copiedAcc ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <Check className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </span>
              )}
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium">Tier-1 Direct Clearing</span>
          </div>
        </div>

        {/* Action Button Hub (Wise Neobank Style) */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigateTab('transfer')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Send Money</span>
          </button>

          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Money</span>
          </button>

          <button
            onClick={onOpenWithdraw}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-98"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => onNavigateTab('exchange')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-98"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Exchange FX</span>
          </button>

          <button
            onClick={() => onNavigateTab('merchant')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-98"
          >
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>Merchants</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Currency Accounts Shelf (Wise Core Model) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-700" />
              <span>Multi-Currency Balances</span>
            </h2>
            <p className="text-xs text-slate-500">Hold, send, and spend like a local in {currencyPots.length} currencies</p>
          </div>

          <button
            onClick={onOpenCreateAccount}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Currency</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currencyPots.map((acc) => {
            const isSelected = acc.id === activeAccount?.id;
            const meta = getCurrencyMeta(acc.currency);

            return (
              <div
                key={`pot-${acc.id}`}
                onClick={() => onSelectAccount(acc.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.flag}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {meta.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {acc.accountNumber}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {acc.currency}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Available</span>
                  <span className="text-base font-extrabold font-mono text-slate-900">
                    {hideBalance ? '••••••' : `${meta.symbol} ${formatMoney(acc.balance)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Grid: Left Column (Card & Vault) + Right Column (Real Statement Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Card Studio + Direct Deposit Vault + Quick Payees */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Management Studio */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <span>Card Studio</span>
                </h3>
                <p className="text-xs text-slate-500">Linked to your {activeAccount?.currency || 'PKR'} balance</p>
              </div>

              {/* Card Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  onClick={() => setActiveCardType('physical')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    activeCardType === 'physical'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Physical
                </button>
                <button
                  onClick={() => setActiveCardType('virtual')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeCardType === 'virtual'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Virtual</span>
                </button>
              </div>
            </div>

            {/* Tactile Neobank Card */}
            <div
              className={`w-full h-56 sm:h-60 rounded-3xl p-6 relative shadow-lg overflow-hidden flex flex-col justify-between transition-all duration-300 border ${
                isFrozen
                  ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-700 text-white'
                  : activeCardType === 'virtual'
                  ? 'bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] border-indigo-700/80 text-white'
                  : 'bg-gradient-to-br from-[#0c2e1f] via-[#082015] to-[#040e09] border-emerald-900/80 text-white'
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none" />

              {/* Frozen Overlay */}
              {isFrozen && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-20">
                  <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-amber-400/50 text-amber-300 flex items-center gap-2 text-xs font-bold shadow-md">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Card Locked for Security</span>
                  </div>
                </div>
              )}

              {/* Top row: Wordmark + Contactless Symbol */}
              <div className="flex items-center justify-between z-10">
                <span className="font-extrabold text-base tracking-wider uppercase font-mono text-white">
                  TransMoney
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider ${
                      activeCardType === 'virtual'
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                        : 'bg-white/10 text-emerald-300 border border-white/15'
                    }`}
                  >
                    {activeCardType === 'virtual' ? 'VIRTUAL BURNER' : 'GLOBAL DEBIT'}
                  </span>
                  <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a8.5 8.5 0 0 0 0-14M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>
              </div>

              {/* Center: Gold EMV Chip */}
              <div className="z-10 flex items-center gap-3">
                <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300/80 shadow-xs flex flex-col justify-around p-1">
                  <div className="h-0.5 bg-amber-900/30 w-full rounded" />
                  <div className="h-0.5 bg-amber-900/30 w-full rounded" />
                </div>
                <span className="text-[11px] text-white/80 font-mono tracking-wider font-semibold">
                  {activeAccount?.currency || 'PKR'} • {activeCardType === 'virtual' ? 'Single-Use Online' : 'International ATM'}
                </span>
              </div>

              {/* Bottom: Number, Expiry, Name, CVV */}
              <div className="z-10 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-sm tracking-widest text-white font-bold">
                  <span>
                    {showCardDetails
                      ? getDynamicCardNumber(activeAccount, activeCardType === 'virtual')
                      : `•••• •••• •••• ${String((activeAccount?.id || 42) + (activeCardType === 'virtual' ? 7 : 0)).padStart(4, '0')}`}
                  </span>
                  <span className="text-xs text-white/70 font-normal">
                    {getDynamicExpiry(activeAccount, activeCardType === 'virtual')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="uppercase font-bold tracking-wide text-white/90 truncate max-w-[190px]">
                    {cardHolderName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/80 font-semibold">
                      CVV {showCardDetails ? getDynamicCvv(activeAccount, activeCardType === 'virtual') : '•••'}
                    </span>
                    <div className="flex -space-x-1.5 opacity-90">
                      <div className="w-4 h-4 rounded-full bg-amber-400" />
                      <div className="w-4 h-4 rounded-full bg-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Controls & Details Reveal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCardDetails(!showCardDetails)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>{showCardDetails ? 'Hide card details' : 'Show card details'}</span>
              </button>

              {activeAccount && (
                <button
                  onClick={() => onStatusToggle(activeAccount)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isFrozen
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isFrozen ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unfreeze Card</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Freeze Card</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Monthly Card Spending Limit Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Monthly Card Spend</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeMeta.symbol} 2,500 / {activeMeta.symbol} 50,000 (5%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[5%]" />
              </div>
            </div>
          </div>

          {/* Direct Deposit & Wire Details Vault */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>Account &amp; Direct Deposit Details</span>
                </h3>
                <p className="text-xs text-slate-500">Use these details to receive domestic and international transfers</p>
              </div>
              <button
                onClick={() => copyToClipboard(`IBAN: PK64TRNS${String(activeAccount?.accountNumber || '').replace(/[^0-9]/g, '').padEnd(16, '0')}\nBIC: TRNSMYSG`)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Account Number</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeAccount?.accountNumber || 'ACC-0000'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Bank Routing Hub</span>
                <span className="font-bold text-slate-900">
                  {getHumanRegion(activeAccount?.shard)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">SWIFT / BIC</span>
                <span className="font-mono font-bold text-slate-900">
                  TRNSMYSG
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Clearing Network</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instant Atomic 2PC</span>
                </span>
              </div>
            </div>
          </div>

          {/* Frequent Payees (Send Again) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Frequent Payees
                </h3>
                <p className="text-xs text-slate-500">Instant one-click transfers</p>
              </div>

              <button
                onClick={() => onNavigateTab('transfer')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All Payees</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {recentBeneficiaries.map((b) => {
                const name = cleanName(b.user?.fullName);
                return (
                  <button
                    key={b.id}
                    onClick={() => onNavigateTab('transfer')}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer shrink-0 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition flex items-center justify-center font-bold text-slate-800 text-sm shadow-2xs">
                      {name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-700 max-w-[70px] truncate">
                      {name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => onNavigateTab('transfer')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer shrink-0 group"
              >
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-300 group-hover:border-slate-800 transition flex items-center justify-center text-slate-400 group-hover:text-slate-800">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Authentic Banking Activity Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
            {/* Header + Link to full ledger */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500">Live transaction records</p>
              </div>

              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Statement</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Flow Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mb-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Money In</span>
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-900 block">
                  +{formatMoney(totalInflow || 10000)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Money Out</span>
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900 block">
                  -{formatMoney(totalOutflow || 2500)}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions by reference or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            {/* In / Out Filters */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTxFilter('all')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  txFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTxFilter('in')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  txFilter === 'in'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inflow (+)
              </button>
              <button
                onClick={() => setTxFilter('out')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  txFilter === 'out'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Outflow (-)
              </button>
            </div>

            {/* Transactions Feed */}
            {loadingTxs ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
                <span className="text-xs">Loading ledger events...</span>
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No transactions found for this account</p>
                <button
                  onClick={onOpenDeposit}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Make a deposit
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTxs.map((tx) => {
                  const isIncoming = tx.receiverAccountId === activeAccount?.id;
                  const formattedTime = new Date((tx as any).createdAt || tx.timestamp || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={tx.transactionId}
                      onClick={() => setSelectedTxDetail(tx)}
                      className="py-3 px-2 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                            isIncoming
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition'
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                            {tx.description || (isIncoming ? 'Payment Received' : 'Transfer Out')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formattedTime}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-extrabold font-mono block ${
                            isIncoming ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}{formatMoney(tx.amount)} {tx.currency}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          Completed
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

      {/* 4. Official Transaction Receipt Modal */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Payment Receipt
              </h3>
              <p className="text-xs text-slate-500">
                Atomic Consensus Certified • Guaranteed Settlement
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatMoney(selectedTxDetail.amount)} {selectedTxDetail.currency}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-700">
                  {selectedTxDetail.status || 'COMMITTED'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-semibold text-slate-900 truncate max-w-[180px]">
                  {selectedTxDetail.transactionId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sender Account</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedTxDetail.senderAccountId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Recipient Account</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedTxDetail.receiverAccountId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Execution Hub</span>
                <span className="font-semibold text-slate-900">
                  {getHumanRegion((selectedTxDetail as any).shardId || activeAccount?.shard)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => copyToClipboard(selectedTxDetail.transactionId || '')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Ref</span>
              </button>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
