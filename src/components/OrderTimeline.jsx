import { Check, Package, ChefHat, Bike, Home, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'PLACED',           label: 'Order placed',           hint: 'We received your order',    Icon: Package },
  { key: 'ACCEPTED',         label: 'Restaurant accepted',     hint: 'The kitchen confirmed it',  Icon: Check   },
  { key: 'PREPARING',        label: 'Preparing your food',     hint: 'Your food is being made',   Icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery',        hint: 'On the way to you',         Icon: Bike    },
  { key: 'DELIVERED',        label: 'Delivered',               hint: 'Enjoy your meal! 🎉',       Icon: Home    },
];

export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        <XCircle size={22} className="shrink-0 text-red-500" />
        <div>
          <p className="font-semibold">This order was cancelled.</p>
          <p className="mt-0.5 text-red-600/80">
            If this is unexpected, please contact the restaurant.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const done    = i < currentIndex;
        const active  = i === currentIndex;
        const upcoming = i > currentIndex;
        const isLast  = i === STEPS.length - 1;
        const { Icon } = step;

        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <span
                className={`absolute left-[18px] top-9 h-[calc(100%-1.25rem)] w-0.5 ${
                  done ? 'bg-green-400' : 'bg-sand'
                }`}
                aria-hidden="true"
              />
            )}

            {/* Step icon */}
            <span
              className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                done
                  ? 'border-green-500 bg-green-500 text-white'
                  : active
                  ? 'border-amber-400 bg-amber-50 text-amber-600'
                  : 'border-sand bg-white text-stone/30'
              }`}
            >
              {done ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <Icon size={16} strokeWidth={2.2} />
              )}

              {/* Pulse ring for the active step */}
              {active && (
                <span
                  className="absolute -inset-1.5 animate-ping rounded-full bg-amber-400/30"
                  aria-hidden="true"
                />
              )}
            </span>

            {/* Label + hint */}
            <div className="pt-1">
              <p
                className={`text-[15px] font-semibold ${
                  done
                    ? 'text-green-700'
                    : active
                    ? 'text-amber-700'
                    : 'text-espresso-300'
                }`}
              >
                {step.label}
              </p>
              <p
                className={`text-xs ${
                  active ? 'font-semibold text-amber-600' : 'text-stone'
                }`}
              >
                {active ? '⏳ In progress…' : done ? step.hint : step.hint}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
