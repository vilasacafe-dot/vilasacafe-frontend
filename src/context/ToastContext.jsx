import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);
let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', ttl = 3500) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (ttl) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  // Stable identity so consumers (e.g. realtime hooks) don't re-subscribe.
  const toast = useMemo(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error', 5000),
      info: (m) => push(m, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-soft ' +
              (t.type === 'success'
                ? 'bg-green-600 text-white'
                : t.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-ink-900 text-white')
            }
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
