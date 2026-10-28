/**
 * SmartEducate Canonical Input Primitive
 * Responsive text input with touch target height (≥48px), accessible label/error binding, and RTL support.
 */

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-base font-bold text-[#1E1B4B] dark:text-slate-200 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute start-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={`w-full h-12 sm:h-13 rounded-2xl border bg-white dark:bg-slate-900 px-4 text-base text-[#1E1B4B] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-150 focus:outline-none focus:ring-3 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] dark:focus:border-purple-400 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600 ${
              leftIcon ? 'ps-11' : ''
            } ${rightIcon ? 'pe-11' : ''} ${
              hasError
                ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[#EDE8F5] dark:border-slate-800 hover:border-[#DDD6FE] dark:hover:border-purple-800'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute end-4 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
