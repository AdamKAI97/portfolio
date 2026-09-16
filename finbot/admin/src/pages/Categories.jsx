import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

const EMPTY = {
  nameRu: '',
  nameUz: '',
  emoji: '🏷',
  color: '#2a78d6',
  type: 'EXPENSE',
  keywords: '',
  sort: 50
};

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.categories().then((r) => setRows(r.categories)).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };

  const openEdit = (category) => {
    setForm({
      nameRu: category.nameRu,
      nameUz: category.nameUz,
      emoji: category.emoji,
      color: category.color,
      type: category.type,
      keywords: category.keywords || '',
      sort: category.sort
    });
    setEditing(category.id);
  };

  const save = async () => {
    if (!form.nameRu || !form.nameUz) return;
    if (editing === 'new') await api.createCategory(form);
    else await api.updateCategory(editing, form);
    setEditing(null);
    load();
  };

  const remove = async (category) => {
    if (!window.confirm(`Удалить категорию «${category.nameRu}»? Операции в ней останутся без категории.`)) return;
    await api.deleteCategory(category.id);
    load();
  };

  const expense = rows.filter((row) => row.type === 'EXPENSE');
  const income = rows.filter((row) => row.type === 'INCOME');

  const renderTable = (list, title) => (
    <div className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{title}</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 50 }}>Иконка</th>
            <th>Название (RU)</th>
            <th>Название (UZ)</th>
            <th>Ключевые слова для автокатегории</th>
            <th style={{ width: 70 }}>Цвет</th>
            <th style={{ width: 160 }} />
          </tr>
        </thead>
        <tbody>
          {list.map((category) => (
            <tr key={category.id}>
              <td style={{ fontSize: 20 }}>{category.emoji}</td>
              <td style={{ fontWeight: 560 }}>{category.nameRu}</td>
              <td>{category.nameUz}</td>
              <td className="muted" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {category.keywords || '—'}
              </td>
              <td><span className="dot" style={{ background: category.color, width: 16, height: 16, borderRadius: 5 }} /></td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn--sm" onClick={() => openEdit(category)}>Изменить</button>{' '}
                <button className="btn btn--sm btn--danger" onClick={() => remove(category)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="panel__head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Категории</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Названия, иконки и ключевые слова для автоматического определения категории</p>
        </div>
        <button className="btn btn--primary" onClick={openNew}>+ Добавить</button>
      </div>

      {renderTable(expense, 'Расходы')}
      {renderTable(income, 'Доходы')}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Новая категория' : 'Редактирование категории'}
        onClose={() => setEditing(null)}
        actions={
          <>
            <button className="btn" onClick={() => setEditing(null)}>Отмена</button>
            <button className="btn btn--primary" onClick={save}>Сохранить</button>
          </>
        }
      >
        <div className="field">
          <label className="field__label">Название (русский)</label>
          <input className="input" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
        </div>
        <div className="field">
          <label className="field__label">Название (узбекский)</label>
          <input className="input" value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
        </div>
        <div className="field">
          <label className="field__label">Иконка (эмодзи)</label>
          <input className="input" value={form.emoji} maxLength={4} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        </div>
        <div className="field">
          <label className="field__label">Тип</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label">Ключевые слова (через запятую)</label>
          <input className="input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="такси,метро,taxi" />
        </div>
        <div className="field">
          <label className="field__label">Цвет</label>
          <input className="input" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 42, padding: 4 }} />
        </div>
        <div className="field">
          <label className="field__label">Порядок сортировки</label>
          <input className="input" type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
        </div>
      </Modal>
    </>
  );
}
