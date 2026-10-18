import { useEffect, useState, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Power,
  Bell,
  Receipt,
  UtensilsCrossed,
  Ticket,
  Images,
  Printer,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAdminOrdersRealtime } from '../../hooks/useAdminOrdersRealtime.js';
import { formatINR } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

const TODAY = new Date().toLocaleDateString('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function Dashboard() {
  const { isOpen, toggling, toggleOpen } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.admin.dashboard().then((r) => setSummary(r.summary)).finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const refresh = useCallback(() => load(), [load]);
  useAdminOrdersRealtime({ onInsert: refresh, onUpdate: refresh });

  if (loading || !summary) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-terracotta-500" />
      </div>
    );
  }

  const c = summary.counts;
  const pending = summary.pending || 0;

  return (
    <div className="space-y-5">
      {/* Greeting + date */}
      <div>
        <h1 className="text-xl font-bold text-espresso-700">Today at Vilasa</h1>
        <p className="text-sm text-stone">{TODAY}</p>
      </div>

      {/* Prominent open/close control */}
      <OpenCloseCard isOpen={isOpen} toggling={toggling} onToggle={toggleOpen} />

      {/* Pending orders call-to-action */}
      {pending > 0 && (
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pending > 9 ? '9+' : pending}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-amber-900">
              {pending} new order{pending === 1 ? '' : 's'} waiting
            </span>
            <span className="block text-xs text-amber-700">Tap to review and accept</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
        </Link>
      )}

      {/* Operational summary */}
      <section>
        <h2 className="admin-section-title mb-2">Live pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="New" value={c.PLACED} to="/admin/orders" accent="amber" />
          <StatCard label="Preparing" value={c.PREPARING} to="/admin/orders" />
          <StatCard label="Out for delivery" value={c.OUT_FOR_DELIVERY} to="/admin/orders" />
          <StatCard label="Delivered" value={c.DELIVERED} to="/admin/orders" accent="sage" />
        </div>
      </section>

      {/* Today totals */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone">Today's orders</p>
          <p className="mt-1 text-2xl font-bold text-espresso-700">{summary.today_orders}</p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-stone">
            <IndianRupee className="h-3 w-3" /> Today's sales
          </p>
          <p className="mt-1 text-2xl font-bold text-sage-700">{formatINR(summary.today_sales)}</p>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="admin-section-title mb-2">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction to="/admin/orders" icon={Receipt} label="Orders" />
          <QuickAction to="/admin/menu" icon={UtensilsCrossed} label="Menu" />
          <QuickAction to="/admin/coupons" icon={Ticket} label="Coupons" />
          <QuickAction to="/admin/banners" icon={Images} label="Banners" />
          <QuickAction to="/admin/phone-orders" icon={Printer} label="Phone order" />
        </div>
      </section>
    </div>
  );
}

function OpenCloseCard({ isOpen, toggling, onToggle }) {
  const ready = isOpen !== null && isOpen !== undefined;
  return (
    <div
      className={`card flex items-center justify-between gap-4 p-4 ${
        ready && isOpen ? 'ring-1 ring-sage-200' : ready ? 'ring-1 ring-red-200' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            ready && isOpen ? 'bg-sage-500' : 'bg-red-500'
          } text-white`}
        >
          <Power className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone">Restaurant status</p>
          <p className={`text-lg font-bold ${ready && isOpen ? 'text-sage-700' : 'text-red-700'}`}>
            {!ready ? '…' : isOpen ? 'Open for orders' : 'Closed'}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!isOpen}
        aria-label={isOpen ? 'Close the restaurant' : 'Open the restaurant'}
        aria-busy={toggling}
        disabled={toggling || !ready}
        onClick={onToggle}
        className={`switch shrink-0 ${isOpen ? 'switch-on' : 'switch-off'}`}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

function StatCard({ label, value, to, accent }) {
  const color =
    accent === 'amber' ? 'text-amber-700' : accent === 'sage' ? 'text-sage-700' : 'text-espresso-700';
  return (
    <Link to={to} className="card p-4 transition-colors hover:bg-cream/60">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-stone">{label}</p>
    </Link>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-sand bg-white p-4 text-center transition-colors hover:bg-cream"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-terracotta-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-semibold text-espresso-600">{label}</span>
    </Link>
  );
}
