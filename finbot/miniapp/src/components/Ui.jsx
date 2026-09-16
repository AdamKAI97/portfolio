export function Loader({ text = '…' }) {
  return <div className="loader">{text}</div>;
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
        className={`bar__fill ${variant === 'over' ? 'bar__fill--over' : ''} ${variant === 'income' ? 'bar__fill--income' : ''}`}
        style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
