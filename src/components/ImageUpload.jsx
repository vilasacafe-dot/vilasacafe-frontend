import { useState } from 'react';
import { ImageUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from './Spinner.jsx';
import ProductImage from './ProductImage.jsx';

/**
 * Uploads an image to the backend (which converts to WebP + stores in R2).
 * Calls onUploaded({ key, url }). Shows a live preview + progress state.
 *
 * @param {'product'|'banner'} kind
 */
export default function ImageUpload({ value, onUploaded, kind = 'product', aspect = 'aspect-[4/3]' }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Choose a file under 10 MB.');
      return;
    }
    setUploading(true);
    try {
      const res = await api.admin.uploadImage(file, kind);
      onUploaded({ key: res.key, url: res.url });
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className={`relative overflow-hidden rounded-xl border border-sand bg-cream ${aspect}`}>
        <ProductImage src={value} alt="Preview" className="h-full w-full" bgClass="bg-cream" />
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/75">
            <Spinner className="h-6 w-6 text-terracotta-500" />
            <span className="text-xs font-semibold text-stone">Uploading…</span>
          </div>
        )}
      </div>
      <label
        className={`btn-secondary mt-2 w-full cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <ImageUp className="h-4 w-4" />
        {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
      <p className="mt-1 text-xs text-stone/80">Converted to WebP and optimized automatically.</p>
    </div>
  );
}
