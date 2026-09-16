import { Markup } from 'telegraf';
import config from '../config/default.js';
import { t } from '../locales/index.js';
import UserModel from '../models/User.js';
import CategoryModel from '../models/Category.js';
import TransactionModel from '../models/Transaction.js';
import BudgetModel from '../models/Budget.js';
import GoalModel from '../models/Goal.js';
import DebtModel from '../models/Debt.js';
import * as A from '../services/analytics.service.js';
import * as D from '../services/date.service.js';
import { buildAdvice } from '../services/advice.service.js';
import { getAchievements } from '../services/achievements.service.js';
import { parseEntry, parseAmount, parseTime, parsePercent } from '../services/parser.service.js';
import { money, signedMoney, progressBar, categoryName } from '../services/format.service.js';
import { mainKeyboard, languageKeyboard, categoryKeyboard, webAppButton } from '../core/bot.js';

const esc = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function getUser(ctx) {
  return UserModel.findOrCreate({
    telegramId: ctx.from.id,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username
  });
}

const M = (user, value) => money(value, user.currency, user.language);
const state = (ctx, value) => {
  ctx.session = ctx.session || {};
  ctx.session.state = value;
};
const clear = (ctx) => {
  ctx.session = {};
};

/* ---------------------------------- СТАРТ --------------------------------- */

export async function start(ctx) {
  const user = await getUser(ctx);
  clear(ctx);

  if (!user.onboarded) {
    await ctx.reply(t(user.language, 'lang.choose'), languageKeyboard());
    return;
  }

  await ctx.reply(t(user.language, 'start.welcome', { name: user.firstName }), mainKeyboard(user.language));
}

export async function setLanguage(ctx, code) {
  const user = await getUser(ctx);
  const updated = await UserModel.update(user.id, { language: code, onboarded: true });

  await ctx.answerCbQuery();
  await ctx.editMessageText(t(code, 'lang.saved'));
  await ctx.reply(t(code, 'start.welcome', { name: updated.firstName }), mainKeyboard(code));
}

export async function showMenu(ctx) {
  const user = await getUser(ctx);
  await ctx.reply(t(user.language, 'start.menuHint'), mainKeyboard(user.language));
}

export async function openApp(ctx) {
  const user = await getUser(ctx);
  const keyboard = webAppButton(user.language);

  if (keyboard) {
    await ctx.reply(t(user.language, 'app.text'), keyboard);
  } else {
    await ctx.reply(`${t(user.language, 'app.text')}\n\n${config.bot.webAppUrl}`);
  }
}

export async function cancel(ctx) {
  const user = await getUser(ctx);
  clear(ctx);
  if (ctx.callbackQuery) await ctx.answerCbQuery();
  await ctx.reply(t(user.language, 'common.canceled'), mainKeyboard(user.language));
}

/* ------------------------------- ОПЕРАЦИИ -------------------------------- */

export async function askAmount(ctx, type) {
  const user = await getUser(ctx);
  state(ctx, { name: 'amount', type });
  await ctx.reply(t(user.language, type === 'INCOME' ? 'tx.askIncome' : 'tx.askExpense'));
}

async function askCategory(ctx, user, pending) {
  const categories = await CategoryModel.listFor(user.id, pending.type);
  ctx.session.pending = pending;
  state(ctx, { name: 'category' });

  await ctx.reply(
    t(user.language, 'tx.chooseCategory', { amount: M(user, pending.amount) }),
    categoryKeyboard(categories, user.language)
  );
}

export async function saveTransaction(ctx, user, { type, amount, note, categoryId, source = 'bot' }) {
  const category = categoryId
    ? await CategoryModel.findById(categoryId)
    : (await CategoryModel.guess(user.id, type, note)) || (await CategoryModel.fallback(user.id, type));

  const tx = await TransactionModel.create({
    userId: user.id,
    categoryId: category?.id || null,
    type,
    amount,
    note: note || null,
    source,
    date: new Date()
  });

  const streak = await A.registerEntry(user);
  const tz = user.timezone;
  const today = await TransactionModel.totals(user.id, D.todayRange(tz));
  const month = await TransactionModel.totals(user.id, D.monthRange(tz));

  const lines = [
    t(user.language, 'tx.saved', {
      sign: type === 'INCOME' ? '+' : '−',
      amount: M(user, amount),
      emoji: category?.emoji || '💸',
      category: esc(categoryName(category, user.language)),
      note: note ? esc(note) : ''
    }),
    '',
    t(user.language, 'tx.todayLine', {
      expense: M(user, today.expense),
      income: M(user, today.income)
    }),
    t(user.language, 'tx.monthLine', { balance: signedMoney(month.balance, month.balance >= 0 ? 'INCOME' : 'EXPENSE', user.currency, user.language) })
  ];

  if (streak.isNewDay && streak.streak > 1) {
    lines.push(t(user.language, 'report.streak', { days: streak.streak }));
  }

  await ctx.reply(lines.join('\n'), {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[Markup.button.callback(t(user.language, 'tx.undo'), `undo:${tx.id}`)]])
  });

  if (type === 'EXPENSE' && category) {
    await checkBudget(ctx, user, category);
  }

  await checkGoalsReached(ctx, user);
  clear(ctx);
  return tx;
}

