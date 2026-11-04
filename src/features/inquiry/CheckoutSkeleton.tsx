/** Placeholder with the checkout's two-column shape, shown while the saved hive loads from the browser. */
export function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Loading your hive" className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      <div className="h-[34rem] animate-pulse rounded-3xl border border-cream-50/10 bg-forest-900/60 motion-reduce:animate-none" />
      <div className="h-80 animate-pulse rounded-3xl border border-gold-400/20 bg-forest-800/60 motion-reduce:animate-none" />
    </div>
  );
}
