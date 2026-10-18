import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Responsive dialog.
 *
 * - Mobile: a bottom sheet that can grow to (nearly) full height. With
 *   `fullScreen` it fills the viewport — ideal for forms so the on-screen
 *   keyboard never hides the Save/Cancel actions (the footer stays inside the
 *   scroll container and the sheet is sized with dvh units).
 * - Desktop (sm+): a centred dialog, constrained width.
 *
 * The header and footer are sticky; only the body scrolls.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer = null,
  wide = false,
  fullScreen = false,
}) {
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

  const heightClass = fullScreen
    ? 'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92dvh]'
    : 'max-h-[92dvh]';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-espresso-900/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          'relative z-10 flex w-full flex-col bg-white shadow-soft ' +
          'rounded-t-2xl sm:rounded-2xl ' +
          heightClass + ' ' +
          (fullScreen ? 'sm:w-auto ' : '') +
          (wide ? 'sm:max-w-2xl' : 'sm:max-w-md')
        }
      >
        <div className="flex items-center justify-between gap-3 border-b border-sand px-4 py-3.5 sm:px-5">
          <h3 className="truncate text-base font-bold text-espresso-700">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone hover:bg-cream"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <div className="border-t border-sand bg-white px-4 py-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
