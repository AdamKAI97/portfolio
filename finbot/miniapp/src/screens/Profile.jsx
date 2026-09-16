import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import TransactionList from '../components/TransactionList.jsx';
import { Switch } from '../components/Ui.jsx';
import { initData } from '../lib/telegram.js';

export default function Profile({ onRepeat }) {
  const { t, user, patchUser, money, showToast, version } = useApp();
  const [achievements, setAchievements] = useState({ items: [], unlocked: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [incomePlan, setIncomePlan] = useState(String(user?.monthlyIncomePlan || ''));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [achievementsRes, txRes] = await Promise.all([
          api.achievements(),
          api.transactions({ take: 15 })
        ]);
        if (!alive) return;
        setAchievements(achievementsRes);
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
    const url = `${api.exportUrl}?initData=${encodeURIComponent(initData)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="page">
      <h1 className="header__name" style={{ marginBottom: 16 }}>{t('profile.title')}</h1>

      <div className="card">
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 620, fontSize: 17 }}>{user?.firstName}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {user?.username ? `@${user.username}` : user?.telegramId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 650 }}>🔥 {user?.streakCount || 0}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {t('profile.best')}: {user?.bestStreak || 0} {t('profile.days')}
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title">{t('profile.achievements')}</h2>
      <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
        {t('profile.unlocked')}: {achievements.unlocked}/{achievements.total}
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

      <h2 className="section-title">⚙️</h2>
      <div className="card">
        <div className="setting">
          <div>
            <div className="setting__label">{t('profile.language')}</div>
          </div>
          <div className="setting__control">
            <div className="segmented" style={{ margin: 0, width: 168 }}>
              <button
                className={`segmented__btn ${user?.language === 'ru' ? 'segmented__btn--active' : ''}`}
                onClick={() => patchUser({ language: 'ru' })}
              >
                🇷🇺 RU
              </button>
              <button
                className={`segmented__btn ${user?.language === 'uz' ? 'segmented__btn--active' : ''}`}
                onClick={() => patchUser({ language: 'uz' })}
              >
                🇺🇿 UZ
              </button>
            </div>
          </div>
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
              showToast(t('profile.saved'));
            }}
          />
        </div>
      </div>

      <button className="btn btn--block" style={{ marginTop: 12 }} onClick={download}>
        📤 {t('profile.export')}
      </button>

      <h2 className="section-title">{t('profile.history')}</h2>
      <TransactionList transactions={history} emptyText={t('home.empty')} onSelect={onRepeat} />
    </div>
  );
}
