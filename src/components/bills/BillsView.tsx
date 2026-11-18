import { useMemo, useRef } from 'react';
import { Bill } from '../../types/finance';
import {
  formatCurrency,
  getBillStatus,
  getBillStatusLabel,
} from '../../utils/formatters';

interface BillsViewProps {
  bills: Bill[];
  onTogglePay: (id: string) => void;
  onDeleteBill: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  onWipeAll: () => void;
  showToast: (msg: string) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  onTogglePay,
  onDeleteBill,
  onExportBackup,
  onImportBackup,
  onWipeAll,
  showToast,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const sortedBills = useMemo(
    () =>
      bills
        .map((bill) => ({ bill, status: getBillStatus(bill) }))
        .sort((a, b) => Number(a.status.paid) - Number(b.status.paid) || a.status.dd - b.status.dd),
    [bills]
  );

  const totalMonthly = useMemo(
    () => bills.reduce((sum, b) => sum + b.val, 0),
    [bills]
  );

  return (
    <>
      <h2>Contas a pagar</h2>
      <div className="card">
        {sortedBills.length > 0 ? (
          sortedBills.map(({ bill, status }) => (
            <div key={bill.id} className="li">
              <button
                type="button"
                className={`chk ${status.paid ? 'on' : ''}`}
                onClick={() => onTogglePay(bill.id)}
                aria-label="Marcar como paga"
              />
              <div
                className="d"
                onClick={() => {
                  if (window.confirm('Excluir esta conta fixa?')) {
                    onDeleteBill(bill.id);
                  }
                }}
              >
                <b>{bill.desc}</b>
                <small className={!status.paid && status.diff < 0 ? 'late' : ''}>
                  Dia {status.dd} · {getBillStatusLabel(status)}
                </small>
              </div>
              <span>{formatCurrency(bill.val)}</span>
            </div>
          ))
        ) : (
          <div className="empty">
            Nenhuma conta cadastrada. Toque em + e escolha “Conta fixa”.
          </div>
        )}
      </div>

      {sortedBills.length > 0 && (
        <div className="empty">
          Total mensal: {formatCurrency(totalMonthly)} · Toque no nome para excluir
        </div>
      )}

      <div className="card">
        <small className="t">Segurança e backup (criptografado)</small>
        <div className="bkp-box">
          <button type="button" className="btn sec" onClick={onExportBackup}>
            Exportar backup
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={() => fileRef.current?.click()}
          >
            Restaurar backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              !window.confirm(
                'Substituir todos os dados atuais por este backup? (Você precisará do PIN usado quando o backup foi criado.)'
              )
            ) {
              return;
            }
            try {
              await onImportBackup(file);
            } catch {
              showToast('Arquivo de backup inválido.');
            }
          }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            if (
              window.confirm(
                'Apagar TODOS os dados e o PIN deste aparelho? Esta ação não pode ser desfeita.'
              )
            ) {
              onWipeAll();
            }
          }}
        >
          Apagar todos os dados
        </button>
      </div>
    </>
  );
};
