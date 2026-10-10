import { Minus, Plus } from 'lucide-react';

/**
 * Compact quantity control for the customer UI. Terracotta accent, rounded.
 * `size` sm is used on product cards, md on the cart.
 */
export default function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  disabled = false,
  size = 'md',
}) {
  const dims = size === 'sm' ? 'h-8' : 'h-10';
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 14 : 16;
  const num = size === 'sm' ? 'w-7 text-sm' : 'w-9 text-[15px]';

  return (
    <div
      className={`inline-flex items-center rounded-full bg-terracotta-500 text-white shadow-sm ${dims}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        className={`flex ${btn} items-center justify-center rounded-full transition-colors hover:bg-terracotta-600 active:scale-90 disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        <Minus size={icon} strokeWidth={2.5} />
      </button>
      <span
        className={`text-center font-bold tabular-nums ${num}`}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        className={`flex ${btn} items-center justify-center rounded-full transition-colors hover:bg-terracotta-600 active:scale-90 disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        <Plus size={icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
