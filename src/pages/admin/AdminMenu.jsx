import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { formatINR } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import Switch from '../../components/Switch.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminMenu() {
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const [catsModal, setCatsModal] = useState(false);
  const [prodModal, setProdModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([api.admin.listCategories(), api.getProducts()]);
      setCategories(c.categories || []);
      setProducts(p.products || []);
    } catch {
      toast.error('Could not refresh menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const catName = useCallback(
    (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized',
    [categories]
  );

  const visibleProducts = useMemo(() => {
    let list = products;
    if (activeCat !== 'all') list = list.filter((p) => p.category_id === activeCat);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [products, activeCat, search]);

  async function deleteProduct(p) {
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      message: 'This permanently removes the product from the menu.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.admin.deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success('Product deleted.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  /**
   * Availability toggle — optimistic with rollback. The backend remains
   * authoritative; we reconcile with its response. A per-product pending
   * guard prevents conflicting taps.
   */
  async function toggleAvailability(p, next) {
    if (pendingIds.has(p.id)) return;
    setPendingIds((s) => new Set(s).add(p.id));
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: next } : x)));
    try {
      const res = await api.admin.updateProduct(p.id, { is_available: next });
      const confirmed = res?.product?.is_available ?? next;
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: confirmed } : x)));
      toast.success(confirmed ? `${p.name} is available` : `${p.name} marked out of stock`);
    } catch (e) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: !next } : x)));
      toast.error(e.message || 'Could not update availability.');
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
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
          <h1 className="text-xl font-bold text-espresso-700">Menu</h1>
          <p className="text-sm text-stone">
            {products.length} product{products.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setCatsModal(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Categories
          </button>
          <button className="btn-primary btn-sm" onClick={() => setProdModal({})}>
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <input
          type="search"
          className="input pl-9"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
        <div className="flex gap-2 pb-1">
          <FilterChip label="All" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              dim={!c.is_active}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Product list */}
      {visibleProducts.length === 0 ? (
        <EmptyState
          title={search ? 'No matches' : 'No products'}
          message={search ? 'Try a different search.' : 'Add your first product to this menu.'}
          action={
            !search && (
              <button className="btn-primary" onClick={() => setProdModal({})}>
                <Plus className="h-4 w-4" /> Add product
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visibleProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              categoryName={catName(p.category_id)}
              pending={pendingIds.has(p.id)}
              onToggle={(next) => toggleAvailability(p, next)}
              onEdit={() => setProdModal(p)}
              onDelete={() => deleteProduct(p)}
            />
          ))}
        </ul>
      )}

      {catsModal && (
        <CategoriesModal
          categories={categories}
          onClose={() => setCatsModal(false)}
          onChanged={load}
        />
      )}
      {prodModal && (
        <ProductModal
          product={prodModal}
          categories={categories}
          onClose={() => setProdModal(null)}
          onSaved={() => {
            setProdModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, dim, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[38px] whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
        active
          ? 'bg-espresso-700 text-white'
          : 'border border-sand bg-white text-espresso-600 hover:bg-cream'
      } ${dim && !active ? 'opacity-50' : ''}`}
    >
      {label}
    </button>
  );
}

function ProductRow({ product: p, categoryName, pending, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li className="card overflow-hidden">
      <div className="flex gap-3 p-3">
        <ProductImage src={p.image_url} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl" bgClass="bg-cream" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-espresso-700 break-words">{p.name}</p>
              <p className="mt-0.5 text-xs text-stone">
                {categoryName}
                {p.is_featured && (
                  <span className="badge badge-accent ml-1.5 align-middle">Popular</span>
                )}
              </p>
            </div>
            <p className="shrink-0 font-bold text-espresso-700">{formatINR(p.price)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-sand px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={!!p.is_available}
            busy={pending}
            onChange={onToggle}
            label={
              p.is_available ? `Mark ${p.name} as out of stock` : `Mark ${p.name} as available`
            }
          />
          <span
            className={`text-xs font-bold ${p.is_available ? 'text-sage-700' : 'text-stone'}`}
          >
            {p.is_available ? 'Available' : 'Out of stock'}
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
              aria-label={`More actions for ${p.name}`}
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
                    <Trash2 className="h-4 w-4" /> Delete product
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

/* ─────────────────────────── Product form ─────────────────────────── */

function ProductModal({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const isEdit = Boolean(product.id);
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price ?? '',
    category_id: product.category_id || (categories[0]?.id ?? ''),
    is_available: product.is_available ?? true,
    is_featured: product.is_featured ?? false,
    image_key: product.image_key || null,
    image_url: product.image_url || null,
  });
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  function set(k, v) {
    dirty.current = true;
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function attemptClose() {
    if (saving) return;
    if (dirty.current) {
      const ok = await confirm({
        title: 'Discard changes?',
        message: 'Your edits to this product will be lost.',
        confirmLabel: 'Discard',
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Enter a product name.');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Enter a valid price.');
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        category_id: form.category_id || null,
        is_available: form.is_available,
        is_featured: form.is_featured,
        image_key: form.image_key,
        image_url: form.image_url,
      };
      if (isEdit) await api.admin.updateProduct(product.id, payload);
      else await api.admin.createProduct(payload);
      dirty.current = false;
      toast.success('Product saved.');
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
      fullScreen
      onClose={attemptClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={attemptClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-lg space-y-4">
        <ImageUpload
          value={form.image_url}
          kind="product"
          onUploaded={({ key, url }) => {
            dirty.current = true;
            setForm((f) => ({ ...f, image_key: key, image_url: url }));
          }}
        />
        <div>
          <label className="label" htmlFor="p-name">Name</label>
          <input id="p-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="p-price">Price (₹)</label>
          <input
            id="p-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="input"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="p-cat">Category</label>
          <select id="p-cat" className="input" value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p-desc">Description</label>
          <textarea
            id="p-desc"
            className="input min-h-[90px] resize-y"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Short description shown to customers (optional)"
          />
        </div>

        <ToggleRow
          label="Available to order"
          hint="Turn off to mark out of stock"
          checked={form.is_available}
          onChange={(v) => set('is_available', v)}
          switchLabel="Product available to order"
        />
        <ToggleRow
          label="Featured / Popular"
          hint="Highlighted on the customer menu"
          checked={form.is_featured}
          onChange={(v) => set('is_featured', v)}
          switchLabel="Mark product as featured"
        />
      </div>
    </Modal>
  );
}

function ToggleRow({ label, hint, checked, onChange, switchLabel }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-espresso-700">{label}</p>
        {hint && <p className="text-xs text-stone">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={switchLabel} />
    </div>
  );
}

/* ─────────────────────── Categories manager ─────────────────────── */

function CategoriesModal({ categories, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [list, setList] = useState(() => [...categories].sort((a, z) => a.display_order - z.display_order));
  const [editing, setEditing] = useState(null); // category or {} for new
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const c = await api.admin.listCategories();
    const next = (c.categories || []).sort((a, z) => a.display_order - z.display_order);
    setList(next);
    onChanged?.();
  }, [onChanged]);

  async function toggle(cat) {
    try {
      await api.admin.updateCategory(cat.id, { is_active: !cat.is_active });
      setList((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c)));
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function move(cat, dir) {
    const idx = list.findIndex((c) => c.id === cat.id);
    const swap = list[idx + dir];
    if (!swap || busy) return;
    const next = [...list];
    next[idx] = swap;
    next[idx + dir] = cat;
    setList(next);
    setBusy(true);
    try {
      await api.admin.reorderCategories(next.map((c, idx) => ({ id: c.id, display_order: idx })));
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(cat) {
    const ok = await confirm({
      title: `Delete "${cat.name}"?`,
      message: 'Products in this category stay on the menu but become uncategorized.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.admin.deleteCategory(cat.id);
      setList((prev) => prev.filter((c) => c.id !== cat.id));
      onChanged?.();
      toast.success('Category deleted.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="Manage categories"
        footer={
          <button className="btn-secondary w-full" onClick={onClose}>Done</button>
        }
      >
        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Add category
          </button>

          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {list.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2 py-2.5">
                  <div className="flex flex-col">
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded text-stone hover:bg-cream disabled:opacity-30"
                      onClick={() => move(c, -1)}
                      disabled={i === 0 || busy}
                      aria-label={`Move ${c.name} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded text-stone hover:bg-cream disabled:opacity-30"
                      onClick={() => move(c, 1)}
                      disabled={i === list.length - 1 || busy}
                      aria-label={`Move ${c.name} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-espresso-700">
                    {c.name}
                    {!c.is_active && <span className="ml-1.5 text-xs font-normal text-stone">(hidden)</span>}
                  </span>
                  <Switch
                    checked={!!c.is_active}
                    onChange={() => toggle(c)}
                    label={c.is_active ? `Hide ${c.name}` : `Show ${c.name}`}
                  />
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-stone hover:bg-cream"
                    onClick={() => setEditing(c)}
                    aria-label={`Rename ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    onClick={() => remove(c)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {editing && (
        <CategoryEditModal
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function CategoryEditModal({ category, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(category.id);
  const [name, setName] = useState(category.name || '');
  const [order, setOrder] = useState(category.display_order ?? 0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error('Enter a category name.');
    if (saving) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: slugify(name), display_order: Number(order) || 0 };
      if (isEdit) await api.admin.updateCategory(category.id, payload);
      else await api.admin.createCategory(payload);
      toast.success('Category saved.');
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
      onClose={onClose}
      title={isEdit ? 'Rename category' : 'Add category'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="c-order">Display order</label>
          <input
            id="c-order"
            type="number"
            inputMode="numeric"
            className="input"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone">Lower numbers appear first.</p>
        </div>
      </div>
    </Modal>
  );
}
