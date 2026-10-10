import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { useAdminOrdersRealtime } from '../../hooks/useAdminOrdersRealtime.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR, formatTime, formatDateTime } from '../../lib/format.js';
import { playChime } from '../../lib/sound.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';

const TABS = [
  { key: 'PLACED',           label: 'New' },
  { key: 'ACCEPTED',         label: 'Accepted' },
  { key: 'PREPARING',        label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED',        label: 'Delivered' },
  { key: 'CANCELLED',        label: 'Cancelled' },
];

const NEXT_ACTIONS = {
  PLACED:           [{ status: 'ACCEPTED',         label: 'Accept',           primary: true  }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  ACCEPTED:         [{ status: 'PREPARING',         label: 'Start preparing',  primary: true  }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  PREPARING:        [{ status: 'OUT_FOR_DELIVERY',  label: 'Out for delivery', primary: true  }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  OUT_FOR_DELIVERY: [{ status: 'DELIVERED',         label: 'Mark delivered',   primary: true  }],
  DELIVERED:        [],
  CANCELLED:        [],
};

export default function AdminOrders() {
  const toast = useToast();
  const [orders,    setOrders]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [tab,       setTab]      = useState('PLACED');
  const [busyId,    setBusyId]   = useState(null);
  const [flashIds,  setFlashIds] = useState(() => new Set());

  useEffect(() => {
    let mounted = true;
    api.admin
      .listOrders()
      .then((r) => mounted && setOrders(r.orders || []))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const flash = useCallback((id) => {
    setFlashIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFlashIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 6000);
  }, []);

  const onInsert = useCallback(async (row) => {
    try {
      const { order } = await api.getOrder(row.id);
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
      flash(order.id);
      playChime();
      toast.info(`New order ${order.order_number}`);
    } catch { /* ignore */ }
  }, [flash, toast]);

  const onUpdate = useCallback((row) => {
    setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)));
  }, []);

  useAdminOrdersRealtime({ onInsert, onUpdate });

  async function changeStatus(id, status) {
    setBusyId(id);
    try {
      const { order } = await api.admin.changeStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...order } : o)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const m = {};
    for (const t of TABS) m[t.key] = 0;
    for (const o of orders) m[o.order_status] = (m[o.order_status] || 0) + 1;
    return m;
  }, [orders]);

  const visible = orders.filter((o) => o.order_status === tab);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
        <span className="flex items-center gap-2 text-xs font-medium text-green-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Live
        </span>
      </div>

      {/* Status tabs — horizontally scrollable on mobile */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-brand-600 text-white'
                  : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    tab === t.key ? 'bg-white/25' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7 text-brand-600" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing here" message="No orders in this stage right now." />
      ) : (
        /* Single-column on mobile, 2-col on md+ */
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              busy={busyId === o.id}
              flash={flashIds.has(o.id)}
              onAction={changeStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, busy, flash, onAction }) {
  const actions = NEXT_ACTIONS[order.order_status] || [];
  const hasDiscount = Number(order.discount) > 0;

  return (
    <div
      className={`card overflow-hidden transition-shadow ${
        flash ? 'ring-2 ring-brand-400 shadow-soft' : ''
      }`}
    >
      {/* ── Top bar: order number + time + total ── */}
      <div className="flex items-start justify-between gap-2 border-b border-ink-100 p-4">
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink-900">{order.order_number}</p>
          <p className="text-xs text-ink-400">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-ink-900">{formatINR(order.total)}</p>
          <p className="text-xs font-medium text-ink-400">
            {order.payment_status === 'PAID' ? '✓ Paid' : 'COD · Pending'}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* ── Customer info ── */}
        <div className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
          <p className="font-semibold text-ink-800">{order.customer_name}</p>
          <p className="mt-0.5 text-ink-500">
            +91 {order.phone}
          </p>
          <p className="text-ink-500">{order.college}</p>
        </div>

        {/* ── Order items ── */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Items</p>
          <ul className="space-y-1">
            {(order.order_items || []).map((it) => (
              <li key={it.id} className="flex justify-between text-sm">
                <span className="text-ink-700">
                  {it.product_name}
                  <span className="text-ink-400"> × {it.quantity}</span>
                </span>
                <span className="tabular-nums text-ink-500">{formatINR(it.subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Pricing breakdown ── */}
        <div className="rounded-lg border border-ink-100 px-3 py-2.5 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(order.subtotal, true)}</span>
          </div>
          {hasDiscount && (
            <div className="mt-1 flex justify-between text-green-700">
              <span>
                Discount
                {order.coupon_code && (
                  <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold">
                    {order.coupon_code}
                  </span>
                )}
              </span>
              <span className="tabular-nums">− {formatINR(order.discount, true)}</span>
            </div>
          )}
          <div className="mt-1.5 flex justify-between border-t border-ink-100 pt-1.5 font-bold text-ink-900">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(order.total, true)}</span>
          </div>
        </div>

        {/* ── Special notes ── */}
        {order.notes && (
          <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <span className="font-semibold">Note: </span>
            {order.notes}
          </div>
        )}

        {/* ── Action buttons ── */}
        {actions.length > 0 && (
          <div className="flex gap-2 pt-1">
            {actions.map((a) => (
              <button
                key={a.status}
                disabled={busy}
                onClick={() => onAction(order.id, a.status)}
                className={`${
                  a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-secondary'
                } flex-1 text-sm`}
              >
                {busy ? <Spinner className="h-4 w-4" /> : a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
