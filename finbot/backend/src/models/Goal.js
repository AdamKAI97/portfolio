import prisma from '../database/connection.js';

export const GoalModel = {
  list(userId, { onlyActive = false } = {}) {
    return prisma.goal.findMany({
      where: { userId: Number(userId), ...(onlyActive ? { isDone: false } : {}) },
      orderBy: [{ isDone: 'asc' }, { createdAt: 'desc' }]
    });
  },

  findById(id) {
    return prisma.goal.findUnique({ where: { id: Number(id) } });
  },

  create(data) {
    return prisma.goal.create({ data });
  },

  update(id, data) {
    return prisma.goal.update({ where: { id: Number(id) }, data });
  },

  remove(id) {
    return prisma.goal.delete({ where: { id: Number(id) } });
  },

  async deposit(id, amount) {
    const goal = await prisma.goal.findUnique({ where: { id: Number(id) } });
    if (!goal) return null;

    const current = goal.currentAmount + Number(amount);
    return prisma.goal.update({
      where: { id: goal.id },
      data: {
        currentAmount: current,
        isDone: current >= goal.targetAmount
      }
    });
  },

  listAll() {
    return prisma.goal.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  }
};

export default GoalModel;
