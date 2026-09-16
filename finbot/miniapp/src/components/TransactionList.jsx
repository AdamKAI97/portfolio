import { useApp } from '../lib/store.jsx';
import { categoryName, formatDate, formatTime } from '../lib/format.js';
import { Empty } from './Ui.jsx';

export default function TransactionList({ transactions, onSelect, emptyText }) {
  const { lang, money } = useApp();

  if (!transactions?.length) return <Empty emoji="📭" text={emptyText} />;

  return (
    <div className="list">
      {transactions.map((tx) => (
        <button key={tx.id} className="item" onClick={() => onSelect?.(tx)} style={{ textAlign: 'left', width: '100%' }}>
          <span className="item__icon">{tx.category?.emoji || '💸'}</span>
          <span className="item__body">
            <span className="item__title">{tx.note || categoryName(tx.category, lang)}</span>
            <span className="item__sub">
              {categoryName(tx.category, lang)} · {formatDate(tx.date, lang)}, {formatTime(tx.date)}
            </span>
          </span>
          <span className={`item__amount ${tx.type === 'INCOME' ? 'item__amount--income' : ''}`}>
            {tx.type === 'INCOME' ? '+' : '−'}{money(tx.amount)}
          </span>
        </button>
      ))}
    </div>
  );
}
