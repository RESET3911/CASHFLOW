import { useState, useMemo } from 'react';
import type { Income } from '../types';
import { fmt } from '../utils/taxCalc';
import AddIncomeModal from './AddIncomeModal';

interface Props {
  incomes: Income[];
  onSave: (item: Income) => void;
  onDelete: (id: string) => void;
}

function getYearMonth(dateStr: string) {
  return dateStr.substring(0, 7);
}

type Tab = 'all' | 'fixed' | 'variable';

export default function IncomeScreen({ incomes, onSave, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Income | undefined>();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<Tab>('all');

  const years = useMemo(() => {
    const set = new Set(incomes.map(i => parseInt(i.invoiceDate.substring(0, 4))));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [incomes]);

  const filtered = useMemo(() => {
    return incomes.filter(i => {
      if (!i.invoiceDate.startsWith(String(selectedYear))) return false;
      if (tab === 'fixed') return i.incomeType === 'fixed';
      if (tab === 'variable') return i.incomeType === 'variable';
      return true;
    });
  }, [incomes, selectedYear, tab]);

  const grouped = useMemo(() => {
    const map: Record<string, Income[]> = {};
    for (const item of filtered) {
      const ym = getYearMonth(item.invoiceDate);
      (map[ym] ??= []).push(item);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ym, items]) => ({
        ym,
        label: `${parseInt(ym.substring(5))}月`,
        items: items.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)),
        total: items.reduce((s, i) => s + i.amount, 0),
      }));
  }, [filtered]);

  const yearTotal = grouped.reduce((s, g) => s + g.total, 0);
  const yearFixed = incomes.filter(i => i.invoiceDate.startsWith(String(selectedYear)) && i.incomeType === 'fixed').reduce((s, i) => s + i.amount, 0);
  const yearVariable = incomes.filter(i => i.invoiceDate.startsWith(String(selectedYear)) && i.incomeType === 'variable').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-col pb-28">
      <div className="flex items-center justify-between px-4 pt-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">収入管理</h2>
        <button
          onClick={() => { setEditItem(undefined); setShowAdd(true); }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          <span>+</span> 追加
        </button>
      </div>

      <div className="flex gap-2 px-4 mb-3 overflow-x-auto">
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === y ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >{y}年</button>
        ))}
      </div>

      <div className="flex gap-2 px-4 mb-4">
        {(['all', 'fixed', 'variable'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t
                ? t === 'fixed' ? 'bg-emerald-500 text-white'
                  : t === 'variable' ? 'bg-violet-500 text-white'
                  : 'bg-gray-700 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {t === 'all' ? 'すべて' : t === 'fixed' ? '🏢 固定給' : '💼 変動収入'}
          </button>
        ))}
      </div>

      {yearTotal > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-xs text-gray-400 mb-2">{selectedYear}年 収入合計</div>
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
              <div className="text-xs text-emerald-600">🏢 固定給</div>
              <div className="font-bold text-emerald-800 text-sm">{fmt(yearFixed)}</div>
            </div>
            <div className="flex-1 bg-violet-50 rounded-xl px-3 py-2">
              <div className="text-xs text-violet-600">💼 変動収入</div>
              <div className="font-bold text-violet-800 text-sm">{fmt(yearVariable)}</div>
            </div>
          </div>
          <div className="text-right mt-2 text-sm font-bold text-gray-800">合計 {fmt(yearTotal)}</div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-4">
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-4xl mb-3">💴</div>
            収入を登録してください
          </div>
        ) : (
          grouped.map(group => (
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.incomeType === 'fixed' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                          }`}>
                            {item.incomeType === 'fixed' ? '🏢 固定給' : '💼 変動'}
                          </span>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isPaid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="font-semibold text-gray-900 text-sm truncate">{item.clientName}</span>
                        </div>
                        {item.projectName && <div className="text-xs text-gray-400 mt-0.5 truncate">{item.projectName}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                          {item.invoiceDate}
                          {item.isPaid && item.paidDate && ` → 入金: ${item.paidDate}`}
                          {!item.isPaid && ' • 未入金'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-gray-900 font-mono text-sm">{fmt(item.amount)}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(item); setShowAdd(true); }} className="text-xs text-violet-500 px-2 py-1 rounded-lg bg-violet-50">編集</button>
                          <button onClick={() => { if (confirm(`「${item.clientName}」を削除しますか？`)) onDelete(item.id); }} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-50">削除</button>
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
        <AddIncomeModal editItem={editItem} onSave={onSave} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
