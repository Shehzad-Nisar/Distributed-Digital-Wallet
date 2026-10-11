import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, X, Check, Phone } from 'lucide-react';
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

const REGION_OPTIONS: { value: ShardType; label: string; flag: string }[] = [
  { value: 'SHARD_3_SOUTH', label: 'Pakistan (Karachi & Sindh)', flag: '🇵🇰' },
  { value: 'SHARD_2_CENTRAL', label: 'Pakistan (Lahore & Punjab)', flag: '🇵🇰' },
  { value: 'SHARD_1_NORTH', label: 'Pakistan (Islamabad & North)', flag: '🇵🇰' },
  { value: 'SHARD_1_US', label: 'United States & Americas', flag: '🇺🇸' },
  { value: 'SHARD_2_UK', label: 'United Kingdom & Europe', flag: '🇬🇧' },
  { value: 'SHARD_4_UAE', label: 'UAE & Middle East', flag: '🇦🇪' },
];

const DEMO_ACCOUNTS = [
  { name: 'Alice Khan', email: 'alice@transmoney.com', city: 'Karachi', flag: '🇵🇰' },
  { name: 'Bob Malik', email: 'bob@transmoney.com', city: 'Lahore', flag: '🇵🇰' },
  { name: 'Charlie Tariq', email: 'charlie@transmoney.com', city: 'Islamabad', flag: '🇵🇰' },
  { name: 'Daraz Merchant', email: 'daraz@merchants.transmoney.com', city: 'Business Account', flag: '🏢' },
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
  const [shard, setShard] = useState<ShardType>('SHARD_3_SOUTH');
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
        'Unable to log in. Please check your email and password.';
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
        initialBalance: 5000,
        currency,
      });

      const primaryAccount = authRes.accounts && authRes.accounts.length > 0
        ? authRes.accounts[0]
        : {
            id: 0,
            accountNumber: 'ACC-NEW',
            balance: 5000,
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
        'Could not create account. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
      <div className="bg-[#FFFFFF] border border-[#F0EAE1] rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden text-[#1A1D20] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[#F7F3EE]">
          <div className="flex items-center gap-3">
            {/* Dual-Tone SadaPay Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F4] flex items-center justify-center relative shadow-xs">
              <span className="w-4 h-4 rounded-full bg-[#00A389] absolute top-1 left-1 opacity-90" />
              <span className="w-4 h-4 rounded-full bg-[#FF6651] absolute bottom-1 right-1 opacity-90" />
              <div className="relative z-10 w-4 h-4 rounded-sm bg-white/40 flex items-center justify-center text-[10px] font-black text-black">
                T
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1A1D20] tracking-tight">
                TransMoney
              </h3>
              <p className="text-xs text-[#5F6773]">
                Simple, effortless digital money
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF7F4] hover:bg-[#F2ECE5] text-[#5F6773] hover:text-[#1A1D20] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pill Tab Switch */}
        <div className="px-6 pt-4">
          <div className="p-1 bg-[#FAF7F4] rounded-full flex gap-1">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                tab === 'signin'
                  ? 'bg-white text-[#1A1D20] shadow-xs'
                  : 'text-[#5F6773] hover:text-[#1A1D20]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                tab === 'signup'
                  ? 'bg-white text-[#1A1D20] shadow-xs'
                  : 'text-[#5F6773] hover:text-[#1A1D20]'
              }`}
            >
              Open Account
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#FFEAE5] text-xs text-[#FF6651] font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[#1A1D20] block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1A1D20] block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF6651]/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Logging in...</span>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </form>

              {/* Quick Sample Accounts (Clean, zero tech jargon) */}
              <div className="pt-3 border-t border-[#F2ECE5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#5F6773]">
                    Quick Test Sign In
                  </span>
                  <span className="text-[10px] text-[#8C939E]">1-Click select</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => handleQuickDemoFill(d.email)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        signInEmail === d.email
                          ? 'border-[#00A389] bg-[#E8F8F5]'
                          : 'border-[#EFE7DE] bg-[#FAF7F4] hover:bg-[#F2ECE5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{d.flag}</span>
                        <span className="font-bold text-xs text-[#1A1D20] truncate">{d.name}</span>
                      </div>
                      <span className="text-[10px] text-[#5F6773] block truncate mt-0.5">{d.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="tariq@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Account Location
                </label>
                <select
                  value={shard}
                  onChange={(e) => setShard(e.target.value as ShardType)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                >
                  {REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.flag} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                >
                  <option value="PKR">PKR (Pakistani Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="AED">AED (Emirati Dirham)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF6651]/25 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Opening account...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Open My Free Account</span>
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
