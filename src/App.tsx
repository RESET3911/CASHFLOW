import { useState, useEffect, useCallback } from 'react';
import type { Income, Expense, BusinessExpense, TaxSettings, FixedSalarySettings } from './types';
import {
  subscribeIncomes, saveIncome, deleteIncome,
  subscribeExpenses, saveExpense, deleteExpense,
  subscribeBusinessExpenses, saveBusinessExpense, deleteBusinessExpense,
  subscribeTaxSettings, saveTaxSettings,
  subscribeFixedSalarySettings, saveFixedSalarySettings,
  subscribeSavingsBalance, saveSavingsBalance,
  subscribeRingiApplications, type RingiApplication,
} from './utils/storage';
import DashboardScreen from './components/DashboardScreen';
import IncomeScreen from './components/IncomeScreen';
import ExpenseScreen from './components/ExpenseScreen';
import BusinessExpenseScreen from './components/BusinessExpenseScreen';
import TaxSettingsModal from './components/TaxSettingsModal';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';

type Screen = 'dashboard' | 'income' | 'expense' | 'business';

const DEFAULT_TAX_SETTINGS: TaxSettings = {
  salaryIncome: 0,
  pension: 203_760,
  nhiPremium: 0,
};

const DEFAULT_FIXED_SALARY: FixedSalarySettings = {
  enabled: false,
  companyName: '',
  amount: 0,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [fixedSalary, setFixedSalary] = useState<FixedSalarySettings>(DEFAULT_FIXED_SALARY);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [ringiApplications, setRingiApplications] = useState<RingiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    let resolved = 0;
    const done = () => { if (++resolved >= 2) setLoading(false); };
    const unsubs = [
      subscribeIncomes(items => { setIncomes(items); done(); }, done),
      subscribeExpenses(items => { setExpenses(items); done(); }, done),
      subscribeBusinessExpenses(setBusinessExpenses),
      subscribeTaxSettings(setTaxSettings),
      subscribeFixedSalarySettings(setFixedSalary),
      subscribeSavingsBalance(setSavingsBalance),
      subscribeRingiApplications(setRingiApplications),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // 毎月の固定給を自動生成
  useEffect(() => {
    if (!fixedSalary.enabled || fixedSalary.amount <= 0 || !fixedSalary.companyName) return;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const autoId = `fixed_salary_${ym}`;
    const alreadyExists = incomes.some(i => i.id === autoId);
    if (alreadyExists) return;
    const invoiceDate = `${ym}-01`;
    saveIncome({
      id: autoId,
      userId: 'shared',
      incomeType: 'fixed',
      clientName: fixedSalary.companyName,
      projectName: '月給',
      amount: fixedSalary.amount,
      invoiceDate,
      isPaid: true,
      paidDate: invoiceDate,
      createdAt: Date.now(),
    }).catch(console.error);
  }, [fixedSalary, incomes]);

  const showError = useCallback((msg: string) => {
    setToast({ message: msg, type: 'error' });
  }, []);

  const handleSaveIncome = useCallback(async (item: Income) => {
    try {
      await saveIncome(item);
      const bizExpId = `${item.id}_outsourcing`;
      if (item.incomeType === 'variable' && item.outsourcingCost && item.outsourcingCost > 0) {
        await saveBusinessExpense({
          id: bizExpId,
          userId: 'shared',
          date: item.invoiceDate,
          amount: item.outsourcingCost,
          category: 'outsourcing',
          description: `外注費: ${item.clientName}${item.projectName ? ` / ${item.projectName}` : ''}`,
          createdAt: Date.now(),
        });
      } else {
        await deleteBusinessExpense(bizExpId).catch(() => {});
      }
    } catch (e) { console.error(e); showError('保存に失敗しました。'); }
  }, [showError]);

  const handleDeleteIncome = useCallback(async (id: string) => {
    try {
      await deleteIncome(id);
      await deleteBusinessExpense(`${id}_outsourcing`).catch(() => {});
    } catch (e) { console.error(e); showError('削除に失敗しました。'); }
  }, [showError]);

  const handleSaveExpense = useCallback(async (item: Expense) => {
    try { await saveExpense(item); } catch (e) { console.error(e); showError('保存に失敗しました。'); }
  }, [showError]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try { await deleteExpense(id); } catch (e) { console.error(e); showError('削除に失敗しました。'); }
  }, [showError]);

  const handleToggleExpense = useCallback(async (item: Expense) => {
    try { await saveExpense(item); } catch (e) { console.error(e); showError('更新に失敗しました。'); }
  }, [showError]);

  const handleSaveBizExp = useCallback(async (item: BusinessExpense) => {
    try { await saveBusinessExpense(item); } catch (e) { console.error(e); showError('保存に失敗しました。'); }
  }, [showError]);

  const handleDeleteBizExp = useCallback(async (id: string) => {
    try { await deleteBusinessExpense(id); } catch (e) { console.error(e); showError('削除に失敗しました。'); }
  }, [showError]);

  const handleSaveTaxSettings = useCallback(async (s: TaxSettings) => {
    try { await saveTaxSettings(s); setTaxSettings(s); } catch (e) { console.error(e); showError('設定の保存に失敗しました。'); }
  }, [showError]);

  const handleSaveFixedSalary = useCallback(async (s: FixedSalarySettings) => {
    try { await saveFixedSalarySettings(s); } catch (e) { console.error(e); showError('固定給設定の保存に失敗しました。'); }
  }, [showError]);

  const handleSaveSavingsBalance = useCallback(async (amount: number) => {
    try { await saveSavingsBalance(amount); } catch (e) { console.error(e); showError('貯蓄残高の保存に失敗しました。'); }
  }, [showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="flex items-center justify-between px-4 pt-3 pb-2 bg-white/70 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-100">
        <span className="font-extrabold text-sm bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
          💰 CASHFLOW
        </span>
        <button
          onClick={() => setShowTaxSettings(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm text-base"
        >⚙️</button>
      </header>

      <main className="flex-1">
        {screen === 'dashboard' && (
          <DashboardScreen
            incomes={incomes}
            expenses={expenses}
            businessExpenses={businessExpenses}
            taxSettings={taxSettings}
            savingsBalance={savingsBalance}
            onSaveSavingsBalance={handleSaveSavingsBalance}
            ringiApplications={ringiApplications}
          />
        )}
        {screen === 'income' && (
          <IncomeScreen
            incomes={incomes}
            onSave={handleSaveIncome}
            onDelete={handleDeleteIncome}
            taxSettings={taxSettings}
            salaryIncome={taxSettings.salaryIncome}
          />
        )}
        {screen === 'expense' && (
          <ExpenseScreen
            expenses={expenses}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
            onToggle={handleToggleExpense}
          />
        )}
        {screen === 'business' && (
          <BusinessExpenseScreen
            expenses={businessExpenses}
            onSave={handleSaveBizExp}
            onDelete={handleDeleteBizExp}
          />
        )}
      </main>

      <BottomNav current={screen} onChange={setScreen} />

      {showTaxSettings && (
        <TaxSettingsModal
          settings={taxSettings}
          onSave={handleSaveTaxSettings}
          fixedSalary={fixedSalary}
          onSaveFixedSalary={handleSaveFixedSalary}
          onClose={() => setShowTaxSettings(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
