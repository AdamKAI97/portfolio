#!/usr/bin/env node
/**
 * Обновление проекта до последней версии:
 *   node update.mjs
 *
 * Скачивает свежие файлы с GitHub и заменяет ими текущие.
 * Ваши настройки (backend/.env) и данные в базе не трогаются.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(ROOT, '.update-tmp');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ESC = String.fromCharCode(27);

const BRANCH = 'claude/speech-therapy-practice-platform-gnqgnc';
const ARCHIVE = `https://github.com/AdamKAI97/portfolio/archive/refs/heads/${BRANCH}.zip`;

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

function cleanup() {
  fs.rmSync(TMP, { recursive: true, force: true });
}

/**
 * Распаковывает zip доступным в системе способом.
 * Проверяем не только код возврата: некоторые распаковщики портят
 * кириллические имена файлов, поэтому убеждаемся, что они на месте.
 */
function unzip(zipPath, target) {
  const attempts = [
    // Windows 10+ и macOS: встроенный bsdtar понимает zip и UTF-8 имена
    { command: 'tar', args: ['-xf', zipPath, '-C', target] },
    // unzip без UTF-8 локали портит кириллические имена, поэтому задаём её явно
    { command: 'unzip', args: ['-q', '-o', zipPath, '-d', target], env: { LC_ALL: 'C.UTF-8', LANG: 'C.UTF-8' } },
    { command: 'unzip', args: ['-q', '-o', zipPath, '-d', target], env: { LC_ALL: 'en_US.UTF-8', LANG: 'en_US.UTF-8' } }
  ];

  if (process.platform === 'win32') {
    attempts.push({
      command: 'powershell',
      args: [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Force -LiteralPath '${zipPath}' -DestinationPath '${target}'`
      ]
    });
  }

  for (const attempt of attempts) {
    const result = spawnSync(attempt.command, attempt.args, {
      shell: process.platform === 'win32',
      env: { ...process.env, ...(attempt.env || {}) }
    });
    if (result.status !== 0) continue;

    const source = findProjectDir(target);
    if (source && fs.existsSync(path.join(source, '1-НАСТРОЙКА-Windows.bat'))) return true;

    // имена файлов испорчены — пробуем следующий способ
    for (const entry of fs.readdirSync(target)) {
      if (entry !== 'update.zip') fs.rmSync(path.join(target, entry), { recursive: true, force: true });
    }
  }

  return false;
}

/** Ищет папку finbot внутри распакованного архива. */
function findProjectDir(base) {
  const entries = fs.readdirSync(base, { withFileTypes: true }).filter((item) => item.isDirectory());
  for (const entry of entries) {
    const candidate = path.join(base, entry.name, 'finbot');
    if (fs.existsSync(path.join(candidate, 'setup.mjs'))) return candidate;
  }
  return null;
}

async function main() {
  console.log(c.bold('\nОбновление проекта\n'));

  cleanup();
  fs.mkdirSync(TMP, { recursive: true });

  step('Скачиваю свежую версию с GitHub');
  const zipPath = path.join(TMP, 'update.zip');
  const response = await fetch(ARCHIVE, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    fail(`не удалось скачать (${response.status}). Проверьте интернет.`);
    cleanup();
    process.exit(1);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(zipPath));
  ok('скачано');

  step('Распаковываю');
  if (!unzip(zipPath, TMP)) {
    fail('не удалось распаковать архив.');
    fail('Скачайте свежий ZIP вручную: ' + ARCHIVE);
    cleanup();
    process.exit(1);
  }

  const source = findProjectDir(TMP);
  if (!source) {
    fail('в архиве не найдена папка проекта');
    cleanup();
    process.exit(1);
  }
  ok('распаковано');

  step('Заменяю файлы проекта');
  // Файла backend/.env в архиве нет, поэтому ваши ключи и настройки остаются на месте
  fs.cpSync(source, ROOT, { recursive: true, force: true });
  ok('файлы обновлены, настройки сохранены');

  step('Обновляю зависимости');
  for (const folder of ['backend', 'miniapp', 'admin']) {
    spawnSync(NPM, ['install', '--no-audit', '--no-fund'], {
      cwd: path.join(ROOT, folder),
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
  }
  ok('зависимости обновлены');

  cleanup();

  console.log(c.bold('\nГотово.\n'));
  console.log(`Теперь запустите проект: ${c.cyan('2-ЗАПУСК-Windows.bat')}`);
  console.log(c.gray('(на macOS — 2-ЗАПУСК-Mac.command)\n'));
}

main().catch((error) => {
  fail(error.message);
  cleanup();
  process.exit(1);
});
