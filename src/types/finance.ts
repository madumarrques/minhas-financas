export type TransactionType = 'in' | 'out';

export type PaymentMethod = 'Pix' | 'Crédito' | 'Débito' | 'Dinheiro' | 'Outro';

export type CategoryName =
  | 'Casa'
  | 'Mercado'
  | 'Lazer'
  | 'Transporte'
  | 'Assinaturas'
  | 'Delivery'
  | 'Saúde'
  | 'Cuidado pessoal'
  | 'Estudos'
  | 'Roupas'
  | 'Outros';

export interface Transaction {
  id: string;
  type: TransactionType;
  desc: string;
  val: number;
  cat: CategoryName | 'Entrada';
  pay?: string;
  date: string;
  img?: string;
  bid?: string;
  gid?: string;
  inst?: { current: number; total: number };
}

export interface Bill {
  id: string;
  desc: string;
  val: number;
  day: number;
  cat: CategoryName;
  paid: Record<string, number>;
}

export interface FinanceState {
  tx: Transaction[];
  bills: Bill[];
}

export interface EncryptedVault {
  s: string;
  i: string;
  d: string;
  v?: number;
  updated?: string;
}

export type ActiveTab = 'home' | 'ext' | 'bills';
export type SheetMode = 'out' | 'in' | 'bill';

export interface BillStatus {
  paid: boolean;
  diff: number;
  dd: number;
}
