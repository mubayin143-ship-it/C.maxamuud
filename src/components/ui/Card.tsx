/**
 * SmartEducate Canonical Card Primitive
 * Clean padding, rounded-2xl to 3xl corners, soft purple-tinted elevation, and high-legibility text.
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  borderHighlight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  borderHighlight = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-6 md:p-8',
    lg: 'p-6 sm:p-8 md:p-10',
  }[padding];

  const shadowStyle = elevated
    ? 'shadow-[0_12px_32px_rgba(109,40,217,0.07)]'
    : 'shadow-[0_4px_20px_rgba(109,40,217,0.04)]';
  const borderStyle = borderHighlight ? 'border-purple-300 ring-2 ring-purple-100' : 'border-[#EAE6F8]';

  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-3xl border ${borderStyle} ${shadowStyle} ${paddingStyles} transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-2 pb-4 border-b border-slate-100 mb-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-lg sm:text-xl font-bold tracking-tight text-[#1E1B4B] text-balance ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-sm sm:text-base text-[#475569] leading-relaxed text-pretty ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return <div className={`space-y-5 ${className}`} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`pt-4 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
