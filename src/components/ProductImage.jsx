/**
 * Image with a graceful fallback when no URL exists or it fails to load.
 * `bgClass` controls the surface behind the image/fallback. The default
 * (bg-ink-100) preserves the admin preview appearance; the customer UI
 * passes a warm cream surface.
 */
import { useState } from 'react';

export default function ProductImage({
  src,
  alt,
  className = '',
  bgClass = 'bg-ink-100',
  loading = 'lazy',
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = src && !failed;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${bgClass} ${className}`}>
      {show ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          ref={(el) => {
            // If the browser already has the image in cache, onLoad won't fire.
            if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={() => setFailed(true)}
        />
      ) : (
        <svg className="h-8 w-8 text-ink-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
