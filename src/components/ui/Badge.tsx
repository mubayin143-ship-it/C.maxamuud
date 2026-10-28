/**
 * SmartEducate Canonical Badge Primitive
 * Clear status indicator with accessible contrast and clean typographic presentation.
 */

import React from 'react';

export type BadgeVariant = 'purple' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-semibold',
    md: 'text-xs sm:text-sm px-3 py-1 font-bold',
  }[size];

  const variantStyles = {
    purple: 'bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]',
    success: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
    error: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
    info: 'bg-[#F5F3FF] text-[#6D28D9] border border-[#E9D5FF]',
    neutral: 'bg-slate-100 text-[#334155] border border-slate-200',
  }[variant];

  const dotColor = {
    purple: 'bg-[#7C3AED]',
    success: 'bg-[#059669]',
    warning: 'bg-[#D97706]',
    error: 'bg-[#DC2626]',
    info: 'bg-[#6D28D9]',
    neutral: 'bg-slate-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full shrink-0 select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
