import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Income, IncomeAllocation } from '../types';
import { fmt } from '../utils/taxCalc';

interface Props {
  income: Income;
  onSave: (income: Income) => void;
}

const PRESET_LABELS = ['貯蓄', '税金積立', '固定費', 'RINGI予算', '自由費', 'その他'];

type InputMode = 'amount' | 'percent';

export default function IncomeAllocationEditor({ income, onSave }: Props) {
  const netAmount = income.amount - (income.outsourcingCost ?? 0);
  const allocations: IncomeAllocation[] = income.allocations ?? [];
  const allocatedTotal = allocations.reduce((s, a) => s + a.amount, 0);
  const remaining = netAmount - allocatedTotal;

  const [label, setLabel] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [editingId, setEditingId] = useState<string | null>(null);

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
    const newItem: IncomeAllocation = { id: uuidv4(), label: label.trim(), amount: enteredAmount() };
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
              <span className="text-xs text-gray-600 flex-1">{a.label}</span>
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

      {/* 追加フォーム */}
      <div className="bg-gray-50 rounded-xl p-2.5 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LABELS.map(p => (
            <button
              key={p}
              onClick={() => setLabel(p)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                label === p ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-2 focus:outline-none focus:border-violet-400 bg-white"
          placeholder="または項目名を入力..."
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
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
            className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-semibold disabled:opacity-40"
          >
            追加
          </button>
        </div>
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
