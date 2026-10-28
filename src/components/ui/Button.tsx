/**
 * SmartEducate Canonical Button Primitive
 * Mobile-first touch target sizes (≥48px on default/md), high-contrast text, and accessible focus states.
 * Aligned with the Educate-inspired visual language.
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap shrink-0';

    const sizeStyles = {
      sm: 'h-10 px-4 text-xs sm:text-sm gap-2 rounded-xl',
      md: 'h-12 px-6 text-sm sm:text-base gap-2.5 rounded-2xl shadow-xs', // 48px height touch target
      lg: 'h-14 sm:h-15 px-8 text-base sm:text-lg gap-3 rounded-2xl shadow-md font-extrabold', // 56px-60px prominent CTA
    }[size];

    const variantStyles = {
      primary:
        'bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] focus-visible:outline-[#7C3AED]',
      secondary:
        'bg-[#EDE9FE] dark:bg-purple-950/60 hover:bg-[#DDD6FE] dark:hover:bg-purple-900/60 active:bg-[#C4B5FD] text-[#7C3AED] dark:text-purple-300 focus-visible:outline-[#7C3AED]',
      outline:
        'border-2 border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#FAF8FE] dark:hover:bg-slate-800 hover:border-[#DDD6FE] dark:hover:border-purple-800 active:bg-[#EDE9FE] text-[#1E1B4B] dark:text-slate-100 shadow-2xs focus-visible:outline-[#7C3AED]',
      ghost:
        'bg-transparent hover:bg-[#EDE9FE]/50 dark:hover:bg-slate-800/50 text-[#1E1B4B] dark:text-slate-200 hover:text-[#7C3AED] dark:hover:text-purple-400 focus-visible:outline-[#7C3AED]',
      danger:
        'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm focus-visible:outline-[#DC2626]',
    }[variant];

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
