/**
 * SmartEducate Canonical Information Card Primitive
 * Subtle tip/guidance card with soft purple background and clean icon.
 */

import React from 'react';
import { Info } from 'lucide-react';

export interface InfoCardProps {
  message: string;
  icon?: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  message,
  icon,
  variant = 'info',
  className = '',
}) => {
  const styles = {
    info: 'bg-[#FAF8FE] border-[#EDE8F5] text-[#5B21B6]',
    tip: 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9]',
    warning: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  }[variant];

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-2.5 text-start ${styles} ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        {icon || <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C3AED]" />}
      </div>
      <p className="text-xs sm:text-sm leading-relaxed text-[#475569]">{message}</p>
    </div>
  );
};
