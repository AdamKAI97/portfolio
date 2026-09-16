import { useState } from 'react';
import { shortMoney } from '../lib/format.js';

const W = 640;
const H = 200;
const PAD_BOTTOM = 24;
const PAD_TOP = 10;
const GAP = 2;

function topRounded(x, y, width, height, radius) {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

export default function TrendChart({ data }) {
  const [active, setActive] = useState(null);
  if (!data?.length) return null;

  const max = Math.max(1, ...data.map((item) => Math.max(item.income, item.expense)));
  const plot = H - PAD_BOTTOM - PAD_TOP;
  const group = W / data.length;
  const barWidth = Math.min(28, (group - GAP - 24) / 2);
  const y = (value) => PAD_TOP + plot - (value / max) * plot;
  const selected = active !== null ? data[active] : null;

  return (
    <div>
      <div className="legend">
        <span className="legend__item"><span className="dot" style={{ background: 'var(--income)' }} /> Доходы</span>
        <span className="legend__item"><span className="dot" style={{ background: 'var(--expense)' }} /> Расходы</span>
        {selected && (
          <span className="legend__item num" style={{ marginLeft: 'auto' }}>
            {selected.label}: <b className="text-income">+{shortMoney(selected.income)}</b>{' '}
            <b className="text-expense">−{shortMoney(selected.expense)}</b>
          </span>
        )}
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map((step) => (
          <line key={step} className="grid-line" x1="0" x2={W} y1={PAD_TOP + plot * (1 - step)} y2={PAD_TOP + plot * (1 - step)} />
        ))}
        <line className="baseline" x1="0" x2={W} y1={PAD_TOP + plot} y2={PAD_TOP + plot} />

        {data.map((item, index) => {
          const center = group * index + group / 2;
          return (
            <g key={item.month} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}>
              <rect x={group * index} y="0" width={group} height={H} fill="transparent" />
              <path d={topRounded(center - barWidth - GAP / 2, y(item.income), barWidth, PAD_TOP + plot - y(item.income), 4)} fill="var(--income)" opacity={active === null || active === index ? 1 : 0.5} />
              <path d={topRounded(center + GAP / 2, y(item.expense), barWidth, PAD_TOP + plot - y(item.expense), 4)} fill="var(--expense)" opacity={active === null || active === index ? 1 : 0.5} />
              <text x={center} y={H - 8} textAnchor="middle">{item.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
