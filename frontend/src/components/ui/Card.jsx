import React from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, title, subtitle, action, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      <div>
        {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

