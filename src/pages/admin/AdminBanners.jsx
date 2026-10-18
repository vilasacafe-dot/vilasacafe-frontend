import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Images } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import Switch from '../../components/Switch.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';

export default function AdminBanners() {
  const toast = useToast();
  const confirm = useConfirm();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.admin.listBanners();
      setBanners(r.banners || []);
    } catch (e) {
      toast.error(e.message || 'Could not load banners.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = banners.filter((b) => b.is_active).length;

  async function toggle(b, next) {
    if (next && activeCount >= 3) {
      toast.error('Maximum of 3 active banners. Deactivate one first.');
      return;
    }
    try {
      await api.admin.updateBanner(b.id, { is_active: next });
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: next } : x)));
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

  async function remove(b) {
    const ok = await confirm({
      title: 'Delete this banner?',
      message: 'It will be removed from the homepage carousel.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.admin.deleteBanner(b.id);
      setBanners((prev) => prev.filter((x) => x.id !== b.id));
      toast.success('Banner deleted.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-terracotta-500" />
      </div>
    );
  }

  const sorted = [...banners].sort((a, z) => a.display_order - z.display_order);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-espresso-700">Hero banners</h1>
          <p className="text-sm text-stone">{activeCount}/3 active on the homepage</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No banners"
          message="Add up to 3 hero banners for the homepage carousel."
          icon={<Images className="h-8 w-8" />}
          action={
            <button className="btn-primary" onClick={() => setModal({})}>
              <Plus className="h-4 w-4" /> Add banner
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((b, i) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="relative aspect-[16/6] w-full bg-cream">
                <img src={b.image_url} alt={b.title || 'Banner'} className="h-full w-full object-cover" />
                {b.title && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-espresso-900/55 to-transparent p-4">
                    <span className="font-display text-lg font-bold text-white break-words">{b.title}</span>
                  </div>
                )}
                <span
                  className={`badge absolute right-3 top-3 ${
                    b.is_active ? 'badge-success' : 'bg-espresso-900/80 text-white'
                  }`}
                >
                  {b.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!b.is_active}
                    onChange={(next) => toggle(b, next)}
                    label={b.is_active ? `Hide banner ${i + 1}` : `Show banner ${i + 1}`}
                  />
                  <span className={`text-xs font-bold ${b.is_active ? 'text-sage-700' : 'text-stone'}`}>
                    {b.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand bg-white text-stone hover:bg-cream disabled:opacity-30"
                    onClick={() => move(b, -1)}
                    disabled={i === 0}
                    aria-label="Move banner up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand bg-white text-stone hover:bg-cream disabled:opacity-30"
                    onClick={() => move(b, 1)}
                    disabled={i === sorted.length - 1}
                    aria-label="Move banner down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => setModal(b)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    onClick={() => remove(b)}
                    aria-label="Delete banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
  const confirm = useConfirm();
  const isEdit = Boolean(banner.id);
  const [form, setForm] = useState({
    title: banner.title || '',
    link_url: banner.link_url || '',
    is_active: banner.is_active ?? true,
    image_key: banner.image_key || null,
    image_url: banner.image_url || null,
  });
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  function set(patch) {
    dirty.current = true;
    setForm((f) => ({ ...f, ...patch }));
  }

  async function attemptClose() {
    if (saving) return;
    if (dirty.current) {
      const ok = await confirm({
        title: 'Discard changes?',
        confirmLabel: 'Discard',
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  }

  async function save() {
    if (!form.image_url || !form.image_key) return toast.error('Upload a banner image first.');
    if (form.is_active && !banner.is_active && activeCount >= 3) {
      return toast.error('Maximum of 3 active banners. Deactivate one first.');
    }
    if (saving) return;
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
      dirty.current = false;
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
      fullScreen
      onClose={attemptClose}
      title={isEdit ? 'Edit banner' : 'Add banner'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={attemptClose} disabled={saving}>Cancel</button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : 'Save banner'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-lg space-y-4">
        <ImageUpload
          value={form.image_url}
          kind="banner"
          aspect="aspect-[16/6]"
          onUploaded={({ key, url }) => set({ image_key: key, image_url: url })}
        />
        <div>
          <label className="label" htmlFor="b-title">Title (optional)</label>
          <input id="b-title" className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="b-link">Link URL (optional)</label>
          <input
            id="b-link"
            className="input"
            value={form.link_url}
            onChange={(e) => set({ link_url: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-espresso-700">Active on homepage</p>
            <p className="text-xs text-stone">Up to 3 banners can be active</p>
          </div>
          <Switch checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Banner active on homepage" />
        </div>
      </div>
    </Modal>
  );
}
