import { useState, useEffect } from 'react';
import { Header, type AppTab } from './components/Header';
import { WalletHome } from './components/WalletHome';
import { TransferConsole } from './components/TransferConsole';
import { TransactionHistory } from './components/TransactionHistory';
import { MerchantPortal } from './components/MerchantPortal';
import { AuditorDashboard } from './components/AuditorDashboard';
import { CurrencyExchange } from './components/CurrencyExchange';
import { CoreBankingConsole } from './components/CoreBankingConsole';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { DepositWithdrawModal } from './components/DepositWithdrawModal';
import { getAccounts, getHealth, getUsers, removeToken, updateAccountStatus } from './api/client';
import { walletSocket } from './api/websocket';
import type { Account, SystemHealth, User } from './types';
import { RefreshCw, X } from 'lucide-react';

export const pathToTab = (pathname: string, hash: string): AppTab => {
  const cleanPath = (pathname || '').toLowerCase().replace(/^\/+|\/+$/g, '');
  const cleanHash = (hash || '').toLowerCase().replace(/^#+/, '').replace(/^\/+|\/+$/g, '');
  const target = cleanHash || cleanPath;

  if (target === 'dashboard' || target === 'home' || target === 'console') return 'console';
  if (target === 'send' || target === 'transfer') return 'transfer';
  if (target === 'merchants' || target === 'merchant') return 'merchant';
  if (target === 'exchange' || target === 'fx') return 'exchange';
  if (target === 'activity' || target === 'ledger' || target === 'statements') return 'ledger';
  if (target === 'core' || target === 'core-banking') return 'core';
  if (target === 'simulator') return 'simulator';
  return 'landing';
};

export const tabToPath = (tab: AppTab): string => {
  switch (tab) {
    case 'console': return '/dashboard';
    case 'transfer': return '/send';
    case 'merchant': return '/merchants';
    case 'exchange': return '/exchange';
    case 'ledger': return '/activity';
    case 'core': return '/core-banking';
    case 'simulator': return '/simulator';
    case 'landing':
    default: return '/';
  }
};

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [liveToast, setLiveToast] = useState<{ message: string; type: string } | null>(null);

  // Active view: synced with browser URL (/dashboard, /send, /merchants, etc.)
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    return pathToTab(window.location.pathname, window.location.hash);
  });

  const handleNavigateTab = (tab: AppTab) => {
    setActiveTab(tab);
    const targetPath = tabToPath(tab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

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

      // Restore user session if stored, or fallback to first available user for rich dashboard
      const savedUserId = localStorage.getItem('transmoney_active_user_id');
      let targetUser: User | null = null;
      if (savedUserId && usrs.length > 0) {
        targetUser = usrs.find((u) => u.id === Number(savedUserId)) || null;
      }
      if (!targetUser && usrs.length > 0) {
        targetUser = usrs[0];
      }

      if (targetUser) {
        setCurrentUser(targetUser);
        const userAcc = accs.find((a) => a.user?.id === targetUser.id);
        if (userAcc) {
          setSelectedAccountId(userAcc.id);
        } else if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
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

    // Browser navigation back/forward support
    const onPopState = () => {
      const tab = pathToTab(window.location.pathname, window.location.hash);
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPopState);

    // Real-Time WebSocket stream integration
    walletSocket.connect();
    const unbind = walletSocket.onEvent((event) => {
      setLiveToast({
        message: `${event.eventType}: ${event.amount} ${event.currency} [${event.transactionId}]`,
        type: event.eventType,
      });
      fetchData();
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setLiveToast(null), 5000);
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', onPopState);
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
    handleNavigateTab('landing');
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
    <div className="min-h-screen bg-[#FAF7F4] text-[#1A1D20] flex flex-col font-sans">
      {/* Real-Time WebSocket Toast Notification */}
      {liveToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md bg-[#1A1D20] text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A389] animate-ping shrink-0" />
            <div>
              <span className="text-[10px] text-[#00A389] font-bold block uppercase tracking-wider font-mono">
                Live Transaction Update
              </span>
              <span className="text-xs text-white/90 block truncate">{liveToast.message}</span>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeTab === 'landing' ? (
        <LandingPage
          health={health}
          accounts={accounts}
          users={users}
          currentUser={currentUser}
          onEnterConsole={() => handleNavigateTab('console')}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onNavigateTab={(tab) => {
            handleNavigateTab(tab as AppTab);
          }}
          onSelectAccount={(id) => setSelectedAccountId(id)}
        />
      ) : (
        <>
          {/* Universal Clean FinTech Header */}
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
            setActiveTab={handleNavigateTab}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3 font-mono">
              <RefreshCw className="w-7 h-7 animate-spin text-[#FF6651]" />
              <span className="text-xs tracking-wider text-[#4B5563] font-medium">
                Loading your account balances...
              </span>
            </div>
          ) : (
            <>
              {/* View 1: Main Wallet Dashboard (SadaPay & Wise Neobank Model) */}
              {activeTab === 'console' && (
              <WalletHome
                accounts={accounts}
                currentUser={currentUser}
                selectedAccountId={selectedAccountId}
                onSelectAccount={(id) => setSelectedAccountId(id)}
                onOpenDeposit={() => {
                  setDepositModalMode('deposit');
                  setDepositModalOpen(true);
                }}
                onOpenWithdraw={() => {
                  setDepositModalMode('withdraw');
                  setDepositModalOpen(true);
                }}
                onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
                onNavigateTab={(tab) => {
                  if (tab === 'transfer') handleNavigateTab('transfer');
                  else if (tab === 'merchant') handleNavigateTab('merchant');
                  else if (tab === 'exchange') handleNavigateTab('exchange');
                  else if (tab === 'ledger') handleNavigateTab('ledger');
                  else if (tab === 'core') handleNavigateTab('core');
                }}
                onStatusToggle={handleStatusToggle}
                refreshTrigger={refreshTrigger}
              />
            )}

            {/* View 2: Send Money (Frictionless Consumer Transfer Flow) */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                  onOpenAuth={(mode) => {
                    setAuthModalMode(mode);
                    setAuthModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* View 3: Merchant Services & QR Code Payments */}
            {activeTab === 'merchant' && (
              <MerchantPortal
                currentUser={currentUser}
                accounts={accounts}
                activeAccountId={selectedAccountId}
                onRefreshData={fetchData}
              />
            )}

            {/* View 4: Official Statements & Double-Entry Ledger */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <AuditorDashboard
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />

                <div className="pt-4 border-t border-[#EBE5DF]">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-[#1A1D20]">
                      Account Statement &amp; Transaction History
                    </h3>
                    <p className="text-xs text-[#5F6773]">
                      Search, filter, and inspect verified transaction records across all regional nodes
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

            {/* View 6: Core Banking & Distributed Infrastructure (Enterprise Console) */}
            {activeTab === 'core' && (
              <CoreBankingConsole
                health={health}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                currentUser={currentUser}
                onSelectAccount={(id) => setSelectedAccountId(id)}
                onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
                onRefreshData={fetchData}
              />
            )}
            </>
          )}
        </main>

      {/* Global Clean FinTech Footer */}
      <footer className="border-t border-[#EBE5DF] bg-[#FAF7F4] py-6 text-center text-xs text-[#5F6773] font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1A1D20]">TransMoney</span>
            <span>•</span>
            <span>Next-Generation Multi-Currency Digital Wallet</span>
          </div>
          <div className="flex items-center gap-4 text-[#4B5563]">
            <button
              onClick={() => handleNavigateTab('landing')}
              className="hover:text-[#1A1D20] cursor-pointer text-[#FF6651] font-semibold"
            >
              Overview
            </button>
            <button
              onClick={() => handleNavigateTab('console')}
              className="hover:text-[#1A1D20] cursor-pointer font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigateTab('transfer')}
              className="hover:text-[#1A1D20] cursor-pointer font-medium"
            >
              Send Money
            </button>
            <button
              onClick={() => handleNavigateTab('merchant')}
              className="hover:text-[#1A1D20] cursor-pointer font-medium"
            >
              Merchants
            </button>
            <button
              onClick={() => handleNavigateTab('core')}
              className="hover:text-[#1A1D20] cursor-pointer font-mono text-[11px]"
            >
              Core Banking
            </button>
            <a
              href="http://localhost:8080/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1A1D20] font-mono text-[11px]"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>
      </>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        users={users}
        accounts={accounts}
        currentUser={currentUser}
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
