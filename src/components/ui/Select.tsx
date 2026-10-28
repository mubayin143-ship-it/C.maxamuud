/**
 * SmartEducate Canonical Select Primitive
 * Touch-friendly dropdown selector with RTL orientation and error states.
 */

import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      helperText,
      error,
      id,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-base font-bold text-[#1E1B4B] mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={`w-full h-12 sm:h-13 appearance-none rounded-2xl border bg-white ps-4 pe-11 text-base text-[#1E1B4B] transition-colors duration-150 focus:outline-none focus:ring-3 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
              hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[#EDE8F5] hover:border-[#DDD6FE]'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute end-4 flex items-center pointer-events-none text-slate-500">
            <ChevronDown className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {hasError ? (
          <p id={errorId} className="mt-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-2 text-sm text-slate-500 leading-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
