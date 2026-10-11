import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  MessageCircle,
  Play,
  QrCode,
  Shield,
  Star,
  Check,
  Building2,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import type { Account, SystemHealth, User } from '../types';

interface LandingPageProps {
  health?: SystemHealth | null;
  accounts?: Account[];
  users?: User[];
  currentUser?: User | null;
  onEnterConsole?: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onNavigateTab?: (tab: 'console' | 'transfer' | 'ledger' | 'architecture' | 'exchange' | 'merchant') => void;
  onSelectAccount?: (id: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  health,
  accounts = [],
  users = [],
  currentUser,
  onEnterConsole,
  onOpenAuth,
  onNavigateTab,
  onSelectAccount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeNumberTab, setActiveNumberTab] = useState<'pakistan' | 'international'>('pakistan');
  const [cardFrozen, setCardFrozen] = useState<boolean>(false);
  const [activeCurrency, setActiveCurrency] = useState<'PKR' | 'USD' | 'EUR' | 'GBP'>('PKR');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Clean raw database hashes
  const cleanUserName = (name: string | undefined) => {
    if (!name) return 'Valued Member';
    return name.replace(/\s+[a-f0-9]{8}$/i, '').trim();
  };

  const activeUserAccount =
    accounts.find((a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id) ||
    accounts[0];

  const formatMoney = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const heroBalance = activeUserAccount ? formatMoney(activeUserAccount.balance) : '15,000.00';
  const heroCurrency = activeUserAccount?.currency || 'PKR';
  const heroCardholder = cleanUserName(currentUser?.fullName || activeUserAccount?.user?.fullName);

  const handleQuickNav = (tab: 'console' | 'transfer' | 'merchant' | 'exchange') => {
    if (activeUserAccount && onSelectAccount) {
      onSelectAccount(activeUserAccount.id);
    }
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onEnterConsole) {
      onEnterConsole();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#1E2024] font-sans antialiased selection:bg-[#FF6651] selection:text-white relative overflow-x-hidden">
      
      {/* =========================================================================
          1. TOP SECURITY ALERT BANNER (Exact SadaPay Phishing Warning Bar)
         ========================================================================= */}
      <div className="bg-[#FF6651] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span>
            {health?.database ? '🟢 Live Banking Rail Active' : 'Official TransMoney Portal'}. Beware of phishing websites. Only trust{' '}
            <span className="font-bold underline decoration-white/60">transmoney.pk</span>. We will never ask for your sensitive credentials.
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. NAVIGATION BAR (Exact SadaPay Layout: Logo, Links & "Download now")
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF7F4]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left: Brand Identity with SadaPay's Dual-Tone Teal & Coral Icon */}
          <a href="#top" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F4] flex items-center justify-center relative">
              {/* Dual-tone geometric mark matching SadaPay emblem */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-[#00A389] absolute top-1 left-1 opacity-90 group-hover:scale-105 transition-transform" />
                <span className="w-4 h-4 rounded-full bg-[#FF6651] absolute bottom-1 right-1 opacity-90 group-hover:scale-105 transition-transform" />
                <div className="relative z-10 w-4 h-4 rounded-sm bg-white/40 backdrop-blur-xs flex items-center justify-center text-[10px] font-black text-black">
                  T
                </div>
              </div>
            </div>
            <span className="font-black text-2xl tracking-tight text-[#1A1D20]">
              TransMoney
            </span>
          </a>

          {/* Center: SadaPay Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#4B5563]">
            <a
              href="#top"
              className="text-[#1A1D20] font-bold relative py-1 hover:text-[#FF6651] transition"
            >
              Personal
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00A389] rounded-full" />
            </a>
            {onEnterConsole && (
              <button
                type="button"
                onClick={onEnterConsole}
                className="hover:text-[#1A1D20] transition font-bold text-[#00A389] cursor-pointer"
              >
                Dashboard
              </button>
            )}
            <a
              href="#international"
              className="hover:text-[#1A1D20] transition"
            >
              Remittance
            </a>
            <a
              href="#features"
              className="hover:text-[#1A1D20] transition"
            >
              Features
            </a>
            <a
              href="#reviews"
              className="hover:text-[#1A1D20] transition"
            >
              Reviews
            </a>
            <a
              href="#regulation"
              className="hover:text-[#1A1D20] transition"
            >
              Security
            </a>
          </nav>

          {/* Right: Dynamic User Status + Action Buttons */}
          <div className="flex items-center gap-3">
            {currentUser && onEnterConsole ? (
              <button
                onClick={onEnterConsole}
                className="bg-[#00A389] hover:bg-[#008c75] active:scale-95 text-white text-xs sm:text-[14px] font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md shadow-[#00A389]/25 transition cursor-pointer flex items-center gap-2"
              >
                <span>{cleanUserName(currentUser.fullName)}</span>
                <span className="opacity-75 text-xs font-mono">→ Wallet</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('signup')}
                className="bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white text-xs sm:text-[15px] font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-md shadow-[#FF6651]/25 transition cursor-pointer"
              >
                Download now
              </button>
            )}

            {onEnterConsole && !currentUser && (
              <button
                onClick={onEnterConsole}
                className="hidden sm:flex text-xs font-bold px-3.5 py-2 rounded-full border border-[#E6DDD3] text-[#1A1D20] hover:bg-[#F2ECE5] transition cursor-pointer"
              >
                Open Dashboard
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-2xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#1A1D20] hover:bg-[#FAF7F4] transition cursor-pointer shadow-xs"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#FF6651]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#EFE7DE] bg-[#FAF7F4] px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3 text-base font-semibold text-[#1A1D20]">
              <a
                href="#top"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#00A389] font-bold"
              >
                Personal
              </a>
              <a
                href="#international"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#FF6651]"
              >
                Remittance
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#FF6651]"
              >
                Blog
              </a>
              <a
                href="#reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#FF6651]"
              >
                Careers
              </a>
              <a
                href="#regulation"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#FF6651]"
              >
                Help Center
              </a>
            </div>
            <div className="pt-3 border-t border-[#EFE7DE]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="w-full bg-[#FF6651] text-white font-bold py-3 rounded-full text-sm shadow-md cursor-pointer"
              >
                Open Account Online
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION ("Break Free From Banking Hassles")
         ========================================================================= */}
      <section id="top" className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        {/* Soft atmospheric ambient glow orbs */}
        <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-[#FFEAE5]/60 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-32 right-10 w-[480px] h-[480px] bg-[#E1F7F1]/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading, Subtitle & Primary CTA */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F7F3] border border-[#00A389]/25 text-[#00A389] text-xs font-bold tracking-wide">
                <span>✨ Simple, fee-free digital banking</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1A1D20] tracking-tight leading-[1.08]">
                Break Free From <br />
                <span className="text-[#1A1D20]">Banking Hassles</span>
              </h1>

              <p className="text-base sm:text-lg text-[#5F6773] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Join {users.length > 0 ? `${users.length} active registered member accounts` : 'thousands of active members'} and get your free virtual card to shop online.
                Enjoy free money transfers, receive remittances, pay bills, and manage multi-currency balances with instant direct settlement.
              </p>

              {/* 5-Star Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <div className="flex items-center gap-1 text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#4B5563]">
                  Over <span className="font-extrabold text-[#1A1D20]">120,000+</span> 5-star reviews
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {onEnterConsole ? (
                  <button
                    onClick={onEnterConsole}
                    className="w-full sm:w-auto bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-base px-8 py-4 rounded-full shadow-lg shadow-[#FF6651]/30 transition cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>{currentUser ? 'Go to My Wallet' : 'Open Web App'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="w-full sm:w-auto bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-base px-8 py-4 rounded-full shadow-lg shadow-[#FF6651]/30 transition cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>Download now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <button
                  onClick={() => onOpenAuth('signin')}
                  className="w-full sm:w-auto bg-white hover:bg-[#F9F5F0] border border-[#E6DDD3] text-[#1A1D20] font-bold text-base px-6 py-4 rounded-full transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <QrCode className="w-5 h-5 text-[#FF6651]" />
                  <span>{currentUser ? 'Switch User' : 'Sign In / Register'}</span>
                </button>
              </div>

              {/* Trust checklist */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-3 text-xs font-semibold text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389]" />
                  <span>Zero account opening fees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389]" />
                  <span>Regulated by State Bank</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389]" />
                  <span>Mastercard Worldwide</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity 3D Mockup Stage */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[540px]">
              {/* Radial Backdrop Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full bg-gradient-to-tr from-[#00A389]/15 via-[#FF6651]/15 to-transparent blur-3xl pointer-events-none" />
              </div>

              {/* 3D Floating Ecosystem Badges */}
              {/* Spotify Icon */}
              <div className="absolute top-2 left-6 sm:left-12 z-20 animate-pulse bg-[#191414] text-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-white/20">
                <svg className="w-6 h-6 fill-[#1DB954]" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.792-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.721 1.113.294.18.387.563.207.857zm1.224-2.719c-.226.368-.707.483-1.075.257-2.69-1.654-6.79-2.133-9.972-1.167-.413.125-.85-.108-.975-.521-.125-.413.108-.85.521-.975 3.633-1.102 8.167-.568 11.244 1.33.368.227.483.708.257 1.076zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.018-.13-1.168-.624-.15-.494.13-1.018.624-1.168 3.532-1.072 9.404-.868 13.153 1.357.444.263.59.84.327 1.284-.264.444-.84.59-1.284.327z"/>
                </svg>
              </div>

              {/* Netflix Icon */}
              <div className="absolute bottom-12 left-4 sm:left-8 z-20 bg-black text-[#E50914] font-black text-xl px-3.5 py-2 rounded-2xl shadow-xl border border-white/20">
                N
              </div>

              {/* Foodpanda Icon */}
              <div className="absolute top-10 right-4 sm:right-10 z-20 bg-[#D70F64] text-white p-2.5 rounded-2xl shadow-xl border border-white/20">
                <span className="text-xs font-black tracking-tight">🐼 Panda</span>
              </div>

              {/* Amazon Icon */}
              <div className="absolute bottom-20 right-2 sm:right-8 z-20 bg-white text-[#FF9900] p-2.5 rounded-2xl shadow-xl border border-[#F0EAE1]">
                <span className="text-xs font-extrabold text-black">amazon</span>
              </div>

              {/* Central Smartphone Mockup (Tilted SadaPay Style) */}
              <div className="relative z-10 w-[245px] sm:w-[275px] h-[490px] sm:h-[540px] bg-gradient-to-b from-[#2B2D31] to-[#121316] rounded-[46px] p-2.5 shadow-2xl shadow-black/35 ring-1 ring-white/20 transform rotate-1 sm:rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
                  <div className="w-2 h-2 rounded-full bg-[#00A389]" />
                </div>

                {/* Inner Screen */}
                <div className="w-full h-full bg-[#FAF7F4] rounded-[38px] overflow-hidden flex flex-col pt-8 px-4 pb-4 select-none">
                  {/* App Header */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#00A389] text-white font-extrabold text-xs flex items-center justify-center">
                        T
                      </div>
                      <span className="text-xs font-bold text-[#1A1D20]">TransMoney</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Main Wallet Balance Card */}
                  <div className="mt-3 bg-white rounded-2xl p-3.5 shadow-xs border border-[#F0EAE1]">
                    <span className="text-[10px] uppercase font-bold text-[#8C939E] tracking-wider block">
                      Current Balance
                    </span>
                    <div className="text-xl font-black text-[#1A1D20] mt-0.5">
                      {heroCurrency === 'PKR' ? '₨' : heroCurrency === 'USD' ? '$' : heroCurrency === 'GBP' ? '£' : '€'} {heroBalance}
                    </div>
                    <div className="text-[10px] text-[#00A389] font-bold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{activeUserAccount?.accountNumber || 'Zero monthly fees'}</span>
                    </div>
                  </div>

                  {/* Quick Action Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleQuickNav('console')}
                      className="bg-[#E8F8F5] hover:bg-[#d5f3ec] p-2 rounded-xl text-center flex flex-col items-center transition cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#00A389] text-white flex items-center justify-center text-[10px] mb-1">
                        +
                      </div>
                      <span className="text-[9px] font-bold text-[#00A389]">Load</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickNav('transfer')}
                      className="bg-[#FFF0ED] hover:bg-[#fde2dc] p-2 rounded-xl text-center flex flex-col items-center transition cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FF6651] text-white flex items-center justify-center text-[10px] mb-1">
                        ↗
                      </div>
                      <span className="text-[9px] font-bold text-[#FF6651]">Send</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickNav('merchant')}
                      className="bg-white hover:bg-slate-50 p-2 rounded-xl text-center flex flex-col items-center border border-[#F0EAE1] transition cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1A1D20] text-white flex items-center justify-center text-[10px] mb-1">
                        ▦
                      </div>
                      <span className="text-[9px] font-bold text-[#1A1D20]">Pay</span>
                    </button>
                  </div>

                  {/* Recent Activity List */}
                  <div className="mt-3 flex-1 overflow-hidden space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8C939E] uppercase tracking-wider block">
                      Recent Activity
                    </span>
                    
                    <div className="bg-white p-2 rounded-xl flex items-center justify-between border border-[#F0EAE1]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#E50914] text-white text-[10px] font-bold flex items-center justify-center">
                          N
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-[#1A1D20] block leading-tight">Digital Service</span>
                          <span className="text-[8px] text-[#8C939E]">Subscription</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#1A1D20]">-₨ 1,100</span>
                    </div>

                    <div className="bg-white p-2 rounded-xl flex items-center justify-between border border-[#F0EAE1]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#00A389] text-white text-[10px] font-bold flex items-center justify-center">
                          $
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-[#1A1D20] block leading-tight">Direct Deposit</span>
                          <span className="text-[8px] text-[#00A389]">Received</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#00A389]">+₨ 25,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Iconic Floating Vertical TransMoney Debit Card (SadaPay Teal Mastercard) */}
              <div className="absolute -bottom-6 -right-2 sm:right-2 z-30 w-[170px] sm:w-[190px] h-[260px] sm:h-[295px] rounded-2xl bg-gradient-to-br from-[#00A389] via-[#00947C] to-[#006F5D] text-white p-4 shadow-2xl shadow-[#00A389]/40 transform rotate-6 hover:rotate-2 hover:scale-105 transition-all duration-300 flex flex-col justify-between border border-white/30 backdrop-blur-xs select-none">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase text-white/95">
                      TransMoney
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-sm">
                      DEBIT
                    </span>
                  </div>

                  {/* 3D Chip & Contactless */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="w-8 h-6 rounded-md bg-gradient-to-br from-[#F5D061] to-[#D4A325] border border-[#FFE885] shadow-xs flex items-center justify-center">
                      <div className="w-5 h-4 border border-black/20 rounded-xs" />
                    </div>
                    <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                      <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                      <path d="M15.5 21.5a12 12 0 0 0 0-21" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[9px] uppercase tracking-widest text-white/60 font-mono">
                    NUMBERLESS CARD
                  </div>
                  <div className="text-xs font-bold tracking-wide text-white drop-shadow-xs">
                    {heroCardholder.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-[8px] font-semibold text-white/70">
                    WORLD
                  </div>
                  <div className="flex items-center -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow-xs" />
                    <div className="w-6 h-6 rounded-full bg-[#F79E1B]/90 shadow-xs" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURE CAROUSEL / TRIO CARDS
         ========================================================================= */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D20] tracking-tight">
              Designed For The Modern World
            </h2>
            <p className="mt-3 text-base text-[#5F6773]">
              Every feature crafted with care to give you total control over your money without hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Free money transfers */}
            <div className="group bg-white/80 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] hover:border-[#FF6651]/40 transition-all hover:shadow-xl hover:shadow-[#FF6651]/5 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  Free money transfers
                </h3>
                <p className="mt-3 text-sm text-[#5F6773] leading-relaxed">
                  Send and receive money instantly to any bank account or mobile wallet across the nation with zero fees. Instant Raast settlement.
                </p>
              </div>

              {/* 3D Paper Airplane with Golden Coins */}
              <div className="mt-8 pt-6 relative h-52 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-radial from-[#FFEAE5]/70 to-transparent rounded-2xl" />
                
                <div className="relative z-10 transform -rotate-12 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                  <svg className="w-32 h-32 drop-shadow-2xl" viewBox="0 0 120 120" fill="none">
                    <polygon points="10,60 110,15 70,105 55,68" fill="#FF806E" />
                    <polygon points="55,68 110,15 70,105" fill="#FF6651" />
                    <polygon points="10,60 110,15 55,68" fill="#FFA596" />
                    <polygon points="55,68 70,105 60,78" fill="#E54D34" />
                  </svg>
                </div>

                <div className="absolute top-4 left-6 z-20 w-8 h-8 rounded-full bg-gradient-to-tr from-[#E6B800] to-[#FFE680] shadow-md flex items-center justify-center font-bold text-xs text-[#8A6D00] border border-white">
                  ₨
                </div>
                <div className="absolute bottom-6 right-8 z-20 w-10 h-10 rounded-full bg-gradient-to-tr from-[#E6B800] to-[#FFE680] shadow-md flex items-center justify-center font-bold text-sm text-[#8A6D00] border border-white">
                  ₨
                </div>
              </div>
            </div>

            {/* Card 2: Cards with global acceptance */}
            <div className="group bg-white/80 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] hover:border-[#00A389]/40 transition-all hover:shadow-xl hover:shadow-[#00A389]/5 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  Cards with global acceptance
                </h3>
                <p className="mt-3 text-sm text-[#5F6773] leading-relaxed">
                  Your physical and virtual Mastercard works internationally with the interbank exchange rate and zero markup fees on foreign transactions.
                </p>
              </div>

              {/* 3D Vertical Card + Precision Scale */}
              <div className="mt-8 pt-6 relative h-52 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-[#DCF4EE]/70 to-transparent rounded-2xl" />

                <div className="absolute left-8 top-6 bottom-6 w-8 bg-white/80 rounded-lg border border-[#00A389]/20 flex flex-col justify-between py-2 px-1 text-[8px] font-mono text-[#00A389]">
                  <span>— 0</span>
                  <span>— 2</span>
                  <span>— 4</span>
                  <span>— 6</span>
                  <span>— 8cm</span>
                </div>

                <div className="relative z-10 w-24 h-36 rounded-xl bg-gradient-to-br from-[#00A389] to-[#00705E] p-2.5 text-white shadow-xl flex flex-col justify-between transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] font-bold">TM</span>
                    <div className="w-3 h-2 rounded-xs bg-[#F5D061]" />
                  </div>
                  <div className="text-[7px] font-mono tracking-widest text-white/70">
                    NUMBERLESS
                  </div>
                  <div className="flex justify-end">
                    <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pay your bills */}
            <div className="group bg-white/80 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] hover:border-[#FF6651]/40 transition-all hover:shadow-xl hover:shadow-[#FF6651]/5 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  Pay your bills
                </h3>
                <p className="mt-3 text-sm text-[#5F6773] leading-relaxed">
                  Clear electricity, gas, water, internet, and government dues in under 5 seconds. Get instant digital receipts and bill split reminders.
                </p>
              </div>

              {/* 3D Receipt Printer Roll & Golden Tokens */}
              <div className="mt-8 pt-6 relative h-52 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-[#FFEAE5]/70 to-transparent rounded-2xl" />

                <div className="relative z-10 w-36 bg-white rounded-xl shadow-xl p-3 border border-[#F0EAE1] transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500">K-ELECTRIC</span>
                    <span className="text-[9px] font-extrabold text-[#00A389]">PAID ✓</span>
                  </div>
                  <div className="py-2 text-center">
                    <div className="text-xs font-black text-[#1A1D20]">₨ 14,850.00</div>
                    <div className="text-[8px] text-gray-400">Ref: 04000129841</div>
                  </div>
                  <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-[8px] text-gray-500 font-mono">
                    <span>FEE: ₨ 0</span>
                    <span>100% FREE</span>
                  </div>
                </div>

                <div className="absolute -bottom-1 left-12 z-20 w-8 h-8 rounded-full bg-gradient-to-tr from-[#E6B800] to-[#FFE680] shadow-md flex items-center justify-center font-bold text-xs text-[#8A6D00] border border-white">
                  ₨
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "SIGN UP FROM ANYWHERE" (Pakistan +92 & Overseas Support)
         ========================================================================= */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D20] tracking-tight">
              Sign up from anywhere
            </h2>
            <p className="mt-3 text-base text-[#5F6773]">
              Whether you are relaxing in Pakistan or living across London, New York, or Dubai — open an account in minutes.
            </p>

            {/* Interactive Toggle Pill */}
            <div className="inline-flex p-1.5 bg-[#EAE3D9] rounded-full mt-6">
              <button
                onClick={() => setActiveNumberTab('pakistan')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeNumberTab === 'pakistan'
                    ? 'bg-white text-[#1A1D20] shadow-xs'
                    : 'text-[#5F6773] hover:text-[#1A1D20]'
                }`}
              >
                🇵🇰 From Pakistan
              </button>
              <button
                onClick={() => setActiveNumberTab('international')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeNumberTab === 'international'
                    ? 'bg-white text-[#1A1D20] shadow-xs'
                    : 'text-[#5F6773] hover:text-[#1A1D20]'
                }`}
              >
                🌍 From Overseas &amp; Global
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Card A: From Pakistan */}
            <div className={`bg-white/90 backdrop-blur-xs rounded-[32px] p-8 border transition-all duration-300 flex flex-col justify-between ${
              activeNumberTab === 'pakistan'
                ? 'border-[#FF6651] shadow-xl shadow-[#FF6651]/10 ring-2 ring-[#FF6651]/20'
                : 'border-[#EFE7DE]'
            }`}>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE5] text-[#FF6651] text-xs font-bold mb-4">
                  <span>🇵🇰 Local Registration</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  From Pakistan
                </h3>
                <p className="mt-2 text-sm text-[#5F6773] leading-relaxed">
                  All you need is your valid CNIC and any Pakistani telecom number (Jazz, Zong, Telenor, Ufone). Verified in under 2 minutes with NADRA.
                </p>
              </div>

              {/* 3D Extruded +92 Phone Code Sculpture */}
              <div className="mt-8 pt-4 relative h-48 bg-[#FFF8F5] rounded-2xl border border-[#F4EBE3] flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="px-6 py-4 bg-gradient-to-r from-[#FF6651] to-[#E54D34] rounded-2xl text-white font-mono font-black text-3xl shadow-xl shadow-[#FF6651]/30 tracking-tight transform -rotate-2">
                    +92 - 3...
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 transform rotate-6">
                    <MessageCircle className="w-7 h-7 fill-current" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: From Overseas & Global */}
            <div className={`bg-white/90 backdrop-blur-xs rounded-[32px] p-8 border transition-all duration-300 flex flex-col justify-between ${
              activeNumberTab === 'international'
                ? 'border-[#00A389] shadow-xl shadow-[#00A389]/10 ring-2 ring-[#00A389]/20'
                : 'border-[#EFE7DE]'
            }`}>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F7F3] text-[#00A389] text-xs font-bold mb-4">
                  <span>🌍 Overseas Expats &amp; Nomads</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  From Overseas
                </h3>
                <p className="mt-2 text-sm text-[#5F6773] leading-relaxed">
                  Sign up with international mobile numbers (+1, +44, +971, +966) using your NICOP or foreign passport. Zero branch visits required.
                </p>
              </div>

              {/* 3D Globe with Flight Badges */}
              <div className="mt-8 pt-4 relative h-48 bg-[#F0FAF7] rounded-2xl border border-[#DEF1EB] flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#00A389] to-[#20D2B4] shadow-xl flex items-center justify-center text-white">
                    <Globe className="w-14 h-14 opacity-90" />
                    <div className="absolute inset-0 rounded-full border-2 border-white/40" />
                  </div>

                  <div className="space-y-1.5 font-mono text-xs font-bold">
                    <div className="px-3 py-1 rounded-lg bg-white shadow-xs border border-[#DEF1EB] text-[#1A1D20] flex items-center gap-2">
                      <span>🇬🇧 +44</span>
                      <span className="text-[10px] text-gray-400">UK</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-white shadow-xs border border-[#DEF1EB] text-[#1A1D20] flex items-center gap-2">
                      <span>🇺🇸 +1</span>
                      <span className="text-[10px] text-gray-400">USA</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-white shadow-xs border border-[#DEF1EB] text-[#1A1D20] flex items-center gap-2">
                      <span>🇦🇪 +971</span>
                      <span className="text-[10px] text-gray-400">UAE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. "YOUR MONEY STAYS SAFE" (Bento Security Grid)
         ========================================================================= */}
      <section id="security" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D20] tracking-tight">
              Your money stays safe
            </h2>
            <p className="mt-3 text-base text-[#5F6773]">
              State-of-the-art encryption, biometric protection, and instant card toggles engineered into every tap.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bento Block 1: Biometric Authentication (Left Tall Card) */}
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEAE5] text-[#FF6651] flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">
                  Biometric authentication
                </h3>
                <p className="mt-3 text-sm text-[#5F6773] leading-relaxed">
                  Only your FaceID or fingerprint can approve transfers and unlock your cards. Advanced hardware enclave security keeps imposters out.
                </p>
              </div>

              {/* 3D Coral Biometric Shield with Fingerprint Sensor */}
              <div className="mt-10 relative h-60 flex items-center justify-center">
                <div className="w-36 h-44 rounded-3xl bg-gradient-to-b from-[#FF6651] to-[#E54D34] shadow-2xl shadow-[#FF6651]/30 flex flex-col items-center justify-center text-white relative">
                  <svg className="w-16 h-16 text-white/90 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                    <path d="M12 2a10 10 0 0 0-7.07 17.07" />
                    <path d="M12 6a6 6 0 0 0-4.24 10.24" />
                    <path d="M16.24 7.76A6 6 0 0 1 18 12c0 2.22-.9 4.23-2.36 5.67" />
                    <path d="M19.07 4.93A10 10 0 0 1 22 12c0 3.87-1.57 7.37-4.1 9.9" />
                  </svg>
                  
                  <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[#00A389] text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Block 2 & 3: Right Stacked Cards */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Card 2: Freeze card in a tap */}
              <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="max-w-md">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1D20] tracking-tight">
                    Freeze card in a tap
                  </h3>
                  <p className="mt-2 text-sm text-[#5F6773] leading-relaxed">
                    Misplaced your card at a café? Freeze it instantly from the app with zero phone calls. Found it in your pocket? Unfreeze with a tap.
                  </p>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => setCardFrozen(!cardFrozen)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        cardFrozen ? 'bg-[#FF6651]' : 'bg-[#00A389]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          cardFrozen ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-[#1A1D20]">
                      {cardFrozen ? 'Card Frozen (Locked)' : 'Card Active (Unlocked)'}
                    </span>
                  </div>
                </div>

                {/* Stacking Cards Mockup */}
                <div className="relative w-36 h-24">
                  <div className={`absolute top-0 right-4 w-28 h-18 rounded-xl ${cardFrozen ? 'bg-gray-400' : 'bg-[#00A389]'} shadow-lg transform -rotate-6 transition-all`} />
                  <div className={`absolute top-3 right-0 w-28 h-18 rounded-xl ${cardFrozen ? 'bg-gray-600' : 'bg-[#FF6651]'} shadow-lg transform rotate-3 transition-all flex items-center justify-center text-white text-[9px] font-bold`}>
                    {cardFrozen ? 'FROZEN ❄️' : 'ACTIVE ⚡'}
                  </div>
                </div>
              </div>

              {/* Card 3: Safety first (Numberless Card + Padlock) */}
              <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-8 border border-[#EFE7DE] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="max-w-md">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1D20] tracking-tight">
                    Safety first: 100% Numberless
                  </h3>
                  <p className="mt-2 text-sm text-[#5F6773] leading-relaxed">
                    No 16-digit card number, CVV or expiry date printed on the card body. If anyone glances at your card, there is nothing for them to steal.
                  </p>
                </div>

                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFEAE5] to-[#FFD5C9] flex items-center justify-center shadow-lg border border-[#FF6651]/20">
                  <Lock className="w-12 h-12 text-[#FF6651]" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6. "ACCEPT INTERNATIONAL TRANSFERS FROM ANYWHERE IN THE WORLD"
         ========================================================================= */}
      <section id="international" className="py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F7F3] text-[#00A389] text-xs font-bold mb-3">
              <Globe className="w-3.5 h-3.5" />
              <span>Direct Global Remittance &amp; Freelancer Hub</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1D20] tracking-tight">
              Accept international transfers <br />
              from anywhere in the world
            </h2>
            <p className="mt-4 text-base text-[#5F6773]">
              Receive money from international clients, remote companies, and loved ones directly into TransMoney. Zero hidden deductions.
            </p>
          </div>

          {/* Interactive Satellite Orbit of Global Platforms */}
          <div className="relative max-w-3xl mx-auto py-12 flex items-center justify-center">
            <div className="absolute w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full border-2 border-dashed border-[#E3DBD2] pointer-events-none" />
            
            {/* Center TransMoney Hub */}
            <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00A389] to-[#00705E] p-4 text-white shadow-2xl shadow-[#00A389]/40 flex flex-col items-center justify-center">
              <img src={logoImg} alt="TransMoney" className="w-8 h-8 object-contain filter invert" />
              <span className="text-[10px] font-extrabold uppercase mt-1">TransMoney</span>
            </div>

            {/* Orbiting Badges */}
            <div className="absolute top-2 left-1/4 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-lg border border-[#F0EAE1] flex items-center gap-2 hover:scale-110 transition-transform cursor-default">
              <span className="font-black text-[#003087] text-sm">PayPal</span>
            </div>

            <div className="absolute top-8 right-16 bg-[#2ED06E] text-[#163300] px-4 py-2 rounded-2xl shadow-lg font-black text-sm hover:scale-110 transition-transform cursor-default">
              Wise
            </div>

            <div className="absolute bottom-6 left-12 bg-white px-4 py-2 rounded-2xl shadow-lg border border-[#F0EAE1] flex items-center gap-1.5 hover:scale-110 transition-transform cursor-default">
              <div className="w-3 h-3 rounded-full bg-[#FF4800]" />
              <span className="font-extrabold text-[#1A1D20] text-sm">payoneer</span>
            </div>

            <div className="absolute bottom-4 right-1/4 bg-[#14A800] text-white px-4 py-2 rounded-2xl shadow-lg font-bold text-sm hover:scale-110 transition-transform cursor-default">
              Upwork
            </div>

            <div className="absolute top-1/2 -left-2 -translate-y-1/2 bg-[#1DBF73] text-white px-3 py-1.5 rounded-2xl shadow-lg font-black text-xs hover:scale-110 transition-transform cursor-default">
              fiverr.
            </div>

            <div className="absolute top-1/2 -right-2 -translate-y-1/2 bg-[#635BFF] text-white px-4 py-2 rounded-2xl shadow-lg font-black text-xs hover:scale-110 transition-transform cursor-default">
              stripe
            </div>
          </div>

          {/* Currencies Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {(['PKR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setActiveCurrency(curr)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCurrency === curr
                    ? 'bg-[#1A1D20] text-white shadow-md'
                    : 'bg-white text-[#5F6773] border border-[#EFE7DE] hover:bg-gray-50'
                }`}
              >
                {curr === 'PKR' && '🇵🇰 PKR (Rupee)'}
                {curr === 'USD' && '🇺🇸 USD (Dollar)'}
                {curr === 'EUR' && '🇪🇺 EUR (Euro)'}
                {curr === 'GBP' && '🇬🇧 GBP (Pound)'}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. "24/7 IN-APP SUPPORT" (SadaPay Pastel Block Layout)
         ========================================================================= */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-xs rounded-[36px] p-8 sm:p-12 lg:p-16 border border-[#EFE7DE] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-xs">
            
            {/* Volumetric 3D "24/7" Text Block */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[220px]">
              <div className="relative text-7xl sm:text-8xl md:text-9xl font-black text-[#FF6651] tracking-tighter drop-shadow-xl select-none">
                24/7
              </div>

              <div className="absolute top-0 right-10 w-12 h-12 rounded-2xl bg-[#FF6651] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF6651]/30 transform rotate-12">
                ?
              </div>
              <div className="absolute bottom-2 left-8 w-12 h-12 rounded-2xl bg-[#00A389] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#00A389]/30 transform -rotate-12">
                👍
              </div>
            </div>

            {/* Right: Copy & CTA Button */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D20] tracking-tight">
                24/7 in-app support
              </h2>
              <p className="text-base text-[#5F6773] leading-relaxed">
                Tired of waiting on hold or navigating confusing robotic automated phone menus?
                Our friendly human support champions are available around the clock. Average response time under 60 seconds.
              </p>
              
              <div className="pt-2">
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-extrabold text-sm px-7 py-3.5 rounded-full shadow-md shadow-[#FF6651]/25 transition cursor-pointer"
                >
                  Talk to us
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          8. "REGULATED BY STATE BANK" (Dual 3D Embossed Seals)
         ========================================================================= */}
      <section id="regulation" className="py-20 md:py-28 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-[#EFE7DE] p-3 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl border-2 border-[#00A389] flex flex-col items-center justify-center text-[#00A389]">
                <Building2 className="w-6 h-6" />
                <span className="text-[8px] font-black mt-0.5">SBP</span>
              </div>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-[#EFE7DE] p-3 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#00A389] to-[#00816C] p-2 flex items-center justify-center">
                <img src={logoImg} alt="TM" className="w-full h-full object-contain filter invert" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D20] tracking-tight">
            Regulated by State Bank
          </h2>

          <p className="text-base text-[#5F6773] leading-relaxed max-w-2xl mx-auto">
            TransMoney is licensed as an Electronic Money Institution (EMI) under the State Bank of Pakistan regulations.
            All user funds are deposited 1:1 in ring-fenced, segregated accounts with top-tier AA-rated trustee banks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold text-[#8C939E]">
            <span>✓ EMI License No. SBP/EMI/2026</span>
            <span>•</span>
            <span>✓ 100% Segregated Reserves</span>
            <span>•</span>
            <span>✓ Bank-Grade PCI-DSS Level 1 Certified</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. "OVER 2 MILLION+ HAPPY USERS!" (Video Testimonials)
         ========================================================================= */}
      <section id="reviews" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1D20] tracking-tight">
              Over 2 million+ <br />
              happy users!
            </h2>
            <p className="mt-3 text-base text-[#5F6773]">
              From freelancers receiving overseas wires to families paying monthly groceries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Review 1: Bilal (Freelancer) */}
            <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-6 border border-[#EFE7DE] flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="relative h-60 rounded-2xl bg-gradient-to-t from-black/80 via-black/20 to-black/30 overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900" />
                  
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white/90 text-[#FF6651] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold z-10">
                    "Got my Upwork payout in 10 seconds!"
                  </div>
                </div>

                <p className="text-sm text-[#4B5563] italic">
                  "TransMoney eliminated the 4% exchange losses I was suffering on traditional bank transfers. The app is shockingly fast."
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F0EAE1] flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-[#1A1D20]">Bilal Tariq</div>
                  <div className="text-xs text-gray-500">Full-Stack Engineer, Lahore</div>
                </div>
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            {/* Review 2: Hamza (Founder / Commuter) */}
            <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-6 border border-[#EFE7DE] flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="relative h-60 rounded-2xl bg-gradient-to-t from-black/80 via-black/20 to-black/30 overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 to-slate-900" />
                  
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white/90 text-[#00A389] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold z-10">
                    "The numberless card turns heads everywhere"
                  </div>
                </div>

                <p className="text-sm text-[#4B5563] italic">
                  "I love hand-delivering zero-stress payments. If I ever lose my wallet, I tap freeze on my phone. Absolute peace of mind."
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#EFE7DE] flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-[#1A1D20]">Hamza Munir</div>
                  <div className="text-xs text-gray-500">Startup Founder, Karachi</div>
                </div>
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            {/* Review 3: Ayesha (Overseas Expat) */}
            <div className="bg-white/90 backdrop-blur-xs rounded-[32px] p-6 border border-[#EFE7DE] flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="relative h-60 rounded-2xl bg-gradient-to-t from-black/80 via-black/20 to-black/30 overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-950 to-slate-900" />
                  
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white/90 text-[#FF6651] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold z-10">
                    "Remitting home from London in 5 seconds"
                  </div>
                </div>

                <p className="text-sm text-[#4B5563] italic">
                  "Registered from the UK with my NICOP in under three minutes. Sending pocket money to my parents has never been this seamless."
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F0EAE1] flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-[#1A1D20]">Dr. Ayesha Malik</div>
                  <div className="text-xs text-gray-500">NHS Resident, London</div>
                </div>
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          10. "GET THE APP NOW" CTA BANNER
         ========================================================================= */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[40px] bg-gradient-to-r from-[#FF6651] to-[#FF553C] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-[#FF6651]/25">
            
            {/* Watermark Repeating Typography Pattern */}
            <div className="absolute inset-0 select-none pointer-events-none opacity-10 flex flex-col justify-around text-4xl sm:text-6xl font-black uppercase whitespace-nowrap -rotate-2">
              <div>Get the app now • Get the app now • Get the app now</div>
              <div>Get the app now • Get the app now • Get the app now</div>
              <div>Get the app now • Get the app now • Get the app now</div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Get the app now.
                </h2>
                <p className="text-white/90 text-base sm:text-lg max-w-xl leading-relaxed">
                  Join over 2 million people who have already broken free from traditional banking hassles.
                  Sign up takes less than 2 minutes right from your phone.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="bg-white text-[#FF6651] hover:bg-gray-100 font-black text-sm px-8 py-3.5 rounded-full shadow-lg transition cursor-pointer"
                  >
                    Open Free Account
                  </button>
                </div>
              </div>

              {/* QR Code Scanner Card */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="bg-white text-[#1A1D20] p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-[220px]">
                  <div className="w-36 h-36 bg-gray-50 border border-gray-200 rounded-2xl p-2.5 flex items-center justify-center">
                    <svg className="w-full h-full text-[#1A1D20]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h4v4h-4v-4zm2-2h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-black mt-3">Scan to download</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">iOS &amp; Android</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          11. MASTER FINTECH FOOTER
         ========================================================================= */}
      <footer className="pt-16 pb-12 text-[#5F6773] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#00A389] p-2 flex items-center justify-center">
                  <img src={logoImg} alt="TransMoney" className="w-full h-full object-contain filter invert" />
                </div>
                <span className="font-extrabold text-lg text-[#1A1D20]">TransMoney</span>
              </div>
              <p className="text-xs leading-relaxed max-w-sm text-[#737C8A]">
                TransMoney Technologies is an Electronic Money Institution (EMI) regulated by the State Bank of Pakistan.
                Modern money transfers, international remittances, and numberless cards.
              </p>
              <div className="text-[11px] text-[#9CA3AF]">
                Licensed by SBP • Powered by Mastercard
              </div>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#1A1D20] block">
                Products
              </span>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-[#FF6651]">Personal Account</a></li>
                <li><a href="#international" className="hover:text-[#FF6651]">Business Account</a></li>
                <li><a href="#features" className="hover:text-[#FF6651]">Numberless Card</a></li>
                <li><a href="#international" className="hover:text-[#FF6651]">International Remittance</a></li>
                <li><a href="#features" className="hover:text-[#FF6651]">Bill Payments</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#1A1D20] block">
                Company
              </span>
              <ul className="space-y-2">
                <li><a href="#reviews" className="hover:text-[#FF6651]">About Us</a></li>
                <li><a href="#reviews" className="hover:text-[#FF6651]">Careers</a></li>
                <li><a href="#regulation" className="hover:text-[#FF6651]">Press &amp; Media</a></li>
                <li><a href="#reviews" className="hover:text-[#FF6651]">Community</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#1A1D20] block">
                Legal &amp; Trust
              </span>
              <ul className="space-y-2">
                <li><a href="#regulation" className="hover:text-[#FF6651]">SBP Regulations</a></li>
                <li><a href="#security" className="hover:text-[#FF6651]">Security Policy</a></li>
                <li><a href="#security" className="hover:text-[#FF6651]">Privacy Notice</a></li>
                <li><a href="#security" className="hover:text-[#FF6651]">Schedule of Charges</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#EFE7DE] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
            <div>
              © 2026 TransMoney Technologies Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#top" className="hover:text-[#FF6651] cursor-pointer font-bold text-[#00A389]">
                Back to top ↑
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#FFEAE5] text-[#FF6651] flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-[#1A1D20]">
              Scan to Download TransMoney
            </h3>
            <p className="text-xs text-[#5F6773]">
              Point your phone's camera at the QR code below to download from the App Store or Google Play Store.
            </p>
            <div className="w-48 h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 mx-auto flex items-center justify-center">
              <svg className="w-full h-full text-[#1A1D20]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h4v4h-4v-4zm2-2h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z"/>
              </svg>
            </div>
            <button
              onClick={() => {
                setShowQrModal(false);
                onOpenAuth('signup');
              }}
              className="w-full bg-[#FF6651] text-white font-bold py-3 rounded-full text-sm shadow-md cursor-pointer"
            >
              Sign Up Online
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
