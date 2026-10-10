import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRestaurantStatus } from '../../hooks/useRestaurantStatus.js';
import ProductImage from '../../components/ProductImage.jsx';
import QuantityStepper from '../../components/QuantityStepper.jsx';
import CafeEmpty from '../../components/CafeEmpty.jsx';
import ClosedNotice from '../../components/ClosedNotice.jsx';
import Button from '../../components/ui/Button.jsx';
import Price from '../../components/ui/Price.jsx';
import { formatINR } from '../../lib/format.js';

export default function Cart() {
  const { items, subtotal, count, addItem, decrement, removeItem, clearCart } = useCart();
  const { isAuthenticated, complete } = useAuth();
  const { isOpen, closedMessage, loading } = useRestaurantStatus();
  const navigate = useNavigate();

  function proceed() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (!complete) {
      navigate('/profile', { state: { redirectTo: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-serif text-3xl text-espresso-700">Your cart</h1>
        <CafeEmpty
          icon={<ShoppingBag size={26} />}
          title="Your cart is empty"
          message="Add a few dishes from the menu and they'll show up here."
          action={
            <Button to="/menu" size="lg" rightIcon={<ArrowRight size={18} />}>
              Browse the menu
            </Button>
          }
        />
      </div>
    );
  }

  const canOrder = !loading && isOpen;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-espresso-700">Your cart</h1>
          <p className="mt-1 text-sm text-stone">
            {count} item{count > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition-colors hover:text-red-600"
        >
          <Trash2 size={15} />
          Clear
        </button>
      </div>

      {!loading && !isOpen && (
        <div className="mb-4">
          <ClosedNotice message={closedMessage} />
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-sand bg-white p-3 shadow-cafe"
          >
            <ProductImage
              src={item.image_url}
              alt={item.name}
              bgClass="bg-cream"
              className="h-20 w-20 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold text-espresso-700">{item.name}</h3>
              <p className="mt-0.5 text-sm text-stone">{formatINR(item.price)} each</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <QuantityStepper
                  size="sm"
                  quantity={item.quantity}
                  onIncrement={() => addItem(item)}
                  onDecrement={() => decrement(item.id)}
                />
                <Price value={item.price * item.quantity} />
              </div>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="self-start rounded-full p-1.5 text-stone transition-colors hover:bg-cream hover:text-red-600"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-5 c-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone">Subtotal</span>
          <span className="font-bold text-espresso-700">{formatINR(subtotal, true)}</span>
        </div>
        <p className="mt-1.5 text-xs text-stone">
          Coupons and your final total are confirmed at checkout.
        </p>
        <Button
          onClick={proceed}
          disabled={!canOrder}
          size="lg"
          fullWidth
          className="mt-4"
          rightIcon={canOrder ? <ArrowRight size={18} /> : <Lock size={16} />}
        >
          {canOrder ? 'Proceed to checkout' : 'Ordering is closed'}
        </Button>
        <Button to="/menu" variant="ghost" fullWidth className="mt-2">
          Add more items
        </Button>
      </div>
    </div>
  );
}
