import prisma from '../database/connection.js';
import UserModel from '../models/User.js';
import CategoryModel from '../models/Category.js';
import TransactionModel from '../models/Transaction.js';
import GoalModel from '../models/Goal.js';
import DebtModel from '../models/Debt.js';
import * as D from '../services/date.service.js';
import { categoryName } from '../services/format.service.js';
import { notify } from '../core/bot.js';
import config from '../config/default.js';

export function login(req, res) {
  const token = req.body?.token;
  if (!token || token !== config.admin.token) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  res.json({ ok: true, token });
}

/* ------------------------------- Дашборд --------------------------------- */

export async function dashboard(req, res) {
  const tz = config.defaults.timezone;
  const month = D.monthRange(tz);
  const prev = D.prevMonthRange(tz);

  const [usersCount, txCount, monthAgg, prevAgg, recent, topCategories] = await Promise.all([
    UserModel.count(),
    TransactionModel.countAll(),
    prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: { date: { gte: month.from, lte: month.to } }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: { date: { gte: prev.from, lte: prev.to } }
    }),
    TransactionModel.listAll({ take: 10 }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      _count: { _all: true },
      where: { type: 'EXPENSE', date: { gte: month.from, lte: month.to } }
    })
  ]);

  const pick = (rows, type) => rows.find((r) => r.type === type)?._sum.amount || 0;
  const categoryIds = topCategories.map((row) => row.categoryId).filter(Boolean);
  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : [];
  const map = new Map(categories.map((c) => [c.id, c]));

  const months = D.monthsBack(tz, 6, 'ru');
  const trend = await Promise.all(
    months.map(async (bucket) => {
      const rows = await prisma.transaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: { date: { gte: bucket.from, lte: bucket.to } }
      });
      return {
        month: bucket.month,
        label: bucket.label,
        income: pick(rows, 'INCOME'),
        expense: pick(rows, 'EXPENSE')
      };
    })
  );

  res.json({
    usersCount,
    txCount,
    month: {
      key: month.month,
      income: pick(monthAgg, 'INCOME'),
      expense: pick(monthAgg, 'EXPENSE')
    },
    previous: {
      income: pick(prevAgg, 'INCOME'),
      expense: pick(prevAgg, 'EXPENSE')
    },
    trend,
    topCategories: topCategories
      .map((row) => ({
        categoryId: row.categoryId,
        category: map.get(row.categoryId) || null,
        total: row._sum.amount || 0,
        count: row._count._all
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    recent
  });
}

/* ----------------------------- Пользователи ------------------------------ */

export async function listUsers(req, res) {
  const users = await UserModel.list({
    skip: Number(req.query.skip || 0),
    take: Number(req.query.take || 100)
  });
  res.json({ users });
}

export async function getUser(req, res) {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });

  const tz = user.timezone;
  const [month, transactions, goals, debts] = await Promise.all([
    TransactionModel.totals(user.id, D.monthRange(tz)),
    TransactionModel.list(user.id, { take: 20 }),
    GoalModel.list(user.id),
    DebtModel.list(user.id, { onlyOpen: false })
  ]);

  res.json({ user, month, transactions, goals, debts });
}

export async function updateUser(req, res) {
  const allowed = ['language', 'currency', 'timezone', 'reminderEnabled', 'reminderTime', 'savingsRate'];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];

  const user = await UserModel.update(req.params.id, data);
  res.json({ user });
}

/* ------------------------------- Операции -------------------------------- */

export async function listTransactions(req, res) {
  const where = {
    ...(req.query.userId ? { userId: Number(req.query.userId) } : {}),
    ...(req.query.type ? { type: req.query.type } : {}),
    ...(req.query.month
      ? {
          date: {
            gte: D.monthRange(config.defaults.timezone, req.query.month).from,
            lte: D.monthRange(config.defaults.timezone, req.query.month).to
          }
        }
      : {})
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: true, category: true },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: Number(req.query.take || 100),
      skip: Number(req.query.skip || 0)
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({ transactions, total });
}

export async function removeTransaction(req, res) {
  await TransactionModel.remove(req.params.id);
  res.json({ ok: true });
}

export async function updateTransaction(req, res) {
  const data = {};
  if (req.body.amount !== undefined) data.amount = Math.round(Number(req.body.amount));
  if (req.body.note !== undefined) data.note = req.body.note;
  if (req.body.categoryId !== undefined) data.categoryId = Number(req.body.categoryId);
  if (req.body.type !== undefined) data.type = req.body.type;

  const transaction = await TransactionModel.update(req.params.id, data);
  res.json({ transaction });
}

/* ------------------------------ Категории -------------------------------- */

export async function listCategories(req, res) {
  res.json({ categories: await CategoryModel.listAll() });
}

export async function createCategory(req, res) {
  const { nameRu, nameUz, emoji, color, type, keywords } = req.body;
  if (!nameRu || !nameUz) return res.status(400).json({ error: 'name_required' });

  const category = await CategoryModel.create({
    key: req.body.key || `admin_${Date.now()}`,
    nameRu,
    nameUz,
    emoji: emoji || '🏷',
    color: color || '#898781',
    type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
    keywords: keywords || '',
    isDefault: true,
    sort: Number(req.body.sort || 50)
  });

  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const allowed = ['nameRu', 'nameUz', 'emoji', 'color', 'type', 'keywords', 'sort'];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (data.sort !== undefined) data.sort = Number(data.sort);

  const category = await CategoryModel.update(req.params.id, data);
  res.json({ category });
}

export async function removeCategory(req, res) {
  await CategoryModel.remove(req.params.id);
  res.json({ ok: true });
}

/* -------------------------- Цели и рассылка ------------------------------ */

export async function listGoals(req, res) {
  res.json({ goals: await GoalModel.listAll() });
}

export async function broadcast(req, res) {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text_required' });

  const users = await prisma.user.findMany({ select: { telegramId: true } });
  let sent = 0;

  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await notify(user.telegramId, text);
    if (ok) sent += 1;
  }

  res.json({ ok: true, sent, total: users.length });
}

export async function exportCsv(req, res) {
  const rows = await TransactionModel.listAll({ take: 10000 });
  const header = 'date;user;type;category;amount;note';
  const body = rows
    .map((row) =>
      [
        D.dayjs(row.date).format('YYYY-MM-DD HH:mm'),
        (row.user?.firstName || '').replace(/;/g, ','),
        row.type === 'INCOME' ? 'income' : 'expense',
        (categoryName(row.category, 'ru') || '').replace(/;/g, ','),
        Math.round(row.amount),
        (row.note || '').replace(/[;\n\r]/g, ' ')
      ].join(';')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="all-transactions.csv"');
  res.send(`﻿${header}\n${body}`);
}

export default {
  login,
  dashboard,
  listUsers,
  getUser,
  updateUser,
  listTransactions,
  removeTransaction,
  updateTransaction,
  listCategories,
  createCategory,
  updateCategory,
  removeCategory,
  listGoals,
  broadcast,
  exportCsv
};
