const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format INR. Whole rupees by default; pass true for paise precision. */
export function formatINR(value, withPaise = false) {
  const n = Number(value) || 0;
  return (withPaise ? inrPaise : inr).format(n);
}

/** Format a timestamp in Asia/Kolkata. */
export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
}
