import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Income } from '../types';

type FsUser = 'saku' | 'takahashi' | 'both';

async function writeNotification(params: {
  toUser: FsUser;
  type: string;
  title: string;
  body: string;
  linkedId?: string | null;
}): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    toUser: params.toUser,
    fromApp: 'cashflow',
    type: params.type,
    title: params.title,
    body: params.body,
    isRead: false,
    linkedUrl: 'https://RESET3911.github.io/CASHFLOW/',
    linkedId: params.linkedId ?? null,
    createdAt: Date.now(),
  });
}

// 入金予定日が近い請求書の通知（daysLeft: 何日後か）
export async function notifyPaymentDue(income: Income, daysLeft: number): Promise<void> {
  const toUser: FsUser = income.userId === 'saku' ? 'saku' : 'takahashi';
  const amt = `¥${income.amount.toLocaleString('ja-JP')}`;
  await writeNotification({
    toUser,
    type: 'cashflow_payment_due',
    title: `💴 入金予定日まで${daysLeft}日`,
    body: `${income.clientName}${income.projectName ? ` / ${income.projectName}` : ''} （${amt}）`,
    linkedId: income.id,
  });
}

// 請求書が入金済みになったことを通知
export async function notifyPaymentReceived(income: Income): Promise<void> {
  const toUser: FsUser = income.userId === 'saku' ? 'saku' : 'takahashi';
  const amt = `¥${income.amount.toLocaleString('ja-JP')}`;
  await writeNotification({
    toUser,
    type: 'cashflow_payment_received',
    title: `✅ 入金確認`,
    body: `${income.clientName} から ${amt} が入金されました`,
    linkedId: income.id,
  });
}

// ── 呼び出し例（App.tsx の useEffect 内）──────────────────────────────
//
// useEffect(() => {
//   const NOTIF_KEY = 'cashflow_payment_due_notified';
//   const lastNotified = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
//   const today = new Date().toISOString().split('T')[0];
//
//   incomes.forEach(income => {
//     if (income.isPaid) return;
//     const due = income.invoiceDate;
//     const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
//     if (diff > 0 && diff <= 7 && lastNotified[income.id] !== today) {
//       notifyPaymentDue(income, diff).catch(() => {});
//       lastNotified[income.id] = today;
//     }
//   });
//   localStorage.setItem(NOTIF_KEY, JSON.stringify(lastNotified));
// }, [incomes]);
