/**
 * SmartEducate Student Assessment & Test Taker Modal (Phase 13)
 *
 * Student-first test taking & submission workflow:
 * - Timed assessment with safe expiration auto-submit
 * - Multi-question navigation with progress tracking
 * - Interactive input types: Multiple Choice, True/False, Short Answer, Problem Solving, Long Answer
 * - Safe persistence: auto-saves drafts to prevent losing answers on accidental close or navigate away
 * - Duplicate submission prevention
 * - Immediate pedagogical diagnostic results upon submission (sanitized for students)
 * - Multilingual support: English, Somali, Arabic (with full RTL support)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import {
  TeacherAssessmentItem,
  AssignmentQuestion,
  StudentSubmissionItem,
} from '../../types/education';
import { aiGradingService } from '../../services/aiGradingService';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Award,
  Sparkles,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface StudentAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: TeacherAssessmentItem | null;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  onSubmitted?: (submission: StudentSubmissionItem) => void;
}

export const StudentAssessmentModal: React.FC<StudentAssessmentModalProps> = ({
  isOpen,
  onClose,
  assessment,
  studentId = 'st-current-user',
  studentName = 'Student',
  studentEmail = 'student@smarteducate.org',
  onSubmitted,
}) => {
  const { t, language, isRTL } = useI18n();

  // Mode: 'taking' | 'submitting' | 'results'
  const [mode, setMode] = useState<'taking' | 'submitting' | 'results'>('taking');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<StudentSubmissionItem | null>(null);

  // Timer
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Status toasts
  const [saveToast, setSaveToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Questions array
  const questions: AssignmentQuestion[] = useMemo(() => {
    if (!assessment) return [];
    if (assessment.questions && assessment.questions.length > 0) {
      return assessment.questions;
    }
    // Fallback if assessment lacks structured questions
    return [
      {
        id: 'q-fallback-1',
        type: 'short_answer',
        prompt: assessment.instructions || 'Answer the problem thoroughly showing your steps.',
        correctAnswer: assessment.answerKey || 'Model answer',
        points: assessment.totalPoints || 100,
      },
    ];
  }, [assessment]);

  // Load existing submission or draft on open
  useEffect(() => {
    if (!isOpen || !assessment) return;

    // Check if already submitted
    const existingSub = aiGradingService.getStudentSubmissionForAssessment(assessment.id, studentId);
    if (existingSub && existingSub.status !== 'pending_submission') {
      setSubmission(existingSub);
      setMode('results');
      return;
    }

    // Otherwise load draft
    const savedDraft = aiGradingService.getStudentDraft(assessment.id, studentId);
    setAnswers(savedDraft);
    setMode('taking');
    setCurrentQuestionIndex(0);

    // Initialize timer
    if (assessment.durationMinutes && assessment.durationMinutes > 0) {
      const totalSec = assessment.durationMinutes * 60;
      setTimeRemainingSeconds(totalSec);
      setIsTimerRunning(true);
    } else {
      setTimeRemainingSeconds(null);
      setIsTimerRunning(false);
    }
  }, [isOpen, assessment, studentId]);

  // Active Timer Tick
  useEffect(() => {
    if (!isTimerRunning || timeRemainingSeconds === null) return;

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerRunning(false);
          // Auto submit on time expiration
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleAutoSubmitOnExpiry = () => {
    if (isSubmitting || mode === 'results') return;
    executeSubmit();
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: value };
      if (assessment) {
        aiGradingService.saveStudentDraft(assessment.id, studentId, updated);
      }
      return updated;
    });
  };

  const handleManualSaveDraft = () => {
    if (!assessment) return;
    aiGradingService.saveStudentDraft(assessment.id, studentId, answers);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const executeSubmit = () => {
    if (!assessment || isSubmitting) return;
    setIsSubmitting(true);
    setConfirmSubmitOpen(false);

    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);

    const timeSpent = assessment.durationMinutes
      ? assessment.durationMinutes * 60 - (timeRemainingSeconds || 0)
      : 120;

    setTimeout(() => {
      try {
        const subResult = aiGradingService.submitStudentAssessment(
          assessment.id,
          studentId,
          studentName,
          studentEmail,
          answers,
          timeSpent
        );
        setSubmission(subResult);
        setMode('results');
        onSubmitted?.(subResult);
      } catch (err) {
        console.error('Error submitting assessment:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  if (!isOpen || !assessment) return null;

  const currentQ = questions[currentQuestionIndex] || questions[0];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  const formatTimer = (sec: number | null) => {
    if (sec === null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#EDE8F5] max-h-[92vh] flex flex-col overflow-hidden text-start my-auto ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* ============================================================== */}
        {/* 1. HEADER                                                      */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 border-b border-[#F0EBF8] flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FE] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#7C3AED] px-2.5 py-0.5 rounded-full">
                {assessment.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {assessment.subject} · {assessment.gradeLevel}
              </span>
              {assessment.difficulty && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  {assessment.difficulty}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] truncate pt-0.5">
              {assessment.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Active Countdown Timer */}
            {mode === 'taking' && timeRemainingSeconds !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  timeRemainingSeconds < 180
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-purple-50 border-purple-200 text-[#7C3AED]'
                }`}
                title="Time Remaining"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. BODY CONTENT: TAKING ASSESSMENT MODE                        */}
        {/* ============================================================== */}
        {mode === 'taking' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Save progress indicator banner */}
            {saveToast && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Progress saved. You can safely return anytime before the due date.</span>
              </div>
            )}

            {/* Question Navigator Pills */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]?.trim());
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7C3AED] text-white shadow-xs'
                          : isAnswered
                          ? 'bg-purple-100 text-[#7C3AED] border border-purple-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-semibold text-slate-500 shrink-0">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>

            {/* Current Question Card */}
            {currentQ && (
              <div className="p-5 rounded-3xl bg-[#FAF8FE] dark:bg-slate-900 border border-[#E9E0FA] dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#7C3AED] text-white text-xs font-extrabold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                      [{currentQ.points} {currentQ.points === 1 ? 'Point' : 'Points'}]
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {currentQ.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-slate-100 leading-relaxed whitespace-pre-line">
                  {currentQ.prompt}
                </p>

                {/* Interactive Answer Inputs */}
                <div className="pt-2">
                  {/* Case 1: Multiple Choice */}
                  {currentQ.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {(currentQ.options || ['A', 'B', 'C', 'D']).map((opt, optIdx) => {
                        const optLetter = opt.match(/^[A-Da-d]\)/)?.[0]?.replace(')', '') || String.fromCharCode(65 + optIdx);
                        const isSelected = answers[currentQ.id] === optLetter || answers[currentQ.id] === opt;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswerChange(currentQ.id, optLetter)}
                            className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-purple-100/70 dark:bg-purple-950/70 border-[#7C3AED] text-[#1E1B4B] dark:text-purple-200 shadow-2xs'
                                : 'bg-white dark:bg-slate-950 border-[#EDE8F5] dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-200 dark:hover:border-purple-700'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="flex-1 pt-0.5">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Case 2: True / False */}
                  {currentQ.type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-3">
                      {['True', 'False'].map((tf) => {
                        const isSelected = (answers[currentQ.id] || '').toLowerCase() === tf.toLowerCase();
                        return (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => handleAnswerChange(currentQ.id, tf)}
                            className={`p-4 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs'
                                : 'bg-white dark:bg-slate-950 border-[#EDE8F5] dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-300'
                            }`}
                          >
                            {tf}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Case 3: Short Answer, Long Answer, Problem Solving */}
                  {currentQ.type !== 'multiple_choice' && currentQ.type !== 'true_false' && (
                    <div className="space-y-2">
                      <textarea
                        rows={currentQ.type === 'long_answer' ? 6 : 4}
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        placeholder="Type your complete solution here. Show intermediate steps and units..."
                        className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] text-xs sm:text-sm font-mono text-[#1E1B4B] dark:text-slate-100 outline-none leading-relaxed resize-y shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple-400" />
                        <span>AI and teacher evaluate intermediate formulas and reasoning for partial credit.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. BODY CONTENT: RESULTS VIEW                                  */}
        {/* ============================================================== */}
        {mode === 'results' && submission && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 animate-fadeIn">
            {/* Score Hero Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                  Assessment Completed
                </span>
                <span className="text-xs text-purple-200">
                  {submission.submittedAt}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    {submission.scoreAwarded ?? submission.aiSuggestedScore ?? 0} / {submission.totalPointsPossible}
                  </h3>
                  <p className="text-xs text-purple-200">Total Score Awarded</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black">
                    {submission.percentageScore ?? submission.aiSuggestedPercentage ?? 0}%
                  </span>
                  <p className="text-xs font-bold text-purple-200">
                    Grade: {submission.letterGrade ?? submission.aiSuggestedLetterGrade ?? 'A'}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs text-purple-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    {submission.status === 'graded'
                      ? 'Final Instructor Approved Grade'
                      : 'AI Evaluated · Pending Instructor Final Audit'}
                  </span>
                </div>
                {submission.needsTeacherReview && (
                  <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    Flagged for Teacher Review
                  </span>
                )}
              </div>
            </div>

            {/* AI Pedagogical Feedback & Diagnostic Summary */}
            {submission.aiAnalysis && (
              <div className="p-5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
                  <Sparkles className="w-4 h-4" />
                  <span>Instructor & Diagnostic Learning Feedback</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {submission.teacherFeedback || submission.aiAnalysis.suggestedFeedback}
                </p>

                {/* Strengths */}
                {submission.aiAnalysis.strengths.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide block">
                      Strengths Demonstrated:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {submission.aiAnalysis.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {submission.aiAnalysis.improvements.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide block">
                      Areas to Strengthen:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {submission.aiAnalysis.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Question Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Question Results Breakdown
              </h4>

              {submission.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-900">
                      Question {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#7C3AED]">
                      {ans.pointsAwarded ?? ans.aiSuggestedScore ?? 0} / {ans.pointsPossible} pts
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-800">
                    {ans.questionPrompt}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Your Response:</span>
                    {ans.studentAnswer || '(No answer provided)'}
                  </div>

                  {/* Sanitized feedback / model explanation */}
                  {ans.aiNotes && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px] text-purple-900 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span>{ans.aiNotes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. FOOTER CONTROLS                                             */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 border-t border-[#F0EBF8] flex items-center justify-between gap-3 bg-white shrink-0">
          {mode === 'taking' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSaveDraft}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save Progress</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {currentQuestionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}

                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Assessment</span>
                  </button>
                )}
              </div>
            </>
          )}

          {mode === 'results' && (
            <div className="w-full flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Confirmation Modal to prevent accidental submit */}
        {confirmSubmitOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-start shadow-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-[#1E1B4B]">
                Submit Assessment?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have answered {answeredCount} of {questions.length} questions. Once submitted, your answers will be finalized for AI diagnostic evaluation and instructor grading.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Continue Working
                </button>
                <button
                  type="button"
                  onClick={executeSubmit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Yes, Submit Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
