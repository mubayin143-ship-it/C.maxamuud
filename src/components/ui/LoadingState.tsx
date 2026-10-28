/**
 * SmartEducate Canonical Loading State Primitive
 * Provides accessible spinner feedback, animated skeletons, and reassuring status copy.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  variant?: 'card' | 'inline' | 'skeleton';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  description,
  variant = 'card',
  className = '',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 animate-pulse w-full ${className}`}>
        <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-12 bg-slate-100 rounded-xl w-full" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 text-sm text-[#475569] ${className}`}>
        <Loader2 className="w-5 h-5 text-[#6D28D9] animate-spin" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft-card p-8 sm:p-10 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] flex items-center justify-center text-[#6D28D9] mb-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <h4 className="text-base sm:text-lg font-bold text-[#1E1B4B]">{title}</h4>
      {description && (
        <p className="mt-1.5 text-sm text-[#475569] max-w-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
};
