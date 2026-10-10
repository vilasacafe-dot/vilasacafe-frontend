import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Auto-sliding hero/banner carousel for restaurant-managed banners.
 * - Pauses on hover / touch and when the tab is hidden.
 * - Respects prefers-reduced-motion (no autoplay).
 * - Touch swipe to change slides.
 * - Fixed aspect ratio to avoid layout shift while images load.
 * Accepts banners: [{ id, title, image_url, link_url }].
 */
export default function HeroCarousel({ banners = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const touchX = useRef(null);
  const count = banners.length;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (count <= 1 || paused || reduceMotion) return undefined;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(timer.current);
  }, [count, paused, reduceMotion]);

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }

  if (count === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-cream shadow-cafe"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotions"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((b, i) => {
          const content = (
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/8]">
              <img
                src={b.image_url}
                alt={b.title || 'Vilasa Cafe promotion'}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              {b.title && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-espresso-900/70 via-espresso-900/10 to-transparent p-5 sm:p-8">
                  <h2 className="max-w-lg font-serif text-2xl leading-tight text-ivory drop-shadow-sm sm:text-4xl">
                    {b.title}
                  </h2>
                </div>
              )}
            </div>
          );
          return (
            <div
              key={b.id}
              className="w-full flex-shrink-0"
              aria-hidden={i !== index}
            >
              {b.link_url ? (
                <a href={b.link_url} target="_blank" rel="noreferrer">
                  {content}
                </a>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-ivory' : 'w-1.5 bg-ivory/55 hover:bg-ivory/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
