const SYMBOLS = {
  UZS: { ru: 'сум', uz: `so'm`, position: 'suffix' },
  USD: { ru: '$', uz: '$', position: 'prefix' },
  RUB: { ru: '₽', uz: '₽', position: 'suffix' },
  EUR: { ru: '€', uz: '€', position: 'prefix' }
};

export function groupNumber(value) {
  const rounded = Math.round(Number(value) || 0);
  return new Intl.NumberFormat('ru-RU').format(rounded).replace(/ /g, ' ');
}

export function money(value, currency = 'UZS', language = 'ru') {
  const meta = SYMBOLS[currency] || { ru: currency, uz: currency, position: 'suffix' };
  const symbol = meta[language] || meta.ru;
  const number = groupNumber(Math.abs(value));
  const sign = Number(value) < 0 ? '-' : '';

  return meta.position === 'prefix'
    ? `${sign}${symbol}${number}`
    : `${sign}${number} ${symbol}`;
}

export function signedMoney(value, type, currency = 'UZS', language = 'ru') {
  const sign = type === 'INCOME' ? '+' : '−';
  return `${sign}${money(Math.abs(value), currency, language)}`;
}

export function shortMoney(value, language = 'ru') {
  const v = Math.abs(Number(value) || 0);
  const suffix = language === 'uz' ? ['', ' ming', ' mln', ' mlrd'] : ['', ' тыс', ' млн', ' млрд'];
  let index = 0;
  let out = v;
  while (out >= 1000 && index < suffix.length - 1) {
    out /= 1000;
    index += 1;
  }
  const text = out >= 100 || index === 0 ? Math.round(out) : out.toFixed(1).replace('.0', '');
  return `${Number(value) < 0 ? '-' : ''}${text}${suffix[index]}`;
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function progressBar(value, size = 10) {
  const filled = Math.max(0, Math.min(size, Math.round((value / 100) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

export function categoryName(category, language = 'ru') {
  if (!category) return language === 'uz' ? 'Boshqa' : 'Другое';
  return language === 'uz' ? category.nameUz : category.nameRu;
}

export function trendArrow(diff) {
  if (diff > 0) return '📈';
  if (diff < 0) return '📉';
  return '➖';
}
