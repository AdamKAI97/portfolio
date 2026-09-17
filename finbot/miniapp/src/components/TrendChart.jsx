import { useState } from 'react';

const W = 340;
const H = 168;
const PAD_BOTTOM = 22;
const PAD_TOP = 8;
const GAP = 2;

function topRounded(x, y, width, height, radius) {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

/** Две серии — поэтому легенда обязательна, а выбранный месяц подписан числами. */
export default function TrendChart({ data, labels, money }) {
  const [active, setActive] = useState(data.length - 1);
  if (!data?.length) return null;

  const max = Math.max(1, ...data.map((item) => Math.max(item.income, item.expense)));
  const plot = H - PAD_BOTTOM - PAD_TOP;
  const group = W / data.length;
  const barWidth = Math.min(15, (group - GAP - 10) / 2);
  const y = (value) => PAD_TOP + plot - (value / max) * plot;
  const selected = data[active];

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
          <span className="mono" style={{ fontSize: 12, fontWeight: 620 }}>
            <span className="text-income">+{money(selected.income)}</span>
            <span className="text-expense">{'   '}−{money(selected.expense)}</span>
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
            y1={PAD_TOP + plot * (1 - step)}
            y2={PAD_TOP + plot * (1 - step)}
          />
        ))}
        <line className="baseline" x1="0" x2={W} y1={PAD_TOP + plot} y2={PAD_TOP + plot} />

        {data.map((item, index) => {
          const center = group * index + group / 2;
          const isActive = index === active;

          return (
            <g key={item.month} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} style={{ cursor: 'pointer' }}>
              <rect x={group * index} y={0} width={group} height={H} fill="transparent" />
              <path
                d={topRounded(center - barWidth - GAP / 2, y(item.income), barWidth, PAD_TOP + plot - y(item.income), 4)}
                fill="var(--income)"
                opacity={isActive ? 1 : 0.45}
              />
              <path
                d={topRounded(center + GAP / 2, y(item.expense), barWidth, PAD_TOP + plot - y(item.expense), 4)}
                fill="var(--expense)"
                opacity={isActive ? 1 : 0.45}
              />
              <text x={center} y={H - 6} textAnchor="middle" fontWeight={isActive ? 650 : 400}>
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
