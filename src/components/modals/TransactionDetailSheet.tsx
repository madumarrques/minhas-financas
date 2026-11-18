import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete: (id: string, deleteAllGroup?: boolean) => Promise<void>;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  onClose,
  onDelete,
}) => {
  if (!transaction) return null;

  return (
    <div id="sheet" className="o" onClick={onClose}>
      <div className="in" onClick={(e) => e.stopPropagation()}>
        <small className="k">
          {transaction.cat} · {transaction.date.split('-').reverse().join('/')}
          {transaction.pay ? ` · ${transaction.pay}` : ''}
          {transaction.inst ? ` · Parcela ${transaction.inst.current} de ${transaction.inst.total}` : ''}
        </small>
        <h1 style={{ fontSize: 26, marginTop: 4 }}>{transaction.desc}</h1>
        <p style={{ marginTop: 6 }}>
          {transaction.type === 'in' ? '+' : '−'}
          {formatCurrency(transaction.val)}
        </p>

        {transaction.img && (
          <img className="thumb" src={transaction.img} alt="Comprovante" />
        )}

        <button
          type="button"
          className="btn s"
          onClick={async () => {
            if (window.confirm('Excluir apenas este lançamento?')) {
              await onDelete(transaction.id, false);
              onClose();
            }
          }}
        >
          {transaction.inst ? 'Excluir apenas esta parcela' : 'Excluir lançamento'}
        </button>

        {transaction.gid && transaction.inst && (
          <button
            type="button"
            className="btn s"
            onClick={async () => {
              if (
                window.confirm(
                  `Excluir todas as ${transaction.inst?.total} parcelas deste gasto?`
                )
              ) {
                await onDelete(transaction.id, true);
                onClose();
              }
            }}
          >
            Excluir todas as {transaction.inst.total} parcelas
          </button>
        )}

        <button type="button" className="btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
};
