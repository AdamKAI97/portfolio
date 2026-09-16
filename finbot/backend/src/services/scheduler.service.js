import cron from 'node-cron';
import { Markup } from 'telegraf';
import prisma from '../database/connection.js';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import RecurringModel from '../models/Recurring.js';
import { notify } from '../core/bot.js';
import { t } from '../locales/index.js';
import * as A from './analytics.service.js';
import * as D from './date.service.js';
import { money, signedMoney } from '../services/format.service.js';

const WEEKLY_TIME = '20:00';
const MONTHLY_TIME = '10:00';
const RECURRING_TIME = '10:00';

async function alreadySent(userId, kind, key) {
  const log = await prisma.reminderLog.findUnique({
    where: { userId_kind_key: { userId, kind, key } }
  });
  return Boolean(log);
}

async function markSent(userId, kind, key) {
  await prisma.reminderLog.upsert({
    where: { userId_kind_key: { userId, kind, key } },
    create: { userId, kind, key },
    update: { sentAt: new Date() }
  });
}

async function sendDailyReminder(user) {
  const todayCount = await TransactionModel.count(user.id, {
    date: { gte: D.todayRange(user.timezone).from, lte: D.todayRange(user.timezone).to }
  });

  if (todayCount === 0) {
    await notify(user.telegramId, t(user.language, 'reminder.daily', { name: user.firstName }), {
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(t(user.language, 'reminder.dailyExpense'), 'quick:expense'),
          Markup.button.callback(t(user.language, 'reminder.dailyIncome'), 'quick:income')
        ],
        [Markup.button.callback(t(user.language, 'tx.noSpendButton'), 'nospend')]
      ])
    });
  }
}

async function sendPeriodReport(user, kind) {
  const range = kind === 'weekly' ? D.weekRange(user.timezone) : D.prevMonthRange(user.timezone);
  const summary = await A.periodSummary(user, range);
  if (!summary.count) return;

  const label =
    kind === 'weekly'
      ? `${D.formatDate(range.from, user.timezone, user.language)} — ${D.formatDate(range.to, user.timezone, user.language)}`
      : D.monthLabel(range.month, user.language);

  const breakdown = await A.categoryBreakdown(user, range);
  const lines = [
    t(user.language, kind === 'weekly' ? 'reminder.weekly' : 'reminder.monthly', { period: label }),
    '',
    `➕ ${t(user.language, 'report.income', { value: money(summary.income, user.currency, user.language) })}`,
    `➖ ${t(user.language, 'report.expense', { value: money(summary.expense, user.currency, user.language) })}`,
    `💼 ${t(user.language, 'report.balance', {
      value: signedMoney(summary.balance, summary.balance >= 0 ? 'INCOME' : 'EXPENSE', user.currency, user.language)
    })}`
  ];

  if (breakdown.length) {
    lines.push('', t(user.language, 'report.topTitle'));
    for (const row of breakdown.slice(0, 3)) {
      const name = user.language === 'uz' ? row.category?.nameUz : row.category?.nameRu;
      lines.push(`${row.category?.emoji || '💸'} ${name || '—'} — ${money(row.total, user.currency, user.language)} (${row.percent}%)`);
    }
  }

  await notify(user.telegramId, lines.join('\n'));
}

async function sendRecurring(user) {
  const month = D.currentMonthKey(user.timezone);
  const day = D.dayOfMonth(user.timezone);
  const items = await RecurringModel.dueOn(user.id, day, month);

  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await notify(
      user.telegramId,
      t(user.language, 'reminder.recurring', {
        title: item.title,
        amount: money(item.amount, user.currency, user.language)
      })
    );
    // eslint-disable-next-line no-await-in-loop
    await RecurringModel.update(item.id, { lastNotified: month });
  }
}

async function tick() {
  const users = await UserModel.withReminders();

  for (const user of users) {
    try {
      const tz = user.timezone;
      const time = D.localTime(tz);
      const today = D.todayKey(tz);
      const month = D.currentMonthKey(tz);
      const weekKey = D.now(tz).startOf('isoWeek').format('YYYY-MM-DD');

      if (user.reminderEnabled && time === user.reminderTime) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'daily', today))) {
          // eslint-disable-next-line no-await-in-loop
          await sendDailyReminder(user);
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'daily', today);
        }
      }

      if (user.weeklyReport && D.now(tz).isoWeekday() === 7 && time === WEEKLY_TIME) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'weekly', weekKey))) {
          // eslint-disable-next-line no-await-in-loop
          await sendPeriodReport(user, 'weekly');
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'weekly', weekKey);
        }
      }

      if (D.dayOfMonth(tz) === 1 && time === MONTHLY_TIME) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'monthly', month))) {
          // eslint-disable-next-line no-await-in-loop
          await sendPeriodReport(user, 'monthly');
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'monthly', month);
        }
      }

      if (time === RECURRING_TIME) {
        // eslint-disable-next-line no-await-in-loop
        await sendRecurring(user);
      }
    } catch (error) {
      console.error(`Планировщик: ошибка для пользователя ${user.id}:`, error.message);
    }
  }
}

export function startScheduler() {
  cron.schedule('* * * * *', () => {
    tick().catch((error) => console.error('Планировщик упал:', error.message));
  });
  console.log('⏰ Планировщик напоминаний запущен (проверка каждую минуту)');
}

export default { startScheduler };
