import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Minus,
  Printer,
  Search,
  Trash2,
  Phone,
  GraduationCap,
  StickyNote,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR, formatDateTime } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

const COLLEGES = ['SRM UNIVERSITY AP', 'VIT AP', 'AMRITA AP'];

export default function PhoneOrders() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState({}); // id -> { product, qty }
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [printedAt, setPrintedAt] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([c, p]) => {
        if (!mounted) return;
        setCategories(c.categories || []);
        setProducts(p.products || []);
      })
      .catch((e) => mounted && toast.error(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [toast]);

  const inc = useCallback((product) => {
    setCart((prev) => {
      const cur = prev[product.id]?.qty || 0;
      return { ...prev, [product.id]: { product, qty: cur + 1 } };
    });
  }, []);

  const dec = useCallback((product) => {
    setCart((prev) => {
      const cur = prev[product.id]?.qty || 0;
      if (cur <= 1) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { product, qty: cur - 1 } };
    });
  }, []);

  const clearAll = () => {
    setCart({});
    setPhone('');
    setCollege('');
    setNote('');
    setCustomerOpen(false);
  };

  const lines = useMemo(
    () =>
      Object.values(cart).map(({ product, qty }) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        qty,
        total: Math.round(Number(product.price) * qty * 100) / 100,
      })),
    [cart]
  );

  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.total, 0);

  const visibleProducts = useMemo(() => {
    const activeIds = new Set(categories.map((c) => c.id));
    let list = products.filter((p) => p.is_available !== false);
    if (activeCat !== 'all') {
      const cat = categories.find((c) => c.slug === activeCat);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    } else {
      list = list.filter((p) => !p.category_id || activeIds.has(p.category_id));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, categories, activeCat, search]);

  const canPrint = itemCount > 0 && Boolean(college);

  function handlePrint() {
    if (itemCount === 0) {
      toast.error('Add at least one item first.');
      return;
    }
    if (!college) {
      setCustomerOpen(true);
      toast.error('Select a college before printing.');
      return;
    }
    setPrintedAt(new Date().toISOString());
    setTimeout(() => window.print(), 60);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-brand-600" />
      </div>
    );
  }

  return (
    <>
      <div className="no-print grid gap-5 pb-28 lg:grid-cols-5 lg:pb-6">
        {/* ── PRIMARY: menu selection ── */}
        <section className="lg:col-span-3">
          {/* Sticky search + categories for fast picking */}
          <div className="sticky top-[7.5rem] z-20 -mx-4 bg-ink-50/95 px-4 pb-2 pt-1 backdrop-blur sm:top-28">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                className="input pl-9"
                placeholder="Search dishes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="-mx-4 mt-2 overflow-x-auto px-4">
              <div className="flex gap-2 pb-1">
                <CatChip label="All" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
                {categories.map((c) => (
                  <CatChip
                    key={c.id}
                    label={c.name}
                    active={activeCat === c.slug}
                    onClick={() => setActiveCat(c.slug)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Product grid — big tap targets, quick add */}
          {visibleProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-400">No dishes found.</p>
          ) : (
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {visibleProducts.map((p) => {
                const qty = cart[p.id]?.qty || 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 transition-colors ${
                      qty > 0 ? 'border-brand-300 ring-1 ring-brand-200' : 'border-ink-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => inc(p)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-500">{formatINR(p.price)}</p>
                    </button>
                    {qty > 0 ? (
                      <div className="flex items-center gap-1">
                        <StepBtn onClick={() => dec(p)} aria-label="Decrease">
                          <Minus className="h-4 w-4" />
                        </StepBtn>
                        <span className="w-7 text-center text-sm font-bold text-ink-900">{qty}</span>
                        <StepBtn onClick={() => inc(p)} aria-label="Increase">
                          <Plus className="h-4 w-4" />
                        </StepBtn>
                      </div>
                    ) : (
                      <button
                        className="flex h-9 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
                        onClick={() => inc(p)}
                      >
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── SECONDARY: summary → customer dropdown → print ── */}
        <aside className="lg:col-span-2">
          <div className="card p-4 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                <ShoppingBag className="h-4 w-4" /> Order
              </h2>
              {itemCount > 0 && (
                <button className="text-xs font-medium text-ink-500 hover:text-red-600" onClick={clearAll}>
                  Clear
                </button>
              )}
            </div>

            {lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">
                Tap dishes on the left to build the order.
              </p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-ink-100">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink-700">
                        {l.name} <span className="text-ink-400">× {l.qty}</span>
                      </span>
                      <span className="font-medium tabular-nums text-ink-900">{formatINR(l.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-base font-bold text-ink-900">
                  <span>Total</span>
                  <span className="tabular-nums">{formatINR(total, true)}</span>
                </div>
              </>
            )}

            {/* Customer details — collapsible dropdown */}
            <div className="mt-4 rounded-lg border border-ink-200">
              <button
                type="button"
                onClick={() => setCustomerOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={customerOpen}
              >
                <span className="text-sm font-semibold text-ink-800">
                  Customer details
                  {college ? (
                    <span className="ml-2 font-normal text-ink-500">· {college}</span>
                  ) : (
                    <span className="ml-2 font-normal text-ink-400">optional</span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-500 transition-transform ${customerOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {customerOpen && (
                <div className="space-y-3 border-t border-ink-100 p-3">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone{' '}
                      <span className="font-normal text-ink-400">(optional)</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 px-3 text-sm text-ink-500">
                        +91
                      </span>
                      <input
                        className="input rounded-l-none"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" /> College
                    </label>
                    <select className="input" value={college} onChange={(e) => setCollege(e.target.value)}>
                      <option value="">Select college</option>
                      {COLLEGES.map((c) => (
                        <option key={c} value={c} disabled={c === 'VIT AP'}>
                          {c === 'VIT AP' ? `${c} — coming soon` : c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5" /> Note{' '}
                      <span className="font-normal text-ink-400">(optional)</span>
                    </label>
                    <textarea
                      className="input min-h-[56px] resize-y"
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Room number, landmark, less spicy…"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn-primary mt-4 hidden w-full py-3 lg:flex"
              disabled={itemCount === 0}
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Print ticket
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile sticky print bar */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold text-ink-900">
              {itemCount} item{itemCount === 1 ? '' : 's'} · {formatINR(total)}
            </p>
            {itemCount > 0 && !college && (
              <p className="text-xs text-amber-600">Add college in customer details</p>
            )}
          </div>
          <button className="btn-primary px-5 py-2.5" disabled={itemCount === 0} onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Printable receipt (hidden on screen) */}
      <Receipt lines={lines} total={total} phone={phone} college={college} note={note} at={printedAt} />
    </>
  );
}

function CatChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  );
}

function StepBtn({ children, ...rest }) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
      {...rest}
    >
      {children}
    </button>
  );
}

function Receipt({ lines, total, phone, college, note, at }) {
  const when = at ? formatDateTime(at) : formatDateTime(new Date().toISOString());
  return (
    <div className="print-receipt bg-white text-black">
      <div className="mx-auto max-w-[300px] p-2 font-mono text-[12px] leading-tight text-black">
        <div className="text-center">
          <p className="text-[18px] font-bold tracking-wide">VILASA CAFE</p>
          <p className="text-[11px]">Phone Order</p>
          <p className="text-[11px]">{when}</p>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        {phone && <p>Phone: +91 {phone}</p>}
        {college && <p>College: {college}</p>}

        <div className="my-2 border-t border-dashed border-black" />

        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="py-0.5 pr-1">{l.name}</td>
                <td className="py-0.5 text-center">{l.qty}</td>
                <td className="py-0.5 text-right tabular-nums">{formatINR(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatINR(total, true)}</span>
        </div>
        <p className="mt-1 text-[11px]">Payment: Cash on Delivery</p>

        {note && (
          <>
            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-[11px]">Note: {note}</p>
          </>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center text-[11px]">Thank you!</p>
      </div>
    </div>
  );
}
