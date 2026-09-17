import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import TopBar from '../components/TopBar.jsx';
import OperationList from '../components/OperationList.jsx';
import { Ring, Switch } from '../components/Ui.jsx';
import { initData } from '../lib/telegram.js';

const CURRENCIES = ['UZS', 'USD', 'RUB'];

export default function Profile({ onSelect }) {
  const { t, user, patchUser, money, showToast, version, theme, toggleTheme } = useApp();
  const [achievements, setAchievements] = useState({ items: [], unlocked: 0, total: 0 });
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [incomePlan, setIncomePlan] = useState(String(user?.monthlyIncomePlan || ''));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [achievementsRes, healthRes, txRes] = await Promise.all([
          api.achievements(),
          api.healthScore(),
          api.transactions({ take: 15 })
        ]);
        if (!alive) return;
        setAchievements(achievementsRes);
        setHealth(healthRes);
        setHistory(txRes.transactions);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  const download = () => {
    window.open(`${api.exportUrl}?initData=${encodeURIComponent(initData)}`, '_blank');
  };

  return (
    <div className="page">
      <TopBar subtitle={t('profile.title')} />

      <div className="card enter">
        <div className="row" style={{ gap: 18 }}>
          <Ring percent={health?.score || 0} label={health?.score ?? '—'} />
          <div>
            <div style={{ fontWeight: 650, fontSize: 15 }}>❤️‍🔥 {health ? `${health.score}/100` : '—'}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              🔥 {t('profile.streak')}: {user?.streakCount || 0} {t('profile.days')} ·
              {' '}{t('profile.best')}: {user?.bestStreak || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="section enter">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section__title" style={{ margin: 0 }}>{t('profile.achievements')}</h2>
          <span className="section__link">{achievements.unlocked}/{achievements.total}</span>
        </div>
        <div className="badges">
          {achievements.items.map((item) => (
            <div key={item.id} className={`badge ${item.unlocked ? 'badge--unlocked' : ''}`} title={item.description}>
              <div className="badge__emoji">{item.unlocked ? item.emoji : '🔒'}</div>
              <div className="badge__title">{item.title}</div>
              {!item.unlocked && <div className="badge__percent">{item.percent}%</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="section enter">
        <h2 className="section__title">⚙️</h2>
        <div className="card">
          <div className="setting">
            <div className="setting__label">{t('profile.language')}</div>
            <div className="segmented" style={{ width: 150 }}>
              <button
                className={`segmented__btn ${user?.language === 'ru' ? 'segmented__btn--active' : ''}`}
                onClick={() => patchUser({ language: 'ru' })}
              >
                RU
              </button>
              <button
                className={`segmented__btn ${user?.language === 'uz' ? 'segmented__btn--active' : ''}`}
                onClick={() => patchUser({ language: 'uz' })}
              >
                UZ
              </button>
            </div>
          </div>

          <div className="setting">
            <div className="setting__label">{t('profile.theme')}</div>
            <Switch checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          <div className="setting">
            <div className="setting__label">{t('profile.currency')}</div>
            <select
              className="input"
              style={{ width: 110 }}
              value={user?.currency || 'UZS'}
              onChange={(event) => patchUser({ currency: event.target.value })}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div className="setting">
            <div>
              <div className="setting__label">{t('profile.reminder')}</div>
              <div className="setting__hint">{user?.reminderTime}</div>
            </div>
            <Switch checked={Boolean(user?.reminderEnabled)} onChange={(value) => patchUser({ reminderEnabled: value })} />
          </div>

          <div className="setting">
            <div className="setting__label">{t('profile.reminderTime')}</div>
            <input
              className="input"
              type="time"
              style={{ width: 120 }}
              value={user?.reminderTime || '21:00'}
              onChange={(event) => patchUser({ reminderTime: event.target.value })}
            />
          </div>

          <div className="setting">
            <div className="setting__label">{t('profile.savingsRate')}</div>
            <input
              className="input"
              type="number"
              min="1"
              max="90"
              style={{ width: 90 }}
              value={user?.savingsRate ?? 10}
              onChange={(event) => patchUser({ savingsRate: Number(event.target.value) })}
            />
          </div>

          <div className="setting">
            <div>
              <div className="setting__label">{t('profile.incomePlan')}</div>
              <div className="setting__hint">{money(user?.monthlyIncomePlan || 0)}</div>
            </div>
            <input
              className="input"
              inputMode="numeric"
              style={{ width: 130 }}
              value={incomePlan}
              onChange={(event) => setIncomePlan(event.target.value)}
              onBlur={() => {
                patchUser({ monthlyIncomePlan: Number(String(incomePlan).replace(/\D/g, '')) || 0 });
                showToast(t('common.saved'));
              }}
            />
          </div>
        </div>

        <button className="btn btn--ghost btn--block" style={{ marginTop: 12 }} onClick={download}>
          📤 {t('profile.export')}
        </button>
      </div>

      <div className="section enter">
        <h2 className="section__title">{t('profile.history')}</h2>
        <OperationList transactions={history} emptyText={t('home.empty')} onSelect={onSelect} />
      </div>
    </div>
  );
}
