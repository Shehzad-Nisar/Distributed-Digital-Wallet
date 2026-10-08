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
  Server,
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

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 font-sans shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Clean FinTech Navigation */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img src={logoImg} alt="TransMoney" className="w-8 h-8 rounded-lg object-cover shadow-2xs" />
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-black flex items-center gap-1.5">
                TransMoney
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase font-mono">
                Digital Wallet
              </span>
            </div>
          </div>

          {/* Clean Consumer Tabs (SadaPay + Wise model) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-medium flex items-center gap-1.5 ${
                activeTab === 'console'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Wallet Home</span>
            </button>

            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'transfer'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Money</span>
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'merchant'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Pay Merchants</span>
            </button>

            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'exchange'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Currency FX</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'ledger'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Statements &amp; Activity</span>
            </button>

            {/* Core Banking Console (Dedicated Professional Section for Evaluators & Infrastructure) */}
            <button
              onClick={() => setActiveTab('core')}
              className={`px-3 py-1.5 ml-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-[11px] font-mono border ${
                activeTab === 'core'
                  ? 'bg-neutral-900 text-emerald-400 border-neutral-800 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Server className="w-3 h-3 text-emerald-500" />
              <span>Core Banking Engine</span>
            </button>
          </nav>
        </div>

        {/* Right Tools & User Session */}
        <div className="flex items-center gap-3">
          {/* Live System Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-medium">{isHealthy ? 'Online' : 'Offline'}</span>
          </div>

          {/* User authentication pill / switcher */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-black text-xs transition cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-black text-white text-[11px] flex items-center justify-center font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-black block leading-tight truncate max-w-[130px]">
                    {currentUser.fullName}
                  </span>
                  {activeAccount && (
                    <span className="text-[10px] text-slate-500 font-mono block leading-none">
                      {Number(activeAccount.balance).toLocaleString()} {activeAccount.currency}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Session Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 font-sans space-y-1 animate-in fade-in slide-in-from-top-1">
                  <div className="p-2 border-b border-slate-100">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                      Active Profile
                    </span>
                    <span className="text-xs font-bold text-black block">{currentUser.fullName}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{currentUser.email}</span>
                  </div>

                  {userAccounts.length > 0 && (
                    <div className="py-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 block mb-1">
                        My Accounts ({userAccounts.length})
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
                              ? 'bg-black text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-black'
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
                      className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:text-black hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Open New Currency Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('signin');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-slate-700 hover:text-black hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Switch Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-black hover:border-black transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer shadow-xs"
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
