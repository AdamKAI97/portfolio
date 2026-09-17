import TransactionModel from '../models/Transaction.js';
import GoalModel from '../models/Goal.js';
import * as A from './analytics.service.js';
import * as D from './date.service.js';

const LIST = [
  {
    id: 'first_entry',
    emoji: '📝',
    ru: { title: 'Первый шаг', desc: 'Записать первую операцию' },
    uz: { title: 'Birinchi qadam', desc: 'Birinchi amaliyotni yozish' },
    goal: 1,
    value: (c) => c.txCount
  },
  {
    id: 'entries_50',
    emoji: '🧾',
    ru: { title: 'Педант', desc: '50 записей в базе' },
    uz: { title: 'Puxta hisobchi', desc: 'Bazada 50 ta yozuv' },
    goal: 50,
    value: (c) => c.txCount
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    ru: { title: 'Неделя дисциплины', desc: '7 дней учёта подряд' },
    uz: { title: 'Intizomli hafta', desc: 'Ketma-ket 7 kun hisob' },
    goal: 7,
    value: (c) => c.bestStreak
  },
  {
    id: 'streak_30',
    emoji: '🏅',
    ru: { title: 'Железная привычка', desc: '30 дней учёта подряд' },
    uz: { title: 'Temir odat', desc: 'Ketma-ket 30 kun hisob' },
    goal: 30,
    value: (c) => c.bestStreak
  },
  {
    id: 'no_spend_5',
    emoji: '🟢',
    ru: { title: 'Мастер паузы', desc: '5 дней без трат за месяц' },
    uz: { title: 'Pauza ustasi', desc: 'Oyiga 5 kun xarajatsiz' },
    goal: 5,
    value: (c) => c.noSpendDays
  },
  {
    id: 'saver_20',
    emoji: '💰',
    ru: { title: 'Копилка работает', desc: 'Отложить 20% дохода за месяц' },
    uz: { title: 'Jamg‘arma ishlaydi', desc: 'Oyiga daromadning 20% ini jamg‘arish' },
    goal: 20,
    value: (c) => c.savedPercent
  },
  {
    id: 'budget_keeper',
    emoji: '🎛',
    ru: { title: 'Хозяин бюджета', desc: 'Месяц без превышения лимитов' },
    uz: { title: 'Byudjet egasi', desc: 'Limitlarsiz oshirilgan oy' },
    goal: 1,
    value: (c) => (c.budgetsCount > 0 && c.budgetsOver === 0 ? 1 : 0)
  },
  {
    id: 'goal_done',
    emoji: '🏆',
    ru: { title: 'Цель взята', desc: 'Закрыть первую цель' },
    uz: { title: 'Maqsad qo‘lga kiritildi', desc: 'Birinchi maqsadni yopish' },
    goal: 1,
    value: (c) => c.goalsDone
  },
  {
    id: 'cushion_1',
    emoji: '🛡',
    ru: { title: 'Подушка на месяц', desc: 'Накопить месячный расход' },
    uz: { title: 'Bir oylik yostiq', desc: 'Bir oylik xarajatni jamg‘arish' },
    goal: 1,
    value: (c) => (c.monthExpense > 0 ? Math.min(1, c.savedTotal / c.monthExpense) : 0)
  },
  {
    id: 'cheaper_month',
    emoji: '📉',
    ru: { title: 'Экономный месяц', desc: 'Потратить меньше, чем в прошлом месяце' },
    uz: { title: 'Tejamkor oy', desc: 'O‘tgan oydan kam sarflash' },
    goal: 1,
    value: (c) => (c.prevExpense > 0 && c.monthExpense > 0 && c.monthExpense < c.prevExpense ? 1 : 0)
  }
];

async function buildContext(user) {
  const tz = user.timezone;
  const monthKey = D.currentMonthKey(tz);

  const [txCount, overview, goals] = await Promise.all([
    TransactionModel.count(user.id),
    A.monthOverview(user, monthKey),
    GoalModel.list(user.id)
  ]);

  return {
    txCount,
    bestStreak: user.bestStreak,
    noSpendDays: overview.noSpendDays,
    savedPercent: overview.savedPercent,
    monthExpense: overview.expense,
    prevExpense: overview.previous.expense,
    budgetsCount: overview.budgets.length,
    budgetsOver: overview.budgets.filter((b) => b.isOver).length,
    goalsDone: goals.filter((g) => g.isDone).length,
    savedTotal: goals.reduce((sum, g) => sum + g.currentAmount, 0)
  };
}

export async function getAchievements(user) {
  const lang = user.language === 'uz' ? 'uz' : 'ru';
  const ctx = await buildContext(user);

  const items = LIST.map((item) => {
    const value = Number(item.value(ctx)) || 0;
    const percent = Math.min(100, Math.round((value / item.goal) * 100));
    return {
      id: item.id,
      emoji: item.emoji,
      title: item[lang].title,
      description: item[lang].desc,
      unlocked: value >= item.goal,
      percent
    };
  });

  return {
    items,
    unlocked: items.filter((i) => i.unlocked).length,
    total: items.length
  };
}

export default { getAchievements };
