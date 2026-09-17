import config, { assertConfig } from './config/default.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import bot from './core/bot.js';
import { createApp, prepare } from './app.js';
import { setupBotProfile } from './core/bot.js';
import { startScheduler } from './services/scheduler.service.js';

/**
 * Локальный запуск: бот на long polling + собственный планировщик.
 * В облаке используется api/[[...path]].js — там бот работает через webhook.
 */
assertConfig();

const app = createApp();

async function main() {
  await connectDatabase();
  await prepare();

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
