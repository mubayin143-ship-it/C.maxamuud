import React from 'react';
import { ClipboardCheck, X, Calendar, Sparkles, ArrowRight } from 'lucide-react';

export interface PublishedAssessmentAlertData {
  id: string;
  title: string;
  type: 'test' | 'quiz';
  subject: string;
  classroomName?: string;
  teacherName?: string;
  dueDate?: string;
  totalQuestions?: number;
}

export interface AssessmentAlertBannerProps {
  alert: PublishedAssessmentAlertData;
  onDismiss: (alertId: string) => void;
  onOpen?: (alertId: string) => void;
}

export const AssessmentAlertBanner: React.FC<AssessmentAlertBannerProps> = ({
  alert,
  onDismiss,
  onOpen,
}) => {
  if (!alert) return null;

  const isQuiz = alert.type === 'quiz' || /quiz|kedis/i.test(alert.title);
  const titleId = `assessment-alert-title-${alert.id}`;
  const descId = `assessment-alert-desc-${alert.id}`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onDismiss(alert.id);
        }
      }}
      className="assessment-alert-banner relative overflow-hidden p-4 rounded-2xl sm:rounded-3xl bg-amber-500/15 dark:bg-amber-950/70 border-2 border-amber-600 dark:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.2)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 text-start"
    >
      {/* Screen reader proactive announcement */}
      <span className="sr-only">
        {isQuiz ? 'New quiz published' : 'New test published'}: {alert.title}.{' '}
        {alert.classroomName ? `Classroom: ${alert.classroomName}. ` : ''}
        {alert.dueDate ? `Due date: ${alert.dueDate}.` : ''} Press Escape to dismiss.
      </span>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl bg-amber-950 dark:bg-amber-300 text-white dark:text-amber-950 border border-amber-900 dark:border-amber-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5"
            aria-hidden="true"
          >
            <ClipboardCheck className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                role="status"
                aria-label={isQuiz ? 'New quiz published' : 'New test published'}
                className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-950 dark:bg-amber-300 text-white dark:text-amber-950 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs border border-amber-950 dark:border-amber-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-amber-950 animate-ping" aria-hidden="true" />
                <Sparkles className="w-3 h-3 text-amber-300 dark:text-amber-950" aria-hidden="true" />
                <span>{isQuiz ? 'New Quiz Published' : 'New Test Published'}</span>
              </span>
              {alert.dueDate && (
                <span
                  role="status"
                  aria-label={`Due date: ${alert.dueDate}`}
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 border border-amber-800 dark:border-amber-400 flex items-center gap-1.5 shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[2.5] text-amber-900 dark:text-amber-300" aria-hidden="true" />
                  <span>Due: {alert.dueDate}</span>
                </span>
              )}
            </div>
            <h3
              id={titleId}
              className="text-sm sm:text-base font-black text-slate-950 dark:text-white truncate"
            >
              {alert.title}
            </h3>
            <p
              id={descId}
              className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
            >
              {alert.classroomName || alert.subject}
              {alert.teacherName ? ` · ${alert.teacherName}` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          aria-label={`Close notification for ${alert.title} (or press Escape)`}
          title="Dismiss notification (Esc)"
          className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-950 hover:text-black dark:text-white dark:hover:text-amber-100 hover:bg-slate-950/10 dark:hover:bg-white/20 transition-all cursor-pointer shrink-0 border border-slate-900/20 dark:border-white/30 hover:border-slate-900 dark:hover:border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/40 dark:focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 flex items-center justify-center"
        >
          <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1" role="group" aria-label="Assessment alert actions">
        {onOpen && (
          <button
            type="button"
            onClick={() => onOpen(alert.id)}
            aria-label={`${isQuiz ? 'Start quiz' : 'View test'}: ${alert.title}`}
            className="group flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 active:bg-black dark:bg-purple-200 dark:hover:bg-purple-100 dark:active:bg-purple-300 text-white dark:text-purple-950 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm border-2 border-purple-950 dark:border-purple-100 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-700/50 dark:focus-visible:ring-purple-300/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <ClipboardCheck className="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
            <span className="group-hover:underline underline-offset-2">{isQuiz ? 'Start Quiz' : 'View Test'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5 shrink-0" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          aria-label={`Dismiss notification for ${alert.title}`}
          className="group min-h-[44px] py-2.5 px-4 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-950 dark:text-white text-xs sm:text-sm font-black transition-all border-2 border-slate-900 dark:border-slate-200 hover:border-black dark:hover:border-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/40 dark:focus-visible:ring-slate-100/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5] text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white" aria-hidden="true" />
          <span className="group-hover:underline underline-offset-2">Dismiss</span>
        </button>
      </div>
    </div>
  );
};

export default AssessmentAlertBanner;
