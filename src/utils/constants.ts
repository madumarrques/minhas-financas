import { CategoryName, PaymentMethod } from '../types/finance';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

export const CATEGORIES: Record<CategoryName, string> = {
  Casa: '#a8c39a',
  Mercado: '#ead9a0',
  Lazer: '#eaaea0',
  Transporte: '#9dbfe0',
  Assinaturas: '#c3b5e6',
  Delivery: '#f0c8a0',
  Saúde: '#a5d3c8',
  Outros: '#d3cabb',
};

export const CATEGORY_LIST = Object.keys(CATEGORIES) as CategoryName[];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Crédito',
  'Débito',
  'Dinheiro',
  'Outro',
];
