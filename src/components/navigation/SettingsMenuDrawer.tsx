/**
 * SmartEducate Canonical Educate-Style Settings Menu Drawer
 * Opens via the top hamburger menu (☰).
 * Provides dedicated grouped settings matching Educate-style specifications,
 * including a global Dark Mode theme toggle switch with persistent state.
 */

import React, { useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  User,
  Crown,
  Plus,
  Users,
  Eye,
  BookOpenCheck,
  Globe,
  Instagram,
  Youtube,
  Trash2,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../state/ThemeContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../types/i18n';

export interface SettingsMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClassroomSettings: () => void;
  onOpenProfile: () => void;
  onOpenPremium: () => void;
  onOpenCreateClassroom: () => void;
  onInviteCoTeacher: () => void;
  onViewAsStudent: () => void;
  onOpenTutorial: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
  onOpenContactUs: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  isTeacherRole?: boolean;
}

export const SettingsMenuDrawer: React.FC<SettingsMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenClassroomSettings,
  onOpenProfile,
  onOpenPremium,
  onOpenCreateClassroom,
  onInviteCoTeacher,
  onViewAsStudent,
  onOpenTutorial,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onOpenContactUs,
  onDeleteAccount,
  onLogout,
}) => {
  const { t, language, setLanguage, isRTL } = useI18n();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);

  if (!isOpen) return null;

  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
      className="fixed inset-0 z-50 flex justify-start bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      {/* Click outside backdrop to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#FAF8FE] dark:bg-[#0B0F19] border-e border-[#EDE8F5] dark:border-slate-800/80 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-start duration-200 text-start">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EDE8F5] dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center font-bold">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100">
              {t('settings.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          {/* 1. APPEARANCE / DARK MODE THEME SWITCH */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.appearance')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isDarkMode
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-purple-50 text-[#7C3AED]'
                  }`}
                >
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 block truncate">
                    {t('settings.item.darkMode')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {isDarkMode ? t('settings.theme.dark') : t('settings.theme.light')}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isDarkMode}
                aria-label="Toggle Dark Mode"
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  isDarkMode ? 'bg-[#7C3AED]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isDarkMode ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* 2. CLASSROOM SETTINGS */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.classroomSettings')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClassroomSettings();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                    <SettingsIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.classroomSettings')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* 3. MAIN SECTION */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.mainSection')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden divide-y divide-[#F0EBF8] dark:divide-slate-800">
              {/* Profile */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.profile')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>

              {/* Premium */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPremium();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.premium')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>

              {/* Create Classroom */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateClassroom();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.createClassroom')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>

              {/* Invite Co-Teacher */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInviteCoTeacher();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.inviteCoTeacher')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>

              {/* View as Student */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAsStudent();
                }}
                className="w-full p-3.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#7C3AED] dark:text-purple-300">
                    {t('settings.item.viewAsStudent')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-[#7C3AED] dark:text-purple-300" />
              </button>
            </div>
          </div>

          {/* 4. TUTORIAL */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.tutorial')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTutorial();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <BookOpenCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors">
                    {t('settings.item.howItWorks')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* 5. LANGUAGE */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.language')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsLangPickerOpen((prev) => !prev)}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.language')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-1 rounded-lg">
                    {SUPPORTED_LANGUAGES[language].nativeName}
                  </span>
                  <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
              </button>

              {isLangPickerOpen && (
                <div className="p-2 border-t border-[#F0EBF8] dark:border-slate-800 grid grid-cols-3 gap-1.5 bg-[#FAF8FE] dark:bg-slate-900/60">
                  {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => {
                    const cfg = SUPPORTED_LANGUAGES[langKey];
                    const isSelected = language === langKey;
                    return (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => {
                          setLanguage(langKey);
                          setIsLangPickerOpen(false);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#7C3AED] text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-[#EDE8F5] dark:border-slate-700'
                        }`}
                      >
                        {cfg.nativeName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 6. RESOURCES */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.resources')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden divide-y divide-[#F0EBF8] dark:divide-slate-800">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.instagram')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.youtube')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </a>
            </div>
          </div>

          {/* 7. ACCOUNT SETTINGS */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.accountSettings')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteAccount();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {t('settings.item.deleteAccount')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          {/* 8. MORE */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.more')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden divide-y divide-[#F0EBF8] dark:divide-slate-800">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacyPolicy();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.privacyPolicy')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>

              {/* Terms and Conditions */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTerms();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.termsConditions')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          {/* 9. SUPPORT */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t('settings.group.support')}
            </span>
            <div className="rounded-2xl bg-white dark:bg-[#151D2F] border border-[#EDE8F5] dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContactUs();
                }}
                className="w-full p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200">
                    {t('settings.item.contactUs')}
                  </span>
                </div>
                <Chevron className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          {/* 10. LOG OUT */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 font-bold text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>{t('settings.item.logout')}</span>
              </div>
              <Chevron className="w-4 h-4 text-rose-400 dark:text-rose-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
