import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminMenu() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');

  const [catModal, setCatModal] = useState(null); // {} for new, category for edit
  const [prodModal, setProdModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([api.admin.listCategories(), api.getProducts()]);
      setCategories(c.categories || []);
      setProducts(p.products || []);
    } catch (e) {
      toast.error('Could not refresh menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProducts = useMemo(() => {
    if (activeCat === 'all') return products;
    return products.filter((p) => p.category_id === activeCat);
  }, [products, activeCat]);

  async function deleteCategory(id) {
    if (!confirm('Delete this category? Products keep existing but become uncategorized.')) return;
    try {
      await api.admin.deleteCategory(id);
      toast.success('Category deleted.');
      // If we were viewing the deleted category, go back to "All".
      if (activeCat === id) setActiveCat('all');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function toggleCategory(cat) {
    try {
      await api.admin.updateCategory(cat.id, { is_active: !cat.is_active });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.admin.deleteProduct(id);
      toast.success('Product deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function toggleAvailability(p) {
    try {
      await api.admin.updateProduct(p.id, { is_available: !p.is_available });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: !x.is_available } : x)));
    } catch (e) {
      toast.error(e.message);
    }
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
        <h1 className="text-2xl font-bold text-ink-900">Menu</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setCatModal({})}>Add category</button>
          <button className="btn-primary" onClick={() => setProdModal({})}>Add product</button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setActiveCat('all')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              activeCat === 'all' ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-700'
            }`}
          >
            All products
          </button>
          {categories.map((c) => (
            <div key={c.id} className="flex items-center">
              <button
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  activeCat === c.id ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-700'
                } ${!c.is_active ? 'opacity-50' : ''}`}
              >
                {c.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Category management row (when a category is selected) */}
      {activeCat !== 'all' && (() => {
        const cat = categories.find((c) => c.id === activeCat);
        if (!cat) return null;
        return (
          <div className="card flex items-center justify-between p-3 text-sm">
            <span className="font-medium text-ink-700">
              {cat.name} {cat.is_active ? '' : '(hidden)'}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => toggleCategory(cat)}>
                {cat.is_active ? 'Disable' : 'Enable'}
              </button>
              <button className="btn-ghost" onClick={() => setCatModal(cat)}>Edit</button>
              <button className="btn-danger" onClick={() => deleteCategory(cat.id)}>Delete</button>
            </div>
          </div>
        );
      })()}

      {visibleProducts.length === 0 ? (
        <EmptyState
          title="No products"
          message="Add your first product to this menu."
          action={<button className="btn-primary" onClick={() => setProdModal({})}>Add product</button>}
        />
      ) : (
        <div className="card divide-y divide-ink-100">
          {visibleProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <ProductImage src={p.image_url} alt={p.name} className="h-14 w-14 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink-900">{p.name}</span>
                  {p.is_featured && <span className="badge bg-brand-100 text-brand-700">Popular</span>}
                </div>
                <p className="text-sm text-ink-500">{formatINR(p.price)}</p>
              </div>
              <button
                onClick={() => toggleAvailability(p)}
                className={`badge ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-500'}`}
              >
                {p.is_available ? 'Available' : 'Unavailable'}
              </button>
              <button className="btn-ghost" onClick={() => setProdModal(p)}>Edit</button>
              <button className="btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {catModal && (
        <CategoryModal
          category={catModal}
          onClose={() => setCatModal(null)}
          onSaved={() => {
            setCatModal(null);
            load();
          }}
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

function CategoryModal({ category, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(category.id);
  const [name, setName] = useState(category.name || '');
  const [slug, setSlug] = useState(category.slug || '');
  const [order, setOrder] = useState(category.display_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [touchedSlug, setTouchedSlug] = useState(isEdit);

  async function save() {
    if (!name.trim()) return toast.error('Enter a category name.');
    const finalSlug = (touchedSlug ? slug : slugify(name)) || slugify(name);
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: finalSlug, display_order: Number(order) };
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
      title={isEdit ? 'Edit category' : 'Add category'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Slug</label>
          <input
            className="input"
            value={touchedSlug ? slug : slugify(name)}
            onChange={(e) => {
              setTouchedSlug(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <label className="label">Display order</label>
          <input type="number" className="input" value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const toast = useToast();
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

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Enter a product name.');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Enter a valid price.');
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
      wide
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Save product'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <ImageUpload
            value={form.image_url}
            kind="product"
            onUploaded={({ key, url }) => setForm((f) => ({ ...f, image_key: key, image_url: url }))}
          />
        </div>
        <div className="space-y-4 sm:col-span-1">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea className="input min-h-[70px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} />
            Available
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
            Featured / Popular
          </label>
        </div>
      </div>
    </Modal>
  );
}
