#!/usr/bin/env node
/**
 * Запускает весь проект одной командой:
 *   node dev.mjs
 *
 * Поднимает бэкенд с ботом, Mini App и админ-панель в одном окне терминала.
 * Если параллельно запущен ngrok, скрипт сам подхватывает его https-адрес,
 * прописывает его в backend/.env и перезапускает бота.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(ROOT, 'backend', '.env');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ESC = String.fromCharCode(27);

const paint = (code) => (text) => `${ESC}[${code}m${text}${ESC}[0m`;
const cyan = paint(36);
const green = paint(32);
const yellow = paint(33);
const gray = paint(90);
const bold = paint(1);

const SERVICES = [
  { name: 'бот+api  ', dir: 'backend', color: cyan },
  { name: 'приложение', dir: 'miniapp', color: green },
  { name: 'админка  ', dir: 'admin', color: yellow }
];

if (!fs.existsSync(ENV_PATH)) {
  console.error(`\n${bold('Файл backend/.env не найден.')}`);
  console.error(`Сначала выполните: ${cyan('node setup.mjs')}\n`);
  process.exit(1);
}

const children = new Map();
let stopping = false;

function pipe(service, stream) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) console.log(`${service.color(service.name)} ${gray('|')} ${line}`);
    }
  });
}

function start(service) {
  const child = spawn(NPM, ['run', 'dev'], {
    cwd: path.join(ROOT, service.dir),
    shell: process.platform === 'win32',
    // своя группа процессов, чтобы по Ctrl+C гарантированно закрылись и дочерние
    detached: process.platform !== 'win32',
    env: process.env
  });

  pipe(service, child.stdout);
  pipe(service, child.stderr);

  child.on('exit', (code) => {
    if (stopping) return;
    console.log(`${service.color(service.name)} ${gray('|')} процесс завершился (код ${code})`);
  });

  children.set(service.dir, child);
  return child;
}

function stop(dir) {
  const child = children.get(dir);
  if (!child) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/f', '/t']);
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (_) {
      child.kill('SIGTERM');
    }
  }
  children.delete(dir);
}

function stopAll() {
  stopping = true;
  for (const dir of [...children.keys()]) stop(dir);
}

/* ------------------------------ ngrok ------------------------------------ */

function currentWebAppUrl() {
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const match = content.match(/^WEBAPP_URL="?([^"\n]*)"?/m);
  return match ? match[1] : '';
}

function setWebAppUrl(url) {
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const next = content.match(/^WEBAPP_URL=.*$/m)
    ? content.replace(/^WEBAPP_URL=.*$/m, `WEBAPP_URL="${url}"`)
    : `${content}\nWEBAPP_URL="${url}"\n`;
  fs.writeFileSync(ENV_PATH, next, 'utf8');
}

async function findNgrokUrl() {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(1500) });
    const data = await response.json();
    const tunnel = data.tunnels?.find(
      (item) => item.proto === 'https' && String(item.config?.addr || '').includes('5173')
    );
    return tunnel?.public_url || null;
  } catch (_) {
    return null;
  }
}

async function watchNgrok() {
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    if (stopping) return;

    const url = await findNgrokUrl();
    if (!url || url === currentWebAppUrl()) continue;

    setWebAppUrl(url);
    console.log(`\n${bold('Найден адрес ngrok:')} ${cyan(url)}`);
    console.log(gray('  Записал его в backend/.env и перезапускаю бота...'));
    console.log(`${bold('  Осталось один раз указать этот адрес в BotFather:')}`);
    console.log(gray('  @BotFather -> /mybots -> ваш бот -> Bot Settings -> Menu Button -> Configure menu button'));
    console.log(`${gray('  и вставить:')} ${cyan(url)}\n`);

    stop('backend');
    setTimeout(() => {
      if (!stopping) start(SERVICES[0]);
    }, 800);
  }
}

/* ------------------------------ запуск ----------------------------------- */

console.log(bold('\nЗапускаю проект...\n'));
for (const service of SERVICES) start(service);

console.log(gray('  бот и API   -> http://localhost:4000'));
console.log(gray('  приложение  -> http://localhost:5173'));
console.log(gray('  админка     -> http://localhost:5174'));
console.log(gray('\n  Для Telegram в отдельном окне выполните: ngrok http 5173'));
console.log(gray('  Адрес подхватится автоматически. Остановить всё: Ctrl+C\n'));

watchNgrok();

const shutdown = () => {
  console.log(bold('\nОстанавливаю...'));
  stopAll();
  setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
