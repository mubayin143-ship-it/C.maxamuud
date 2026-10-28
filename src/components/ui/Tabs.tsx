/**
 * SmartEducate Canonical Tabs Primitive
 * Mobile-first pill tabs with smooth transitions and touch ergonomics.
 */

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`p-1.5 rounded-2xl bg-[#F3F0FA] flex gap-1.5 overflow-x-auto scrollbar-none select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${
              isActive
                ? 'bg-white text-[#7C3AED] shadow-2xs font-bold'
                : 'text-slate-500 hover:text-[#1E1B4B] hover:bg-white/50'
            }`}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-[#EDE9FE] text-[#7C3AED]'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
