import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Phone, GraduationCap, Printer, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAdminOrdersRealtime } from '../../hooks/useAdminOrdersRealtime.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { formatINR, formatDateTime } from '../../lib/format.js';
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
  PLACED:           [{ status: 'ACCEPTED',        label: 'Accept',           primary: true }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  ACCEPTED:         [{ status: 'PREPARING',        label: 'Start preparing',  primary: true }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  PREPARING:        [{ status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', primary: true }, { status: 'CANCELLED', label: 'Cancel', danger: true }],
  OUT_FOR_DELIVERY: [{ status: 'DELIVERED',        label: 'Mark delivered',   primary: true }],
  DELIVERED:        [],
  CANCELLED:        [],
};

export default function AdminOrders() {
  const toast   = useToast();
  const confirm = useConfirm();

  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('PLACED');
  const [busyId,        setBusyId]        = useState(null);
  const [flashIds,      setFlashIds]      = useState(() => new Set());
  const [printingOrder, setPrintingOrder] = useState(null);
  const [search,        setSearch]        = useState('');
  const [sortDir,       setSortDir]       = useState('desc'); // 'desc' = newest first
  const afterPrintRef = useRef(null);

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
    if (status === 'CANCELLED') {
      const ok = await confirm({
        title: 'Cancel this order?',
        message: 'This marks the order as cancelled. It cannot be undone.',
        confirmLabel: 'Cancel order',
        cancelLabel:  'Keep order',
        danger: true,
      });
      if (!ok) return;
    }
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

  function handlePrint(order) {
    setPrintingOrder(order);
    if (afterPrintRef.current) window.removeEventListener('afterprint', afterPrintRef.current);
    afterPrintRef.current = () => {
      setPrintingOrder(null);
      window.removeEventListener('afterprint', afterPrintRef.current);
    };
    window.addEventListener('afterprint', afterPrintRef.current);
    setTimeout(() => window.print(), 80);
  }

  const counts = useMemo(() => {
    const m = {};
    for (const t of TABS) m[t.key] = 0;
    for (const o of orders) m[o.order_status] = (m[o.order_status] || 0) + 1;
    return m;
  }, [orders]);

  // Apply tab filter, then search, then sort
  const visible = useMemo(() => {
    let list = orders.filter((o) => o.order_status === tab);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.college?.toLowerCase().includes(q)
      );
    }

    // Sort by created_at
    list = [...list].sort((a, b) => {
      const diff = new Date(b.created_at) - new Date(a.created_at);
      return sortDir === 'desc' ? diff : -diff;
    });

    return list;
  }, [orders, tab, search, sortDir]);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-espresso-700">Orders</h1>
          <span className="flex items-center gap-2 text-xs font-semibold text-sage-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sage-500" />
            Live
          </span>
        </div>

        {/* Search + Sort bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search order #, name, phone, campus…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="btn-secondary flex h-[44px] w-[44px] shrink-0 items-center justify-center !p-0"
            title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
            aria-label={sortDir === 'desc' ? 'Sort: newest first' : 'Sort: oldest first'}
          >
            {sortDir === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Status tabs */}
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-[40px] whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'bg-espresso-700 text-white'
                    : 'border border-sand bg-white text-espresso-600 hover:bg-cream'
                }`}
              >
                {t.label}
                {counts[t.key] > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      tab === t.key ? 'bg-white/25' : 'bg-cream text-stone'
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
            <Spinner className="h-7 w-7 text-terracotta-500" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={search ? 'No matches' : 'Nothing here'}
            message={search ? 'Try a different search term.' : 'No orders in this stage right now.'}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                busy={busyId === o.id}
                flash={flashIds.has(o.id)}
                onAction={changeStatus}
                onPrint={handlePrint}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden receipt — rendered only during window.print() */}
      {printingOrder && <WebOrderReceipt order={printingOrder} />}
    </>
  );
}

function OrderCard({ order, busy, flash, onAction, onPrint }) {
  const actions    = NEXT_ACTIONS[order.order_status] || [];
  const hasDiscount = Number(order.discount) > 0;
  const isPhone    = order.source === 'PHONE';

  return (
    <div
      className={`card overflow-hidden transition-shadow ${
        flash ? 'ring-2 ring-terracotta-400 shadow-soft' : ''
      }`}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-2 border-b border-sand p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-espresso-700">{order.order_number}</p>
            {isPhone && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Phone
              </span>
            )}
          </div>
          <p className="text-xs text-stone">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-espresso-700">{formatINR(order.total)}</p>
          <p className="text-xs font-semibold text-stone">
            {order.payment_status === 'PAID' ? '✓ Paid' : 'COD · Pending'}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Customer */}
        <div className="rounded-xl bg-cream/60 px-3 py-2.5 text-sm">
          <p className="font-semibold text-espresso-700 break-words">{order.customer_name}</p>
          {order.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-stone">
              <Phone className="h-3.5 w-3.5 shrink-0" /> +91 {order.phone}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-stone break-words">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            {order.college === 'RESTAURANT PICKUP' || order.college === 'TAKEAWAY'
              ? 'Pickup at restaurant'
              : order.college}
          </p>
        </div>

        {/* Items */}
        <div>
          <p className="admin-section-title mb-1">Items</p>
          <ul className="space-y-1">
            {(order.order_items || []).map((it) => (
              <li key={it.id} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 text-espresso-700">
                  {it.product_name}<span className="text-stone"> × {it.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums text-stone">{formatINR(it.subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-sand px-3 py-2.5 text-sm">
          <div className="flex justify-between text-stone">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(order.subtotal, true)}</span>
          </div>
          {hasDiscount && (
            <div className="mt-1 flex justify-between text-sage-700">
              <span>
                Discount
                {order.coupon_code && (
                  <span className="ml-1 rounded bg-sage-100 px-1.5 py-0.5 text-xs font-bold">
                    {order.coupon_code}
                  </span>
                )}
              </span>
              <span className="tabular-nums">− {formatINR(order.discount, true)}</span>
            </div>
          )}
          <div className="mt-1.5 flex justify-between border-t border-sand pt-1.5 font-bold text-espresso-700">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(order.total, true)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 break-words">
            <span className="font-semibold">Note: </span>{order.notes}
          </div>
        )}

        {/* Actions + Print */}
        <div className="flex gap-2 pt-1">
          {actions.map((a) => (
            <button
              key={a.status}
              disabled={busy}
              onClick={() => onAction(order.id, a.status)}
              className={`${
                a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-secondary'
              } flex-1`}
            >
              {busy ? <Spinner className="h-4 w-4" /> : a.label}
            </button>
          ))}
          <button
            onClick={() => onPrint(order)}
            className="btn-secondary flex h-[44px] w-[44px] shrink-0 items-center justify-center !p-0"
            title="Print receipt"
            aria-label="Print receipt"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Print receipt ───────────────────────────────────────────────────────── */
function WebOrderReceipt({ order }) {
  const hasDiscount = Number(order.discount) > 0;
  const isPickup    = order.college === 'RESTAURANT PICKUP' || order.college === 'TAKEAWAY';

  return (
    <div className="print-receipt bg-white text-black">
      <div className="mx-auto max-w-[300px] p-2 font-mono text-[12px] leading-tight text-black">
        <div className="text-center">
          <p className="text-[18px] font-bold tracking-wide">VILASA CAFE</p>
          <p className="text-[11px]">{order.source === 'PHONE' ? 'Counter / Phone Order' : 'Website Order'}</p>
          <p className="text-[11px]">{formatDateTime(order.created_at)}</p>
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center text-[15px] font-bold">#{order.order_number}</p>
        <div className="my-2 border-t border-dashed border-black" />

        <p className="font-bold">{order.customer_name}</p>
        {order.phone && <p>Phone: +91 {order.phone}</p>}
        <p>{isPickup ? 'Pickup at restaurant' : `Campus: ${order.college}`}</p>

        <div className="my-2 border-t border-dashed border-black" />

        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {(order.order_items || []).map((it) => (
              <tr key={it.id} className="align-top">
                <td className="py-0.5 pr-1">{it.product_name}</td>
                <td className="py-0.5 text-center">{it.quantity}</td>
                <td className="py-0.5 text-right tabular-nums">{formatINR(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-black" />

        {hasDiscount && (
          <>
            <div className="flex justify-between text-[12px]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatINR(order.subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
              <span className="tabular-nums">− {formatINR(order.discount, true)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatINR(order.total, true)}</span>
        </div>
        <p className="mt-1 text-[11px]">Payment: Cash on Delivery</p>

        {order.notes && (
          <>
            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-[11px]">Note: {order.notes}</p>
          </>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center text-[11px]">Thank you!</p>
      </div>
    </div>
  );
}
