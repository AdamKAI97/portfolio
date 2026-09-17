import dotenv from 'dotenv';

dotenv.config();

const bool = (v, fallback = false) => {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v).toLowerCase() === 'true' || v === '1';
};

const list = (v, fallback = []) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : fallback;

/** true — код выполняется в облаке (Vercel), а не на компьютере пользователя. */
const isServerless = Boolean(process.env.VERCEL);

/** Постоянный адрес сайта в облаке. */
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';

/**
 * Готовит строку подключения:
 * - убирает параметры, которые не понимает Prisma;
 * - в облаке переключает Neon на пул соединений (иначе serverless быстро
 *   исчерпывает лимит подключений).
 */
function prepareDatabaseUrl(raw) {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    url.searchParams.delete('channel_binding');

    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (!isLocal) url.searchParams.set('sslmode', 'require');

    if (isServerless && !isLocal) {
      url.hostname = url.hostname.replace(/^(ep-[^.]+?)(-pooler)?\./, '$1-pooler.');
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('connection_limit', '1');
    }

    return url.toString();
  } catch (_) {
    return raw;
  }
}

function resolveWebAppUrl() {
  const fromEnv = (process.env.WEBAPP_URL || '').trim().replace(/\/+$/, '');
  if (/^https:\/\//i.test(fromEnv)) return fromEnv;
  if (vercelDomain) return `https://${vercelDomain}`;
  return fromEnv || 'http://localhost:5173';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  isServerless,

  databaseUrl: prepareDatabaseUrl(process.env.DATABASE_URL),

  bot: {
    token: process.env.BOT_TOKEN,
    webAppUrl: resolveWebAppUrl()
  },

  admin: {
    token: process.env.ADMIN_TOKEN || 'change-me-admin-token'
  },

  cronSecret: process.env.CRON_SECRET || '',

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
    allowDevAuth: bool(process.env.ALLOW_DEV_AUTH, !isServerless),
    telegramId: process.env.DEV_TELEGRAM_ID || ''
  },

  languages: ['ru', 'uz'],

  /** Публичный адрес сайта: из переменных окружения или из самого запроса. */
  publicUrl(req) {
    if (vercelDomain) return `https://${vercelDomain}`;

    const fromEnv = (process.env.WEBAPP_URL || '').trim().replace(/\/+$/, '');
    if (/^https:\/\//i.test(fromEnv)) return fromEnv;

    if (req) {
      const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('x-forwarded-host') || req.get('host');
      if (host) return `${proto}://${host}`;
    }

    return config.bot.webAppUrl;
  }
};

export function assertConfig() {
  const missing = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.bot.token) missing.push('BOT_TOKEN');

  if (missing.length) {
    console.error(`\n❌ Не заполнены переменные: ${missing.join(', ')}\n`);
    if (!isServerless) process.exit(1);
  }
}

export default config;
