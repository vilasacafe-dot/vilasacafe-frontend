export default function EmptyState({ title, message, action = null, icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
