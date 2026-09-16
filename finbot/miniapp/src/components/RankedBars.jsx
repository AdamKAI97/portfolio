import { categoryName } from '../lib/format.js';

/**
 * Ранжированные горизонтальные бары: одна серия, каждая строка подписана.
 * Цвет не кодирует категорию — идентичность несут эмодзи и подпись.
 */
export default function RankedBars({ rows, lang, money, color = 'var(--expense)', limit = 8 }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((row) => row.total));

  return (
    <div className="ranked">
      {rows.slice(0, limit).map((row) => (
        <div className="ranked__row" key={row.categoryId || 'none'}>
          <div className="ranked__name">
            <span>{row.category?.emoji || '💸'}</span>
            <span>{categoryName(row.category, lang)}</span>
            <span className="ranked__percent">{row.percent}%</span>
          </div>
          <div className="ranked__value">{money(row.total)}</div>
          <div className="ranked__track">
            <div
              className="ranked__fill"
              style={{ width: `${Math.max(3, Math.round((row.total / max) * 100))}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
