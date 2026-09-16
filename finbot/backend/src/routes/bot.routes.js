import bot from '../core/bot.js';
import { t, LANGUAGES } from '../locales/index.js';
import C from '../controllers/botController.js';

const MENU_KEYS = [
  'menu.expense',
  'menu.income',
  'menu.report',
  'menu.goals',
  'menu.advice',
  'menu.achievements',
  'menu.app',
  'menu.settings',
  'menu.debts'
];

const MENU_LOOKUP = new Map();
for (const language of LANGUAGES) {
  for (const key of MENU_KEYS) {
    MENU_LOOKUP.set(t(language, key).toLowerCase(), key);
  }
}

const MENU_HANDLERS = {
  'menu.expense': (ctx) => C.askAmount(ctx, 'EXPENSE'),
  'menu.income': (ctx) => C.askAmount(ctx, 'INCOME'),
  'menu.report': (ctx) => C.report(ctx, 'month'),
  'menu.goals': (ctx) => C.goals(ctx),
  'menu.advice': (ctx) => C.advice(ctx),
  'menu.achievements': (ctx) => C.achievements(ctx),
  'menu.app': (ctx) => C.openApp(ctx),
  'menu.settings': (ctx) => C.settings(ctx),
  'menu.debts': (ctx) => C.debts(ctx)
};

export function registerBotRoutes() {
  /* ------------------------------- Команды ------------------------------- */
  bot.start((ctx) => C.start(ctx));
  bot.command('menu', (ctx) => C.showMenu(ctx));
  bot.command('help', (ctx) => C.start(ctx));
  bot.command('add', (ctx) => C.askAmount(ctx, 'EXPENSE'));
  bot.command('income', (ctx) => C.askAmount(ctx, 'INCOME'));
  bot.command('report', (ctx) => C.report(ctx, 'month'));
  bot.command('goals', (ctx) => C.goals(ctx));
  bot.command('advice', (ctx) => C.advice(ctx));
  bot.command('debts', (ctx) => C.debts(ctx));
  bot.command('achievements', (ctx) => C.achievements(ctx));
  bot.command('settings', (ctx) => C.settings(ctx));
  bot.command('language', async (ctx) => C.settingsAction(ctx, 'lang'));
  bot.command('app', (ctx) => C.openApp(ctx));
  bot.command('export', (ctx) => C.exportCsv(ctx));

  /* ------------------------------ Callback ------------------------------- */
  bot.action(/^lang:(ru|uz)$/, (ctx) => C.setLanguage(ctx, ctx.match[1]));
  bot.action('cancel', (ctx) => C.cancel(ctx));
  bot.action(/^cat:(\d+)$/, (ctx) => C.onCategoryChosen(ctx, Number(ctx.match[1])));
  bot.action(/^undo:(\d+)$/, (ctx) => C.onUndo(ctx, Number(ctx.match[1])));
  bot.action('nospend', (ctx) => C.markNoSpendDay(ctx));
  bot.action('quick:expense', async (ctx) => {
    await ctx.answerCbQuery();
    await C.askAmount(ctx, 'EXPENSE');
  });
  bot.action('quick:income', async (ctx) => {
    await ctx.answerCbQuery();
    await C.askAmount(ctx, 'INCOME');
  });
  bot.action(/^report:(7d|month|prev)$/, (ctx) => C.report(ctx, ctx.match[1]));

  bot.action('goal:new', (ctx) => C.goalNew(ctx));
  bot.action('goal:deposit', (ctx) => C.goalDepositList(ctx));
  bot.action(/^goal:dep:(\d+)$/, (ctx) => C.goalDepositAsk(ctx, Number(ctx.match[1])));
  bot.action('goal:skipdate', (ctx) => C.goalSkipDate(ctx));

  bot.action('debt:new', (ctx) => C.debtNew(ctx));
  bot.action(/^debt:dir:(I_OWE|THEY_OWE)$/, (ctx) => C.debtDirection(ctx, ctx.match[1]));
  bot.action(/^debt:settle:(\d+)$/, (ctx) => C.debtSettle(ctx, Number(ctx.match[1])));

  bot.action('set:wipe:yes', (ctx) => C.wipeData(ctx));
  bot.action(/^set:(lang|reminder|time|savings|income|export|wipe)$/, (ctx) =>
    C.settingsAction(ctx, ctx.match[1])
  );

  /* -------------------------- Контакт и текст ---------------------------- */
  bot.on('contact', async (ctx) => {
    const user = await C.getUser(ctx);
    const phone = ctx.message.contact?.phone_number;
    if (phone) {
      const { default: UserModel } = await import('../models/User.js');
      await UserModel.update(user.id, { phone });
      await ctx.reply(t(user.language, 'start.phoneSaved'));
    }
  });

  bot.on('text', async (ctx) => {
    const text = (ctx.message.text || '').trim().toLowerCase();
    const key = MENU_LOOKUP.get(text);

    if (key && MENU_HANDLERS[key]) {
      await MENU_HANDLERS[key](ctx);
      return;
    }

    await C.handleText(ctx);
  });

  bot.catch((error, ctx) => {
    console.error('Ошибка бота:', error);
    try {
      ctx.reply('⚠️ Ошибка. Попробуйте ещё раз / Xatolik. Qayta urinib ko‘ring.');
    } catch (_) { /* пропускаем */ }
  });
}

export default registerBotRoutes;
