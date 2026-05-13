import { useState, useEffect, useCallback } from 'react';
import type { Income, Expense, BusinessExpense, TaxSettings, User } from './types';
import {
  subscribeIncomes, saveIncome, deleteIncome,
  subscribeExpenses, saveExpense, deleteExpense,
  subscribeBusinessExpenses, saveBusinessExpense, deleteBusinessExpense,
  subscribeTaxSettings, saveTaxSettings,
} from './utils/storage';
import UserSelectScreen from './components/UserSelectScreen';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
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
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const showError = useCallback((msg: string) => {
    setToast({ message: msg, type: 'error' });
  }, []);

  const handleSaveIncome = useCallback(async (item: Income) => {
    try { await saveIncome(item); } catch (e) {
      console.error(e);
      showError('保存に失敗しました。');
    }
  }, [showError]);

  const handleDeleteIncome = useCallback(async (id: string) => {
    try { await deleteIncome(id); } catch (e) {
      console.error(e);
      showError('削除に失敗しました。');
    }
  }, [showError]);

  const handleSaveExpense = useCallback(async (item: Expense) => {
    try { await saveExpense(item); } catch (e) {
      console.error(e);
      showError('保存に失敗しました。');
    }
  }, [showError]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try { await deleteExpense(id); } catch (e) {
      console.error(e);
      showError('削除に失敗しました。');
    }
  }, [showError]);

  const handleToggleExpense = useCallback(async (item: Expense) => {
    try { await saveExpense(item); } catch (e) {
      console.error(e);
      showError('更新に失敗しました。');
    }
  }, [showError]);

  const handleSaveBizExp = useCallback(async (item: BusinessExpense) => {
    try { await saveBusinessExpense(item); } catch (e) {
      console.error(e);
      showError('保存に失敗しました。');
    }
  }, [showError]);

  const handleDeleteBizExp = useCallback(async (id: string) => {
    try { await deleteBusinessExpense(id); } catch (e) {
      console.error(e);
      showError('削除に失敗しました。');
    }
  }, [showError]);

  const handleSaveTaxSettings = useCallback(async (s: TaxSettings) => {
    try { await saveTaxSettings(s); setTaxSettings(s); } catch (e) {
      console.error(e);
      showError('設定の保存に失敗しました。');
    }
  }, [showError]);

  if (!user) {
    return <UserSelectScreen onSelect={setUser} />;
  }

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
        <button onClick={() => setUser(null)} className="text-gray-400 text-sm">← 戻る</button>
        <span className="font-extrabold text-sm bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
          💰 CASHFLOW
        </span>
        <span className="text-sm text-gray-500">{user === 'takahashi' ? 'けんしん' : 'れな'}</span>
      </header>

      <main className="flex-1">
        {screen === 'dashboard' && (
          <DashboardScreen
            user={user}
            incomes={incomes}
            expenses={expenses}
            businessExpenses={businessExpenses}
            taxSettings={taxSettings}
            onOpenSettings={() => setShowTaxSettings(true)}
          />
        )}
        {screen === 'income' && (
          <IncomeScreen
            user={user}
            incomes={incomes}
            onSave={handleSaveIncome}
            onDelete={handleDeleteIncome}
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
            user={user}
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
