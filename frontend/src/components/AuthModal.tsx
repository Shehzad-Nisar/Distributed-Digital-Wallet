import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { createAccount, createUser } from '../api/client';
import type { Account, ShardType, User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  accounts: Account[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onUserCreated: (newUser: User, newAccount: Account) => void;
  initialMode?: 'signin' | 'signup';
}

const REGION_OPTIONS: { value: ShardType; label: string; desc: string }[] = [
  { value: 'SHARD_1_NORTH', label: 'North Region', desc: 'Islamabad / KPK' },
  { value: 'SHARD_2_CENTRAL', label: 'Central Region', desc: 'Lahore / Punjab' },
  { value: 'SHARD_3_SOUTH', label: 'South Region', desc: 'Karachi / Sindh' },
  { value: 'SHARD_4_ENTERPRISE', label: 'Business Hub', desc: 'Corporate / Merchant' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  accounts,
  currentUser,
  onSelectUser,
  onUserCreated,
  initialMode = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialMode);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState(`ACC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [initialBalance, setInitialBalance] = useState('5000');
  const [shard, setShard] = useState<ShardType>('SHARD_1_NORTH');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const user = await createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      const account = await createAccount({
        userId: user.id,
        accountNumber: accountNumber.trim().toUpperCase(),
        currency: 'PKR',
        initialBalance: Number(initialBalance) || 0,
        shard,
      });

      onUserCreated(user, account);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not create your account. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-black">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">
              TM
            </div>
            <h3 className="text-base font-bold text-black uppercase tracking-tight">
              TransMoney Wallet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
            }}
            className={`py-3 text-center transition cursor-pointer ${
              tab === 'signin'
                ? 'border-b-2 border-black text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`py-3 text-center transition cursor-pointer ${
              tab === 'signup'
                ? 'border-b-2 border-black text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            + Open New Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-xs text-rose-800 font-mono">
              {errorMsg}
            </div>
          )}

          {tab === 'signin' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Select your profile to sign in and access your wallet.
              </p>

              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-mono">
                    No accounts found. Create one to get started.
                  </div>
                ) : (
                  users.map((u) => {
                    const isCurrent = currentUser?.id === u.id;
                    const userAccounts = accounts.filter((a) => a.user?.id === u.id || (a as any).userId === u.id);
                    const totalBal = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'border-black bg-slate-50 text-black shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center">
                              {u.fullName.charAt(0)}
                            </div>
                            <span className="font-semibold text-sm text-black">{u.fullName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono pl-9">{u.email}</p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-9">
                            {userAccounts.map((acc) => (
                              <span
                                key={acc.id}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700"
                              >
                                {acc.accountNumber}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 pl-3">
                          <span className="text-xs text-slate-400 block">Balance</span>
                          <span className="text-sm font-bold text-black">
                            {totalBal.toLocaleString('en-US', { minimumFractionDigits: 0 })} PKR
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Step 1 — Your Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tariq@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+923001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Step 2 — Account Setup
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono uppercase placeholder:text-slate-400 focus:outline-none focus:border-black transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                      Opening Balance (PKR) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Select Your Region *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setShard(opt.value)}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          shard === opt.value
                            ? 'border-black bg-slate-50 text-black font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono">{opt.label}</span>
                          {shard === opt.value && <Check className="w-3.5 h-3.5 text-black" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-black text-white hover:bg-slate-800 font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? 'Creating your account...' : 'Create Account & Get Started'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
