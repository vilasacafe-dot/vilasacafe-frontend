import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';

export default function AdminBanners() {
  const toast = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    const r = await api.admin.listBanners();
    setBanners(r.banners || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = banners.filter((b) => b.is_active).length;

  async function toggle(b) {
    if (!b.is_active && activeCount >= 3) {
      toast.error('Maximum of 3 active banners. Deactivate one first.');
      return;
    }
    try {
      await api.admin.updateBanner(b.id, { is_active: !b.is_active });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function move(b, direction) {
    const sorted = [...banners].sort((a, z) => a.display_order - z.display_order);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    try {
      await Promise.all([
        api.admin.updateBanner(b.id, { display_order: swapWith.display_order }),
        api.admin.updateBanner(swapWith.id, { display_order: b.display_order }),
      ]);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this banner?')) return;
    try {
      await api.admin.deleteBanner(id);
      toast.success('Banner deleted.');
      load();
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

  const sorted = [...banners].sort((a, z) => a.display_order - z.display_order);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Hero banners</h1>
          <p className="text-sm text-ink-500">{activeCount}/3 active on the homepage.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>Add banner</button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No banners"
          message="Add up to 3 hero banners for the homepage carousel."
          action={<button className="btn-primary" onClick={() => setModal({})}>Add banner</button>}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((b, i) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="relative aspect-[16/6] w-full bg-ink-100">
                <img src={b.image_url} alt={b.title || 'Banner'} className="h-full w-full object-cover" />
                {b.title && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink-900/50 to-transparent p-4">
                    <span className="font-display text-lg font-bold text-white">{b.title}</span>
                  </div>
                )}
                <span className={`badge absolute right-3 top-3 ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-ink-900/80 text-white'}`}>
                  {b.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 p-3">
                <button className="btn-ghost" onClick={() => move(b, -1)} disabled={i === 0}>↑</button>
                <button className="btn-ghost" onClick={() => move(b, 1)} disabled={i === sorted.length - 1}>↓</button>
                <div className="flex-1" />
                <button className="btn-ghost" onClick={() => toggle(b)}>{b.is_active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn-ghost" onClick={() => setModal(b)}>Replace / edit</button>
                <button className="btn-danger" onClick={() => remove(b.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <BannerModal
          banner={modal}
          activeCount={activeCount}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BannerModal({ banner, activeCount, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(banner.id);
  const [form, setForm] = useState({
    title: banner.title || '',
    link_url: banner.link_url || '',
    is_active: banner.is_active ?? true,
    image_key: banner.image_key || null,
    image_url: banner.image_url || null,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.image_url || !form.image_key) return toast.error('Upload a banner image first.');
    if (form.is_active && !banner.is_active && activeCount >= 3) {
      return toast.error('Maximum of 3 active banners. Deactivate one first.');
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || null,
        link_url: form.link_url.trim() || null,
        is_active: form.is_active,
        image_key: form.image_key,
        image_url: form.image_url,
      };
      if (isEdit) await api.admin.updateBanner(banner.id, payload);
      else await api.admin.createBanner({ ...payload, display_order: Date.now() % 100000 });
      toast.success('Banner saved.');
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
      title={isEdit ? 'Edit banner' : 'Add banner'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Save banner'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <ImageUpload
          value={form.image_url}
          kind="banner"
          aspect="aspect-[16/6]"
          onUploaded={({ key, url }) => setForm((f) => ({ ...f, image_key: key, image_url: url }))}
        />
        <div>
          <label className="label">Title (optional)</label>
          <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="label">Link URL (optional)</label>
          <input className="input" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://…" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          Active on homepage
        </label>
      </div>
    </Modal>
  );
}
