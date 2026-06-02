import { useState, useMemo } from 'react';
import type { TaxSettings } from '../types';
import { BUSINESS_EXPENSE_CATEGORY_LABELS, type BusinessExpenseCategory } from '../types';
import { calcTax, fmt } from '../utils/taxCalc';

interface Props {
  projectedSalesAnnual: number;
  projectedBusinessIncome: number;
  effectiveSalaryIncome: number;
  taxSettings: TaxSettings;
}

type ExpenseMode = 'monthly' | 'onetime';

const CATEGORIES = Object.keys(BUSINESS_EXPENSE_CATEGORY_LABELS) as BusinessExpenseCategory[];

export default function ExpenseTaxSimulator({ projectedSalesAnnual, projectedBusinessIncome, effectiveSalaryIncome, taxSettings }: Props) {
  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [mode, setMode] = useState<ExpenseMode>('monthly');
  const [category, setCategory] = useState<BusinessExpenseCategory>('supplies');

  const amount = parseInt(amountStr.replace(/,/g, ''), 10) || 0;
  const annualExpense = mode === 'monthly' ? amount * 12 : amount;

  const currentTax = useMemo(() => calcTax({
    businessIncome: Math.max(0, projectedBusinessIncome),
    salaryIncome: effectiveSalaryIncome,
    pension: taxSettings.pension,
    nhiPremium: taxSettings.nhiPremium,
  }), [projectedBusinessIncome, effectiveSalaryIncome, taxSettings]);

  const newTax = useMemo(() => calcTax({
    businessIncome: Math.max(0, projectedBusinessIncome - annualExpense),
    salaryIncome: effectiveSalaryIncome,
    pension: taxSettings.pension,
    nhiPremium: taxSettings.nhiPremium,
  }), [projectedBusinessIncome, annualExpense, effectiveSalaryIncome, taxSettings]);

  const taxSaving = currentTax.totalTax - newTax.totalTax;
  const netCost = annualExpense - taxSaving;
  const effectiveRate = annualExpense > 0 ? Math.round((1 - netCost / annualExpense) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-gray-700">経費候補シミュレーター</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          <p className="text-xs text-gray-400">経費として計上した場合の税負担への影響を試算します</p>

          {/* 基準額（売上ベース） */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">売上（年間推計）</span>
              <span className="font-mono text-gray-700">{fmt(projectedSalesAnnual)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">既存経費差引後の事業所得</span>
              <span className="font-mono text-gray-700">{fmt(projectedBusinessIncome)}</span>
            </div>
          </div>

          {/* 種別 */}
          <div className="flex gap-2">
            {(['monthly', 'onetime'] as ExpenseMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  mode === m ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {m === 'monthly' ? '🔄 月額固定経費' : '📄 一時的な経費'}
              </button>
            ))}
          </div>

          {/* 金額 */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              金額{mode === 'monthly' ? '（月額）' : '（一回）'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input
                type="number"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* 勘定科目 */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">勘定科目</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {BUSINESS_EXPENSE_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* 結果 */}
          {amount > 0 && (
            <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
              <div className="text-xs font-semibold text-indigo-700 mb-2">試算結果（年間）</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">現在の税負担</span>
                <span className="font-mono text-gray-800">{fmt(currentTax.totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">この経費計上後</span>
                <span className="font-mono text-gray-800">{fmt(newTax.totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-indigo-200 pt-2">
                <span className="text-emerald-700">節税効果</span>
                <span className="font-mono text-emerald-700">△ {fmt(taxSaving)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">経費額（年間）</span>
                <span className="font-mono text-gray-700">{fmt(annualExpense)}</span>
              </div>
              <div className={`flex justify-between text-sm font-bold border-t border-indigo-200 pt-2 ${netCost < annualExpense ? 'text-violet-700' : 'text-gray-800'}`}>
                <span>実質コスト</span>
                <span className="font-mono">{fmt(Math.max(0, netCost))}</span>
              </div>
              {effectiveRate > 0 && (
                <div className="text-center text-xs text-indigo-600 bg-white rounded-lg py-1.5 mt-1">
                  経費の <span className="font-bold">{effectiveRate}%</span> が税金として還元されます
                  {mode === 'monthly' && <span>（月額実質 <span className="font-bold">{fmt(Math.round(netCost / 12))}</span>）</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
