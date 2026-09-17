import { tg } from './telegram.js';

const KEY = 'finbot-theme';

function systemTheme() {
  if (tg?.colorScheme) return tg.colorScheme === 'dark' ? 'dark' : 'light';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function currentTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) { /* приватный режим */ }
  return systemTheme();
}

export function applyTheme(theme) {
  const value = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', value);

  const background = value === 'dark' ? '#08080b' : '#f4f4f7';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);

  try {
    tg?.setHeaderColor?.(background);
    tg?.setBackgroundColor?.(background);
  } catch (_) { /* старый клиент Telegram */ }

  try {
    localStorage.setItem(KEY, value);
  } catch (_) { /* приватный режим */ }

  return value;
}

export function initTheme() {
  return applyTheme(currentTheme());
}
