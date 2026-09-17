import UserModel from '../models/User.js';
import CategoryModel from '../models/Category.js';
import TransactionModel from '../models/Transaction.js';
import BudgetModel from '../models/Budget.js';
import GoalModel from '../models/Goal.js';
import DebtModel from '../models/Debt.js';
import RecurringModel from '../models/Recurring.js';
import * as A from '../services/analytics.service.js';
import * as D from '../services/date.service.js';
import { buildAdvice, buildStories } from '../services/advice.service.js';
import { getAchievements } from '../services/achievements.service.js';
import { money, categoryName } from '../services/format.service.js';
import { t } from '../locales/index.js';
import { notify } from '../core/bot.js';

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Возвращает категорию, только если она общая или принадлежит этому пользователю.
 * Без такой проверки можно было бы подставить чужую личную категорию
 * и увидеть её название в своих данных.
 */
async function pickCategory(userId, categoryId, type) {
  const id = num(categoryId);
  if (!id) return null;

  const category = await CategoryModel.findById(id);
  if (!category) return null;
  if (category.userId !== null && category.userId !== Number(userId)) return null;
  if (type && category.type !== type) return null;

  return category;
}

const rangeFor = (user, query) => {
  if (query.from && query.to) {
    return { from: new Date(query.from), to: new Date(query.to) };
  }
  if (query.days) {
    return D.lastDays(user.timezone, Number(query.days));
  }
  return D.monthRange(user.timezone, query.month);
};

/* ------------------------------- Профиль -------------------------------- */

export async function getMe(req, res) {
  const user = req.user;
  const tz = user.timezone;

  const [today, month, goals] = await Promise.all([
    TransactionModel.totals(user.id, D.todayRange(tz)),
    TransactionModel.totals(user.id, D.monthRange(tz)),
    GoalModel.list(user.id, { onlyActive: true })
  ]);

  res.json({
    user: {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      username: user.username,
      language: user.language,
      currency: user.currency,
      timezone: user.timezone,
      onboarded: user.onboarded,
      reminderEnabled: user.reminderEnabled,
      reminderTime: user.reminderTime,
      savingsRate: user.savingsRate,
      monthlyIncomePlan: user.monthlyIncomePlan,
      roundUpEnabled: user.roundUpEnabled,
      streakCount: user.streakCount,
      bestStreak: user.bestStreak
    },
    today,
    month,
    goalsCount: goals.length,
    isDev: Boolean(req.isDevAuth)
  });
}

export async function updateMe(req, res) {
  const allowed = [
    'language',
    'currency',
    'timezone',
    'onboarded',
    'reminderEnabled',
    'reminderTime',
    'savingsRate',
    'monthlyIncomePlan',
    'roundUpEnabled'
  ];

  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  if (data.savingsRate !== undefined) data.savingsRate = Number(data.savingsRate);
  if (data.monthlyIncomePlan !== undefined) data.monthlyIncomePlan = Number(data.monthlyIncomePlan);

  const user = await UserModel.update(req.user.id, data);
  res.json({ user });
}

/* ------------------------------ Категории -------------------------------- */

export async function listCategories(req, res) {
  const categories = await CategoryModel.listFor(req.user.id, req.query.type);
  res.json({ categories });
}

export async function createCategory(req, res) {
  const { nameRu, nameUz, emoji, type, color } = req.body;
  if (!nameRu && !nameUz) return res.status(400).json({ error: 'name_required' });

  const category = await CategoryModel.create({
    key: `custom_${Date.now()}`,
    nameRu: nameRu || nameUz,
    nameUz: nameUz || nameRu,
    emoji: emoji || '🏷',
    color: color || '#898781',
    type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
    userId: req.user.id,
    sort: 50
  });

  res.status(201).json({ category });
}

export async function removeCategory(req, res) {
  const category = await CategoryModel.findById(req.params.id);
  if (!category || category.userId !== req.user.id) {
    return res.status(404).json({ error: 'not_found' });
  }
  await CategoryModel.remove(category.id);
  res.json({ ok: true });
}

/* ------------------------------ Операции --------------------------------- */

