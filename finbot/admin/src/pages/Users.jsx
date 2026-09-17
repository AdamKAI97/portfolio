import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import Modal from '../components/Modal.jsx';
import { dateTime, money } from '../lib/format.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [broadcast, setBroadcast] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.users().then((r) => setUsers(r.users)).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const open = async (user) => {
    const data = await api.user(user.id);
    setDetail(data);
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const result = await api.broadcast(text.trim());
      window.alert(`Отправлено: ${result.sent} из ${result.total}`);
      setText('');
      setBroadcast(false);
    } finally {
      setSending(false);
    }
  };

  const toggleReminder = async (user) => {
    await api.updateUser(user.id, { reminderEnabled: !user.reminderEnabled });
    load();
  };

  return (
    <>
      <div className="panel__head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Пользователи</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Всего: {users.length}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setBroadcast(true)}>✉️ Рассылка</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Username</th>
              <th>Телефон</th>
              <th>Язык</th>
              <th>Напоминание</th>
              <th className="num">Операций</th>
              <th className="num">Целей</th>
              <th>Регистрация</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 560 }}>{user.firstName}</td>
                <td className="muted">{user.username ? `@${user.username}` : '—'}</td>
                <td className="muted num">{user.phone || '—'}</td>
                <td><span className="badge">{user.language === 'uz' ? '🇺🇿 UZ' : '🇷🇺 RU'}</span></td>
                <td>
                  <button className="btn btn--sm" onClick={() => toggleReminder(user)}>
                    {user.reminderEnabled ? `🔔 ${user.reminderTime}` : '🔕 выкл'}
                  </button>
                </td>
                <td className="num">{user._count?.transactions ?? 0}</td>
                <td className="num">{user._count?.goals ?? 0}</td>
                <td className="muted num">{dateTime(user.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn--sm" onClick={() => open(user)}>Подробнее</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(detail)}
        title={detail ? `${detail.user.firstName} · ${detail.user.language === 'uz' ? 'UZ' : 'RU'}` : ''}
        onClose={() => setDetail(null)}
        actions={<button className="btn" onClick={() => setDetail(null)}>Закрыть</button>}
      >
        {detail && (
          <>
            <div className="cards" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
              <div className="card">
                <div className="card__label">Доход за месяц</div>
                <div className="card__value" style={{ fontSize: 18 }}>{money(detail.month.income, detail.user.currency)}</div>
              </div>
              <div className="card">
                <div className="card__label">Расход за месяц</div>
                <div className="card__value" style={{ fontSize: 18 }}>{money(detail.month.expense, detail.user.currency)}</div>
              </div>
            </div>

            <h3 className="panel__title" style={{ marginBottom: 8 }}>Цели</h3>
            {detail.goals.length === 0 ? (
              <p className="muted" style={{ marginBottom: 16 }}>Целей нет</p>
            ) : (
              <ul style={{ paddingLeft: 18, marginBottom: 16 }}>
                {detail.goals.map((goal) => (
                  <li key={goal.id}>
                    {goal.emoji} {goal.title} — {money(goal.currentAmount, detail.user.currency)} / {money(goal.targetAmount, detail.user.currency)}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="panel__title" style={{ marginBottom: 8 }}>Последние операции</h3>
            <table>
              <tbody>
                {detail.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="muted num">{dateTime(tx.date)}</td>
                    <td>{tx.category?.emoji} {tx.category?.nameRu}</td>
                    <td className={`num ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`} style={{ textAlign: 'right' }}>
                      {tx.type === 'INCOME' ? '+' : '−'}{money(tx.amount, detail.user.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>

      <Modal
        open={broadcast}
        title="Рассылка всем пользователям"
        onClose={() => setBroadcast(false)}
        actions={
          <>
            <button className="btn" onClick={() => setBroadcast(false)}>Отмена</button>
            <button className="btn btn--primary" onClick={send} disabled={sending}>Отправить</button>
          </>
        }
      >
        <div className="field">
          <label className="field__label">Текст сообщения</label>
          <textarea className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