async function checkBudget(ctx, user, category) {
  const month = D.currentMonthKey(user.timezone);
  const budget = await BudgetModel.find(user.id, category.id, month);
  if (!budget) return;

  const { from, to } = D.monthRange(user.timezone, month);
  const rows = await TransactionModel.byCategory(user.id, { from, to, type: 'EXPENSE' });
  const used = rows.find((r) => r.categoryId === category.id)?.total || 0;
  if (!used) return;
  const percent = Math.round((used / budget.amount) * 100);
  const name = esc(categoryName(category, user.language));

  if (used > budget.amount) {
    await ctx.reply(t(user.language, 'reminder.budgetOver', { category: name, over: M(user, used - budget.amount) }));
  } else if (percent >= 80) {
    await ctx.reply(
      t(user.language, 'reminder.budgetWarn', {
        category: name,
        percent,
        left: M(user, budget.amount - used)
      })
    );
  }
}

async function checkGoalsReached(ctx, user) {
  const goals = await GoalModel.list(user.id, { onlyActive: true });
  for (const goal of goals) {
    if (goal.currentAmount >= goal.targetAmount) {
      await GoalModel.update(goal.id, { isDone: true });
      await ctx.reply(t(user.language, 'goals.reached', { title: esc(goal.title) }));
    }
  }
}

export async function onCategoryChosen(ctx, categoryId) {
  const user = await getUser(ctx);
  const pending = ctx.session?.pending;

  await ctx.answerCbQuery();
  if (!pending) {
    await ctx.reply(t(user.language, 'common.unknown'), mainKeyboard(user.language));
    return;
  }

  try {
    await ctx.editMessageReplyMarkup(undefined);
  } catch (_) { /* сообщение могло устареть */ }

  await saveTransaction(ctx, user, { ...pending, categoryId });
}

export async function onUndo(ctx, txId) {
  const user = await getUser(ctx);
  const tx = await TransactionModel.findById(txId);

  await ctx.answerCbQuery();
  if (!tx || tx.userId !== user.id) return;

  await TransactionModel.remove(tx.id);
  try {
    await ctx.editMessageReplyMarkup(undefined);
  } catch (_) { /* пропускаем */ }
  await ctx.reply(t(user.language, 'tx.undone'));
}

export async function markNoSpendDay(ctx) {
  const user = await getUser(ctx);
  await UserModel.update(user.id, { noSpendDays: user.noSpendDays + 1 });
  await A.registerEntry(user);
  await ctx.answerCbQuery();
  await ctx.reply(t(user.language, 'tx.noSpend'), mainKeyboard(user.language));
}

/* -------------------------------- ОТЧЁТЫ --------------------------------- */

function reportKeyboard(language) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t(language, 'report.button7'), 'report:7d'),
      Markup.button.callback(t(language, 'report.buttonMonth'), 'report:month'),
      Markup.button.callback(t(language, 'report.buttonPrev'), 'report:prev')
    ]
  ]);
}

