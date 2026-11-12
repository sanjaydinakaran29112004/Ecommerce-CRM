import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export function DataTable({
  columns,
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onRowClick,
  className,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={cn(
                    'py-3.5 px-4 font-semibold select-none',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  <div className={cn(
                    'flex items-center gap-1.5',
                    col.align === 'right' && 'justify-end',
                    col.align === 'center' && 'justify-center'
                  )}>
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {data.map((row, rowIndex) => (
              <tr
                key={row._id || row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors duration-100 hover:bg-slate-50/80',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIndex) => {
                  const value = col.accessor ? row[col.accessor] : null;
                  return (
                    <td
                      key={col.key || colIndex}
                      className={cn(
                        'py-3.5 px-4 align-middle',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.cellClassName
                      )}
                    >
                      {col.render ? col.render(value, row, rowIndex) : (value ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-medium text-slate-700">{pagination.from || 1}</span> to{' '}
            <span className="font-medium text-slate-700">{pagination.to || data.length}</span> of{' '}
            <span className="font-medium text-slate-700">{pagination.total || data.length}</span> results
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(1)}
              className="p-1.5"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => pagination.onPageChange(pagination.totalPages || 1)}
              className="p-1.5"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

