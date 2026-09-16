import { useState } from 'react';
import { useApp } from './lib/store.jsx';
import BottomNav from './components/BottomNav.jsx';
import AddTransactionSheet from './components/AddTransactionSheet.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Stats from './screens/Stats.jsx';
import Goals from './screens/Goals.jsx';
import Profile from './screens/Profile.jsx';
import { Loader } from './components/Ui.jsx';

export default function App() {
  const { status, user, t, reload } = useApp();
  const [tab, setTab] = useState('home');
  const [adding, setAdding] = useState(false);
  const [preset, setPreset] = useState(null);

  if (status === 'loading') return <Loader text="…" />;

  if (status === 'error') {
    return (
      <div className="loader">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 12 }}>⚠️ {t('common.error')}</p>
          <button className="btn" onClick={reload}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  if (!user?.onboarded) {
    return <Onboarding onFinish={() => setTab('home')} />;
  }

  const openAdd = (presetValue = null) => {
    setPreset(presetValue);
    setAdding(true);
  };

  const repeat = (transaction) =>
    openAdd({
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      note: transaction.note || ''
    });

  return (
    <div className="app">
      {tab === 'home' && <Home onAdd={() => openAdd()} onOpenStats={() => setTab('stats')} onRepeat={repeat} />}
      {tab === 'stats' && <Stats onRepeat={repeat} />}
      {tab === 'goals' && <Goals />}
      {tab === 'profile' && <Profile onRepeat={repeat} />}

      <BottomNav active={tab} onChange={setTab} onAdd={() => openAdd()} />

      <AddTransactionSheet
        open={adding}
        preset={preset}
        onClose={() => {
          setAdding(false);
          setPreset(null);
        }}
      />
    </div>
  );
}
