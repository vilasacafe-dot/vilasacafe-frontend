import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import CafeEmpty from '../../components/CafeEmpty.jsx';
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatINR, formatDateTime } from '../../lib/format.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .myOrders()
      .then((res) => mounted && setOrders(res.orders || []))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7 text-terracotta-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-serif text-3xl text-espresso-700">Your orders</h1>
        <CafeEmpty
          icon={<AlertCircle size={26} />}
          title="Couldn't load your orders"
          message={error.message}
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-serif text-3xl text-espresso-700">Your orders</h1>
        <CafeEmpty
          icon={<ReceiptText size={26} />}
          title="No orders yet"
          message="When you place your first order it'll appear here with live tracking."
          action={
            <Button to="/menu" size="lg">
              Order now
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-3xl text-espresso-700">Your orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-sand bg-white p-4 shadow-cafe transition-shadow hover:shadow-lift"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-espresso-700">{o.order_number}</span>
                <OrderStatusBadge status={o.order_status} />
              </div>
              <p className="mt-1 truncate text-sm text-stone">
                {(o.order_items || []).map((it) => `${it.product_name} × ${it.quantity}`).join(', ')}
              </p>
              <p className="mt-0.5 text-xs text-stone/80">{formatDateTime(o.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="font-bold tabular-nums text-espresso-700">{formatINR(o.total)}</div>
                <div className="text-xs text-stone">COD</div>
              </div>
              <ChevronRight
                size={18}
                className="text-stone transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
