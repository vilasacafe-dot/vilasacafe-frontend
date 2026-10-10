import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../lib/format.js';

/**
 * Floating cart summary bar for mobile. Only renders when the cart has items.
 * Sits above the bottom navigation and respects the safe-area inset.
 * `offset` controls how far above the viewport bottom it floats (to clear the
 * mobile tab bar on menu/home pages).
 */
export default function BottomCartBar({ offset = 'bottom-[4.5rem]' }) {
  const { count, subtotal } = useCart();
  if (count === 0) return null;

  return (
    <div
      className={`fixed inset-x-0 z-30 px-4 md:hidden ${offset} animate-slide-up-bar`}
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <Link
        to="/cart"
        className="flex items-center justify-between gap-3 rounded-2xl bg-espresso-700 px-4 py-3 text-ivory shadow-lift active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold">
              {count}
            </span>
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[11px] font-medium text-ivory/70">
              {count} item{count > 1 ? 's' : ''}
            </span>
            <span className="block text-sm font-bold tabular-nums">{formatINR(subtotal)}</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold">
          View cart
          <ArrowRight size={16} />
        </span>
      </Link>
    </div>
  );
}
