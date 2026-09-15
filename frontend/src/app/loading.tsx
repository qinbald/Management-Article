export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="h-12 bg-slate-200/70 rounded-full max-w-xl mx-auto" />

      {/* Category Pills Skeleton */}
      <div className="flex justify-center gap-2 flex-wrap">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-slate-200/70 rounded-full" />
        ))}
      </div>

      {/* Article Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
            <div className="h-4 w-20 bg-emerald-100 rounded-full" />
            <div className="h-6 w-4/5 bg-slate-200 rounded-md" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-24 bg-slate-100 rounded pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
