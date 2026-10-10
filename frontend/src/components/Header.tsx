import React, { useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Plus,
  Scale,
  Send,
  Store,
  Users,
  ArrowRightLeft,
  Wallet,
  Terminal,
} from 'lucide-react';
import type { Account, SystemHealth, User } from '../types';
import logoImg from '../assets/logo.png';

export type AppTab =
  | 'landing'
  | 'console'
  | 'transfer'
  | 'merchant'
  | 'ledger'
  | 'exchange'
  | 'core'
  | 'system'
  | 'simulator'
  | 'architecture';

interface HeaderProps {
  health: SystemHealth | null;
  currentUser: User | null;
  userAccounts: Account[];
  activeAccountId: number | null;
  onSelectAccount: (id: number) => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenCreateAccount: () => void;
  onLogout: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  currentUser,
  userAccounts,
  activeAccountId,
  onSelectAccount,
  onOpenAuth,
  onOpenCreateAccount,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isHealthy = health?.database?.includes('Connected');

  const activeAccount = userAccounts.find((a) => a.id === activeAccountId) || userAccounts[0];

  // Clean raw database test hashes like 'Bob Ahmed 979fab2f' into clean 'Bob Ahmed'
  const cleanUserName = (name: string | undefined) => {
    if (!name) return 'Personal Account';
    return name.replace(/\s+[a-f0-9]{8}$/i, '').trim();
  };

  const displayName = cleanUserName(currentUser?.fullName);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 h-16 font-sans">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
        {/* Left: Brand + Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo Brand */}
          <div
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center p-1.5 shadow-2xs group-hover:bg-slate-800 transition">
              <img src={logoImg} alt="TransMoney" className="w-full h-full object-contain filter invert" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              TransMoney
            </span>
          </div>

          <div className="hidden lg:block h-5 w-px bg-slate-200" />

          {/* Clean Top-Tier Navigation Tabs (Wise & Stripe minimal style) */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'console'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wallet className={`w-3.5 h-3.5 ${activeTab === 'console' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'transfer'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${activeTab === 'transfer' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>Send</span>
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'merchant'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Store className={`w-3.5 h-3.5 ${activeTab === 'merchant' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>Merchants</span>
            </button>

            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'exchange'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className={`w-3.5 h-3.5 ${activeTab === 'exchange' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>Exchange FX</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'ledger'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${activeTab === 'ledger' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>Activity</span>
            </button>
          </nav>
        </div>

        {/* Right: Tools & Clean User Profile */}
        <div className="flex items-center gap-3">
          {/* Discreet Core Banking Engine Tool link */}
          <button
            onClick={() => setActiveTab('core')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer border ${
              activeTab === 'core'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
            title="Switch to Core Distributed Engine Console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Core Banking</span>
          </button>

          {/* Network Live Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200/80"
            title={isHealthy ? 'Connected to distributed core ledger' : 'Offline'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] hidden sm:inline">Online</span>
          </div>

          {/* User Profile Pill / Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 text-xs transition cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                  {displayName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-slate-900 block leading-tight truncate max-w-[120px]">
                    {displayName}
                  </span>
                  {activeAccount && (
                    <span className="text-[10px] text-slate-500 font-mono block leading-none">
                      {activeAccount.currency} {Number(activeAccount.balance).toLocaleString()}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Session Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 font-sans space-y-1 animate-in fade-in slide-in-from-top-1 text-slate-800">
                  <div className="p-2 border-b border-slate-100">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                      Account Owner
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">{displayName}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{currentUser.email}</span>
                  </div>

                  {userAccounts.length > 0 && (
                    <div className="py-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 block mb-1">
                        Accounts ({userAccounts.length})
                      </span>
                      {userAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onSelectAccount(acc.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                            acc.id === activeAccountId
                              ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{acc.accountNumber}</span>
                          <span className="shrink-0 text-[11px] ml-1">
                            {Number(acc.balance).toLocaleString()} {acc.currency}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-100 space-y-0.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCreateAccount();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                      <span>Open Currency Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('signin');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Switch Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
