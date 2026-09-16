import { useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Categories from './pages/Categories.jsx';
import Users from './pages/Users.jsx';
import { clearToken, getToken } from './lib/api.js';

const PAGES = [
  { id: 'dashboard', icon: '📊', label: 'Обзор', component: Dashboard },
  { id: 'transactions', icon: '🧾', label: 'Операции', component: Transactions },
  { id: 'categories', icon: '🏷', label: 'Категории', component: Categories },
  { id: 'users', icon: '👥', label: 'Пользователи', component: Users }
];

export default function App() {
  const [authorized, setAuthorized] = useState(Boolean(getToken()));
  const [page, setPage] = useState('dashboard');

  if (!authorized) return <Login onSuccess={() => setAuthorized(true)} />;

  const Current = PAGES.find((item) => item.id === page)?.component || Dashboard;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__logo">💰 Финансы</div>
        {PAGES.map((item) => (
          <button
            key={item.id}
            className={`sidebar__item ${page === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="sidebar__footer">
          <button
            className="sidebar__item"
            onClick={() => {
              clearToken();
              setAuthorized(false);
            }}
          >
            🚪 Выйти
          </button>
        </div>
      </aside>

      <main className="main">
        <Current />
      </main>
    </div>
  );
}
