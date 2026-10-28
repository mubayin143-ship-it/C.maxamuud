import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { GlobalClassroom, TimetableEntry } from '../../types/education';
import { TeacherProfile } from '../../types/student';
import { SAMPLE_CLASSROOM_STUDENTS } from '../../data/globalEducation';
import { classroomChatService } from '../../services/classroomChatService';
import {
  Menu,
  ChevronDown,
  Eye,
  ArrowLeftRight,
  Globe,
  Users,
  UserPlus,
  Video,
  FileText,
  Calendar,
  BookOpen,
  MessageSquare,
  DollarSign,
  HelpCircle,
  Sparkles,
  Award,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  ShieldCheck,
  UserCheck,
  Radio,
  FileCheck,
  LogOut,
  Pen,
  Loader2,
  Bell,
  GraduationCap,
} from 'lucide-react';

interface TeacherHomeScreenProps {
  teacherProfile: TeacherProfile;
  activeClassroom: GlobalClassroom | null;
  teacherClassrooms: GlobalClassroom[];
  onSelectClassroom: (id: string) => void;
  onCreateClassroom: () => void;
  onOpenSettingsMenu: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onViewAsStudent: () => void;
  onSwitchRole: () => void;
  onLogout?: () => void;
  onOpenRoster: () => void;
  onOpenInviteCoTeacher: () => void;
  onOpenLiveClass: () => void;
  onOpenWhiteboard?: () => void;
  onOpenRecording: () => void;
  onOpenFees: () => void;
  onOpenStudyMaterial: () => void;
  onOpenTest: () => void;
  onOpenChat: () => void;
  onOpenHomework: () => void;
  onOpenAskDoubt: () => void;
  onOpenHelp: () => void;
  onOpenAiTeacher: () => void;
  onOpenCertificates: () => void;
  onOpenAttendance: () => void;
  onViewClassroomDetail: () => void;
  onOpenTimetableSetup: () => void;
  timetableEntries: TimetableEntry[];
  liveSessionActive: boolean;
  isStartingLiveSession?: boolean;
  liveSessionError?: string | null;
  onToggleLiveSession: () => void;
  onCopyCode: (code: string) => void;
  copiedCodeToast: boolean;
}

