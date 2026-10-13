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
  Sparkles,
} from 'lucide-react';
import type { Account, SystemHealth, User } from '../types';

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
    <header className="bg-[#FAF7F4]/95 backdrop-blur-md border-b border-[#EBE5DF] sticky top-0 z-40 h-16 font-sans">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
        {/* Left: Brand + Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo Brand with SadaPay dual-tone teal & coral mark */}
          <div
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-[#EBE5DF] flex items-center justify-center relative shadow-xs">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00A389] absolute top-0.5 left-0.5 opacity-90 group-hover:scale-105 transition-transform" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF6651] absolute bottom-0.5 right-0.5 opacity-90 group-hover:scale-105 transition-transform" />
                <div className="relative z-10 w-3.5 h-3.5 rounded-xs bg-white/70 backdrop-blur-xs flex items-center justify-center text-[9px] font-black text-[#1A1D20]">
                  T
                </div>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#1A1D20]">
              TransMoney
            </span>
          </div>

          <div className="hidden lg:block h-5 w-px bg-[#EBE5DF]" />

          {/* Clean Neobank Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'landing'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'landing' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'console'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <Wallet className={`w-3.5 h-3.5 ${activeTab === 'console' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'transfer'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${activeTab === 'transfer' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
              <span>Send</span>
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'merchant'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <Store className={`w-3.5 h-3.5 ${activeTab === 'merchant' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
              <span>Merchants</span>
            </button>

            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'exchange'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <ArrowRightLeft className={`w-3.5 h-3.5 ${activeTab === 'exchange' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
              <span>Exchange FX</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold flex items-center gap-2 ${
                activeTab === 'ledger'
                  ? 'bg-[#FFEAE5] text-[#FF6651] font-bold shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#1A1D20] hover:bg-white/80'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${activeTab === 'ledger' ? 'text-[#FF6651]' : 'text-slate-400'}`} />
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
                ? 'bg-[#1A1D20] text-white border-[#1A1D20]'
                : 'text-[#4B5563] hover:text-[#1A1D20] bg-white hover:bg-[#FAF7F4] border-[#EBE5DF]'
            }`}
            title="Switch to Core Distributed Engine Console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Core Banking</span>
          </button>

          {/* Network Live Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-[#4B5563] bg-white border border-[#EBE5DF]"
            title={isHealthy ? 'Connected to distributed core ledger' : 'Offline'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-[#00A389] animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] hidden sm:inline">Online</span>
          </div>

          {/* User Profile Pill / Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl border border-[#EBE5DF] bg-white hover:border-[#FF6651]/40 text-xs transition cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF6651] to-[#FF8573] text-white text-xs flex items-center justify-center font-bold shadow-xs">
                  {displayName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-[#1A1D20] block leading-tight truncate max-w-[120px]">
                    {displayName}
                  </span>
                  {activeAccount && (
                    <span className="text-[10px] text-[#00A389] font-mono font-semibold block leading-none">
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
                              ? 'bg-[#FFEAE5] text-[#FF6651] font-bold border border-[#FF6651]/30'
                              : 'text-slate-700 hover:bg-[#FAF7F4]'
                          }`}
                        >
                          <span className="truncate">{acc.accountNumber}</span>
                          <span className="shrink-0 text-[11px] ml-1 font-bold">
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
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-[#FAF7F4] flex items-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#00A389]" />
                      <span>Open Currency Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('signin');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-[#FAF7F4] flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#FF6651]" />
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
                className="px-3.5 py-1.5 rounded-xl border border-[#EBE5DF] text-xs font-semibold text-[#1A1D20] hover:bg-white transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF6651] hover:bg-[#E54D34] text-white font-semibold text-xs transition cursor-pointer shadow-sm shadow-[#FF6651]/30"
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
