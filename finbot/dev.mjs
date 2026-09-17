#!/usr/bin/env node
/**
 * Запускает весь проект одной командой:
 *   node dev.mjs
 *
 * Поднимает бэкенд с ботом, Mini App и админ-панель в одном окне терминала,
 * сам создаёт публичный https-адрес и прописывает его в backend/.env,
 * после чего бот сам показывает кнопку приложения в Telegram.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTunnel, tunnelArgs, extractUrl } from './tunnel.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(ROOT, 'backend', '.env');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ESC = String.fromCharCode(27);

const paint = (code) => (text) => `${ESC}[${code}m${text}${ESC}[0m`;
const cyan = paint(36);
const green = paint(32);
const yellow = paint(33);
const magenta = paint(35);
const gray = paint(90);
const bold = paint(1);

const SERVICES = [
  { name: 'бот+api  ', dir: 'backend', color: cyan },
  { name: 'приложение', dir: 'miniapp', color: green },
  { name: 'админка  ', dir: 'admin', color: yellow }
];

if (!fs.existsSync(ENV_PATH)) {
  console.error(`\n${bold('Файл backend/.env не найден.')}`);
  console.error(`Сначала выполните настройку: ${cyan('node setup.mjs')}\n`);
  process.exit(1);
}

const children = new Map();
let stopping = false;

/* ----------------------------- процессы ---------------------------------- */

function log(label, color, line) {
  if (line.trim()) console.log(`${color(label)} ${gray('|')} ${line}`);
}

function pipe(label, color, stream, onLine) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (onLine) onLine(line);
      else log(label, color, line);
    }
  });
}

function spawnProcess(key, command, args, cwd, label, color, onLine, onExit) {
  const child = spawn(command, args, {
    cwd,
    shell: process.platform === 'win32',
    // своя группа процессов, чтобы по Ctrl+C закрылись и дочерние
    detached: process.platform !== 'win32',
    env: process.env
  });

  pipe(label, color, child.stdout, onLine);
  pipe(label, color, child.stderr, onLine);

  child.on('error', (error) => log(label, color, `не удалось запустить: ${error.message}`));
  child.on('exit', (code) => {
    if (stopping) return;
    if (onExit) onExit(code);
    else log(label, color, `процесс завершился (код ${code})`);
  });

  children.set(key, child);
  return child;
}

function startService(service) {
  return spawnProcess(service.dir, NPM, ['run', 'dev'], path.join(ROOT, service.dir), service.name, service.color);
}

function stop(key) {
  const child = children.get(key);
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
  children.delete(key);
}

function stopAll() {
  stopping = true;
  for (const key of [...children.keys()]) stop(key);
}

/* ------------------------------ https-адрес ------------------------------- */

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

function applyUrl(url) {
  if (!url || url === currentWebAppUrl()) return;

  setWebAppUrl(url);
  console.log(`\n${bold('Публичный адрес приложения:')} ${cyan(url)}`);
  console.log(gray('  Записал его в настройки и перезапускаю бота.'));
  console.log(gray('  Кнопку приложения в Telegram бот поставит сам — ничего делать не нужно.\n'));

  stop('backend');
  setTimeout(() => {
    if (!stopping) startService(SERVICES[0]);
  }, 800);
}

function startTunnel() {
  const tunnel = findTunnel();

  if (!tunnel) {
    console.log(gray('  Программа для https-адреса не найдена — приложение доступно только в браузере.'));
    console.log(gray('  Чтобы включить его внутри Telegram, запустите настройку ещё раз: node setup.mjs\n'));
    return;
  }

  let found = false;

  spawnProcess(
    'tunnel',
    tunnel.command,
    tunnelArgs(tunnel.kind, 5173),
    ROOT,
    'адрес    ',
    magenta,
    (line) => {
      // Служебные логи туннеля не показываем — только сам адрес
      const url = extractUrl(line);
      if (url && !found) {
        found = true;
        applyUrl(url);
      }
    },
    () => {
      if (found) {
        log('адрес    ', magenta, 'туннель закрылся — приложение осталось доступно в браузере');
      } else {
        log('адрес    ', magenta, 'не удалось создать https-адрес (проверьте интернет).');
        log('адрес    ', magenta, 'Приложение работает в браузере: http://localhost:5173');
      }
    }
  );

  console.log(gray(`  Создаю публичный https-адрес (${tunnel.kind})...`));
}

/** Подхватывает ngrok, запущенный пользователем вручную. */
async function watchManualNgrok() {
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (stopping) return;
    if (children.has('tunnel')) continue;

    try {
      const response = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(1500) });
      const data = await response.json();
      const found = data.tunnels?.find(
        (item) => item.proto === 'https' && String(item.config?.addr || '').includes('5173')
      );
      if (found?.public_url) applyUrl(found.public_url);
    } catch (_) {
      /* ngrok не запущен — это нормально */
    }
  }
}

/* -------------------------------- запуск ---------------------------------- */

console.log(bold('\nЗапускаю проект...\n'));
for (const service of SERVICES) startService(service);

console.log(gray('  бот и API   -> http://localhost:4000'));
console.log(gray('  приложение  -> http://localhost:5173'));
console.log(gray('  админка     -> http://localhost:5174\n'));

startTunnel();
watchManualNgrok();

console.log(gray('  Остановить всё: Ctrl+C или просто закройте это окно.\n'));

const shutdown = () => {
  console.log(bold('\nОстанавливаю...'));
  stopAll();
  setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
