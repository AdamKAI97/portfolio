import { useApp } from '../lib/store.jsx';
import { haptic } from '../lib/telegram.js';

const TABS = [
  { id: 'home', icon: '🏠', label: 'nav.home' },
  { id: 'stats', icon: '📊', label: 'nav.stats' },
  { id: 'goals', icon: '🎯', label: 'nav.goals' },
  { id: 'profile', icon: '👤', label: 'nav.profile' }
];

export default function BottomNav({ active, onChange, onAdd }) {
  const { t } = useApp();

  const go = (id) => {
    haptic('light');
    onChange(id);
  };

  return (
    <nav className="nav">
      {TABS.slice(0, 2).map((tab) => (
        <button key={tab.id} className={`nav__item ${active === tab.id ? 'nav__item--active' : ''}`} onClick={() => go(tab.id)}>
          <span className="nav__icon">{tab.icon}</span>
          <span>{t(tab.label)}</span>
        </button>
      ))}

      <button className="nav__item" onClick={() => { haptic('medium'); onAdd(); }} aria-label="+">
        <span className="nav__fab">+</span>
      </button>

      {TABS.slice(2).map((tab) => (
        <button key={tab.id} className={`nav__item ${active === tab.id ? 'nav__item--active' : ''}`} onClick={() => go(tab.id)}>
          <span className="nav__icon">{tab.icon}</span>
          <span>{t(tab.label)}</span>
        </button>
      ))}
    </nav>
  );
}
