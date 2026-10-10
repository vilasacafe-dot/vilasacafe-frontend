import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Check, Wallet, MapPin, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatINR } from '../../lib/format.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const fallbackNumber = location.state?.orderNumber;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getOrder(id)
      .then((res) => mounted && setOrder(res.order))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const orderNumber = order?.order_number || fallbackNumber;

  return (
    <div className="mx-auto max-w-lg py-4 text-center">
      {/* Checkmark */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sage-100">
        <span className="flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-sage-500 text-white">
          <Check size={30} strokeWidth={3} />
        </span>
      </div>

      <h1 className="mt-6 font-serif text-3xl text-espresso-700">Order confirmed</h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-stone">
        Thank you! The restaurant has received your order
        {orderNumber ? (
          <>
            {' '}
            <span className="font-semibold text-espresso-700">{orderNumber}</span>
          </>
        ) : null}
        . You'll see live updates as it's prepared.
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-terracotta-500" />
        </div>
      ) : order ? (
        <div className="mt-7 overflow-hidden text-left">
          {/* Payment + total */}
          <div className="flex items-center justify-between rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3.5">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-espresso-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-white">
                <Wallet size={17} />
              </span>
              Cash on Delivery
            </span>
            <span className="text-right">
              <span className="block text-[11px] font-medium text-stone">Pay on delivery</span>
              <span className="block text-lg font-bold tabular-nums text-terracotta-600">
                {formatINR(order.total, true)}
              </span>
            </span>
          </div>

          {/* Items */}
          <div className="mt-4 c-surface p-5">
            <h2 className="c-eyebrow">Your order</h2>
            <ul className="mt-3 divide-y divide-sand">
              {(order.order_items || []).map((it) => (
                <li key={it.id} className="flex justify-between gap-2 py-2.5 text-sm">
                  <span className="text-espresso-600">
                    {it.product_name} <span className="text-stone">× {it.quantity}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-espresso-700">
                    {formatINR(it.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            {order.college && (
              <p className="mt-4 flex items-center gap-2 border-t border-sand pt-4 text-sm text-stone">
                <MapPin size={15} className="text-terracotta-500" />
                Delivering to {order.college}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-7 space-y-2.5">
        <Button to={`/orders/${id}`} size="lg" fullWidth rightIcon={<ArrowRight size={18} />}>
          Track your order
        </Button>
        <Button to="/menu" variant="outline" size="lg" fullWidth>
          Continue browsing
        </Button>
      </div>
    </div>
  );
}
