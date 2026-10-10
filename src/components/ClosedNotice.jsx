import { Clock } from 'lucide-react';

/**
 * Calm, non-alarming "restaurant closed" notice for the customer UI.
 * Customers can still browse the menu; only ordering is paused.
 */
export default function ClosedNotice({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3.5 text-sm text-sage-900">
      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage-500 text-white">
        <Clock size={15} />
      </span>
      <span className="leading-relaxed">
        <strong className="font-semibold text-sage-900">The kitchen is closed right now.</strong>{' '}
        {message || 'You can browse the full menu — ordering reopens soon.'}
      </span>
    </div>
  );
}
