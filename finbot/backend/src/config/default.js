import dotenv from 'dotenv';

dotenv.config();

const bool = (v, fallback = false) => {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v).toLowerCase() === 'true' || v === '1';
};

const list = (v, fallback = []) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : fallback;

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  databaseUrl: process.env.DATABASE_URL,

  bot: {
    token: process.env.BOT_TOKEN,
    webAppUrl: process.env.WEBAPP_URL || 'http://localhost:5173'
  },

  admin: {
    token: process.env.ADMIN_TOKEN || 'change-me-admin-token'
  },

  cors: {
    origins: list(process.env.CORS_ORIGINS, ['http://localhost:5173', 'http://localhost:5174'])
  },

  defaults: {
    language: process.env.DEFAULT_LANGUAGE || 'ru',
    currency: process.env.DEFAULT_CURRENCY || 'UZS',
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
    reminderTime: '21:00'
  },

  dev: {
    allowDevAuth: bool(process.env.ALLOW_DEV_AUTH, true),
    telegramId: process.env.DEV_TELEGRAM_ID || ''
  },

  languages: ['ru', 'uz']
};

export function assertConfig() {
  const missing = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.bot.token) missing.push('BOT_TOKEN');

  if (missing.length) {
    console.error(`\n❌ В файле .env не заполнено: ${missing.join(', ')}\n`);
    process.exit(1);
  }
}

export default config;
