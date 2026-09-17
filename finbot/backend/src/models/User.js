import prisma from '../database/connection.js';
import config from '../config/default.js';

export const UserModel = {
  findByTelegramId(telegramId) {
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id: Number(id) } });
  },

  async findOrCreate({ telegramId, firstName, lastName, username }) {
    const id = String(telegramId);
    const existing = await prisma.user.findUnique({ where: { telegramId: id } });

    if (existing) {
      const patch = {};
      if (firstName && firstName !== existing.firstName) patch.firstName = firstName;
      if (username !== undefined && username !== existing.username) patch.username = username || null;
      if (Object.keys(patch).length) {
        return prisma.user.update({ where: { id: existing.id }, data: patch });
      }
      return existing;
    }

    return prisma.user.create({
      data: {
        telegramId: id,
        firstName: firstName || 'Друг',
        lastName: lastName || null,
        username: username || null,
        language: config.defaults.language,
        currency: config.defaults.currency,
        timezone: config.defaults.timezone,
        reminderTime: config.defaults.reminderTime
      }
    });
  },

  update(id, data) {
    return prisma.user.update({ where: { id: Number(id) }, data });
  },

  list({ skip = 0, take = 100 } = {}) {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { _count: { select: { transactions: true, goals: true } } }
    });
  },

  count() {
    return prisma.user.count();
  },

  withReminders() {
    return prisma.user.findMany({ where: { reminderEnabled: true, onboarded: true } });
  },

  async wipeData(userId) {
    const id = Number(userId);
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.budget.deleteMany({ where: { userId: id } }),
      prisma.goal.deleteMany({ where: { userId: id } }),
      prisma.debt.deleteMany({ where: { userId: id } }),
      prisma.recurring.deleteMany({ where: { userId: id } }),
      prisma.reminderLog.deleteMany({ where: { userId: id } }),
      prisma.category.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: { streakCount: 0, bestStreak: 0, lastEntryDate: null, noSpendDays: 0 }
      })
    ]);
  }
};

export default UserModel;
