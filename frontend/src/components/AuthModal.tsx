import React, { useState } from 'react';
import { Check, KeyRound, Lock, LogIn, Mail, ShieldCheck, X, Zap } from 'lucide-react';
import { login, register } from '../api/client';
import type { Account, ShardType, User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: User[];
  accounts?: Account[];
  currentUser?: User | null;
  onSelectUser: (user: User) => void;
  onUserCreated: (newUser: User, newAccount: Account) => void;
  initialMode?: 'signin' | 'signup';
}

const REGION_OPTIONS: { value: ShardType; label: string; desc: string; flag: string }[] = [
  { value: 'SHARD_1_US', label: 'United States', desc: 'AWS us-east-1 (New York)', flag: '🇺🇸' },
  { value: 'SHARD_2_UK', label: 'United Kingdom', desc: 'AWS eu-west-2 (London)', flag: '🇬🇧' },
  { value: 'SHARD_3_SG', label: 'Singapore', desc: 'AWS ap-southeast-1 (SG Hub)', flag: '🇸🇬' },
  { value: 'SHARD_4_UAE', label: 'United Arab Emirates', desc: 'AWS me-central-1 (Dubai)', flag: '🇦🇪' },
  { value: 'SHARD_1_NORTH', label: 'North Region', desc: 'Islamabad / KPK', flag: '🇵🇰' },
  { value: 'SHARD_2_CENTRAL', label: 'Central Region', desc: 'Lahore / Punjab', flag: '🇵🇰' },
  { value: 'SHARD_3_SOUTH', label: 'South Region', desc: 'Karachi / Sindh', flag: '🇵🇰' },
  { value: 'SHARD_4_ENTERPRISE', label: 'Enterprise Hub', desc: 'Merchant & Corporate', flag: '🏢' },
];

const DEMO_ACCOUNTS = [
  { name: 'Alice Khan', email: 'alice@transmoney.com', role: 'Personal Banking', shard: 'SHARD_3_SOUTH', flag: '🇵🇰' },
  { name: 'Bob Malik', email: 'bob@transmoney.com', role: 'Cross-Border User', shard: 'SHARD_2_CENTRAL', flag: '🇵🇰' },
  { name: 'Charlie Tariq', email: 'charlie@transmoney.com', role: 'Global Remittance', shard: 'SHARD_1_NORTH', flag: '🇵🇰' },
  { name: 'Daraz Merchant', email: 'daraz@merchants.transmoney.com', role: 'Enterprise Merchant', shard: 'SHARD_4_ENTERPRISE', flag: '🏢' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  onUserCreated,
  initialMode = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialMode);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('alice@transmoney.com');
  const [signInPassword, setSignInPassword] = useState('password123');

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState('5000');
  const [shard, setShard] = useState<ShardType>('SHARD_1_US');
  const [currency, setCurrency] = useState('PKR');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const authRes = await login({
        email: signInEmail.trim().toLowerCase(),
        password: signInPassword,
      });

      onSelectUser(authRes.user);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (email: string) => {
    setSignInEmail(email);
    setSignInPassword('password123');
    setErrorMsg(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const authRes = await register({
        fullName: fullName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
        phoneNumber: phoneNumber.trim() || undefined,
        shard,
        initialBalance: Number(initialBalance) || 0,
        currency,
      });

      const primaryAccount = authRes.accounts && authRes.accounts.length > 0
        ? authRes.accounts[0]
        : {
            id: 0,
            accountNumber: 'ACC-NEW',
            balance: Number(initialBalance) || 0,
            currency,
            shard,
            status: 'ACTIVE',
            version: 0,
            user: authRes.user,
          };

      onUserCreated(authRes.user, primaryAccount);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not complete registration. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-black animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono shadow-xs">
              TM
            </div>
            <div>
              <h3 className="text-base font-bold text-black uppercase tracking-tight flex items-center gap-2">
                TransMoney Identity
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium lowercase">
                  v2.0-jwt
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Distributed Relational Shard Authentication</p>
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
              setTab('signin');
              setErrorMsg(null);
            }}
            className={`py-3 text-center transition cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'signin'
                ? 'border-b-2 border-emerald-600 text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Secure Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`py-3 text-center transition cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'signup'
                ? 'border-b-2 border-emerald-600 text-black font-bold bg-white'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Open Shard Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-xs text-rose-800 font-mono flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️ Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="user@transmoney.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      Sign In with BCrypt & JWT
                    </>
                  )}
                </button>
              </form>

              {/* Demo Profiles Quick Selector */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase text-slate-500 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Evaluator Demo Profiles (1-Click Fill)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Password: password123</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => handleQuickDemoFill(d.email)}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        signInEmail === d.email
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{d.flag}</span>
                        <span className="font-semibold text-xs text-black truncate">{d.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate font-mono">{d.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
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
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+923001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  Assigned Geographic Shard Partition *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REGION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setShard(opt.value)}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        shard === opt.value
                          ? 'border-emerald-600 bg-emerald-50 text-black font-semibold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{opt.flag}</span>
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono truncate">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Initial Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                    Account Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-emerald-600 transition"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="AED">AED (Emirati Dirham)</option>
                    <option value="SGD">SGD (Singapore Dollar)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Provisioning Account & Generating JWT...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Account & Issue Bearer Token
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
