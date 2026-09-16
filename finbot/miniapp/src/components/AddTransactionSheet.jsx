import { useEffect, useMemo, useState } from 'react';
import Sheet from './Sheet.jsx';
import { useApp } from '../lib/store.jsx';
import api from '../lib/api.js';
import { categoryName, parseAmountInput } from '../lib/format.js';
import { haptic, notifySuccess } from '../lib/telegram.js';

const formatInput = (raw) => {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ru-RU').replace(/ /g, ' ');
};

export default function AddTransactionSheet({ open, onClose, defaultType = 'EXPENSE', presetCategoryId, preset }) {
  const { t, lang, expenseCategories, incomeCategories, refresh, showToast, money } = useApp();

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(presetCategoryId || null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = type === 'INCOME' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!open) return;
    setType(preset?.type || defaultType);
    setAmount(preset?.amount ? formatInput(preset.amount) : '');
    setCategoryId(preset?.categoryId || presetCategoryId || null);
    setNote(preset?.note || '');
  }, [open, defaultType, presetCategoryId, preset]);

  useEffect(() => {
    if (categoryId && !categories.some((c) => c.id === categoryId)) setCategoryId(null);
  }, [type, categories, categoryId]);

  const value = useMemo(() => parseAmountInput(amount), [amount]);

  const submit = async () => {
    if (!value || saving) return;
    setSaving(true);
    try {
      await api.createTransaction({
        type,
        amount: value,
        categoryId: categoryId || categories[0]?.id,
        note: note.trim() || null
      });
      notifySuccess();
      showToast(t('add.saved'));
      await refresh();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      title={t('add.title')}
      onClose={onClose}
      footer={
        <button className="btn btn--primary btn--block" disabled={!value || saving} onClick={submit}>
          {type === 'INCOME' ? t('add.submitIncome') : t('add.submitExpense')}
          {value ? ` — ${money(value)}` : ''}
        </button>
      }
    >
      <div className="segmented">
        <button
          className={`segmented__btn ${type === 'EXPENSE' ? 'segmented__btn--active' : ''}`}
          onClick={() => { haptic('light'); setType('EXPENSE'); }}
        >
          ➖ {t('common.expense')}
        </button>
        <button
          className={`segmented__btn ${type === 'INCOME' ? 'segmented__btn--active' : ''}`}
          onClick={() => { haptic('light'); setType('INCOME'); }}
        >
          ➕ {t('common.income')}
        </button>
      </div>

      <div className="field">
        <input
          className="input input--amount"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(event) => setAmount(formatInput(event.target.value))}
          autoFocus
        />
      </div>

      <div className="field">
        <span className="field__label">{t('add.category')}</span>
        <div className="cat-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`cat-btn ${categoryId === category.id ? 'cat-btn--active' : ''}`}
              onClick={() => { haptic('light'); setCategoryId(category.id); }}
            >
              <span className="cat-btn__emoji">{category.emoji}</span>
              <span>{categoryName(category, lang)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">{t('add.note')}</span>
        <input
          className="input"
          value={note}
          maxLength={100}
          onChange={(event) => setNote(event.target.value)}
          placeholder="…"
        />
      </div>
    </Sheet>
  );
}
