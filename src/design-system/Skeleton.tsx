import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const r = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-2xl', full: 'rounded-full' };
  return <div className={cn('animate-shimmer', r[rounded], className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
