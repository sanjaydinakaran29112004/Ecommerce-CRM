import React from 'react';
import { cn } from '@/utils/cn';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative rounded-lg shadow-2xs">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
            'transition-colors duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-0',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
