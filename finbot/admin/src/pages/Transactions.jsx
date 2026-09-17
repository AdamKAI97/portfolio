import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { dateTime, money, monthKey } from '../lib/format.js';

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ month: monthKey(), type: '', userId: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.transactions({ ...filters, take: 300 });
      setRows(result.transactions);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.users().then((r) => setUsers(r.users)).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [filters.month, filters.type, filters.userId]);

  const remove = async (id) => {
    if (!window.confirm('Удалить операцию?')) return;
    await api.deleteTransaction(id);
    load();
  };

  const months = [monthKey(0), monthKey(-1), monthKey(-2), monthKey(-3), monthKey(-4), monthKey(-5)];

  return (
    <>
      <h1 className="page-title">Операции</h1>
      <p className="page-sub">Всего найдено: {total}</p>

      <div className="panel">
        <div className="filters">
          <div className="field">
            <label className="field__label">Месяц</label>
            <select className="select" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
              <option value="">Все</option>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Тип</label>
            <select className="select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">Все</option>
              <option value="EXPENSE">Расходы</option>
              <option value="INCOME">Доходы</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Пользователь</label>
            <select className="select" value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })}>
              <option value="">Все</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.firstName}</option>
              ))}
            </select>
          </div>
          <a className="btn" href={api.exportUrl()} target="_blank" rel="noreferrer">📤 CSV</a>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty">Загружаю…</div>
        ) : rows.length === 0 ? (
          <div className="empty">Операций не найдено</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Пользователь</th>
                <th>Телефон</th>
                <th>Категория</th>
                <th>Комментарий</th>
                <th>Источник</th>
                <th style={{ textAlign: 'right' }}>Сумма</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr key={tx.id}>
                  <td className="num muted">{dateTime(tx.date)}</td>
                  <td>{tx.user?.firstName}{tx.user?.username ? ` · @${tx.user.username}` : ''}</td>
                  <td className="muted num">{tx.user?.phone || '—'}</td>
                  <td>{tx.category?.emoji} {tx.category?.nameRu || '—'}</td>
                  <td className="muted">{tx.note || '—'}</td>
                  <td><span className="badge">{tx.source === 'miniapp' ? '📱 Mini App' : '🤖 Бот'}</span></td>
                  <td className={`num ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`} style={{ textAlign: 'right' }}>
                    {tx.type === 'INCOME' ? '+' : '−'}{money(tx.amount, tx.user?.currency)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn--sm btn--danger" onClick={() => remove(tx.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
