import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import Stories, { StoryViewer } from '../components/Stories.jsx';
import TransactionList from '../components/TransactionList.jsx';
import { todayMonthKey } from '../lib/format.js';

export default function Home({ onAdd, onOpenStats, onRepeat }) {
  const { t, user, snapshot, money, version } = useApp();
  const [stories, setStories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [overview, setOverview] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [storiesRes, txRes, overviewRes] = await Promise.all([
          api.stories(),
          api.transactions({ take: 5, month: todayMonthKey() }),
          api.overview()
        ]);
        if (!alive) return;
        setStories(storiesRes.stories);
        setRecent(txRes.transactions);
        setOverview(overviewRes);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  const balance = snapshot.month?.balance ?? 0;

  return (
    <div className="page">
      <header className="header">
        <div>
          <div className="header__hello">{t('home.hello')} 👋</div>
          <div className="header__name">{user?.firstName}</div>
        </div>
        {user?.streakCount > 0 && (
          <div className="header__badge">🔥 {user.streakCount} {t('home.streak')}</div>
        )}
      </header>

      <Stories stories={stories} onOpen={(index) => setViewer(index)} />

      <div className="card hero" style={{ marginTop: 14 }}>
        <div className="hero__label">{t('home.balance')}</div>
        <div className={`hero__value ${balance < 0 ? 'hero__value--negative' : ''}`}>
          {balance > 0 ? '+' : ''}{money(balance)}
        </div>
        {overview?.isCurrentMonth && (
          <div className="hero__sub">
            {t('home.forecast')}: {money(overview.forecast)}
          </div>
        )}

        <div className="tiles">
          <div className="tile">
            <div className="tile__label">
              <span className="tile__dot" style={{ background: 'var(--income)' }} />
              {t('home.income')}
            </div>
            <div className="tile__value">{money(snapshot.month?.income || 0)}</div>
          </div>
          <div className="tile">
            <div className="tile__label">
              <span className="tile__dot" style={{ background: 'var(--expense)' }} />
              {t('home.expense')}
            </div>
            <div className="tile__value">{money(snapshot.month?.expense || 0)}</div>
          </div>
        </div>

        <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={onAdd}>
          ➕ {t('home.cta')}
        </button>
        <div className="hero__sub">{t('home.ctaHint')}</div>
      </div>

      <div className="row-between" style={{ marginTop: 26, marginBottom: 6 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{t('home.recent')}</h2>
        <button className="btn-link" onClick={onOpenStats}>{t('home.seeAll')}</button>
      </div>

      <TransactionList transactions={recent} emptyText={t('home.empty')} onSelect={onRepeat} />

      {viewer !== null && (
        <StoryViewer stories={stories} startIndex={viewer} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
