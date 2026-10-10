export const STATUS_LABELS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Each status pairs a dot colour with the pill, so status is never
// communicated by colour alone (the label is always present).
const STYLES = {
  PLACED: 'bg-amber-50 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-sky-50 text-sky-800 border-sky-200',
  PREPARING: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-sage-50 text-sage-800 border-sage-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const DOTS = {
  PLACED: 'bg-amber-500',
  ACCEPTED: 'bg-sky-500',
  PREPARING: 'bg-terracotta-500',
  OUT_FOR_DELIVERY: 'bg-indigo-500',
  DELIVERED: 'bg-sage-500',
  CANCELLED: 'bg-red-500',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STYLES[status] || 'border-sand bg-cream text-espresso-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] || 'bg-stone'}`} aria-hidden="true" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
