export function money(value, currency = 'UZS') {
  const number = new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(Number(value) || 0))).replace(/ /g, ' ');
  const sign = Number(value) < 0 ? '−' : '';
  if (currency === 'USD') return `${sign}$${number}`;
  return `${sign}${number} ${currency === 'UZS' ? 'сум' : currency}`;
}

export function shortMoney(value) {
  const abs = Math.abs(Number(value) || 0);
  const units = ['', ' тыс', ' млн', ' млрд'];
  let index = 0;
  let out = abs;
  while (out >= 1000 && index < units.length - 1) {
    out /= 1000;
    index += 1;
  }
  return `${out >= 100 || index === 0 ? Math.round(out) : Number(out.toFixed(1))}${units[index]}`;
}

export function dateTime(value) {
  const date = new Date(value);
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function monthKey(offset = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
