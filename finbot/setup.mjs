#!/usr/bin/env node
/**
 * Полная настройка проекта одной командой:
 *   node setup.mjs
 *   node setup.mjs --db "postgresql://..." --token "123:ABC"
 *
 * Скрипт создаёт backend/.env, ставит зависимости, создаёт таблицы в базе,
 * записывает стартовые категории и проверяет токен бота.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(ROOT, 'backend');
const ENV_PATH = path.join(BACKEND, '.env');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const ESC = String.fromCharCode(27);

const c = {
  bold: (s) => `${ESC}[1m${s}${ESC}[0m`,
  green: (s) => `${ESC}[32m${s}${ESC}[0m`,
  red: (s) => `${ESC}[31m${s}${ESC}[0m`,
  gray: (s) => `${ESC}[90m${s}${ESC}[0m`,
  cyan: (s) => `${ESC}[36m${s}${ESC}[0m`
};

const step = (text) => console.log(`\n${c.bold(`> ${text}`)}`);
const ok = (text) => console.log(`  ${c.green('OK')} ${text}`);
const fail = (text) => console.log(`  ${c.red('!!')} ${text}`);

function args() {
  const result = {};
  for (let i = 2; i < process.argv.length; i += 1) {
    const key = process.argv[i];
    if (key.startsWith('--')) result[key.slice(2)] = process.argv[i + 1];
  }
  return result;
}

function readEnvValue(content, key) {
  const match = content.match(new RegExp(`^${key}="?([^"\\n]*)"?`, 'm'));
  return match ? match[1] : '';
}

/** Убирает параметры, которые не понимает Prisma, и гарантирует sslmode. */
function normalizeDbUrl(raw) {
  const value = String(raw || '').trim().replace(/^["']|["']$/g, '');
  if (!value) return { pooled: '', direct: '' };

  const url = new URL(value);
  url.searchParams.delete('channel_binding');

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!isLocal) url.searchParams.set('sslmode', 'require');

  const pooled = url.toString();

  // Для долгоживущего сервера Prisma рекомендует прямое подключение (без -pooler)
  const direct = pooled.replace('-pooler.', '.');
  return { pooled, direct };
}

function run(command, cmdArgs, cwd, env) {
  const result = spawnSync(command, cmdArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env }
  });
  return result.status === 0;
}

async function ask(rl, question, fallback) {
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

async function main() {
  console.log(c.bold('\nНастройка финансового бота\n'));

  const cli = args();
  const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

  let db = cli.db || readEnvValue(existing, 'DATABASE_URL');
  let token = cli.token || readEnvValue(existing, 'BOT_TOKEN');
  let adminToken = cli.admin || readEnvValue(existing, 'ADMIN_TOKEN') || 'finbot-admin';

  if (!db || !token || db.includes('USER:PASSWORD') || token.includes('AAaaBB')) {
    const rl = readline.createInterface({ input, output });
    console.log(c.gray('Вставьте данные (они сохранятся только в backend/.env и в git не попадут)\n'));
    if (!db || db.includes('USER:PASSWORD')) {
      db = await ask(rl, 'Строка подключения Neon (DATABASE_URL): ', db);
    }
    if (!token || token.includes('AAaaBB')) {
      token = await ask(rl, 'Токен бота из BotFather (BOT_TOKEN): ', token);
    }
    adminToken = await ask(rl, `Пароль для админ-панели [${adminToken}]: `, adminToken);
    rl.close();
  }

  const { direct } = normalizeDbUrl(db);
  if (!direct || !token) {
    fail('Не хватает DATABASE_URL или BOT_TOKEN — запустите скрипт ещё раз.');
    process.exit(1);
  }

  // --- 1. .env ---
  step('Создаю backend/.env');
  const webAppUrl = readEnvValue(existing, 'WEBAPP_URL') || 'http://localhost:5173';
  const envContent = `# Файл создан автоматически: node setup.mjs
# Не публикуйте его: здесь пароль базы и токен бота.

DATABASE_URL="${direct}"

BOT_TOKEN="${token}"
WEBAPP_URL="${webAppUrl}"

PORT=4000
CORS_ORIGINS="http://localhost:5173,http://localhost:5174"

ADMIN_TOKEN="${adminToken}"

DEFAULT_LANGUAGE="ru"
DEFAULT_CURRENCY="UZS"
DEFAULT_TIMEZONE="Asia/Tashkent"

ALLOW_DEV_AUTH="true"
DEV_TELEGRAM_ID=""
`;
  fs.writeFileSync(ENV_PATH, envContent, 'utf8');
  ok(`backend/.env готов (пароль админ-панели: ${c.cyan(adminToken)})`);

  // --- 2. Зависимости ---
  for (const folder of ['backend', 'miniapp', 'admin']) {
    step(`Устанавливаю зависимости: ${folder}`);
    if (!run(NPM, ['install', '--no-audit', '--no-fund'], path.join(ROOT, folder))) {
      fail(`Не удалось установить зависимости в ${folder}`);
      process.exit(1);
    }
    ok(`${folder} — готово`);
  }

  // --- 3. База ---
  step('Создаю таблицы в базе Neon');
  if (!run(NPX, ['prisma', 'generate'], BACKEND, { DATABASE_URL: direct })) {
    fail('Не удалось сгенерировать Prisma Client');
    process.exit(1);
  }
  if (!run(NPX, ['prisma', 'db', 'push', '--skip-generate'], BACKEND, { DATABASE_URL: direct })) {
    fail('Не удалось подключиться к базе. Проверьте строку подключения Neon и интернет.');
    process.exit(1);
  }
  ok('Таблицы созданы');

  step('Записываю стартовые категории');
  if (!run(process.execPath, ['prisma/seed.js'], BACKEND, { DATABASE_URL: direct })) {
    fail('Не удалось записать категории');
    process.exit(1);
  }

  // --- 4. Проверка бота ---
  step('Проверяю токен бота');
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = null;
    }

    if (data?.ok) {
      ok(`Бот найден: ${c.cyan('@' + data.result.username)} (${data.result.first_name})`);
    } else if (data?.description) {
      fail(`Telegram отклонил токен: ${data.description}`);
    } else {
      fail('Не удалось связаться с Telegram. Проверьте интернет и токен.');
    }
  } catch (_) {
    fail('Не удалось связаться с Telegram. Проверьте интернет и токен.');
  }

  console.log(c.bold('\nНастройка завершена.\n'));
  console.log('Запуск всего проекта одной командой:');
  console.log(c.cyan('   node dev.mjs\n'));
  console.log(c.gray('   бот и API   -> http://localhost:4000'));
  console.log(c.gray('   приложение  -> http://localhost:5173'));
  console.log(c.gray('   админка     -> http://localhost:5174\n'));
}

main().catch((error) => {
  console.error(c.red(`\nОшибка: ${error.message}`));
  process.exit(1);
});
