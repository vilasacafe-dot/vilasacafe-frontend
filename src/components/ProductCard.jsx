import { Plus } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import Price from './ui/Price.jsx';
import { useCart } from '../context/CartContext.jsx';

/**
 * Premium cafe menu card.
 *  - layout="grid" (default): image-led tile for discovery grids.
 *  - layout="list": image-left row, good for longer names / dense lists.
 */
export default function ProductCard({ product, layout = 'grid' }) {
  const { getQuantity, addItem, decrement } = useCart();
  const qty = getQuantity(product.id);
  const unavailable = !product.is_available;

  const AddControl = ({ size = 'sm' }) =>
    unavailable ? (
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">Sold out</span>
    ) : qty > 0 ? (
      <div className="animate-fade-in">
        <QuantityStepper
          size={size}
          quantity={qty}
          onIncrement={() => addItem(product)}
          onDecrement={() => decrement(product.id)}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => addItem(product)}
        className="inline-flex items-center gap-1.5 rounded-full bg-espresso-700 py-2 pl-3 pr-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-espresso-600 active:scale-95"
        aria-label={`Add ${product.name} to cart`}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add
      </button>
    );

  if (layout === 'list') {
    return (
      <div className="group flex items-stretch gap-3 rounded-2xl border border-sand bg-white p-2.5 shadow-cafe">
        <div className="relative shrink-0">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            bgClass="bg-cream"
            className="h-24 w-24 rounded-xl"
          />
          {unavailable && <SoldOutOverlay rounded="rounded-xl" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <h3 className="text-[15px] font-semibold leading-snug text-espresso-700">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone">
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <Price value={product.price} />
            <AddControl size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-cafe transition-shadow duration-200 md:hover:shadow-lift">
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          bgClass="bg-cream"
          className="aspect-[4/3] w-full md:group-hover:scale-[1.03] md:transition-transform md:duration-500"
        />
        {product.is_featured && !unavailable && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-terracotta-600 shadow-sm backdrop-blur">
            Popular
          </span>
        )}
        {unavailable && <SoldOutOverlay />}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-espresso-700">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Price value={product.price} />
          <AddControl size="sm" />
        </div>
      </div>
    </div>
  );
}

function SoldOutOverlay({ rounded = '' }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-ivory/70 backdrop-blur-[1px] ${rounded}`}
    >
      <span className="rounded-full bg-espresso-700 px-3 py-1 text-xs font-semibold text-ivory">
        Sold out
      </span>
    </div>
  );
}
