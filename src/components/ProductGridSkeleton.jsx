/**
 * Loading skeletons that match the final product grid layout to avoid
 * layout shift. Uses the warm cafe skeleton surface.
 */
export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-sand bg-white">
          <div className="cafe-skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-3.5">
            <div className="cafe-skeleton h-4 w-3/4 rounded" />
            <div className="mt-3 flex items-center justify-between">
              <div className="cafe-skeleton h-5 w-1/3 rounded" />
              <div className="cafe-skeleton h-8 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
