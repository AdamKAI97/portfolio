import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import config from './config/default.js';
import prisma from './database/connection.js';
import { ensureDefaultCategories } from './database/categories.js';
import bot, { setupBotProfile } from './core/bot.js';
import registerBotRoutes from './routes/bot.routes.js';
import clientRoutes from './routes/client.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middlewares/auth.middleware.js';
import { runReminders } from './services/scheduler.service.js';

/** Секретный кусок в адресе вебхука — чтобы его не мог дёрнуть посторонний. */
export const webhookPath = () =>
  crypto.createHash('sha256').update(String(config.bot.token)).digest('hex').slice(0, 24);

let prepared = null;

/** Однократная подготовка на «холодный старт»: категории должны существовать. */
export function prepare() {
  if (!prepared) {
    prepared = ensureDefaultCategories(prisma).catch((error) => {
      console.error('Не удалось проверить категории:', error.message);
    });
  }
  return prepared;
}

let routesRegistered = false;

export function createApp() {
  if (!routesRegistered) {
    registerBotRoutes();
    routesRegistered = true;
  }

  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(async (req, res, next) => {
    try {
      await prepare();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/health', (req, res) =>
    res.json({ ok: true, mode: config.isServerless ? 'cloud' : 'local', time: new Date().toISOString() })
  );

  /* ------------------------ Telegram: приём сообщений --------------------- */
  app.post(`/api/bot/${webhookPath()}`, async (req, res) => {
    try {
      await bot.handleUpdate(req.body);
    } catch (error) {
      console.error('Ошибка обработки обновления Telegram:', error.message);
    }
    res.status(200).end();
  });

  /* ---------------------------- Напоминания ------------------------------- */
  app.all('/api/cron', async (req, res) => {
    const header = req.get('authorization') || '';
    const token = req.query.token || header.replace(/^Bearer\s+/i, '');
    const fromVercelCron = /vercel-cron/i.test(req.get('user-agent') || '');
    const allowed = [config.cronSecret, config.admin.token].filter(Boolean);

    if (!fromVercelCron && !allowed.includes(token)) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const result = await runReminders();
    return res.json({ ok: true, ...result });
  });

  /* --------------- Подключение бота к облаку (один раз после деплоя) ------ */
  app.get('/api/setup', async (req, res) => {
    if (req.query.token !== config.admin.token) {
      return res.status(401).send(page('Неверный пароль', 'Проверьте значение ADMIN_TOKEN.', false));
    }

    try {
      const base = config.publicUrl(req);
      const url = `${base}/api/bot/${webhookPath()}`;

      await bot.telegram.setWebhook(url, { drop_pending_updates: true });
      await setupBotProfile(base);
      const me = await bot.telegram.getMe();

      return res.send(
        page(
          'Бот подключён',
          `Бот @${me.username} работает в облаке и отвечает без вашего компьютера.<br><br>Откройте Telegram и напишите ему /start.`,
          true
        )
      );
    } catch (error) {
      return res.status(500).send(page('Не получилось', error.message, false));
    }
  });

  app.use('/api/client', clientRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));
  app.use(errorHandler);

  return app;
}

function page(title, text, success) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0f;color:#fff;
       font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px}
  .box{max-width:460px;text-align:center;background:#16161d;border:1px solid #26262f;
       border-radius:24px;padding:36px 28px}
  .icon{font-size:48px}
  h1{font-size:22px;margin:14px 0 10px}
  p{color:#a1a1aa;line-height:1.6;margin:0}
</style></head>
<body><div class="box"><div class="icon">${success ? '✅' : '⚠️'}</div>
<h1>${title}</h1><p>${text}</p></div></body></html>`;
}

export default createApp;
