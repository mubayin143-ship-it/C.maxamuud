/**
 * SmartEducate Canonical Selection Card Primitive
 * Single source of truth for all role, option, and choice selection cards.
 * Layout: [ LARGE ICON ]  [ Title \n Description ]  [ ○ / ✓ ]
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface SelectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  badge?: string;
  disabled?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  description,
  icon,
  isSelected,
  onSelect,
  badge,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center transition-all duration-200 select-none text-start focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/30 ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800'
          : isSelected
          ? 'bg-[#FAF8FE] dark:bg-purple-950/20 border-2 border-[#7C3AED] dark:border-purple-500 shadow-[0_6px_24px_rgba(124,58,237,0.08)] cursor-pointer'
          : 'bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#DDD6FE] dark:hover:border-purple-800 hover:bg-[#FCFAFE] dark:hover:bg-slate-850 shadow-[0_2px_8px_rgba(20,10,50,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] cursor-pointer'
      } ${className}`}
      {...props}
    >
      {/* Left: Line Icon Container */}
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-[#EDE9FE] dark:bg-purple-900/40 text-[#7C3AED] dark:text-purple-300 shadow-2xs'
            : 'bg-[#F5F2FA] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}
      >
        {icon}
      </div>

      {/* Middle: Title & Description */}
      <div className="flex-1 min-w-0 px-3.5 sm:px-4">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-lg sm:text-xl font-bold text-[#1E1B4B] dark:text-slate-100 leading-snug">
            {title}
          </h3>
          {badge && (
            <span className="text-[11px] sm:text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {/* Right: Circular Selection Control */}
      <div className="shrink-0 ps-1">
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#7C3AED] text-white shadow-xs ring-2 ring-[#EDE9FE] dark:ring-purple-900/60'
              : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-850'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
        </div>
      </div>
    </div>
  );
};
