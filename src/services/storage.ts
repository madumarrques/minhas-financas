import { EncryptedVault } from '../types/finance';

const DB_NAME = 'FinancasVaultDB';
const STORE_NAME = 'vault';
const MAIN_KEY = 'main';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredVault(): Promise<EncryptedVault | null> {
  // Migração automática do localStorage legado
  const legacy = localStorage.getItem('vault');
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as EncryptedVault;
      await saveStoredVault(parsed);
      localStorage.removeItem('vault');
      return parsed;
    } catch {
      // ignora se inválido
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(MAIN_KEY);
    req.onsuccess = () => resolve((req.result as EncryptedVault) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStoredVault(vault: EncryptedVault): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(vault, MAIN_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteStoredVault(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(MAIN_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
