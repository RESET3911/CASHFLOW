import { useState } from 'react';
import type { TaxSettings } from '../types';
import { fmt } from '../utils/taxCalc';

interface Props {
  settings: TaxSettings;
  onSave: (s: TaxSettings) => void;
  onClose: () => void;
}

export default function TaxSettingsModal({ settings, onSave, onClose }: Props) {
  const [salary, setSalary] = useState(String(settings.salaryIncome));
  const [pension, setPension] = useState(String(settings.pension));
  const [nhi, setNhi] = useState(String(settings.nhiPremium));

  const handleSave = () => {
    onSave({
      salaryIncome: parseInt(salary) || 0,
      pension: parseInt(pension) || 0,
      nhiPremium: parseInt(nhi) || 0,
    });
    onClose();
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-gray-50 w-full rounded-t-3xl p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">税金設定</h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
          源泉徴収票の数値を入力してください。税額シミュレーションに使用します。
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              給与年収（源泉徴収票「支払金額」）
            </label>
            <input
              className={inputCls}
              type="number"
              placeholder="4000000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              inputMode="numeric"
            />
            {salary && !isNaN(parseInt(salary)) && (
              <div className="text-xs text-gray-400 pl-1">{fmt(parseInt(salary))}</div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              国民年金保険料（年額）
            </label>
            <input
              className={inputCls}
              type="number"
              placeholder="203760"
              value={pension}
              onChange={e => setPension(e.target.value)}
              inputMode="numeric"
            />
            <div className="text-xs text-gray-400 pl-1">
              参考: 2025年度 ¥203,760/年（月16,980×12）
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              国民健康保険料（年額）
            </label>
            <input
              className={inputCls}
              type="number"
              placeholder="500000"
              value={nhi}
              onChange={e => setNhi(e.target.value)}
              inputMode="numeric"
            />
            <div className="text-xs text-gray-400 pl-1">
              昨年の納付通知書の金額を入力してください
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
