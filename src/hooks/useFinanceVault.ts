import { useState, useEffect, useCallback, useRef } from 'react';
import { Bill, CategoryName, EncryptedVault, FinanceState, Transaction } from '../types/finance';
import { deleteStoredVault, getStoredVault, saveStoredVault } from '../services/storage';
import { decryptVault, deriveKey, encryptState, generateSalt } from '../services/crypto';
import { generateId, getTodayISO, getYearMonth } from '../utils/formatters';

const EMPTY_STATE: FinanceState = { tx: [], bills: [] };

function addMonthsToISO(isoDate: string, monthsToAdd: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const targetMonthIndex = m - 1 + monthsToAdd;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const safeDay = Math.min(d, lastDay);

  return `${targetYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function useFinanceVault(showToast: (msg: string) => void) {
  const [hasVault, setHasVault] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [state, setState] = useState<FinanceState>(EMPTY_STATE);

  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<Uint8Array | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number>(0);

  const refreshVaultPresence = useCallback(async () => {
    const v = await getStoredVault();
    setHasVault(Boolean(v));
  }, []);

  useEffect(() => {
    refreshVaultPresence();
  }, [refreshVaultPresence]);

  const lockNow = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    setState(EMPTY_STATE);
    setIsUnlocked(false);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
  }, []);

  const bumpIdleTimer = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (keyRef.current) {
      idleTimerRef.current = window.setTimeout(lockNow, 180_000);
    }
  }, [lockNow]);

  useEffect(() => {
    if (!isUnlocked) return;
    bumpIdleTimer();

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, bumpIdleTimer, { passive: true }));

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (keyRef.current && Date.now() - hiddenAtRef.current > 30_000) {
        lockNow();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bumpIdleTimer));
      document.removeEventListener('visibilitychange', onVisibility);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isUnlocked, bumpIdleTimer, lockNow]);

  const persistState = useCallback(
    async (nextState: FinanceState) => {
      if (!keyRef.current || !saltRef.current) return;
      try {
        const encrypted = await encryptState(nextState, keyRef.current, saltRef.current);
        await saveStoredVault(encrypted);
        setState(nextState);
        setHasVault(true);
      } catch {
        showToast('Erro ao salvar no dispositivo');
      }
    },
    [showToast]
  );

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const vault = await getStoredVault();
    if (!vault) return false;
    const { state: decrypted, key, salt } = await decryptVault(vault, pin);
    keyRef.current = key;
    saltRef.current = salt;
    setState(decrypted);
    setIsUnlocked(true);
    return true;
  };

  const createVaultWithPin = async (pin: string): Promise<void> => {
    const salt = generateSalt();
    const key = await deriveKey(pin, salt);
    keyRef.current = key;
    saltRef.current = salt;
    await persistState(EMPTY_STATE);
    setIsUnlocked(true);
  };

  const addTransaction = async (
    tx: Omit<Transaction, 'id'>,
    installments = 1,
    isTotalValue = true
  ) => {
    if (installments <= 1 || tx.type !== 'out') {
      const next: FinanceState = {
        ...state,
        tx: [...state.tx, { ...tx, id: generateId() }],
      };
      await persistState(next);
      showToast('Salvo');
      return;
    }

    const groupId = generateId();
    const totalAmount = isTotalValue ? tx.val : tx.val * installments;
    const basePart = Math.floor((totalAmount / installments) * 100) / 100;
    const firstPart = Number((totalAmount - basePart * (installments - 1)).toFixed(2));

    const generated: Transaction[] = [];
    for (let i = 0; i < installments; i++) {
      generated.push({
        ...tx,
        id: generateId(),
        gid: groupId,
        val: i === 0 ? firstPart : basePart,
        date: addMonthsToISO(tx.date, i),
        inst: { current: i + 1, total: installments },
        img: i === 0 ? tx.img : undefined,
      });
    }

    const next: FinanceState = {
      ...state,
      tx: [...state.tx, ...generated],
    };
    await persistState(next);
    showToast(`${installments} parcelas lançadas`);
  };

  const updateTransactionCategory = async (
    id: string,
    newCategory: CategoryName,
    updateAllGroup = false
  ) => {
    const target = state.tx.find((t) => t.id === id);
    if (!target || target.type === 'in') return;

    const nextTx = state.tx.map((t) => {
      const matches =
        updateAllGroup && target.gid ? t.gid === target.gid : t.id === id;
      return matches ? { ...t, cat: newCategory } : t;
    });

    await persistState({ ...state, tx: nextTx });
    showToast('Categoria atualizada');
  };

  const deleteTransaction = async (id: string, deleteAllGroup = false) => {
    const target = state.tx.find((t) => t.id === id);
    if (!target) return;

    const nextTx =
      deleteAllGroup && target.gid
        ? state.tx.filter((t) => t.gid !== target.gid)
        : state.tx.filter((t) => t.id !== id);

    await persistState({ ...state, tx: nextTx });
  };

  const addBill = async (bill: Omit<Bill, 'id' | 'paid'>) => {
    const next: FinanceState = {
      ...state,
      bills: [...state.bills, { ...bill, id: generateId(), paid: {} }],
    };
    await persistState(next);
    showToast('Conta fixa salva');
  };

  const deleteBill = async (id: string) => {
    const next: FinanceState = {
      ...state,
      bills: state.bills.filter((b) => b.id !== id),
    };
    await persistState(next);
  };

  const togglePayBill = async (id: string) => {
    const target = state.bills.find((b) => b.id === id);
    if (!target) return;

    const currentYm = getYearMonth(new Date());
    const alreadyPaid = Boolean(target.paid?.[currentYm]);
    let nextTx = [...state.tx];

    const nextBills = state.bills.map((b) => {
      if (b.id !== id) return b;
      const updatedPaid = { ...(b.paid || {}) };
      if (alreadyPaid) {
        delete updatedPaid[currentYm];
      } else {
        updatedPaid[currentYm] = 1;
      }
      return { ...b, paid: updatedPaid };
    });

    if (alreadyPaid) {
      nextTx = nextTx.filter((t) => !(t.bid === id && t.date.startsWith(currentYm)));
    } else {
      nextTx.push({
        id: generateId(),
        type: 'out',
        desc: target.desc,
        val: target.val,
        cat: target.cat,
        date: getTodayISO(),
        bid: id,
      });
    }

    await persistState({ tx: nextTx, bills: nextBills });
  };

  const exportBackup = async () => {
    const vault = await getStoredVault();
    if (!vault) {
      showToast('Nenhum dado para exportar');
      return;
    }
    const blob = new Blob([JSON.stringify(vault)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minhas-financas-backup-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup criptografado baixado');
  };

  const importBackup = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as EncryptedVault;
    if (!parsed.s || !parsed.i || !parsed.d) {
      throw new Error('Formato de backup inválido');
    }
    await saveStoredVault(parsed);
    await refreshVaultPresence();
    lockNow();
    showToast('Backup restaurado! Digite o PIN dele.');
  };

  const wipeAllData = async () => {
    await deleteStoredVault();
    localStorage.removeItem('vault');
    setHasVault(false);
    lockNow();
  };

  return {
    hasVault,
    isUnlocked,
    state,
    unlockWithPin,
    createVaultWithPin,
    lockNow,
    addTransaction,
    updateTransactionCategory,
    deleteTransaction,
    addBill,
    deleteBill,
    togglePayBill,
    exportBackup,
    importBackup,
    wipeAllData,
  };
}
