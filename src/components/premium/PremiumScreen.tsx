/**
 * SmartEducate Canonical Premium Screen
 * Clean, mobile-first education tier benefits with real trial/activation state.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Crown,
  Video,
  BookOpen,
  FileCheck,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export interface PremiumScreenProps {
  onBack?: () => void;
  isTeacherRole?: boolean;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({
  onBack,
  isTeacherRole = false,
}) => {
  const { t, isRTL } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smarteducate_premium_active') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePlanActivation = () => {
    const next = !isActivated;
    setIsActivated(next);
    try {
      localStorage.setItem('smarteducate_premium_active', String(next));
    } catch {
      // safe fallback
    }
  };

  const BackChevron = isRTL ? ChevronRight : ChevronLeft;
  const ArrowIcon = isRTL ? ChevronLeft : ArrowRight;

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6 text-start pb-28 animate-fadeIn">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#7C3AED] p-6 sm:p-7 text-white shadow-xl shadow-purple-950/15">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-amber-300" />
              <span>SmartEducate PRO</span>
            </span>

            {isActivated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{t('premium.activeBadge')}</span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('premium.unlock')}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal">
              {t('premium.desc')}
            </p>
          </div>
        </div>

        {/* Ambient background blur spheres */}
        <div className="absolute -end-10 -bottom-10 w-44 h-44 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
        <div className="absolute end-16 -top-12 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
      </div>

      {/* Plan Selector Buttons */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-1.5 shadow-2xs flex gap-1">
        <button
          type="button"
          onClick={() => setSelectedPlan('monthly')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
            selectedPlan === 'monthly'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {t('premium.monthly')}
        </button>
        <button
          type="button"
          onClick={() => setSelectedPlan('annual')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center relative ${
            selectedPlan === 'annual'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>{t('premium.annual')}</span>
        </button>
      </div>

      {/* Action / Status Button */}
      <div>
        <button
          type="button"
          onClick={handleTogglePlanActivation}
          className={`w-full h-13 sm:h-14 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
            isActivated
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-purple-600/25 hover:shadow-purple-600/35'
          }`}
        >
          {isActivated ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{t('premium.activeBadge')} · Tap to Manage</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t('premium.upgradeNow')} ({selectedPlan === 'annual' ? '$39.99/yr' : '$4.99/mo'})</span>
              <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          {isTeacherRole ? 'Instructor & Faculty Features' : 'Student Academic Benefits'}
        </h2>

        <div className="space-y-2.5">
          {[
            {
              icon: <Sparkles className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" />,
              bg: 'bg-purple-50 dark:bg-purple-950/60',
              title: t('premium.featureAi'),
              desc: 'Continuous real-time pedagogical explanations with male/female voice output in English, Somali, and Arabic.',
            },
            {
              icon: <Video className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
              bg: 'bg-rose-50 dark:bg-rose-950/60',
              title: t('premium.featureLive'),
              desc: 'Stream high-definition class lectures, live office hours, and automatic cloud archiving for revision.',
            },
            {
              icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
              bg: 'bg-blue-50 dark:bg-blue-950/60',
              title: t('premium.featureMaterials'),
              desc: 'Share and download comprehensive syllabus slides, lecture hand-outs, problem sets, and vector references.',
            },
            {
              icon: <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
              bg: 'bg-teal-50 dark:bg-teal-950/60',
              title: t('premium.featureTests'),
              desc: 'Generate curriculum-aligned diagnostic tests with automated instant grading and student progress metrics.',
            },
            {
              icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
              bg: 'bg-indigo-50 dark:bg-indigo-950/60',
              title: t('premium.featureCollab'),
              desc: 'Multi-instructor co-teaching, classroom student doubts inbox, and real-time discussion boards.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs flex items-start gap-3.5"
            >
              <div
                className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Guarantee Note */}
      <div className="p-4 rounded-2xl bg-[#FAF8FE] dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Cancel anytime. Free 14-day trial included with all institutional and student plans.</span>
      </div>
    </div>
  );
};