export const TeacherHomeScreen: React.FC<TeacherHomeScreenProps> = ({
  teacherProfile,
  activeClassroom,
  teacherClassrooms,
  onSelectClassroom,
  onCreateClassroom,
  onOpenSettingsMenu,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onViewAsStudent,
  onSwitchRole,
  onLogout,
  onOpenRoster,
  onOpenInviteCoTeacher,
  onOpenLiveClass,
  onOpenWhiteboard,
  onOpenRecording,
  onOpenFees,
  onOpenStudyMaterial,
  onOpenTest,
  onOpenChat,
  onOpenHomework,
  onOpenAskDoubt,
  onOpenHelp,
  onOpenAiTeacher,
  onOpenCertificates,
  onOpenAttendance,
  onViewClassroomDetail,
  onOpenTimetableSetup,
  timetableEntries,
  liveSessionActive,
  isStartingLiveSession = false,
  liveSessionError = null,
  onToggleLiveSession,
  onCopyCode,
  copiedCodeToast,
}) => {
  const { t, language, setLanguage, isRTL } = useI18n();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const studentCount = activeClassroom?.enrolledStudents ?? 0;
  const coTeachersCount = teacherProfile.coTeachersCount ?? 0;
  const pendingInvites = teacherProfile.pendingCoTeachersCount ?? 0;

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (activeClassroom?.id) {
      setUnreadChatCount(classroomChatService.getUnreadCount(activeClassroom.id, 'teacher'));
      const unsub = classroomChatService.subscribe(activeClassroom.id, () => {
        setUnreadChatCount(classroomChatService.getUnreadCount(activeClassroom.id, 'teacher'));
      });
      return () => unsub();
    }
  }, [activeClassroom?.id]);

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-4 text-start pb-28 animate-fadeIn">
      {/* ============================================================== */}
      {/* 1. TOP APP HEADER (SmartEducate Responsive Header)             */}
      {/* Brand | Menu | Classroom Selector ▼ | Notifications | Actions */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs p-2 sm:p-2.5 transition-all">
        {/* Main Row: Menu, SmartEducate Brand, and Controls */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left: Menu & SmartEducate Brand */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {/* Menu Toggle */}
            <button
              type="button"
              onClick={onOpenSettingsMenu}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 active:bg-purple-100 text-slate-700 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
              title="Open Menu"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* SmartEducate Logo Badge + Wordmark */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
              <div
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs"
                title="SmartEducate"
                aria-label="SmartEducate"
              >
                <GraduationCap className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[10.5px] sm:text-sm font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100 whitespace-nowrap">
                SmartEducate
              </span>
            </div>
          </div>

          {/* Right: Action Controls (Bell with 9+, Preview, Switch Role, Language, Sign Out) */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {/* Notifications Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative w-8 h-8 sm:w-9 sm:h-9 me-1.5 sm:me-2 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
                title="Notifications & Deadlines"
                aria-label="Notifications & Deadlines"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 dark:text-slate-300" />
                {typeof unreadNotificationsCount === 'number' && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 z-20 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 pointer-events-none">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* View as Student / Preview */}
            <button
              type="button"
              onClick={onViewAsStudent}
              className="w-8 h-8 sm:w-auto sm:px-2.5 sm:h-9 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
              title="Preview as Student"
              aria-label="Preview as Student"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Preview</span>
            </button>

            {/* Switch Role */}
            <button
              type="button"
              onClick={onSwitchRole}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
              title="Switch Role"
              aria-label="Switch Role"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Language Selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                className="w-8 h-8 sm:w-auto sm:h-9 sm:px-2 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40"
                title="Change Language"
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="hidden md:inline uppercase">{language}</span>
              </button>
              {isLangDropdownOpen && (
                <div className="absolute end-0 top-full mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-xl p-1.5 z-40 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-start cursor-pointer ${
                      language === 'en' ? 'bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('so');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-start cursor-pointer ${
                      language === 'so' ? 'bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Somali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('ar');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-start cursor-pointer ${
                      language === 'ar' ? 'bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    العربية
                  </button>
                </div>
              )}
            </div>

            {/* Quick Sign Out button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar: Classroom Selector ▼ */}
        <div className="relative mt-2 pt-2 border-t border-[#F0EBF8] dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen((prev) => !prev)}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-purple-50/60 dark:hover:bg-slate-800/60 flex items-center justify-between gap-1.5 transition-colors cursor-pointer text-start border border-[#EDE8F5]/60 dark:border-slate-800/60 bg-[#FAF8FE] dark:bg-slate-900/60"
              title="Switch Classroom"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-[#7C3AED] dark:text-purple-400 uppercase tracking-wider shrink-0">
                  Classroom:
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                  {activeClassroom ? activeClassroom.title : 'No Classrooms Yet'}
                </span>
                {activeClassroom?.isCoTeacher && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                    Co-Teacher
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                  isClassDropdownOpen ? 'rotate-180 text-[#7C3AED] dark:text-purple-400' : ''
                }`}
              />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute start-0 top-full mt-1.5 w-72 max-w-[90vw] rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-xl p-2 z-40 space-y-1 animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  My Classrooms
                </span>
                {teacherClassrooms.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      onSelectClassroom(cls.id);
                      setIsClassDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-start text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      cls.id === activeClassroom?.id
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{cls.title}</span>
                      {cls.isCoTeacher && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                          Co-Teacher
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 shrink-0">
                      {cls.code}
                    </span>
                  </button>
                ))}
                <div className="pt-1 border-t border-[#F0EBF8] dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClassDropdownOpen(false);
                      onCreateClassroom();
                    }}
                    className="w-full p-2 rounded-xl text-[#7C3AED] dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Classroom</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STUDENT'S LIST & CO-TEACHERS ROW                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* STUDENT'S LIST */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenRoster}
          className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Student Avatar / Count Indicator */}
            {studentCount > 0 ? (
              <div className="flex -space-x-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 border-2 border-white dark:border-slate-900 text-[#7C3AED] dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shadow-2xs">
                  ST
                </div>
                {studentCount > 1 && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 border-2 border-white dark:border-slate-900 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    +{studentCount - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Student's List
              </span>
              <h3 className="text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                {studentCount} Enrolled Students
              </h3>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-[#FAF8FE] dark:bg-slate-800 group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
            <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* CO-TEACHERS */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenInviteCoTeacher}
          className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Co-Teachers
              </span>
              <h3 className="text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                {coTeachersCount} Co-Teachers
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                {pendingInvites} pending invitation{pendingInvites === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-[#FAF8FE] dark:bg-slate-800 group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
            <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN TEACHER TOOLS (Canonical 11-Tool Educate Grid)         */}
      {/* Row 1: Live Class | Recording | Fees                           */}
      {/* Row 2: Study Material | Test | Chat                            */}
      {/* Row 3: Homework | Ask Doubt | Help                             */}
      {/* Row 4: AI Teacher | Certificates                               */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Teacher Tools
        </span>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* Row 1, Col 1: Live Class */}
          <button
            type="button"
            onClick={onOpenLiveClass}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5 stroke-[2.2]" />
              </div>
              {liveSessionActive ? (
                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded-full animate-pulse">
                  Live
                </span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  Ready
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                {t('teacher.action.liveClass')}
              </h4>
            </div>
          </button>

          {/* Row 1, Col 2: Recording */}
          <button
            type="button"
            onClick={onOpenRecording}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
                Archive
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors leading-tight">
                {t('teacher.action.recording')}
              </h4>
            </div>
          </button>

          {/* Row 1, Col 3: Fees */}
          <button
            type="button"
            onClick={onOpenFees}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                Tuition
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-tight">
                {t('teacher.action.fees')}
              </h4>
            </div>
          </button>

          {/* Row 2, Col 1: Study Material */}
          <button
            type="button"
            onClick={onOpenStudyMaterial}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                Notes
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                {t('teacher.action.studyMaterial')}
              </h4>
            </div>
          </button>

          {/* Row 2, Col 2: Test & Assessments (with AI Test Analysis) */}
          <button
            type="button"
            onClick={onOpenTest}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded-full">
                AI Grade
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors leading-tight">
                {t('teacher.action.test')}
              </h4>
            </div>
          </button>

          {/* Row 2, Col 3: Chat */}
          <button
            type="button"
            onClick={onOpenChat}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5">
                {unreadChatCount > 0 && (
                  <span className="text-[9px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full shadow-2xs">
                    {unreadChatCount} new
                  </span>
                )}
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 dark:text-teal-300 px-1.5 py-0.5 rounded-full">
                  Class
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-tight">
                {t('teacher.action.chat')}
              </h4>
            </div>
          </button>

          {/* Row 3, Col 1: Homework */}
          <button
            type="button"
            onClick={onOpenHomework}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                Tasks
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {t('teacher.action.homework')}
              </h4>
            </div>
          </button>

          {/* Row 3, Col 2: Ask Doubt */}
          <button
            type="button"
            onClick={onOpenAskDoubt}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-orange-700 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                Q&A
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors leading-tight">
                {t('teacher.action.askDoubt')}
              </h4>
            </div>
          </button>

          {/* Row 3, Col 3: Help */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-slate-500 dark:hover:border-slate-500 hover:bg-slate-50/60 dark:hover:bg-slate-800 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                Guide
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors leading-tight">
                {t('teacher.action.help')}
              </h4>
            </div>
          </button>

          {/* Row 4: SPAN 2 COLS FOR AI TEACHER (Highlight) */}
          <button
            type="button"
            onClick={onOpenAiTeacher}
            className="col-span-2 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white active:scale-[0.98] shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-3 text-start group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-purple-200" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-purple-100 px-2 py-0.5 rounded-md">
                    Instructor Exclusive
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  {t('teacher.action.aiTeacher')}
                </h4>
                <p className="text-[11px] text-purple-200 truncate">
                  Generate assignments, quizzes & difficulty sets
                </p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-purple-200 shrink-0" />
          </button>

          {/* Row 4, Col 3: Certificates */}
          <button
            type="button"
            onClick={onOpenCertificates}
            className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 active:scale-[0.98] shadow-2xs transition-all cursor-pointer flex flex-col justify-between h-28 sm:h-30 text-start group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                Verify
              </span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-tight">
                {t('teacher.action.certificates')}
              </h4>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. LIVE CLASSES CARD                                           */}
      {/* Upcoming / current classroom session + Start Live + Attendance */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Classes & Scheduled Sessions</span>
          </span>
          {activeClassroom && (
            liveSessionActive ? (
              <span className="text-xs font-extrabold text-white bg-rose-600 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Live Now</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                Scheduled
              </span>
            )
          )}
        </div>

        {timetableEntries && timetableEntries.length > 0 ? (
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] dark:text-purple-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{timetableEntries[0].day}, {timetableEntries[0].startTime} – {timetableEntries[0].endTime}</span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                {timetableEntries[0].title || (activeClassroom ? `${activeClassroom.title} — Lecture` : 'Live Session')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{timetableEntries[0].roomOrLink || 'Online Interactive Stream'}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800 text-start space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>No sessions scheduled yet.</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Add a time slot in your Weekly Timetable below to publish scheduled live lectures.
            </p>
          </div>
        )}

        {liveSessionError && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 font-medium">
            {liveSessionError}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <button
            type="button"
            disabled={isStartingLiveSession}
            onClick={activeClassroom ? onToggleLiveSession : onCreateClassroom}
            className={`flex-1 min-w-[140px] h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-wait ${
              liveSessionActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isStartingLiveSession ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting Live Class...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>
                  {liveSessionActive
                    ? 'End Live Class Session'
                    : activeClassroom
                    ? 'Start Live Class'
                    : 'Create Classroom to Start Live Class'}
                </span>
              </>
            )}
          </button>

          {activeClassroom && (
            <button
              type="button"
              onClick={onOpenWhiteboard || onOpenLiveClass}
              className="h-12 px-3.5 sm:px-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Open Live Whiteboard"
            >
              <Pen className="w-4 h-4" />
              <span>Live Whiteboard</span>
            </button>
          )}

          {activeClassroom && (
            <button
              type="button"
              onClick={onOpenAttendance}
              className="h-12 px-3 sm:px-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Take Attendance"
            >
              <UserCheck className="w-4 h-4" />
              <span>Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. CLASSROOM DETAILS CARD                                      */}
      {/* Classroom name, institution, subject, code, status, view       */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-3">
        {activeClassroom ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">·</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {studentCount} Students
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100 tracking-tight truncate">
                  {activeClassroom.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  {teacherProfile.institution || activeClassroom.institution || 'SmartEducate Global'} · {activeClassroom.subject}
                </p>
              </div>

              <button
                type="button"
                onClick={onViewClassroomDetail}
                className="h-9 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>View Classroom</span>
                <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="pt-2 border-t border-[#F0EBF8] dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Classroom Code:</span>
                <span className="font-mono text-sm font-extrabold text-[#7C3AED] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-100 dark:border-slate-700">
                  {activeClassroom.code}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyCode(activeClassroom.code)}
                  className="p-1 rounded-lg text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-300 cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCodeToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-slate-400 font-medium">
                Category: <strong className="text-slate-700 dark:text-slate-300 capitalize">{activeClassroom.category}</strong>
              </span>
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#1E1B4B] dark:text-slate-100">No Classrooms Created Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create your first classroom to get a unique join code, enroll students, publish study materials, and stream live lectures.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateClassroom}
              className="h-11 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Classroom</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. WEEKLY TIMETABLE                                            */}
      {/* If empty: show "Weekly Timetable" + "+ Set Up Timetable"       */}
      {/* If configured: show schedule entries with add/edit option     */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
            <h3 className="text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100">Weekly Timetable</h3>
          </div>
          {timetableEntries.length > 0 && (
            <button
              type="button"
              onClick={onOpenTimetableSetup}
              className="text-xs text-[#7C3AED] dark:text-purple-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Slot</span>
            </button>
          )}
        </div>

        {timetableEntries.length === 0 ? (
          /* Empty Timetable State (Strict requirement: do NOT invent fake data!) */
          <div className="p-5 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800 text-center space-y-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('teacher.timetable.empty')}
            </p>
            <button
              type="button"
              onClick={onOpenTimetableSetup}
              className="h-10 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('teacher.timetable.setup')}</span>
            </button>
          </div>
        ) : (
          /* Configured Timetable Entries */
          <div className="space-y-2">
            {timetableEntries.map((slot) => (
              <div
                key={slot.id}
                className="p-3 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#7C3AED] dark:text-purple-300 px-2 py-0.5 rounded-md bg-purple-100/70 dark:bg-purple-950/70 text-[10px]">
                      {slot.day}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">{slot.title}</h4>
                  <span className="text-[11px] text-slate-400 block truncate">{slot.roomOrLink}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
