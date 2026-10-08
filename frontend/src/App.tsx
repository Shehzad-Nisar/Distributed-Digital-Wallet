import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ShardClusterView } from './components/ShardClusterView';
import { TransferConsole } from './components/TransferConsole';
import { TransactionHistory } from './components/TransactionHistory';
import { ArchitectureView } from './components/ArchitectureView';
import { MerchantPortal } from './components/MerchantPortal';
import { AuditorDashboard } from './components/AuditorDashboard';
import { CurrencyExchange } from './components/CurrencyExchange';
import { SystemBufferDashboard } from './components/SystemBufferDashboard';
import { AuthModal } from './components/AuthModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { DepositWithdrawModal } from './components/DepositWithdrawModal';
import { getAccounts, getHealth, getUsers, removeToken, updateAccountStatus } from './api/client';
import { walletSocket } from './api/websocket';
import type { Account, SystemHealth, User } from './types';
import { ArrowDownLeft, ArrowUpRight, Lock, RefreshCw, Send, Unlock, X } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [liveToast, setLiveToast] = useState<{ message: string; type: string } | null>(null);

  // View state: landing, console, transfer, merchant, ledger, exchange, system, architecture
  const [activeTab, setActiveTab] = useState<'landing' | 'console' | 'transfer' | 'merchant' | 'ledger' | 'exchange' | 'system' | 'architecture'>('landing');

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [depositModalMode, setDepositModalMode] = useState<'deposit' | 'withdraw'>('deposit');

  const fetchData = async () => {
    try {
      const [h, accs, usrs] = await Promise.all([
        getHealth(),
        getAccounts(),
        getUsers().catch(() => [] as User[]),
      ]);
      setHealth(h);
      setAccounts(accs);
      setUsers(usrs);

      // Restore user session if stored
      const savedUserId = localStorage.getItem('transmoney_active_user_id');
      if (savedUserId && usrs.length > 0) {
        const found = usrs.find((u) => u.id === Number(savedUserId));
        if (found) {
          setCurrentUser(found);
          const userAcc = accs.find((a) => a.user?.id === found.id);
          if (userAcc && !selectedAccountId) {
            setSelectedAccountId(userAcc.id);
          }
        }
      } else if (!currentUser && usrs.length > 0) {
        setCurrentUser(usrs[0]);
        const userAcc = accs.find((a) => a.user?.id === usrs[0].id);
        if (userAcc) {
          setSelectedAccountId(userAcc.id);
        }
      }

      if (!selectedAccountId && accs.length > 0) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err) {
      console.error('Error fetching cluster data', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);

    // Phase 7: Real-Time WebSocket stream integration
    walletSocket.connect();
    const unbind = walletSocket.onEvent((event) => {
      setLiveToast({
        message: `${event.eventType}: ${event.amount} ${event.currency} [${event.transactionId}]`,
        type: event.eventType,
      });
      fetchData();
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setLiveToast(null), 6000);
    });

    return () => {
      clearInterval(interval);
      unbind();
    };
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      walletSocket.subscribe(selectedAccountId);
    }
  }, [selectedAccountId]);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('transmoney_active_user_id', String(user.id));
    const userAcc = accounts.find((a) => a.user?.id === user.id);
    if (userAcc) {
      setSelectedAccountId(userAcc.id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    removeToken();
    localStorage.removeItem('transmoney_active_user_id');
  };

  const handleStatusToggle = async (acc: Account) => {
    try {
      const nextStatus = acc.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      const updated = await updateAccountStatus(acc.id, nextStatus);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleDepositSuccess = (updatedAccount: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setRefreshTrigger((prev) => prev + 1);
    fetchData();
  };

  const handleUserCreated = (newUser: User, newAccount: Account) => {
    setUsers((prev) => [...prev, newUser]);
    setAccounts((prev) => [...prev, newAccount]);
    setCurrentUser(newUser);
    setSelectedAccountId(newAccount.id);
    localStorage.setItem('transmoney_active_user_id', String(newUser.id));
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAccountCreated = (newAccount: Account) => {
    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
    setRefreshTrigger((prev) => prev + 1);
    fetchData();
  };

  const handleTransferComplete = () => {
    fetchData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const currentUserAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  return (
    <div className="min-h-screen theme-bg-app theme-text-primary flex flex-col font-sans">
      {/* Universal Header with Theme Switcher */}
      <Header
        health={health}
        currentUser={currentUser}
        userAccounts={currentUserAccounts}
        activeAccountId={selectedAccountId}
        onSelectAccount={(id) => setSelectedAccountId(id)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Phase 7: Real-Time WebSocket Toast Notification */}
      {liveToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 font-mono text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                ⚡ Real-Time WebSocket Push
              </span>
              <span className="text-xs text-slate-200 block truncate">{liveToast.message}</span>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Course & Attribution Banner (visible on interior tabs) */}
        {activeTab !== 'landing' && (
          <div className="theme-bg-card theme-border border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full theme-btn-primary animate-pulse" />
                <h2 className="font-bold theme-text-primary uppercase tracking-wider">
                  Distributed Relational Database System — Course Project
                </h2>
              </div>
              <p className="text-[11px] theme-text-secondary font-sans">
                PostgreSQL Sharded Cluster • 2PC Cross-Shard Consensus • Double-Entry Ledger Bookkeeping • Sir Umair Evaluation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Shehzad Nisar (B22110006147)
              </span>
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Muhammad Ashraf (B22110006090)
              </span>
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Daniyal Ahmed (B21110006024)
              </span>
              <button
                onClick={() => {
                  fetchData();
                  setRefreshTrigger((prev) => prev + 1);
                }}
                title="Refresh Shard State"
                className="p-1.5 rounded theme-btn-secondary transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-24 theme-text-muted space-y-3 font-mono">
            <RefreshCw className="w-7 h-7 animate-spin theme-text-primary" />
            <span className="text-xs uppercase tracking-wider">
              Connecting to PostgreSQL Sharded Partitions...
            </span>
          </div>
        ) : (
          <>
            {/* View 1: Landing Page */}
            {activeTab === 'landing' && (
              <LandingPage
                health={health}
                accounts={accounts}
                users={users}
                currentUser={currentUser}
                onEnterConsole={() => setActiveTab('console')}
                onOpenAuth={(mode) => {
                  setAuthModalMode(mode);
                  setAuthModalOpen(true);
                }}
              />
            )}

            {/* View 2: Console (Shards + Fast 2PC Wire + Ledger) */}
            {activeTab === 'console' && (
              <div className="space-y-8">
                {/* Active user quick status bar */}
                {currentUser && (
                  <div className="p-4 rounded-xl theme-bg-card theme-border border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {currentUser.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold theme-text-primary text-sm">{currentUser.fullName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 border theme-border font-mono text-slate-600 dark:text-slate-300">
                            {currentUser.role || 'ROLE_USER'}
                          </span>
                        </div>
                        <span className="text-[11px] theme-text-secondary block font-sans">
                          {currentUser.email} • {currentUserAccounts.length} Sharded Account{currentUserAccounts.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Active Selected Account Details & Actions */}
                    {(() => {
                      const activeAcc = accounts.find((a) => a.id === selectedAccountId) || currentUserAccounts[0];
                      const isFrozen = activeAcc?.status === 'FROZEN';

                      return (
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0 border-t md:border-t-0 theme-border">
                          {activeAcc && (
                            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-lg theme-bg-card-subtle border theme-border">
                              <span className="text-[11px] font-bold theme-text-primary">{activeAcc.accountNumber}</span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {Number(activeAcc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} {activeAcc.currency}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isFrozen ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {activeAcc.status}
                              </span>
                            </div>
                          )}

                          {activeAcc && (
                            <>
                              <button
                                onClick={() => {
                                  setDepositModalMode('deposit');
                                  setDepositModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition cursor-pointer"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span>Deposit</span>
                              </button>

                              <button
                                onClick={() => {
                                  setDepositModalMode('withdraw');
                                  setDepositModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Withdraw</span>
                              </button>

                              <button
                                onClick={() => handleStatusToggle(activeAcc)}
                                title={isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px] font-semibold transition cursor-pointer ${
                                  isFrozen
                                    ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'theme-border theme-bg-card text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setActiveTab('transfer')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded theme-btn-primary font-semibold uppercase text-[11px] cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Wire</span>
                          </button>

                          <button
                            onClick={() => setCreateAccountModalOpen(true)}
                            className="px-2.5 py-1.5 rounded theme-btn-secondary text-[11px] cursor-pointer"
                          >
                            + Shard Acc
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Shard Topology Cards */}
                <ShardClusterView
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={(id) => setSelectedAccountId(id)}
                  onOpenCreateAccount={() => {
                    if (currentUser) {
                      setCreateAccountModalOpen(true);
                    } else {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }
                  }}
                />

                {/* 2PC Transfer Console */}
                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                />

                {/* Transaction History & Ledger */}
                <TransactionHistory
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {/* View 3: Send Money (Dedicated 2PC Flow) */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <div className="border-b theme-border pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold theme-text-primary uppercase tracking-tight font-mono">
                      Send Money // Cross-Shard 2PC Consensus
                    </h2>
                    <p className="text-xs theme-text-secondary font-mono">
                      Execute cross-border/cross-shard atomic fund transfers with zero deadlock risk
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-3 py-1.5 rounded theme-btn-secondary font-mono text-xs cursor-pointer"
                  >
                    &larr; Back to Topology
                  </button>
                </div>

                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                />

                <ShardClusterView
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={(id) => setSelectedAccountId(id)}
                />
              </div>
            )}

            {/* View 4: Merchant Services & QR Code Payments */}
            {activeTab === 'merchant' && (
              <MerchantPortal
                currentUser={currentUser}
                accounts={accounts}
                activeAccountId={selectedAccountId}
                onRefreshData={fetchData}
              />
            )}

            {/* View 5: Ledger & Audit (Dedicated view) */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <AuditorDashboard
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />

                <div className="pt-4 border-t theme-border">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold theme-text-primary font-mono uppercase tracking-tight">
                      Historical Transaction Search &amp; Trigram Query
                    </h3>
                    <p className="text-xs theme-text-secondary font-mono">
                      Query indexed audit logs with full status transitions and shard routing
                    </p>
                  </div>
                  <TransactionHistory
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            )}

            {/* View 5: Multi-Currency & Cross-Border Exchange Engine */}
            {activeTab === 'exchange' && (
              <CurrencyExchange
                accounts={accounts}
                currentUser={currentUser}
                onExchangeComplete={() => {
                  fetchData();
                  setRefreshTrigger((prev) => prev + 1);
                }}
              />
            )}

            {/* View 6: Redis Balance Cache & Async Queue Buffer (Phase 7) */}
            {activeTab === 'system' && <SystemBufferDashboard />}

            {/* View 7: System Architecture */}
            {activeTab === 'architecture' && <ArchitectureView />}
          </>
        )}
      </main>

      {/* Global Themed Footer */}
      <footer className="border-t theme-border theme-bg-card py-6 text-center text-xs font-mono theme-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            TransMoney Distributed Digital Wallet System • Built with Spring Boot 3, PostgreSQL 17, and React 19
          </span>
          <div className="flex items-center gap-4 theme-text-secondary">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:theme-text-primary cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:theme-text-primary cursor-pointer"
            >
              Architecture
            </button>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="hover:theme-text-primary"
            >
              Swagger
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
        onUserCreated={handleUserCreated}
        initialMode={authModalMode}
      />

      <CreateAccountModal
        isOpen={createAccountModalOpen}
        onClose={() => setCreateAccountModalOpen(false)}
        currentUser={currentUser}
        onAccountCreated={handleAccountCreated}
      />

      <DepositWithdrawModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        account={accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null}
        mode={depositModalMode}
        onSuccess={handleDepositSuccess}
      />
    </div>
  );
}

export default App;
