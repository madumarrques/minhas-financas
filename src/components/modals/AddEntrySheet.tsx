import { useState, useRef } from 'react';
import {
  Bill,
  CategoryName,
  PaymentMethod,
  SheetMode,
  Transaction,
} from '../../types/finance';
import { CATEGORY_LIST, PAYMENT_METHODS } from '../../utils/constants';
import {
  compressImage,
  formatCurrency,
  getTodayISO,
  parseCurrencyInput,
} from '../../utils/formatters';

interface AddEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    tx: Omit<Transaction, 'id'>,
    installments?: number,
    isTotalValue?: boolean
  ) => Promise<void>;
  onAddBill: (bill: Omit<Bill, 'id' | 'paid'>) => Promise<void>;
  onAfterSave: (targetTab: 'home' | 'bills', targetYm?: string) => void;
  showToast: (msg: string) => void;
}

export const AddEntrySheet: React.FC<AddEntrySheetProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onAddBill,
  onAfterSave,
  showToast,
}) => {
  const [mode, setMode] = useState<SheetMode>('out');
  const [rawVal, setRawVal] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<CategoryName>('Casa');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [customPayment, setCustomPayment] = useState('');
  const [dateISO, setDateISO] = useState(() => getTodayISO());
  const [dueDay, setDueDay] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [isTotalValue, setIsTotalValue] = useState<boolean>(true);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportsInstallments = paymentMethod === 'Crédito' || paymentMethod === 'Outro';

  const resetForm = (nextMode: SheetMode) => {
    setMode(nextMode);
    setRawVal('');
    setDesc('');
    setDueDay('');
    setPhoto(undefined);
    setPhotoName('');
    setDateISO(getTodayISO());
    setPaymentMethod('Pix');
    setCustomPayment('');
    setInstallments(1);
    setIsTotalValue(true);
  };

  const handlePaymentChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method !== 'Outro') {
      setCustomPayment('');
    }
    if (method !== 'Crédito' && method !== 'Outro') {
      setInstallments(1);
      setIsTotalValue(true);
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  const parsedVal = parseCurrencyInput(rawVal);
  const isInstallment = mode === 'out' && supportsInstallments && installments > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(parsedVal > 0)) {
      showToast('Informe um valor válido');
      return;
    }
    const finalDesc = desc.trim() || 'Sem descrição';

    if (mode === 'bill') {
      const day = parseInt(dueDay, 10);
      if (!(day >= 1 && day <= 31)) {
        showToast('Dia de 1 a 31');
        return;
      }
      await onAddBill({ desc: finalDesc, val: parsedVal, day, cat: category });
      resetForm('out');
      onClose();
      onAfterSave('bills');
    } else {
      if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
        showToast('Selecione uma data válida');
        return;
      }

      const finalInstallments =
        mode === 'out' && supportsInstallments ? installments : 1;

      const finalPaymentLabel =
        mode === 'out'
          ? paymentMethod === 'Outro'
            ? customPayment.trim() || 'Outro'
            : paymentMethod
          : undefined;

      await onAddTransaction(
        {
          type: mode,
          desc: finalDesc,
          val: parsedVal,
          cat: mode === 'in' ? 'Entrada' : category,
          pay: finalPaymentLabel,
          date: dateISO,
          img: photo,
        },
        finalInstallments,
        isTotalValue
      );
      resetForm('out');
      onClose();
      onAfterSave('home', dateISO.slice(0, 7));
    }
  };

  return (
    <div id="sheet" className="o" onClick={onClose}>
      <div className="in" onClick={(e) => e.stopPropagation()}>
        <div className="seg">
          <button
            type="button"
            className={mode === 'out' ? 'on' : ''}
            onClick={() => resetForm('out')}
          >
            Saída
          </button>
          <button
            type="button"
            className={mode === 'in' ? 'on' : ''}
            onClick={() => resetForm('in')}
          >
            Entrada
          </button>
          <button
            type="button"
            className={mode === 'bill' ? 'on' : ''}
            onClick={() => resetForm('bill')}
          >
            Conta fixa
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            {isInstallment
              ? isTotalValue
                ? 'Valor total da compra (R$)'
                : 'Valor de cada parcela (R$)'
              : 'Valor (R$)'}
          </label>
          <input
            className="f"
            inputMode="decimal"
            placeholder="0,00"
            value={rawVal}
            onChange={(e) => setRawVal(e.target.value)}
          />

          <label>Descrição</label>
          <input
            className="f"
            maxLength={60}
            placeholder={mode === 'in' ? 'Salário' : mode === 'bill' ? 'Aluguel' : 'Mercado'}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          {mode !== 'in' && (
            <>
              <label>Categoria</label>
              <select
                className="f"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </>
          )}

          {mode === 'out' && (
            <>
              <label>Forma de pagamento</label>
              <div className="seg" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={paymentMethod === method ? 'on' : ''}
                    style={{ minWidth: '18%', padding: '8px 4px', fontSize: 12 }}
                    onClick={() => handlePaymentChange(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Outro' && (
                <>
                  <label>Qual forma de pagamento?</label>
                  <input
                    className="f"
                    maxLength={30}
                    placeholder="Ex: Boleto, Vale-alimentação, Carnê..."
                    value={customPayment}
                    onChange={(e) => setCustomPayment(e.target.value)}
                  />
                </>
              )}

              {supportsInstallments && (
                <>
                  <label>Parcelamento</label>
                  <select
                    className="f"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    <option value={1}>À vista (1x)</option>
                    {Array.from({ length: 23 }, (_, idx) => idx + 2).map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>

                  {installments > 1 && (
                    <div style={{ marginTop: 8 }}>
                      <div className="seg" style={{ marginBottom: 6 }}>
                        <button
                          type="button"
                          className={isTotalValue ? 'on' : ''}
                          onClick={() => setIsTotalValue(true)}
                        >
                          Valor total
                        </button>
                        <button
                          type="button"
                          className={!isTotalValue ? 'on' : ''}
                          onClick={() => setIsTotalValue(false)}
                        >
                          Valor da parcela
                        </button>
                      </div>
                      {parsedVal > 0 && (
                        <small className="t" style={{ display: 'block', paddingLeft: 4 }}>
                          {isTotalValue
                            ? `Serão ${installments}x de ${formatCurrency(parsedVal / installments)}`
                            : `Total da compra: ${formatCurrency(parsedVal * installments)} (${installments}x)`}
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {mode === 'bill' ? (
            <>
              <label>Dia do vencimento</label>
              <input
                className="f"
                inputMode="numeric"
                maxLength={2}
                placeholder="10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ''))}
              />
            </>
          ) : (
            <>
              <label>{isInstallment ? 'Data da 1ª parcela' : 'Data'}</label>
              <input
                type="date"
                className="f"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
              />
            </>
          )}

          {mode === 'out' && (
            <>
              <label>Comprovante (opcional)</label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoPick}
              />
              <button
                type="button"
                className="btn sec"
                style={{ marginTop: 0, fontWeight: 400, textAlign: 'left' }}
                onClick={() => photoInputRef.current?.click()}
              >
                {photo ? `📎 ${photoName || 'Comprovante anexado'}` : 'Selecionar imagem ou tirar foto'}
              </button>
              {photo && <img className="thumb" src={photo} alt="Prévia do comprovante" />}
            </>
          )}

          <button type="submit" className="btn">
            Salvar
          </button>
          <button type="button" className="btn s" style={{ color: 'var(--mut)' }} onClick={onClose}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};
