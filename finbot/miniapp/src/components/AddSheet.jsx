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

/** Часто встречающиеся суммы — чтобы записывать в один тап. */
function buildPresets(transactions, type) {
  const counts = new Map();
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    counts.set(tx.amount, (counts.get(tx.amount) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .slice(0, 4)
    .map(([amount]) => amount);
}

export default function AddSheet({ open, onClose, preset, transaction }) {
  const { t, lang, expenseCategories, incomeCategories, refresh, showToast, money, short } = useApp();

  const isEdit = Boolean(transaction);
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  const categories = type === 'INCOME' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!open) return;
    const source = transaction || preset || {};
    setType(source.type || 'EXPENSE');
    setAmount(source.amount ? formatInput(source.amount) : '');
    setCategoryId(source.categoryId || null);
    setNote(source.note || '');
  }, [open, preset, transaction]);

  useEffect(() => {
    if (!open || isEdit) return;
    api.transactions({ take: 60 }).then((r) => setHistory(r.transactions)).catch(() => {});
  }, [open, isEdit]);

  useEffect(() => {
    if (categoryId && !categories.some((c) => c.id === categoryId)) setCategoryId(null);
  }, [type, categories, categoryId]);

  const value = useMemo(() => parseAmountInput(amount), [amount]);
  const presets = useMemo(() => buildPresets(history, type), [history, type]);

  const submit = async () => {
    if (!value || saving) return;
    setSaving(true);
    try {
      const payload = {
        type,
        amount: value,
        categoryId: categoryId || categories[0]?.id,
        note: note.trim() || null
      };

      if (isEdit) await api.updateTransaction(transaction.id, payload);
      else await api.createTransaction(payload);

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

  const remove = async () => {
    if (!isEdit || saving) return;
    setSaving(true);
    try {
      await api.deleteTransaction(transaction.id);
      haptic('medium');
      showToast(t('add.deleted'));
      await refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      title={isEdit ? t('add.editTitle') : t('add.title')}
      onClose={onClose}
      footer={
        <div className="stack">
          <button className="btn btn--primary btn--block" disabled={!value || saving} onClick={submit}>
            {isEdit ? t('common.save') : type === 'INCOME' ? t('add.submitIncome') : t('add.submitExpense')}
            {value ? ` · ${money(value)}` : ''}
          </button>
          {isEdit && (
            <button className="btn btn--danger btn--block" onClick={remove} disabled={saving}>
              {t('common.delete')}
            </button>
          )}
        </div>
      }
    >
      <div className="segmented" style={{ marginBottom: 14 }}>
        <button
          className={`segmented__btn ${type === 'EXPENSE' ? 'segmented__btn--active' : ''}`}
          onClick={() => { haptic('light'); setType('EXPENSE'); }}
        >
          − {t('common.expense')}
        </button>
        <button
          className={`segmented__btn ${type === 'INCOME' ? 'segmented__btn--active' : ''}`}
          onClick={() => { haptic('light'); setType('INCOME'); }}
        >
          + {t('common.income')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <input
          className="input input--amount"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(event) => setAmount(formatInput(event.target.value))}
          autoFocus={!isEdit}
        />
      </div>

      {presets.length > 0 && !isEdit && (
        <div className="field">
          <span className="field__label">{t('add.presets')}</span>
          <div className="presets">
            {presets.map((item) => (
              <button key={item} className="preset" onClick={() => { haptic('light'); setAmount(formatInput(item)); }}>
                {short(item)}
              </button>
            ))}
          </div>
        </div>
      )}

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
