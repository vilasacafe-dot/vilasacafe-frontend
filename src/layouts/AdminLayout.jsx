import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  Home,
  Receipt,
  UtensilsCrossed,
  MoreHorizontal,
  Ticket,
  Images,
  Printer,
  Gift,
  LogOut,
  X,
  Power,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';

/* Primary destinations shown in the mobile bottom bar (first 3) + sidebar. */
const PRIMARY = [
  { to: '/admin', label: 'Home', icon: Home, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
];

/* Secondary destinations — reachable from the sidebar (desktop) and the
   "More" sheet (mobile). Nothing is hidden; everything stays one tap away. */
const SECONDARY = [
  { to: '/admin/phone-orders', label: 'Phone orders', icon: Printer },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/loyalty', label: 'Loyalty Rewards', icon: Gift },
  { to: '/admin/banners', label: 'Banners', icon: Images },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    api.getStatus().then((s) => setIsOpen(s.settings.is_open)).catch(() => {});
  }, []);

  // Close the "More" sheet whenever the route changes.
  useEffect(() => setMoreOpen(false), [location.pathname]);

  const toggleOpen = useCallback(async () => {
    if (toggling || isOpen === null) return;
    const previous = isOpen;
    setToggling(true);
    setIsOpen(!previous); // optimistic
    try {
      const res = await api.admin.updateSettings({ is_open: !previous });
      setIsOpen(res.settings.is_open); // reconcile with server (authoritative)
      toast.success(res.settings.is_open ? 'Restaurant is now OPEN' : 'Restaurant is now CLOSED');
    } catch (e) {
      setIsOpen(previous); // rollback
      toast.error(e.message || 'Could not update restaurant status.');
    } finally {
      setToggling(false);
    }
  }, [isOpen, toggling, toast]);

  return (
    <div className="admin min-h-[100dvh]">
      {/* ───────────────── Desktop sidebar (lg+) ───────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sand bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sand px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-espresso-700 font-display text-base font-extrabold text-white">
            V
          </span>
          <span className="font-display text-base font-bold text-espresso-700">Vilasa Admin</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {[...PRIMARY, ...SECONDARY].map((n) => (
            <SidebarLink key={n.to} item={n} />
          ))}
        </nav>

        <div className="border-t border-sand p-3">
          <StatusToggle isOpen={isOpen} toggling={toggling} onToggle={toggleOpen} />
          <div className="mt-3 flex items-center justify-between gap-2 px-1">
            <span className="truncate text-sm text-stone">{profile?.full_name}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ───────────────── Mobile top header ───────────────── */}
      <header className="sticky top-0 z-30 border-b border-sand bg-ivory/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4 [padding-top:env(safe-area-inset-top,0px)]">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso-700 font-display text-sm font-extrabold text-white">
              V
            </span>
            <span className="font-display text-[15px] font-bold text-espresso-700">Vilasa Admin</span>
          </Link>
          <StatusPill isOpen={isOpen} toggling={toggling} onToggle={toggleOpen} />
        </div>
      </header>

      {/* ───────────────── Main content ───────────────── */}
      <div className="lg:pl-64">
        <main className="admin-main-pad mx-auto w-full max-w-5xl px-4 py-5">
          <Outlet context={{ isOpen, toggling, toggleOpen }} />
        </main>
      </div>

      {/* ───────────────── Mobile bottom navigation ───────────────── */}
      <nav
        className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-white lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {PRIMARY.map((n) => (
            <BottomTab key={n.to} item={n} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              isSecondaryActive(location.pathname) || moreOpen ? 'text-terracotta-600' : 'text-stone'
            }`}
          >
            <MoreHorizontal className="h-[22px] w-[22px]" />
            More
          </button>
        </div>
      </nav>

      {/* ───────────────── "More" sheet (mobile) ───────────────── */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More options">
          <div className="absolute inset-0 bg-espresso-900/50 backdrop-blur-[1px]" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-espresso-700">More</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-stone hover:bg-cream"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <StatusToggle isOpen={isOpen} toggling={toggling} onToggle={toggleOpen} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SECONDARY.map((n) => (
                <MoreLink key={n.to} item={n} />
              ))}
            </div>

            <button
              onClick={signOut}
              className="btn-secondary mt-3 w-full text-red-600"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isSecondaryActive(pathname) {
  return SECONDARY.some((n) => pathname.startsWith(n.to));
}

function SidebarLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'bg-espresso-700 text-white' : 'text-espresso-600 hover:bg-cream'
        }`
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {item.label}
    </NavLink>
  );
}

function BottomTab({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
          isActive ? 'text-terracotta-600' : 'text-stone'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

function MoreLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition-colors ${
          isActive
            ? 'border-terracotta-300 bg-terracotta-50 text-terracotta-700'
            : 'border-sand bg-white text-espresso-600 hover:bg-cream'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  );
}

/* Full-width labelled toggle used in the sidebar + More sheet. */
function StatusToggle({ isOpen, toggling, onToggle }) {
  if (isOpen === null) {
    return <div className="h-12 w-full animate-pulse rounded-xl bg-cream" />;
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOpen}
      aria-label={isOpen ? 'Restaurant is open. Tap to close.' : 'Restaurant is closed. Tap to open.'}
      aria-busy={toggling}
      disabled={toggling}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
        isOpen ? 'border-sage-300 bg-sage-50' : 'border-red-200 bg-red-50'
      } disabled:opacity-70`}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isOpen ? 'bg-sage-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <Power className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone">Restaurant</span>
          <span className={`block text-sm font-bold ${isOpen ? 'text-sage-700' : 'text-red-700'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </span>
      </span>
      <span className={`switch ${isOpen ? 'switch-on' : 'switch-off'}`} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}

/* Compact status chip for the mobile header (also toggles). */
function StatusPill({ isOpen, toggling, onToggle }) {
  if (isOpen === null) return <div className="h-8 w-20 animate-pulse rounded-full bg-cream" />;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOpen}
      aria-label={isOpen ? 'Restaurant is open. Tap to close.' : 'Restaurant is closed. Tap to open.'}
      aria-busy={toggling}
      disabled={toggling}
      onClick={onToggle}
      className={`inline-flex min-h-[36px] items-center gap-2 rounded-full px-3 text-sm font-bold transition-colors ${
        isOpen ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-700'
      } disabled:opacity-70`}
    >
      <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-sage-500' : 'bg-red-500'}`} />
      {isOpen ? 'Open' : 'Closed'}
    </button>
  );
}
