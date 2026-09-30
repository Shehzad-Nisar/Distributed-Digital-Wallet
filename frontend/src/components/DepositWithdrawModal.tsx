import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, CreditCard, Landmark, X } from 'lucide-react';
import { deposit, withdraw } from '../api/client';
import type { Account } from '../types';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  mode: 'deposit' | 'withdraw';
  onSuccess: (updatedAccount: Account) => void;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  isOpen,
  onClose,
  account,
  mode: initialMode,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(initialMode);
  const [amount, setAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('DEBIT_CARD');
  const [referenceNotes, setReferenceNotes] = useState('');

  // Withdrawal fields
  const [destinationBank, setDestinationBank] = useState('Standard Chartered Bank');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('PK36SCBL0000001234567801');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than zero.');
      }

      if (mode === 'deposit') {
        const updated = await deposit(account.id, {
          amount: numAmount,
          paymentMethod,
          referenceNotes: referenceNotes.trim() || undefined,
        });
        onSuccess(updated);
        onClose();
      } else {
        if (numAmount > account.balance) {
          throw new Error(`Insufficient balance. Maximum withdrawable amount is ${account.balance} ${account.currency}`);
        }
        const updated = await withdraw(account.id, {
          amount: numAmount,
          destinationBank: destinationBank.trim(),
          destinationAccountNumber: destinationAccountNumber.trim(),
          referenceNotes: referenceNotes.trim() || undefined,
        });
        onSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        `Operation failed. Please try again.`;
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-black animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center font-mono shadow-xs ${
                mode === 'deposit' ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {mode === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-black uppercase tracking-tight">
                {mode === 'deposit' ? 'Add Funds to Wallet' : 'Withdraw Funds'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {account.accountNumber} • Balance: {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {account.currency}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/60 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('deposit');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'deposit'
                ? 'border-b-2 border-emerald-600 text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            Deposit / Add Money
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('withdraw');
              setErrorMsg(null);
            }}
            className={`py-2.5 text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'withdraw'
                ? 'border-b-2 border-indigo-600 text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
            Bank Withdrawal
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-xs text-rose-800 font-mono flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️ Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Amount ({account.currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-black text-base font-bold font-mono focus:outline-none focus:border-black transition"
              />
              <span className="absolute right-3 top-3 text-xs font-mono font-bold text-slate-400">
                {account.currency}
              </span>
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2 pt-2">
              {['500', '1000', '5000', '10000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {mode === 'deposit' ? (
            <>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DEBIT_CARD')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'DEBIT_CARD'
                        ? 'border-emerald-600 bg-emerald-50 text-black'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block">Debit / Credit Card</span>
                      <span className="text-[10px] text-slate-400 font-mono">Instant Top-Up</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_WIRE')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'BANK_WIRE'
                        ? 'border-emerald-600 bg-emerald-50 text-black'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block">Bank Transfer</span>
                      <span className="text-[10px] text-slate-400 font-mono">1-Click Load</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salary top-up or ATM deposit"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Destination Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Chartered / HBL / Chase"
                  value={destinationBank}
                  onChange={(e) => setDestinationBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Destination Account / IBAN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PK36SCBL0000001234567801"
                  value={destinationAccountNumber}
                  onChange={(e) => setDestinationAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Withdrawal Memo (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal savings cashout"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer ${
                mode === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <span>Executing Distributed Ledger Entry...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {mode === 'deposit'
                    ? `Confirm Deposit of ${amount} ${account.currency}`
                    : `Confirm Payout of ${amount} ${account.currency}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
