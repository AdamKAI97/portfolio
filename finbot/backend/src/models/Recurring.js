import prisma from '../database/connection.js';

export const RecurringModel = {
  list(userId) {
    return prisma.recurring.findMany({
      where: { userId: Number(userId) },
      include: { category: true },
      orderBy: { dayOfMonth: 'asc' }
    });
  },

  create(data) {
    return prisma.recurring.create({ data, include: { category: true } });
  },

  update(id, data) {
    return prisma.recurring.update({ where: { id: Number(id) }, data, include: { category: true } });
  },

  remove(id) {
    return prisma.recurring.delete({ where: { id: Number(id) } });
  },

  dueOn(userId, dayOfMonth, month) {
    return prisma.recurring.findMany({
      where: {
        userId: Number(userId),
        isActive: true,
        dayOfMonth: Number(dayOfMonth),
        NOT: { lastNotified: month }
      },
      include: { category: true }
    });
  },

  listAll() {
    return prisma.recurring.findMany({ include: { user: true, category: true } });
  }
};

export default RecurringModel;