export async function report(ctx, period = 'month') {
  const user = await getUser(ctx);
  const tz = user.timezone;

  let range;
  let label;

  if (period === '7d') {
    range = D.lastDays(tz, 7);
    label = t(user.language, 'report.button7');
  } else if (period === 'prev') {
    range = D.prevMonthRange(tz);
    label = D.monthLabel(range.month, user.language);
  } else {
    range = D.monthRange(tz);
    label = D.monthLabel(range.month, user.language);
  }

  const summary = await A.periodSummary(user, range);

  if (!summary.count) {
    const text = `${t(user.language, 'report.title', { period: label })}\n\n${t(user.language, 'report.empty')}`;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(text, reportKeyboard(user.language));
    } else {
      await ctx.reply(text, reportKeyboard(user.language));
    }
    return;
  }

  const breakdown = await A.categoryBreakdown(user, range);
  const lines = [
    `<b>${t(user.language, 'report.title', { period: label })}</b>`,
    '',
    `➕ ${t(user.language, 'report.income', { value: M(user, summary.income) })}`,
    `➖ ${t(user.language, 'report.expense', { value: M(user, summary.expense) })}`,
    `💼 ${t(user.language, 'report.balance', { value: signedMoney(summary.balance, summary.balance >= 0 ? 'INCOME' : 'EXPENSE', user.currency, user.language) })}`
  ];

  if (summary.income > 0) {
    lines.push(`🏦 ${t(user.language, 'report.savedPct', { value: summary.savedPercent })}`);
  }

  if (breakdown.length) {
    lines.push('', `<b>${t(user.language, 'report.topTitle')}</b>`);
    for (const row of breakdown.slice(0, 6)) {
      lines.push(
        `${row.category?.emoji || '💸'} ${esc(categoryName(row.category, user.language))} — ${M(user, row.total)} (${row.percent}%)`,
        `<code>${progressBar(row.percent)}</code>`
      );
    }
  }

  lines.push('');
  lines.push(`📅 ${t(user.language, 'report.avgDay', { value: M(user, summary.avgDay) })}`);
  lines.push(`🟢 ${t(user.language, 'report.noSpendDays', { count: summary.noSpendDays })}`);

  if (period !== '7d') {
    const overview = await A.monthOverview(user, range.month);
    if (overview.previous.expense > 0) {
      lines.push(
        `${overview.diffPercent > 0 ? '📈' : '📉'} ${t(user.language, 'report.vsLast', {
          percent: `${overview.diffPercent > 0 ? '+' : ''}${overview.diffPercent}`
        })}`
      );
    }
    if (overview.isCurrentMonth) {
      lines.push(t(user.language, 'report.forecast', { value: M(user, overview.forecast) }));
    }
  }

  if (user.streakCount > 0) {
    lines.push(t(user.language, 'report.streak', { days: user.streakCount }));
  }

  const text = lines.join('\n');

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...reportKeyboard(user.language) });
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...reportKeyboard(user.language) });
  }
}

/* -------------------------------- СОВЕТЫ --------------------------------- */

