import { useMemo } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface StatementViewProps {
  ym: string;
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const StatementView: React.FC<StatementViewProps> = ({
  ym,
  transactions,
  onSelectTransaction,
}) => {
  const monthlyList = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(ym))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, ym]
  );

  return (
    <>
      <h2>Extrato</h2>
      <div className="card">
        {monthlyList.length > 0 ? (
          monthlyList.map((t) => (
            <div key={t.id} className="li" onClick={() => onSelectTransaction(t)}>
              <div className="d">
                <b>
                  {t.desc}{' '}
                  {t.inst && (
                    <span style={{ fontSize: 12, color: 'var(--mut)', fontWeight: 400 }}>
                      ({t.inst.current}/{t.inst.total})
                    </span>
                  )}
                </b>
                <small>
                  {t.date.split('-').reverse().slice(0, 2).join('/')} · {t.cat}
                  {t.pay ? ` · ${t.pay}` : ''}
                  {t.img ? ' · 📎' : ''}
                </small>
              </div>
              <span className={t.type === 'in' ? 'ok' : ''}>
                {t.type === 'in' ? '+' : '−'}
                {formatCurrency(t.val)}
              </span>
            </div>
          ))
        ) : (
          <div className="empty">Sem lançamentos neste mês.</div>
        )}
      </div>
    </>
  );
};
