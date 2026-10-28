/**
 * SmartEducate Top App Header
 * Refined, compact, aligned with the Educate reference:
 * Left: Back arrow + Back
 * Center/Brand: SmartEducate logo badge + wordmark
 * Right: Minimalist language selector
 */

import React, { useState } from 'react';
import { Globe, Check, GraduationCap, ChevronLeft, ChevronRight, Menu, Bell } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../types/i18n';

export interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  onMenu?: () => void;
  showMenu?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  rightAction?: React.ReactNode;
  centerContent?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  showBack = true,
  onMenu,
  showMenu = false,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  rightAction,
  centerContent,
  title,
  subtitle,
}) => {
  const { language, setLanguage, isRTL, t } = useI18n();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const BackChevron = isRTL ? ChevronRight : ChevronLeft;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#F0EBF8] dark:border-slate-800 shadow-[0_2px_12px_rgba(20,10,50,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all">
      <div className="max-w-xl sm:max-w-2xl mx-auto px-3.5 sm:px-5 h-14 sm:h-15 flex items-center justify-between gap-2.5">
        {/* Left: Menu/Back Navigation & Center Content / Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {showMenu && (
            <button
              type="button"
              onClick={onMenu}
              className="w-9 h-9 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 text-[#1E1B4B] dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
              aria-label="Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors py-1.5 pe-1.5 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 rounded-xl"
              aria-label={t('common.back')}
            >
              <BackChevron className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden xs:inline">{t('common.back')}</span>
            </button>
          )}

          {centerContent ? (
            <div className="min-w-0">{centerContent}</div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100 truncate">
                  {title || 'SmartEducate'}
                </span>
                {subtitle && (
                  <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate">
                    / {subtitle}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Language Selector Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border border-[#E9E4F3] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-purple-50/60 dark:hover:bg-slate-800 active:bg-purple-100/60 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
              aria-label="Classroom notifications, announcements and deadlines"
              title="Notifications & Deadlines"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 dark:text-slate-300" />
              {typeof unreadNotificationsCount === 'number' && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {rightAction}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-label={t('language.select')}
              aria-expanded={langMenuOpen}
              className="h-9 sm:h-10 px-3 rounded-full border border-[#E9E4F3] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1E1B4B] dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C3AED] dark:text-purple-400" />
              <span>{SUPPORTED_LANGUAGES[language].nativeName}</span>
            </button>

          {langMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLangMenuOpen(false)}
              />
              <div className="absolute end-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_32px_rgba(20,10,50,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] py-1.5 z-50 text-start overflow-hidden">
                {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => {
                  const langConfig = SUPPORTED_LANGUAGES[langKey];
                  const isSelected = language === langKey;
                  return (
                    <button
                      key={langKey}
                      onClick={() => {
                        setLanguage(langKey);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F5F3FF] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 font-bold'
                          : 'text-[#1E1B4B] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{langConfig.nativeName}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                          ({langConfig.direction.toUpperCase()})
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};
