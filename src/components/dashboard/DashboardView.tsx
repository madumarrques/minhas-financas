import { useMemo } from 'react';
import { Bill, Transaction } from '../../types/finance';
import {
  formatCurrency,
  getBillStatus,
  getBillStatusLabel,
  shiftYearMonth,
} from '../../utils/formatters';
import { SummaryCards } from './SummaryCards';
import { DonutChart } from './DonutChart';
import { MonthlyBars } from './MonthlyBars';

interface DashboardViewProps {
  ym: string;
  transactions: Transaction[];
  bills: Bill[];
  onGoToBills: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  ym,
  transactions,
  bills,
  onGoToBills,
}) => {
  const getMonthSummary = (targetYm: string) => {
    const list = transactions.filter((t) => t.date.startsWith(targetYm));
    const income = list.filter((t) => t.type === 'in').reduce((s, t) => s + t.val, 0);
    const expense = list.filter((t) => t.type === 'out').reduce((s, t) => s + t.val, 0);
    return { income, expense, balance: income - expense };
  };

  const getCategoryMap = (targetYm: string) => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(targetYm) && t.type === 'out')
      .forEach((t) => {
        map[t.cat] = (map[t.cat] || 0) + t.val;
      });
    return map;
  };

  const currentSummary = useMemo(() => getMonthSummary(ym), [transactions, ym]);

  const sortedCategories = useMemo(() => {
    const map = getCategoryMap(ym);
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions, ym]);

  const last6Months = useMemo(
    () => [-5, -4, -3, -2, -1, 0].map((offset) => shiftYearMonth(ym, offset)),
    [ym]
  );

  const last6Balances = useMemo(
    () => last6Months.map((m) => getMonthSummary(m).balance),
    [last6Months, transactions]
  );

  const biggestIncrease = useMemo<{ cat: string; diff: number; prev: number } | null>(() => {
    const prevMap = getCategoryMap(shiftYearMonth(ym, -1));
    let best: { cat: string; diff: number; prev: number } | null = null;
    sortedCategories.forEach(([cat, val]) => {
      const prev = prevMap[cat] || 0;
      const diff = val - prev;
      if (prev > 0 && (!best || diff > best.diff)) {
        best = { cat, diff, prev };
      }
    });
    return best;
  }, [sortedCategories, transactions, ym]);

  const upcomingBills = useMemo(
    () =>
      bills
        .map((bill) => ({ bill, status: getBillStatus(bill) }))
        .filter((item) => !item.status.paid && item.status.diff <= 7)
        .sort((a, b) => a.status.diff - b.status.diff),
    [bills]
  );

  return (
    <>
      <SummaryCards
        income={currentSummary.income}
        expense={currentSummary.expense}
        balance={currentSummary.balance}
      />

      <DonutChart
        totalExpense={currentSummary.expense}
        categoryTotals={sortedCategories}
      />

      <MonthlyBars months={last6Months} balances={last6Balances} />

      {biggestIncrease && (
        <div className="card tip">
          ✦ {biggestIncrease.cat} subiu{' '}
          <b>{Math.round((biggestIncrease.diff / biggestIncrease.prev) * 100)}%</b> em relação ao
          mês anterior. Se voltar ao nível anterior, sobram{' '}
          <b>{formatCurrency(biggestIncrease.diff)}</b> a mais por mês.
        </div>
      )}

      {upcomingBills.length > 0 && (
        <div className="card">
          <small className="t">Contas para os próximos dias</small>
          {upcomingBills.map(({ bill, status }) => (
            <div key={bill.id} className="li" onClick={onGoToBills}>
              <div className="d">
                <b>{bill.desc}</b>
                <small className={status.diff < 0 ? 'late' : ''}>
                  {getBillStatusLabel(status)}
                </small>
              </div>
              <span>{formatCurrency(bill.val)}</span>
            </div>
          ))}
        </div>
      )}

      {transactions.length === 0 && bills.length === 0 && (
        <div className="empty">
          Toque em + para registrar seu primeiro gasto, entrada ou conta fixa.
        </div>
      )}
    </>
  );
};
