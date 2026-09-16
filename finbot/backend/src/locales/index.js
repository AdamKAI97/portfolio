import ru from './ru.js';
import uz from './uz.js';

export const locales = { ru, uz };
export const LANGUAGES = Object.keys(locales);

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

/**
 * t('ru', 'tx.saved', { amount: '45 000 сум' })
 */
export function t(language, path, vars = {}) {
  const lang = locales[language] ? language : 'ru';
  let value = resolve(locales[lang], path);

  if (value === undefined) value = resolve(locales.ru, path);
  if (value === undefined) return path;

  return typeof value === 'function' ? value(vars) : value;
}

export function languageLabel(language) {
  return locales[language]?.label || language;
}

export default { t, locales, LANGUAGES, languageLabel };
