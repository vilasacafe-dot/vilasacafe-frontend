import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Wallet, MapPin, Phone, StickyNote } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useOrderRealtime } from '../../hooks/useOrderRealtime.js';
import OrderTimeline from '../../components/OrderTimeline.jsx';
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx';
import CafeEmpty from '../../components/CafeEmpty.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatINR, formatDateTime } from '../../lib/format.js';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .getOrder(id)
      .then((res) => mounted && setOrder(res.order))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  // Realtime: merge status/payment changes without a refetch.
  const onUpdate = useCallback((row) => {
    setOrder((prev) => (prev ? { ...prev, ...row } : prev));
  }, []);
  useOrderRealtime(id, onUpdate);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7 text-terracotta-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <CafeEmpty
        title="Order not found"
        message="We couldn't find this order. It may belong to another account."
        action={
          <Button to="/orders" size="lg">
            Back to your orders
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-stone transition-colors hover:text-espresso-700"
      >
        <ChevronLeft size={16} />
        All orders
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="c-eyebrow">Order</p>
          <h1 className="mt-0.5 font-serif text-3xl text-espresso-700">{order.order_number}</h1>
          <p className="mt-1 text-sm text-stone">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>

      <section className="c-surface mt-6 p-5">
        <h2 className="c-eyebrow mb-5">Tracking</h2>
        <OrderTimeline status={order.order_status} />
      </section>

      <section className="c-surface mt-4 p-5">
        <h2 className="c-eyebrow mb-3">Items</h2>
        <ul className="divide-y divide-sand">
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
        <div className="mt-3 space-y-2 border-t border-sand pt-3 text-sm">
          <div className="flex justify-between text-stone">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(order.subtotal, true)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sage-700">
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <span className="tabular-nums">− {formatINR(order.discount, true)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-sand pt-2.5 text-base">
            <span className="font-bold text-espresso-700">Total</span>
            <span className="font-bold tabular-nums text-terracotta-600">
              {formatINR(order.total, true)}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-sage-50 px-3 py-2.5 text-sm text-sage-800">
          <Wallet size={16} />
          <span className="font-semibold">Cash on Delivery</span>
        </div>
      </section>

      <section className="c-surface mt-4 p-5 text-sm">
        <h2 className="c-eyebrow mb-3">Delivery to</h2>
        <div className="space-y-2">
          <p className="font-semibold text-espresso-700">{order.customer_name}</p>
          <p className="flex items-center gap-2 text-stone">
            <Phone size={14} className="text-terracotta-500" />
            +91 {order.phone}
          </p>
          <p className="flex items-center gap-2 text-stone">
            <MapPin size={14} className="text-terracotta-500" />
            {order.college}
          </p>
          {order.notes && (
            <p className="flex items-start gap-2 text-stone">
              <StickyNote size={14} className="mt-0.5 text-terracotta-500" />
              {order.notes}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