export async function listTransactions(req, res) {
  const { from, to } = rangeFor(req.user, req.query);
  const transactions = await TransactionModel.list(req.user.id, {
    from,
    to,
    type: req.query.type,
    categoryId: req.query.categoryId,
    take: Number(req.query.take || 100),
    skip: Number(req.query.skip || 0)
  });
  res.json({ transactions });
}

export async function createTransaction(req, res) {
  const user = req.user;
  const amount = num(req.body.amount);
  const type = req.body.type === 'INCOME' ? 'INCOME' : 'EXPENSE';

  if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });

  const chosen = await pickCategory(user.id, req.body.categoryId, type);
  let categoryId = chosen?.id || null;

  if (!categoryId) {
    const fallback = await CategoryModel.fallback(user.id, type);
    categoryId = fallback?.id || null;
  }

  const transaction = await TransactionModel.create({
    userId: user.id,
    categoryId,
    type,
    amount: Math.round(amount),
    note: req.body.note ? String(req.body.note).slice(0, 200) : null,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    source: 'miniapp'
  });

  const streak = await A.registerEntry(user);

  // Копилка «округление сдачи»
  let roundUp = 0;
  if (user.roundUpEnabled && type === 'EXPENSE') {
    const step = user.roundUpStep || 1000;
    roundUp = (step - (transaction.amount % step)) % step;
    if (roundUp > 0) {
      const [goal] = await GoalModel.list(user.id, { onlyActive: true });
      if (goal) await GoalModel.deposit(goal.id, roundUp);
    }
  }

  // Ответ бота в чат — как только операция улетела из Mini App
  const text = t(user.language, 'tx.fromApp', {
    sign: type === 'INCOME' ? '+' : '−',
    amount: money(transaction.amount, user.currency, user.language),
    emoji: transaction.category?.emoji || '💸',
    category: categoryName(transaction.category, user.language)
  });
  notify(user.telegramId, text);

  res.status(201).json({ transaction, streak, roundUp });
}

export async function updateTransaction(req, res) {
  const transaction = await TransactionModel.findById(req.params.id);
  if (!transaction || transaction.userId !== req.user.id) {
    return res.status(404).json({ error: 'not_found' });
  }

  const data = {};
  if (req.body.amount !== undefined) data.amount = Math.round(Number(req.body.amount));
  if (req.body.note !== undefined) data.note = req.body.note;
  if (req.body.date !== undefined) data.date = new Date(req.body.date);
  if (req.body.type !== undefined) data.type = req.body.type === 'INCOME' ? 'INCOME' : 'EXPENSE';

  if (req.body.categoryId !== undefined) {
    const category = await pickCategory(req.user.id, req.body.categoryId, data.type || transaction.type);
    if (!category) return res.status(400).json({ error: 'invalid_category' });
    data.categoryId = category.id;
  }

  const updated = await TransactionModel.update(transaction.id, data);
  res.json({ transaction: updated });
}

export async function removeTransaction(req, res) {
  const transaction = await TransactionModel.findById(req.params.id);
  if (!transaction || transaction.userId !== req.user.id) {
    return res.status(404).json({ error: 'not_found' });
  }
  await TransactionModel.remove(transaction.id);
  res.json({ ok: true });
}

/* ------------------------------ Аналитика -------------------------------- */

export async function overview(req, res) {
  const data = await A.monthOverview(req.user, req.query.month);
  res.json(data);
}

export async function trend(req, res) {
  const data = await A.trend(req.user, Number(req.query.months || 6));
  res.json({ trend: data });
}

export async function daily(req, res) {
  const range = rangeFor(req.user, req.query);
  const data = await A.dailySeries(req.user, range);
  res.json({ daily: data });
}

export async function health(req, res) {
  res.json(await A.healthScore(req.user));
}

export async function stories(req, res) {
  res.json({ stories: await buildStories(req.user) });
}

export async function advice(req, res) {
  res.json({ advice: await buildAdvice(req.user, 8) });
}

export async function achievements(req, res) {
  res.json(await getAchievements(req.user));
}

/* -------------------------------- Цели ----------------------------------- */

export async function listGoals(req, res) {
  res.json({ goals: await A.goalsProgress(req.user) });
}

