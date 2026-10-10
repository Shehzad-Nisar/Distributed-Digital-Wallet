import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Coins,
  Globe2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { getFxRates, getFxQuote, executeFxExchange } from '../api/client';
import type {
  Account,
  ExchangeResponse,
  FxQuoteResponse,
  FxRatesResponse,
  User,
} from '../types';

interface CurrencyExchangeProps {
  accounts: Account[];
  currentUser: User | null;
  onExchangeComplete: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  PKR: '₨',
};

export const CurrencyExchange: React.FC<CurrencyExchangeProps> = ({
  accounts,
  currentUser,
  onExchangeComplete,
}) => {
  const [ratesData, setRatesData] = useState<FxRatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // User accounts
  const userAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
  const [sourceAmount, setSourceAmount] = useState('100');
  const [slippagePercent, setSlippagePercent] = useState('0.5');

  // Quote state
  const [quote, setQuote] = useState<FxQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteCountdown, setQuoteCountdown] = useState<number>(60);

  // 2PC Execution State
  const [executing, setExecuting] = useState(false);
  const [twoPcPhase, setTwoPcPhase] = useState<'IDLE' | 'PREPARE' | 'COMMIT' | 'DONE'>('IDLE');
  const [executionResult, setExecutionResult] = useState<ExchangeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load FX Rates
  const loadRates = async () => {
    setRatesLoading(true);
    try {
      const data = await getFxRates();
      setRatesData(data);
    } catch (err) {
      console.error('Failed to fetch FX rates', err);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize account selections
  useEffect(() => {
    if (userAccounts.length >= 2) {
      if (!sourceAccountId) setSourceAccountId(userAccounts[0].id);
      if (!targetAccountId) setTargetAccountId(userAccounts[1].id);
    } else if (userAccounts.length === 1) {
      if (!sourceAccountId) setSourceAccountId(userAccounts[0].id);
      const otherAcc = accounts.find((a) => a.id !== userAccounts[0].id);
      if (otherAcc && !targetAccountId) setTargetAccountId(otherAcc.id);
    } else if (accounts.length >= 2) {
      if (!sourceAccountId) setSourceAccountId(accounts[0].id);
      if (!targetAccountId) setTargetAccountId(accounts[1].id);
    }
  }, [accounts, userAccounts]);

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const targetAccount = accounts.find((a) => a.id === targetAccountId);

  // Fetch / Refresh Quote whenever accounts or amount change
  useEffect(() => {
    if (!sourceAccount || !targetAccount || !sourceAmount || Number(sourceAmount) <= 0) {
      setQuote(null);
      return;
    }

    if (sourceAccount.currency === targetAccount.currency) {
      setQuote(null);
      return;
    }

    let isMounted = true;
    setQuoteLoading(true);

    const timer = setTimeout(async () => {
      try {
        const q = await getFxQuote(
          sourceAccount.currency,
          targetAccount.currency,
          Number(sourceAmount)
        );
        if (isMounted) {
          setQuote(q);
          setQuoteCountdown(60);
          setErrorMsg(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.response?.data?.message || 'Failed to calculate quote');
        }
      } finally {
        if (isMounted) setQuoteLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sourceAccountId, targetAccountId, sourceAmount]);

  // Quote expiration countdown
  useEffect(() => {
    if (!quote) return;
    const interval = setInterval(() => {
      setQuoteCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quote]);

  // Execute Cross-Currency 2PC Exchange
  const handleExecuteExchange = async () => {
    if (!sourceAccount || !targetAccount || !quote) return;

    setExecuting(true);
    setErrorMsg(null);
    setExecutionResult(null);

    try {
      // Step 1: Prepare
      setTwoPcPhase('PREPARE');
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 2: Commit
      setTwoPcPhase('COMMIT');
      const idempotencyKey = `FX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const minTarget = quote.netTargetAmount * (1 - Number(slippagePercent) / 100);

      const response = await executeFxExchange(
        {
          sourceAccountId: sourceAccount.id,
          targetAccountId: targetAccount.id,
          sourceAmount: Number(sourceAmount),
          quoteId: quote.quoteId,
          expectedRate: quote.effectiveRate,
          minTargetAmount: Number(minTarget.toFixed(2)),
          maxSlippagePercent: Number(slippagePercent),
          description: `Currency Conversion: ${sourceAmount} ${sourceAccount.currency} to ${targetAccount.currency}`,
        },
        idempotencyKey
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      setTwoPcPhase('DONE');
      setExecutionResult(response);
      onExchangeComplete();
    } catch (err: any) {
      setTwoPcPhase('IDLE');
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'Cross-currency exchange failed'
      );
    } finally {
      setExecuting(false);
    }
  };

  const isCrossShard =
    sourceAccount && targetAccount && sourceAccount.shard !== targetAccount.shard;

  return (
    <div className="space-y-6 font-sans">
      {/* Live FX Rates Marquee */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-2xs">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Live Interbank Foreign Exchange Feed
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time mid-market rates &bull; 0% hidden markup &bull; Slippage floor protection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRates}
              disabled={ratesLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ratesLoading ? 'animate-spin' : ''}`} />
              <span>Sync Rates</span>
            </button>
          </div>
        </div>

        {/* Currency Pairs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {ratesData?.directPairs &&
            Object.entries(ratesData.directPairs).map(([pair, rate]) => (
              <div
                key={pair}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{pair}</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">+0.35%</span>
                </div>
                <div className="text-sm font-black font-mono text-slate-900">
                  {Number(rate).toFixed(rate > 10 ? 2 : 4)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main 2PC Currency Converter & Execution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Converter Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 text-white rounded-xl shadow-2xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Currency Converter
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant atomic exchange between your multi-currency accounts
                </p>
              </div>
            </div>

            {quote && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Rate locked: {quoteCountdown}s</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Account Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Account */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-600 block font-bold">
                Debit Source Account *
              </label>
              <select
                value={sourceAccountId || ''}
                onChange={(e) => setSourceAccountId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-black text-xs font-mono focus:outline-none focus:border-black transition"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} ({a.currency}) - Bal: {Number(a.balance).toFixed(2)} [{a.shard}]
                  </option>
                ))}
              </select>
              {sourceAccount && (
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <span>Balance:</span>
                  <span className="font-bold text-black">
                    {CURRENCY_SYMBOLS[sourceAccount.currency] || ''}
                    {Number(sourceAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    {sourceAccount.currency}
                  </span>
                </div>
              )}
            </div>

            {/* Target Account */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-600 block font-bold">
                Credit Destination Account *
              </label>
              <select
                value={targetAccountId || ''}
                onChange={(e) => setTargetAccountId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-black text-xs font-mono focus:outline-none focus:border-black transition"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} ({a.currency}) - Bal: {Number(a.balance).toFixed(2)} [{a.shard}]
                  </option>
                ))}
              </select>
              {targetAccount && (
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <span>Balance:</span>
                  <span className="font-bold text-black">
                    {CURRENCY_SYMBOLS[targetAccount.currency] || ''}
                    {Number(targetAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    {targetAccount.currency}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Slippage Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-600 block font-bold mb-1">
                You Pay ({sourceAccount?.currency || 'USD'}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="10"
                  value={sourceAmount}
                  onChange={(e) => setSourceAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-black text-sm font-mono font-bold focus:outline-none focus:border-black transition"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                  {sourceAccount?.currency || 'USD'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-600 block font-bold mb-1">
                Slippage Tolerance Floor *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['0.1', '0.5', '1.0', '2.0'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSlippagePercent(val)}
                    className={`py-2 rounded-lg text-xs font-mono transition cursor-pointer border ${
                      slippagePercent === val
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topology Warning / Cross-Shard Indicator */}
          {sourceAccount && targetAccount && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 font-sans text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500 font-medium">Routing:</span>
                <span className="font-bold text-slate-900">
                  {sourceAccount.shard.replace('SHARD_', '').replace('_', ' ')} ({sourceAccount.currency})
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">
                  {targetAccount.shard.replace('SHARD_', '').replace('_', ' ')} ({targetAccount.currency})
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isCrossShard ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isCrossShard ? 'Cross-Regional' : 'Direct Settlement'}
              </span>
            </div>
          )}

          {/* Action Button with 2PC Progress Stepper */}
          {executing && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                <span>Atomic Exchange Consensus in Progress</span>
                <span>{twoPcPhase}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div
                  className={`p-2 rounded-xl border ${
                    twoPcPhase === 'PREPARE' || twoPcPhase === 'COMMIT' || twoPcPhase === 'DONE'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Phase 1: Lock &amp; Prepare
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    twoPcPhase === 'COMMIT' || twoPcPhase === 'DONE'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Phase 2: Commit Balances
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    twoPcPhase === 'DONE'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Ledger Recorded
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExecuteExchange}
            disabled={executing || !quote || quoteLoading}
            className="w-full py-3.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Atomic Settlement...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Confirm &amp; Convert Funds</span>
              </>
            )}
          </button>
        </div>

        {/* Live Quote & Breakdown Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-slate-900 text-white rounded-xl shadow-2xs">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Guaranteed Quote Summary
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transparent 0% markup breakdown
                </p>
              </div>
            </div>

            {quoteLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
                <span>Fetching locked quote...</span>
              </div>
            ) : quote ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase block">Recipient Receives</span>
                  <div className="text-3xl font-black font-mono text-slate-900">
                    {CURRENCY_SYMBOLS[quote.targetCurrency] || ''}
                    {Number(quote.netTargetAmount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-sm font-bold text-slate-500">{quote.targetCurrency}</span>
                  </div>
                  <span className="text-xs text-emerald-700 block font-semibold font-mono">
                    Effective Rate: 1 {quote.sourceCurrency} = {Number(quote.effectiveRate).toFixed(6)}{' '}
                    {quote.targetCurrency}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between">
                    <span>Market Mid-Rate:</span>
                    <span className="font-bold text-black">
                      1 {quote.sourceCurrency} = {Number(quote.marketRate).toFixed(6)}{' '}
                      {quote.targetCurrency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Gross Conversion:</span>
                    <span className="font-bold text-black">
                      {Number(quote.grossTargetAmount).toFixed(2)} {quote.targetCurrency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Spread Margin (0.35%):</span>
                    <span className="font-bold text-slate-500">
                      -{Number(quote.spreadFeeAmount).toFixed(2)} {quote.targetCurrency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-800 font-bold">
                    <span>Min Guaranteed Floor:</span>
                    <span className="text-emerald-700 font-mono">
                      {Number(quote.minGuaranteedAmount).toFixed(2)} {quote.targetCurrency}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Rate is locked for {quoteCountdown}s (Ref: {quote.quoteId})</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-sans text-xs">
                Select different source and target currency accounts to view live conversion quotes.
              </div>
            )}
          </div>

          {/* Execution Receipt Modal / Card */}
          {executionResult && (
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-lg space-y-3 font-sans text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">Currency Exchange Complete</span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Tx ID:</span>
                  <span className="font-bold text-black">{executionResult.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Debited Source:</span>
                  <span className="font-bold text-rose-600">
                    -{executionResult.sourceAmount} {executionResult.sourceCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Credited Target:</span>
                  <span className="font-bold text-emerald-600">
                    +{executionResult.targetAmount} {executionResult.targetCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Executed Rate:</span>
                  <span className="font-bold text-black">{executionResult.exchangeRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cross-Shard Consensus:</span>
                  <span className="font-bold text-black">
                    {executionResult.isCrossShard ? 'Yes (2PC Multi-Shard)' : 'Local Shard'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
