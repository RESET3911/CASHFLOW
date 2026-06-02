import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Income, IncomeAllocation, TaxSettings } from '../types';
import { BUSINESS_EXPENSE_CATEGORY_LABELS, type BusinessExpenseCategory } from '../types';
import { calcTax, fmt } from '../utils/taxCalc';

interface Props {
  income: Income;
  onSave: (income: Income) => void;
  taxSettings?: TaxSettings;
  salaryIncome?: number;
}

const PRESET_LABELS = ['貯蓄', '税金積立', '固定費', 'RINGI予算', '自由費', 'その他'];
const EXPENSE_CATEGORIES = Object.keys(BUSINESS_EXPENSE_CATEGORY_LABELS) as BusinessExpenseCategory[];

type InputMode = 'amount' | 'percent';

export default function IncomeAllocationEditor({ income, onSave, taxSettings, salaryIncome = 0 }: Props) {
  const netAmount = income.amount - (income.outsourcingCost ?? 0);
  const allocations: IncomeAllocation[] = income.allocations ?? [];
  const allocatedTotal = allocations.reduce((s, a) => s + a.amount, 0);
  const remaining = netAmount - allocatedTotal;

  const [label, setLabel] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExpense, setIsExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BusinessExpenseCategory>('supplies');

  const enteredAmount = (): number => {
    const n = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return 0;
    return inputMode === 'percent' ? Math.round(netAmount * n / 100) : n;
  };

  const enteredPercent = (): number => {
    const n = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return 0;
    return inputMode === 'amount' ? Math.round(n / netAmount * 100) : n;
  };

  const handleAdd = () => {
    if (!label.trim() || enteredAmount() <= 0) return;
    const newItem: IncomeAllocation = {
      id: uuidv4(),
      label: label.trim(),
      amount: enteredAmount(),
      ...(isExpense ? { category: selectedCategory } : {}),
    };
    onSave({ ...income, allocations: [...allocations, newItem] });
    setLabel('');
    setValueStr('');
  };

  const handleDelete = (id: string) => {
    onSave({ ...income, allocations: allocations.filter(a => a.id !== id) });
  };

  const handleEdit = (id: string, newAmount: number) => {
    onSave({
      ...income,
      allocations: allocations.map(a => a.id === id ? { ...a, amount: newAmount } : a),
    });
    setEditingId(null);
  };

  const pct = (amount: number) =>
    netAmount > 0 ? Math.round(amount / netAmount * 100) : 0;

  const barColor = (i: number) => {
    const colors = ['bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-sky-400', 'bg-orange-400'];
    return colors[i % colors.length];
  };

  const expenseAllocTotal = allocations.filter(a => a.category).reduce((s, a) => s + a.amount, 0);

  const taxImpact = useMemo(() => {
    if (!taxSettings || expenseAllocTotal <= 0) return null;
    const annualExpense = expenseAllocTotal;
    const base = calcTax({
      businessIncome: Math.max(0, netAmount * 12),
      salaryIncome,
      pension: taxSettings.pension,
      nhiPremium: taxSettings.nhiPremium,
    });
    const after = calcTax({
      businessIncome: Math.max(0, (netAmount - annualExpense) * 12),
      salaryIncome,
      pension: taxSettings.pension,
      nhiPremium: taxSettings.nhiPremium,
    });
    const saving = base.totalTax - after.totalTax;
    return { saving: Math.round(saving / 12), annualSaving: saving };
  }, [taxSettings, expenseAllocTotal, netAmount, salaryIncome]);

  const previewTaxSaving = useMemo(() => {
    if (!taxSettings || !isExpense || enteredAmount() <= 0) return null;
    const base = calcTax({
      businessIncome: Math.max(0, netAmount * 12),
      salaryIncome,
      pension: taxSettings.pension,
      nhiPremium: taxSettings.nhiPremium,
    });
    const after = calcTax({
      businessIncome: Math.max(0, (netAmount - enteredAmount()) * 12),
      salaryIncome,
      pension: taxSettings.pension,
      nhiPremium: taxSettings.nhiPremium,
    });
    return Math.round((base.totalTax - after.totalTax) / 12);
  }, [taxSettings, isExpense, valueStr, inputMode, netAmount, salaryIncome]);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">配分計画</span>
        <span className={`text-xs font-semibold ${remaining === 0 ? 'text-emerald-600' : remaining < 0 ? 'text-red-500' : 'text-amber-500'}`}>
          {remaining === 0 ? '✓ 完了' : remaining < 0 ? `超過 ${fmt(Math.abs(remaining))}` : `未割当 ${fmt(remaining)} (${pct(remaining)}%)`}
        </span>
      </div>

      {/* 積み上げバー */}
      {netAmount > 0 && (
        <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden mb-3">
          {allocations.map((a, i) => (
            <div
              key={a.id}
              className={`h-full ${barColor(i)} transition-all`}
              style={{ width: `${Math.min(100, pct(a.amount))}%` }}
            />
          ))}
        </div>
      )}

      {/* 配分リスト */}
      {allocations.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {allocations.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${barColor(i)}`} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600">{a.label}</span>
                {a.category && (
                  <span className="ml-1 text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {BUSINESS_EXPENSE_CATEGORY_LABELS[a.category]}
                  </span>
                )}
              </div>
              {editingId === a.id ? (
                <EditRow
                  defaultAmount={a.amount}
                  netAmount={netAmount}
                  onSave={v => handleEdit(a.id, v)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <span className="text-xs font-mono text-gray-800">{fmt(a.amount)}</span>
                  <span className="text-xs text-gray-400">({pct(a.amount)}%)</span>
                  <button onClick={() => setEditingId(a.id)} className="text-xs text-violet-500 px-1.5 py-0.5 rounded bg-violet-50">編集</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 px-1.5 py-0.5 rounded bg-red-50">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 経費節税サマリー */}
      {taxImpact && (
        <div className="mb-3 bg-indigo-50 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-indigo-700">💡 経費計上による節税（月換算）</span>
          <span className="text-xs font-bold text-indigo-700">△ {fmt(taxImpact.saving)}</span>
        </div>
      )}

      {/* 追加フォーム */}
      <div className="bg-gray-50 rounded-xl p-2.5 space-y-2">
        {/* プリセット + 経費ボタン */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LABELS.map(p => (
            <button
              key={p}
              onClick={() => { setLabel(p); setIsExpense(false); }}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                label === p && !isExpense ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => { setIsExpense(e => !e); if (!isExpense) setLabel('経費'); else setLabel(''); }}
            className={`text-xs px-2 py-1 rounded-lg transition-colors font-semibold ${
              isExpense ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-300'
            }`}
          >
            💼 経費
          </button>
        </div>

        {/* 勘定科目（経費モード時） */}
        {isExpense && (
          <div className="bg-white rounded-lg p-2 border border-indigo-200">
            <div className="text-xs text-indigo-500 mb-1.5 font-medium">勘定科目</div>
            <div className="flex flex-wrap gap-1">
              {EXPENSE_CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {BUSINESS_EXPENSE_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ラベル入力（経費以外） */}
        {!isExpense && (
          <input
            className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-2 focus:outline-none focus:border-violet-400 bg-white"
            placeholder="または項目名を入力..."
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        )}

        {/* 金額入力 */}
        <div className="flex gap-1.5">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            {(['amount', 'percent'] as InputMode[]).map(m => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  inputMode === m ? 'bg-violet-500 text-white' : 'bg-white text-gray-500'
                }`}
              >
                {m === 'amount' ? '¥' : '%'}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <input
              type="number"
              className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white"
              placeholder={inputMode === 'amount' ? '金額' : '例: 30'}
              value={valueStr}
              onChange={e => setValueStr(e.target.value)}
              inputMode="numeric"
            />
            {valueStr && enteredAmount() > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {inputMode === 'percent' ? fmt(enteredAmount()) : `${enteredPercent()}%`}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!label.trim() || enteredAmount() <= 0}
            className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-40 ${
              isExpense ? 'bg-indigo-500' : 'bg-violet-500'
            }`}
          >
            追加
          </button>
        </div>

        {/* 経費節税プレビュー */}
        {previewTaxSaving !== null && previewTaxSaving > 0 && (
          <div className="bg-indigo-50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-xs text-indigo-600">この経費の節税効果（月換算）</span>
            <span className="text-xs font-bold text-indigo-700">△ {fmt(previewTaxSaving)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EditRow({ defaultAmount, netAmount, onSave, onCancel }: {
  defaultAmount: number;
  netAmount: number;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(String(defaultAmount));
  const [mode, setMode] = useState<InputMode>('amount');

  const amount = (() => {
    const n = parseFloat(val.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return 0;
    return mode === 'percent' ? Math.round(netAmount * n / 100) : n;
  })();

  return (
    <>
      <div className="flex rounded overflow-hidden border border-gray-200">
        {(['amount', 'percent'] as InputMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-1.5 py-0.5 text-xs ${mode === m ? 'bg-violet-500 text-white' : 'bg-white text-gray-400'}`}
          >{m === 'amount' ? '¥' : '%'}</button>
        ))}
      </div>
      <input
        type="number"
        className="w-20 text-xs rounded border border-gray-200 px-1.5 py-0.5 focus:outline-none"
        value={val}
        onChange={e => setVal(e.target.value)}
        inputMode="numeric"
      />
      <button onClick={() => amount > 0 && onSave(amount)} className="text-xs text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50">✓</button>
      <button onClick={onCancel} className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100">✕</button>
    </>
  );
}
