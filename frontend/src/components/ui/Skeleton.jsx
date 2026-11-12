import React from 'react';
import { cn } from '@/utils/cn';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden p-4 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
