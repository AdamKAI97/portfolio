import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useApp } from '../lib/store.jsx';
import Sheet from '../components/Sheet.jsx';
import { Empty, ProgressBar, Switch } from '../components/Ui.jsx';
import { categoryName, parseAmountInput, todayMonthKey } from '../lib/format.js';
import { notifySuccess } from '../lib/telegram.js';

export default function Goals() {
  const { t, lang, money, user, patchUser, showToast, expenseCategories, refresh, version } = useApp();

  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goalForm, setGoalForm] = useState(false);
  const [depositFor, setDepositFor] = useState(null);
  const [budgetForm, setBudgetForm] = useState(false);

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [depositValue, setDepositValue] = useState('');
  const [budgetCategory, setBudgetCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const load = async () => {
    try {
      const [goalsRes, budgetsRes] = await Promise.all([api.goals(), api.budgets(todayMonthKey())]);
      setGoals(goalsRes.goals);
      setBudgets(budgetsRes.budgets);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, [version]);

  const createGoal = async () => {
    const amount = parseAmountInput(target);
    if (!title.trim() || !amount) return;
    await api.createGoal({ title: title.trim(), targetAmount: amount });
    setTitle('');
    setTarget('');
    setGoalForm(false);
    notifySuccess();
    await load();
  };

  const deposit = async () => {
    const amount = parseAmountInput(depositValue);
    if (!amount || !depositFor) return;
    await api.depositGoal(depositFor.id, amount);
    setDepositValue('');
    setDepositFor(null);
    notifySuccess();
    showToast(t('profile.saved'));
    await load();
  };

  const removeGoal = async (goal) => {
    await api.deleteGoal(goal.id);
    await load();
  };

  const saveBudget = async () => {
    const amount = parseAmountInput(budgetAmount);
    if (!budgetCategory || !amount) return;
    await api.setBudget({ categoryId: budgetCategory, amount, month: todayMonthKey() });
    setBudgetAmount('');
    setBudgetCategory(null);
    setBudgetForm(false);
    await load();
    await refresh();
  };

  return (
    <div className="page">
      <h1 className="header__name" style={{ marginBottom: 16 }}>{t('goals.title')}</h1>

      <div className="row-between">
        <h2 className="section-title" style={{ margin: 0 }}>{t('goals.goals')}</h2>
        <button className="btn btn--small" onClick={() => setGoalForm(true)}>+ {t('goals.add')}</button>
      </div>

      {goals.length === 0 ? (
        <Empty emoji="🎯" text={t('goals.empty')} />
      ) : (
        <div style={{ marginTop: 12 }}>
          {goals.map((goal) => (
            <div className="card" key={goal.id}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 620 }}>{goal.isDone ? '✅' : goal.emoji} {goal.title}</div>
                <div className="mono" style={{ fontWeight: 620 }}>{goal.percent}%</div>
              </div>
              <ProgressBar percent={goal.percent} variant={goal.isDone ? 'income' : undefined} />
              <div className="row-between" style={{ marginTop: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {money(goal.currentAmount)} {t('goals.of')} {money(goal.targetAmount)}
                </span>
                {!goal.isDone && (
                  <button className="btn btn--small" onClick={() => setDepositFor(goal)}>{t('goals.deposit')}</button>
                )}
              </div>
              {!goal.isDone && goal.monthsLeft ? (
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  📅 ~{goal.monthsLeft} {lang === 'uz' ? 'oy' : 'мес.'} · {money(goal.left)} {t('goals.left')}
                </div>
              ) : null}
              <button className="btn-link" style={{ marginTop: 10, display: 'inline-block' }} onClick={() => removeGoal(goal)}>
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card card--plane" style={{ marginTop: 16 }}>
        <div className="switch-row">
          <div>
            <div className="setting__label">🪙 {t('goals.roundUp')}</div>
            <div className="setting__hint">{t('goals.roundUpHint')}</div>
          </div>
          <Switch
            checked={Boolean(user?.roundUpEnabled)}
            onChange={(value) => patchUser({ roundUpEnabled: value })}
          />
        </div>
      </div>

      <div className="row-between" style={{ marginTop: 26 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{t('goals.budgets')}</h2>
        <button className="btn btn--small" onClick={() => setBudgetForm(true)}>+ {t('goals.setLimit')}</button>
      </div>

      {budgets.length === 0 ? (
        <Empty emoji="🎛" text={t('goals.budgetsEmpty')} />
      ) : (
        <div style={{ marginTop: 12 }}>
          {budgets.map((budget) => (
            <div className="card" key={budget.id}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>
                  {budget.category?.emoji} {categoryName(budget.category, lang)}
                </div>
                <div className={`mono ${budget.isOver ? 'text-expense' : ''}`} style={{ fontWeight: 620 }}>
                  {budget.percent}%
                </div>
              </div>
              <ProgressBar percent={budget.percent} variant={budget.isOver ? 'over' : undefined} />
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                {t('goals.spent')}: {money(budget.spent)} / {t('goals.limit')}: {money(budget.amount)}
                {budget.isOver ? ` · ⚠️ ${t('goals.over')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Новая цель --- */}
      <Sheet
        open={goalForm}
        title={t('goals.add')}
        onClose={() => setGoalForm(false)}
        footer={<button className="btn btn--primary btn--block" onClick={createGoal}>{t('goals.create')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('goals.name')}</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="iPhone / Ta'til" />
        </div>
        <div className="field">
          <span className="field__label">{t('goals.target')}</span>
          <input
            className="input"
            inputMode="numeric"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="12000000"
          />
        </div>
      </Sheet>

      {/* --- Пополнение цели --- */}
      <Sheet
        open={Boolean(depositFor)}
        title={depositFor ? `${depositFor.emoji} ${depositFor.title}` : ''}
        onClose={() => setDepositFor(null)}
        footer={<button className="btn btn--primary btn--block" onClick={deposit}>{t('goals.deposit')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('goals.depositAmount')}</span>
          <input
            className="input input--amount"
            inputMode="numeric"
            value={depositValue}
            onChange={(event) => setDepositValue(event.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>
      </Sheet>

      {/* --- Лимит по категории --- */}
      <Sheet
        open={budgetForm}
        title={t('goals.setLimit')}
        onClose={() => setBudgetForm(false)}
        footer={<button className="btn btn--primary btn--block" onClick={saveBudget}>{t('common.save')}</button>}
      >
        <div className="field">
          <span className="field__label">{t('add.category')}</span>
          <div className="cat-grid">
            {expenseCategories.map((category) => (
              <button
                key={category.id}
                className={`cat-btn ${budgetCategory === category.id ? 'cat-btn--active' : ''}`}
                onClick={() => setBudgetCategory(category.id)}
              >
                <span className="cat-btn__emoji">{category.emoji}</span>
                <span>{categoryName(category, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label">{t('goals.limit')}</span>
          <input
            className="input"
            inputMode="numeric"
            value={budgetAmount}
            onChange={(event) => setBudgetAmount(event.target.value)}
            placeholder="1500000"
          />
        </div>
      </Sheet>
    </div>
  );
}