export async function advice(ctx) {
  const user = await getUser(ctx);
  const tips = await buildAdvice(user, 4);

  if (!tips.length) {
    await ctx.reply(t(user.language, 'advice.empty'));
    return;
  }

  const lines = [`<b>${t(user.language, 'advice.title')}</b>`, ''];
  for (const tip of tips) {
    lines.push(`${tip.emoji} <b>${esc(tip.title)}</b>`, esc(tip.text), '');
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}

/* --------------------------------- ЦЕЛИ ---------------------------------- */

export async function goals(ctx) {
  const user = await getUser(ctx);
  const list = await A.goalsProgress(user);

  const keyboard = [[Markup.button.callback(t(user.language, 'goals.add'), 'goal:new')]];
  if (list.some((g) => !g.isDone)) {
    keyboard.push([Markup.button.callback(t(user.language, 'goals.deposit'), 'goal:deposit')]);
  }

  if (!list.length) {
    await ctx.reply(`${t(user.language, 'goals.title')}\n\n${t(user.language, 'goals.empty')}`, Markup.inlineKeyboard(keyboard));
    return;
  }

  const lines = [`<b>${t(user.language, 'goals.title')}</b>`, ''];
  for (const goal of list) {
    lines.push(
      t(user.language, 'goals.row', {
        emoji: goal.isDone ? '✅' : goal.emoji,
        title: esc(goal.title),
        current: M(user, goal.currentAmount),
        target: M(user, goal.targetAmount),
        percent: goal.percent,
        bar: progressBar(goal.percent)
      })
    );
    if (!goal.isDone) {
      lines.push(
        goal.monthsLeft
          ? t(user.language, 'goals.eta', { date: D.formatFullDate(goal.etaDate, user.language) })
          : t(user.language, 'goals.etaNever')
      );
    }
    lines.push('');
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML', ...Markup.inlineKeyboard(keyboard) });
}

export async function goalNew(ctx) {
  const user = await getUser(ctx);
  await ctx.answerCbQuery();
  state(ctx, { name: 'goal:title' });
  await ctx.reply(t(user.language, 'goals.askTitle'));
}

export async function goalDepositList(ctx) {
  const user = await getUser(ctx);
  const list = await GoalModel.list(user.id, { onlyActive: true });
  await ctx.answerCbQuery();

  if (!list.length) {
    await ctx.reply(t(user.language, 'goals.empty'));
    return;
  }

  await ctx.reply(
    t(user.language, 'goals.chooseGoal'),
    Markup.inlineKeyboard(list.map((goal) => [Markup.button.callback(`${goal.emoji} ${goal.title}`, `goal:dep:${goal.id}`)]))
  );
}

export async function goalDepositAsk(ctx, goalId) {
  const user = await getUser(ctx);
  const goal = await GoalModel.findById(goalId);
  await ctx.answerCbQuery();
  if (!goal || goal.userId !== user.id) return;

  state(ctx, { name: 'goal:deposit', goalId: goal.id });
  await ctx.reply(t(user.language, 'goals.askDeposit', { title: goal.title }));
}

/* ------------------------------ ДОСТИЖЕНИЯ ------------------------------- */

export async function achievements(ctx) {
  const user = await getUser(ctx);
  const { items, unlocked, total } = await getAchievements(user);

  const lines = [
    `<b>${t(user.language, 'achievements.title')}</b>`,
    t(user.language, 'achievements.progress', { unlocked, total }),
    ''
  ];

  for (const item of items) {
    lines.push(
      `${item.unlocked ? item.emoji : '🔒'} <b>${esc(item.title)}</b> — ${esc(item.description)}${item.unlocked ? '' : ` (${item.percent}%)`}`
    );
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}

/* --------------------------------- ДОЛГИ --------------------------------- */

export async function debts(ctx) {
  const user = await getUser(ctx);
  const list = await DebtModel.list(user.id);

  const keyboard = [[Markup.button.callback(t(user.language, 'debts.add'), 'debt:new')]];
  for (const debt of list) {
    keyboard.push([Markup.button.callback(`${t(user.language, 'debts.settle')} ${debt.person} — ${M(user, debt.amount)}`, `debt:settle:${debt.id}`)]);
  }

  if (!list.length) {
    await ctx.reply(`${t(user.language, 'debts.title')}\n\n${t(user.language, 'debts.empty')}`, Markup.inlineKeyboard(keyboard));
    return;
  }

  const lines = [`<b>${t(user.language, 'debts.title')}</b>`, ''];
  for (const debt of list) {
    const direction = debt.direction === 'I_OWE' ? '🔴' : '🟢';
    lines.push(`${direction} ${esc(debt.person)} — ${M(user, debt.amount)}`);
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML', ...Markup.inlineKeyboard(keyboard) });
}

export async function debtNew(ctx) {
  const user = await getUser(ctx);
  await ctx.answerCbQuery();
  await ctx.reply(
    t(user.language, 'debts.askDirection'),
    Markup.inlineKeyboard([
      [Markup.button.callback(t(user.language, 'debts.iOwe'), 'debt:dir:I_OWE')],
      [Markup.button.callback(t(user.language, 'debts.theyOwe'), 'debt:dir:THEY_OWE')]
    ])
  );
}

export async function debtDirection(ctx, direction) {
  const user = await getUser(ctx);
  await ctx.answerCbQuery();
  state(ctx, { name: 'debt:person', direction });
  await ctx.reply(t(user.language, 'debts.askPerson'));
}

export async function debtSettle(ctx, debtId) {
  const user = await getUser(ctx);
  await ctx.answerCbQuery();
  const debt = await DebtModel.list(user.id).then((list) => list.find((d) => d.id === Number(debtId)));
  if (!debt) return;

  await DebtModel.settle(debt.id);
  await ctx.reply(t(user.language, 'debts.settled'));
}

/* ------------------------------- НАСТРОЙКИ ------------------------------- */

function settingsKeyboard(user) {
  const L = user.language;
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(L, 'settings.language'), 'set:lang')],
    [Markup.button.callback(t(L, 'settings.reminder', { state: user.reminderEnabled ? t(L, 'settings.on') : t(L, 'settings.off') }), 'set:reminder')],
    [Markup.button.callback(t(L, 'settings.reminderTime', { time: user.reminderTime }), 'set:time')],
    [Markup.button.callback(t(L, 'settings.savingsRate', { percent: user.savingsRate }), 'set:savings')],
    [Markup.button.callback(t(L, 'settings.incomePlan', { value: money(user.monthlyIncomePlan, user.currency, L) }), 'set:income')],
    [Markup.button.callback(t(L, 'settings.export'), 'set:export')],
    [Markup.button.callback(t(L, 'settings.wipe'), 'set:wipe')]
  ]);
}

