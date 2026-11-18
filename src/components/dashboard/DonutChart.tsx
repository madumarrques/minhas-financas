import { CATEGORIES } from '../../utils/constants';
import { CategoryName } from '../../types/finance';

interface DonutChartProps {
  totalExpense: number;
  categoryTotals: [string, number][];
}

export const DonutChart: React.FC<DonutChartProps> = ({
  totalExpense,
  categoryTotals,
}) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const formattedCenter =
    totalExpense >= 1000
      ? `${(totalExpense / 1000).toFixed(1).replace('.', ',')} mil`
      : String(Math.round(totalExpense));

  return (
    <div className="card donut">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="var(--bar)"
          strokeWidth="11"
        />
        {totalExpense > 0 &&
          categoryTotals.map(([cat, val]) => {
            const length = (val / totalExpense) * circumference;
            const gap = Math.min(6, length / 2);
            const dashOffset = -accumulated;
            accumulated += length;

            return (
              <circle
                key={cat}
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={CATEGORIES[cat as CategoryName] || '#ccc'}
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(length - gap, 0.1)} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 65 65)"
              />
            );
          })}
        <text
          x="65"
          y="68"
          textAnchor="middle"
          fontFamily="Instrument Serif, Georgia, serif"
          fontSize="22"
          fill="var(--ink)"
        >
          R$ {formattedCenter}
        </text>
        <text x="65" y="84" textAnchor="middle" fontSize="9" fill="var(--mut)">
          Gastos do mês
        </text>
      </svg>

      <div className="leg">
        {categoryTotals.length > 0 ? (
          categoryTotals.slice(0, 6).map(([cat, val]) => (
            <div key={cat}>
              <i style={{ background: CATEGORIES[cat as CategoryName] || '#ccc' }} />
              {cat}
              <em>{Math.round((val / totalExpense) * 100)}%</em>
            </div>
          ))
        ) : (
          <span className="empty" style={{ padding: 0 }}>
            Sem gastos neste mês
          </span>
        )}
      </div>
    </div>
  );
};
