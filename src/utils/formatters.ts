import { Bill, BillStatus } from '../types/finance';

export const formatCurrency = (val: number): string =>
  'R$ ' + val.toLocaleString('pt-BR', {
    minimumFractionDigits: val % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });

export const getYearMonth = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getTodayISO = (): string => {
  const now = new Date();
  return `${getYearMonth(now)}-${String(now.getDate()).padStart(2, '0')}`;
};

export const isoToBRDate = (iso: string): string => {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const brDateToISO = (br: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const maskBRDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const generateId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export const parseCurrencyInput = (raw: string): number => {
  let clean = String(raw).trim();
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(clean);
};

export const shiftYearMonth = (ym: string, offset: number): string => {
  const [y, m] = ym.split('-').map(Number);
  return getYearMonth(new Date(y, m - 1 + offset, 1));
};

export const getBillStatus = (bill: Bill): BillStatus => {
  const now = new Date();
  const currentYm = getYearMonth(now);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dueDay = Math.min(bill.day, lastDayOfMonth);

  return {
    paid: Boolean(bill.paid && bill.paid[currentYm]),
    diff: dueDay - now.getDate(),
    dd: dueDay,
  };
};

export const getBillStatusLabel = (status: BillStatus): string => {
  if (status.paid) return 'Pago neste mês';
  if (status.diff < 0) return `Venceu há ${-status.diff} dia${status.diff < -1 ? 's' : ''}`;
  if (status.diff === 0) return 'Vence hoje';
  return `Vence em ${status.diff} dia${status.diff > 1 ? 's' : ''}`;
};

export const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 720 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
