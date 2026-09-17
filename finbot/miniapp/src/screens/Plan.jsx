import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import Sheet from '../components/Sheet.jsx';
import { Empty, ProgressBar, Segmented, Switch } from '../components/Ui.jsx';
import { categoryName, parseAmountInput, todayMonthKey } from '../lib/format.js';
import { notifySuccess } from '../lib/telegram.js';

export default function Plan() {
  const { t, lang, money, short, user, patchUser, refresh, version, expenseCategories, showToast } = useApp();

  const [tab, setTab] = useState('goals');
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subs, setSubs] = useState({ recurring: [], monthlyTotal: 0 });
  const [debts, setDebts] = useState([]);

  const [sheet, setSheet] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const [goalsRes, budgetsRes, subsRes, debtsRes] = await Promise.all([
        api.goals(),
        api.budgets(todayMonthKey()),
        api.recurring(),
        api.debts()
      ]);
      setGoals(goalsRes.goals);
      setBudgets(budgetsRes.budgets);
      setSubs(subsRes);
      setDebts(debtsRes.debts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, [version]);

  const open = (name, initial = {}) => {
    setForm(initial);
    setSheet(name);
  };

  const close = () => setSheet(null);

  const done = async () => {
    notifySuccess();
    showToast(t('common.saved'));
    close();
    await load();
    await refresh();
  };

  /* ------------------------------- действия ------------------------------- */

  const createGoal = async () => {
    const target = parseAmountInput(form.target);
    if (!form.title?.trim() || !target) return;
    await api.createGoal({ title: form.title.trim(), targetAmount: target });
    await done();
  };

  const depositGoal = async () => {
    const amount = parseAmountInput(form.amount);
    if (!amount) return;
    await api.depositGoal(form.id, amount);
    await done();
  };

  const saveBudget = async () => {
    const amount = parseAmountInput(form.amount);
    if (!form.categoryId || !amount) return;
    await api.setBudget({ categoryId: form.categoryId, amount, month: todayMonthKey() });
    await done();
  };

  const createSub = async () => {
    const amount = parseAmountInput(form.amount);
    if (!form.title?.trim() || !amount) return;
    await api.createRecurring({
      title: form.title.trim(),
      amount,
      dayOfMonth: Number(form.day) || 1,
      categoryId: form.categoryId || null
    });
    await done();
  };

  const createDebt = async () => {
    const amount = parseAmountInput(form.amount);
    if (!form.person?.trim() || !amount) return;
    await api.createDebt({
      person: form.person.trim(),
      amount,
      direction: form.direction || 'I_OWE'
    });
    await done();
  };

  /* -------------------------------- вкладки ------------------------------- */

  const GoalsTab = (
    <>
      <button className="btn btn--primary btn--block" onClick={() => open('goal')}>
        + {t('plan.addGoal')}
      </button>

      {goals.length === 0 ? (
        <Empty emoji="🎯" text={t('plan.goalsEmpty')} />
      ) : (
        <div className="stack" style={{ marginTop: 12 }}>
          {goals.map((goal) => (
            <div className="card enter" key={goal.id}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span style={{ fontWeight: 640 }}>{goal.isDone ? '✅' : goal.emoji} {goal.title}</span>
                <span className="mono" style={{ fontWeight: 660 }}>{goal.percent}%</span>
              </div>
              <ProgressBar percent={goal.percent} />
              <div className="row-between" style={{ marginTop: 10 }}>
                <span className="muted mono" style={{ fontSize: 13 }}>
                  {short(goal.currentAmount)} {t('common.of')} {short(goal.targetAmount)}
                </span>
                {!goal.isDone && (
                  <button className="btn btn--sm" onClick={() => open('deposit', { id: goal.id, title: goal.title })}>
                    {t('plan.deposit')}
                  </button>
                )}
              </div>
              <div className="row-between" style={{ marginTop: 10 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {!goal.isDone && goal.monthsLeft ? `⏳ ${goal.monthsLeft} ${t('plan.monthsLeft')}` : ''}
                </span>
                <button className="link-mini" onClick={async () => { await api.deleteGoal(goal.id); load(); }}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card card--flat" style={{ marginTop: 12 }}>
        <div className="switch-row">
          <div>
            <div className="setting__label">🪙 {t('plan.roundUp')}</div>
            <div className="setting__hint">{t('plan.roundUpHint')}</div>
          </div>
          <Switch checked={Boolean(user?.roundUpEnabled)} onChange={(value) => patchUser({ roundUpEnabled: value })} />
        </div>
      </div>
    </>
  );

  const BudgetsTab = (
    <>
      <button className="btn btn--primary btn--block" onClick={() => open('budget')}>
        + {t('plan.addBudget')}
      </button>

      {budgets.length === 0 ? (
        <Empty emoji="🎛" text={t('plan.budgetsEmpty')} />
      ) : (
        <div className="stack" style={{ marginTop: 12 }}>
          {budgets.map((budget) => (
            <div className="card enter" key={budget.id}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span style={{ fontWeight: 620 }}>
                  {budget.category?.emoji} {categoryName(budget.category, lang)}
                </span>
                <span className={`mono ${budget.isOver ? 'text-expense' : ''}`} style={{ fontWeight: 660 }}>
                  {budget.percent}%
                </span>
              </div>
              <ProgressBar percent={budget.percent} variant={budget.isOver ? 'over' : 'flat'} />
              <div className="muted mono" style={{ fontSize: 13, marginTop: 10 }}>
                {t('plan.spent')}: {short(budget.spent)} · {t('plan.limit')}: {short(budget.amount)}
                {budget.isOver ? ` · ⚠️ ${t('plan.over')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const SubsTab = (
    <>
      <button className="btn btn--primary btn--block" onClick={() => open('sub', { day: 1 })}>
        + {t('plan.addSub')}
      </button>

      {subs.recurring.length === 0 ? (
        <Empty emoji="🔁" text={t('plan.subsEmpty')} />
      ) : (
        <>
          <div className="card card--flat enter" style={{ marginTop: 12 }}>
            <div className="row-between">
              <span className="muted" style={{ fontSize: 13 }}>{t('plan.subTotal')}</span>
              <span className="mono" style={{ fontWeight: 680, fontSize: 18 }}>{money(subs.monthlyTotal)}</span>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 12 }}>
            {subs.recurring.map((item) => (
              <div className="card enter" key={item.id}>
                <div className="row-between">
                  <div>
                    <div style={{ fontWeight: 620, opacity: item.isActive ? 1 : 0.5 }}>
                      {item.category?.emoji || '🔁'} {item.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {item.dayOfMonth}{t('plan.subDayShort')}
                      {item.daysLeft !== null ? ` · ${t('common.left')} ${item.daysLeft} ${t('common.day')}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 660 }}>{money(item.amount)}</div>
                    <div className="row" style={{ gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="link-mini"
                        onClick={async () => { await api.updateRecurring(item.id, { isActive: !item.isActive }); load(); }}
                      >
                        {item.isActive ? t('plan.pause') : t('plan.resume')}
                      </button>
                      <button
                        className="link-mini"
                        onClick={async () => { await api.deleteRecurring(item.id); load(); }}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const DebtsTab = (
    <>
      <button className="btn btn--primary btn--block" onClick={() => open('debt', { direction: 'I_OWE' })}>
        + {t('plan.addDebt')}
      </button>

      {debts.length === 0 ? (
        <Empty emoji="🤝" text={t('plan.debtsEmpty')} />
      ) : (
        <div className="stack" style={{ marginTop: 12 }}>
          {debts.map((debt) => (
            <div className="card enter" key={debt.id}>
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 620 }}>
                    {debt.direction === 'I_OWE' ? '🔴' : '🟢'} {debt.person}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {debt.direction === 'I_OWE' ? t('plan.iOwe') : t('plan.theyOwe')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontWeight: 660 }}>{money(debt.amount)}</div>
                  <button
                    className="link-mini"
                    style={{ marginTop: 6 }}
                    onClick={async () => { await api.settleDebt(debt.id); load(); }}
                  >
                    {t('plan.settle')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="page">
      <h1 style={{ fontSize: 26, fontWeight: 720, letterSpacing: '-0.03em', padding: '6px 0 16px' }}>
        {t('plan.title')}
      </h1>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'goals', label: t('plan.goals') },
          { value: 'budgets', label: t('plan.budgets') },
          { value: 'subs', label: t('plan.subs') },
          { value: 'debts', label: t('plan.debts') }
        ]}
      />

      <div style={{ marginTop: 16 }}>
        {tab === 'goals' && GoalsTab}
        {tab === 'budgets' && BudgetsTab}
        {tab === 'subs' && SubsTab}
        {tab === 'debts' && DebtsTab}
      </div>

      {/* --------------------------- формы --------------------------------- */}

      <Sheet
        open={sheet === 'goal'}
        title={t('plan.addGoal')}
        onClose={close}
        footer={<button className="btn btn--primary btn--block" onClick={createGoal}>{t('common.add')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('plan.goalName')}</span>
          <input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="iPhone" />
        </div>
        <div className="field">
          <span className="field__label">{t('plan.goalTarget')}</span>
          <input className="input" inputMode="numeric" value={form.target || ''} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="12000000" />
        </div>
      </Sheet>

      <Sheet
        open={sheet === 'deposit'}
        title={form.title}
        onClose={close}
        footer={<button className="btn btn--primary btn--block" onClick={depositGoal}>{t('plan.deposit')}</button>}
      >
        <div className="card">
          <input
            className="input input--amount"
            inputMode="numeric"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            autoFocus
          />
        </div>
      </Sheet>

      <Sheet
        open={sheet === 'budget'}
        title={t('plan.addBudget')}
        onClose={close}
        footer={<button className="btn btn--primary btn--block" onClick={saveBudget}>{t('common.save')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('plan.budgets')}</span>
          <div className="cat-grid">
            {expenseCategories.map((category) => (
              <button
                key={category.id}
                className={`cat-btn ${form.categoryId === category.id ? 'cat-btn--active' : ''}`}
                onClick={() => setForm({ ...form, categoryId: category.id })}
              >
                <span className="cat-btn__emoji">{category.emoji}</span>
                <span>{categoryName(category, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label">{t('plan.limit')}</span>
          <input className="input" inputMode="numeric" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1500000" />
        </div>
      </Sheet>

      <Sheet
        open={sheet === 'sub'}
        title={t('plan.addSub')}
        onClose={close}
        footer={<button className="btn btn--primary btn--block" onClick={createSub}>{t('common.add')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('plan.subName')}</span>
          <input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Netflix" />
        </div>
        <div className="field">
          <span className="field__label">{t('add.amount')}</span>
          <input className="input" inputMode="numeric" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="120000" />
        </div>
        <div className="field">
          <span className="field__label">{t('plan.subDay')}</span>
          <input className="input" type="number" min="1" max="28" value={form.day || 1} onChange={(e) => setForm({ ...form, day: e.target.value })} />
        </div>
      </Sheet>

      <Sheet
        open={sheet === 'debt'}
        title={t('plan.addDebt')}
        onClose={close}
        footer={<button className="btn btn--primary btn--block" onClick={createDebt}>{t('common.add')}</button>}
      >
        <div className="segmented" style={{ marginBottom: 14 }}>
          <button
            className={`segmented__btn ${form.direction === 'I_OWE' ? 'segmented__btn--active' : ''}`}
            onClick={() => setForm({ ...form, direction: 'I_OWE' })}
          >
            {t('plan.iOwe')}
          </button>
          <button
            className={`segmented__btn ${form.direction === 'THEY_OWE' ? 'segmented__btn--active' : ''}`}
            onClick={() => setForm({ ...form, direction: 'THEY_OWE' })}
          >
            {t('plan.theyOwe')}
          </button>
        </div>
        <div className="field">
          <span className="field__label">{t('plan.debtPerson')}</span>
          <input className="input" value={form.person || ''} onChange={(e) => setForm({ ...form, person: e.target.value })} />
        </div>
        <div className="field">
          <span className="field__label">{t('add.amount')}</span>
          <input className="input" inputMode="numeric" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
      </Sheet>
    </div>
  );
}
