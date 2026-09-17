import TransactionModel from '../models/Transaction.js';
import BudgetModel from '../models/Budget.js';
import GoalModel from '../models/Goal.js';
import DebtModel from '../models/Debt.js';
import UserModel from '../models/User.js';
import * as D from './date.service.js';

const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Сводка за произвольный период. */
export async function periodSummary(user, { from, to }) {
  const rows = await TransactionModel.raw(user.id, { from, to });

  let income = 0;
  let expense = 0;
  const spentDays = new Set();

  for (const row of rows) {
    if (row.type === 'INCOME') income += row.amount;
    else {
      expense += row.amount;
      spentDays.add(D.dayjs(row.date).tz(user.timezone).format('YYYY-MM-DD'));
    }
  }

  const start = D.dayjs(from).tz(user.timezone).startOf('day');
  const today = D.now(user.timezone).startOf('day');
  const end = D.dayjs(to).tz(user.timezone).startOf('day');
  const lastDay = end.isAfter(today) ? today : end;
  const daysElapsed = Math.max(1, lastDay.diff(start, 'day') + 1);

  return {
    income,
    expense,
    balance: income - expense,
    count: rows.length,
    daysElapsed,
    avgDay: Math.round(expense / daysElapsed),
    noSpendDays: Math.max(0, daysElapsed - spentDays.size),
    savedPercent: income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0
  };
}

export async function categoryBreakdown(user, { from, to, type = 'EXPENSE' }) {
  const rows = await TransactionModel.byCategory(user.id, { from, to, type });
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    categoryId: row.categoryId,
    category: row.category,
    total: row.total,
    count: row.count,
    percent: pct(row.total, total)
  }));
}

/** Полная картина по месяцу: суммы, прогноз, сравнение с прошлым месяцем, бюджеты. */
export async function monthOverview(user, monthKey) {
  const tz = user.timezone;
  const current = D.monthRange(tz, monthKey);
  const previous = D.prevMonthRange(tz, current.month);

  const [summary, prevSummary, breakdown, budgets] = await Promise.all([
    periodSummary(user, current),
    periodSummary(user, previous),
    categoryBreakdown(user, current),
    budgetStatus(user, current.month)
  ]);

  const daysTotal = D.daysInMonth(tz, current.month);
  const isCurrentMonth = current.month === D.currentMonthKey(tz);
  const forecast = isCurrentMonth
    ? Math.round((summary.expense / summary.daysElapsed) * daysTotal)
    : summary.expense;

  const diffPercent = prevSummary.expense
    ? Math.round(((summary.expense - prevSummary.expense) / prevSummary.expense) * 100)
    : 0;

  return {
    month: current.month,
    label: D.monthLabel(current.month, user.language),
    isCurrentMonth,
    daysTotal,
    ...summary,
    forecast,
    previous: { income: prevSummary.income, expense: prevSummary.expense },
    diffPercent,
    breakdown,
    budgets
  };
}

/** Доходы/расходы по месяцам — для графика тренда. */
export async function trend(user, months = 6) {
  const buckets = D.monthsBack(user.timezone, months, user.language);

  const data = await Promise.all(
    buckets.map(async (bucket) => {
      const totals = await TransactionModel.totals(user.id, bucket);
      return { month: bucket.month, label: bucket.label, ...totals };
    })
  );

  return data;
}

/** Расходы по дням внутри периода — для мини-графика. */
export async function dailySeries(user, { from, to }) {
  const rows = await TransactionModel.raw(user.id, { from, to });
  const map = new Map();

  let cursor = D.dayjs(from).tz(user.timezone).startOf('day');
  const end = D.dayjs(to).tz(user.timezone).startOf('day');
  while (cursor.isBefore(end) || cursor.isSame(end)) {
    map.set(cursor.format('YYYY-MM-DD'), { date: cursor.format('YYYY-MM-DD'), income: 0, expense: 0 });
    cursor = cursor.add(1, 'day');
  }

  for (const row of rows) {
    const key = D.dayjs(row.date).tz(user.timezone).format('YYYY-MM-DD');
    const bucket = map.get(key);
    if (!bucket) continue;
    if (row.type === 'INCOME') bucket.income += row.amount;
    else bucket.expense += row.amount;
  }

  return [...map.values()];
}

export async function budgetStatus(user, monthKey) {
  const month = monthKey || D.currentMonthKey(user.timezone);
  const { from, to } = D.monthRange(user.timezone, month);

  const [budgets, breakdown] = await Promise.all([
    BudgetModel.list(user.id, month),
    TransactionModel.byCategory(user.id, { from, to, type: 'EXPENSE' })
  ]);

  const spentMap = new Map(breakdown.map((row) => [row.categoryId, row.total]));

  return budgets.map((budget) => {
    const spent = spentMap.get(budget.categoryId) || 0;
    return {
      id: budget.id,
      month: budget.month,
      categoryId: budget.categoryId,
      category: budget.category,
      amount: budget.amount,
      spent,
      left: Math.max(0, budget.amount - spent),
      percent: pct(spent, budget.amount),
      isOver: spent > budget.amount
    };
  });
}

