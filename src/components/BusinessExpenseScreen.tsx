import { useState, useMemo } from 'react';
import type { BusinessExpense } from '../types';
import { BUSINESS_EXPENSE_CATEGORY_LABELS, BUSINESS_EXPENSE_CATEGORY_COLORS } from '../types';
import { fmt } from '../utils/taxCalc';
import AddBusinessExpenseModal from './AddBusinessExpenseModal';

interface Props {
  expenses: BusinessExpense[];
  onSave: (item: BusinessExpense) => void;
  onDelete: (id: string) => void;
}

export default function BusinessExpenseScreen({ expenses, onSave, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BusinessExpense | undefined>();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = useMemo(() => {
    const set = new Set(expenses.map(e => parseInt(e.date.substring(0, 4))));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [expenses]);

  const yearExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(String(selectedYear))),
    [expenses, selectedYear],
  );

  const monthlyGroups = useMemo(() => {
    const map: Record<string, BusinessExpense[]> = {};
    for (const e of yearExpenses) {
      const ym = e.date.substring(0, 7);
      (map[ym] ??= []).push(e);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ym, items]) => ({
        ym,
        label: `${parseInt(ym.substring(5))}月`,
        items: items.sort((a, b) => b.date.localeCompare(a.date)),
        total: items.reduce((s, e) => s + e.amount, 0),
      }));
  }, [yearExpenses]);

  const categoryTotals = useMemo(() => {
    const map: Partial<Record<BusinessExpense['category'], number>> = {};
    for (const e of yearExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([cat, total]) => ({ cat: cat as BusinessExpense['category'], total: total as number }));
  }, [yearExpenses]);

  const yearTotal = yearExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex flex-col pb-28">
      <div className="flex items-center justify-between px-4 pt-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">仕事の経費</h2>
          <p className="text-xs text-gray-400">確定申告の必要経費</p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowAdd(true); }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          <span>+</span> 追加
        </button>
      </div>

      <div className="flex gap-2 px-4 mb-4 overflow-x-auto">
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === y ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >{y}年</button>
        ))}
      </div>

      {yearTotal > 0 && (
        <>
          <div className="mx-4 mb-3 bg-violet-50 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-violet-700">{selectedYear}年 経費合計</span>
            <span className="font-bold text-violet-900 text-lg">{fmt(yearTotal)}</span>
          </div>
          <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 mb-3">勘定科目別</div>
            <div className="flex flex-col gap-2">
              {categoryTotals.map(({ cat, total }) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${BUSINESS_EXPENSE_CATEGORY_COLORS[cat]}`}>
                      {BUSINESS_EXPENSE_CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-xs font-mono text-gray-700">{fmt(total)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(total / yearTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="px-4 flex flex-col gap-4">
        {monthlyGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <div className="text-4xl mb-3">🧾</div>
            仕事の経費を登録してください
            <div className="text-xs mt-2 text-gray-300">外注費・交通費・消耗品など<br/>確定申告で控除できる支出</div>
          </div>
        ) : (
          monthlyGroups.map(group => (
            <div key={group.ym}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-600">{group.label}</span>
                <span className="text-sm font-mono text-gray-700">{fmt(group.total)}</span>
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${BUSINESS_EXPENSE_CATEGORY_COLORS[item.category]}`}>
                            {BUSINESS_EXPENSE_CATEGORY_LABELS[item.category]}
                          </span>
                          <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                        <div className="text-sm text-gray-800 font-medium truncate">{item.description}</div>
                        {item.memo && <div className="text-xs text-gray-400 mt-0.5 truncate">{item.memo}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-gray-900 font-mono text-sm">{fmt(item.amount)}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(item); setShowAdd(true); }} className="text-xs text-violet-500 px-2 py-1 rounded-lg bg-violet-50">編集</button>
                          <button onClick={() => { if (confirm(`「${item.description}」を削除しますか？`)) onDelete(item.id); }} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-50">削除</button>
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
        <AddBusinessExpenseModal editItem={editItem} onSave={onSave} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
