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
import { money, signedMoney } from './format.service.js';

const WEEKLY_TIME = '20:00';
const MONTHLY_TIME = '10:00';
const RECURRING_TIME = '10:00';

const minutes = (time) => {
  const [h, m] = String(time || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Наступило ли уже указанное время по местному времени пользователя. */
const timeReached = (tz, target) => minutes(D.localTime(tz)) >= minutes(target);

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
  const range = D.todayRange(user.timezone);
  const todayCount = await TransactionModel.count(user.id, {
    date: { gte: range.from, lte: range.to }
  });

  if (todayCount > 0) return false;

  await notify(user.telegramId, t(user.language, 'reminder.daily', { name: user.firstName }), {
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback(t(user.language, 'reminder.dailyExpense'), 'quick:expense'),
        Markup.button.callback(t(user.language, 'reminder.dailyIncome'), 'quick:income')
      ],
      [Markup.button.callback(t(user.language, 'tx.noSpendButton'), 'nospend')]
    ])
  });

  return true;
}

async function sendPeriodReport(user, kind) {
  const range = kind === 'weekly' ? D.weekRange(user.timezone) : D.prevMonthRange(user.timezone);
  const summary = await A.periodSummary(user, range);
  if (!summary.count) return false;

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
      lines.push(
        `${row.category?.emoji || '💸'} ${name || '—'} — ${money(row.total, user.currency, user.language)} (${row.percent}%)`
      );
    }
  }

  await notify(user.telegramId, lines.join('\n'));
  return true;
}

async function sendRecurring(user) {
  const month = D.currentMonthKey(user.timezone);
  const day = D.dayOfMonth(user.timezone);
  const items = await RecurringModel.dueOn(user.id, day, month);
  let sent = 0;

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
    sent += 1;
  }

  return sent;
}

/**
 * Один проход планировщика. Вызывается и локально (раз в минуту),
 * и в облаке (по расписанию из vercel.json или внешним планировщиком).
 *
 * Сравнение идёт по принципу «время уже наступило, а сообщение ещё не отправляли»,
 * поэтому частота вызовов не важна: раз в минуту, раз в час или раз в сутки.
 */
export async function runReminders() {
  const users = await UserModel.withReminders();
  let sent = 0;

  for (const user of users) {
    try {
      const tz = user.timezone;
      const today = D.todayKey(tz);
      const month = D.currentMonthKey(tz);
      const weekKey = D.now(tz).startOf('isoWeek').format('YYYY-MM-DD');

      if (user.reminderEnabled && timeReached(tz, user.reminderTime)) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'daily', today))) {
          // eslint-disable-next-line no-await-in-loop
          if (await sendDailyReminder(user)) sent += 1;
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'daily', today);
        }
      }

      if (user.weeklyReport && D.now(tz).isoWeekday() === 7 && timeReached(tz, WEEKLY_TIME)) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'weekly', weekKey))) {
          // eslint-disable-next-line no-await-in-loop
          if (await sendPeriodReport(user, 'weekly')) sent += 1;
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'weekly', weekKey);
        }
      }

      if (D.dayOfMonth(tz) === 1 && timeReached(tz, MONTHLY_TIME)) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await alreadySent(user.id, 'monthly', month))) {
          // eslint-disable-next-line no-await-in-loop
          if (await sendPeriodReport(user, 'monthly')) sent += 1;
          // eslint-disable-next-line no-await-in-loop
          await markSent(user.id, 'monthly', month);
        }
      }

      if (timeReached(tz, RECURRING_TIME)) {
        // eslint-disable-next-line no-await-in-loop
        sent += await sendRecurring(user);
      }
    } catch (error) {
      console.error(`Планировщик: ошибка для пользователя ${user.id}:`, error.message);
    }
  }

  return { users: users.length, sent };
}

/** Локальный режим: свой планировщик раз в минуту. */
export function startScheduler() {
  cron.schedule('* * * * *', () => {
    runReminders().catch((error) => console.error('Планировщик упал:', error.message));
  });
  console.log('⏰ Планировщик напоминаний запущен');
}

export default { startScheduler, runReminders };
