import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import RankedBars from '../components/RankedBars.jsx';
import TrendChart from '../components/TrendChart.jsx';
import OperationList from '../components/OperationList.jsx';
import { Empty, Loader } from '../components/Ui.jsx';
import { categoryName, todayMonthKey } from '../lib/format.js';

function shiftMonth(month, delta) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Stats({ onSelect }) {
  const { t, lang, money, short, version } = useApp();
  const [month, setMonth] = useState(todayMonthKey());
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const [overviewRes, trendRes, txRes] = await Promise.all([
          api.overview(month),
          api.trend(6),
          api.transactions({ month, take: 200 })
        ]);
        if (!alive) return;
        setOverview(overviewRes);
        setTrend(trendRes.trend);
        setTransactions(txRes.transactions);
      } catch (error) {
        console.error(error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [month, version]);

  const filtered = useMemo(
    () => (filter ? transactions.filter((tx) => tx.categoryId === filter) : transactions),
    [transactions, filter]
  );

  const usedCategories = useMemo(() => {
    const map = new Map();
    transactions.forEach((tx) => {
      if (tx.category) map.set(tx.category.id, tx.category);
    });
    return [...map.values()];
  }, [transactions]);

  if (loading && !overview) return <Loader />;

  return (
    <div className="page">
      <div className="row-between" style={{ padding: '6px 0 18px' }}>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 680, textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
          {overview?.label}
        </h1>
        <button className="icon-btn" disabled={month >= todayMonthKey()} onClick={() => setMonth(shiftMonth(month, 1))}>→</button>
      </div>

      <div className="bento enter">
        <div className="tile">
          <div className="tile__head"><span className="tile__dot" style={{ background: 'var(--expense)' }} />{t('common.expense')}</div>
          <div className="tile__value mono">{short(overview?.expense || 0)}</div>
          {overview?.isCurrentMonth && (
            <div className="tile__sub">{t('stats.forecast')}: {short(overview.forecast)}</div>
          )}
        </div>
        <div className="tile">
          <div className="tile__head"><span className="tile__dot" style={{ background: 'var(--income)' }} />{t('common.income')}</div>
          <div className="tile__value mono">{short(overview?.income || 0)}</div>
          {overview?.income > 0 && (
            <div className="tile__sub">{t('stats.saved')}: {overview.savedPercent}%</div>
          )}
        </div>
        <div className="tile">
          <div className="tile__head">{t('stats.avgDay')}</div>
          <div className="tile__value mono">{short(overview?.avgDay || 0)}</div>
        </div>
        <div className="tile">
          <div className="tile__head">{t('stats.noSpend')}</div>
          <div className="tile__value mono">{overview?.noSpendDays || 0}</div>
        </div>
      </div>

      <div className="section enter">
        <h2 className="section__title">{t('stats.byCategory')}</h2>
        {overview?.breakdown?.length ? (
          <div className="card">
            <RankedBars rows={overview.breakdown} lang={lang} money={short} />
          </div>
        ) : (
          <Empty emoji="📊" text={t('stats.empty')} />
        )}
      </div>

      <div className="section enter">
        <h2 className="section__title">{t('stats.trend')}</h2>
        <div className="card">
          <TrendChart data={trend} money={money} labels={{ income: t('common.income'), expense: t('common.expense') }} />
        </div>
      </div>

      <div className="section enter">
        <h2 className="section__title">{t('stats.history')}</h2>
        <div className="chips">
          <button className={`chip ${!filter ? 'chip--active' : ''}`} onClick={() => setFilter(null)}>
            {t('stats.filterAll')}
          </button>
          {usedCategories.map((category) => (
            <button
              key={category.id}
              className={`chip ${filter === category.id ? 'chip--active' : ''}`}
              onClick={() => setFilter(category.id)}
            >
              {category.emoji} {categoryName(category, lang)}
            </button>
          ))}
        </div>
        <OperationList transactions={filtered} emptyText={t('stats.empty')} onSelect={onSelect} />
      </div>
    </div>
  );
}
