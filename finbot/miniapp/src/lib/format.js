const SYMBOL = { UZS: { ru: 'сум', uz: "so'm" }, USD: { ru: '$', uz: '$' }, RUB: { ru: '₽', uz: '₽' } };

export function money(value, currency = 'UZS', lang = 'ru') {
  const number = new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(Number(value) || 0))).replace(/ /g, ' ');
  const symbol = SYMBOL[currency]?.[lang] || currency;
  const sign = Number(value) < 0 ? '−' : '';
  return currency === 'USD' ? `${sign}${symbol}${number}` : `${sign}${number} ${symbol}`;
}

export function shortMoney(value, lang = 'ru') {
  const abs = Math.abs(Number(value) || 0);
  const units = lang === 'uz' ? ['', ' ming', ' mln', ' mlrd'] : ['', ' тыс', ' млн', ' млрд'];
  let index = 0;
  let out = abs;
  while (out >= 1000 && index < units.length - 1) {
    out /= 1000;
    index += 1;
  }
  const text = out >= 100 || index === 0 ? Math.round(out) : Number(out.toFixed(1));
  return `${Number(value) < 0 ? '−' : ''}${text}${units[index]}`;
}

export function signed(value, currency, lang) {
  const sign = Number(value) > 0 ? '+' : Number(value) < 0 ? '−' : '';
  return `${sign}${money(Math.abs(value), currency, lang)}`;
}

const MONTHS_SHORT = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
};

export function formatDate(value, lang = 'ru') {
  const date = new Date(value);
  return `${date.getDate()} ${MONTHS_SHORT[lang][date.getMonth()]}`;
}

export function formatTime(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function categoryName(category, lang = 'ru') {
  if (!category) return lang === 'uz' ? 'Boshqa' : 'Другое';
  return lang === 'uz' ? category.nameUz : category.nameRu;
}

export function todayMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function parseAmountInput(value) {
  const clean = String(value).replace(/\s/g, '').replace(',', '.');
  const number = Number.parseFloat(clean);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}
