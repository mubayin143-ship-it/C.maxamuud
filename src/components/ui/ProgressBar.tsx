/**
 * SmartEducate Canonical Progress Indicator Primitive
 * Accessible progress bar for onboarding, degree tracking, and course completion.
 */

import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[size];

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || subLabel) && (
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold">
          {label && <span className="text-[#1E1B4B]">{label}</span>}
          {subLabel && <span className="text-[#7C3AED] font-bold">{subLabel}</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full ${heightClass} bg-slate-200/80 rounded-full overflow-hidden`}
      >
        <div
          className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
