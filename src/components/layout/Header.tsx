import { MONTH_NAMES } from '../../utils/constants';

interface HeaderProps {
  ym: string;
  onShiftMonth: (offset: number) => void;
  onLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({ ym, onShiftMonth, onLock }) => {
  const [year, month] = ym.split('-');
  const monthLabel = MONTH_NAMES[Number(month) - 1];

  return (
    <header className="top">
      <div>
        <small className="k">Minhas Finanças</small>
        <h1>
          {monthLabel} <i>{year}</i>
        </h1>
        <div className="mnav">
          <button type="button" onClick={() => onShiftMonth(-1)} aria-label="Mês anterior">
            ‹
          </button>
          <button type="button" onClick={() => onShiftMonth(1)} aria-label="Próximo mês">
            ›
          </button>
        </div>
      </div>
      <button type="button" className="ghost" onClick={onLock}>
        Bloquear
      </button>
    </header>
  );
};
