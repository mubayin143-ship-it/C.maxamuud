/**
 * SmartEducate Canonical Section Header Primitive
 * High-legibility section title and description with responsive typography and balanced line wrapping.
 */

import React from 'react';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'start' | 'center';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  align = 'start',
  className = '',
  ...props
}) => {
  const alignmentStyles = align === 'center' ? 'text-center items-center' : 'text-start items-start';

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 ${className}`}
      {...props}
    >
      <div className={`flex flex-col ${alignmentStyles} max-w-3xl space-y-2`}>
        {badge && <div className="mb-1">{badge}</div>}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E1B4B] text-balance">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed text-pretty">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 self-start md:self-auto">{action}</div>}
    </div>
  );
};