export async function createGoal(req, res) {
  const targetAmount = num(req.body.targetAmount);
  if (!req.body.title || !targetAmount) return res.status(400).json({ error: 'invalid_goal' });

  const goal = await GoalModel.create({
    userId: req.user.id,
    title: String(req.body.title).slice(0, 80),
    emoji: req.body.emoji || '🎯',
    targetAmount: Math.round(targetAmount),
    currentAmount: Math.round(num(req.body.currentAmount) || 0),
    deadline: req.body.deadline ? new Date(req.body.deadline) : null
  });

  res.status(201).json({ goal });
}

export async function depositGoal(req, res) {
  const goal = await GoalModel.findById(req.params.id);
  if (!goal || goal.userId !== req.user.id) return res.status(404).json({ error: 'not_found' });

  const amount = num(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });

  const updated = await GoalModel.deposit(goal.id, Math.round(amount));
  res.json({ goal: updated });
}

export async function removeGoal(req, res) {
  const goal = await GoalModel.findById(req.params.id);
  if (!goal || goal.userId !== req.user.id) return res.status(404).json({ error: 'not_found' });
  await GoalModel.remove(goal.id);
  res.json({ ok: true });
}

/* ------------------------------- Бюджеты --------------------------------- */

export async function listBudgets(req, res) {
  const month = req.query.month || D.currentMonthKey(req.user.timezone);
  res.json({ budgets: await A.budgetStatus(req.user, month) });
}

export async function upsertBudget(req, res) {
  const month = req.body.month || D.currentMonthKey(req.user.timezone);
  const amount = num(req.body.amount);
  const category = await pickCategory(req.user.id, req.body.categoryId, 'EXPENSE');

  if (!category || !amount) return res.status(400).json({ error: 'invalid_budget' });

  const budget = await BudgetModel.upsert(req.user.id, category.id, month, Math.round(amount));
  res.json({ budget });
}

export async function removeBudget(req, res) {
  const budgets = await BudgetModel.list(req.user.id);
  const budget = budgets.find((b) => b.id === Number(req.params.id));
  if (!budget) return res.status(404).json({ error: 'not_found' });

  await BudgetModel.remove(budget.id);
  res.json({ ok: true });
}

/* -------------------------------- Долги ---------------------------------- */

export async function listDebts(req, res) {
  res.json({ debts: await DebtModel.list(req.user.id, { onlyOpen: req.query.all !== 'true' }) });
}

export async function createDebt(req, res) {
  const amount = num(req.body.amount);
  if (!req.body.person || !amount) return res.status(400).json({ error: 'invalid_debt' });

  const debt = await DebtModel.create({
    userId: req.user.id,
    person: String(req.body.person).slice(0, 60),
    amount: Math.round(amount),
    direction: req.body.direction === 'THEY_OWE' ? 'THEY_OWE' : 'I_OWE',
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    note: req.body.note || null
  });

  res.status(201).json({ debt });
}

export async function settleDebt(req, res) {
  const debts = await DebtModel.list(req.user.id, { onlyOpen: false });
  const debt = debts.find((d) => d.id === Number(req.params.id));
  if (!debt) return res.status(404).json({ error: 'not_found' });

  await DebtModel.settle(debt.id);
  res.json({ ok: true });
}

/* --------------------------- Регулярные платежи --------------------------- */

export async function listRecurring(req, res) {
  const items = await RecurringModel.list(req.user.id);
  const day = D.dayOfMonth(req.user.timezone);
  const monthly = items
    .filter((item) => item.isActive && item.type === 'EXPENSE')
    .reduce((sum, item) => sum + item.amount, 0);

  res.json({
    recurring: items.map((item) => ({
      ...item,
      daysLeft: item.dayOfMonth >= day ? item.dayOfMonth - day : null
    })),
    monthlyTotal: monthly
  });
}

export async function createRecurring(req, res) {
  const amount = num(req.body.amount);
  const dayOfMonth = Math.min(28, Math.max(1, Number(req.body.dayOfMonth) || 1));

  if (!req.body.title || !amount) return res.status(400).json({ error: 'invalid_recurring' });

  const type = req.body.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const category = await pickCategory(req.user.id, req.body.categoryId, type);

  const item = await RecurringModel.create({
    userId: req.user.id,
    title: String(req.body.title).slice(0, 60),
    amount: Math.round(amount),
    dayOfMonth,
    type,
    categoryId: category?.id || null
  });

  res.status(201).json({ recurring: item });
}

