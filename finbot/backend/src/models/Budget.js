import prisma from '../database/connection.js';

export const BudgetModel = {
  list(userId, month) {
    return prisma.budget.findMany({
      where: { userId: Number(userId), ...(month ? { month } : {}) },
      include: { category: true },
      orderBy: { id: 'asc' }
    });
  },

  find(userId, categoryId, month) {
    return prisma.budget.findUnique({
      where: {
        userId_categoryId_month: {
          userId: Number(userId),
          categoryId: Number(categoryId),
          month
        }
      },
      include: { category: true }
    });
  },

  upsert(userId, categoryId, month, amount) {
    return prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: Number(userId),
          categoryId: Number(categoryId),
          month
        }
      },
      create: { userId: Number(userId), categoryId: Number(categoryId), month, amount },
      update: { amount },
      include: { category: true }
    });
  },

  remove(id) {
    return prisma.budget.delete({ where: { id: Number(id) } });
  },

  listAll() {
    return prisma.budget.findMany({ include: { category: true, user: true } });
  }
};

export default BudgetModel;
