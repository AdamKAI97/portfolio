import { Telegraf, Markup, session } from 'telegraf';
import config from '../config/default.js';
import { t } from '../locales/index.js';

export const bot = new Telegraf(config.bot.token);

bot.use(session({ defaultSession: () => ({}) }));

const isHttps = (url) => /^https:\/\//i.test(url || '');

/** Главная клавиатура. Кнопка Mini App появляется только при https-адресе (требование Telegram). */
export function mainKeyboard(language) {
  const url = config.bot.webAppUrl;

  const appButton = isHttps(url)
    ? Markup.button.webApp(t(language, 'menu.app'), url)
    : Markup.button.text(t(language, 'menu.app'));

  return Markup.keyboard([
    [t(language, 'menu.expense'), t(language, 'menu.income')],
    [t(language, 'menu.report'), t(language, 'menu.goals')],
    [t(language, 'menu.advice'), t(language, 'menu.achievements')],
    [appButton, t(language, 'menu.settings')]
  ]).resize();
}

export function languageKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
    [Markup.button.callback(`🇺🇿 O'zbekcha`, 'lang:uz')]
  ]);
}

export function categoryKeyboard(categories, language) {
  const rows = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(
      categories.slice(i, i + 2).map((category) =>
        Markup.button.callback(
          `${category.emoji} ${language === 'uz' ? category.nameUz : category.nameRu}`,
          `cat:${category.id}`
        )
      )
    );
  }
  rows.push([Markup.button.callback(t(language, 'common.cancel'), 'cancel')]);
  return Markup.inlineKeyboard(rows);
}

export function webAppButton(language) {
  const url = config.bot.webAppUrl;
  if (!isHttps(url)) return null;
  return Markup.inlineKeyboard([[Markup.button.webApp(t(language, 'app.open'), url)]]);
}

/** Отправка сообщения пользователю из API (например, после записи в Mini App). */
export async function notify(telegramId, text, extra = {}) {
  try {
    await bot.telegram.sendMessage(String(telegramId), text, extra);
    return true;
  } catch (error) {
    console.error('Не удалось отправить сообщение в Telegram:', error.message);
    return false;
  }
}

export async function sendDocument(telegramId, buffer, filename, caption) {
  try {
    await bot.telegram.sendDocument(
      String(telegramId),
      { source: buffer, filename },
      caption ? { caption } : {}
    );
    return true;
  } catch (error) {
    console.error('Не удалось отправить файл:', error.message);
    return false;
  }
}

export async function setupBotProfile(baseUrl) {
  const webAppUrl = baseUrl || config.bot.webAppUrl;
  const commands = [
    { command: 'start', description: 'Запустить / Ishga tushirish' },
    { command: 'add', description: 'Записать операцию / Amaliyot yozish' },
    { command: 'report', description: 'Отчёт / Hisobot' },
    { command: 'goals', description: 'Цели / Maqsadlar' },
    { command: 'advice', description: 'Совет / Maslahat' },
    { command: 'settings', description: 'Настройки / Sozlamalar' }
  ];

  try {
    await bot.telegram.setMyCommands(commands);

    if (isHttps(webAppUrl)) {
      await bot.telegram.setChatMenuButton({
        menuButton: { type: 'web_app', text: 'Финансы', web_app: { url: webAppUrl } }
      });
    }
  } catch (error) {
    console.error('Не удалось настроить профиль бота:', error.message);
  }
}

export { Markup };
export default bot;
