/**
 * SmartEducate Teacher AI Grading & Assessment Screen (Phase 13)
 *
 * Professional, teacher-first assessment & grading workflow:
 * - Teacher Assessment Creation with exact 5 difficulties (Easy, Medium, Hard, Very Hard, Extremely Hard)
 * - Supported assessment types: Assignment, Homework, Quiz, Test, Practice Assessment
 * - Canonical curriculum subjects, courses, and topics integration
 * - Assessment Preview & Edit Drawer before publishing (edit questions, duration, marks, regenerate, save draft, publish)
 * - Comprehensive Answer Key & Rubric inspection
 * - Submissions overview per assessment (Submitted, Graded, Pending, Needs Review)
 * - Strict integrity safeguard: Pending students cannot receive fabricated grades
 * - Deterministic + AI subjective grading assistance with teacher in-control approval flow
 * - Teacher override: editable question points, overall score, and custom feedback
 * - Low-confidence flag detection: marks ambiguous responses for manual review
 * - Automatic synchronization with canonical AcademicGradingService (gradebook & certificates)
 * - Multilingual: English, Somali, Arabic with full RTL mirroring
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import {
  TeacherAssessmentItem,
  StudentSubmissionItem,
  GlobalClassroom,
  AssignmentQuestion,
  AiTeacherDifficulty,
  QuestionType,
} from '../../types/education';
import { aiGradingService } from '../../services/aiGradingService';
import {
  generateTeacherContent,
  generateAssessmentVoiceExplanation,
  buildCompleteAssessmentSpeechSections,
} from '../../services/teacherAiService';
import { voiceService, VoiceEngineType, VoiceGender } from '../../services/voiceService';
import { useStudent } from '../../state/StudentContext';
import { auth } from '../../services/firebase';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  FileText,
  Search,
  Check,
  RefreshCw,
  X,
  ChevronRight,
  Sliders,
  Plus,
  Trash2,
  Eye,
  Edit3,
  BookOpen,
  Send,
  Save,
  HelpCircle,
  Volume2,
  Pause,
  Play,
  Square,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface TeacherAssessmentsScreenProps {
  onBack: () => void;
  activeClassroom?: GlobalClassroom;
  teacherClassrooms?: GlobalClassroom[];
  initialAssessmentId?: string;
  currentUserId?: string;
}

export const TeacherAssessmentsScreen: React.FC<TeacherAssessmentsScreenProps> = ({
  onBack,
  activeClassroom,
  teacherClassrooms = [],
  initialAssessmentId,
  currentUserId,
}) => {
  const { t, language, isRTL } = useI18n();
  const { profile, setVoicePreference } = useStudent();

  // Active voice gender preference: synchronized with StudentContext & canonical storage
  const activeVoiceGender: VoiceGender =
    profile?.voicePreference ||
    voiceService.getSavedVoiceGender();

  const handleVoiceGenderChange = (newGender: VoiceGender) => {
    if (newGender === activeVoiceGender) return;
    setVoicePreference(newGender);
    voiceService.saveVoiceGender(newGender);
    if (isPlayingAssessVoice || isPausedAssessVoice) {
      voiceService.stopSequence();
      voiceService.stop();
      setIsPlayingAssessVoice(false);
      setIsPausedAssessVoice(false);
      setIsLoadingAssessVoice(false);
    }
  };

  // State
  const [assessments, setAssessments] = useState<TeacherAssessmentItem[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(
    initialAssessmentId || null
  );
  const [submissions, setSubmissions] = useState<StudentSubmissionItem[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<
    'all' | 'assignment' | 'quiz' | 'test' | 'homework' | 'practice_assessment' | 'draft'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Submissions list filter
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'needs_grading' | 'graded' | 'pending' | 'needs_review'>('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Active student grading modal state
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmissionItem | null>(null);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [editedScore, setEditedScore] = useState<number>(0);
  const [editedFeedback, setEditedFeedback] = useState<string>('');
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // =========================================================================
  // ASSESSMENT CREATION & PREVIEW MODAL STATE
  // =========================================================================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);

  // Form parameters
  const [createType, setCreateType] = useState<'assignment' | 'homework' | 'quiz' | 'test' | 'practice_assessment'>('assignment');
  const [createGrade, setCreateGrade] = useState('Grade 10');
  const [createSubject, setCreateSubject] = useState('Mathematics');
  const [createTopic, setCreateTopic] = useState('Algebra & Quadratic Equations');
  const [createQuestionCount, setCreateQuestionCount] = useState(3);
  const [createDifficulty, setCreateDifficulty] = useState<AiTeacherDifficulty>('Medium');
  const [createLanguage, setCreateLanguage] = useState<'English' | 'Somali' | 'Arabic'>('English');
  const [createDuration, setCreateDuration] = useState(45);
  const [createTotalMarks, setCreateTotalMarks] = useState(50);
  const [createQuestionType, setCreateQuestionType] = useState<
    'Mixed' | 'Multiple Choice' | 'True / False' | 'Short Answer' | 'Long Answer'
  >('Mixed');

  // Preview & Edit modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState<TeacherAssessmentItem | null>(null);

  // Answer Key modal state
  const [answerKeyModalAssessment, setAnswerKeyModalAssessment] = useState<TeacherAssessmentItem | null>(null);

  // Canonical Teacher Ownership Identifier (STEP 05C ITEM 3)
  const effectiveTeacherId = currentUserId || auth.currentUser?.uid || 'teacher_1';

  // Deletion Confirmation Dialog State (STEP 05C ITEM 3)
  const [deleteModalAssessment, setDeleteModalAssessment] = useState<TeacherAssessmentItem | null>(null);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Natural Human-Quality Voice Explanation State (STEP 05C ITEM 2)
  const [isPlayingAssessVoice, setIsPlayingAssessVoice] = useState(false);
  const [isPausedAssessVoice, setIsPausedAssessVoice] = useState(false);
  const [isLoadingAssessVoice, setIsLoadingAssessVoice] = useState(false);
  const [assessVoiceText, setAssessVoiceText] = useState<string>('');
  const [assessVoiceError, setAssessVoiceError] = useState<string | null>(null);
  const [showAssessTranscript, setShowAssessTranscript] = useState(false);
  const [assessSeqProgress, setAssessSeqProgress] = useState<{ current: number; total: number }>({ current: 1, total: 1 });
  const activeAssessVoiceReqId = React.useRef<number>(0);

  // Voice engine & quota states
  const [assessVoiceEngine, setAssessVoiceEngine] = useState<VoiceEngineType>(() => voiceService.getVoiceEngine());
  const [isAssessQuotaExhausted, setIsAssessQuotaExhausted] = useState<boolean>(() => voiceService.isNeuralQuotaExhausted());
  const [isCheckingAssessQuota, setIsCheckingAssessQuota] = useState<boolean>(false);

  useEffect(() => {
    const unsub = voiceService.onQuotaOrEngineChange((exhausted, engine) => {
      setIsAssessQuotaExhausted(exhausted);
      setAssessVoiceEngine(engine);
    });
    return unsub;
  }, []);

  // Clean up audio playback when modals close or component unmounts
  useEffect(() => {
    return () => {
      voiceService.stop();
      setIsPlayingAssessVoice(false);
      setIsPausedAssessVoice(false);
      setIsLoadingAssessVoice(false);
    };
  }, [previewModalOpen, answerKeyModalAssessment]);

  // Load assessments
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const list = aiGradingService.getAssessments();
    setAssessments(list);
    if (selectedAssessmentId) {
      const subs = aiGradingService.getSubmissionsForAssessment(selectedAssessmentId);
      setSubmissions(subs);
    }
  };

  // When selected assessment changes
  useEffect(() => {
    if (selectedAssessmentId) {
      const subs = aiGradingService.getSubmissionsForAssessment(selectedAssessmentId);
      setSubmissions(subs);
    } else {
      setSubmissions([]);
    }
  }, [selectedAssessmentId]);

  // Active assessment
  const activeAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAssessmentId) || null;
  }, [assessments, selectedAssessmentId]);

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((asm) => {
      const matchesType =
        activeTabFilter === 'all' ||
        (activeTabFilter === 'draft' ? asm.status === 'draft' : asm.type === activeTabFilter);

      const matchesSearch =
        asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asm.classroomName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [assessments, activeTabFilter, searchQuery]);

  // Filtered submissions for active assessment
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesStatus =
        submissionFilter === 'all' ||
        (submissionFilter === 'needs_grading' &&
          (sub.status === 'submitted' || sub.status === 'ai_evaluated' || sub.status === 'needs_review')) ||
        (submissionFilter === 'needs_review' && sub.status === 'needs_review') ||
        (submissionFilter === 'graded' && sub.status === 'graded') ||
        (submissionFilter === 'pending' && sub.status === 'pending_submission');

      const matchesSearch =
        sub.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (sub.studentEmail && sub.studentEmail.toLowerCase().includes(studentSearch.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [submissions, submissionFilter, studentSearch]);

  // Overall stats
  const stats = useMemo(() => {
    const totalAssessments = assessments.length;
    let totalSubmissions = 0;
    let totalGraded = 0;
    let totalPendingReview = 0;

    assessments.forEach((a) => {
      totalSubmissions += a.submittedCount;
      totalGraded += a.gradedCount;
      totalPendingReview += Math.max(0, a.submittedCount - a.gradedCount);
    });

    return { totalAssessments, totalSubmissions, totalGraded, totalPendingReview };
  }, [assessments]);

  // Open grading modal for a student
  const handleOpenGrading = (sub: StudentSubmissionItem) => {
    if (sub.status === 'pending_submission') {
      setStatusMessage({
        type: 'info',
        text: `${sub.studentName} has not submitted their work yet. Grading cannot be performed until student submits.`,
      });
      return;
    }

    setGradingSubmission(sub);
    setEditedScore(sub.scoreAwarded ?? sub.aiSuggestedScore ?? sub.totalPointsPossible);
    setEditedFeedback(sub.teacherFeedback ?? sub.aiAnalysis?.suggestedFeedback ?? '');

    const initialQScores: Record<string, number> = {};
    sub.answers.forEach((ans) => {
      initialQScores[ans.questionId] = ans.pointsAwarded ?? ans.aiSuggestedScore ?? ans.pointsPossible;
    });
    setQuestionScores(initialQScores);
  };

  // Run AI Evaluation
  const handleRunAiEvaluation = () => {
    if (!gradingSubmission || !activeAssessment) return;

    setIsEvaluatingAi(true);
    setTimeout(() => {
      try {
        const evaluated = aiGradingService.evaluateSubmissionWithAi(
          gradingSubmission.id,
          activeAssessment
        );
        setGradingSubmission(evaluated);
        setEditedScore(evaluated.aiSuggestedScore || evaluated.totalPointsPossible);
        setEditedFeedback(evaluated.aiAnalysis?.suggestedFeedback || '');

        const qScores: Record<string, number> = {};
        evaluated.answers.forEach((ans) => {
          qScores[ans.questionId] = ans.pointsAwarded ?? ans.aiSuggestedScore ?? ans.pointsPossible;
        });
        setQuestionScores(qScores);

        setStatusMessage({
          type: 'success',
          text: `AI evaluation completed for ${evaluated.studentName}. Suggested score: ${evaluated.aiSuggestedScore}/${evaluated.totalPointsPossible}. Review and approve below.`,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsEvaluatingAi(false);
      }
    }, 600);
  };

  // Approve and publish grade
  const handleApproveGrade = () => {
    if (!gradingSubmission) return;

    const approved = aiGradingService.approveGrade(
      gradingSubmission.id,
      editedScore,
      editedFeedback,
      questionScores
    );

    refreshData();
    setGradingSubmission(null);

    setStatusMessage({
      type: 'success',
      text: `Grade successfully approved & published for ${approved.studentName} (${approved.percentageScore}% - ${approved.letterGrade})! Gradebook synchronized.`,
    });
  };

  // Request revision
  const handleRequestRevision = () => {
    if (!gradingSubmission) return;

    aiGradingService.requestRevision(
      gradingSubmission.id,
      editedFeedback || 'Please review your step-by-step working and resubmit.'
    );

    refreshData();
    setGradingSubmission(null);

    setStatusMessage({
      type: 'info',
      text: `Revision request sent to ${gradingSubmission.studentName}.`,
    });
  };

  // Send reminder to pending student
  const handleSendReminder = (sub: StudentSubmissionItem) => {
    aiGradingService.sendReminder(sub.id);
    refreshData();
    setStatusMessage({
      type: 'success',
      text: `Polite submission reminder sent to ${sub.studentName}.`,
    });
  };

  // =========================================================================
  // ASSESSMENT GENERATION & PREVIEW LOGIC
  // =========================================================================
  const handleGenerateAssessment = async () => {
    setIsCreatingLoading(true);

    try {
      const generated = await generateTeacherContent({
        contentType: createType === 'practice_assessment' ? 'assignment' : createType,
        gradeOrLevel: createGrade,
        subject: createSubject,
        topic: createTopic,
        questionCount: createQuestionCount,
        difficulty: createDifficulty,
        language: createLanguage,
        durationMinutes: createDuration,
        totalMarks: createTotalMarks,
        questionType: createQuestionType,
      });

      const structuredQs: AssignmentQuestion[] = generated.structuredQuestions || [
        {
          id: `q_1_${Date.now()}`,
          type: 'short_answer',
          prompt: `Solve the fundamental problem in ${createTopic}: Explain the core principle and intermediate steps.`,
          correctAnswer: 'Model answer showing all intermediate steps.',
          points: createTotalMarks,
        },
      ];

      const draftAsm: TeacherAssessmentItem = {
        id: `asm_${Date.now().toString(36)}`,
        title: generated.title,
        subject: createSubject,
        gradeLevel: createGrade,
        courseTopic: createTopic,
        classroomId: activeClassroom?.id || 'cls-101',
        classroomName: activeClassroom?.title || 'Active University Classroom',
        type: createType,
        difficulty: createDifficulty,
        durationMinutes: createDuration,
        language: createLanguage,
        instructions: `Complete all ${structuredQs.length} questions. Show intermediate derivations and units.`,
        totalQuestions: structuredQs.length,
        totalPoints: createTotalMarks,
        totalStudents: 24,
        submittedCount: 0,
        gradedCount: 0,
        pendingCount: 24,
        status: 'draft',
        dueDate: 'Next Week',
        createdAt: new Date().toLocaleDateString(),
        questions: structuredQs,
        answerKey: generated.answerKey,
        gradingRubric: generated.gradingRubric,
      };

      setPreviewAssessment(draftAsm);
      setIsCreateModalOpen(false);
      setPreviewModalOpen(true);
    } catch (e) {
      console.error('Error generating assessment:', e);
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const handleSaveAssessmentDraft = () => {
    if (!previewAssessment) return;
    aiGradingService.createAssessment({
      ...previewAssessment,
      status: 'draft',
    });
    refreshData();
    setPreviewModalOpen(false);
    setPreviewAssessment(null);
    setStatusMessage({
      type: 'success',
      text: `Assessment "${previewAssessment.title}" saved as draft. You can edit and publish anytime.`,
    });
  };

  const handlePublishAssessmentNow = () => {
    if (!previewAssessment) return;
    aiGradingService.createAssessment({
      ...previewAssessment,
      status: 'active',
    });
    refreshData();
    setPreviewModalOpen(false);
    setPreviewAssessment(null);
    setStatusMessage({
      type: 'success',
      text: `Assessment "${previewAssessment.title}" successfully published to classroom! Students can now submit their work.`,
    });
  };

  const handleOpenDeleteModal = (asm: TeacherAssessmentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    setDeleteModalAssessment(asm);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalAssessment || isDeletingAssessment) return;
    setIsDeletingAssessment(true);
    setDeleteError(null);

    try {
      const result = aiGradingService.deleteAssessment(deleteModalAssessment.id, effectiveTeacherId);
      if (result.success) {
        const deletedTitle = deleteModalAssessment.title;
        refreshData();
        if (selectedAssessmentId === deleteModalAssessment.id) {
          setSelectedAssessmentId(null);
        }
        setDeleteModalAssessment(null);
        setStatusMessage({
          type: 'success',
          text: `Assignment "${deletedTitle}" was deleted successfully.`,
        });
      } else {
        throw new Error('Could not delete assignment. Please try again.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete assignment. Only the creator can delete it.');
    } finally {
      setIsDeletingAssessment(false);
    }
  };

  const handleToggleAssessVoice = async (
    assessment: TeacherAssessmentItem,
    tab: 'questions' | 'answers' | 'rubric' = 'questions'
  ) => {
    // Prevent duplicate requests from repeated Play taps while audio is preparing in queue
    if (isLoadingAssessVoice) {
      return;
    }

    if (isPausedAssessVoice) {
      voiceService.resumeSequence();
      setIsPausedAssessVoice(false);
      setIsPlayingAssessVoice(true);
      return;
    }

    if (isPlayingAssessVoice) {
      voiceService.pauseSequence();
      setIsPausedAssessVoice(true);
      setIsPlayingAssessVoice(false);
      return;
    }

    setIsLoadingAssessVoice(true);
    setAssessVoiceError(null);
    activeAssessVoiceReqId.current += 1;
    const reqId = activeAssessVoiceReqId.current;

    try {
      const sections = buildCompleteAssessmentSpeechSections(assessment, assessment.language as any, tab);
      setAssessVoiceText(sections.join('\n\n'));
      setAssessSeqProgress({ current: 1, total: sections.length });
      const langCode = assessment.language === 'Arabic' ? 'ar' : assessment.language === 'Somali' ? 'so' : 'en';

      await voiceService.speakSequence(sections, {
        language: langCode,
        gender: activeVoiceGender,
        onChunkStart: (idx, total) => {
          if (activeAssessVoiceReqId.current === reqId) {
            setIsLoadingAssessVoice(false);
            setIsPlayingAssessVoice(true);
            setIsPausedAssessVoice(false);
            setAssessSeqProgress({ current: idx + 1, total });
          }
        },
        onChunkEnd: () => {
          // seamless next chunk
        },
        onComplete: () => {
          if (activeAssessVoiceReqId.current === reqId) {
            setIsPlayingAssessVoice(false);
            setIsPausedAssessVoice(false);
            setIsLoadingAssessVoice(false);
          }
        },
        onError: (err) => {
          if (activeAssessVoiceReqId.current === reqId) {
            setIsPlayingAssessVoice(false);
            setIsPausedAssessVoice(false);
            setIsLoadingAssessVoice(false);
            const msg = typeof err === 'string' ? err : err?.message || 'Voice playback failed.';
            setAssessVoiceError(msg);
            if (msg.includes('quota') || msg.includes('10 requests')) {
              setIsAssessQuotaExhausted(true);
            }
          }
        },
        onAutoplayBlocked: () => {
          if (activeAssessVoiceReqId.current === reqId) {
            setIsLoadingAssessVoice(false);
            setIsPlayingAssessVoice(false);
            setIsPausedAssessVoice(false);
          }
        },
      });
    } catch (err: any) {
      if (activeAssessVoiceReqId.current === reqId) {
        setIsLoadingAssessVoice(false);
        setIsPlayingAssessVoice(false);
        setIsPausedAssessVoice(false);
        const errMsg = err?.message || 'Failed to prepare voice explanation.';
        setAssessVoiceError(errMsg);
        if (errMsg.includes('quota') || errMsg.includes('10 requests')) {
          setIsAssessQuotaExhausted(true);
        }
      }
    }
  };

  const handleSwitchToAssessDeviceFallback = async () => {
    voiceService.setVoiceEngine('device_fallback');
    setAssessVoiceEngine('device_fallback');
    setAssessVoiceError(null);
    if (previewAssessment) {
      await handleToggleAssessVoice(previewAssessment, 'questions');
    }
  };

  const handleSwitchToAssessNeuralVoice = () => {
    voiceService.setVoiceEngine('neural');
    setAssessVoiceEngine('neural');
    setAssessVoiceError(null);
  };

  const handleCheckAssessQuota = async () => {
    setIsCheckingAssessQuota(true);
    try {
      const isAvailable = await voiceService.recheckNeuralQuota();
      if (isAvailable) {
        setIsAssessQuotaExhausted(false);
        setAssessVoiceError(null);
      } else {
        setIsAssessQuotaExhausted(true);
        setAssessVoiceError('Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.');
      }
    } finally {
      setIsCheckingAssessQuota(false);
    }
  };

  // Safe retry function that resumes from failed chunk without restarting
  const handleRetryAssessVoice = async () => {
    if (assessVoiceEngine === 'neural' && (isAssessQuotaExhausted || voiceService.isNeuralQuotaExhausted())) {
      await handleCheckAssessQuota();
      return;
    }
    setAssessVoiceError(null);
    setIsLoadingAssessVoice(true);
    try {
      await voiceService.retryCurrentSequenceChunk();
    } catch (err: any) {
      setIsLoadingAssessVoice(false);
      const errMsg = err?.message || 'Voice is temporarily busy. Your text is still available.';
      setAssessVoiceError(errMsg);
      if (errMsg.includes('quota') || errMsg.includes('10 requests')) {
        setIsAssessQuotaExhausted(true);
      }
    }
  };

  const handleStopAssessVoice = () => {
    activeAssessVoiceReqId.current += 1;
    voiceService.stopSequence();
    voiceService.stop();
    setIsPlayingAssessVoice(false);
    setIsPausedAssessVoice(false);
    setIsLoadingAssessVoice(false);
  };

  const handlePublishDraftDirectly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    aiGradingService.publishAssessment(id);
    refreshData();
    setStatusMessage({
      type: 'success',
      text: 'Draft assessment published to classroom.',
    });
  };

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 text-start animate-fadeIn pb-24 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* ============================================================== */}
      {/* 1. HEADER (EDUCATE VISUAL LANGUAGE)                            */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (selectedAssessmentId) {
                setSelectedAssessmentId(null);
              } else {
                onBack();
              }
            }}
            className="w-10 h-10 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800 border border-[#EDE8F5] dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title="Back"
          >
            <ArrowIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100">
                {selectedAssessmentId ? activeAssessment?.title : 'SmartEducate AI Grading'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {selectedAssessmentId
                ? `${activeAssessment?.subject} · ${activeAssessment?.gradeLevel} · Submissions Review`
                : 'AI-assisted evaluation with full teacher approval control'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!selectedAssessmentId && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assessment</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Instructor Mode</span>
            <span className="sm:hidden">Active</span>
          </div>
        </div>
      </div>

      {/* Status banner / toast notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-purple-50 text-[#7C3AED] border border-purple-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#7C3AED] shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STATS BAR (COHORT OVERVIEW)                                 */}
      {/* ============================================================== */}
      {!selectedAssessmentId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Assessments
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#1E1B4B]">
              {stats.totalAssessments}
            </span>
            <span className="text-[10px] text-slate-400 block">Classroom assignments</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Submissions
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#1E1B4B]">
              {stats.totalSubmissions}
            </span>
            <span className="text-[10px] text-slate-400 block">Completed by students</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Graded & Approved
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              {stats.totalGraded}
            </span>
            <span className="text-[10px] text-slate-400 block">Gradebook verified</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Needs Review
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700">
              {stats.totalPendingReview}
            </span>
            <span className="text-[10px] text-slate-400 block">Awaiting teacher signoff</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VIEW MODE A: ASSESSMENT LIST VIEW                           */}
      {/* ============================================================== */}
      {!selectedAssessmentId && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex rounded-2xl bg-[#EDE9FE]/50 p-1 gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'assignment', label: 'Assignments' },
                { id: 'quiz', label: 'Quizzes' },
                { id: 'test', label: 'Tests' },
                { id: 'homework', label: 'Homework' },
                { id: 'practice_assessment', label: 'Practice' },
                { id: 'draft', label: 'Drafts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTabFilter === tab.id
                      ? 'bg-white text-[#7C3AED] shadow-2xs'
                      : 'text-slate-600 hover:text-[#7C3AED]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full h-10 ps-10 pe-3 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-xs text-[#1E1B4B] shadow-2xs outline-none"
              />
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="space-y-3.5">
            {filteredAssessments.map((asm) => {
              const pendingReviewCount = Math.max(0, asm.submittedCount - asm.gradedCount);
              const submissionRate = Math.round((asm.submittedCount / asm.totalStudents) * 100);

              return (
                <div
                  key={asm.id}
                  className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-purple-300 shadow-2xs transition-all space-y-4 text-start"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED]">
                          {asm.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {asm.subject} · {asm.gradeLevel}
                        </span>
                        {asm.difficulty && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md">
                            {asm.difficulty}
                          </span>
                        )}
                        {asm.status === 'draft' ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border">
                            Draft
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Due: {asm.dueDate}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100">
                        {asm.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Classroom: <span className="font-semibold text-slate-700 dark:text-slate-300">{asm.classroomName}</span> · {asm.totalQuestions} Questions · {asm.totalPoints} Points · {asm.durationMinutes || 45} mins
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {asm.status === 'draft' ? (
                        <button
                          type="button"
                          onClick={(e) => handlePublishDraftDirectly(asm.id, e)}
                          className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish Now</span>
                        </button>
                      ) : pendingReviewCount > 0 ? (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{pendingReviewCount} to review</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All Graded</span>
                        </span>
                      )}

                      {/* Delete Action: strictly restricted to assignment owner */}
                      {(asm.teacherId || 'teacher_1') === effectiveTeacherId ? (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteModal(asm, e)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Assessment"
                          aria-label={`Delete ${asm.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                          title={`Created by ${asm.teacherName || 'Instructor'} · View Only`}
                        >
                          {asm.teacherName ? asm.teacherName.split(' ')[0] : 'Shared'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Progress Bar if not draft */}
                  {asm.status !== 'draft' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1E1B4B]">
                          Submitted: {asm.submittedCount} / {asm.totalStudents} ({submissionRate}%)
                        </span>
                        <span className="text-slate-500">
                          Graded: <strong className="text-emerald-700">{asm.gradedCount}</strong> / {asm.submittedCount}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${(asm.gradedCount / asm.totalStudents) * 100}%` }}
                          title="Graded"
                        />
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: `${(pendingReviewCount / asm.totalStudents) * 100}%` }}
                          title="Pending Review"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EBF8] flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswerKeyModalAssessment(asm)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Answer Key & Rubric</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAssessmentId(asm.id)}
                      className="px-4 py-2 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      <span>Review Submissions ({asm.submittedCount})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredAssessments.length === 0 && (
              <div className="p-8 rounded-3xl bg-white border border-[#EDE8F5] text-center space-y-3">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-[#1E1B4B]">No Assessments Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a new assessment with our Teacher AI engine or change your filter tab.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assessment Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. VIEW MODE B: STUDENT SUBMISSIONS LIST VIEW                  */}
      {/* ============================================================== */}
      {selectedAssessmentId && activeAssessment && (
        <div className="space-y-4">
          {/* Submissions Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex rounded-2xl bg-[#EDE9FE]/50 p-1 gap-1 overflow-x-auto">
              {[
                { id: 'all', label: `All (${submissions.length})` },
                { id: 'needs_grading', label: 'Needs Grading' },
                { id: 'needs_review', label: 'Needs Review' },
                { id: 'graded', label: 'Graded' },
                { id: 'pending', label: 'Pending' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubmissionFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    submissionFilter === tab.id
                      ? 'bg-white text-[#7C3AED] shadow-2xs'
                      : 'text-slate-600 hover:text-[#7C3AED]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full h-9 ps-9 pe-3 rounded-xl bg-white border border-[#EDE8F5] text-xs text-[#1E1B4B] outline-none"
              />
            </div>
          </div>

          {/* Submissions Table / Cards */}
          <div className="space-y-2.5">
            {filteredSubmissions.map((sub) => {
              const isGraded = sub.status === 'graded';
              const isPending = sub.status === 'pending_submission';
              const needsReview = sub.status === 'needs_review' || sub.needsTeacherReview;

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDE8F5] hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-[#1E1B4B]">
                        {sub.studentName}
                      </h4>
                      {isGraded ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Graded · {sub.scoreAwarded}/{sub.totalPointsPossible} ({sub.percentageScore}% - {sub.letterGrade})
                        </span>
                      ) : needsReview ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Needs Review</span>
                        </span>
                      ) : !isPending ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] font-bold text-[10px] border border-purple-200">
                          Submitted · Ready for Grading
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[10px]">
                          Pending Submission
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {sub.studentEmail} · {sub.submittedAt || 'Awaiting submission'}
                    </p>
                    {needsReview && sub.lowConfidenceReason && (
                      <p className="text-[11px] text-amber-700 font-medium">
                        Flag: {sub.lowConfidenceReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => handleSendReminder(sub)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        Send Reminder
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenGrading(sub)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isGraded
                            ? 'bg-purple-50 text-[#7C3AED] hover:bg-purple-100 border border-purple-200'
                            : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isGraded ? 'Review / Edit Grade' : 'Grade Submission'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: TEACHER ASSESSMENT CREATION DIALOG                   */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EDE8F5] max-h-[92vh] flex flex-col overflow-hidden text-start my-auto">
            <div className="p-5 border-b border-[#F0EBF8] flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E1B4B]">
                    Create Canonical Assessment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Uses Teacher AI with canonical curriculum integration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assessment Type</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] bg-white outline-none"
                >
                  <option value="assignment">Assignment</option>
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="test">Test</option>
                  <option value="practice_assessment">Practice Assessment</option>
                </select>
              </div>

              {/* Subject & Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <select
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] bg-white outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Somali">Somali</option>
                    <option value="Economics">Economics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Grade / Level</label>
                  <select
                    value={createGrade}
                    onChange={(e) => setCreateGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] bg-white outline-none"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="University">University</option>
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Curriculum Topic</label>
                <input
                  type="text"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  placeholder="e.g. Linear Equations, Photosynthesis, Newton's Laws..."
                  className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] outline-none"
                />
              </div>

              {/* Difficulty (Locked 5 exact difficulties) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Difficulty Level (Strictly Enforced)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Easy', 'Medium', 'Hard', 'Very Hard', 'Extremely Hard'] as AiTeacherDifficulty[]).map((dif) => (
                    <button
                      key={dif}
                      type="button"
                      onClick={() => setCreateDifficulty(dif)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        createDifficulty === dif
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white border-[#EDE8F5] text-slate-600 hover:border-purple-200'
                      }`}
                    >
                      {dif}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions, Marks & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={createQuestionCount}
                    onChange={(e) => setCreateQuestionCount(parseInt(e.target.value) || 3)}
                    className="w-full h-10 px-3 text-center rounded-xl border border-[#EDE8F5] text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={createDuration}
                    onChange={(e) => setCreateDuration(parseInt(e.target.value) || 30)}
                    className="w-full h-10 px-3 text-center rounded-xl border border-[#EDE8F5] text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Total Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={createTotalMarks}
                    onChange={(e) => setCreateTotalMarks(parseInt(e.target.value) || 50)}
                    className="w-full h-10 px-3 text-center rounded-xl border border-[#EDE8F5] text-xs font-bold"
                  />
                </div>
              </div>

              {/* Language & Question Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Language</label>
                  <select
                    value={createLanguage}
                    onChange={(e) => setCreateLanguage(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] bg-white outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Somali">Somali</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Question Types</label>
                  <select
                    value={createQuestionType}
                    onChange={(e) => setCreateQuestionType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold text-[#1E1B4B] bg-white outline-none"
                  >
                    <option value="Mixed">Mixed (MCQ + Written)</option>
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="True / False">True / False</option>
                    <option value="Short Answer">Short Answer</option>
                    <option value="Long Answer">Long Answer / Problem Solving</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#F0EBF8] bg-[#FAF8FE] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAssessment}
                disabled={isCreatingLoading}
                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {isCreatingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Assessment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate & Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL: ASSESSMENT PREVIEW & EDIT DRAWER                     */}
      {/* ============================================================== */}
      {previewModalOpen && previewAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#EDE8F5] dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden text-start my-auto">
            <div className="p-5 border-b border-[#F0EBF8] dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FE] dark:from-slate-900 dark:to-slate-800/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-300 px-2 py-0.5 rounded-md">
                  Assessment Preview & Editorial Studio
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100 pt-0.5">
                  {previewAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Natural AI Voice Walkthrough Control (Step 05C Item 2) */}
            <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                    {previewAssessment.language === 'Arabic'
                      ? 'الشرح الصوتي المنهجي للتقييم'
                      : previewAssessment.language === 'Somali'
                      ? 'Sharraxaadda Codka ee Qiimeynta'
                      : 'AI Pedagogical Voice Explanation'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>{previewAssessment.language || 'English'}</span>
                    <span>·</span>
                    {assessVoiceEngine === 'device_fallback' ? (
                      <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                        Device Speech — {activeVoiceGender === 'male' ? 'Male' : 'Female'}
                      </span>
                    ) : isAssessQuotaExhausted ? (
                      <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">
                        Neural Quota Reached
                      </span>
                    ) : (
                      <span className="text-[#7C3AED] dark:text-purple-300 font-semibold">
                        {activeVoiceGender === 'male' ? 'Neural Puck' : 'Neural Kore'}
                      </span>
                    )}
                    {assessVoiceEngine === 'device_fallback' && (
                      <button
                        type="button"
                        onClick={handleSwitchToAssessNeuralVoice}
                        className="text-[10px] text-[#7C3AED] dark:text-purple-300 font-bold underline hover:text-[#6D28D9] cursor-pointer"
                      >
                        Switch to Neural
                      </button>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Voice Gender Switcher */}
                <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-purple-200/80 dark:border-purple-800/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleVoiceGenderChange('female')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeVoiceGender === 'female'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED]'
                    }`}
                    title="Female Voice (Kore)"
                    aria-label="Female voice"
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoiceGenderChange('male')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeVoiceGender === 'male'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED]'
                    }`}
                    title="Male Voice (Puck)"
                    aria-label="Male voice"
                  >
                    Male
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAssessVoice(previewAssessment, 'questions')}
                  disabled={isLoadingAssessVoice}
                  className="h-8 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {isLoadingAssessVoice ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Preparing…</span>
                    </>
                  ) : isPlayingAssessVoice ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : isPausedAssessVoice ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                {(isPlayingAssessVoice || isPausedAssessVoice) && (
                  <button
                    type="button"
                    onClick={handleStopAssessVoice}
                    className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Stop Playback"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                )}

                {assessVoiceText && (
                  <button
                    type="button"
                    onClick={() => setShowAssessTranscript((prev) => !prev)}
                    className="h-8 px-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-semibold cursor-pointer"
                    title="Toggle Transcript"
                  >
                    <span>Text</span>
                  </button>
                )}
              </div>
            </div>

            {isPlayingAssessVoice && (
              <div className="mx-5 mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#7C3AED] dark:text-purple-300">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Reading section {assessSeqProgress.current} of {assessSeqProgress.total}</span>
              </div>
            )}
            {isPausedAssessVoice && (
              <div className="mx-5 mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Pause className="w-3.5 h-3.5" />
                <span>Paused at section {assessSeqProgress.current} of {assessSeqProgress.total}</span>
              </div>
            )}

            {assessVoiceError && (
              <div className="mx-5 mt-2 p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block text-slate-900 dark:text-slate-100">{assessVoiceError}</span>
                    {isAssessQuotaExhausted && (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                        {previewAssessment.language === 'Somali'
                          ? 'Fiiro gaar ah: Codka qalabka caadiga ah (Device Speech) ma taageero af-Soomaaliga. Qoraalkaaga oo buuxa ayaa hoos ku diyaarsan si aad u akhrisato.'
                          : previewAssessment.language === 'Arabic'
                          ? 'تم استهلاك الحصة اليومية المجانية للصوت العصبي (10 طلبات/يوم). يمكنك التبديل إلى صوت الجهاز القياسي (جودة قياسية) للاستماع الفوري للشرح، أو قراءة النص كاملاً أدناه.'
                          : 'The premium Neural TTS daily free-tier quota (10 requests/day) has reached its provider limit. You can switch to Standard Device Speech to listen now, or continue reading the full response below.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                  {isAssessQuotaExhausted && assessVoiceEngine === 'neural' && previewAssessment.language !== 'Somali' && (
                    <button
                      type="button"
                      onClick={handleSwitchToAssessDeviceFallback}
                      className="px-2.5 py-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Use Standard Device Speech</span>
                    </button>
                  )}

                  {isAssessQuotaExhausted && (
                    <button
                      type="button"
                      onClick={handleCheckAssessQuota}
                      disabled={isCheckingAssessQuota}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingAssessQuota ? 'animate-spin' : ''}`} />
                      <span>Check Neural Quota</span>
                    </button>
                  )}

                  {!isAssessQuotaExhausted && (
                    <button
                      type="button"
                      onClick={handleRetryAssessVoice}
                      className="text-xs font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            {showAssessTranscript && assessVoiceText && (
              <div className="mx-5 mt-2 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">Spoken Script:</span>
                {assessVoiceText}
              </div>
            )}

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/80 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <span className="font-bold">Instructions to Students:</span>
                <p className="text-slate-600 dark:text-slate-300">{previewAssessment.instructions}</p>
              </div>

              {/* Questions Edit List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Questions ({previewAssessment.questions?.length || 0})
                </h4>

                {(previewAssessment.questions || []).map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-[#EDE8F5] dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-300">
                        Question {idx + 1} ({q.type})
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {q.points} Points
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => {
                        const updated = [...(previewAssessment.questions || [])];
                        updated[idx] = { ...q, prompt: e.target.value };
                        setPreviewAssessment({ ...previewAssessment, questions: updated });
                      }}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-700 text-xs font-medium text-[#1E1B4B] dark:text-slate-100 outline-none"
                    />

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Model Answer & Rubric:</span>
                      <p className="font-mono text-[11px] text-slate-700 dark:text-slate-200">{q.expectedAnswer || q.correctAnswer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#F0EBF8] dark:border-slate-800 bg-[#FAF8FE] dark:bg-slate-950/60 flex items-center justify-between gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateAssessment}
                className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAssessmentDraft}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handlePublishAssessmentNow}
                  className="px-5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Classroom</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL: ANSWER KEY & RUBRIC INSPECTOR                        */}
      {/* ============================================================== */}
      {answerKeyModalAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#EDE8F5] dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden text-start my-auto">
            <div className="p-5 border-b border-[#F0EBF8] dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FE] dark:from-slate-900 dark:to-slate-800/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-300 px-2 py-0.5 rounded-md">
                  Instructor Answer Key
                </span>
                <h3 className="text-base font-extrabold text-[#1E1B4B] dark:text-slate-100 pt-0.5">
                  {answerKeyModalAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnswerKeyModalAssessment(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answer Key Voice Walkthrough Control */}
            <div className="mx-5 mt-4 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#7C3AED] dark:text-purple-300" />
                <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">
                  {answerKeyModalAssessment.language === 'Arabic' ? 'استمع لشرح نموذج الإجابة' : answerKeyModalAssessment.language === 'Somali' ? 'Dhageyso Furaha Jawaabaha' : 'Listen to Solution Explanation'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleAssessVoice(answerKeyModalAssessment, 'answers')}
                  disabled={isLoadingAssessVoice}
                  className="h-8 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isLoadingAssessVoice ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isPlayingAssessVoice ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isPlayingAssessVoice ? 'Pause' : 'Play Voice'}</span>
                </button>
                {isPlayingAssessVoice && (
                  <button
                    type="button"
                    onClick={handleStopAssessVoice}
                    className="h-8 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-bold"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                {(answerKeyModalAssessment.questions || []).map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 border border-[#EDE8F5] dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-300">
                      Question {idx + 1} ({q.points} pts)
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{q.prompt}</p>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Correct Answer & Rationale:</span>
                      {q.expectedAnswer || q.correctAnswer}
                    </div>
                  </div>
                ))}
              </div>

              {answerKeyModalAssessment.gradingRubric && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/80 space-y-2">
                  <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-300 block uppercase">Grading Rubric</span>
                  <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-1 list-disc list-inside">
                    {Array.isArray(answerKeyModalAssessment.gradingRubric)
                      ? answerKeyModalAssessment.gradingRubric.map((r: any, i: number) => (
                          <li key={i}>{typeof r === 'string' ? r : `${r.criterion}: ${r.description}`}</li>
                        ))
                      : null}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#F0EBF8] dark:border-slate-800 bg-[#FAF8FE] dark:bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setAnswerKeyModalAssessment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL: TEACHER-OWNED ASSIGNMENT DELETION (STEP 05C ITEM 3)  */}
      {/* ============================================================== */}
      {deleteModalAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden text-start my-auto">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50/60 to-white dark:from-rose-950/30 dark:to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Teacher Action · Confirm Deletion
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100">
                    Delete Assignment
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeletingAssessment) {
                    setDeleteModalAssessment(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeletingAssessment}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this assignment? It will be removed from your active classroom roster.
              </p>

              {/* Assignment Identification Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8FE] dark:bg-slate-950/60 border border-[#EDE8F5] dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-[10px] font-bold uppercase">
                    {deleteModalAssessment.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {deleteModalAssessment.subject} · {deleteModalAssessment.gradeLevel}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100 leading-snug">
                  {deleteModalAssessment.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Classroom: <strong className="text-slate-700 dark:text-slate-200">{deleteModalAssessment.classroomName}</strong></span>
                  <span>·</span>
                  <span>{deleteModalAssessment.totalQuestions} Questions</span>
                  <span>·</span>
                  <span>{deleteModalAssessment.totalPoints} Points</span>
                </div>
              </div>

              {/* Integrity & Record Protection Notice */}
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/60 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Academic Record Protection:</strong> Student grades, analytics, and records belonging to other assignments are protected and will remain intact.
                </span>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#FAF8FE] dark:bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalAssessment(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingAssessment}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingAssessment}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                {isDeletingAssessment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: STUDENT GRADING & REVIEW STUDIO                      */}
      {/* ============================================================== */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EDE8F5] max-h-[90vh] flex flex-col overflow-hidden text-start my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0EBF8] flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FE]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] px-2 py-0.5 rounded-md">
                    Student Grading Studio
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeAssessment?.title}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#1E1B4B]">
                  {gradingSubmission.studentName} — Submission Review
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted {gradingSubmission.submittedAt} · Total Marks: {gradingSubmission.totalPointsPossible}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* AI Evaluation Banner / Trigger */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF8FE] to-[#F3EEFE] border border-[#E9E0FA] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                      <Sparkles className="w-4 h-4" />
                      <span>SmartEducate AI Assessment Assistant</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Evaluates student steps against pedagogical rubrics & generates diagnostic feedback.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiEvaluation}
                    disabled={isEvaluatingAi}
                    className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {isEvaluatingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Answers...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Evaluation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Diagnostic Output if evaluated */}
                {gradingSubmission.aiAnalysis && (
                  <div className="space-y-3 pt-2 border-t border-purple-100/60 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-900">Suggested Score:</span>
                        <span className="text-base font-black text-[#7C3AED]">
                          {gradingSubmission.aiSuggestedScore} / {gradingSubmission.totalPointsPossible} ({gradingSubmission.aiSuggestedPercentage}%)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                        Confidence {gradingSubmission.aiConfidence}%
                      </span>
                    </div>

                    {/* Low Confidence Warning Flag */}
                    {gradingSubmission.needsTeacherReview && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {gradingSubmission.lowConfidenceReason || 'Ambiguity detected: Teacher manual review recommended.'}
                        </span>
                      </div>
                    )}

                    {/* Strengths */}
                    {gradingSubmission.aiAnalysis.strengths.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Key Strengths:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                          {gradingSubmission.aiAnalysis.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {gradingSubmission.aiAnalysis.improvements.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                          Areas for Attention:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                          {gradingSubmission.aiAnalysis.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Question-by-Question Answers and Rubric */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question Responses & Rubric Comparison
                </h4>

                {gradingSubmission.answers.map((ans) => {
                  const currentQScore = questionScores[ans.questionId] ?? ans.pointsAwarded ?? ans.pointsPossible;

                  return (
                    <div
                      key={ans.questionId}
                      className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-extrabold text-[#7C3AED]">
                          Question {ans.questionNumber} ({ans.pointsPossible} pts)
                        </span>

                        {/* Question Point Input */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[11px] font-bold text-slate-500">Pts:</label>
                          <input
                            type="number"
                            min="0"
                            max={ans.pointsPossible}
                            value={currentQScore}
                            onChange={(e) => {
                              const val = Math.min(ans.pointsPossible, Math.max(0, parseInt(e.target.value) || 0));
                              setQuestionScores((prev) => ({ ...prev, [ans.questionId]: val }));
                              const updated = { ...questionScores, [ans.questionId]: val };
                              const newTotal = Object.values(updated).reduce((a, b) => a + b, 0);
                              setEditedScore(newTotal);
                            }}
                            className="w-14 h-8 px-2 text-center rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-bold text-[#1E1B4B] focus:border-[#7C3AED] outline-none"
                          />
                          <span className="text-[10px] text-slate-400">/ {ans.pointsPossible}</span>
                        </div>
                      </div>

                      {/* Prompt */}
                      <p className="text-xs font-semibold text-slate-800">
                        {ans.questionPrompt}
                      </p>

                      {/* Student's answer */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Student's Written Solution:
                        </span>
                        <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {ans.studentAnswer}
                        </p>
                      </div>

                      {/* Expected Rubric */}
                      <div className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-100 text-xs text-purple-900 space-y-0.5">
                        <span className="text-[10px] font-bold text-[#7C3AED] block uppercase">
                          Expected Model Solution / Rubric:
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {ans.expectedAnswer}
                        </p>
                      </div>

                      {/* AI Diagnostic note if evaluated */}
                      {ans.aiNotes && (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>{ans.aiNotes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Teacher In-Control Grading Controls */}
              <div className="p-4 rounded-2xl bg-white border-2 border-purple-200 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-[#1E1B4B]">
                      Teacher Approval & Final Grade
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      You are in full control. AI will not publish grades without your confirmation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Total Score Awarded (out of {gradingSubmission.totalPointsPossible})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={gradingSubmission.totalPointsPossible}
                        value={editedScore}
                        onChange={(e) => setEditedScore(parseInt(e.target.value) || 0)}
                        className="w-24 h-11 px-3 text-lg font-black text-center rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-[#1E1B4B] outline-none"
                      />
                      <span className="text-sm font-bold text-slate-500">
                        = {Math.round((editedScore / gradingSubmission.totalPointsPossible) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Gradebook Impact
                    </label>
                    <p className="text-xs text-slate-500">
                      Approving automatically syncs with the student's canonical academic record & certificate eligibility.
                    </p>
                  </div>
                </div>

                {/* Feedback textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>Feedback to Student</span>
                    <span className="text-[10px] text-slate-400 font-normal">Editable by Instructor</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editedFeedback}
                    onChange={(e) => setEditedFeedback(e.target.value)}
                    placeholder="Enter personalized feedback for the student..."
                    className="w-full p-3 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] text-xs text-[#1E1B4B] outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#F0EBF8] bg-[#FAF8FE] flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRequestRevision}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
              >
                Request Revision
              </button>

              <button
                type="button"
                onClick={handleApproveGrade}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve & Publish Grade</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
