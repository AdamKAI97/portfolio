export default function Modal({ open, title, onClose, children, actions }) {
  if (!open) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box" onClick={(event) => event.stopPropagation()}>
        <h2 className="modal__title">{title}</h2>
        {children}
        <div className="modal__actions">{actions}</div>
      </div>
    </div>
  );
}
