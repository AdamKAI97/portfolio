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
  const rounded = out >= 100 || index === 0 ? String(Math.round(out)) : out.toFixed(1).replace('.0', '');
  const text = lang === 'ru' ? rounded.replace('.', ',') : rounded;
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

const WEEKDAYS = {
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  uz: ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
};

/** «Сегодня», «Вчера» или «15 сент, пятница» */
export function dayLabel(value, lang = 'ru', labels = {}) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return labels.today || 'Сегодня';
  if (same(date, yesterday)) return labels.yesterday || 'Вчера';

  return `${formatDate(value, lang)}, ${WEEKDAYS[lang]?.[date.getDay()] || ''}`;
}

/** Группирует операции по дням, считая итог каждого дня. */
export function groupByDay(transactions, lang, labels) {
  const groups = new Map();

  for (const tx of transactions) {
    const key = new Date(tx.date).toDateString();
    if (!groups.has(key)) {
      groups.set(key, { key, date: tx.date, label: dayLabel(tx.date, lang, labels), items: [], income: 0, expense: 0 });
    }
    const group = groups.get(key);
    group.items.push(tx);
    if (tx.type === 'INCOME') group.income += tx.amount;
    else group.expense += tx.amount;
  }

  return [...groups.values()];
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
