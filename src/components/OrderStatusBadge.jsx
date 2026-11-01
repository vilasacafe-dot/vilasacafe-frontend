export const STATUS_LABELS = {
  PLACED:           'Order placed',
  ACCEPTED:         'Accepted',
  PREPARING:        'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED:        'Delivered',
  CANCELLED:        'Cancelled',
};

// Pill styles — each status has its own distinct colour so glance-reading
// is instant. Colour is never the only signal (the label is always present).
const STYLES = {
  PLACED:           'bg-amber-100  text-amber-800  border-amber-300',
  ACCEPTED:         'bg-blue-100   text-blue-800   border-blue-300',
  PREPARING:        'bg-orange-100 text-orange-800 border-orange-300',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800 border-violet-300',
  DELIVERED:        'bg-green-100  text-green-800  border-green-300',
  CANCELLED:        'bg-red-100    text-red-700    border-red-300',
};

const DOTS = {
  PLACED:           'bg-amber-500  animate-pulse',
  ACCEPTED:         'bg-blue-500',
  PREPARING:        'bg-orange-500 animate-pulse',
  OUT_FOR_DELIVERY: 'bg-violet-500 animate-pulse',
  DELIVERED:        'bg-green-500',
  CANCELLED:        'bg-red-500',
};

export default function OrderStatusBadge({ status, large = false }) {
  const sizeClass = large
    ? 'px-3.5 py-1.5 text-sm gap-2'
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${sizeClass} ${
        STYLES[status] || 'border-sand bg-cream text-espresso-600'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${DOTS[status] || 'bg-stone'}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
