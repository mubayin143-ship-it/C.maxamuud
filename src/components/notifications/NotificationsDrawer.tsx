import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  Megaphone,
  FileText,
  Clock,
  CheckCheck,
  Calendar,
  ChevronRight,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { GlobalClassroom, ClassroomAnnouncement } from '../../types/education';
import { aiGradingService } from '../../services/aiGradingService';

export type NotificationCategory = 'all' | 'announcements' | 'assignments' | 'deadlines';

export interface ClassroomNotificationItem {
  id: string;
  category: 'announcement' | 'assignment' | 'deadline';
  title: string;
  content: string;
  classroomId?: string;
  classroomTitle?: string;
  authorName?: string;
  authorRole?: string;
  date: string;
  dueDate?: string;
  urgency?: 'urgent' | 'upcoming' | 'normal';
  read: boolean;
  actionType?: 'open_chat' | 'open_test' | 'view_classroom' | 'open_assignment';
  actionTargetId?: string;
}

export interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcements?: Record<string, ClassroomAnnouncement[]>;
  activeClassroom?: GlobalClassroom | null;
  enrolledClassrooms?: GlobalClassroom[];
  teacherClassrooms?: GlobalClassroom[];
  onOpenClassroomChat?: (classroomId: string) => void;
  onOpenAssessment?: (assessmentId?: string) => void;
  onNavigateToScreen?: (screen: string) => void;
}