export async function updateRecurring(req, res) {
  const items = await RecurringModel.list(req.user.id);
  const item = items.find((row) => row.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'not_found' });

  const data = {};
  if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
  if (req.body.amount !== undefined) data.amount = Math.round(Number(req.body.amount));
  if (req.body.title !== undefined) data.title = String(req.body.title).slice(0, 60);
  if (req.body.dayOfMonth !== undefined) {
    data.dayOfMonth = Math.min(28, Math.max(1, Number(req.body.dayOfMonth) || 1));
  }

  res.json({ recurring: await RecurringModel.update(item.id, data) });
}

export async function removeRecurring(req, res) {
  const items = await RecurringModel.list(req.user.id);
  const item = items.find((row) => row.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'not_found' });

  await RecurringModel.remove(item.id);
  res.json({ ok: true });
}

/* ------------------------ Сколько можно потратить ------------------------- */

/**
 * Дневной лимит: сколько ещё можно тратить каждый день до конца месяца,
 * чтобы уложиться в доход и отложить запланированную долю.
 */
export async function allowance(req, res) {
  const user = req.user;
  const tz = user.timezone;
  const monthKey = D.currentMonthKey(tz);
  const { from, to } = D.monthRange(tz, monthKey);

  const [totals, today, recurring] = await Promise.all([
    TransactionModel.totals(user.id, { from, to }),
    TransactionModel.totals(user.id, D.todayRange(tz)),
    RecurringModel.list(user.id)
  ]);

  const daysTotal = D.daysInMonth(tz, monthKey);
  const daysLeft = Math.max(1, daysTotal - D.dayOfMonth(tz) + 1);

  const planIncome = user.monthlyIncomePlan > 0 ? user.monthlyIncomePlan : totals.income;
  const savingsTarget = Math.round((planIncome * (user.savingsRate || 0)) / 100);

  // предстоящие регулярные платежи в этом месяце
  const upcoming = recurring
    .filter((item) => item.isActive && item.type === 'EXPENSE' && item.dayOfMonth >= D.dayOfMonth(tz))
    .reduce((sum, item) => sum + item.amount, 0);

  const available = Math.max(0, planIncome - savingsTarget - totals.expense - upcoming);
  const perDay = Math.floor(available / daysLeft);

  res.json({
    perDay,
    available,
    daysLeft,
    spentToday: today.expense,
    leftToday: Math.max(0, perDay - today.expense),
    planIncome,
    savingsTarget,
    upcoming,
    monthExpense: totals.expense,
    monthIncome: totals.income
  });
}

/* -------------------------------- Экспорт -------------------------------- */

export async function exportCsv(req, res) {
  const user = req.user;
  const rows = await TransactionModel.list(user.id, { take: 5000 });

  const header = 'date;type;category;amount;note';
  const body = rows
    .map((row) =>
      [
        D.dayjs(row.date).tz(user.timezone).format('YYYY-MM-DD HH:mm'),
        row.type === 'INCOME' ? 'income' : 'expense',
        (categoryName(row.category, user.language) || '').replace(/;/g, ','),
        Math.round(row.amount),
        (row.note || '').replace(/[;\n\r]/g, ' ')
      ].join(';')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="finance-${D.todayKey(user.timezone)}.csv"`);
  res.send(`﻿${header}\n${body}`);
}

export default {
  allowance,
  listRecurring,
  createRecurring,
  updateRecurring,
  removeRecurring,
  getMe,
  updateMe,
  listCategories,
  createCategory,
  removeCategory,
  listTransactions,
  createTransaction,
  updateTransaction,
  removeTransaction,
  overview,
  trend,
  daily,
  health,
  stories,
  advice,
  achievements,
  listGoals,
  createGoal,
  depositGoal,
  removeGoal,
  listBudgets,
  upsertBudget,
  removeBudget,
  listDebts,
  createDebt,
  settleDebt,
  exportCsv
};
