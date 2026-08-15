import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

// Convenient pre-built skeleton layouts
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32 shrink-0" />
      </div>
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 border-b border-white/10 p-4">
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="divide-y divide-white/5 p-4 space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
             <div key={i} className="flex gap-4 items-center pt-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-1/4" />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-panel p-6 w-full">
      <div className="flex gap-4 items-center mb-6">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="space-y-2 w-full">
           <Skeleton className="h-5 w-1/2" />
           <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