export async function settings(ctx, edit = false) {
  const user = await getUser(ctx);
  const text = `<b>${t(user.language, 'settings.title')}</b>`;

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...settingsKeyboard(user) });
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...settingsKeyboard(user) });
  }
}

export async function settingsAction(ctx, action) {
  const user = await getUser(ctx);
  const L = user.language;
  await ctx.answerCbQuery();

  if (action === 'lang') {
    await ctx.reply(t(L, 'lang.choose'), languageKeyboard());
    return;
  }

  if (action === 'reminder') {
    await UserModel.update(user.id, { reminderEnabled: !user.reminderEnabled });
    await settings(ctx, true);
    return;
  }

  if (action === 'time') {
    state(ctx, { name: 'settings:time' });
    await ctx.reply(t(L, 'settings.askTime'));
    return;
  }

  if (action === 'savings') {
    state(ctx, { name: 'settings:savings' });
    await ctx.reply(t(L, 'settings.askSavingsRate'));
    return;
  }

  if (action === 'income') {
    state(ctx, { name: 'settings:income' });
    await ctx.reply(t(L, 'settings.askIncomePlan'));
    return;
  }

  if (action === 'export') {
    await exportCsv(ctx, user);
    return;
  }

  if (action === 'wipe') {
    await ctx.reply(
      t(L, 'settings.wipeConfirm'),
      Markup.inlineKeyboard([
        [Markup.button.callback(t(L, 'common.yes'), 'set:wipe:yes')],
        [Markup.button.callback(t(L, 'common.cancel'), 'cancel')]
      ])
    );
  }
}

export async function wipeData(ctx) {
  const user = await getUser(ctx);
  await ctx.answerCbQuery();
  await UserModel.wipeData(user.id);
  await ctx.reply(t(user.language, 'settings.wiped'), mainKeyboard(user.language));
}

export async function exportCsv(ctx, userArg) {
  const user = userArg || (await getUser(ctx));
  const rows = await TransactionModel.list(user.id, { take: 5000 });

  if (!rows.length) {
    await ctx.reply(t(user.language, 'settings.exportEmpty'));
    return;
  }

  const header = 'date;type;category;amount;note';
  const body = rows
    .map((row) =>
      [
        D.dayjs(row.date).tz(user.timezone).format('YYYY-MM-DD HH:mm'),
        row.type === 'INCOME' ? 'income' : 'expense',
        (categoryName(row.category, user.language) || '').replace(/;/g, ','),
        Math.round(row.amount),
        (row.note || '').replace(/[;\n\r]/g, ' ')
      ].join(';')
    )
    .join('\n');

  const buffer = Buffer.from(`﻿${header}\n${body}`, 'utf8');
  await ctx.replyWithDocument(
    { source: buffer, filename: `finance-${D.todayKey(user.timezone)}.csv` },
    { caption: t(user.language, 'settings.exportCaption') }
  );
}

/* ------------------------------ ТЕКСТ / FSM ------------------------------ */

