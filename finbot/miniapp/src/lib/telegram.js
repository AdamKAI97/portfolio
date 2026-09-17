export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const initData = tg?.initData || '';

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  } catch (_) {
    /* старая версия клиента — не критично */
  }
}

export function haptic(style = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch (_) { /* не поддерживается */ }
}

export function notifySuccess() {
  try {
    tg?.HapticFeedback?.notificationOccurred('success');
  } catch (_) { /* не поддерживается */ }
}

export function closeApp() {
  try {
    tg?.close();
  } catch (_) { /* не в Telegram */ }
}

export function telegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

export const isTelegram = Boolean(tg?.initData);
