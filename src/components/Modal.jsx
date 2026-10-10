import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer = null, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          'relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-soft sm:rounded-2xl ' +
          (wide ? 'sm:max-w-2xl' : 'sm:max-w-md')
        }
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-ink-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
