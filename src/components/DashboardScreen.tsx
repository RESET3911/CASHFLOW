import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Income, Expense, BusinessExpense, TaxSettings } from '../types';
import { calcTax, calcYTDProjection, fmt } from '../utils/taxCalc';

interface Props {
  incomes: Income[];
  expenses: Expense[];
  businessExpenses: BusinessExpense[];
  taxSettings: TaxSettings;
}

function getYearMonth(dateStr: string) {
  return dateStr.substring(0, 7);
}

export default function DashboardScreen({
  incomes, expenses, businessExpenses, taxSettings,
}: Props) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisYM = `${thisYear}-${String(thisMonth).padStart(2, '0')}`;

  const monthlyFixed = useMemo(
    () => incomes.filter(i => i.incomeType === 'fixed' && getYearMonth(i.invoiceDate) === thisYM)
      .reduce((s, i) => s + i.amount, 0),
    [incomes, thisYM],
  );
  const monthlyVariable = useMemo(
    () => incomes.filter(i => i.incomeType === 'variable' && getYearMonth(i.invoiceDate) === thisYM)
      .reduce((s, i) => s + i.amount, 0),
    [incomes, thisYM],
  );
  const monthlyIncome = monthlyFixed + monthlyVariable;

  const activeExpenses = useMemo(() => expenses.filter(e => e.isActive), [expenses]);
  const monthlyFixedExp = activeExpenses.filter(e => e.expenseType === 'fixed').reduce((s, e) => s + e.amount, 0);
  const monthlySemiFixedExp = activeExpenses.filter(e => e.expenseType === 'semi_fixed').reduce((s, e) => s + e.amount, 0);
  const monthlyVariableExp = activeExpenses.filter(e => e.expenseType === 'variable').reduce((s, e) => s + e.amount, 0);
  const monthlyExpenseTotal = monthlyFixedExp + monthlySemiFixedExp + monthlyVariableExp;

  const monthlyBizExp = useMemo(
    () => businessExpenses.filter(e => e.date.startsWith(thisYM)).reduce((s, e) => s + e.amount, 0),
    [businessExpenses, thisYM],
  );

  const ytdVariableMonthly = useMemo(() => {
    return Array.from({ length: thisMonth }, (_, i) => {
      const ym = `${thisYear}-${String(i + 1).padStart(2, '0')}`;
      return incomes
        .filter(inc => inc.incomeType === 'variable' && getYearMonth(inc.invoiceDate) === ym)
        .reduce((s, inc) => s + inc.amount, 0);
    });
  }, [incomes, thisYear, thisMonth]);

  const projectedVariableAnnual = calcYTDProjection(ytdVariableMonthly, thisMonth);
  const projectedAnnualBizExp = businessExpenses
    .filter(e => e.date.startsWith(String(thisYear)))
    .reduce((s, e) => s + e.amount, 0) / thisMonth * 12;
  const projectedBusinessIncome = Math.max(0, projectedVariableAnnual - projectedAnnualBizExp);

  const effectiveSalaryIncome = taxSettings.salaryIncome > 0
    ? taxSettings.salaryIncome
    : incomes.filter(i => i.incomeType === 'fixed' && i.invoiceDate.startsWith(String(thisYear)))
        .reduce((s, i) => s + i.amount, 0) / thisMonth * 12;

  const tax = useMemo(() => calcTax({
    businessIncome: projectedBusinessIncome,
    salaryIncome: effectiveSalaryIncome,
    pension: taxSettings.pension,
    nhiPremium: taxSettings.nhiPremium,
  }), [projectedBusinessIncome, effectiveSalaryIncome, taxSettings]);

  const netMonthly = monthlyIncome - monthlyExpenseTotal - monthlyBizExp - tax.monthlyProvision;

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 1 - (5 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const fixedInc = incomes.filter(inc => inc.incomeType === 'fixed' && getYearMonth(inc.invoiceDate) === ym)
        .reduce((s, inc) => s + inc.amount, 0);
      const varInc = incomes.filter(inc => inc.incomeType === 'variable' && getYearMonth(inc.invoiceDate) === ym)
        .reduce((s, inc) => s + inc.amount, 0);
      const bizExp = businessExpenses
        .filter(e => e.date.startsWith(ym))
        .reduce((s, e) => s + e.amount, 0);
      return {
        month: `${d.getMonth() + 1}月`,
        固定給: fixedInc,
        変動収入: varInc,
        支出: monthlyExpenseTotal,
        経費: bizExp,
        税金積立: (fixedInc + varInc) > 0 ? tax.monthlyProvision : 0,
      };
    });
  }, [incomes, businessExpenses, thisYear, thisMonth, monthlyExpenseTotal, tax.monthlyProvision]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{thisYear}年{thisMonth}月</h2>
      </div>

      {/* 収入内訳 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 mb-2">当月収入</div>
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
            <div className="text-xs text-emerald-600">🏢 固定給</div>
            <div className="font-bold text-emerald-800 text-sm">{fmt(monthlyFixed)}</div>
          </div>
          <div className="flex-1 bg-violet-50 rounded-xl px-3 py-2">
            <div className="text-xs text-violet-600">💼 変動収入</div>
            <div className="font-bold text-violet-800 text-sm">{fmt(monthlyVariable)}</div>
          </div>
        </div>
        <div className="text-right text-sm font-bold text-gray-800">合計 {fmt(monthlyIncome)}</div>
      </div>

      {/* 支出内訳 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 mb-2">月次支出（有効）</div>
        <div className="flex gap-1.5 mb-2">
          <div className="flex-1 bg-rose-50 rounded-xl px-2 py-2">
            <div className="text-xs text-rose-600">📌 固定費</div>
            <div className="font-bold text-rose-800 text-sm">{fmt(monthlyFixedExp)}</div>
          </div>
          <div className="flex-1 bg-orange-50 rounded-xl px-2 py-2">
            <div className="text-xs text-orange-600">〜 準固定費</div>
            <div className="font-bold text-orange-800 text-sm">{fmt(monthlySemiFixedExp)}</div>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl px-2 py-2">
            <div className="text-xs text-amber-600">🔄 変動費</div>
            <div className="font-bold text-amber-800 text-sm">{fmt(monthlyVariableExp)}</div>
          </div>
        </div>
        <div className="text-right text-sm font-bold text-gray-800">合計 {fmt(monthlyExpenseTotal)}</div>
      </div>

      {/* 当月経費 */}
      {monthlyBizExp > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 mb-2">当月経費（仕事の経費）</div>
          <div className="flex gap-2">
            <div className="flex-1 bg-indigo-50 rounded-xl px-3 py-2">
              <div className="text-xs text-indigo-600">🧾 経費合計</div>
              <div className="font-bold text-indigo-800 text-sm">{fmt(monthlyBizExp)}</div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <div className="text-xs text-gray-400">経費差引後の収入</div>
              <div className="font-bold text-gray-700 text-sm">{fmt(Math.max(0, monthlyIncome - monthlyBizExp))}</div>
            </div>
          </div>
        </div>
      )}

      {/* 手取り・税 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 text-amber-800 rounded-2xl p-4">
          <div className="text-xs font-medium opacity-70 mb-1">税金積立目安</div>
          <div className="text-xl font-bold">{fmt(tax.monthlyProvision)}</div>
          <div className="text-xs opacity-60 mt-0.5">年間推計ベース</div>
        </div>
        <div className={`rounded-2xl p-4 ${netMonthly >= 0 ? 'bg-violet-50 text-violet-800' : 'bg-red-100 text-red-800'}`}>
          <div className="text-xs font-medium opacity-70 mb-1">推定手取り</div>
          <div className="text-xl font-bold">{fmt(Math.max(0, netMonthly))}</div>
          <div className="text-xs opacity-60 mt-0.5">収入-支出-税積立</div>
        </div>
      </div>

      {/* 月別グラフ */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-700 mb-3">直近6ヶ月の収支</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={10}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={v => v >= 10000 ? `${v / 10000}万` : `${v}`}
              width={36}
            />
            <Tooltip formatter={(v) => fmt(Number(v))} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="固定給" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="変動収入" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="支出" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="経費" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="税金積立" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 年間推計 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-700 mb-3">年間推計（{thisYear}年）</div>
        <div className="space-y-2 text-sm">
          {[
            { label: '変動収入（推計年間）', value: fmt(projectedVariableAnnual) },
            { label: '仕事経費（推計年間）', value: fmt(Math.round(projectedAnnualBizExp)) },
            { label: '事業所得推計', value: fmt(projectedBusinessIncome), highlight: true },
            { label: '所得税（復興税込）', value: fmt(tax.incomeTax) },
            { label: '住民税概算', value: fmt(tax.residentTax) },
            { label: '税負担合計', value: fmt(tax.totalTax), highlight: true },
          ].map(row => (
            <div key={row.label} className={`flex justify-between items-center py-1 ${row.highlight ? 'border-t border-gray-100 pt-2' : ''}`}>
              <span className={row.highlight ? 'font-semibold text-gray-900' : 'text-gray-500'}>{row.label}</span>
              <span className={`font-mono ${row.highlight ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-violet-100 text-xs text-violet-600 bg-violet-50 rounded-xl px-3 py-2">
          月次積立目安 <span className="font-bold">{fmt(tax.monthlyProvision)}</span> を確保してください
        </div>
      </div>
    </div>
  );
}
