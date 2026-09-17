import { useApp } from '../lib/store.jsx';
import { haptic } from '../lib/telegram.js';

const TABS = [
  { id: 'home', icon: '◎', label: 'nav.home' },
  { id: 'stats', icon: '◫', label: 'nav.stats' },
  { id: 'plan', icon: '◈', label: 'nav.plan' },
  { id: 'profile', icon: '◉', label: 'nav.profile' }
];

export default function BottomNav({ active, onChange, onAdd }) {
  const { t } = useApp();

  const go = (id) => {
    haptic('light');
    onChange(id);
  };

  const item = (tab) => (
    <button
      key={tab.id}
      className={`nav__item ${active === tab.id ? 'nav__item--active' : ''}`}
      onClick={() => go(tab.id)}
    >
      <span className="nav__icon">{tab.icon}</span>
      <span>{t(tab.label)}</span>
    </button>
  );

  return (
    <nav className="nav">
      {TABS.slice(0, 2).map(item)}
      <button className="nav__fab" onClick={() => { haptic('medium'); onAdd(); }} aria-label="+">+</button>
      {TABS.slice(2).map(item)}
    </nav>
  );
}
