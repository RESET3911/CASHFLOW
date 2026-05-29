export type User = 'saku' | 'takahashi' | 'shared';

export type IncomeType = 'fixed' | 'variable';

export type ExpenseType = 'fixed' | 'semi_fixed' | 'variable' | 'business_fixed';

export type ExpenseCategory =
  | 'rent'
  | 'insurance'
  | 'subscription'
  | 'communication'
  | 'pension'
  | 'health_insurance'
  | 'utilities'
  | 'medical'
  | 'food'
  | 'entertainment'
  | 'other';

export type BusinessExpenseCategory =
  | 'outsourcing'
  | 'supplies'
  | 'travel'
  | 'communication'
  | 'books'
  | 'training'
  | 'entertainment'
  | 'misc';

export interface IncomeAllocation {
  id: string;
  label: string;
  amount: number;
}

export interface Income {
  id: string;
  userId: User;
  incomeType: IncomeType;
  clientName: string;
  projectName: string;
  amount: number;
  invoiceDate: string;   // YYYY-MM-DD
  paidDate?: string;
  isPaid: boolean;
  outsourcingCost?: number;
  memo?: string;
  allocations?: IncomeAllocation[];
  createdAt: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  expenseType: ExpenseType;
  category: ExpenseCategory;
  note?: string;
  isActive: boolean;
  createdAt: number;
}

export interface BusinessExpense {
  id: string;
  userId: User;
  date: string;          // YYYY-MM-DD
  amount: number;
  category: BusinessExpenseCategory;
  description: string;
  memo?: string;
  createdAt: number;
}

export interface TaxSettings {
  salaryIncome: number;
  pension: number;
  nhiPremium: number;
}

// ── ラベル / カラー ─────────────────────────────────────────────

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  fixed: '固定給',
  variable: '変動収入',
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fixed: '固定費',
  semi_fixed: '準固定費',
  variable: '変動費・サブスク',
  business_fixed: '固定経費',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: '家賃・住居費',
  insurance: '生命/損害保険',
  subscription: 'サブスク',
  communication: '通信費',
  pension: '国民年金',
  health_insurance: '国民健康保険',
  utilities: '水道光熱費',
  medical: '医療費',
  food: '食費・日用品',
  entertainment: '娯楽・交際',
  other: 'その他',
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-700',
  insurance: 'bg-purple-100 text-purple-700',
  subscription: 'bg-pink-100 text-pink-700',
  communication: 'bg-yellow-100 text-yellow-700',
  pension: 'bg-orange-100 text-orange-700',
  health_insurance: 'bg-red-100 text-red-700',
  utilities: 'bg-sky-100 text-sky-700',
  medical: 'bg-teal-100 text-teal-700',
  food: 'bg-lime-100 text-lime-700',
  entertainment: 'bg-fuchsia-100 text-fuchsia-700',
  other: 'bg-gray-100 text-gray-600',
};

export const BUSINESS_EXPENSE_CATEGORY_LABELS: Record<BusinessExpenseCategory, string> = {
  outsourcing: '外注費',
  supplies: '消耗品費',
  travel: '旅費交通費',
  communication: '通信費',
  books: '新聞図書費',
  training: '研修費',
  entertainment: '交際費',
  misc: '雑費',
};

export const BUSINESS_EXPENSE_CATEGORY_COLORS: Record<BusinessExpenseCategory, string> = {
  outsourcing: 'bg-violet-100 text-violet-700',
  supplies: 'bg-blue-100 text-blue-700',
  travel: 'bg-cyan-100 text-cyan-700',
  communication: 'bg-yellow-100 text-yellow-700',
  books: 'bg-emerald-100 text-emerald-700',
  training: 'bg-teal-100 text-teal-700',
  entertainment: 'bg-rose-100 text-rose-700',
  misc: 'bg-gray-100 text-gray-600',
};
