/**
 * SmartEducate Canonical Icon Container Primitive
 * Provides consistent touch-proportional framing and subtle lavender tinting for UI icons.
 */

import React from 'react';

export type IconContainerSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconContainerVariant = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: IconContainerSize;
  variant?: IconContainerVariant;
}

export const IconContainer: React.FC<IconContainerProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-base',
    lg: 'w-12 h-12 rounded-xl text-lg',
    xl: 'w-14 h-14 rounded-2xl text-xl',
  }[size];

  const variantStyles = {
    primary: 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]',
    secondary: 'bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE]',
    neutral: 'bg-slate-100 text-[#475569] border border-slate-200',
    success: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    error: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
  }[variant];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-colors ${sizeStyles} ${variantStyles} ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
};
