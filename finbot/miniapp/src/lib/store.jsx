import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api.js';
import { makeT } from './i18n.js';
import { money as fmtMoney, shortMoney as fmtShort } from './format.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [snapshot, setSnapshot] = useState({ today: null, month: null });
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const [me, cats] = await Promise.all([api.me(), api.categories()]);
      setUser(me.user);
      setSnapshot({ today: me.today, month: me.month });
      setCategories(cats.categories);
      setStatus('ready');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me.user);
      setSnapshot({ today: me.today, month: me.month });
    } catch (error) {
      console.error(error);
    }
    setVersion((value) => value + 1);
  }, []);

  const patchUser = useCallback(async (data) => {
    setUser((prev) => ({ ...prev, ...data }));
    try {
      const result = await api.updateMe(data);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const lang = user?.language === 'uz' ? 'uz' : 'ru';

  const value = useMemo(
    () => ({
      user,
      lang,
      t: makeT(lang),
      categories,
      expenseCategories: categories.filter((c) => c.type === 'EXPENSE'),
      incomeCategories: categories.filter((c) => c.type === 'INCOME'),
      snapshot,
      status,
      version,
      refresh,
      reload: load,
      patchUser,
      showToast,
      money: (value_) => fmtMoney(value_, user?.currency || 'UZS', lang),
      short: (value_) => fmtShort(value_, lang)
    }),
    [user, lang, categories, snapshot, status, version, refresh, load, patchUser, showToast]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp вне AppProvider');
  return context;
}
