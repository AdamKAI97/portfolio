import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import RankedBars from '../components/RankedBars.jsx';
import TrendChart from '../components/TrendChart.jsx';
import TransactionList from '../components/TransactionList.jsx';
import { Empty, Loader } from '../components/Ui.jsx';
import { categoryName, todayMonthKey } from '../lib/format.js';

function shiftMonth(month, delta) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Stats({ onRepeat }) {
  const { t, lang, money, version } = useApp();
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

  if (loading && !overview) return <Loader text={t('common.loading')} />;

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 18 }}>
        <button className="btn btn--small" onClick={() => setMonth(shiftMonth(month, -1))}>←</button>
        <h1 className="header__name" style={{ fontSize: 18, textTransform: 'capitalize' }}>{overview?.label}</h1>
        <button
          className="btn btn--small"
          disabled={month >= todayMonthKey()}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          →
        </button>
      </div>

      <div className="tiles" style={{ marginTop: 0 }}>
        <div className="tile">
          <div className="tile__label"><span className="tile__dot" style={{ background: 'var(--expense)' }} />{t('common.expense')}</div>
          <div className="tile__value">{money(overview?.expense || 0)}</div>
        </div>
        <div className="tile">
          <div className="tile__label"><span className="tile__dot" style={{ background: 'var(--income)' }} />{t('common.income')}</div>
          <div className="tile__value">{money(overview?.income || 0)}</div>
        </div>
        <div className="tile">
          <div className="tile__label">{t('stats.avgDay')}</div>
          <div className="tile__value">{money(overview?.avgDay || 0)}</div>
        </div>
        <div className="tile">
          <div className="tile__label">{t('stats.noSpend')}</div>
          <div className="tile__value">{overview?.noSpendDays || 0}</div>
        </div>
      </div>

      <h2 className="section-title">{t('stats.byCategory')}</h2>
      {overview?.breakdown?.length ? (
        <div className="card">
          <RankedBars rows={overview.breakdown} lang={lang} money={money} />
        </div>
      ) : (
        <Empty emoji="📊" text={t('stats.empty')} />
      )}

      <h2 className="section-title">{t('stats.trend')}</h2>
      <div className="card">
        <TrendChart
          data={trend}
          money={money}
          labels={{ income: t('common.income'), expense: t('common.expense') }}
        />
      </div>

      <h2 className="section-title">{t('stats.history')}</h2>
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

      <TransactionList transactions={filtered} emptyText={t('stats.empty')} onSelect={onRepeat} />
    </div>
  );
}
