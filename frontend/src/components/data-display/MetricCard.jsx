import React from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delta,
  deltaType = 'increase', // 'increase' | 'decrease' | 'neutral'
  className,
}) {
  const isPositive = deltaType === 'increase';
  const isNegative = deltaType === 'decrease';

  return (
    <Card className={cn('p-5 hover:border-slate-300 transition-all duration-200', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center font-semibold px-1.5 py-0.5 rounded-md',
                isPositive && 'text-emerald-700 bg-emerald-50',
                isNegative && 'text-rose-700 bg-rose-50',
                !isPositive && !isNegative && 'text-slate-600 bg-slate-100'
              )}
            >
              {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {delta}
            </span>
          )}
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}

