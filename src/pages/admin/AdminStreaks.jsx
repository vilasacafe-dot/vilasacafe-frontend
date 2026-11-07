import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, Trash2, MoreHorizontal, Flame, CalendarClock, Timer } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { formatINR } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import Switch from '../../components/Switch.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}
function localInputToIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}
function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DURATION_PRESETS = [7, 10, 15, 30];

export default function AdminStreaks() {
  const toast = useToast();
  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const load = useCallback(async () => {
    try {
      const r = await api.admin.listCampaigns();
      setCampaigns(r.campaigns || []);
    } catch (e) {
      toast.error(e.message || 'Could not load streak campaigns.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = campaigns.filter(
    (c) => c.is_active && !(c.ends_at && new Date(c.ends_at) < new Date())
  ).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  async function toggle(c, next) {
    const ended = c.ends_at && new Date(c.ends_at) < new Date();
    if (next && ended) {
      toast.error('This campaign has ended. Update its end date before activating.');
      return;
    }
    if (pendingIds.has(c.id)) return;
    setPendingIds((s) => new Set(s).add(c.id));
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)));
    try {
      const res = await api.admin.updateCampaign(c.id, { is_active: next });
      const confirmed = res?.campaign?.is_active ?? next;
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: confirmed } : x)));
      toast.success(confirmed ? `${c.name} activated` : `${c.name} paused`);
    } catch (e) {
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !next } : x)));
      toast.error(e.message);
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(c.id);
        return n;
      });
    }
  }

  async function remove(c) {
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      message: 'Customers will stop earning this streak. Coupons already unlocked stay valid until they expire.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.admin.deleteCampaign(c.id);
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Campaign deleted.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-terracotta-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-espresso-700">Streak Rewards</h1>
          <p className="text-sm text-stone">
            {activeCount} active · {campaigns.length} total
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      {campaigns.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          title="No streak campaigns yet"
          message="Reward loyal customers: unlock a coupon when they order on a set number of different days within a time window."
          icon={<Flame className="h-8 w-8" />}
          action={
            <button className="btn-primary" onClick={() => setModal({})}>
              <Plus className="h-4 w-4" /> New campaign
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" message="Try a different search." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              pending={pendingIds.has(c.id)}
              onToggle={(next) => toggle(c, next)}
              onEdit={() => setModal(c)}
              onDelete={() => remove(c)}
            />
          ))}
        </ul>
      )}

      {modal && (
        <CampaignModal
          campaign={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CampaignCard({ campaign: c, pending, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ended = c.ends_at && new Date(c.ends_at) < new Date();
  const reward =
    c.discount_type === 'percentage'
      ? `${c.discount_value}% OFF${c.max_discount ? ` (up to ${formatINR(c.max_discount)})` : ''}`
      : `${formatINR(c.discount_value)} OFF`;

  return (
    <li className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-espresso-700 break-words">{c.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-terracotta-600">{reward}</p>
        </div>
        <span className={`badge ${ended ? 'badge-danger' : c.is_active ? 'badge-success' : 'badge-muted'}`}>
          {ended ? 'Ended' : c.is_active ? 'Active' : 'Paused'}
        </span>
      </div>

      {c.description && <p className="mt-1 text-sm text-stone break-words">{c.description}</p>}

      <div className="mt-2 space-y-1 text-xs text-stone">
        <p className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 shrink-0" /> Order on {c.required_streak_days} different days within {c.duration_days} days
        </p>
        <p className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 shrink-0" /> Coupon valid {c.coupon_validity_days} days after unlock
        </p>
        {c.min_order_value > 0 && <p>Min order {formatINR(c.min_order_value)}</p>}
        {c.ends_at && (
          <p className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" /> Runs until {fmtDate(c.ends_at)}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand pt-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={!!c.is_active && !ended}
            busy={pending}
            disabled={ended}
            onChange={onToggle}
            label={c.is_active ? `Pause campaign ${c.name}` : `Activate campaign ${c.name}`}
          />
          <span className={`text-xs font-bold ${c.is_active && !ended ? 'text-sage-700' : 'text-stone'}`}>
            {ended ? 'Ended' : c.is_active ? 'Active' : 'Paused'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={onEdit}>
            Edit
          </button>
          <div className="relative">
            <button className="btn-secondary btn-sm" aria-label="More actions" onClick={() => setMenuOpen((o) => !o)}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-sand bg-white shadow-soft">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ─────────────────────────── Campaign form ─────────────────────────── */

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="admin-section-title">{title}</h3>
      {children}
    </section>
  );
}

function CampaignModal({ campaign, onClose, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const isEdit = Boolean(campaign.id);
  const presetDuration = DURATION_PRESETS.includes(campaign.duration_days);
  const [form, setForm] = useState({
    name: campaign.name || '',
    description: campaign.description || '',
    duration_days: campaign.duration_days ?? 7,
    customDuration: !presetDuration && campaign.duration_days ? String(campaign.duration_days) : '',
    durationMode: isEdit && !presetDuration ? 'custom' : 'preset',
    required_streak_days: campaign.required_streak_days ?? 5,
    discount_type: campaign.discount_type || 'percentage',
    discount_value: campaign.discount_value ?? '',
    max_discount: campaign.max_discount ?? '',
    min_order_value: campaign.min_order_value ?? 0,
    coupon_validity_days: campaign.coupon_validity_days ?? 7,
    starts_at: isoToLocalInput(campaign.starts_at),
    ends_at: isoToLocalInput(campaign.ends_at),
    is_active: campaign.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  function set(k, v) {
    dirty.current = true;
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resolvedDuration() {
    if (form.durationMode === 'custom') return Number(form.customDuration);
    return Number(form.duration_days);
  }

  async function attemptClose() {
    if (saving) return;
    if (dirty.current) {
      const ok = await confirm({
        title: 'Discard changes?',
        message: 'Your changes to this campaign will be lost.',
        confirmLabel: 'Discard',
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }

  async function save() {
    if (!form.name.trim() || form.name.trim().length < 2) return toast.error('Enter a campaign name.');
    const duration = resolvedDuration();
    if (!Number.isInteger(duration) || duration <= 0) return toast.error('Enter a valid campaign duration in days.');
    const requiredDays = Number(form.required_streak_days);
    if (!Number.isInteger(requiredDays) || requiredDays <= 0) return toast.error('Enter the required streak days.');
    if (requiredDays > duration) return toast.error('Required streak days cannot exceed the campaign duration.');
    const value = Number(form.discount_value);
    if (Number.isNaN(value) || value <= 0) return toast.error('Enter a valid discount value.');
    if (form.discount_type === 'percentage' && value > 100) return toast.error('Percentage cannot exceed 100.');
    const validity = Number(form.coupon_validity_days);
    if (!Number.isInteger(validity) || validity <= 0) return toast.error('Enter the coupon validity in days.');
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      return toast.error('End must be after the start.');
    }
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        duration_days: duration,
        required_streak_days: requiredDays,
        discount_type: form.discount_type,
        discount_value: value,
        max_discount: form.discount_type === 'percentage' && form.max_discount ? Number(form.max_discount) : null,
        min_order_value: Number(form.min_order_value) || 0,
        coupon_validity_days: validity,
        starts_at: form.starts_at ? localInputToIso(form.starts_at) : undefined,
        ends_at: form.ends_at ? localInputToIso(form.ends_at) : null,
        is_active: form.is_active,
      };
      if (isEdit) await api.admin.updateCampaign(campaign.id, payload);
      else await api.admin.createCampaign(payload);
      dirty.current = false;
      toast.success('Campaign saved.');
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      wide
      fullScreen
      onClose={attemptClose}
      title={isEdit ? 'Edit streak campaign' : 'New streak campaign'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={attemptClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : 'Save campaign'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-lg space-y-6">
        {/* 1. Campaign */}
        <Section title="Campaign">
          <div>
            <label className="label" htmlFor="rc-name">Campaign name</label>
            <input
              id="rc-name"
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="7-Day Fire Streak"
            />
          </div>
          <div>
            <label className="label" htmlFor="rc-desc">Promotional message</label>
            <textarea
              id="rc-desc"
              className="input min-h-[80px] py-2.5"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Keep your ordering streak alive! Order every day and unlock an exclusive reward."
            />
            <p className="mt-1 text-xs text-stone">Shown to customers on their streak card.</p>
          </div>
        </Section>

        {/* 2. Streak rule */}
        <Section title="Streak rule">
          <div>
            <label className="label">Campaign duration (window)</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    set('durationMode', 'preset');
                    set('duration_days', d);
                  }}
                  className={`min-h-[44px] rounded-xl px-2 text-sm font-semibold transition-colors ${
                    form.durationMode === 'preset' && form.duration_days === d
                      ? 'bg-espresso-700 text-white'
                      : 'border border-sand bg-white text-espresso-600 hover:bg-cream'
                  }`}
                >
                  {d} days
                </button>
              ))}
              <button
                type="button"
                onClick={() => set('durationMode', 'custom')}
                className={`min-h-[44px] rounded-xl px-2 text-sm font-semibold transition-colors ${
                  form.durationMode === 'custom'
                    ? 'bg-espresso-700 text-white'
                    : 'border border-sand bg-white text-espresso-600 hover:bg-cream'
                }`}
              >
                Custom
              </button>
            </div>
            {form.durationMode === 'custom' && (
              <input
                type="number"
                inputMode="numeric"
                min="1"
                className="input mt-2 sm:max-w-[12rem]"
                value={form.customDuration}
                onChange={(e) => set('customDuration', e.target.value)}
                placeholder="Days, e.g. 20"
              />
            )}
            <p className="mt-1 text-xs text-stone">The total window each customer has, starting from their first order.</p>
          </div>
          <div>
            <label className="label" htmlFor="rc-req">Required streak days</label>
            <input
              id="rc-req"
              type="number"
              inputMode="numeric"
              min="1"
              className="input sm:max-w-[12rem]"
              value={form.required_streak_days}
              onChange={(e) => set('required_streak_days', e.target.value)}
            />
            <p className="mt-1 text-xs text-stone">
              Different days the customer must order on (≤ duration). Multiple orders in one day count once.
            </p>
          </div>
        </Section>

        {/* 3. Reward */}
        <Section title="Reward discount">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rc-type">Type</label>
              <select
                id="rc-type"
                className="input"
                value={form.discount_type}
                onChange={(e) => set('discount_type', e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rc-val">
                {form.discount_type === 'percentage' ? 'Percent off' : 'Amount off (₹)'}
              </label>
              <input
                id="rc-val"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="input"
                value={form.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
              />
            </div>
            {form.discount_type === 'percentage' && (
              <div>
                <label className="label" htmlFor="rc-max">Max discount (₹)</label>
                <input
                  id="rc-max"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.max_discount}
                  onChange={(e) => set('max_discount', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="rc-min">Min order to use (₹)</label>
              <input
                id="rc-min"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="input"
                value={form.min_order_value}
                onChange={(e) => set('min_order_value', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="rc-validity">Coupon valid for (days after unlock)</label>
            <input
              id="rc-validity"
              type="number"
              inputMode="numeric"
              min="1"
              className="input sm:max-w-[12rem]"
              value={form.coupon_validity_days}
              onChange={(e) => set('coupon_validity_days', e.target.value)}
            />
          </div>
        </Section>

        {/* 4. Schedule */}
        <Section title="Schedule">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="rc-start">Campaign start (optional)</label>
              <input
                id="rc-start"
                type="datetime-local"
                className="input"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="rc-end">Campaign end (optional)</label>
              <input
                id="rc-end"
                type="datetime-local"
                className="input"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-stone">
            Leave start empty to begin immediately when active. Orders delivered after the end date stop counting.
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3.5 py-3">
            <div>
              <p className="text-sm font-semibold text-espresso-700">Active</p>
              <p className="text-xs text-stone">Customers earn streak progress while this is on</p>
            </div>
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label="Campaign active" />
          </div>
        </Section>
      </div>
    </Modal>
  );
}
