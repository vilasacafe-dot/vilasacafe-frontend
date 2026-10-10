import { formatINR } from '../../lib/format.js';

/**
 * Consistent price display for the customer UI. Terracotta by default.
 */
export default function Price({ value, withPaise = false, className = '', tone = 'accent' }) {
  const toneClass =
    tone === 'ink'
      ? 'text-espresso-700'
      : tone === 'muted'
      ? 'text-stone'
      : 'text-terracotta-600';
  return (
    <span className={`font-bold tabular-nums ${toneClass} ${className}`}>
      {formatINR(value, withPaise)}
    </span>
  );
}