export async function handleText(ctx) {
  const user = await getUser(ctx);
  const text = (ctx.message?.text || '').trim();
  const current = ctx.session?.state;

  if (!user.onboarded) {
    await ctx.reply(t(user.language, 'lang.choose'), languageKeyboard());
    return;
  }

  // --- ожидание суммы операции ---
  if (current?.name === 'amount') {
    const parsed = parseEntry(text, current.type);
    if (!parsed) {
      await ctx.reply(t(user.language, 'tx.invalidAmount'));
      return;
    }
    const guessed = parsed.note ? await CategoryModel.guess(user.id, current.type, parsed.note) : null;
    if (guessed) {
      await saveTransaction(ctx, user, { type: current.type, amount: parsed.amount, note: parsed.note, categoryId: guessed.id });
      return;
    }
    await askCategory(ctx, user, { type: current.type, amount: parsed.amount, note: parsed.note });
    return;
  }

  // --- создание цели ---
  if (current?.name === 'goal:title') {
    state(ctx, { name: 'goal:amount', title: text.slice(0, 80) });
    await ctx.reply(t(user.language, 'goals.askAmount'));
    return;
  }

  if (current?.name === 'goal:amount') {
    const amount = parseAmount(text);
    if (!amount) {
      await ctx.reply(t(user.language, 'tx.invalidAmount'));
      return;
    }
    state(ctx, { name: 'goal:deadline', title: current.title, amount });
    await ctx.reply(
      t(user.language, 'goals.askDeadline'),
      Markup.inlineKeyboard([[Markup.button.callback(t(user.language, 'common.skip'), 'goal:skipdate')]])
    );
    return;
  }

  if (current?.name === 'goal:deadline') {
    const deadline = D.parseUserDate(text, user.timezone);
    await createGoal(ctx, user, current.title, current.amount, deadline);
    return;
  }

  if (current?.name === 'goal:deposit') {
    const amount = parseAmount(text);
    if (!amount) {
      await ctx.reply(t(user.language, 'tx.invalidAmount'));
      return;
    }
    const goal = await GoalModel.deposit(current.goalId, amount);
    clear(ctx);
    await ctx.reply(t(user.language, 'goals.deposited', { title: goal.title, amount: M(user, amount) }));
    if (goal.isDone) await ctx.reply(t(user.language, 'goals.reached', { title: goal.title }));
    return;
  }

  // --- долги ---
  if (current?.name === 'debt:person') {
    state(ctx, { name: 'debt:amount', direction: current.direction, person: text.slice(0, 60) });
    await ctx.reply(t(user.language, 'debts.askAmount'));
    return;
  }

  if (current?.name === 'debt:amount') {
    const amount = parseAmount(text);
    if (!amount) {
      await ctx.reply(t(user.language, 'tx.invalidAmount'));
      return;
    }
    await DebtModel.create({
      userId: user.id,
      person: current.person,
      amount,
      direction: current.direction
    });
    clear(ctx);
    await ctx.reply(t(user.language, 'debts.created'), mainKeyboard(user.language));
    return;
  }

  // --- настройки ---
  if (current?.name === 'settings:time') {
    const time = parseTime(text);
    if (!time) {
      await ctx.reply(t(user.language, 'settings.invalidTime'));
      return;
    }
    await UserModel.update(user.id, { reminderTime: time, reminderEnabled: true });
    clear(ctx);
    await ctx.reply(t(user.language, 'settings.timeSaved', { time }), mainKeyboard(user.language));
    return;
  }

  if (current?.name === 'settings:savings') {
    const percent = parsePercent(text);
    if (!percent) {
      await ctx.reply(t(user.language, 'tx.invalidAmount'));
      return;
    }
    await UserModel.update(user.id, { savingsRate: percent });
    clear(ctx);
    await ctx.reply(t(user.language, 'settings.savingsSaved', { percent }), mainKeyboard(user.language));
    return;
  }

  if (current?.name === 'settings:income') {
    const amount = parseAmount(text) ?? 0;
    await UserModel.update(user.id, { monthlyIncomePlan: amount });
    clear(ctx);
    await ctx.reply(t(user.language, 'settings.saved'), mainKeyboard(user.language));
    return;
  }

  // --- быстрый ввод без кнопок ---
  const quick = parseEntry(text, 'EXPENSE');
  if (quick) {
    const guessed = quick.note ? await CategoryModel.guess(user.id, quick.type, quick.note) : null;
    if (guessed) {
      await saveTransaction(ctx, user, { ...quick, categoryId: guessed.id });
      return;
    }
    await askCategory(ctx, user, quick);
    return;
  }

  await ctx.reply(t(user.language, 'common.unknown'), mainKeyboard(user.language));
}

export async function createGoal(ctx, user, title, amount, deadline) {
  await GoalModel.create({
    userId: user.id,
    title,
    targetAmount: amount,
    deadline: deadline || null
  });
  clear(ctx);
  await ctx.reply(t(user.language, 'goals.created', { title: esc(title) }), mainKeyboard(user.language));
}

export async function goalSkipDate(ctx) {
  const user = await getUser(ctx);
  const current = ctx.session?.state;
  await ctx.answerCbQuery();
  if (current?.name !== 'goal:deadline') return;
  await createGoal(ctx, user, current.title, current.amount, null);
}

export default {
  start,
  setLanguage,
  showMenu,
  openApp,
  cancel,
  askAmount,
  saveTransaction,
  onCategoryChosen,
  onUndo,
  markNoSpendDay,
  report,
  advice,
  goals,
  goalNew,
  goalDepositList,
  goalDepositAsk,
  goalSkipDate,
  achievements,
  debts,
  debtNew,
  debtDirection,
  debtSettle,
  settings,
  settingsAction,
  wipeData,
  exportCsv,
  handleText,
  getUser
};
