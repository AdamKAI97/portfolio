import express from 'express';
import cors from 'cors';
import config, { assertConfig } from './config/default.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import bot, { setupBotProfile } from './core/bot.js';
import registerBotRoutes from './routes/bot.routes.js';
import clientRoutes from './routes/client.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middlewares/auth.middleware.js';
import { startScheduler } from './services/scheduler.service.js';

assertConfig();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'not_found' }));
app.use(errorHandler);

async function main() {
  await connectDatabase();
  registerBotRoutes();

  app.listen(config.port, () => {
    console.log(`🚀 API: http://localhost:${config.port}`);
    console.log(`📱 Mini App URL: ${config.bot.webAppUrl}`);
  });

  // bot.launch() не завершается, пока бот работает, поэтому его не ждём:
  // сервер должен подняться независимо от Telegram.
  bot
    .launch(() => {
      console.log(`🤖 Бот @${bot.botInfo?.username} запущен`);
      setupBotProfile();
      startScheduler();
    })
    .catch((error) => {
      console.error('\n❌ Telegram: бот не запустился.');
      console.error('   Проверьте BOT_TOKEN в файле .env и подключение к интернету.');
      console.error(`   Детали: ${error.message}\n`);
    });
}

const shutdown = async (signal) => {
  console.log(`\n${signal}: останавливаюсь...`);
  try {
    bot.stop(signal);
  } catch (_) { /* уже остановлен */ }
  await disconnectDatabase();
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

main().catch((error) => {
  console.error('❌ Не удалось запустить приложение:', error);
  process.exit(1);
});
