import { useState, useEffect } from 'react';
import { CategoryName, Transaction } from '../../types/finance';
import { CATEGORY_LIST } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateCategory: (
    id: string,
    newCategory: CategoryName,
    updateAllGroup?: boolean
  ) => Promise<void>;
  onDelete: (id: string, deleteAllGroup?: boolean) => Promise<void>;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  onClose,
  onUpdateCategory,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Outros');
  const [applyToAllInstallments, setApplyToAllInstallments] = useState(true);

  useEffect(() => {
    if (transaction && transaction.cat !== 'Entrada') {
      setSelectedCategory(transaction.cat);
      setApplyToAllInstallments(true);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isExpense = transaction.type === 'out' && transaction.cat !== 'Entrada';
  const hasCategoryChanged = isExpense && selectedCategory !== transaction.cat;

  const handleSaveCategory = async () => {
    if (!hasCategoryChanged) return;
    await onUpdateCategory(
      transaction.id,
      selectedCategory,
      Boolean(transaction.gid && applyToAllInstallments)
    );
    onClose();
  };

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

        {isExpense && (
          <div style={{ marginTop: 14 }}>
            <label>Categoria</label>
            <select
              className="f"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryName)}
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {transaction.gid && transaction.inst && hasCategoryChanged && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  fontSize: 13,
                  textTransform: 'none',
                  letterSpacing: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={applyToAllInstallments}
                  onChange={(e) => setApplyToAllInstallments(e.target.checked)}
                />
                Aplicar para todas as {transaction.inst.total} parcelas
              </label>
            )}

            {hasCategoryChanged && (
              <button
                type="button"
                className="btn"
                style={{ marginTop: 10 }}
                onClick={handleSaveCategory}
              >
                Salvar nova categoria
              </button>
            )}
          </div>
        )}

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
