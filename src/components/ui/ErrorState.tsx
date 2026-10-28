/**
 * SmartEducate Canonical Error State Primitive
 * Resilient failure recovery interface with clear troubleshooting instructions.
 */

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`bg-[#FEF2F2] rounded-2xl border border-red-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h4 className="text-base sm:text-lg font-bold text-red-950 text-balance">{title}</h4>
      <p className="mt-2 text-sm text-red-800/90 max-w-md leading-relaxed text-pretty">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="danger"
            size="md"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
