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

const DEFAULT_ADMIN_TOKEN = 'change-me-admin-token';

/** ADMIN_TOKEN не задан — служебные страницы открываем без пароля, но с предупреждением. */
export const adminTokenConfigured = () =>
  Boolean(config.admin.token) && config.admin.token !== DEFAULT_ADMIN_TOKEN;

function serviceAccess(req) {
  if (!adminTokenConfigured()) return true;
  return String(req.query.token || '') === config.admin.token;
}

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

  /**
   * Восстанавливает настоящий путь запроса.
   * Хостинг может доводить вложенные адреса до функции в виде /api?__path=bot/xxx —
   * здесь это разворачивается обратно в /api/bot/xxx, чтобы маршруты работали
   * одинаково и в облаке, и на компьютере.
   */
  app.use((req, res, next) => {
    try {
      const url = new URL(req.url, 'http://internal');
      const forwarded = url.searchParams.get('__path');

      if (forwarded) {
        url.searchParams.delete('__path');
        req.url = `/api/${forwarded.replace(/^\/+/, '')}${url.search}`;
      }
    } catch (_) {
      /* адрес нестандартный — оставляем как есть */
    }
    next();
  });

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
  // Путь сверяем внутри обработчика, а не в маршруте: так приём сообщений
  // не зависит от того, как именно хостинг передаёт адрес запроса.
  const handleTelegram = async (req, res) => {
    const secret = String(req.params?.secret || req.params?.[0] || '');

    if (secret && secret !== webhookPath()) {
      return res.status(404).json({ error: 'not_found' });
    }

    try {
      await bot.handleUpdate(req.body);
    } catch (error) {
      console.error('Ошибка обработки обновления Telegram:', error.message);
    }

    // Telegram всегда должен получить 200, иначе будет присылать это же сообщение снова
    return res.status(200).end();
  };

  app.post('/api/bot/:secret', handleTelegram);
  app.post('/api/telegram', handleTelegram);

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
    if (!serviceAccess(req)) {
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

  /* ----------------------- Диагностика (что не так) ---------------------- */
  app.get('/api/status', async (req, res) => {
    if (!serviceAccess(req)) {
      return res.status(401).send(page('Неверный пароль', 'Проверьте значение ADMIN_TOKEN.', false));
    }

    const base = config.publicUrl(req);
    const expectedWebhook = `${base}/api/bot/${webhookPath()}`;
    const rows = [];
    const advice = [];

    // 1. Переменные окружения
    rows.push(row(Boolean(config.databaseUrl), 'Переменная DATABASE_URL', config.databaseUrl ? 'задана' : 'НЕ задана'));
    rows.push(row(Boolean(config.bot.token), 'Переменная BOT_TOKEN', config.bot.token ? 'задана' : 'НЕ задана'));
    rows.push(
      row(
        adminTokenConfigured(),
        'Переменная ADMIN_TOKEN',
        adminTokenConfigured() ? 'задана' : 'не задана — страница открыта без пароля',
        !adminTokenConfigured()
      )
    );

    if (!config.databaseUrl || !config.bot.token) {
      advice.push('Добавьте отсутствующие переменные: Settings → Environment Variables, затем Deployments → ⋯ → Redeploy.');
    }

    // 2. База данных
    try {
      const [users, transactions] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count()
      ]);
      rows.push(row(true, 'База данных', `подключена · пользователей: ${users}, операций: ${transactions}`));
    } catch (error) {
      rows.push(row(false, 'База данных', friendlyError(error)));
      advice.push('Проверьте DATABASE_URL и что проект в Neon активен.');
    }

    // 3. Доступен ли сайт снаружи (защита Vercel закрывает и Telegram тоже)
    try {
      const probe = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) });
      const body = await probe.text();
      const isJson = body.trim().startsWith('{');

      if (probe.ok && isJson) {
        rows.push(row(true, 'Сайт доступен извне', 'да'));
      } else {
        rows.push(row(false, 'Сайт доступен извне', `нет (ответ ${probe.status})`));
        advice.push(
          'Сайт закрыт от внешних запросов, поэтому Telegram не может доставить сообщения. ' +
            'Откройте Settings → Deployment Protection и выключите защиту (Vercel Authentication) для Production.'
        );
      }
    } catch (error) {
      rows.push(row(false, 'Сайт доступен извне', 'проверить не удалось', true));
    }

    // 4. Бот
    let botUsername = null;
    try {
      const me = await bot.telegram.getMe();
      botUsername = me.username;
      rows.push(row(true, 'Токен бота', `рабочий · @${me.username}`));
    } catch (error) {
      rows.push(row(false, 'Токен бота', friendlyError(error)));
      advice.push('BOT_TOKEN неверный или отозван. Возьмите новый у @BotFather и обновите переменную.');
    }

    // 5. Живая проверка самого адреса приёма сообщений
    try {
      const probe = await fetch(expectedWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: 0 }),
        signal: AbortSignal.timeout(10000)
      });

      if (probe.ok) {
        rows.push(row(true, 'Адрес приёма сообщений', `отвечает (${probe.status})`));
      } else {
        rows.push(row(false, 'Адрес приёма сообщений', `отвечает ошибкой ${probe.status}`));
        advice.push(
          probe.status === 404
            ? 'Адрес приёма сообщений не найден. Проверьте Root Directory = finbot и сделайте Redeploy.'
            : `Адрес приёма сообщений отвечает кодом ${probe.status}. Пришлите этот код разработчику.`
        );
      }
    } catch (error) {
      rows.push(row(false, 'Адрес приёма сообщений', 'проверить не удалось', true));
    }

    // 6. Вебхук — главное место, где всё обычно ломается
    if (botUsername) {
      try {
        const info = await bot.telegram.getWebhookInfo();

        if (!info.url) {
          rows.push(row(false, 'Подключение Telegram', 'вебхук не установлен'));
          advice.push('Нажмите кнопку «Подключить бота» ниже — это установит вебхук.');
        } else if (info.url !== expectedWebhook) {
          rows.push(row(false, 'Подключение Telegram', `вебхук ведёт на другой адрес: ${info.url}`, true));
          advice.push('Адрес сайта изменился. Нажмите «Подключить бота» ниже, чтобы обновить вебхук.');
        } else {
          rows.push(row(true, 'Подключение Telegram', 'вебхук установлен на этот сайт'));
        }

        if (info.pending_update_count) {
          rows.push(row(false, 'Необработанные сообщения', String(info.pending_update_count), true));
        }

        if (info.last_error_message) {
          const when = info.last_error_date
            ? new Date(info.last_error_date * 1000).toLocaleString('ru-RU')
            : '';
          rows.push(row(false, 'Последняя ошибка доставки', `${info.last_error_message} (${when})`, true));
          advice.push(
            'Если строка «Адрес приёма сообщений» зелёная, эта ошибка уже в прошлом: ' +
              'нажмите «Подключить бота заново» — это очистит застрявшие сообщения.'
          );

          if (/401|403|authenticat|unauthor/i.test(info.last_error_message)) {
            advice.push(
              'Telegram получает от сайта отказ в доступе. Откройте Settings → Deployment Protection и отключите защиту для Production.'
            );
          } else if (/404/.test(info.last_error_message)) {
            advice.push('Telegram не находит адрес. Проверьте Root Directory = finbot и сделайте Redeploy.');
          } else if (/timeout|timed out|502|503/i.test(info.last_error_message)) {
            advice.push('Сайт не ответил вовремя — обычно это «просыпается» база. Напишите боту ещё раз.');
          }
        }
      } catch (error) {
        rows.push(row(false, 'Подключение Telegram', friendlyError(error)));
      }
    }

    // 7. Прочее
    rows.push(row(true, 'Режим работы', config.isServerless ? 'облако' : 'локальный компьютер'));
    rows.push(row(true, 'Адрес приложения', base));

    const link = adminTokenConfigured()
      ? `/api/setup?token=${encodeURIComponent(config.admin.token)}`
      : '/api/setup';

    return res.send(statusPage(rows, advice, link, botUsername));
  });

  app.use('/api/client', clientRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));
  app.use(errorHandler);

  return app;
}

