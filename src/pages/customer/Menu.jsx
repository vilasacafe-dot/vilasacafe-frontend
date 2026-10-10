import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useRestaurantStatus } from '../../hooks/useRestaurantStatus.js';
import ProductCard from '../../components/ProductCard.jsx';
import ProductGridSkeleton from '../../components/ProductGridSkeleton.jsx';
import ClosedNotice from '../../components/ClosedNotice.jsx';
import CafeEmpty from '../../components/CafeEmpty.jsx';
import CategoryNav from '../../components/CategoryNav.jsx';
import BottomCartBar from '../../components/BottomCartBar.jsx';

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { isOpen, closedMessage, loading: statusLoading } = useRestaurantStatus();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const activeSlug = params.get('category') || 'all';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(c.categories || []);
      setProducts(p.products || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, location.key]);

  const activeCategory = categories.find((c) => c.slug === activeSlug);

  const visible = useMemo(() => {
    const activeIds = new Set(categories.map((c) => c.id));
    let list = products.filter((p) => !p.category_id || activeIds.has(p.category_id));
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory.id);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, categories, activeCategory, search]);

  function setCategory(slug) {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setParams(next);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="c-eyebrow">Vilasa Cafe</p>
        <h1 className="mt-1 font-serif text-3xl text-espresso-700">Our menu</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
        />
        <input
          type="search"
          className="c-field pl-11"
          placeholder="Search dishes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search menu"
        />
      </div>

      {!statusLoading && !isOpen && <ClosedNotice message={closedMessage} />}

      {/* Sticky category navigation */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-sand/70 bg-ivory/95 px-4 py-2 backdrop-blur-md">
        <CategoryNav categories={categories} active={activeSlug} onSelect={setCategory} />
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <CafeEmpty
          icon={<SearchX size={26} />}
          title="Couldn't load the menu"
          message="Something went wrong while loading dishes."
          action={
            <button onClick={load} className="c-btn-primary h-11 px-5">
              Try again
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <CafeEmpty
          icon={<SearchX size={26} />}
          title="No dishes found"
          message={search ? 'Try a different search term.' : 'This category has no items yet.'}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <BottomCartBar />
    </div>
  );
}
