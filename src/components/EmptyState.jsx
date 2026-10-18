export default function EmptyState({ title, message, action = null, icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 text-espresso-200">{icon}</div>}
      <h3 className="text-base font-bold text-espresso-700">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-stone">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
