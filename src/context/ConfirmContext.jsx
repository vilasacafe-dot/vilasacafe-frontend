import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirmation dialog. Replaces blocking window.confirm() with
 * an accessible, mobile-friendly dialog.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete product?', ... })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        danger: opts.danger ?? false,
      });
    });
  }, []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-espresso-900/50 backdrop-blur-[1px]"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={state.title}
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-soft
              [padding-bottom:calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-2xl sm:pb-5"
          >
            <div className="flex gap-3">
              {state.danger && (
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <TriangleAlert className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-bold text-espresso-700">{state.title}</h3>
                {state.message && <p className="mt-1 text-sm text-stone">{state.message}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="btn-secondary sm:min-w-[100px]" onClick={() => close(false)} autoFocus>
                {state.cancelLabel}
              </button>
              <button
                className={`${state.danger ? 'btn-danger' : 'btn-primary'} sm:min-w-[120px]`}
                onClick={() => close(true)}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
