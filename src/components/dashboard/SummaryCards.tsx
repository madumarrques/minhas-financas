import { formatCurrency } from '../../utils/formatters';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  income,
  expense,
  balance,
}) => (
  <div className="row3">
    <div className="card">
      <small>Entrou</small>
      <b>{formatCurrency(income)}</b>
    </div>
    <div className="card">
      <small>Saiu</small>
      <b>{formatCurrency(expense)}</b>
    </div>
    <div className="card">
      <small>Sobrou</small>
      <b className={balance >= 0 ? 'ok' : 'neg'}>{formatCurrency(balance)}</b>
    </div>
  </div>
);
