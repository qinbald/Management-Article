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
    <div className="max-w-4xl mx-auto glass-card p-8 md:p-12 space-y-6 animate-pulse">
      <SkeletonBlock className="h-4 w-32" />
      <div className="space-y-3 border-b border-white/10 pb-6">
        <SkeletonBlock className="h-5 w-24 rounded-full bg-emerald-100" />
        <SkeletonBlock className="h-10 w-4/5" />
        <div className="flex gap-4">
          <SkeletonBlock className="h-4 w-36 bg-slate-100" />
          <SkeletonBlock className="h-4 w-28 bg-slate-100" />
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className={`h-4 bg-slate-100 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

// Analytics dashboard skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Title */}
      <div className="glass-card p-6 space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-3 w-48 bg-slate-100" />
      </div>

      {/* 6 Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* 2 Big cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <SkeletonBlock className="h-5 w-44 border-b border-white/10 pb-2" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center py-2 border-b border-white/10">
                  <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-4 w-3/4" />
                    <SkeletonBlock className="h-3 w-1/4 bg-slate-100" />
                  </div>
                  <SkeletonBlock className="h-10 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin dashboard skeleton
export function AdminSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* 2 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-2 text-center">
          <SkeletonBlock className="h-10 w-24 mx-auto" />
          <SkeletonBlock className="h-3 w-32 mx-auto bg-slate-100" />
        </div>
        <div className="glass-card p-6 space-y-2 text-center">
          <SkeletonBlock className="h-10 w-24 mx-auto" />
          <SkeletonBlock className="h-3 w-32 mx-auto bg-slate-100" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <SkeletonBlock className="h-8 w-36" />
        <SkeletonBlock className="h-8 w-36" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-8 space-y-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 gap-4">
              <SkeletonBlock className="h-4 w-8" />
              <SkeletonBlock className="h-4 flex-1" />
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-6 w-16 rounded" />
              <SkeletonBlock className="h-6 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Profile page skeleton
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Profile Card */}
      <div className="glass-card p-8">
        <div className="flex flex-wrap gap-6 items-center">
          <SkeletonBlock className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-36 bg-slate-100" />
            <div className="flex gap-3">
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* User Articles */}
      <div className="glass-card p-8 space-y-4">
        <SkeletonBlock className="h-6 w-36 border-b border-white/10 pb-2" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-white/10 rounded-xl">
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/3 bg-slate-100" />
              </div>
              <SkeletonBlock className="h-7 w-16 rounded-lg ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
