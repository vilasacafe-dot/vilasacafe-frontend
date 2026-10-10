import { useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Pencil, Tag, X, BadgeIndianRupee, Wallet, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRestaurantStatus } from '../../hooks/useRestaurantStatus.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR } from '../../lib/format.js';
import Button from '../../components/ui/Button.jsx';
import ClosedNotice from '../../components/ClosedNotice.jsx';

const COLLEGES = ['SRM UNIVERSITY AP', 'VIT AP', 'AMRITA AP'];

// ─── Inline profile editor ────────────────────────────────────────────────────
function EditDetailsPanel({ profile, onSaved, onCancel }) {
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    college: profile.college || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      e.full_name = 'Enter your full name.';
    if (!/^[6-9][0-9]{9}$/.test(form.phone))
      e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!COLLEGES.includes(form.college)) e.college = 'Select your college.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        college: form.college,
      });
      await refreshProfile();
      toast.success('Details updated.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-terracotta-200 bg-terracotta-50/50 p-4">
      <div>
        <label className="c-label text-xs">Full name</label>
        <input
          className="c-field"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
      </div>

      <div>
        <label className="c-label text-xs">Mobile number</label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-sand bg-cream px-3 text-sm font-medium text-stone">
            +91
          </span>
          <input
            className="c-field rounded-l-none"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
          />
        </div>
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label className="c-label text-xs">College</label>
        <select
          className="c-field"
          value={form.college}
          onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
        >
          <option value="">Select college</option>
          {COLLEGES.map((c) => (
            <option key={c} value={c} disabled={c === 'VIT AP'} className="disabled:text-stone/40">
              {c === 'VIT AP' ? `${c} — coming soon` : c}
            </option>
          ))}
        </select>
        {errors.college && <p className="mt-1 text-xs text-red-600">{errors.college}</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={save} loading={saving} fullWidth>
          Save details
        </Button>
        <Button onClick={onCancel} variant="outline" fullWidth>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────────
export default function Checkout() {
  const { items, orderItems, subtotal, clearCart } = useCart();
  const { profile, complete } = useAuth();
  const { isOpen, closedMessage, loading: statusLoading } = useRestaurantStatus();
  const toast = useToast();
  const navigate = useNavigate();

  const [editingDetails, setEditingDetails] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const idempotencyKey = useRef(
    crypto?.randomUUID?.() || `ck_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  if (items.length === 0 && !placing) return <Navigate to="/menu" replace />;
  if (!complete) return <Navigate to="/profile" state={{ redirectTo: '/checkout' }} replace />;

  const discount = coupon?.discount || 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponError('');
    try {
      const res = await api.previewCoupon(couponInput.trim(), orderItems);
      if (res.valid) {
        setCoupon({ code: res.code, discount: res.discount });
        toast.success(`Coupon applied — you save ${formatINR(res.discount, true)}`);
      } else {
        setCoupon(null);
        setCouponError(res.message || 'This coupon cannot be applied.');
      }
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    } finally {
      setApplying(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  }

  async function placeOrder() {
    if (placing) return;
    setPlacing(true);
    try {
      const res = await api.placeOrder({
        items: orderItems,
        coupon_code: coupon?.code || null,
        notes: notes.trim() || null,
        idempotency_key: idempotencyKey.current,
      });
      const order = res.order;
      clearCart();
      navigate(`/order-confirmed/${order.order_id}`, {
        replace: true,
        state: { orderNumber: order.order_number },
      });
    } catch (err) {
      toast.error(err.message);
      setPlacing(false);
    }
  }

  const canPlace = !statusLoading && isOpen && !placing && !editingDetails;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl text-espresso-700">Checkout</h1>

      {!statusLoading && !isOpen && (
        <div className="mb-4">
          <ClosedNotice message={closedMessage} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        {/* Left column */}
        <div className="space-y-4 md:col-span-3">
          {/* Delivery details */}
          <section className="c-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="c-eyebrow">Delivery details</h2>
              {!editingDetails && (
                <button
                  onClick={() => setEditingDetails(true)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
            </div>

            {editingDetails ? (
              <div className="mt-3">
                <EditDetailsPanel
                  profile={profile}
                  onSaved={() => setEditingDetails(false)}
                  onCancel={() => setEditingDetails(false)}
                />
              </div>
            ) : (
              <dl className="mt-3 space-y-2.5 text-sm">
                <Row label="Name" value={profile.full_name} />
                <Row label="Phone" value={`+91 ${profile.phone}`} />
                <Row label="College" value={profile.college} />
              </dl>
            )}
          </section>

          {/* Notes */}
          <section className="c-surface p-5">
            <label className="c-label" htmlFor="notes">
              Notes for the restaurant <span className="font-normal text-stone">(optional)</span>
            </label>
            <textarea
              id="notes"
              className="c-field min-h-[84px] resize-y"
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Room number, landmark, less spicy…"
            />
          </section>

          {/* Payment */}
          <section className="c-surface p-5">
            <h2 className="c-eyebrow">Payment</h2>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-500 text-white">
                <Wallet size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-espresso-700">Cash on Delivery</p>
                <p className="text-xs text-stone">Pay with cash when your order arrives.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <section className="c-surface sticky top-20 p-5">
            <h2 className="c-eyebrow">Order summary</h2>

            <ul className="mt-3 divide-y divide-sand">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2 py-2.5 text-sm">
                  <span className="text-espresso-600">
                    {i.name} <span className="text-stone">× {i.quantity}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-espresso-700">
                    {formatINR(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="mt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl border border-sage-200 bg-sage-50 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-sage-800">
                    <Tag size={14} />
                    {coupon.code}
                    <span className="font-normal text-sage-700">
                      · save {formatINR(coupon.discount, true)}
                    </span>
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="rounded-full p-1 text-sage-700 hover:bg-sage-100"
                    aria-label="Remove coupon"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      className="c-field"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    />
                    <Button onClick={applyCoupon} loading={applying} variant="outline" className="shrink-0">
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-sand pt-4 text-sm">
              <div className="flex justify-between text-stone">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums text-espresso-700">
                  {formatINR(subtotal, true)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sage-700">
                  <span>Discount</span>
                  <span className="font-medium tabular-nums">− {formatINR(discount, true)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-sand pt-2.5 text-base">
                <span className="font-bold text-espresso-700">Total</span>
                <span className="font-bold tabular-nums text-terracotta-600">
                  {formatINR(total, true)}
                </span>
              </div>
            </div>

            <Button
              onClick={placeOrder}
              disabled={!canPlace}
              loading={placing}
              size="lg"
              fullWidth
              className="mt-5"
              leftIcon={<BadgeIndianRupee size={18} />}
            >
              {editingDetails
                ? 'Save your details first'
                : isOpen
                ? `Place order · ${formatINR(total, true)}`
                : 'Ordering is closed'}
            </Button>

            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs text-stone">
              <ShieldCheck size={13} />
              Final amount is confirmed by the restaurant.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone">{label}</dt>
      <dd className="text-right font-semibold text-espresso-700">{value}</dd>
    </div>
  );
}
