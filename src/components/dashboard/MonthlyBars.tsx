import { MONTH_NAMES } from '../../utils/constants';

interface MonthlyBarsProps {
  months: string[];
  balances: number[];
}

export const MonthlyBars: React.FC<MonthlyBarsProps> = ({ months, balances }) => {
  const maxAbs = Math.max(1, ...balances.map(Math.abs));

  return (
    <div className="card">
      <small className="t">Quanto sobrou por mês</small>
      <div className="bars">
        {balances.map((val, idx) => {
          const isCurrent = idx === 5;
          const className = isCurrent ? 'cur' : val < 0 ? 'n' : '';
          const height = Math.max(6, (Math.abs(val) / maxAbs) * 80);
          return <div key={months[idx]} className={className} style={{ height }} />;
        })}
      </div>
      <div className="lbls">
        {months.map((m) => {
          const monthIndex = Number(m.split('-')[1]) - 1;
          return <span key={m}>{MONTH_NAMES[monthIndex].slice(0, 3)}</span>;
        })}
      </div>
    </div>
  );
};
