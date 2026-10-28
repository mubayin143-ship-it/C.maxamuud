/**
 * SmartEducate Canonical Page Container Primitive
 * Mobile-first page wrapper with generous padding, max-width boundary, and zero horizontal overflow.
 */

import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'mobile' | 'content' | 'wide';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  size = 'content',
  className = '',
  ...props
}) => {
  const maxWidth = {
    mobile: 'max-w-md',
    content: 'max-w-5xl',
    wide: 'max-w-6xl',
  }[size];

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-10 md:py-14 ${maxWidth} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
