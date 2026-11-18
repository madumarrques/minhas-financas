import { useState, useCallback } from 'react';
import { ActiveTab, Transaction } from './types/finance';
import { getYearMonth, shiftYearMonth } from './utils/formatters';
import { useFinanceVault } from './hooks/useFinanceVault';
import { LockScreen } from './components/auth/LockScreen';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { StatementView } from './components/transactions/StatementView';
import { BillsView } from './components/bills/BillsView';
import { AddEntrySheet } from './components/modals/AddEntrySheet';
import { TransactionDetailSheet } from './components/modals/TransactionDetailSheet';

export function App() {
  const [ym, setYm] = useState<string>(() => getYearMonth(new Date()));
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  }, []);

  const {
    hasVault,
    isUnlocked,
    state,
    unlockWithPin,
    createVaultWithPin,
    lockNow,
    addTransaction,
    deleteTransaction,
    addBill,
    deleteBill,
    togglePayBill,
    exportBackup,
    importBackup,
    wipeAllData,
  } = useFinanceVault(showToast);

  if (hasVault === null) {
    return null; // Aguardando leitura inicial do IndexedDB
  }

  if (!isUnlocked) {
    return (
      <>
        <LockScreen
          hasVault={hasVault}
          onUnlock={unlockWithPin}
          onCreateVault={createVaultWithPin}
          onImportBackup={importBackup}
        />
        <div id="toast" className={toastMessage ? 'o' : ''}>
          {toastMessage}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        ym={ym}
        onShiftMonth={(offset) => setYm((prev) => shiftYearMonth(prev, offset))}
        onLock={lockNow}
      />

      <main>
        {activeTab === 'home' && (
          <DashboardView
            ym={ym}
            transactions={state.tx}
            bills={state.bills}
            onGoToBills={() => setActiveTab('bills')}
          />
        )}

        {activeTab === 'ext' && (
          <StatementView
            ym={ym}
            transactions={state.tx}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {activeTab === 'bills' && (
          <BillsView
            bills={state.bills}
            onTogglePay={togglePayBill}
            onDeleteBill={deleteBill}
            onExportBackup={exportBackup}
            onImportBackup={importBackup}
            onWipeAll={wipeAllData}
            showToast={showToast}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAdd={() => setIsAddOpen(true)}
      />

      <AddEntrySheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddTransaction={addTransaction}
        onAddBill={addBill}
        onAfterSave={(targetTab, targetYm) => {
          if (targetYm) setYm(targetYm);
          if (targetTab === 'bills' || activeTab === 'bills') {
            setActiveTab(targetTab);
          }
        }}
        showToast={showToast}
      />

      <TransactionDetailSheet
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={deleteTransaction}
      />

      <div id="toast" className={toastMessage ? 'o' : ''}>
        {toastMessage}
      </div>
    </>
  );
}

export default App;
