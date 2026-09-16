import { useState } from 'react';

const W = 340;
const H = 170;
const PAD_BOTTOM = 22;
const PAD_TOP = 8;
const GAP = 2;

function roundedTopPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, Math.max(0, height));
  if (height <= 0) return '';
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

/**
 * Сгруппированные столбцы: доходы и расходы по месяцам.
 * Две серии -> легенда обязательна, выбранный месяц подписан значениями.
 */
export default function TrendChart({ data, labels, money }) {
  const [active, setActive] = useState(data.length - 1);
  if (!data?.length) return null;

  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const plotHeight = H - PAD_BOTTOM - PAD_TOP;
  const groupWidth = W / data.length;
  const barWidth = Math.min(16, (groupWidth - GAP - 10) / 2);
  const selected = data[active];

  const y = (value) => PAD_TOP + plotHeight - (value / max) * plotHeight;

  return (
    <div>
      <div className="legend">
        <span className="legend__item">
          <span className="legend__dot" style={{ background: 'var(--income)' }} />
          {labels.income}
        </span>
        <span className="legend__item">
          <span className="legend__dot" style={{ background: 'var(--expense)' }} />
          {labels.expense}
        </span>
      </div>

      {selected && (
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 12, textTransform: 'capitalize' }}>{selected.label}</span>
          <span style={{ fontSize: 12 }} className="mono">
            <span className="text-income">+{money(selected.income)}</span>
            {'  '}
            <span className="text-expense">−{money(selected.expense)}</span>
          </span>
        </div>
      )}

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img">
        {[0, 0.5, 1].map((step) => (
          <line
            key={step}
            className="grid-line"
            x1="0"
            x2={W}
            y1={PAD_TOP + plotHeight * (1 - step)}
            y2={PAD_TOP + plotHeight * (1 - step)}
          />
        ))}
        <line className="baseline" x1="0" x2={W} y1={PAD_TOP + plotHeight} y2={PAD_TOP + plotHeight} />

        {data.map((item, index) => {
          const center = groupWidth * index + groupWidth / 2;
          const incomeX = center - barWidth - GAP / 2;
          const expenseX = center + GAP / 2;
          const isActive = index === active;

          return (
            <g key={item.month} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} style={{ cursor: 'pointer' }}>
              <rect x={groupWidth * index} y={0} width={groupWidth} height={H} fill="transparent" />
              <path
                d={roundedTopPath(incomeX, y(item.income), barWidth, PAD_TOP + plotHeight - y(item.income), 4)}
                fill="var(--income)"
                opacity={isActive ? 1 : 0.55}
              />
              <path
                d={roundedTopPath(expenseX, y(item.expense), barWidth, PAD_TOP + plotHeight - y(item.expense), 4)}
                fill="var(--expense)"
                opacity={isActive ? 1 : 0.55}
              />
              <text x={center} y={H - 6} textAnchor="middle" fontWeight={isActive ? 600 : 400}>
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
