import prisma from '../database/connection.js';

const range = (from, to) => ({ gte: from, lte: to });

export const TransactionModel = {
  create(data) {
    return prisma.transaction.create({ data, include: { category: true } });
  },

  findById(id) {
    return prisma.transaction.findUnique({ where: { id: Number(id) }, include: { category: true, user: true } });
  },

  update(id, data) {
    return prisma.transaction.update({ where: { id: Number(id) }, data, include: { category: true } });
  },

  remove(id) {
    return prisma.transaction.delete({ where: { id: Number(id) } });
  },

  list(userId, { from, to, type, categoryId, take = 50, skip = 0 } = {}) {
    return prisma.transaction.findMany({
      where: {
        userId: Number(userId),
        ...(from && to ? { date: range(from, to) } : {}),
        ...(type ? { type } : {}),
        ...(categoryId ? { categoryId: Number(categoryId) } : {})
      },
      include: { category: true },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take,
      skip
    });
  },

  count(userId, where = {}) {
    return prisma.transaction.count({ where: { userId: Number(userId), ...where } });
  },

  async sum(userId, { from, to, type } = {}) {
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: Number(userId),
        ...(from && to ? { date: range(from, to) } : {}),
        ...(type ? { type } : {})
      }
    });
    return result._sum.amount || 0;
  },

  async totals(userId, { from, to } = {}) {
    const [income, expense] = await Promise.all([
      TransactionModel.sum(userId, { from, to, type: 'INCOME' }),
      TransactionModel.sum(userId, { from, to, type: 'EXPENSE' })
    ]);
    return { income, expense, balance: income - expense };
  },

  async byCategory(userId, { from, to, type = 'EXPENSE' } = {}) {
    const rows = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      _count: { _all: true },
      where: {
        userId: Number(userId),
        type,
        ...(from && to ? { date: range(from, to) } : {})
      }
    });

    const ids = rows.map((r) => r.categoryId).filter(Boolean);
    const categories = ids.length
      ? await prisma.category.findMany({ where: { id: { in: ids } } })
      : [];
    const map = new Map(categories.map((c) => [c.id, c]));

    return rows
      .map((row) => ({
        categoryId: row.categoryId,
        category: map.get(row.categoryId) || null,
        total: row._sum.amount || 0,
        count: row._count._all
      }))
      .sort((a, b) => b.total - a.total);
  },

  /** Все операции в диапазоне — для построения дневных/месячных срезов. */
  raw(userId, { from, to, type } = {}) {
    return prisma.transaction.findMany({
      where: {
        userId: Number(userId),
        ...(from && to ? { date: range(from, to) } : {}),
        ...(type ? { type } : {})
      },
      select: { id: true, amount: true, type: true, date: true, note: true, categoryId: true },
      orderBy: { date: 'asc' }
    });
  },

  listAll({ userId, type, from, to, take = 100, skip = 0 } = {}) {
    return prisma.transaction.findMany({
      where: {
        ...(userId ? { userId: Number(userId) } : {}),
        ...(type ? { type } : {}),
        ...(from && to ? { date: range(from, to) } : {})
      },
      include: { category: true, user: true },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take,
      skip
    });
  },

  countAll(where = {}) {
    return prisma.transaction.count({ where });
  },

  async lastFor(userId) {
    const [tx] = await prisma.transaction.findMany({
      where: { userId: Number(userId) },
      include: { category: true },
      orderBy: { id: 'desc' },
      take: 1
    });
    return tx || null;
  }
};

export default TransactionModel;
