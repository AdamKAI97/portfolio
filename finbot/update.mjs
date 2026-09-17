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
  const extract = spawnSync('tar', ['-xf', zipPath, '-C', TMP], { shell: process.platform === 'win32' });
  if (extract.status !== 0) {
    fail('не удалось распаковать архив');
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
