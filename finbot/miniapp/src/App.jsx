import { useState } from 'react';
import { useApp } from './lib/store.jsx';
import BottomNav from './components/BottomNav.jsx';
import AddSheet from './components/AddSheet.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Stats from './screens/Stats.jsx';
import Plan from './screens/Plan.jsx';
import Profile from './screens/Profile.jsx';
import { Loader } from './components/Ui.jsx';

export default function App() {
  const { status, user, t, reload } = useApp();
  const [tab, setTab] = useState('home');
  const [adding, setAdding] = useState(false);
  const [preset, setPreset] = useState(null);
  const [editing, setEditing] = useState(null);

  if (status === 'loading') return <Loader />;

  if (status === 'error') {
    return (
      <div className="loader">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 14 }}>⚠️ {t('common.error')}</p>
          <button className="btn btn--primary" onClick={reload}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  if (!user?.onboarded) return <Onboarding onFinish={() => setTab('home')} />;

  const openAdd = () => {
    setPreset(null);
    setEditing(null);
    setAdding(true);
  };

  const openEdit = (transaction) => {
    setPreset(null);
    setEditing(transaction);
    setAdding(true);
  };

  const closeSheet = () => {
    setAdding(false);
    setPreset(null);
    setEditing(null);
  };

  return (
    <div className="app">
      {tab === 'home' && <Home onAdd={openAdd} onOpenStats={() => setTab('stats')} onSelect={openEdit} />}
      {tab === 'stats' && <Stats onSelect={openEdit} />}
      {tab === 'plan' && <Plan />}
      {tab === 'profile' && <Profile onSelect={openEdit} />}

      <BottomNav active={tab} onChange={setTab} onAdd={openAdd} />

      <AddSheet open={adding} preset={preset} transaction={editing} onClose={closeSheet} />
    </div>
  );
}
