import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  X,
  Check,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
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

const WALLET_CHOICES: {
  currency: 'PKR' | 'USD' | 'GBP' | 'EUR';
  label: string;
  sub: string;
  flag: string;
  shard: ShardType;
  symbol: string;
}[] = [
  {
    currency: 'PKR',
    label: 'Pakistani Rupee',
    sub: 'Raast & SBP Instant Clearing • South Hub',
    flag: '🇵🇰',
    shard: 'SHARD_3_SOUTH',
    symbol: '₨',
  },
  {
    currency: 'USD',
    label: 'US Dollar',
    sub: 'Global Fedwire & ACH • New York Hub',
    flag: '🇺🇸',
    shard: 'SHARD_1_US',
    symbol: '$',
  },
  {
    currency: 'GBP',
    label: 'British Pound',
    sub: 'UK Faster Payments • London Hub',
    flag: '🇬🇧',
    shard: 'SHARD_2_UK',
    symbol: '£',
  },
  {
    currency: 'EUR',
    label: 'Euro SEPA',
    sub: 'Instant Euro Settlement • Frankfurt Hub',
    flag: '🇪🇺',
    shard: 'SHARD_2_UK',
    symbol: '€',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onUserCreated,
  initialMode = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialMode);
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4>(1);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState(() => currentUser?.email || '');
  const [signInPassword, setSignInPassword] = useState('');

  // Multi-step Registration state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [otpCode, setOtpCode] = useState('8492');
  const [selectedCurrency, setSelectedCurrency] = useState<'PKR' | 'USD' | 'GBP' | 'EUR'>('PKR');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Post-registration result for Step 4
  const [createdResult, setCreatedResult] = useState<{ user: User; account: Account } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialMode);
      setSignupStep(1);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode]);

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

  // Step 1 validation -> Next
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setSignupStep(2);
  };

  // Step 2 validation -> Next
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phoneRaw.trim() || phoneRaw.replace(/[^0-9]/g, '').length < 7) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    setSignupStep(3);
  };

  // Step 3 submission -> Backend Registration -> Step 4 Reveal
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const choice = WALLET_CHOICES.find((w) => w.currency === selectedCurrency) || WALLET_CHOICES[0];
      const fullPhone = `${countryCode} ${phoneRaw.trim()}`;

      const authRes = await register({
        fullName: fullName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
        phoneNumber: fullPhone,
        shard: choice.shard,
        initialBalance: 0,
        currency: choice.currency,
      });

      const primaryAccount =
        authRes.accounts && authRes.accounts.length > 0
          ? authRes.accounts[0]
          : {
              id: 0,
              accountNumber: `ACC-${choice.currency}-001`,
              balance: 0,
              currency: choice.currency,
              shard: choice.shard,
              status: 'ACTIVE',
              version: 0,
              user: authRes.user,
            };

      setCreatedResult({ user: authRes.user, account: primaryAccount });
      setSignupStep(4);
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

  const handleFinishOnboarding = () => {
    if (createdResult) {
      onUserCreated(createdResult.user, createdResult.account);
    }
    onClose();
  };

  const handleTabChange = (nextTab: 'signin' | 'signup') => {
    setTab(nextTab);
    setErrorMsg(null);
    if (nextTab === 'signup' && signupStep === 4) {
      setSignupStep(1);
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
                {tab === 'signin' ? 'Welcome back to your wallet' : 'Open your free account in 3 quick steps'}
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
              onClick={() => handleTabChange('signin')}
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
              onClick={() => handleTabChange('signup')}
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

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#FFEAE5] text-xs text-[#FF6651] font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ==============================================================
              TAB 1: LOG IN
             ============================================================== */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
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
                {loading ? <span>Logging in...</span> : <span>Log In</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className="text-xs font-semibold text-[#00A389] hover:underline cursor-pointer"
                >
                  Don't have an account yet? Create one free →
                </button>
              </div>
            </form>
          )}

          {/* ==============================================================
              TAB 2: OPEN ACCOUNT (MULTI-STEP FLOW)
             ============================================================== */}
          {tab === 'signup' && (
            <div className="space-y-4">
              
              {/* Stepper Progress Indicator */}
              {signupStep < 4 && (
                <div className="pb-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-extrabold text-[#1A1D20]">
                      Step {signupStep} of 3
                    </span>
                    <span className="text-[10px] font-bold text-[#00A389]">
                      {signupStep === 1 && 'Personal Info'}
                      {signupStep === 2 && 'Mobile Verification'}
                      {signupStep === 3 && 'Wallet Currency'}
                    </span>
                  </div>

                  {/* 3 Step Bar */}
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div className={`rounded-full transition-all duration-300 ${signupStep >= 1 ? 'bg-[#FF6651]' : 'bg-[#EFE7DE]'}`} />
                    <div className={`rounded-full transition-all duration-300 ${signupStep >= 2 ? 'bg-[#FF6651]' : 'bg-[#EFE7DE]'}`} />
                    <div className={`rounded-full transition-all duration-300 ${signupStep >= 3 ? 'bg-[#FF6651]' : 'bg-[#EFE7DE]'}`} />
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------
                  STEP 1: Full Name & Email
                 -------------------------------------------------------- */}
              {signupStep === 1 && (
                <form onSubmit={handleStep1Next} className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#1A1D20]">
                      What's your legal name?
                    </h4>
                    <p className="text-xs text-[#5F6773]">
                      Enter your legal name as it appears on your CNIC or Passport.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Muhammad Ashraf"
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
                        placeholder="yourname@gmail.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF6651]/25 transition cursor-pointer"
                  >
                    <span>Continue to Mobile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* --------------------------------------------------------
                  STEP 2: Mobile Number & Instant OTP Verification
                 -------------------------------------------------------- */}
              {signupStep === 2 && (
                <form onSubmit={handleStep2Next} className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#1A1D20]">
                      Link your mobile number
                    </h4>
                    <p className="text-xs text-[#5F6773]">
                      Used for instant Raast settlements and two-factor transaction approvals.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs font-bold focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                      >
                        <option value="+92">🇵🇰 +92</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          autoFocus
                          placeholder="300 1234567"
                          value={phoneRaw}
                          onChange={(e) => setPhoneRaw(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs font-mono placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulated Instant OTP Gateway Verification */}
                  <div className="p-3 bg-[#FAF7F4] rounded-2xl border border-[#EBE4DC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1A1D20] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#00A389]" />
                        <span>SMS Verification Code</span>
                      </span>
                      <span className="text-[10px] text-[#00A389] font-bold bg-[#E5F7F3] px-2 py-0.5 rounded-full">
                        Auto-Sent
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="8492"
                        className="w-28 text-center tracking-widest font-mono font-black text-sm py-2 rounded-xl bg-white border border-[#E0D8CE] text-[#1A1D20] focus:outline-none focus:border-[#00A389]"
                      />
                      <span className="text-[11px] text-[#5F6773]">
                        Enter 4-digit code to verify your SIM ownership.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="px-4 py-3.5 rounded-full border border-[#EBE4DC] text-[#1A1D20] font-bold text-xs hover:bg-[#FAF7F4] transition cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 px-4 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF6651]/25 transition cursor-pointer"
                    >
                      <span>Verify &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* --------------------------------------------------------
                  STEP 3: Choose Primary Wallet Currency & Set Password
                 -------------------------------------------------------- */}
              {signupStep === 3 && (
                <form onSubmit={handleStep3Submit} className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#1A1D20]">
                      Choose your primary wallet
                    </h4>
                    <p className="text-xs text-[#5F6773]">
                      Zero monthly fees. You can add more currencies anytime inside the app.
                    </p>
                  </div>

                  {/* Interactive Currency Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {WALLET_CHOICES.map((choice) => {
                      const isSelected = selectedCurrency === choice.currency;
                      return (
                        <div
                          key={choice.currency}
                          onClick={() => setSelectedCurrency(choice.currency)}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-[#00A389] bg-[#E8F8F5] ring-1 ring-[#00A389]'
                              : 'border-[#EFE7DE] bg-[#FAF7F4] hover:bg-[#F2ECE5]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{choice.flag}</span>
                            <span className="text-xs font-mono font-black text-[#1A1D20]">
                              {choice.currency}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#1A1D20] block mt-1.5 leading-tight">
                            {choice.label}
                          </span>
                          <span className="text-[10px] text-[#5F6773] block mt-0.5 leading-tight">
                            {choice.sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1A1D20] block mb-1">
                      Create Secure Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8C939E] absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE4DC] text-[#1A1D20] text-xs placeholder:text-[#8C939E] focus:outline-none focus:border-[#00A389] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      className="px-4 py-3.5 rounded-full border border-[#EBE4DC] text-[#1A1D20] font-bold text-xs hover:bg-[#FAF7F4] transition cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 px-4 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF6651]/25 transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <span>Provisioning Wallet...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Open My Free Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* --------------------------------------------------------
                  STEP 4: Instant Provisioning & Virtual Card Reveal
                 -------------------------------------------------------- */}
              {signupStep === 4 && (
                <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-[#E5F7F3] text-[#00A389] flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-[#1A1D20]">
                      Account Created Successfully!
                    </h4>
                    <p className="text-xs text-[#5F6773]">
                      Your identity is verified and your multi-currency wallet is ready.
                    </p>
                  </div>

                  {/* Virtual Debit Card Preview */}
                  <div className="w-64 h-36 rounded-2xl bg-gradient-to-br from-[#00A389] via-[#008f78] to-[#006e5c] text-white p-3.5 mx-auto shadow-xl flex flex-col justify-between text-left select-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black tracking-wider uppercase font-mono">
                        TransMoney
                      </span>
                      <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-sm">
                        DEBIT
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-5 rounded-sm bg-gradient-to-tr from-amber-300 to-amber-500 border border-amber-200" />
                      <span className="text-[10px] font-mono tracking-widest text-white/80">
                        •••• 0001
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[8px] uppercase tracking-wider text-white/70">
                          CARDHOLDER
                        </div>
                        <div className="text-xs font-bold tracking-wide truncate max-w-[140px]">
                          {fullName.toUpperCase() || 'VALUED MEMBER'}
                        </div>
                      </div>
                      <div className="flex -space-x-1.5 opacity-90">
                        <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                        <div className="w-5 h-5 rounded-full bg-[#F79E1B]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F4] rounded-2xl border border-[#EBE4DC] text-xs space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6773]">Primary Account:</span>
                      <span className="font-mono font-bold text-[#1A1D20]">
                        {createdResult?.account.accountNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6773]">Base Currency:</span>
                      <span className="font-bold text-[#00A389]">
                        {createdResult?.account.currency} (Zero Opening Fee)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6773]">Clearing Rail:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Direct Consensus Active</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinishOnboarding}
                    className="w-full py-3.5 px-4 rounded-full bg-[#00A389] hover:bg-[#008c75] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00A389]/25 transition cursor-pointer"
                  >
                    <span>Launch My Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
