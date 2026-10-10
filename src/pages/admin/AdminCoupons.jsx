import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
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

export default function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    const r = await api.admin.listCoupons();
    setCoupons(r.coupons || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(c) {
    try {
      await api.admin.updateCoupon(c.id, { is_active: !c.is_active });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.admin.deleteCoupon(id);
      toast.success('Coupon deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  function describe(c) {
    const value = c.discount_type === 'percentage' ? `${c.discount_value}% off` : `${formatINR(c.discount_value)} off`;
    const scope = c.target === 'all' ? 'entire menu' : c.target === 'category' ? 'selected categories' : 'selected products';
    return `${value} · ${scope}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Coupons</h1>
        <button className="btn-primary" onClick={() => setModal({})}>Create coupon</button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          message="Create a coupon to offer discounts to your customers."
          action={<button className="btn-primary" onClick={() => setModal({})}>Create coupon</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {coupons.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-ink-900">{c.code}</p>
                    <p className="text-sm text-ink-600">{describe(c)}</p>
                  </div>
                  <span className={`badge ${expired ? 'bg-red-100 text-red-700' : c.is_active ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-500'}`}>
                    {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-ink-500">
                  {c.min_order_value > 0 && <p>Min order {formatINR(c.min_order_value)}</p>}
                  {c.max_discount && <p>Max discount {formatINR(c.max_discount)}</p>}
                  {c.usage_limit && <p>Used {c.used_count}/{c.usage_limit}</p>}
                  {c.repeat_daily && c.daily_until && (
                    <p className="font-medium text-brand-700">Daily until {c.daily_until.slice(0, 5)}</p>
                  )}
                  {c.expires_at && <p>Expires {new Date(c.expires_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost" onClick={() => toggle(c)}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn-ghost" onClick={() => setModal(c)}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(c.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
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

function CouponModal({ coupon, onClose, onSaved }) {
  const toast = useToast();
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

  useEffect(() => {
    Promise.all([api.admin.listCategories(), api.getProducts()]).then(([c, p]) => {
      setCategories(c.categories || []);
      setProducts(p.products || []);
    });
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleId(field, id) {
    setForm((f) => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  }

  async function save() {
    if (!form.code.trim() || form.code.trim().length < 2) return toast.error('Enter a coupon code.');
    const value = Number(form.discount_value);
    if (Number.isNaN(value) || value <= 0) return toast.error('Enter a valid discount value.');
    if (form.discount_type === 'percentage' && value > 100) return toast.error('Percentage cannot exceed 100.');
    if (form.target === 'category' && form.category_ids.length === 0) return toast.error('Select at least one category.');
    if (form.target === 'product' && form.product_ids.length === 0) return toast.error('Select at least one product.');
    if (form.repeat_daily && !form.daily_until) return toast.error('Set the daily cut-off time for a repeating coupon.');

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
      onClose={onClose}
      title={isEdit ? 'Edit coupon' : 'Create coupon'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Save coupon'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Code</label>
          <input className="input uppercase" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div>
          <label className="label">Discount type</label>
          <select className="input" value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="label">Discount value</label>
          <input type="number" step="0.01" className="input" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)} />
        </div>

        <div>
          <label className="label">Minimum order (₹)</label>
          <input type="number" step="0.01" className="input" value={form.min_order_value} onChange={(e) => set('min_order_value', e.target.value)} />
        </div>
        {form.discount_type === 'percentage' && (
          <div>
            <label className="label">Max discount (₹, optional)</label>
            <input type="number" step="0.01" className="input" value={form.max_discount} onChange={(e) => set('max_discount', e.target.value)} />
          </div>
        )}

        <div>
          <label className="label">Starts at (optional)</label>
          <input type="datetime-local" className="input" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
        </div>
        <div>
          <label className="label">Expires at (optional)</label>
          <input type="datetime-local" className="input" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
        </div>

        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <input
              type="checkbox"
              checked={form.repeat_daily}
              onChange={(e) => set('repeat_daily', e.target.checked)}
            />
            Repeat daily (available every day until a cut-off time)
          </label>
          {form.repeat_daily && (
            <div className="mt-3">
              <label className="label">Available until (each day)</label>
              <input
                type="time"
                className="input sm:max-w-[12rem]"
                value={form.daily_until}
                onChange={(e) => set('daily_until', e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-500">
                Works daily until this time (IST), then unavailable until the next day.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="label">Total usage limit (optional)</label>
          <input type="number" className="input" value={form.usage_limit} onChange={(e) => set('usage_limit', e.target.value)} />
        </div>
        <div>
          <label className="label">Per-user limit (optional)</label>
          <input type="number" className="input" value={form.per_user_limit} onChange={(e) => set('per_user_limit', e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Applies to</label>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'all', l: 'Entire menu' },
              { v: 'category', l: 'Categories' },
              { v: 'product', l: 'Selected products' },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => set('target', opt.v)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  form.target === opt.v ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-700'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {form.target === 'category' && (
          <div className="sm:col-span-2">
            <label className="label">Select categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleId('category_ids', c.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    form.category_ids.includes(c.id) ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.target === 'product' && (
          <div className="sm:col-span-2">
            <label className="label">Select products</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-200 p-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={form.product_ids.includes(p.id)}
                    onChange={() => toggleId('product_ids', p.id)}
                  />
                  {p.name} <span className="text-ink-400">· {formatINR(p.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Active
        </label>
      </div>
    </Modal>
  );
}
