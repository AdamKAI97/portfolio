import prisma from '../database/connection.js';

export const DebtModel = {
  list(userId, { onlyOpen = true } = {}) {
    return prisma.debt.findMany({
      where: { userId: Number(userId), ...(onlyOpen ? { isSettled: false } : {}) },
      orderBy: [{ isSettled: 'asc' }, { createdAt: 'desc' }]
    });
  },

  create(data) {
    return prisma.debt.create({ data });
  },

  update(id, data) {
    return prisma.debt.update({ where: { id: Number(id) }, data });
  },

  settle(id) {
    return prisma.debt.update({ where: { id: Number(id) }, data: { isSettled: true } });
  },

  remove(id) {
    return prisma.debt.delete({ where: { id: Number(id) } });
  },

  listAll() {
    return prisma.debt.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  }
};

export default DebtModel;