export async function goalsProgress(user) {
  const goals = await GoalModel.list(user.id);
  const monthly = await monthlySavingPace(user);

  return goals.map((goal) => {
    const left = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthsLeft = monthly > 0 ? Math.ceil(left / monthly) : null;

    return {
      ...goal,
      left,
      percent: Math.min(100, pct(goal.currentAmount, goal.targetAmount)),
      monthsLeft,
      etaDate: monthsLeft ? D.now(user.timezone).add(monthsLeft, 'month').toDate() : null
    };
  });
}

/** Средняя сумма, которую пользователь реально откладывает в месяц. */
export async function monthlySavingPace(user) {
  const months = await trend(user, 3);
  const positive = months.map((m) => Math.max(0, m.balance));
  const sum = positive.reduce((a, b) => a + b, 0);
  return Math.round(sum / (positive.length || 1));
}

/** Индекс финансового здоровья 0..100. */
export async function healthScore(user) {
  const tz = user.timezone;
  const month = D.currentMonthKey(tz);
  const [overview, goals, debts, last14] = await Promise.all([
    monthOverview(user, month),
    GoalModel.list(user.id),
    DebtModel.list(user.id, { onlyOpen: true }),
    TransactionModel.raw(user.id, D.lastDays(tz, 14))
  ]);

  const factors = [];

  // 1. Норма сбережений
  const savingPoints = Math.max(0, Math.min(30, Math.round((overview.savedPercent / 20) * 30)));
  factors.push({ key: 'savings', points: savingPoints, max: 30, value: overview.savedPercent });

  // 2. Регулярность учёта
  const activeDays = new Set(last14.map((r) => D.dayjs(r.date).tz(tz).format('YYYY-MM-DD'))).size;
  const regularityPoints = Math.min(20, Math.round((activeDays / 14) * 20));
  factors.push({ key: 'regularity', points: regularityPoints, max: 20, value: activeDays });

  // 3. Подушка безопасности (накопления в целях / средние расходы)
  const saved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const monthsCovered = overview.expense > 0 ? saved / overview.expense : 0;
  const cushionPoints = Math.min(25, Math.round((monthsCovered / 3) * 25));
  factors.push({ key: 'cushion', points: cushionPoints, max: 25, value: Number(monthsCovered.toFixed(1)) });

  // 4. Бюджетная дисциплина
  const over = overview.budgets.filter((b) => b.isOver).length;
  const budgetPoints = overview.budgets.length
    ? Math.max(0, 15 - over * 5)
    : 8;
  factors.push({ key: 'budget', points: budgetPoints, max: 15, value: over });

  // 5. Долговая нагрузка
  const owed = debts.filter((d) => d.direction === 'I_OWE').reduce((s, d) => s + d.amount, 0);
  const load = overview.income > 0 ? owed / overview.income : owed > 0 ? 1 : 0;
  const debtPoints = Math.max(0, Math.round(10 - load * 10));
  factors.push({ key: 'debt', points: debtPoints, max: 10, value: Math.round(load * 100) });

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const level = score >= 80 ? 'great' : score >= 60 ? 'good' : score >= 40 ? 'ok' : 'weak';

  return { score, level, factors };
}

/**
 * Обновляет серию ежедневного учёта.
 * Возвращает { streak, isNewDay, isRecord }.
 */
export async function registerEntry(user) {
  const tz = user.timezone;
  const today = D.now(tz).startOf('day');
  const last = user.lastEntryDate ? D.dayjs(user.lastEntryDate).tz(tz).startOf('day') : null;

  if (last && last.isSame(today)) {
    return { streak: user.streakCount, isNewDay: false, isRecord: false };
  }

  const isConsecutive = last && today.diff(last, 'day') === 1;
  const streak = isConsecutive ? user.streakCount + 1 : 1;
  const bestStreak = Math.max(streak, user.bestStreak);

  await UserModel.update(user.id, {
    streakCount: streak,
    bestStreak,
    lastEntryDate: today.toDate()
  });

  return { streak, isNewDay: true, isRecord: streak === bestStreak && streak > 1 };
}

export default {
  periodSummary,
  categoryBreakdown,
  monthOverview,
  trend,
  dailySeries,
  budgetStatus,
  goalsProgress,
  monthlySavingPace,
  healthScore,
  registerEntry
};
