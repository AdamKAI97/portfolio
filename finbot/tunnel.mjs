/**
 * Поиск, скачивание и запуск программы, которая даёт https-адрес для Mini App.
 *
 * По умолчанию используется cloudflared (Cloudflare Quick Tunnel) — он не требует
 * регистрации и токенов. Если у пользователя уже стоит ngrok, подойдёт и он.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const TOOLS_DIR = path.join(ROOT, 'tools');

const IS_WIN = process.platform === 'win32';
const BIN_NAME = IS_WIN ? 'cloudflared.exe' : 'cloudflared';

export const LOCAL_BINARY = path.join(TOOLS_DIR, BIN_NAME);

function assetName() {
  if (IS_WIN) return 'cloudflared-windows-amd64.exe';
  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'cloudflared-darwin-arm64.tgz' : 'cloudflared-darwin-amd64.tgz';
  }
  return process.arch === 'arm64' ? 'cloudflared-linux-arm64' : 'cloudflared-linux-amd64';
}

function inPath(command) {
  const probe = IS_WIN
    ? spawnSync('where', [command], { shell: true })
    : spawnSync('which', [command]);
  return probe.status === 0;
}

/** Возвращает описание доступной программы для туннеля или null. */
export function findTunnel() {
  if (fs.existsSync(LOCAL_BINARY)) {
    return { kind: 'cloudflared', command: LOCAL_BINARY };
  }
  if (inPath('cloudflared')) {
    return { kind: 'cloudflared', command: 'cloudflared' };
  }
  const localNgrok = path.join(ROOT, IS_WIN ? 'ngrok.exe' : 'ngrok');
  if (fs.existsSync(localNgrok)) {
    return { kind: 'ngrok', command: localNgrok };
  }
  if (inPath('ngrok')) {
    return { kind: 'ngrok', command: 'ngrok' };
  }
  return null;
}

export function tunnelArgs(kind, port = 5173) {
  if (kind === 'ngrok') return ['http', String(port), '--log=stdout'];
  return ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`];
}

/** Вытаскивает https-адрес из вывода cloudflared или ngrok. */
export function extractUrl(text) {
  const match = String(text).match(/https:\/\/[a-z0-9-]+\.(trycloudflare\.com|ngrok-free\.app|ngrok\.io|ngrok\.app)/i);
  return match ? match[0] : null;
}

/**
 * Скачивает cloudflared в папку tools/. Возвращает путь или null.
 * Ошибки не бросает — туннель не критичен для работы бота.
 */
export async function downloadCloudflared(log = () => {}) {
  if (fs.existsSync(LOCAL_BINARY)) return LOCAL_BINARY;
  if (inPath('cloudflared')) return 'cloudflared';

  const asset = assetName();
  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`;

  try {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
    log('  Скачиваю программу для https-адреса (около 30 МБ)...');

    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

    const isArchive = asset.endsWith('.tgz');
    const target = isArchive ? path.join(TOOLS_DIR, asset) : LOCAL_BINARY;

    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));

    if (isArchive) {
      const result = spawnSync('tar', ['-xzf', target, '-C', TOOLS_DIR]);
      fs.rmSync(target, { force: true });
      if (result.status !== 0) throw new Error('не удалось распаковать архив');
    }

    if (!IS_WIN) fs.chmodSync(LOCAL_BINARY, 0o755);
    if (!fs.existsSync(LOCAL_BINARY)) throw new Error('файл не появился');

    return LOCAL_BINARY;
  } catch (error) {
    log(`  Не удалось скачать: ${error.message}. Ничего страшного — приложение будет работать в браузере.`);
    return null;
  }
}

export default { findTunnel, tunnelArgs, extractUrl, downloadCloudflared, LOCAL_BINARY, TOOLS_DIR };
