import { useEffect } from 'react';
import { tg } from '../lib/telegram.js';

export default function Sheet({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Аппаратная кнопка «назад» в Telegram закрывает окно
    try {
      tg?.BackButton?.show();
      tg?.BackButton?.onClick(onClose);
    } catch (_) { /* старый клиент */ }

    return () => {
      document.body.style.overflow = previous;
      try {
        tg?.BackButton?.offClick(onClose);
        tg?.BackButton?.hide();
      } catch (_) { /* старый клиент */ }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__handle" />
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
        {footer && <div className="sheet__sticky">{footer}</div>}
      </div>
    </div>
  );
}
