import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, LogOut, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';

const COLLEGES = ['SRM UNIVERSITY AP', 'VIT AP', 'AMRITA AP'];

export default function Profile() {
  const { user, profile, complete, refreshProfile, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo;

  const [form, setForm] = useState({ full_name: '', phone: '', college: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        college: profile.college || '',
      });
    }
  }, [profile]);

  function validate() {
    const e = {};
    if (!form.full_name || form.full_name.trim().length < 2) e.full_name = 'Enter your full name.';
    if (!/^[6-9][0-9]{9}$/.test(form.phone))
      e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!COLLEGES.includes(form.college)) e.college = 'Select your college.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        college: form.college,
      });
      await refreshProfile();
      toast.success('Profile saved.');
      if (redirectTo) navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-500 font-serif text-2xl text-white">
          {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-serif text-3xl text-espresso-700">Your profile</h1>
          <p className="truncate text-sm text-stone">{user?.email}</p>
        </div>
      </div>

      {!complete ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-terracotta-200 bg-terracotta-50/60 px-4 py-3 text-sm text-terracotta-800">
          <Info size={17} className="mt-0.5 shrink-0" />
          <span>Add your name, phone and college below so we can deliver your orders.</span>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-800">
          <CheckCircle2 size={17} />
          <span>Your details are complete. You're all set to order.</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="c-surface mt-5 space-y-4 p-5">
        <div>
          <label className="c-label" htmlFor="email">
            Google email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
            />
            <input
              id="email"
              className="c-field cursor-not-allowed bg-cream pl-10 text-stone"
              value={user?.email || ''}
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="c-label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            className="c-field"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="e.g. Aditya Sharma"
          />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
        </div>

        <div>
          <label className="c-label" htmlFor="phone">
            Mobile number
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-sand bg-cream px-3 text-sm font-medium text-stone">
              +91
            </span>
            <input
              id="phone"
              inputMode="numeric"
              maxLength={10}
              className="c-field rounded-l-none"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              placeholder="10-digit number"
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="c-label" htmlFor="college">
            College
          </label>
          <select
            id="college"
            className="c-field"
            value={form.college}
            onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
          >
            <option value="">Select your college</option>
            {COLLEGES.map((c) => (
              <option key={c} value={c} disabled={c === 'VIT AP'} className="disabled:text-stone/40">
                {c === 'VIT AP' ? `${c} — coming soon` : c}
              </option>
            ))}
          </select>
          {errors.college && <p className="mt-1 text-xs text-red-600">{errors.college}</p>}
        </div>

        <Button type="submit" size="lg" fullWidth loading={saving}>
          {redirectTo ? 'Save and continue' : 'Save profile'}
        </Button>
      </form>

      <button
        onClick={signOut}
        className="c-btn-ghost mx-auto mt-4 flex h-11 items-center gap-2 px-5 text-red-600 hover:bg-red-50"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
