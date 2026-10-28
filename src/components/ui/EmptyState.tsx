/**
 * SmartEducate Canonical Empty State Primitive
 * Displays friendly zero-data explanations with clear recovery actions.
 */

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center mb-4 shrink-0">
        {icon || <FolderOpen className="w-7 h-7" />}
      </div>

      <h4 className="text-lg font-bold text-[#1E1B4B] text-balance">{title}</h4>
      <p className="mt-2 text-sm text-[#475569] max-w-md leading-relaxed text-pretty">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
