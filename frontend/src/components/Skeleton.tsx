// Reusable skeleton primitives
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-md animate-pulse ${className}`} />;
}

// Skeleton for a single article card — mirrors the real card layout
export function ArticleCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
      {/* Category pill */}
      <SkeletonBlock className="h-5 w-20 rounded-full bg-emerald-100" />
      {/* Title */}
      <SkeletonBlock className="h-6 w-4/5" />
      {/* Body lines */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full bg-slate-100" />
        <SkeletonBlock className="h-4 w-3/4 bg-slate-100" />
      </div>
      {/* Meta */}
      <SkeletonBlock className="h-4 w-28 bg-slate-100" />
    </div>
  );
}

// Full homepage skeleton — search bar + category pills + article grid
export function HomePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-pulse">
      {/* Search bar */}
      <SkeletonBlock className="h-12 max-w-xl mx-auto rounded-full" />

      {/* Category pills */}
      <div className="flex justify-center gap-2 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Article grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Generic list skeleton (analytics, admin, etc.)
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
          <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-1/3 bg-slate-100" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Article detail skeleton
export function ArticleDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 animate-pulse">
      <SkeletonBlock className="h-5 w-24 rounded-full bg-emerald-100" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-10 w-3/4" />
      <div className="flex gap-4">
        <SkeletonBlock className="h-4 w-28 bg-slate-100" />
        <SkeletonBlock className="h-4 w-20 bg-slate-100" />
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className={`h-4 bg-slate-100 ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}
