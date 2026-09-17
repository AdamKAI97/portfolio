import { useApp } from '../lib/store.jsx';
import { haptic } from '../lib/telegram.js';

export default function TopBar({ subtitle }) {
  const { user, t, theme, toggleTheme } = useApp();
  const initial = (user?.firstName || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__user">
        <div className="avatar">{initial}</div>
        <div>
          <div className="topbar__hello">{subtitle || `${t('home.hello')} 👋`}</div>
          <div className="topbar__name">{user?.firstName}</div>
        </div>
      </div>

      <div className="row" style={{ gap: 8 }}>
        {user?.streakCount > 0 && (
          <span className="chip-streak">🔥 {user.streakCount} {t('home.streak')}</span>
        )}
        <button className="icon-btn" onClick={() => { haptic('light'); toggleTheme(); }} aria-label="theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
