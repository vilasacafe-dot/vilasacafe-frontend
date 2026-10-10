import { useState } from 'react';
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
      <div className={`relative overflow-hidden rounded-lg border border-ink-200 ${aspect}`}>
        <ProductImage src={value} alt="Preview" className="h-full w-full" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        )}
      </div>
      <label className="btn-secondary mt-2 w-full cursor-pointer">
        {value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
      <p className="mt-1 text-xs text-ink-400">Converted to WebP and optimized automatically.</p>
    </div>
  );
}
