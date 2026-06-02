import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  query, orderBy,
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

export interface RingiApplication {
  id: string;
  status: string;
  amount: number;
  item: string;
  decidedAt?: string;
}
import { db } from '../firebase';
import type { Income, Expense, BusinessExpense, TaxSettings, FixedSalarySettings } from '../types';

const col = (name: string) => collection(db, `cashflow_${name}`);

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

// ── Income ──────────────────────────────────────────────────────
export function subscribeIncomes(
  onData: (items: Income[]) => void,
  onError?: () => void,
) {
  const q = query(col('incomes'), orderBy('invoiceDate', 'desc'));
  return onSnapshot(q,
    (snap: QuerySnapshot<DocumentData>) => {
      onData(snap.docs.map(d => ({
        incomeType: 'variable',  // default for legacy data
        ...d.data(),
        id: d.id,
      } as Income)));
    },
    () => onError?.(),
  );
}

export async function saveIncome(income: Income) {
  await setDoc(doc(col('incomes'), income.id), stripUndefined(income));
}

export async function deleteIncome(id: string) {
  await deleteDoc(doc(col('incomes'), id));
}

// ── Expense ─────────────────────────────────────────────────────
export function subscribeExpenses(
  onData: (items: Expense[]) => void,
  onError?: () => void,
) {
  const q = query(col('expenses'), orderBy('createdAt', 'asc'));
  return onSnapshot(q,
    (snap: QuerySnapshot<DocumentData>) => {
      onData(snap.docs.map(d => ({
        expenseType: 'fixed',  // default for legacy data
        ...d.data(),
        id: d.id,
      } as Expense)));
    },
    () => onError?.(),
  );
}

export async function saveExpense(item: Expense) {
  await setDoc(doc(col('expenses'), item.id), stripUndefined(item));
}

export async function deleteExpense(id: string) {
  await deleteDoc(doc(col('expenses'), id));
}

// ── BusinessExpense ─────────────────────────────────────────────
export function subscribeBusinessExpenses(
  onData: (items: BusinessExpense[]) => void,
  onError?: () => void,
) {
  const q = query(col('business_expenses'), orderBy('date', 'desc'));
  return onSnapshot(q,
    (snap: QuerySnapshot<DocumentData>) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessExpense)));
    },
    () => onError?.(),
  );
}

export async function saveBusinessExpense(item: BusinessExpense) {
  await setDoc(doc(col('business_expenses'), item.id), stripUndefined(item));
}

export async function deleteBusinessExpense(id: string) {
  await deleteDoc(doc(col('business_expenses'), id));
}

// ── TaxSettings ─────────────────────────────────────────────────
export function subscribeTaxSettings(onData: (s: TaxSettings) => void) {
  return onSnapshot(doc(db, 'cashflow_settings', 'tax'),
    (snap) => {
      if (snap.exists()) onData(snap.data() as TaxSettings);
    },
  );
}

export async function saveTaxSettings(settings: TaxSettings) {
  await setDoc(doc(db, 'cashflow_settings', 'tax'), settings);
}

// ── FixedSalarySettings ──────────────────────────────────────────
export function subscribeFixedSalarySettings(onData: (s: FixedSalarySettings) => void) {
  return onSnapshot(doc(db, 'cashflow_settings', 'fixed_salary'), (snap) => {
    if (snap.exists()) onData(snap.data() as FixedSalarySettings);
  });
}

export async function saveFixedSalarySettings(settings: FixedSalarySettings) {
  await setDoc(doc(db, 'cashflow_settings', 'fixed_salary'), settings);
}

// ── SavingsBalance ────────────────────────────────────────────────
export function subscribeSavingsBalance(onData: (amount: number) => void) {
  return onSnapshot(doc(db, 'cashflow_settings', 'savings'), snap => {
    onData(snap.exists() ? ((snap.data().amount as number) ?? 0) : 0);
  });
}

export async function saveSavingsBalance(amount: number) {
  await setDoc(doc(db, 'cashflow_settings', 'savings'), { amount });
}

// ── RINGI Applications (shared Firebase project) ──────────────────
export function subscribeRingiApplications(onData: (apps: RingiApplication[]) => void) {
  return onSnapshot(collection(db, 'applications'), snap => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as RingiApplication)));
  }, () => onData([]));
}
