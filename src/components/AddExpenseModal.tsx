import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Expense, ExpenseType, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TYPE_LABELS } from '../types';

interface Props {
  defaultType?: ExpenseType;
  editItem?: Expense;
  onSave: (item: Expense) => void;
  onClose: () => void;
}

const FIXED_CATEGORIES: ExpenseCategory[] = ['rent', 'insurance', 'pension', 'health_insurance', 'communication', 'other'];
const VARIABLE_CATEGORIES: ExpenseCategory[] = ['subscription', 'food', 'entertainment', 'communication', 'other'];

export default function AddExpenseModal({ defaultType = 'fixed', editItem, onSave, onClose }: Props) {
  const [expenseType, setExpenseType] = useState<ExpenseType>(editItem?.expenseType ?? defaultType);
  const [name, setName] = useState(editItem?.name ?? '');
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(editItem?.category ?? 'other');
  const [note, setNote] = useState(editItem?.note ?? '');

  const categories = expenseType === 'fixed' ? FIXED_CATEGORIES : VARIABLE_CATEGORIES;

  const handleSave = () => {
    const num = parseInt(amount.replace(/,/g, ''), 10);
    if (!name.trim() || isNaN(num) || num <= 0) return;
    onSave({
      id: editItem?.id ?? uuidv4(),
      name: name.trim(),
      amount: num,
      expenseType,
      category: categories.includes(category) ? category : 'other',
      note: note.trim() || undefined,
      isActive: editItem?.isActive ?? true,
      createdAt: editItem?.createdAt ?? Date.now(),
    });
    onClose();
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-gray-50 w-full rounded-t-3xl p-5 pb-safe max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">
            {editItem ? '支出を編集' : '支出を追加'}
          </h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-5">
          {(['fixed', 'variable'] as ExpenseType[]).map(t => (
            <button
              key={t}
              onClick={() => { setExpenseType(t); setCategory('other'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                expenseType === t
                  ? t === 'fixed'
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {t === 'fixed' ? '📌 ' : '🔄 '}
              {EXPENSE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">項目名 *</label>
            <input
              className={inputCls}
              placeholder={expenseType === 'fixed' ? '例: 家賃' : '例: Adobe CC'}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">月額 *</label>
            <input
              className={inputCls}
              type="number"
              placeholder="3000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {EXPENSE_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">メモ</label>
            <input
              className={inputCls}
              placeholder="任意"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim() || !amount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {editItem ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
