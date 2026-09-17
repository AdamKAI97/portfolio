import crypto from 'node:crypto';
import config from '../config/default.js';
import UserModel from '../models/User.js';
import prisma from '../database/connection.js';

/**
 * Проверка подписи Telegram Mini App (initData).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData, botToken) {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const signature = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (signature !== hash) return null;

  const authDate = Number(params.get('auth_date') || 0);
  if (authDate && Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  try {
    return JSON.parse(params.get('user'));
  } catch (_) {
    return null;
  }
}

/** Авторизация Mini App. В режиме разработки работает и без Telegram. */
export async function telegramAuth(req, res, next) {
  try {
    const initData =
      req.get('x-telegram-init-data') || req.query.initData || req.body?.initData || '';

    const tgUser = verifyInitData(initData, config.bot.token);

    if (tgUser) {
      req.user = await UserModel.findOrCreate({
        telegramId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username
      });
      return next();
    }

    if (config.dev.allowDevAuth) {
      const devId = config.dev.telegramId;
      let user = devId
        ? await UserModel.findByTelegramId(devId)
        : await prisma.user.findFirst({ orderBy: { id: 'asc' } });

      if (!user) {
        user = await UserModel.findOrCreate({
          telegramId: devId || 'dev-user',
          firstName: 'Demo',
          username: 'demo'
        });
      }

      req.user = user;
      req.isDevAuth = true;
      return next();
    }

    return res.status(401).json({ error: 'unauthorized' });
  } catch (error) {
    return next(error);
  }
}

export function adminAuth(req, res, next) {
  const token = req.get('x-admin-token') || req.query.token;
  if (!token || token !== config.admin.token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}

export function errorHandler(error, req, res, _next) {
  console.error('API error:', error);
  res.status(error.status || 500).json({ error: error.message || 'internal_error' });
}
