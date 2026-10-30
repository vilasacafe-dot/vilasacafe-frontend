import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useRestaurantStatus } from '../../hooks/useRestaurantStatus.js';
import HeroCarousel from '../../components/HeroCarousel.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import ProductGridSkeleton from '../../components/ProductGridSkeleton.jsx';
import ClosedNotice from '../../components/ClosedNotice.jsx';
import BottomCartBar from '../../components/BottomCartBar.jsx';

export default function Home() {
  const location = useLocation();
  const { isOpen, closedMessage, loading: statusLoading } = useRestaurantStatus();
  const [banners, setBanners]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, p, c] = await Promise.all([
        api.getBanners(),
        api.getProducts(),
        api.getCategories(),
      ]);
      setBanners(b.banners || []);
      setProducts(p.products || []);
      setCategories(c.categories || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, location.key]);

  const featured = products.filter((p) => p.is_featured && p.is_available).slice(0, 8);
  const popular  = products.slice(0, 8);

  return (
    <div className="space-y-8">
      {!statusLoading && !isOpen && <ClosedNotice message={closedMessage} />}

      {/* ── Hero carousel — full-bleed on mobile ─────────────────────── */}
      {banners.length > 0 && (
        <div className="-mx-4 sm:mx-0">
          <HeroCarousel banners={banners} />
        </div>
      )}

      {/* ── Browse by category ────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section>
          <SectionHeading title="Browse by category" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/menu?category=${c.slug}`}
                className="group flex min-w-[8.5rem] flex-col justify-between rounded-2xl border border-sand bg-white p-4 shadow-cafe transition-shadow hover:shadow-lift"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-terracotta-500">
                  <UtensilsCrossed size={17} />
                </span>
                <span className="mt-6 text-[15px] font-semibold text-espresso-700">
                  {c.name}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-terracotta-500">
                  View{' '}
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Today's favourites (featured products) ───────────────────── */}
      {!loading && featured.length > 0 && (
        <section>
          <SectionHeading title="Today's favourites" to="/menu" linkLabel="Full menu" />
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {featured.map((p) => (
              <div key={p.id} className="w-44 flex-shrink-0 sm:w-52">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── From the menu ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading title="From the menu" to="/menu" linkLabel="See all" />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : popular.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand bg-white/60 px-6 py-12 text-center text-sm text-stone">
            No items on the menu yet. Please check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <BottomCartBar />
    </div>
  );
}

function SectionHeading({ title, to, linkLabel }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-serif text-2xl text-espresso-700">{title}</h2>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
        >
          {linkLabel}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
