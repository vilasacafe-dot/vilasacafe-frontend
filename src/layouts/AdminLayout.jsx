import { Outlet, NavLink, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/phone-orders', label: 'Phone Orders' },
  { to: '/admin/menu', label: 'Menu' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/banners', label: 'Banners' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.getStatus().then((s) => setIsOpen(s.settings.is_open)).catch(() => {});
  }, []);

  async function toggleOpen() {
    setToggling(true);
    try {
      const res = await api.admin.updateSettings({ is_open: !isOpen });
      setIsOpen(res.settings.is_open);
      toast.success(res.settings.is_open ? 'Restaurant is now OPEN' : 'Restaurant is now CLOSED');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(false);
    }
  }

  const link =
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors';

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-base font-extrabold text-white">
                V
              </span>
              <span className="font-display text-base font-bold text-ink-900">Vilasa Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isOpen !== null && (
              <button
                onClick={toggleOpen}
                disabled={toggling}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  isOpen
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                {isOpen ? 'Open' : 'Closed'}
              </button>
            )}
            <span className="hidden text-sm text-ink-500 sm:inline">{profile?.full_name}</span>
            <button onClick={signOut} className="btn-ghost text-red-600">Sign out</button>
          </div>
        </div>

        <nav className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-1 pb-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `${link} ${isActive ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
