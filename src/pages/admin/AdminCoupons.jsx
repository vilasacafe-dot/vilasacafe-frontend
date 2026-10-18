import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Ticket,
  Tag,
  X,
  Check,
  CalendarClock,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { formatINR } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import Switch from '../../components/Switch.jsx';
import EmptyState from '../../components/EmptyState.jsx';

// datetime-local <-> ISO helpers
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

export default function AdminCoupons() {
  const toast = useToast();
  const confirm = useConfirm();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const load = useCallback(async () => {
    try {
      const r = await api.admin.listCoupons();
      setCoupons(r.coupons || []);
    } catch (e) {
      toast.error(e.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = coupons.filter(
    (c) => c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date())
  ).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [coupons, search]);

  async function toggle(c, next) {
    const expired = c.expires_at && new Date(c.expires_at) < new Date();
    if (next && expired) {
      toast.error('This coupon has expired. Update its expiry date before activating.');
      return;
    }
    if (pendingIds.has(c.id)) return;
    setPendingIds((s) => new Set(s).add(c.id));
    setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)));
    try {
      const res = await api.admin.updateCoupon(c.id, { is_active: next });
      const confirmed = res?.coupon?.is_active ?? next;
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: confirmed } : x)));
      toast.success(confirmed ? `${c.code} activated` : `${c.code} deactivated`);
    } catch (e) {
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !next } : x)));
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
      title: `Delete coupon "${c.code}"?`,
      message: 'Customers will no longer be able to use this code.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.admin.deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Coupon deleted.');
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-espresso-700">Coupons</h1>
          <p className="text-sm text-stone">
            {activeCount} active · {coupons.length} total
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" /> Add coupon
        </button>
      </div>

      {coupons.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search coupons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          message="Create a coupon to offer discounts to your customers."
          icon={<Ticket className="h-8 w-8" />}
          action={
            <button className="btn-primary" onClick={() => setModal({})}>
              <Plus className="h-4 w-4" /> Add coupon
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" message="Try a different search." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              pending={pendingIds.has(c.id)}
              onToggle={(next) => toggle(c, next)}
              onEdit={() => setModal(c)}
              onDelete={() => remove(c)}
            />
          ))}
        </ul>
      )}

      {modal && (
        <CouponModal
          coupon={modal}
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

function CouponCard({ coupon: c, pending, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const expired = c.expires_at && new Date(c.expires_at) < new Date();
  const value = c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `${formatINR(c.discount_value)} OFF`;
  const scope = c.target === 'all' ? 'Entire menu' : c.target === 'category' ? 'Selected categories' : 'Selected products';

  return (
    <li className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-espresso-700 break-all">
            {c.code}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-terracotta-600">{value}</p>
        </div>
        <span
          className={`badge ${
            expired ? 'badge-danger' : c.is_active ? 'badge-success' : 'badge-muted'
          }`}
        >
          {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {c.description && <p className="mt-1 text-sm text-stone break-words">{c.description}</p>}

      <div className="mt-2 space-y-1 text-xs text-stone">
        <p className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 shrink-0" /> {scope}
        </p>
        {c.min_order_value > 0 && <p>Min order {formatINR(c.min_order_value)}</p>}
        {c.max_discount && <p>Max discount {formatINR(c.max_discount)}</p>}
        {c.usage_limit && <p>Used {c.used_count}/{c.usage_limit}</p>}
        {c.repeat_daily && c.daily_until && (
          <p className="font-semibold text-terracotta-600">Daily until {c.daily_until.slice(0, 5)}</p>
        )}
        {c.expires_at && (
          <p className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" /> Valid until {fmtDate(c.expires_at)}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand pt-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={!!c.is_active && !expired}
            busy={pending}
            disabled={expired}
            onChange={onToggle}
            label={c.is_active ? `Deactivate coupon ${c.code}` : `Activate coupon ${c.code}`}
          />
          <span className={`text-xs font-bold ${c.is_active && !expired ? 'text-sage-700' : 'text-stone'}`}>
            {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn-secondary btn-sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <div className="relative">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand bg-white text-stone hover:bg-cream"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`More actions for ${c.code}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-soft"
                >
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete coupon
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

/* ─────────────────────────── Coupon form ─────────────────────────── */

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="admin-section-title">{title}</h3>
      {children}
    </section>
  );
}

function CouponModal({ coupon, onClose, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const isEdit = Boolean(coupon.id);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    code: coupon.code || '',
    description: coupon.description || '',
    discount_type: coupon.discount_type || 'percentage',
    discount_value: coupon.discount_value ?? '',
    min_order_value: coupon.min_order_value ?? 0,
    max_discount: coupon.max_discount ?? '',
    target: coupon.target || 'all',
    starts_at: isoToLocalInput(coupon.starts_at),
    expires_at: isoToLocalInput(coupon.expires_at),
    repeat_daily: coupon.repeat_daily ?? false,
    daily_until: (coupon.daily_until || '').slice(0, 5),
    is_active: coupon.is_active ?? true,
    usage_limit: coupon.usage_limit ?? '',
    per_user_limit: coupon.per_user_limit ?? '',
    category_ids: coupon.category_ids || [],
    product_ids: coupon.product_ids || [],
  });
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    Promise.all([api.admin.listCategories(), api.getProducts()]).then(([c, p]) => {
      setCategories(c.categories || []);
      setProducts(p.products || []);
    });
  }, []);

  function set(k, v) {
    dirty.current = true;
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleId(field, id) {
    dirty.current = true;
    setForm((f) => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  }

  async function attemptClose() {
    if (saving) return;
    if (dirty.current) {
      const ok = await confirm({
        title: 'Discard changes?',
        message: 'Your changes to this coupon will be lost.',
        confirmLabel: 'Discard',
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }

  async function save() {
    if (!form.code.trim() || form.code.trim().length < 2) return toast.error('Enter a coupon code.');
    const value = Number(form.discount_value);
    if (Number.isNaN(value) || value <= 0) return toast.error('Enter a valid discount value.');
    if (form.discount_type === 'percentage' && value > 100) return toast.error('Percentage cannot exceed 100.');
    if (form.target === 'category' && form.category_ids.length === 0) return toast.error('Select at least one category.');
    if (form.target === 'product' && form.product_ids.length === 0) return toast.error('Select at least one product.');
    if (form.repeat_daily && !form.daily_until) return toast.error('Set the daily cut-off time for a repeating coupon.');
    if (form.starts_at && form.expires_at && new Date(form.expires_at) < new Date(form.starts_at)) {
      return toast.error('Expiry must be after the start date.');
    }
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: value,
        min_order_value: Number(form.min_order_value) || 0,
        max_discount: form.discount_type === 'percentage' && form.max_discount ? Number(form.max_discount) : null,
        target: form.target,
        starts_at: form.starts_at ? localInputToIso(form.starts_at) : undefined,
        expires_at: form.expires_at ? localInputToIso(form.expires_at) : null,
        repeat_daily: form.repeat_daily,
        daily_until: form.repeat_daily && form.daily_until ? form.daily_until : null,
        is_active: form.is_active,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
        category_ids: form.target === 'category' ? form.category_ids : [],
        product_ids: form.target === 'product' ? form.product_ids : [],
      };
      if (isEdit) await api.admin.updateCoupon(coupon.id, payload);
      else await api.admin.createCoupon(payload);
      dirty.current = false;
      toast.success('Coupon saved.');
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
      title={isEdit ? 'Edit coupon' : 'Create coupon'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={attemptClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : 'Save coupon'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-lg space-y-6">
        {/* 1. Basic details */}
        <Section title="Basic details">
          <div>
            <label className="label" htmlFor="co-code">Coupon code</label>
            <input
              id="co-code"
              className="input uppercase"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="WELCOME10"
            />
          </div>
          <div>
            <label className="label" htmlFor="co-desc">Description (optional)</label>
            <input
              id="co-desc"
              className="input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Shown to customers"
            />
          </div>
        </Section>

        {/* 2. Discount */}
        <Section title="Discount">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="co-type">Type</label>
              <select
                id="co-type"
                className="input"
                value={form.discount_type}
                onChange={(e) => set('discount_type', e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="co-val">
                {form.discount_type === 'percentage' ? 'Percent off' : 'Amount off (₹)'}
              </label>
              <input
                id="co-val"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="input"
                value={form.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="co-min">Min order (₹)</label>
              <input
                id="co-min"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="input"
                value={form.min_order_value}
                onChange={(e) => set('min_order_value', e.target.value)}
              />
            </div>
            {form.discount_type === 'percentage' && (
              <div>
                <label className="label" htmlFor="co-max">Max discount (₹)</label>
                <input
                  id="co-max"
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
          </div>
        </Section>

        {/* 3. Eligibility */}
        <Section title="Applies to">
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'all', l: 'Entire menu' },
              { v: 'category', l: 'Categories' },
              { v: 'product', l: 'Products' },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => set('target', opt.v)}
                className={`min-h-[44px] rounded-xl px-2 text-sm font-semibold transition-colors ${
                  form.target === opt.v
                    ? 'bg-espresso-700 text-white'
                    : 'border border-sand bg-white text-espresso-600 hover:bg-cream'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          {form.target === 'category' && (
            <ChipSelector
              placeholder="Search categories…"
              options={categories.map((c) => ({ id: c.id, label: c.name }))}
              selected={form.category_ids}
              onToggle={(id) => toggleId('category_ids', id)}
            />
          )}
          {form.target === 'product' && (
            <ChipSelector
              placeholder="Search products…"
              options={products.map((p) => ({ id: p.id, label: p.name, sub: formatINR(p.price) }))}
              selected={form.product_ids}
              onToggle={(id) => toggleId('product_ids', id)}
            />
          )}
        </Section>

        {/* 4. Validity */}
        <Section title="Validity period">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="co-start">Starts at (optional)</label>
              <input
                id="co-start"
                type="datetime-local"
                className="input"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="co-exp">Expires at (optional)</label>
              <input
                id="co-exp"
                type="datetime-local"
                className="input"
                value={form.expires_at}
                onChange={(e) => set('expires_at', e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-xl border border-sand bg-cream/50 p-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-espresso-700">
                Repeat daily
                <span className="block text-xs font-normal text-stone">Available each day until a cut-off time</span>
              </span>
              <Switch
                checked={form.repeat_daily}
                onChange={(v) => set('repeat_daily', v)}
                label="Repeat coupon daily"
              />
            </label>
            {form.repeat_daily && (
              <div className="mt-3">
                <label className="label" htmlFor="co-daily">Available until (each day, IST)</label>
                <input
                  id="co-daily"
                  type="time"
                  className="input sm:max-w-[12rem]"
                  value={form.daily_until}
                  onChange={(e) => set('daily_until', e.target.value)}
                />
              </div>
            )}
          </div>
        </Section>

        {/* 5. Usage limits */}
        <Section title="Usage limits (optional)">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="co-usage">Total uses</label>
              <input
                id="co-usage"
                type="number"
                inputMode="numeric"
                min="0"
                className="input"
                value={form.usage_limit}
                onChange={(e) => set('usage_limit', e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="label" htmlFor="co-per">Per customer</label>
              <input
                id="co-per"
                type="number"
                inputMode="numeric"
                min="0"
                className="input"
                value={form.per_user_limit}
                onChange={(e) => set('per_user_limit', e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </Section>

        {/* 6. Status */}
        <Section title="Status">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3.5 py-3">
            <div>
              <p className="text-sm font-semibold text-espresso-700">Active</p>
              <p className="text-xs text-stone">Customers can use this coupon when valid</p>
            </div>
            <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label="Coupon active" />
          </div>
        </Section>
      </div>
    </Modal>
  );
}

/* Searchable multi-select with selected chips. */
function ChipSelector({ options, selected, onToggle, placeholder }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => o.label.toLowerCase().includes(t));
  }, [options, q]);
  const selectedOpts = options.filter((o) => selected.includes(o.id));

  return (
    <div className="space-y-2">
      {selectedOpts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOpts.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-100 py-1 pl-3 pr-1.5 text-sm font-semibold text-terracotta-700"
            >
              <span className="max-w-[12rem] truncate">{o.label}</span>
              <button
                type="button"
                onClick={() => onToggle(o.id)}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-terracotta-200"
                aria-label={`Remove ${o.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-sand">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-stone">No matches.</p>
        ) : (
          <ul className="divide-y divide-sand">
            {filtered.map((o) => {
              const on = selected.includes(o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(o.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                      on ? 'bg-terracotta-50' : 'hover:bg-cream'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        on ? 'border-terracotta-500 bg-terracotta-500 text-white' : 'border-sand bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-espresso-700">{o.label}</span>
                    {o.sub && <span className="shrink-0 text-xs text-stone">{o.sub}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
