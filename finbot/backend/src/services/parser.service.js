const UNITS = [
  { re: /^(млрд|mlrd|миллиард|milliard)$/i, mult: 1e9 },
  { re: /^(млн|mln|миллион|million)$/i, mult: 1e6 },
  { re: /^(тыс|тысяч|ming|k|к)$/i, mult: 1e3 }
];

const NUMBER_RE = /(\d[\d\s]*(?:[.,]\d+)?)\s*(млрд|mlrd|миллиард|milliard|млн|mln|миллион|million|тыс|тысяч|ming|k|к)?/i;

export function parseAmount(text) {
  const match = String(text || '').match(NUMBER_RE);
  if (!match) return null;

  const raw = match[1].replace(/\s/g, '').replace(',', '.');
  let amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (match[2]) {
    const unit = UNITS.find((u) => u.re.test(match[2]));
    if (unit) amount *= unit.mult;
  }

  if (amount > 1e12) return null;
  return Math.round(amount);
}

/**
 * «45000 такси»        -> { type: 'EXPENSE', amount: 45000, note: 'такси' }
 * «+3 млн зарплата»    -> { type: 'INCOME',  amount: 3000000, note: 'зарплата' }
 */
export function parseEntry(text, defaultType = 'EXPENSE') {
  let value = String(text || '').trim();
  if (!value) return null;

  let type = defaultType;
  if (/^\+/.test(value)) {
    type = 'INCOME';
    value = value.slice(1).trim();
  } else if (/^[-−–]/.test(value)) {
    type = 'EXPENSE';
    value = value.slice(1).trim();
  }

  const match = value.match(NUMBER_RE);
  if (!match) return null;

  const amount = parseAmount(value);
  if (!amount) return null;

  const note = (value.slice(0, match.index) + ' ' + value.slice(match.index + match[0].length))
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
    .trim();

  return { type, amount, note: note || null };
}

export function parseTime(text) {
  const match = String(text || '').trim().match(/^([01]?\d|2[0-3])[:.\s]([0-5]\d)$/);
  if (!match) return null;
  return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
}

export function parsePercent(text) {
  const value = Number.parseInt(String(text || '').replace(/\D/g, ''), 10);
  if (!Number.isFinite(value) || value < 1 || value > 90) return null;
  return value;
}
