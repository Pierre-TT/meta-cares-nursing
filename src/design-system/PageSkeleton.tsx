import { Skeleton, SkeletonCard } from './Skeleton';

export function PageSkeleton() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-20" rounded="lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl p-4 flex items-center gap-3"
          >
            <Skeleton className="h-10 w-10" rounded="lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Card skeletons */}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
