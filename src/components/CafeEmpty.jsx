/**
 * Customer-facing empty / zero state. Warm, calm, with an optional icon
 * and action. Kept separate from the admin EmptyState so each surface can
 * evolve independently.
 */
export default function CafeEmpty({ icon = null, title, message, action = null, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand bg-white/60 px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-espresso-400">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl text-espresso-700">{title}</h3>
      {message && <p className="mt-1.5 max-w-xs text-sm text-stone">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
