import { useState, useMemo } from 'react';
import type { Expense, ExpenseType } from '../types';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS, EXPENSE_TYPE_LABELS } from '../types';
import { fmt } from '../utils/taxCalc';
import AddExpenseModal from './AddExpenseModal';

interface Props {
  expenses: Expense[];
  onSave: (item: Expense) => void;
  onDelete: (id: string) => void;
  onToggle: (item: Expense) => void;
}

type Tab = 'fixed' | 'semi_fixed' | 'variable' | 'business_fixed';

export default function ExpenseScreen({ expenses, onSave, onDelete, onToggle }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<ExpenseType>('fixed');
  const [editItem, setEditItem] = useState<Expense | undefined>();
  const [tab, setTab] = useState<Tab>('fixed');

  const fixedItems = useMemo(() => expenses.filter(e => e.expenseType === 'fixed'), [expenses]);
  const semiFixedItems = useMemo(() => expenses.filter(e => e.expenseType === 'semi_fixed'), [expenses]);
  const variableItems = useMemo(() => expenses.filter(e => e.expenseType === 'variable'), [expenses]);
  const bizFixedItems = useMemo(() => expenses.filter(e => e.expenseType === 'business_fixed'), [expenses]);

  const currentItems =
    tab === 'fixed' ? fixedItems :
    tab === 'semi_fixed' ? semiFixedItems :
    tab === 'business_fixed' ? bizFixedItems :
    variableItems;

  const fixedActiveTotal = fixedItems.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
  const semiFixedActiveTotal = semiFixedItems.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
  const variableActiveTotal = variableItems.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
  const bizFixedActiveTotal = bizFixedItems.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
  const totalActive = fixedActiveTotal + semiFixedActiveTotal + variableActiveTotal + bizFixedActiveTotal;

  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const item of currentItems) {
      (map[item.category] ??= []).push(item);
    }
    return Object.entries(map).map(([cat, items]) => ({
      cat: cat as Expense['category'],
      items: items.sort((a, b) => a.createdAt - b.createdAt),
    }));
  }, [currentItems]);

  const openAdd = (type: ExpenseType) => {
    setAddType(type);
    setEditItem(undefined);
    setShowAdd(true);
  };

  return (
    <div className="flex flex-col pb-28">
      <div className="flex items-center justify-between px-4 pt-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">支出管理</h2>
          <p className="text-xs text-gray-400">月額合計（有効）{fmt(totalActive)}</p>
        </div>
        <button
          onClick={() => openAdd(tab)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          <span>+</span> 追加
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-4">
        <div className="bg-rose-50 rounded-2xl px-2 py-2.5">
          <div className="text-xs text-rose-600">📌 固定費</div>
          <div className="font-bold text-rose-800 text-sm">{fmt(fixedActiveTotal)}<span className="text-xs font-normal">/月</span></div>
        </div>
        <div className="bg-orange-50 rounded-2xl px-2 py-2.5">
          <div className="text-xs text-orange-600">〜 準固定費</div>
          <div className="font-bold text-orange-800 text-sm">{fmt(semiFixedActiveTotal)}<span className="text-xs font-normal">/月</span></div>
        </div>
        <div className="bg-amber-50 rounded-2xl px-2 py-2.5">
          <div className="text-xs text-amber-600">🔄 変動費</div>
          <div className="font-bold text-amber-800 text-sm">{fmt(variableActiveTotal)}<span className="text-xs font-normal">/月</span></div>
        </div>
        <div className="bg-indigo-50 rounded-2xl px-2 py-2.5">
          <div className="text-xs text-indigo-600">💼 固定経費</div>
          <div className="font-bold text-indigo-800 text-sm">{fmt(bizFixedActiveTotal)}<span className="text-xs font-normal">/月</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 px-4 mb-4">
        {(['fixed', 'semi_fixed', 'variable', 'business_fixed'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t
                ? t === 'fixed' ? 'bg-rose-500 text-white'
                  : t === 'semi_fixed' ? 'bg-orange-500 text-white'
                  : t === 'business_fixed' ? 'bg-indigo-500 text-white'
                  : 'bg-amber-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {t === 'fixed' ? '📌 固定費' : t === 'semi_fixed' ? '〜 準固定費' : t === 'business_fixed' ? '💼 固定経費' : '🔄 変動費'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-4">
        {currentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <div className="text-4xl mb-3">{tab === 'fixed' ? '📌' : tab === 'semi_fixed' ? '〜' : '🔄'}</div>
            {EXPENSE_TYPE_LABELS[tab]}を追加してください
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <div key={cat}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {EXPENSE_CATEGORY_LABELS[cat]}
              </div>
              <div className="flex flex-col gap-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm transition-opacity ${!item.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggle({ ...item, isActive: !item.isActive })}
                        className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${
                          item.isActive
                            ? tab === 'fixed' ? 'bg-rose-400' : tab === 'semi_fixed' ? 'bg-orange-400' : 'bg-amber-400'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                          style={{ left: item.isActive ? '18px' : '2px' }}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm truncate">{item.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${EXPENSE_CATEGORY_COLORS[item.category]}`}>
                            {EXPENSE_CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        {item.note && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{item.note}</div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-bold text-gray-900 font-mono text-sm">
                          {fmt(item.amount)}<span className="text-xs font-normal text-gray-400">/月</span>
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditItem(item); setShowAdd(true); }}
                            className="text-xs text-violet-500 px-2 py-1 rounded-lg bg-violet-50"
                          >編集</button>
                          <button
                            onClick={() => {
                              if (confirm(`「${item.name}」を削除しますか？`)) onDelete(item.id);
                            }}
                            className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-50"
                          >削除</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          defaultType={addType}
          editItem={editItem}
          onSave={onSave}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
