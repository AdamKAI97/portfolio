import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

const MONTHS = {
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
};

const MONTHS_SHORT = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
};

export const TZ = (tz) => tz || 'Asia/Tashkent';

export function now(tz) {
  return dayjs().tz(TZ(tz));
}

/** Локальное время пользователя в формате HH:mm */
export function localTime(tz) {
  return now(tz).format('HH:mm');
}

export function currentMonthKey(tz) {
  return now(tz).format('YYYY-MM');
}

export function todayKey(tz) {
  return now(tz).format('YYYY-MM-DD');
}

export function todayRange(tz) {
  const start = now(tz).startOf('day');
  return { from: start.toDate(), to: start.endOf('day').toDate() };
}

export function monthRange(tz, monthKey) {
  const base = monthKey ? dayjs.tz(`${monthKey}-01`, TZ(tz)) : now(tz);
  return {
    month: base.format('YYYY-MM'),
    from: base.startOf('month').toDate(),
    to: base.endOf('month').toDate()
  };
}

export function prevMonthRange(tz, monthKey) {
  const base = monthKey ? dayjs.tz(`${monthKey}-01`, TZ(tz)) : now(tz);
  return monthRange(tz, base.subtract(1, 'month').format('YYYY-MM'));
}

export function lastDays(tz, days) {
  const end = now(tz).endOf('day');
  const start = end.subtract(days - 1, 'day').startOf('day');
  return { from: start.toDate(), to: end.toDate() };
}

export function weekRange(tz) {
  const base = now(tz);
  return { from: base.startOf('isoWeek').toDate(), to: base.endOf('isoWeek').toDate() };
}

/** Последние N месяцев (включая текущий), от старого к новому. */
export function monthsBack(tz, count, language = 'ru') {
  const out = [];
  const base = now(tz);
  for (let i = count - 1; i >= 0; i -= 1) {
    const m = base.subtract(i, 'month');
    out.push({
      month: m.format('YYYY-MM'),
      label: MONTHS_SHORT[language]?.[m.month()] || m.format('MMM'),
      from: m.startOf('month').toDate(),
      to: m.endOf('month').toDate()
    });
  }
  return out;
}

export function monthLabel(monthKey, language = 'ru') {
  const d = dayjs(`${monthKey}-01`);
  return `${MONTHS[language]?.[d.month()] || d.format('MMMM')} ${d.year()}`;
}

export function formatDate(date, tz, language = 'ru') {
  const d = dayjs(date).tz(TZ(tz));
  return `${d.date()} ${MONTHS_SHORT[language]?.[d.month()] || ''}`;
}

export function formatDateTime(date, tz, language = 'ru') {
  const d = dayjs(date).tz(TZ(tz));
  return `${formatDate(date, tz, language)}, ${d.format('HH:mm')}`;
}

export function formatFullDate(date, language = 'ru') {
  const d = dayjs(date);
  return `${d.date()} ${MONTHS_SHORT[language]?.[d.month()] || ''} ${d.year()}`;
}

export function parseUserDate(input, tz) {
  const d = dayjs.tz(String(input).trim(), ['DD.MM.YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], TZ(tz));
  return d.isValid() ? d.toDate() : null;
}

export function daysInMonth(tz, monthKey) {
  const base = monthKey ? dayjs(`${monthKey}-01`) : now(tz);
  return base.daysInMonth();
}

export function dayOfMonth(tz) {
  return now(tz).date();
}

export function diffDays(a, b) {
  return Math.abs(dayjs(a).startOf('day').diff(dayjs(b).startOf('day'), 'day'));
}

export function addDays(date, days) {
  return dayjs(date).add(days, 'day').toDate();
}

export { dayjs };
