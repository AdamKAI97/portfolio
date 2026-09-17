import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import TrendChart from '../components/TrendChart.jsx';
import { dateTime, money, shortMoney } from '../lib/format.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(String(e.message || e)));
  }, []);

  if (error) return <div className="empty">Ошибка: {error}</div>;
  if (!data) return <div className="empty">Загружаю…</div>;

  const diff = data.previous.expense
    ? Math.round(((data.month.expense - data.previous.expense) / data.previous.expense) * 100)
    : 0;
  const maxCategory = Math.max(1, ...data.topCategories.map((c) => c.total));

  return (
    <>
      <h1 className="page-title">Обзор</h1>
      <p className="page-sub">Сводка по всем пользователям бота · {data.month.key}</p>

      <div className="cards">
        <div className="card">
          <div className="card__label">Пользователей</div>
          <div className="card__value">{data.usersCount}</div>
        </div>
        <div className="card">
          <div className="card__label">Операций всего</div>
          <div className="card__value">{data.txCount}</div>
        </div>
        <div className="card">
          <div className="card__label"><span className="dot" style={{ background: 'var(--income)' }} />Доходы за месяц</div>
          <div className="card__value">{money(data.month.income)}</div>
        </div>
        <div className="card">
          <div className="card__label"><span className="dot" style={{ background: 'var(--expense)' }} />Расходы за месяц</div>
          <div className="card__value">{money(data.month.expense)}</div>
          {Boolean(data.previous.expense) && (
            <div className="card__hint">{diff > 0 ? '📈 +' : '📉 '}{diff}% к прошлому месяцу</div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Динамика за 6 месяцев</h2>
        </div>
        <TrendChart data={data.trend} />
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Топ категорий расходов за месяц</h2>
        </div>
        {data.topCategories.length === 0 ? (
          <div className="empty">Пока нет расходов в этом месяце</div>
        ) : (
          data.topCategories.map((row) => (
            <div className="bar-row" key={row.categoryId || 'none'}>
              <div>{row.category?.emoji || '💸'} {row.category?.nameRu || 'Без категории'}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(3, (row.total / maxCategory) * 100)}%` }} />
              </div>
              <div className="num" style={{ textAlign: 'right' }}>{shortMoney(row.total)}</div>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Последние операции</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Пользователь</th>
              <th>Категория</th>
              <th>Комментарий</th>
              <th style={{ textAlign: 'right' }}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((tx) => (
              <tr key={tx.id}>
                <td className="num muted">{dateTime(tx.date)}</td>
                <td>{tx.user?.firstName} {tx.user?.username ? <span className="muted">@{tx.user.username}</span> : null}</td>
                <td>{tx.category?.emoji} {tx.category?.nameRu || '—'}</td>
                <td className="muted">{tx.note || '—'}</td>
                <td className={`num ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`} style={{ textAlign: 'right' }}>
                  {tx.type === 'INCOME' ? '+' : '−'}{money(tx.amount, tx.user?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
