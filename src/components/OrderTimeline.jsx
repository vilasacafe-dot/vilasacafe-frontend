import { Check, Package, ChefHat, Bike, Home, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'PLACED', label: 'Order placed', hint: 'We received your order', Icon: Package },
  { key: 'ACCEPTED', label: 'Restaurant accepted', hint: 'The kitchen confirmed it', Icon: Check },
  { key: 'PREPARING', label: 'Preparing', hint: 'Your food is being made', Icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', hint: 'On the way to you', Icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', hint: 'Enjoy your meal', Icon: Home },
];

/**
 * Vertical, mobile-first order timeline. Only marks a step complete/current
 * based on the backend status. Cancelled orders show a distinct state.
 */
export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        <XCircle size={20} className="shrink-0" />
        <div>
          <p className="font-semibold">This order was cancelled.</p>
          <p className="text-red-600/80">If this is unexpected, please contact the restaurant.</p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const upcoming = i > currentIndex;
        const isLast = i === STEPS.length - 1;
        const { Icon } = step;

        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-[18px] top-9 h-[calc(100%-1.25rem)] w-0.5 ${
                  done ? 'bg-terracotta-400' : 'bg-sand'
                }`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                done
                  ? 'border-terracotta-500 bg-terracotta-500 text-white'
                  : active
                  ? 'border-terracotta-500 bg-white text-terracotta-600'
                  : 'border-sand bg-white text-espresso-200'
              }`}
            >
              {done ? <Check size={18} strokeWidth={3} /> : <Icon size={16} strokeWidth={2.2} />}
              {active && (
                <span className="absolute -inset-1 rounded-full ring-2 ring-terracotta-400/40" aria-hidden="true" />
              )}
            </span>
            <div className="pt-1">
              <p
                className={`text-[15px] font-semibold ${
                  upcoming ? 'text-espresso-300' : 'text-espresso-700'
                }`}
              >
                {step.label}
              </p>
              <p className={`text-xs ${active ? 'text-terracotta-600' : 'text-stone'}`}>
                {active ? 'In progress…' : step.hint}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
