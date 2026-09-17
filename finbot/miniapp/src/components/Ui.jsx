export function Loader() {
  return (
    <div className="loader">
      <div className="spinner" />
    </div>
  );
}

export function Empty({ emoji = '🗂', text }) {
  return (
    <div className="empty">
      <span className="empty__emoji">{emoji}</span>
      {text}
    </div>
  );
}

export function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`switch ${checked ? 'switch--on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="switch__knob" />
    </button>
  );
}

export function ProgressBar({ percent, variant }) {
  return (
    <div className="bar">
      <div
        className={`bar__fill ${variant === 'over' ? 'bar__fill--over' : ''} ${variant === 'flat' ? 'bar__fill--flat' : ''}`}
        style={{ width: `${Math.max(2, Math.min(100, percent || 0))}%` }}
      />
    </div>
  );
}

export function Ring({ percent = 0, size = 74, label }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--income)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="ring__value">{label ?? `${Math.round(percent)}%`}</span>
    </div>
  );
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          className={`segmented__btn ${value === option.value ? 'segmented__btn--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
