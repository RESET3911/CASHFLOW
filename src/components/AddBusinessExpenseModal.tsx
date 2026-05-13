import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { BusinessExpense, BusinessExpenseCategory } from '../types';
import { BUSINESS_EXPENSE_CATEGORY_LABELS } from '../types';

interface Props {
  editItem?: BusinessExpense;
  onSave: (item: BusinessExpense) => void;
  onClose: () => void;
}

const CATEGORIES = Object.keys(BUSINESS_EXPENSE_CATEGORY_LABELS) as BusinessExpenseCategory[];

export default function AddBusinessExpenseModal({ editItem, onSave, onClose }: Props) {
  const today = new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState(editItem?.date ?? today);
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : '');
  const [category, setCategory] = useState<BusinessExpenseCategory>(editItem?.category ?? 'supplies');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [memo, setMemo] = useState(editItem?.memo ?? '');

  const handleSave = () => {
    const num = parseInt(amount.replace(/,/g, ''), 10);
    if (!description.trim() || isNaN(num) || num <= 0) return;
    onSave({
      id: editItem?.id ?? uuidv4(),
      userId: 'shared',
      date,
      amount: num,
      category,
      description: description.trim(),
      memo: memo.trim() || undefined,
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900">
            {editItem ? '経費を編集' : '経費を追加'}
          </h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-gray-400 mb-5">確定申告の必要経費として計上できる支出</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">日付 *</label>
            <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">金額 *</label>
            <input
              className={inputCls}
              type="number"
              placeholder="5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">勘定科目 *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {BUSINESS_EXPENSE_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">内容・摘要 *</label>
            <input
              className={inputCls}
              placeholder="例: Adobe CC月額、交通費（渋谷→六本木）"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">メモ</label>
            <input
              className={inputCls}
              placeholder="任意"
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!description.trim() || !amount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {editItem ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
