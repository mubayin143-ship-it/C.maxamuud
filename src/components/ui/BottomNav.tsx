/**
 * SmartEducate Canonical Bottom Navigation Bar Primitive
 * Mobile-first persistent bottom navigation with generous touch targets (min 48px).
 */

import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface BottomNavProps {
  items: readonly NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-0 inset-x-0 z-30 pointer-events-none flex justify-center ${className}`}>
      <nav
        className="w-full max-w-xl sm:max-w-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-x border-[#F0EBF8] dark:border-slate-800 shadow-[0_-4px_24px_rgba(20,10,50,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] rounded-t-2xl sm:rounded-t-3xl px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around pointer-events-auto transition-all"
        aria-label="Main Navigation"
      >
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`min-h-[48px] min-w-[64px] px-3 py-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] relative ${
                isActive
                  ? 'text-[#7C3AED] dark:text-purple-400 font-extrabold'
                  : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`relative px-3 py-1 rounded-xl transition-all ${
                  isActive ? 'bg-purple-100/70 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] leading-tight tracking-tight uppercase ${isActive ? 'font-extrabold text-[#7C3AED] dark:text-purple-400' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
