import { useApp } from '../lib/store.jsx';
import { categoryName, formatTime, groupByDay } from '../lib/format.js';
import { Empty } from './Ui.jsx';

export default function OperationList({ transactions, onSelect, emptyText, grouped = true }) {
  const { lang, money, t } = useApp();

  if (!transactions?.length) return <Empty emoji="📭" text={emptyText} />;

  const row = (tx) => (
    <button key={tx.id} className="op" onClick={() => onSelect?.(tx)}>
      <span className="op__icon">{tx.category?.emoji || '💸'}</span>
      <span className="op__body">
        <span className="op__title">{tx.note || categoryName(tx.category, lang)}</span>
        <span className="op__sub">
          {categoryName(tx.category, lang)} · {formatTime(tx.date)}
        </span>
      </span>
      <span className={`op__amount ${tx.type === 'INCOME' ? 'text-income' : ''}`}>
        {tx.type === 'INCOME' ? '+' : '−'}{money(tx.amount)}
      </span>
    </button>
  );

  if (!grouped) return <div className="op-list">{transactions.map(row)}</div>;

  const groups = groupByDay(transactions, lang, { today: t('common.today'), yesterday: t('common.yesterday') });

  return (
    <div>
      {groups.map((group) => (
        <div className="day-group" key={group.key}>
          <div className="day-group__head">
            <span className="day-group__date">{group.label}</span>
            <span className="day-group__sum mono">
              {group.expense > 0 && <span>−{money(group.expense)}</span>}
              {group.income > 0 && <span className="text-income">  +{money(group.income)}</span>}
            </span>
          </div>
          <div className="op-list">{group.items.map(row)}</div>
        </div>
      ))}
    </div>
  );
}
