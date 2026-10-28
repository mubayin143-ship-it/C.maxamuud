/**
 * SmartEducate Canonical Modal Primitive
 * Accessible dialog foundation with backdrop overlay, keyboard escape, focus management, and RTL support.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-7xl w-full',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start sm:items-center"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE6F8] dark:border-slate-800 shadow-[0_25px_60px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] ${
          maxWidth === 'full' ? 'p-3 sm:p-5 md:p-6' : 'p-6 sm:p-8 md:p-10'
        } text-start z-10 transition-transform duration-200 scale-100 my-auto`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] dark:text-slate-100">{title}</h3>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-[#475569] dark:text-slate-400 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 -me-1 -mt-1 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className={`${maxWidth === 'full' ? 'py-3' : 'py-6'} text-[#1E1B4B] dark:text-slate-200 text-base leading-relaxed`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
