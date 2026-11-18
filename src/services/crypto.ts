import { EncryptedVault, FinanceState } from '../types/finance';

const toBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
};

const fromBase64 = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const generateSalt = (): Uint8Array =>
  crypto.getRandomValues(new Uint8Array(16));

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 300000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptState(
  state: FinanceState,
  key: CryptoKey,
  salt: Uint8Array
): Promise<EncryptedVault> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(state));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    s: toBase64(salt),
    i: toBase64(iv),
    d: toBase64(cipher),
    v: 2,
    updated: new Date().toISOString(),
  };
}

export async function decryptVault(
  vault: EncryptedVault,
  pin: string
): Promise<{ state: FinanceState; key: CryptoKey; salt: Uint8Array }> {
  const salt = fromBase64(vault.s);
  const key = await deriveKey(pin, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(vault.i).buffer as ArrayBuffer },
    key,
    fromBase64(vault.d).buffer as ArrayBuffer
  );

  const state = JSON.parse(new TextDecoder().decode(plainBuffer)) as FinanceState;
  return { state, key, salt };
}
