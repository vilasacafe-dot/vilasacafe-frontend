import { useRef, useEffect } from 'react';

/**
 * Horizontally scrollable category chips with a clear selected state.
 * Controlled via `active` (slug) + `onSelect(slug)`. Includes an "All" chip
 * when `showAll` is set. The active chip auto-scrolls into view.
 */
export default function CategoryNav({ categories = [], active = 'all', onSelect, showAll = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  const chips = showAll ? [{ slug: 'all', name: 'All' }, ...categories] : categories;

  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {chips.map((c) => {
        const isActive = active === c.slug;
        return (
          <button
            key={c.slug}
            data-active={isActive}
            onClick={() => onSelect?.(c.slug)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-espresso-700 bg-espresso-700 text-ivory'
                : 'border-sand bg-white text-espresso-600 hover:border-espresso-300'
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
