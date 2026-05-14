import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Income, IncomeType } from '../types';
import { INCOME_TYPE_LABELS } from '../types';

interface Props {
  editItem?: Income;
  onSave: (item: Income) => void;
  onClose: () => void;
}

const INCOME_TYPES: IncomeType[] = ['fixed', 'variable'];

export default function AddIncomeModal({ editItem, onSave, onClose }: Props) {
  const today = new Date().toISOString().substring(0, 10);
  const [incomeType, setIncomeType] = useState<IncomeType>(editItem?.incomeType ?? 'variable');
  const [clientName, setClientName] = useState(editItem?.clientName ?? '');
  const [projectName, setProjectName] = useState(editItem?.projectName ?? '');
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : '');
  const [invoiceDate, setInvoiceDate] = useState(editItem?.invoiceDate ?? today);
  const [paidDate, setPaidDate] = useState(editItem?.paidDate ?? '');
  const [isPaid, setIsPaid] = useState(editItem?.isPaid ?? false);
  const [outsourcingCost, setOutsourcingCost] = useState(editItem?.outsourcingCost ? String(editItem.outsourcingCost) : '');
  const [memo, setMemo] = useState(editItem?.memo ?? '');

  const isFixed = incomeType === 'fixed';

  const handleSave = () => {
    const num = parseInt(amount.replace(/,/g, ''), 10);
    if (!clientName.trim() || isNaN(num) || num <= 0) return;
    const numOutsourcing = parseInt(outsourcingCost.replace(/,/g, ''), 10);
    onSave({
      id: editItem?.id ?? uuidv4(),
      userId: 'shared',
      incomeType,
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      amount: num,
      invoiceDate,
      paidDate: isPaid && paidDate ? paidDate : undefined,
      isPaid,
      outsourcingCost: !isFixed && numOutsourcing > 0 ? numOutsourcing : undefined,
      memo: memo.trim() || undefined,
      createdAt: editItem?.createdAt ?? Date.now(),
    });
    onClose();
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div className="bg-gray-50 w-full rounded-t-3xl p-5 pb-safe max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">{editItem ? '収入を編集' : '収入を追加'}</h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-5">
          {INCOME_TYPES.map(t => (
            <button key={t} onClick={() => setIncomeType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                incomeType === t
                  ? t === 'fixed' ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {t === 'fixed' ? '🏢 ' : '💼 '}{INCOME_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{isFixed ? '会社名・支払元 *' : 'クライアント名 *'}</label>
            <input className={inputCls} placeholder={isFixed ? '例: 株式会社○○' : '例: 制作会社名'} value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{isFixed ? '備考' : '案件名'}</label>
            <input className={inputCls} placeholder={isFixed ? '例: 月給・ボーナス' : '例: VFXコンポジット作業'} value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">金額（税込）*</label>
            <input className={inputCls} type="number" placeholder="500000" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" />
          </div>
          {!isFixed && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">外注費（この案件で支払った外注費）</label>
              <input className={inputCls} type="number" placeholder="0" value={outsourcingCost} onChange={e => setOutsourcingCost(e.target.value)} inputMode="numeric" />
              {outsourcingCost && parseInt(outsourcingCost) > 0 && amount && parseInt(amount) > 0 && (
                <div className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2 py-1">
                  純収入: ¥{(parseInt(amount) - parseInt(outsourcingCost)).toLocaleString('ja-JP')} ／ 経費タブに自動登録されます
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{isFixed ? '支払日 *' : '請求日 *'}</label>
            <input className={inputCls} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPaid(!isPaid)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: isPaid ? '18px' : '2px' }} />
            </button>
            <span className="text-sm text-gray-700">入金済み</span>
          </div>
          {isPaid && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">入金日</label>
              <input className={inputCls} type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">メモ</label>
            <input className={inputCls} placeholder="任意" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
          <button onClick={handleSave} disabled={!clientName.trim() || !amount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {editItem ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
