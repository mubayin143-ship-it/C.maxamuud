/**
 * SmartEducate Step Indicator & Progress Roadmap
 * Clean education-app progress stepper displaying the 5 stages:
 * Step 1 — Your role (Active)
 * Step 2 — University details (Upcoming)
 * Step 3 — Academic profile (Upcoming)
 * Step 4 — Courses (Upcoming)
 * Step 5 — Confirmation (Upcoming)
 * Responsive horizontal track on mobile (no vertical clutter) and 5-column grid on desktop.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '../../types/navigation';
import { useI18n } from '../../i18n/I18nContext';

export interface StepIndicatorProps {
  currentStep?: number;
  onStepClick?: (stepNumber: number) => void;
  interactive?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep = 1,
  onStepClick,
  interactive = false,
}) => {
  const { t } = useI18n();

  return (
    <div className="w-full space-y-3">
      {/* Progress Summary Header */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9] animate-pulse shrink-0" />
          <span className="text-sm sm:text-base font-bold text-[#1E1B4B]">
            {t('roadmap.title')}
          </span>
        </div>
        <span className="text-xs sm:text-sm font-bold text-[#6D28D9] bg-[#EDE9FE] px-3 py-1 rounded-full shrink-0">
          {t('roadmap.stepBadge', { step: currentStep })}
        </span>
      </div>

      {/* Progress Bar (20% for Step 1) */}
      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6D28D9] rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        />
      </div>

      {/* 5-Step Card Row: horizontal scroll on mobile, 5-col grid on md+ */}
      <div className="flex md:grid md:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto pb-1 pt-0.5 snap-x scrollbar-none">
        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = step.stepNumber < currentStep;
          const isCurrent = step.stepNumber === currentStep;

          return (
            <div
              key={step.id}
              onClick={() => interactive && onStepClick?.(step.stepNumber)}
              className={`min-w-[140px] sm:min-w-[160px] md:min-w-0 flex-1 snap-start rounded-2xl border p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 select-none ${
                isCurrent
                  ? 'bg-white border-[#6D28D9] ring-2 ring-[#EDE9FE] shadow-[0_4px_16px_rgba(109,40,217,0.08)]'
                  : isCompleted
                  ? 'bg-white border-emerald-300 shadow-2xs'
                  : 'bg-white/80 border-slate-200/80 shadow-2xs'
              } ${interactive ? 'cursor-pointer hover:border-[#8B5CF6]' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#6D28D9] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : step.stepNumber}
                  </span>

                  <span
                    className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isCurrent
                        ? 'bg-[#EDE9FE] text-[#5B21B6]'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCurrent
                      ? t('roadmap.stepActive')
                      : isCompleted
                      ? t('common.active')
                      : t('roadmap.stepUpcoming')}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] leading-snug line-clamp-1">
                  {t('roadmap.stepTitleFormat', { step: step.stepNumber, title: t(step.titleKey) })}
                </h4>

                <p className="text-[11px] sm:text-xs text-[#475569] leading-tight line-clamp-2 mt-1">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