const STORAGE_READ_NOTIFS_KEY = 'smarteducate_read_notifications_v1';

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  announcements = {},
  activeClassroom,
  enrolledClassrooms = [],
  teacherClassrooms = [],
  onOpenClassroomChat,
  onOpenAssessment,
  onNavigateToScreen,
}) => {
  const { t, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_READ_NOTIFS_KEY);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      }
    } catch {}
    return new Set<string>();
  });

  // Save read notification state
  const markAsRead = (id: string) => {
    setReadNotifIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    const updated = new Set([...Array.from(readNotifIds), ...allIds]);
    setReadNotifIds(updated);
    try {
      localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(Array.from(updated)));
    } catch {}
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate all classrooms for name lookup
  const classroomsMap = useMemo(() => {
    const map = new Map<string, GlobalClassroom>();
    if (activeClassroom) map.set(activeClassroom.id, activeClassroom);
    enrolledClassrooms.forEach((c) => map.set(c.id, c));
    teacherClassrooms.forEach((c) => map.set(c.id, c));
    // Fallback seed classroom
    map.set('cls-101', {
      id: 'cls-101',
      code: 'MATH101',
      title: 'Calculus & Linear Algebra',
      subject: 'Mathematics',
      instructorName: 'Prof. Marcus Vance',
      institution: 'Global University',
      category: 'university',
      enrolledStudents: 34,
      status: 'active',
    });
    return map;
  }, [activeClassroom, enrolledClassrooms, teacherClassrooms]);

  // Build notifications from announcements, assessments, and deadlines
  const notificationsList = useMemo<ClassroomNotificationItem[]>(() => {
    const items: ClassroomNotificationItem[] = [];

    // 1. Announcements
    const announcementEntries = Object.entries(announcements);
    if (announcementEntries.length === 0) {
      // Default canonical classroom announcement if empty
      items.push({
        id: 'ann-cls-101-default',
        category: 'announcement',
        title: 'Classroom Lecture Notes & Midterm Prep',
        content: 'Welcome everyone! Problem Set 1 and Lecture Slides for Chapter 2 have been published. Please review before next seminar.',
        classroomId: 'cls-101',
        classroomTitle: classroomsMap.get('cls-101')?.title || 'Calculus & Linear Algebra',
        authorName: 'Prof. Marcus Vance',
        authorRole: 'Lead Instructor',
        date: 'Yesterday at 10:30 AM',
        read: readNotifIds.has('ann-cls-101-default'),
        actionType: 'open_chat',
        actionTargetId: 'cls-101',
      });
    } else {
      announcementEntries.forEach(([classroomId, list]) => {
        const cls = classroomsMap.get(classroomId);
        list.forEach((ann) => {
          items.push({
            id: `ann-${ann.id}`,
            category: 'announcement',
            title: `Announcement: ${cls?.title || 'Classroom Update'}`,
            content: ann.content,
            classroomId,
            classroomTitle: cls?.title || 'Global Classroom',
            authorName: ann.author || cls?.instructorName || 'Instructor',
            authorRole: 'Instructor',
            date: ann.date || 'Recent',
            read: readNotifIds.has(`ann-${ann.id}`),
            actionType: 'open_chat',
            actionTargetId: classroomId,
          });
        });
      });
    }

    // 2. New Assignments from aiGradingService
    const assessments = aiGradingService.getAssessments();
    assessments.forEach((asm) => {
      const cls = classroomsMap.get(asm.classroomId);
      const isQuiz = asm.type === 'quiz';
      const isTest = asm.type === 'test';
      const isHomework = asm.type === 'homework';

      items.push({
        id: `asm-${asm.id}`,
        category: 'assignment',
        title: asm.title,
        content: `New ${isQuiz ? 'quiz' : isTest ? 'test' : isHomework ? 'homework' : 'assignment'} assigned for ${cls?.title || asm.classroomName || asm.subject}. ${asm.totalQuestions ? `${asm.totalQuestions} questions` : ''} ${asm.durationMinutes ? `· ${asm.durationMinutes} mins` : ''}.`,
        classroomId: asm.classroomId,
        classroomTitle: cls?.title || asm.classroomName || asm.subject,
        authorName: asm.teacherName || cls?.instructorName || 'Instructor',
        authorRole: 'Instructor',
        date: asm.createdAt || 'Recently published',
        dueDate: asm.dueDate,
        read: readNotifIds.has(`asm-${asm.id}`),
        actionType: 'open_test',
        actionTargetId: asm.id,
      });

      // 3. Upcoming Deadlines (derived from assessments with dueDate)
      if (asm.dueDate) {
        const isUrgent = /today|tomorrow|oct 14|soon|hours/i.test(asm.dueDate);
        items.push({
          id: `deadline-${asm.id}`,
          category: 'deadline',
          title: `Upcoming Deadline: ${asm.title}`,
          content: `Submission window closes on ${asm.dueDate}. Ensure all answers and working steps are submitted before the deadline.`,
          classroomId: asm.classroomId,
          classroomTitle: cls?.title || asm.classroomName || asm.subject,
          authorName: asm.teacherName || cls?.instructorName || 'Academic Office',
          authorRole: 'Deadline Reminder',
          date: 'Upcoming',
          dueDate: asm.dueDate,
          urgency: isUrgent ? 'urgent' : 'upcoming',
          read: readNotifIds.has(`deadline-${asm.id}`),
          actionType: 'open_test',
          actionTargetId: asm.id,
        });
      }
    });

    // Sort: unread first, then chronological
    return items.sort((a, b) => {
      if (a.read === b.read) {
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
        return 0;
      }
      return a.read ? 1 : -1;
    });
  }, [announcements, classroomsMap, readNotifIds]);

  // Filtered list by active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notificationsList;
    if (activeTab === 'announcements') {
      return notificationsList.filter((n) => n.category === 'announcement');
    }
    if (activeTab === 'assignments') {
      return notificationsList.filter((n) => n.category === 'assignment');
    }
    if (activeTab === 'deadlines') {
      return notificationsList.filter((n) => n.category === 'deadline');
    }
    return notificationsList;
  }, [notificationsList, activeTab]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: notificationsList.length,
      announcements: notificationsList.filter((n) => n.category === 'announcement').length,
      assignments: notificationsList.filter((n) => n.category === 'assignment').length,
      deadlines: notificationsList.filter((n) => n.category === 'deadline').length,
      unread: notificationsList.filter((n) => !n.read).length,
    };
  }, [notificationsList]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Classroom Notifications & Deadlines"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      {/* Click outside backdrop to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-[#FAF8FE] dark:bg-[#0B0F19] border-s border-[#EDE8F5] dark:border-slate-800/80 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-end duration-200 text-start">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#EDE8F5] dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1E1B4B] dark:text-slate-100 truncate">
                  Notifications & Activity
                </h2>
                {counts.unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black">
                    {counts.unread} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Announcements, assignments & deadlines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {counts.unread > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                title="Mark all as read"
                className="h-8 px-2.5 rounded-lg text-xs font-bold text-[#7C3AED] dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="px-4 py-2.5 bg-white/70 dark:bg-slate-900/70 border-b border-[#EDE8F5] dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-[#7C3AED] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'announcements'
                  ? 'bg-white dark:bg-slate-700 text-[#7C3AED] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Announcements ({counts.announcements})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'assignments'
                  ? 'bg-white dark:bg-slate-700 text-[#7C3AED] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Assignments ({counts.assignments})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deadlines')}
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'deadlines'
                  ? 'bg-white dark:bg-slate-700 text-[#7C3AED] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Deadlines ({counts.deadlines})
            </button>
          </div>
        </div>

        {/* Drawer Body — Notification Cards */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 mx-auto flex items-center justify-center">
                <CheckCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100">
                You're all caught up!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                No new {activeTab === 'all' ? 'notifications' : activeTab} to show. You will receive updates as instructors publish course announcements and assignments.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isAnnouncement = notif.category === 'announcement';
              const isAssignment = notif.category === 'assignment';
              const isDeadline = notif.category === 'deadline';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all text-start space-y-2.5 ${
                    notif.read
                      ? 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      : isDeadline
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/60 shadow-xs'
                  }`}
                >
                  {/* Top Row: Category badge & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isAnnouncement
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : isAssignment
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isAnnouncement ? (
                          <Megaphone className="w-3.5 h-3.5" />
                        ) : isAssignment ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                        {isAnnouncement
                          ? 'Classroom Notice'
                          : isAssignment
                          ? 'New Assignment'
                          : 'Due Date Alert'}
                      </span>

                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" title="Unread" />
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 shrink-0">
                      {notif.date}
                    </span>
                  </div>

                  {/* Title & Classroom Context */}
                  <div>
                    <h4 className="text-sm font-black text-[#1E1B4B] dark:text-slate-100 line-clamp-2">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{notif.classroomTitle || 'General'}</span>
                      {notif.authorName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold">{notif.authorName}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Content body */}
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {notif.content}
                  </p>

                  {/* Due Date highlight if present */}
                  {notif.dueDate && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-950 dark:text-amber-200">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Due: {notif.dueDate}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {isAnnouncement && (
                      <button
                        type="button"
                        onClick={() => {
                          markAsRead(notif.id);
                          onClose();
                          if (notif.classroomId && onOpenClassroomChat) {
                            onOpenClassroomChat(notif.classroomId);
                          }
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Classroom Chat</span>
                      </button>
                    )}

                    {(isAssignment || isDeadline) && (
                      <button
                        type="button"
                        onClick={() => {
                          markAsRead(notif.id);
                          onClose();
                          if (onOpenAssessment) {
                            onOpenAssessment(notif.actionTargetId);
                          }
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>View Assignment / Test</span>
                      </button>
                    )}

                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notif.id)}
                        className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-white/95 dark:bg-[#111827]/95 border-t border-[#EDE8F5] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {counts.unread > 0 ? (
              <span className="font-bold text-[#7C3AED] dark:text-purple-400">
                {counts.unread} unread item{counts.unread > 1 ? 's' : ''}
              </span>
            ) : (
              <span>All items caught up</span>
            )}
          </div>

          {onNavigateToScreen && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToScreen('my_classrooms');
              }}
              className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View My Classrooms</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
