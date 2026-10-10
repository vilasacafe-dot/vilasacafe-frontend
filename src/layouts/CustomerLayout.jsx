import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ReceiptText, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Vilasa Cafe home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-espresso-700 font-serif text-xl leading-none text-ivory">
        V
      </span>
      <span className="font-serif text-[22px] leading-none text-espresso-700">
        Vilasa <span className="text-terracotta-500">Cafe</span>
      </span>
    </Link>
  );
}

function CartButton({ count }) {
  return (
    <Link
      to="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-espresso-700 transition-colors hover:bg-cream"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ''}`}
    >
      <ShoppingBag size={21} strokeWidth={1.9} />
      {count > 0 && (
        <span
          key={count}
          className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] animate-pop items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export default function CustomerLayout() {
  const { isAuthenticated, isAdmin, profile } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const desktopLink = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? 'text-terracotta-600' : 'text-espresso-600 hover:text-espresso-900'
    }`;

  return (
    <div className="cafe flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? 'border-sand bg-ivory/90 backdrop-blur-md'
            : 'border-transparent bg-ivory'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Wordmark />

          <nav className="hidden items-center gap-8 md:flex">
            <NavLink to="/" end className={desktopLink}>
              Home
            </NavLink>
            <NavLink to="/menu" className={desktopLink}>
              Menu
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/orders" className={desktopLink}>
                Orders
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={desktopLink}>
                Restaurant
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <CartButton count={count} />
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="ml-1 hidden items-center gap-2 rounded-full border border-sand bg-white py-1 pl-1 pr-3 md:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-500 text-sm font-bold text-white">
                  {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[7rem] truncate text-sm font-semibold text-espresso-700">
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="c-btn-primary ml-1 hidden h-10 px-5 md:inline-flex"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:pb-12 md:pt-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-ivory/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          <MobileTab to="/" label="Home" icon={Home} exact />
          <MobileTab to="/menu" label="Menu" icon={UtensilsCrossed} />
          <MobileTab
            to={isAuthenticated ? '/orders' : '/login'}
            label="Orders"
            icon={ReceiptText}
          />
          <MobileTab
            to={isAuthenticated ? '/profile' : '/login'}
            label="Account"
            icon={User}
          />
        </div>
      </nav>

      <footer className="hidden border-t border-sand bg-cream py-10 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-stone">
          <span className="font-serif text-base text-espresso-700">Vilasa Cafe</span>
          <span>Cash on Delivery · SRM AP · VIT AP · Amrita AP</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function MobileTab({ to, label, icon: Icon, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
          isActive ? 'text-terracotta-600' : 'text-stone'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
          {label}
        </>
      )}
    </NavLink>
  );
}
