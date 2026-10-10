import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAdminOrdersRealtime } from '../../hooks/useAdminOrdersRealtime.js';
import { formatINR } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

function StatCard({ label, value, accent = '' }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-ink-900'}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.admin.dashboard().then((r) => setSummary(r.summary)).finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  // Refresh the summary on any order change (debounced by realtime cadence).
  const refresh = useCallback(() => load(), [load]);
  useAdminOrdersRealtime({ onInsert: refresh, onUpdate: refresh });

  if (loading || !summary) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-brand-600" />
      </div>
    );
  }

  const c = summary.counts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <Link to="/admin/orders" className="btn-primary">View orders</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's orders" value={summary.today_orders} />
        <StatCard label="Today's sales" value={formatINR(summary.today_sales)} accent="text-green-700" />
        <StatCard label="New / pending" value={summary.pending} accent="text-amber-700" />
        <StatCard label="Delivered today" value={c.DELIVERED} accent="text-brand-700" />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Live pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Pipeline label="New" value={c.PLACED} />
          <Pipeline label="Accepted" value={c.ACCEPTED} />
          <Pipeline label="Preparing" value={c.PREPARING} />
          <Pipeline label="Out for delivery" value={c.OUT_FOR_DELIVERY} />
          <Pipeline label="Delivered" value={c.DELIVERED} />
        </div>
      </div>
    </div>
  );
}

function Pipeline({ label, value }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-center">
      <p className="text-xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-ink-500">{label}</p>
    </div>
  );
}