function friendlyError(error) {
  const message = String(error?.message || error || '');
  if (/fetch|ENOTFOUND|ECONN|network|Host not/i.test(message)) {
    return 'не удалось связаться с Telegram (сеть)';
  }
  return message.slice(0, 160);
}

function row(ok, label, value, warning = false) {
  return { ok, warning, label, value };
}

function statusPage(rows, advice, setupLink, botUsername) {
  const items = rows
    .map((item) => {
      const icon = item.warning ? '⚠️' : item.ok ? '✅' : '❌';
      return `<div class="row"><span class="ic">${icon}</span><span class="lb">${escapeHtml(item.label)}</span><span class="vl">${escapeHtml(String(item.value))}</span></div>`;
    })
    .join('');

  const tips = advice.length
    ? `<div class="tips"><b>Что сделать:</b><ul>${advice.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul></div>`
    : '';

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Диагностика бота</title>
<style>
  body{margin:0;min-height:100vh;background:#08080b;color:#fff;padding:24px 16px;
       font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
  .box{max-width:620px;margin:0 auto}
  h1{font-size:22px;margin:0 0 6px}
  .sub{color:#8b8b96;font-size:13px;margin-bottom:22px}
  .card{background:#15151b;border:1px solid #26262f;border-radius:20px;padding:8px 18px;margin-bottom:16px}
  .row{display:flex;gap:10px;align-items:baseline;padding:13px 0;border-bottom:1px solid #22222a;font-size:14px}
  .row:last-child{border-bottom:none}
  .ic{flex:0 0 auto}
  .lb{flex:0 0 46%;color:#b6b6c2}
  .vl{flex:1;word-break:break-word}
  .tips{background:#1d1d25;border-radius:20px;padding:18px;font-size:14px;line-height:1.6}
  .tips ul{margin:10px 0 0;padding-left:20px;color:#d6d6de}
  a.btn{display:block;text-align:center;margin-top:18px;padding:15px;border-radius:16px;
        background:linear-gradient(135deg,#3987e5,#9085e9);color:#fff;text-decoration:none;font-weight:650}
</style></head>
<body><div class="box">
<h1>Диагностика</h1>
<div class="sub">${botUsername ? `Бот @${escapeHtml(botUsername)}` : 'Проверка настроек и подключения'}</div>
<div class="card">${items}</div>
${tips}
<a class="btn" href="${setupLink}">Подключить бота заново</a>
</div></body></html>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
