import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import TopBar from '../components/TopBar.jsx';
import Stories, { StoryViewer } from '../components/Stories.jsx';
import OperationList from '../components/OperationList.jsx';
import { todayMonthKey } from '../lib/format.js';

export default function Home({ onAdd, onOpenStats, onSelect }) {
  const { t, money, short, snapshot, version } = useApp();
  const [stories, setStories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [storiesRes, txRes, allowanceRes] = await Promise.all([
          api.stories(),
          api.transactions({ take: 6, month: todayMonthKey() }),
          api.allowance()
        ]);
        if (!alive) return;
        setStories(storiesRes.stories);
        setRecent(txRes.transactions);
        setAllowance(allowanceRes);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  const perDay = allowance?.perDay ?? 0;
  const spentToday = allowance?.spentToday ?? 0;
  const usedPercent = perDay > 0 ? Math.min(100, Math.round((spentToday / perDay) * 100)) : spentToday > 0 ? 100 : 0;
  const leftToday = allowance?.leftToday ?? 0;
  const hasPlan = perDay > 0 || (allowance?.planIncome ?? 0) > 0;
  const overspent = hasPlan && perDay > 0 && spentToday > perDay;

  return (
    <div className="page">
      <TopBar />

      <Stories stories={stories} onOpen={(index) => setViewer(index)} />

      <div className="card card--hero enter" style={{ marginTop: 16 }}>
        <div className="hero__label">💡 {overspent ? t('home.overspent') : t('home.canSpend')}</div>
        <div className="hero__value mono">
          {hasPlan
            ? overspent
              ? `−${money(spentToday - perDay)}`
              : money(leftToday)
            : money(snapshot.month?.balance || 0)}
        </div>
        <div className="hero__sub">
          {hasPlan
            ? `${money(perDay)} ${t('home.perDay')}`
            : t('home.noPlan')}
        </div>

        {hasPlan && (
          <>
            <div className="hero__bar">
              <div className={`hero__fill ${overspent ? 'hero__fill--over' : ''}`} style={{ width: `${usedPercent}%` }} />
            </div>
            <div className="hero__foot">
              <span>{t('home.spentToday')} · {short(spentToday)}</span>
              <span>{allowance?.daysLeft} {t('home.daysLeft')}</span>
            </div>
          </>
        )}
      </div>

      <div className="bento enter" style={{ marginTop: 12 }}>
        <div className="tile">
          <div className="tile__head">
            <span className="tile__dot" style={{ background: 'var(--income)' }} />
            {t('home.income')}
          </div>
          <div className="tile__value mono">{short(snapshot.month?.income || 0)}</div>
        </div>
        <div className="tile">
          <div className="tile__head">
            <span className="tile__dot" style={{ background: 'var(--expense)' }} />
            {t('home.expense')}
          </div>
          <div className="tile__value mono">{short(snapshot.month?.expense || 0)}</div>
        </div>
      </div>

      <button className="btn btn--ghost btn--block enter" style={{ marginTop: 12 }} onClick={onAdd}>
        + {t('home.quickAdd')}
      </button>

      <div className="section enter">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section__title" style={{ margin: 0 }}>{t('home.recent')}</h2>
          <button className="section__link" onClick={onOpenStats}>{t('home.seeAll')} →</button>
        </div>
        <OperationList transactions={recent} emptyText={t('home.empty')} onSelect={onSelect} />
      </div>

      {viewer !== null && <StoryViewer stories={stories} startIndex={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
