import { useState } from 'react';
import api, { setToken } from '../lib/api.js';

export default function Login({ onSuccess }) {
  const [token, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(token);
      setToken(token);
      onSuccess();
    } catch (_) {
      setError('Неверный токен. Проверьте ADMIN_TOKEN в файле .env бэкенда.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login__box" onSubmit={submit}>
        <h1 className="login__title">Админ-панель</h1>
        <p className="login__hint">Введите ADMIN_TOKEN из файла backend/.env</p>
        <input
          className="input"
          type="password"
          value={token}
          onChange={(event) => setValue(event.target.value)}
          placeholder="admin token"
          autoFocus
        />
        <button className="btn btn--primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }} disabled={loading}>
          Войти
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
