/**
 * SmartEducate Teacher AI — Pedagogical Content Creation Studio (Phase 12)
 *
 * Professional, teacher-first AI workflow:
 * - Clean header: [← Back] SmartEducate AI Teacher [● Online]
 * - Conversational request prompt with intelligent natural-language parsing
 * - Clarifying questions engine when request is incomplete
 * - Structured creation options with progressive disclosure
 * - 8 Canonical content types: Assignment, Homework, Quiz, Test, Lesson Plan,
 *   Question Set, Answer Key, Teaching Material
 * - 5 Locked difficulties: Easy, Medium, Hard, Very Hard, Extremely Hard
 * - Full canonical curriculum integration (CANONICAL_FACULTIES, CANONICAL_SCHOOL_GRADES)
 * - Multilingual support: English, Somali, Arabic (with RTL mirroring)
 * - Preview with [ Questions ], [ Answer Key ], [ Marking Scheme ]
 * - [ Edit ], [ Regenerate ], [ Save ], [ Publish ]
 * - Mobile responsive (360px, 375px, 390px, 412px)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useStudent } from '../../state/StudentContext';
import {
  AiTeacherDifficulty,
  TeacherMaterialType,
  GeneratedTeacherMaterial,
  GlobalClassroom,
} from '../../types/education';
import {
  CANONICAL_FACULTIES,
  CANONICAL_SCHOOL_GRADES,
} from '../../data/canonicalCurriculum';
import {
  parseTeacherPrompt,
  generateTeacherContent,
  generateEducationalVoiceExplanation,
  buildCompleteEducationalSpeechSections,
  TeacherAiGenerationParams,
} from '../../services/teacherAiService';
import { aiLearningService } from '../../services/aiLearningService';
import {
  voiceService,
  VoiceEngineType,
  VoiceGender,
  AI_TEACHER_WELCOME_MESSAGES,
} from '../../services/voiceService';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Copy,
  Edit3,
  RefreshCw,
  Send,
  Globe,
  FileText,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  ListOrdered,
  FileCheck,
  Clock,
  CheckCircle2,
  Share2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
} from 'lucide-react';

interface TeacherAiScreenProps {
  onBack: () => void;
  activeClassroom: GlobalClassroom;
  teacherClassrooms: GlobalClassroom[];
  onPublishToClassroom?: (material: GeneratedTeacherMaterial, classroomId: string, dueDate: string) => void;
  shouldPlayWelcome?: boolean;
}

const DIFFICULTIES: AiTeacherDifficulty[] = [
  'Easy',
  'Medium',
  'Hard',
  'Very Hard',
  'Extremely Hard',
];

const CONTENT_TYPES: Array<{
  id: TeacherMaterialType;
  titleEn: string;
  titleSo: string;
  titleAr: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'assignment', titleEn: 'Assignment', titleSo: 'Layli', titleAr: 'تكليف', icon: FileText },
  { id: 'homework', titleEn: 'Homework', titleSo: 'Shaqo Guri', titleAr: 'واجب', icon: BookOpen },
  { id: 'quiz', titleEn: 'Quiz', titleSo: 'Kedis', titleAr: 'اختبار قصير', icon: HelpCircle },
  { id: 'test', titleEn: 'Test', titleSo: 'Imtixaan', titleAr: 'امتحان', icon: Award },
  { id: 'lesson_plan', titleEn: 'Lesson Plan', titleSo: 'Qorshe Cashar', titleAr: 'خطة درس', icon: Layers },
  { id: 'question_set', titleEn: 'Question Set', titleSo: 'Xidhmada Su\'aalo', titleAr: 'مجموعة أسئلة', icon: ListOrdered },
  { id: 'answer_key', titleEn: 'Answer Key', titleSo: 'Furaha Jawaabaha', titleAr: 'نموذج إجابة', icon: FileCheck },
  { id: 'teaching_material', titleEn: 'Teaching Material', titleSo: 'Agabka Casharka', titleAr: 'مادة تعليمية', icon: BookOpen },
];

const EXAMPLE_PROMPTS = [
  'Prepare Grade 8 Mathematics assignment, 15 questions, Algebra, medium difficulty',
  'Create a Grade 10 Physics quiz about electricity, 10 questions, hard difficulty',
  'Prepare a Grade 7 Biology lesson about photosynthesis',
  'Create 20 hard Algebra questions',
  'Make a beginner Python exercise',
  'Prepare a university Economics test with 20 questions, Very Hard difficulty',
];

export const TeacherAiScreen: React.FC<TeacherAiScreenProps> = ({
  onBack,
  activeClassroom,
  teacherClassrooms,
  onPublishToClassroom,
  shouldPlayWelcome = false,
}) => {
  const { language, setLanguage, isRTL, t } = useI18n();
  const { profile, setVoicePreference, addGeneratedMaterial } = useStudent();
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Active voice gender preference: synchronized with StudentContext & canonical storage
  const activeVoiceGender: VoiceGender =
    profile?.voicePreference ||
    voiceService.getSavedVoiceGender();

  const handleVoiceGenderChange = (newGender: VoiceGender) => {
    if (newGender === activeVoiceGender) return;
    setVoicePreference(newGender);
    voiceService.saveVoiceGender(newGender);
    if (isPlayingVoice || isPausedVoice) {
      voiceService.stopSequence();
      voiceService.stop();
      setIsPlayingVoice(false);
      setIsPausedVoice(false);
      setIsLoadingVoice(false);
    }
  };

  // Natural language chat / input state
  const [promptText, setPromptText] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'teacher' | 'ai'; text: string; options?: string[] }>>([]);

  // Structured Configuration States
  const [contentType, setContentType] = useState<TeacherMaterialType>('assignment');
  const [gradeOrLevel, setGradeOrLevel] = useState('Grade 8');
  const [subject, setSubject] = useState(activeClassroom?.subject || 'Mathematics');
  const [topic, setTopic] = useState('Algebra & Linear Equations');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<AiTeacherDifficulty>('Medium');
  const [contentLanguage, setContentLanguage] = useState<'English' | 'Somali' | 'Arabic'>(
    language === 'ar' ? 'Arabic' : language === 'so' ? 'Somali' : 'English'
  );

  // Optional Assessment Parameters
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [totalMarks, setTotalMarks] = useState<number>(75);
  const [questionType, setQuestionType] = useState<'Multiple Choice' | 'True / False' | 'Short Answer' | 'Long Answer' | 'Mixed'>('Mixed');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Generation & Preview States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState<string>('assignment');
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedTeacherMaterial | null>(null);
  const [previewTab, setPreviewTab] = useState<'questions' | 'answers' | 'marking'>('questions');

  // Editable Preview Content
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [editableAnswerKey, setEditableAnswerKey] = useState('');
  const [editableMarkingScheme, setEditableMarkingScheme] = useState('');

  // UI Feedback Toasts
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedPublishClassId, setSelectedPublishClassId] = useState(activeClassroom?.id || teacherClassrooms[0]?.id || '');
  const [publishDueDate, setPublishDueDate] = useState('Next Monday, 11:59 PM');
  const [publishSuccessToast, setPublishSuccessToast] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);

  // Natural Human-Quality AI Voice Explanation & Reading States
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isPausedVoice, setIsPausedVoice] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [voiceExplanationText, setVoiceExplanationText] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [sequenceProgress, setSequenceProgress] = useState<{ current: number; total: number; text: string }>({
    current: 1,
    total: 1,
    text: '',
  });

  // Voice engine & daily quota states
  const [voiceEngine, setVoiceEngineState] = useState<VoiceEngineType>(() => voiceService.getVoiceEngine());
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() => voiceService.isNeuralQuotaExhausted());
  const [isCheckingQuota, setIsCheckingQuota] = useState<boolean>(false);

  useEffect(() => {
    const unsub = voiceService.onQuotaOrEngineChange((exhausted, engine) => {
      setIsQuotaExhausted(exhausted);
      setVoiceEngineState(engine);
    });
    voiceService.checkServerQuotaStatus().then((available) => {
      setIsQuotaExhausted(!available);
    });
    return unsub;
  }, []);

  // Welcome voice states
  const [welcomeBlocked, setWelcomeBlocked] = useState(false);
  const [isPlayingWelcome, setIsPlayingWelcome] = useState(false);
  const hasTriggeredWelcomeRef = useRef(false);

  // Auto-play preference (persisted to localStorage)
  const [autoPlayVoiceEnabled, setAutoPlayVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smarteducate_autoplay_voice') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAutoPlayVoice = () => {
    setAutoPlayVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('smarteducate_autoplay_voice', String(next));
      } catch {
        // safe ignore
      }
      return next;
    });
  };

  const activeVoiceRequestIdRef = useRef<number>(0);
  const activeSequenceIdRef = useRef<number>(0);
  const userExplicitlyStoppedRef = useRef(false);

  // 1. Spoken natural AI welcome on intentional entry from Home
  useEffect(() => {
    if (!shouldPlayWelcome || hasTriggeredWelcomeRef.current) return;
    if (!autoPlayVoiceEnabled) return;
    if (voiceService.isAudioPlaying() || voiceService.isSequencePlaying() || voiceService.isTtsBusy()) return;

    hasTriggeredWelcomeRef.current = true;
    const langKey = language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en';
    const welcomeText = AI_TEACHER_WELCOME_MESSAGES[langKey] || AI_TEACHER_WELCOME_MESSAGES.en;

    const runWelcome = async () => {
      try {
        const result = await voiceService.speak(
          welcomeText,
          {
            language: langKey,
            gender: activeVoiceGender,
            autoplay: true,
            onStart: () => setIsPlayingWelcome(true),
            onEnd: () => setIsPlayingWelcome(false),
            onError: () => setIsPlayingWelcome(false),
          },
          'ai_teacher_home_welcome'
        );

        if (result.blocked) {
          setWelcomeBlocked(true);
        }
      } catch {
        setIsPlayingWelcome(false);
      }
    };

    runWelcome();
  }, [shouldPlayWelcome, language, autoPlayVoiceEnabled, activeVoiceGender]);

  const handleManualPlayWelcome = async () => {
    voiceService.unlockAudioSession();
    setWelcomeBlocked(false);
    const langKey = language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en';
    const welcomeText = AI_TEACHER_WELCOME_MESSAGES[langKey] || AI_TEACHER_WELCOME_MESSAGES.en;
    await voiceService.speak(
      welcomeText,
      {
        language: langKey,
        gender: activeVoiceGender,
        autoplay: true,
        onStart: () => setIsPlayingWelcome(true),
        onEnd: () => setIsPlayingWelcome(false),
        onError: () => setIsPlayingWelcome(false),
      },
      'ai_teacher_home_welcome'
    );
  };

  // Clean up audio playback when component unmounts or material changes completely
  // Note: previewTab is NOT in dependency array so audio continues playing while user scrolls or moves between tabs!
  useEffect(() => {
    return () => {
      voiceService.stopSequence();
      voiceService.stop();
      setIsPlayingVoice(false);
      setIsPausedVoice(false);
      setIsLoadingVoice(false);
    };
  }, [generatedMaterial?.id]);

  // Read complete AI response sequentially in natural chunks
  const startCompleteVoiceReading = async (
    targetMaterial: GeneratedTeacherMaterial,
    tab: 'questions' | 'answers' | 'marking',
    isAuto = false
  ) => {
    activeVoiceRequestIdRef.current += 1;
    const reqId = activeVoiceRequestIdRef.current;
    activeSequenceIdRef.current = reqId;

    setIsLoadingVoice(true);
    setVoiceError(null);
    setAutoplayBlocked(false);

    try {
      // Step A: Build complete educational speech sections for all questions, answers, or rubrics
      const sections = buildCompleteEducationalSpeechSections({
        material: targetMaterial,
        tab,
        language: contentLanguage,
        customContent: editableContent,
        customAnswerKey: editableAnswerKey,
        customMarkingScheme: editableMarkingScheme,
      });

      if (!sections || sections.length === 0) {
        setIsLoadingVoice(false);
        return;
      }

      setVoiceExplanationText(sections.join('\n\n'));
      setSequenceProgress({ current: 1, total: sections.length, text: sections[0] });

      const langCode = contentLanguage === 'Arabic' ? 'ar' : contentLanguage === 'Somali' ? 'so' : 'en';

      // Step B: Send chunks to sequential streaming playback via voiceService
      await voiceService.speakSequence(sections, {
        language: langCode,
        gender: activeVoiceGender,
        autoplay: isAuto,
        onChunkStart: (idx, total, text) => {
          if (activeSequenceIdRef.current === reqId) {
            setIsLoadingVoice(false);
            setIsPlayingVoice(true);
            setIsPausedVoice(false);
            setSequenceProgress({ current: idx + 1, total, text });
          }
        },
        onChunkEnd: (_idx, _total) => {
          // Seamless continuation
        },
        onComplete: () => {
          if (activeSequenceIdRef.current === reqId) {
            setIsPlayingVoice(false);
            setIsPausedVoice(false);
            setIsLoadingVoice(false);
          }
        },
        onError: (err) => {
          if (activeSequenceIdRef.current === reqId) {
            setIsPlayingVoice(false);
            setIsPausedVoice(false);
            setIsLoadingVoice(false);
            const msg = typeof err === 'string' ? err : err?.message || 'Audio playback error.';
            setVoiceError(msg);
            if (msg.includes('quota') || msg.includes('10 requests')) {
              setIsQuotaExhausted(true);
            }
          }
        },
        onAutoplayBlocked: () => {
          if (activeSequenceIdRef.current === reqId) {
            setIsLoadingVoice(false);
            setIsPlayingVoice(false);
            setIsPausedVoice(false);
            setAutoplayBlocked(true);
          }
        },
      });
    } catch (err: any) {
      if (activeSequenceIdRef.current === reqId) {
        setIsLoadingVoice(false);
        setIsPlayingVoice(false);
        setIsPausedVoice(false);
        const errMsg = err?.message || 'Unable to prepare complete voice reading.';
        setVoiceError(errMsg);
        if (errMsg.includes('quota') || errMsg.includes('10 requests')) {
          setIsQuotaExhausted(true);
        }
      }
    }
  };

  // Switch voice engine to Standard Device Speech fallback
  const handleSwitchToDeviceFallback = async () => {
    voiceService.setVoiceEngine('device_fallback');
    setVoiceEngineState('device_fallback');
    setVoiceError(null);
    if (generatedMaterial) {
      await startCompleteVoiceReading(generatedMaterial, previewTab, false);
    }
  };

  // Switch back to Neural AI Voice
  const handleSwitchToNeuralVoice = () => {
    voiceService.setVoiceEngine('neural');
    setVoiceEngineState('neural');
    setVoiceError(null);
  };

  // User-initiated check to verify if Neural Google Gemini quota has reset
  const handleCheckQuota = async () => {
    setIsCheckingQuota(true);
    try {
      const isAvailable = await voiceService.recheckNeuralQuota();
      if (isAvailable) {
        setIsQuotaExhausted(false);
        setVoiceError(null);
      } else {
        setIsQuotaExhausted(true);
        setVoiceError('Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.');
      }
    } finally {
      setIsCheckingQuota(false);
    }
  };

  // Handle Natural Voice Play, Pause, Resume, and Explanation Generation
  const handleToggleVoiceExplanation = async () => {
    if (!generatedMaterial) return;

    // Prevent duplicate requests from repeated Play taps while audio is preparing in queue
    if (isLoadingVoice) {
      return;
    }

    userExplicitlyStoppedRef.current = false;
    setAutoplayBlocked(false);

    // 1. If currently paused, resume sequence immediately
    if (isPausedVoice) {
      voiceService.resumeSequence();
      setIsPausedVoice(false);
      setIsPlayingVoice(true);
      return;
    }

    // 2. If currently playing, pause sequence immediately
    if (isPlayingVoice) {
      voiceService.pauseSequence();
      setIsPausedVoice(true);
      setIsPlayingVoice(false);
      return;
    }

    // 3. Initiate complete reading of the canonical response
    await startCompleteVoiceReading(generatedMaterial, previewTab, false);
  };

  // Safe retry function that resumes from failed chunk without re-generating earlier chunks
  const handleRetryVoice = async () => {
    if (voiceEngine === 'neural' && (isQuotaExhausted || voiceService.isNeuralQuotaExhausted())) {
      await handleCheckQuota();
      return;
    }
    setVoiceError(null);
    setIsLoadingVoice(true);
    try {
      await voiceService.retryCurrentSequenceChunk();
    } catch (err: any) {
      setIsLoadingVoice(false);
      const errMsg = err?.message || 'Voice is temporarily busy. Your text is still available.';
      setVoiceError(errMsg);
      if (errMsg.includes('quota') || errMsg.includes('10 requests')) {
        setIsQuotaExhausted(true);
      }
    }
  };

  const handleStopVoice = () => {
    userExplicitlyStoppedRef.current = true;
    activeSequenceIdRef.current += 1;
    activeVoiceRequestIdRef.current += 1;
    voiceService.stopSequence();
    voiceService.stop();
    setIsPlayingVoice(false);
    setIsPausedVoice(false);
    setIsLoadingVoice(false);
    setIsPlayingWelcome(false);
    setAutoplayBlocked(false);
  };

  // Synchronize language when UI language changes
  useEffect(() => {
    if (language === 'ar') setContentLanguage('Arabic');
    else if (language === 'so') setContentLanguage('Somali');
    else setContentLanguage('English');
  }, [language]);

  // Topic suggestion helper from canonical curriculum
  const suggestedTopics = useMemo(() => {
    for (const faculty of CANONICAL_FACULTIES) {
      for (const subj of faculty.subjects) {
        if (subj.name.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(subj.name.toLowerCase())) {
          return subj.topics.slice(0, 6);
        }
      }
    }
    return ['Algebra & Linear Equations', 'Quadratic Equations', 'Geometry & Measurement', 'Coordinate Systems', 'Statistics & Probability'];
  }, [subject]);

  // When generated material is created, sync editable states
  useEffect(() => {
    if (generatedMaterial) {
      setEditableTitle(generatedMaterial.title);
      setEditableContent(generatedMaterial.content);
      setEditableAnswerKey(generatedMaterial.answerKey || '');
      setEditableMarkingScheme(generatedMaterial.markingScheme || '');
      setPreviewTab('questions');
      setIsEditing(false);
    }
  }, [generatedMaterial]);

  // Core AI Generation Execution Handler
  const executeGeneration = async (generationParams: TeacherAiGenerationParams) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedMaterial(null);
    setSavedToast(false);
    setPublishSuccessToast(false);

    const typeObj = CONTENT_TYPES.find((c) => c.id === generationParams.contentType);
    const typeLabel =
      (generationParams.language === 'Arabic'
        ? typeObj?.titleAr
        : generationParams.language === 'Somali'
        ? typeObj?.titleSo
        : typeObj?.titleEn) || generationParams.contentType.replace('_', ' ');

    setGeneratingLabel(typeLabel);

    try {
      // Direct call with 30-second timeout guard to handle API errors and timeouts clearly
      const material = await Promise.race([
        generateTeacherContent(generationParams),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Generation request timed out after 30 seconds. Please retry.')), 30000)
        ),
      ]);

      setGeneratedMaterial(material);

      // STEP 05D: Automatically start AI voice playback as soon as audio/material is ready
      if (autoPlayVoiceEnabled && !userExplicitlyStoppedRef.current) {
        startCompleteVoiceReading(material, 'questions', true);
      }
    } catch (err: any) {
      console.error('Teacher AI Generation error:', err);
      const errMsg = err?.message || 'Failed to generate content. Please try again.';
      setGenerationError(errMsg);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            contentLanguage === 'Arabic'
              ? `تعذر إكمال الإنشاء: ${errMsg}. يرجى الضغط على زر إعادة المحاولة.`
              : contentLanguage === 'Somali'
              ? `Lama dhamaystiri karin: ${errMsg}. Fadlan guji badhanka dib-isku-dayga.`
              : `Generation encountered an issue: ${errMsg}. Please tap Retry below.`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Conversational Educational Questions from Educators (STEP 06B)
  const executeConversationalAnswer = async (question: string, targetLanguage?: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratingLabel(
      contentLanguage === 'Arabic'
        ? 'الإجابة التعليمية'
        : contentLanguage === 'Somali'
        ? 'Jawaabta Waxbarashada'
        : 'Educational Answer'
    );

    try {
      const response = await aiLearningService.generateConversationalResponse(
        question,
        targetLanguage || (contentLanguage === 'Somali' ? 'so' : contentLanguage === 'Arabic' ? 'ar' : 'en'),
        activeClassroom?.instructorName || 'Teacher',
        {
          level: gradeOrLevel,
          grade: gradeOrLevel,
          subject: subject,
          institutionName: activeClassroom?.institution || 'SmartEducate Global University',
        },
        chatHistory.slice(-6).map((m) => ({
          role: m.sender === 'teacher' ? ('user' as const) : ('model' as const),
          text: m.text,
        }))
      );

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.text,
        },
      ]);

      // Automatically speak AI Teacher response if enabled
      if (autoPlayVoiceEnabled && !userExplicitlyStoppedRef.current) {
        voiceService.speak(
          response.spokenText || response.text,
          {
            gender: activeVoiceGender,
            language: targetLanguage || (contentLanguage === 'Somali' ? 'so' : contentLanguage === 'Arabic' ? 'ar' : 'en'),
            autoplay: true,
            onStart: () => {
              setIsPlayingVoice(true);
              setIsPausedVoice(false);
            },
            onEnd: () => {
              setIsPlayingVoice(false);
              setIsPausedVoice(false);
            },
            onError: () => {
              setIsPlayingVoice(false);
              setIsPausedVoice(false);
            },
          },
          'teacher_conv_' + Date.now().toString(36)
        );
      }
    } catch (err: any) {
      console.error('[Teacher AI] Conversational error:', err);
      const errMsg = err?.message || 'Unable to retrieve educational answer. Please try again.';
      setGenerationError(errMsg);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            contentLanguage === 'Arabic'
              ? `تعذر إكمال الإجابة: ${errMsg}. يرجى المحاولة مرة أخرى.`
              : contentLanguage === 'Somali'
              ? `Lama dhamaystiri karin jawaabta: ${errMsg}. Fadlan mar kale isku day.`
              : `Could not retrieve answer: ${errMsg}. Please tap Retry.`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Natural Language Request parsing & conversational follow-up
  const handlePromptSubmit = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (isGenerating) return;
    const query = (customText || promptText).trim();
    if (!query) return;

    setGenerationError(null);
    const parsed = parseTeacherPrompt(query);
    const updatedHistory = [...chatHistory, { sender: 'teacher' as const, text: query }];

    // STEP 06B: Route conversational educational questions directly to real AI answer engine
    if (parsed.intent === 'conversational_question') {
      setChatHistory(updatedHistory);
      setPromptText('');
      executeConversationalAnswer(query, parsed.language);
      return;
    }

    // Apply parsed values to structured state for studio UI synchronization
    const effectiveContentType = parsed.contentType || contentType;
    const effectiveGrade = parsed.gradeOrLevel || gradeOrLevel;
    const effectiveSubject = parsed.subject || subject;
    const effectiveTopic = parsed.topic || topic;
    const effectiveQuestionCount = parsed.questionCount || questionCount;
    const effectiveDifficulty = parsed.difficulty || difficulty;
    const effectiveLanguage = parsed.language || contentLanguage;
    const effectiveTotalMarks = parsed.questionCount ? parsed.questionCount * 5 : totalMarks;

    if (parsed.contentType) setContentType(parsed.contentType);
    if (parsed.gradeOrLevel) setGradeOrLevel(parsed.gradeOrLevel);
    if (parsed.subject) setSubject(parsed.subject);
    if (parsed.topic) setTopic(parsed.topic);
    if (parsed.questionCount) {
      setQuestionCount(parsed.questionCount);
      setTotalMarks(effectiveTotalMarks);
    }
    if (parsed.difficulty) setDifficulty(parsed.difficulty);
    if (parsed.language) setContentLanguage(parsed.language);

    // Determine if request is completely ambiguous (e.g. missing both grade & topic & subject)
    const hasGrade = Boolean(parsed.gradeOrLevel || lowerHasGrade(query));
    const hasTopic = Boolean(parsed.topic || lowerHasTopic(query));
    const hasDiff = Boolean(parsed.difficulty || lowerHasDifficulty(query));

    // If query is completely bare and provides neither subject nor topic nor grade:
    if (!hasGrade && !hasTopic && !hasDiff && !parsed.subject) {
      updatedHistory.push({
        sender: 'ai',
        text:
          language === 'ar'
            ? 'ما هو الصف أو المستوى الدراسي والموضوع المطلوب لهذا المحتوى؟'
            : language === 'so'
            ? 'Fasalkee iyo mawduucee baad doonaysaa in loo diyaariyo?'
            : 'What grade, subject, and topic would you like to prepare content for?',
        options: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
      });
      setChatHistory(updatedHistory);
      setPromptText('');
      return;
    }

    if (!hasGrade && !lowerHasGrade(query) && !parsed.topic) {
      updatedHistory.push({
        sender: 'ai',
        text:
          language === 'ar'
            ? 'ما هو الصف أو المستوى الدراسي المطلوب لهذا المحتوى؟'
            : language === 'so'
            ? 'Fasalkee ama heerkee baad doonaysaa in loo diyaariyo?'
            : 'What grade or level should this content be prepared for?',
        options: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
      });
      setChatHistory(updatedHistory);
      setPromptText('');
      return;
    }

    // A clear teacher request starts AI generation immediately!
    // Removed intermediate confirmation step ("Ready to generate... Tap Generate below!").
    const typeObj = CONTENT_TYPES.find((c) => c.id === effectiveContentType);
    const typeLabel =
      (effectiveLanguage === 'Arabic'
        ? typeObj?.titleAr
        : effectiveLanguage === 'Somali'
        ? typeObj?.titleSo
        : typeObj?.titleEn) || effectiveContentType.replace('_', ' ');

    updatedHistory.push({
      sender: 'ai',
      text:
        effectiveLanguage === 'Arabic'
          ? `جارٍ إعداد ${typeLabel}: ${effectiveGrade} (${effectiveSubject} - ${effectiveTopic}) بمستوى صعوبة ${effectiveDifficulty}...`
          : effectiveLanguage === 'Somali'
          ? `Waxaa la diyaarinayaa ${typeLabel}: ${effectiveGrade} (${effectiveSubject} - ${effectiveTopic}), heerka ${effectiveDifficulty}...`
          : `Preparing your ${typeLabel}: ${effectiveGrade} ${effectiveSubject} (${effectiveTopic}, ${effectiveDifficulty} difficulty)…`,
    });

    setChatHistory(updatedHistory);
    setPromptText('');

    // Kick off real AI generation immediately with resolved parameters
    executeGeneration({
      contentType: effectiveContentType,
      gradeOrLevel: effectiveGrade,
      subject: effectiveSubject,
      topic: effectiveTopic,
      questionCount: effectiveQuestionCount,
      difficulty: effectiveDifficulty,
      language: effectiveLanguage,
      durationMinutes,
      totalMarks: effectiveTotalMarks,
      questionType,
      classroomId: activeClassroom?.id,
    });
  };

  function lowerHasGrade(text: string) {
    return /grade\s*\d|university|fasalka|الصف/i.test(text);
  }
  function lowerHasTopic(text: string) {
    return /algebra|equation|photo|electr|python|calculus|triangle|kinematic|force/i.test(text);
  }
  function lowerHasDifficulty(text: string) {
    return /easy|medium|hard|fudud|dhexdhexaad|adag|سهل|متوسط|صعب/i.test(text);
  }

  // Handle Clarifying Option Selection
  const handleClarifyingOptionSelect = (opt: string) => {
    if (isGenerating) return;

    let targetDiff = difficulty;
    let targetGrade = gradeOrLevel;
    let targetTopic = topic;

    if (DIFFICULTIES.includes(opt as AiTeacherDifficulty)) {
      targetDiff = opt as AiTeacherDifficulty;
      setDifficulty(targetDiff);
    } else if (opt.startsWith('Grade') || opt === 'University') {
      targetGrade = opt;
      setGradeOrLevel(targetGrade);
    } else {
      targetTopic = opt;
      setTopic(targetTopic);
    }

    const effectiveContentType = contentType;
    const effectiveSubject = subject;
    const effectiveLanguage = contentLanguage;
    const effectiveCount = questionCount;
    const effectiveTotalMarks = totalMarks;

    const typeObj = CONTENT_TYPES.find((c) => c.id === effectiveContentType);
    const typeLabel =
      (effectiveLanguage === 'Arabic'
        ? typeObj?.titleAr
        : effectiveLanguage === 'Somali'
        ? typeObj?.titleSo
        : typeObj?.titleEn) || effectiveContentType.replace('_', ' ');

    setChatHistory((prev) => [
      ...prev,
      { sender: 'teacher' as const, text: opt },
      {
        sender: 'ai' as const,
        text:
          effectiveLanguage === 'Arabic'
            ? `جارٍ إعداد ${typeLabel}: ${targetGrade} (${effectiveSubject} - ${targetTopic}) بمستوى صعوبة ${targetDiff}...`
            : effectiveLanguage === 'Somali'
            ? `Waxaa la diyaarinayaa ${typeLabel}: ${targetGrade} (${effectiveSubject} - ${targetTopic}), heerka ${targetDiff}...`
            : `Preparing your ${typeLabel}: ${targetGrade} ${effectiveSubject} (${targetTopic}, ${targetDiff} difficulty)…`,
      },
    ]);

    executeGeneration({
      contentType: effectiveContentType,
      gradeOrLevel: targetGrade,
      subject: effectiveSubject,
      topic: targetTopic,
      questionCount: effectiveCount,
      difficulty: targetDiff,
      language: effectiveLanguage,
      durationMinutes,
      totalMarks: effectiveTotalMarks,
      questionType,
      classroomId: activeClassroom?.id,
    });
  };

  // Trigger Content Generation via Bottom Button
  const handleGenerate = () => {
    executeGeneration({
      contentType,
      gradeOrLevel,
      subject,
      topic,
      questionCount,
      difficulty,
      language: contentLanguage,
      durationMinutes,
      totalMarks,
      questionType,
      classroomId: activeClassroom?.id,
    });
  };

  // Copy Content to Clipboard
  const handleCopy = () => {
    if (!generatedMaterial) return;
    const fullText = `${editableTitle}\n\n${editableContent}\n\n${editableAnswerKey ? '===================\nANSWER KEY:\n' + editableAnswerKey : ''}\n\n${editableMarkingScheme ? '===================\nMARKING SCHEME:\n' + editableMarkingScheme : ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Save to teacher's materials in StudentContext
  const handleSave = () => {
    if (!generatedMaterial) return;
    const updatedMaterial: GeneratedTeacherMaterial = {
      ...generatedMaterial,
      title: editableTitle || generatedMaterial.title,
      content: editableContent || generatedMaterial.content,
      answerKey: editableAnswerKey || generatedMaterial.answerKey,
      markingScheme: editableMarkingScheme || generatedMaterial.markingScheme,
      language: contentLanguage,
    };
    addGeneratedMaterial(updatedMaterial);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // Publish to classroom
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedMaterial) return;

    const publishedMaterial: GeneratedTeacherMaterial = {
      ...generatedMaterial,
      title: editableTitle || generatedMaterial.title,
      content: editableContent || generatedMaterial.content,
      answerKey: editableAnswerKey || generatedMaterial.answerKey,
      classroomId: selectedPublishClassId,
    };

    if (onPublishToClassroom) {
      onPublishToClassroom(publishedMaterial, selectedPublishClassId, publishDueDate);
    } else {
      addGeneratedMaterial(publishedMaterial);
    }

    setPublishModalOpen(false);
    setPublishSuccessToast(true);
    setTimeout(() => setPublishSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-slate-100 flex flex-col justify-between animate-fadeIn pb-16">
      {/* ============================================================== */}
      {/* 1. TEACHER AI HEADER (Approved Minimalist Visual Architecture)   */}
      {/* [← Back]  SmartEducate AI Teacher  [● Online]                   */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#F0EBF8] dark:border-slate-800 px-4 py-3 sm:px-6 shadow-[0_2px_12px_rgba(20,10,50,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors cursor-pointer"
              aria-label="Back to Teacher Home"
            >
              <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                  SmartEducate AI Teacher
                </h1>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Online</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">· {activeClassroom?.title || 'Classroom Assistant'}</span>
              </div>
            </div>
          </div>

          {/* Right: Voice Gender Selector, Auto-play Voice Toggle & Language Selector Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Gender Selector (Female / Male) */}
            <div className="flex items-center rounded-xl bg-purple-50 dark:bg-purple-950/60 p-0.5 border border-purple-200/60 dark:border-purple-800 shadow-2xs">
              <button
                type="button"
                onClick={() => handleVoiceGenderChange('female')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVoiceGender === 'female'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-300'
                }`}
                title="Female Voice"
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
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-300'
                }`}
                title="Male Voice"
                aria-label="Male voice"
              >
                Male
              </button>
            </div>

            <button
              type="button"
              onClick={toggleAutoPlayVoice}
              className={`h-8 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                autoPlayVoiceEnabled
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-[#7C3AED] dark:text-purple-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
              title={autoPlayVoiceEnabled ? 'AI Voice Auto-play: Enabled' : 'AI Voice Auto-play: Disabled'}
            >
              {autoPlayVoiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Auto-play:</span>
              <span>{autoPlayVoiceEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <div className="flex items-center rounded-xl bg-purple-50 dark:bg-purple-950/60 p-1 border border-purple-200/60 dark:border-purple-800 text-xs font-bold text-[#7C3AED] dark:text-purple-300">
              <Globe className="w-3.5 h-3.5 me-1 text-[#7C3AED] dark:text-purple-300" />
              <button
                type="button"
                onClick={() => setContentLanguage('English')}
                className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  contentLanguage === 'English' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'hover:bg-purple-100 dark:hover:bg-purple-900/40'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setContentLanguage('Somali')}
                className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  contentLanguage === 'Somali' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'hover:bg-purple-100 dark:hover:bg-purple-900/40'
                }`}
              >
                SO
              </button>
              <button
                type="button"
                onClick={() => setContentLanguage('Arabic')}
                className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  contentLanguage === 'Arabic' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'hover:bg-purple-100'
                }`}
              >
                عربي
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Body Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6 text-start">
        {/* Spoken AI Welcome Banner if Autoplay Blocked by Browser */}
        {welcomeBlocked && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold block truncate">
                  {contentLanguage === 'Arabic'
                    ? 'رسالة الترحيب من المعلم الذكي جاهزة'
                    : contentLanguage === 'Somali'
                    ? 'Farriinta soo-dhaweynta codka AI waa diyaar'
                    : 'Spoken AI Teacher welcome is ready'}
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300">
                  {contentLanguage === 'Arabic'
                    ? 'اضغط لبدء الاستماع إلى الترحيب الصوتي'
                    : contentLanguage === 'Somali'
                    ? 'Taabo si aad u dhageysato codka soo-dhaweynta'
                    : 'Tap to listen to the natural audio greeting'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualPlayWelcome}
                className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{contentLanguage === 'Arabic' ? 'استمع' : contentLanguage === 'Somali' ? 'Dhageyso' : 'Play'}</span>
              </button>
              <button
                type="button"
                onClick={() => setWelcomeBlocked(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Spoken AI Welcome Playing Indicator */}
        {isPlayingWelcome && (
          <div className="p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800 text-xs text-[#7C3AED] dark:text-purple-300 flex items-center gap-2 shadow-2xs animate-fadeIn">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">
              {contentLanguage === 'Arabic'
                ? 'جارٍ تشغيل رسالة الترحيب من المعلم الذكي...'
                : contentLanguage === 'Somali'
                ? 'Waxaa socda codka soo-dhaweynta ee AI Teacher...'
                : 'Playing SmartEducate AI Teacher welcome greeting…'}
            </span>
          </div>
        )}
        {/* ============================================================== */}
        {/* VIEW A: PREPARATION STUDIO (CHAT + STRUCTURED FORM HYBRID)      */}
        {/* ============================================================== */}
        {!generatedMaterial && (
          <div className="space-y-6">
            {/* 1. TOP: Conversational Request & Clarification Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE8F5] shadow-[0_4px_20px_rgba(20,10,50,0.03)] space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider block">
                  Natural Language Assistant
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B]">
                  Tell SmartEducate what you want to prepare
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Type your request naturally or choose structured options below. SmartEducate extracts the grade, subject, topic, and difficulty automatically.
                </p>
              </div>

              {/* Chat / Clarification History Feed */}
              {chatHistory.length > 0 && (
                <div className="space-y-2.5 max-h-56 overflow-y-auto p-3.5 rounded-2xl bg-[#FAF8FE] dark:bg-slate-950/60 border border-[#EDE8F5] dark:border-slate-800 text-xs">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'teacher' ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {msg.sender === 'teacher' ? 'You (Teacher)' : 'SmartEducate AI Teacher'}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                          msg.sender === 'teacher'
                            ? 'bg-[#7C3AED] text-white'
                            : 'bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* AI Clarifying Options Chips */}
                      {msg.options && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isGenerating}
                              onClick={() => handleClarifyingOptionSelect(opt)}
                              className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 disabled:opacity-50 border border-purple-200 dark:border-purple-800 text-[#7C3AED] dark:text-purple-300 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              + {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Immediate Honest Loading Feedback Bubble */}
                  {isGenerating && (
                    <div className="flex flex-col items-start space-y-1 animate-fadeIn pt-1">
                      <span className="text-[10px] font-bold text-[#7C3AED] dark:text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 animate-spin" />
                        <span>SmartEducate AI Teacher</span>
                      </span>
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#7C3AED] dark:text-purple-400 shrink-0" />
                        <span>
                          {contentLanguage === 'Arabic'
                            ? `جارٍ إعداد ${generatingLabel}... يرجى الانتظار`
                            : contentLanguage === 'Somali'
                            ? `Waxaa la diyaarinayaa ${generatingLabel}... fadlan sug`
                            : `Preparing your ${generatingLabel}…`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Generation Error State with Retry */}
              {generationError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إعادة المحاولة' : language === 'so' ? 'Isku day markale' : 'Retry Generation'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt Input Bar (Disabled during generation to prevent duplicate requests) */}
              <form onSubmit={handlePromptSubmit} className="relative">
                <input
                  type="text"
                  disabled={isGenerating}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={
                    isGenerating
                      ? (contentLanguage === 'Arabic' ? 'جارٍ إعداد المحتوى، يرجى الانتظار...' : contentLanguage === 'Somali' ? 'Waa la diyaarinayaa, fadlan sug...' : 'Preparing content, please wait…')
                      : 'e.g. Prepare Grade 8 Mathematics assignment, 15 questions, Algebra, medium difficulty...'
                  }
                  className="w-full h-13 ps-4 pe-13 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/20 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 text-[#1E1B4B] dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !promptText.trim()}
                  className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Send Request"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              {/* Example Prompts Quick Taps */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Quick Examples (Tap to autofill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex, exIdx) => (
                    <button
                      key={exIdx}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handlePromptSubmit(undefined, ex)}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:border-purple-200 dark:hover:border-purple-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] dark:hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. MIDDLE: Structured Options Configuration */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE8F5] shadow-[0_4px_20px_rgba(20,10,50,0.03)] space-y-5">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-1 border-b border-[#F0EBF8]">
                <div>
                  <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider block">
                    Structured Parameters
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B]">
                    Configure Content Details
                  </h3>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Canonical Curriculum
                </span>
              </div>

              {/* Output Type Selector (8 Simple Types) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. What would you like to create?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CONTENT_TYPES.map((typeItem) => {
                    const isSelected = contentType === typeItem.id;
                    const IconComp = typeItem.icon;
                    const label =
                      contentLanguage === 'Arabic'
                        ? typeItem.titleAr
                        : contentLanguage === 'Somali'
                        ? typeItem.titleSo
                        : typeItem.titleEn;

                    return (
                      <button
                        key={typeItem.id}
                        type="button"
                        onClick={() => setContentType(typeItem.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF8FE] border-2 border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                            : 'bg-white border-[#EDE8F5] text-slate-600 hover:bg-purple-50/40'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-purple-100 text-[#7C3AED]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grade / Level & Subject Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Grade / Level Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Grade / Level
                  </label>
                  <select
                    value={gradeOrLevel}
                    onChange={(e) => setGradeOrLevel(e.target.value)}
                    className="w-full h-12 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-xs sm:text-sm font-semibold outline-none shadow-2xs"
                  >
                    <optgroup label="Grades 1–12 (School Education)">
                      {CANONICAL_SCHOOL_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Higher Education">
                      <option value="University">University / Undergraduate</option>
                      <option value="Postgraduate">Postgraduate / Masters</option>
                    </optgroup>
                    <optgroup label="Skill Tracks">
                      <option value="Beginner">Beginner / Foundations</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced / Honors</option>
                      <option value="Professional">Professional / Career</option>
                    </optgroup>
                  </select>
                </div>

                {/* Subject Picker (from Canonical Curriculum) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    3. Subject Discipline
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-12 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-xs sm:text-sm font-semibold outline-none shadow-2xs"
                  >
                    {CANONICAL_FACULTIES.map((fac) => (
                      <optgroup key={fac.id} label={fac.name}>
                        {fac.subjects.map((sub) => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Input with Suggested Canonical Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    4. Topic / Learning Concept
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Type or tap a suggestion</span>
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Algebra, Linear Equations, Newton's Laws, Photosynthesis..."
                  className="w-full h-12 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-xs sm:text-sm font-semibold outline-none shadow-2xs"
                  required
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {suggestedTopics.map((topItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(topItem)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer border ${
                        topic === topItem
                          ? 'bg-purple-100 border-[#7C3AED] text-[#7C3AED]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED]'
                      }`}
                    >
                      {topItem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions & Difficulty Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Number of Questions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    5. Number of Questions
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 10, 15, 20, 25].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setQuestionCount(cnt);
                          setTotalMarks(cnt * 5);
                        }}
                        className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          questionCount === cnt
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-white border border-[#EDE8F5] text-slate-600 hover:bg-purple-50/40'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selector (LOCKED 5 LEVELS - Section 9) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      6. Difficulty Level
                    </label>
                    <span className="text-xs font-bold text-[#7C3AED]">{difficulty}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`h-11 px-0.5 text-center rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                          difficulty === diff
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-white border border-[#EDE8F5] text-slate-600 hover:bg-purple-50/40'
                        }`}
                        title={diff}
                      >
                        {diff === 'Extremely Hard' ? 'Extrem.' : diff === 'Very Hard' ? 'V. Hard' : diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Advanced Assessment Settings Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] cursor-pointer"
                >
                  <span>{showAdvancedOptions ? 'Hide Assessment Settings' : '+ Additional Assessment Settings (Duration, Marks, Question Types)'}</span>
                  {showAdvancedOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdvancedOptions && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-slate-100 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Total Marks</label>
                      <input
                        type="number"
                        min={5}
                        max={500}
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Question Format</label>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl border border-[#EDE8F5] text-xs font-semibold"
                      >
                        <option value="Mixed">Mixed (MCQ + Short/Derivations)</option>
                        <option value="Multiple Choice">Multiple Choice Only</option>
                        <option value="True / False">True / False</option>
                        <option value="Short Answer">Short Answer</option>
                        <option value="Long Answer">Long Answer & Essay</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. BOTTOM: Prominent Generate Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] disabled:opacity-50 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>
                      {contentLanguage === 'Arabic'
                        ? `جارٍ إعداد ${generatingLabel}...`
                        : contentLanguage === 'Somali'
                        ? `Waxaa la diyaarinayaa ${generatingLabel}...`
                        : `Preparing your ${generatingLabel}…`}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Teaching Material</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW B: GENERATED CONTENT SCREEN (Large, Readable Preview)     */}
        {/* ============================================================== */}
        {generatedMaterial && (
          <div className="space-y-5">
            {/* Top Notification Toasts */}
            {savedToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saved successfully to your SmartEducate teaching materials!</span>
              </div>
            )}
            {publishSuccessToast && (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Published successfully to your classroom assignments roster!</span>
              </div>
            )}

            {/* Metadata Card Header */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-xs font-extrabold uppercase">
                    {generatedMaterial.difficulty}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
                    {generatedMaterial.questionCount} Questions
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {generatedMaterial.language || 'English'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    {generatedMaterial.gradeOrLevel}
                  </span>
                </div>

                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Created {generatedMaterial.createdAt}
                </span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="w-full text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-[#7C3AED] outline-none"
                />
              ) : (
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100 leading-tight">
                  {editableTitle || generatedMaterial.title}
                </h2>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {generatedMaterial.subject} · {generatedMaterial.topic}
              </p>
            </div>

            {/* NATURAL HUMAN-QUALITY AI VOICE EXPLANATION CONTROL (STEP 05C ITEM 2) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-purple-50/60 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/80 shadow-xs space-y-3 text-start">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100">
                        {contentLanguage === 'Arabic'
                          ? 'الشرح الصوتي المنهجي (صوت عصبي طبيعي)'
                          : contentLanguage === 'Somali'
                          ? 'Sharraxaadda Codka ee AI (Cod Dabiici ah)'
                          : 'AI Pedagogical Voice Explanation (Human-Quality Voice)'}
                      </h3>
                      {isPlayingVoice && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C3AED]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-1.5">
                      <span>
                        {previewTab === 'questions'
                          ? (contentLanguage === 'Arabic' ? 'شرح تعليمي وتحليلي للأسئلة والتكليف' : contentLanguage === 'Somali' ? 'Sharraxaad ku saabsan su\'aalaha layliga' : 'Walkthrough of questions and student learning goals')
                          : previewTab === 'answers'
                          ? (contentLanguage === 'Arabic' ? 'شرح خطوات الحل والنموذج الرسمي' : contentLanguage === 'Somali' ? 'Sharraxaad tallaabo-tallaabo ah oo ku saabsan jawaabaha' : 'Step-by-step reasoning for instructor answer key')
                          : (contentLanguage === 'Arabic' ? 'شرح معايير التقييم وسلم الدرجات' : contentLanguage === 'Somali' ? 'Sharraxaad ku saabsan miisaanka dhibcaha' : 'Rubric criteria breakdown and grading guidance')}
                      </span>
                      <span>·</span>
                      {voiceEngine === 'device_fallback' ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                          {contentLanguage} (Device Speech — {activeVoiceGender === 'male' ? 'Male' : 'Female'})
                        </span>
                      ) : isQuotaExhausted ? (
                        <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/60">
                          {contentLanguage} (Neural Quota Reached)
                        </span>
                      ) : (
                        <span className="text-[#7C3AED] dark:text-purple-300 font-bold">
                          {contentLanguage} ({activeVoiceGender === 'male' ? 'Neural Puck' : 'Neural Kore'})
                        </span>
                      )}
                      {voiceEngine === 'device_fallback' && (
                        <button
                          type="button"
                          onClick={handleSwitchToNeuralVoice}
                          className="text-[10px] text-[#7C3AED] dark:text-purple-300 font-bold underline hover:text-[#6D28D9] cursor-pointer ml-1"
                        >
                          Switch to Neural Voice
                        </button>
                      )}
                    </p>
                  </div>
                </div>

                {/* Audio Playback Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                    onClick={toggleAutoPlayVoice}
                    className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      autoPlayVoiceEnabled
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-[#7C3AED] dark:text-purple-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                    title={autoPlayVoiceEnabled ? 'Auto-play Voice is ON' : 'Auto-play Voice is OFF'}
                  >
                    {autoPlayVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#7C3AED]" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{autoPlayVoiceEnabled ? 'Auto-play: ON' : 'Auto-play: OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleVoiceExplanation}
                    disabled={isLoadingVoice}
                    className="h-9 px-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    aria-label={isPlayingVoice ? 'Pause Explanation' : 'Listen to Full Material'}
                  >
                    {isLoadingVoice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{contentLanguage === 'Arabic' ? 'جارٍ تحضير الصوت...' : contentLanguage === 'Somali' ? 'Diyaarinta codka...' : 'Preparing Voice…'}</span>
                      </>
                    ) : isPlayingVoice ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{contentLanguage === 'Arabic' ? 'إيقاف مؤقت' : contentLanguage === 'Somali' ? 'Hakad' : 'Pause'}</span>
                      </>
                    ) : isPausedVoice ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{contentLanguage === 'Arabic' ? 'استئناف' : contentLanguage === 'Somali' ? 'Sii wad' : 'Resume'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{contentLanguage === 'Arabic' ? 'استمع للمحتوى كاملاً' : contentLanguage === 'Somali' ? 'Dhageyso Casharka Buuxa' : 'Listen to Full Material'}</span>
                      </>
                    )}
                  </button>

                  {(isPlayingVoice || isPausedVoice) && (
                    <button
                      type="button"
                      onClick={handleStopVoice}
                      className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Stop Playback"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  )}

                  {voiceExplanationText && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceTranscript((prev) => !prev)}
                      className="h-9 px-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Toggle Transcript"
                    >
                      <span>Text</span>
                      {showVoiceTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Autoplay blocked by browser fallback banner */}
              {autoplayBlocked && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span className="font-semibold">
                      {contentLanguage === 'Arabic'
                        ? 'تم تجهيز الصوت — اضغط على الزر لبدء الاستماع'
                        : contentLanguage === 'Somali'
                        ? 'Codka AI waa diyaar — Taabo badhanka si aad u dhageysato'
                        : 'AI audio is ready — Tap to start listening'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleVoiceExplanation}
                    className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{contentLanguage === 'Arabic' ? 'تشغيل الصوت' : contentLanguage === 'Somali' ? 'Bilow Codka' : 'Tap to start audio'}</span>
                  </button>
                </div>
              )}

              {voiceError && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-semibold block text-slate-900 dark:text-slate-100">{voiceError}</span>
                        {isQuotaExhausted && (
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                            {contentLanguage === 'Somali'
                              ? 'Fiiro gaar ah: Codka qalabka caadiga ah (Device Speech) ma taageero af-Soomaaliga. Qoraalkaaga oo buuxa ayaa hoos ku diyaarsan si aad u akhrisato.'
                              : contentLanguage === 'Arabic'
                              ? 'تم استهلاك الحصة اليومية المجانية للصوت العصبي (10 طلبات/يوم). يمكنك التبديل إلى صوت الجهاز القياسي (جودة قياسية) للاستماع الفوري للشرح، أو قراءة النص كاملاً أدناه.'
                              : 'The premium Neural TTS daily free-tier quota (10 requests/day) has reached its provider limit. You can switch to Standard Device Speech to listen now, or continue reading the full response below.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                    {/* If quota exhausted and language is NOT Somali, allow switching to standard device speech */}
                    {isQuotaExhausted && voiceEngine === 'neural' && contentLanguage !== 'Somali' && (
                      <button
                        type="button"
                        onClick={handleSwitchToDeviceFallback}
                        className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Use Standard Device Speech</span>
                      </button>
                    )}

                    {isQuotaExhausted && (
                      <button
                        type="button"
                        onClick={handleCheckQuota}
                        disabled={isCheckingQuota}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`w-3 h-3 ${isCheckingQuota ? 'animate-spin' : ''}`} />
                        <span>Check Neural Quota</span>
                      </button>
                    )}

                    {!isQuotaExhausted && (
                      <button
                        type="button"
                        onClick={handleRetryVoice}
                        className="text-xs font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Visible progress indication when dividing response into multiple chunks */}
              {isPlayingVoice && (
                <div className="flex items-center gap-2 pt-1 px-1">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-4 bg-[#7C3AED] dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-6 bg-[#7C3AED] dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-3 bg-[#7C3AED] dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <div className="w-1.5 h-5 bg-[#7C3AED] dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    <div className="w-1.5 h-2 bg-[#7C3AED] dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#7C3AED] dark:text-purple-300 ps-1">
                    {contentLanguage === 'Arabic'
                      ? `قراءة القسم ${sequenceProgress.current} من ${sequenceProgress.total}`
                      : contentLanguage === 'Somali'
                      ? `Akhrinaya qaybta ${sequenceProgress.current} ee ${sequenceProgress.total}`
                      : `Reading section ${sequenceProgress.current} of ${sequenceProgress.total}`}
                  </span>
                </div>
              )}

              {isPausedVoice && (
                <div className="flex items-center gap-2 pt-1 px-1 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                  <Pause className="w-3.5 h-3.5" />
                  <span>
                    {contentLanguage === 'Arabic'
                      ? `متوقف مؤقتاً عند القسم ${sequenceProgress.current} من ${sequenceProgress.total}`
                      : contentLanguage === 'Somali'
                      ? `Hakad qaybta ${sequenceProgress.current} ee ${sequenceProgress.total}`
                      : `Paused at section ${sequenceProgress.current} of ${sequenceProgress.total}`}
                  </span>
                </div>
              )}

              {showVoiceTranscript && voiceExplanationText && (
                <div
                  dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed animate-fadeIn"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Spoken Script ({sequenceProgress.total} sections):
                  </span>
                  {voiceExplanationText}
                </div>
              )}
            </div>

            {/* Segmented Tabs: [ Questions ] [ Answer Key ] [ Marking Scheme ] */}
            <div className="w-full max-w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setPreviewTab('questions')}
                className={`flex-1 min-w-[95px] py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center truncate ${
                  previewTab === 'questions'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-slate-800'
                }`}
              >
                <span className="sm:hidden">{contentType === 'lesson_plan' ? 'Plan' : contentType === 'teaching_material' ? 'Lecture' : 'Questions'}</span>
                <span className="hidden sm:inline">{contentType === 'lesson_plan' ? 'Lesson Plan' : contentType === 'teaching_material' ? 'Lecture Material' : 'Questions & Problems'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('answers')}
                className={`flex-1 min-w-[95px] py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center truncate ${
                  previewTab === 'answers'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-slate-800'
                }`}
              >
                <span className="sm:hidden">{contentType === 'lesson_plan' ? 'Goals' : contentType === 'teaching_material' ? 'Concepts' : 'Answer Key'}</span>
                <span className="hidden sm:inline">{contentType === 'lesson_plan' ? 'Pedagogical Goals' : contentType === 'teaching_material' ? 'Concept Compendium' : 'Answer Key'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('marking')}
                className={`flex-1 min-w-[95px] py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center truncate ${
                  previewTab === 'marking'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-slate-800'
                }`}
              >
                <span className="sm:hidden">{contentType === 'lesson_plan' ? 'Notes' : contentType === 'teaching_material' ? 'Notes' : 'Marking'}</span>
                <span className="hidden sm:inline">{contentType === 'lesson_plan' ? 'Teacher Notes' : contentType === 'teaching_material' ? 'Delivery Notes' : 'Marking Scheme'}</span>
              </button>
            </div>

            {/* Content Display Surface (Large Typography, Mobile-friendly, High Contrast) */}
            <div
              dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
              className="w-full max-w-full min-w-0 p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-sm space-y-4 box-border text-start"
            >
              {previewTab === 'questions' && (
                <div className="space-y-3 w-full max-w-full min-w-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student-Facing Content
                    </span>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">
                      {generatedMaterial.questionCount} Items
                    </span>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={14}
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className={`w-full max-w-full box-border p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-950 border border-[#7C3AED] text-sm sm:text-base font-sans text-slate-900 dark:text-slate-100 leading-relaxed outline-none break-words [overflow-wrap:anywhere] text-start`}
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    />
                  ) : (
                    <div
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      className="w-full max-w-full min-w-0 box-border text-sm sm:text-base text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed max-h-[500px] overflow-y-auto bg-slate-50/80 dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-start"
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    >
                      {editableContent || generatedMaterial.content}
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'answers' && (
                <div className="space-y-3 w-full max-w-full min-w-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
                      <span>Official Instructor Answer Key (Teacher Eyes Only)</span>
                    </span>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={14}
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      value={editableAnswerKey}
                      onChange={(e) => setEditableAnswerKey(e.target.value)}
                      className={`w-full max-w-full box-border p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-950 border border-[#7C3AED] text-sm sm:text-base font-sans text-purple-950 dark:text-purple-100 leading-relaxed outline-none break-words [overflow-wrap:anywhere] text-start`}
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    />
                  ) : (
                    <div
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      className="w-full max-w-full min-w-0 box-border text-sm sm:text-base text-purple-950 dark:text-purple-100 font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed max-h-[500px] overflow-y-auto bg-purple-50/50 dark:bg-purple-950/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100 dark:border-purple-800/80 text-start"
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    >
                      {editableAnswerKey || generatedMaterial.answerKey || 'No separate answer key generated for this content type.'}
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'marking' && (
                <div className="space-y-3 w-full max-w-full min-w-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      Marking Scheme & Pedagogical Rubric
                    </span>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={12}
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      value={editableMarkingScheme}
                      onChange={(e) => setEditableMarkingScheme(e.target.value)}
                      className={`w-full max-w-full box-border p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-950 border border-[#7C3AED] text-sm sm:text-base font-sans text-slate-900 dark:text-slate-100 leading-relaxed outline-none break-words [overflow-wrap:anywhere] text-start`}
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    />
                  ) : (
                    <div
                      dir={contentLanguage === 'Arabic' ? 'rtl' : 'ltr'}
                      className="w-full max-w-full min-w-0 box-border text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed max-h-[500px] overflow-y-auto bg-amber-50/50 dark:bg-amber-950/30 p-3.5 sm:p-4 rounded-2xl border border-amber-100 dark:border-amber-800/80 text-start"
                      style={{
                        direction: contentLanguage === 'Arabic' ? 'rtl' : 'ltr',
                        textAlign: contentLanguage === 'Arabic' ? 'right' : 'left',
                      }}
                    >
                      {editableMarkingScheme || generatedMaterial.markingScheme}
                    </div>
                  )}

                  {/* Rubric Points List */}
                  {generatedMaterial.gradingRubric && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Assessment Rubric Breakdown:</span>
                      {generatedMaterial.gradingRubric.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-1 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar (Edit, Regenerate, Save, Publish, Copy) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* [ Edit ] */}
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className={`py-3.5 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isEditing
                    ? 'bg-purple-100 dark:bg-purple-950/70 border-[#7C3AED] text-[#7C3AED] dark:text-purple-300'
                    : 'bg-white dark:bg-slate-800 border-[#EDE8F5] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Done Editing' : 'Edit'}</span>
              </button>

              {/* [ Regenerate ] */}
              <button
                type="button"
                onClick={() => setRegenerateModalOpen(true)}
                className="py-3.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#EDE8F5] dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
                <span>Regenerate</span>
              </button>

              {/* [ Save ] */}
              <button
                type="button"
                onClick={handleSave}
                className="py-3.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[#7C3AED] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save</span>
              </button>

              {/* [ Publish ] */}
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Publish</span>
              </button>
            </div>

            {/* Secondary Buttons: New Generation & Copy */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setGeneratedMaterial(null)}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-300 cursor-pointer"
              >
                ← Create New Material
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToast ? 'Copied' : 'Copy Full Content'}</span>
              </button>
            </div>


          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: PUBLISH TO CLASSROOM MODAL                             */}
      {/* ============================================================== */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#EDE8F5] p-6 space-y-4 shadow-xl text-start">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B]">
                Publish to Classroom
              </h3>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a classroom to distribute this {contentType.replace('_', ' ')}. Students will see it in their assignments list without exposing the answer key.
            </p>

            <form onSubmit={handlePublishSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Select Target Classroom</label>
                <select
                  value={selectedPublishClassId}
                  onChange={(e) => setSelectedPublishClassId(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] text-xs sm:text-sm font-semibold outline-none"
                  required
                >
                  {teacherClassrooms.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title} ({cls.code}) · {cls.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Due Date & Time</label>
                <input
                  type="text"
                  value={publishDueDate}
                  onChange={(e) => setPublishDueDate(e.target.value)}
                  placeholder="e.g. Next Monday, 11:59 PM"
                  className="w-full h-12 px-3.5 rounded-2xl bg-white border border-[#EDE8F5] text-xs sm:text-sm font-semibold outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                Answer Key Privacy: The official solutions and marking scheme will remain confidential to your teacher account.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REGENERATE WITH ADJUSTED SETTINGS                      */}
      {/* ============================================================== */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#EDE8F5] p-6 space-y-4 shadow-xl text-start">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B]">
                Regenerate Material
              </h3>
              <button
                type="button"
                onClick={() => setRegenerateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Adjust difficulty, question count, or language before re-generating:
            </p>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Difficulty</label>
                <div className="grid grid-cols-5 gap-1">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        difficulty === d
                          ? 'bg-[#7C3AED] text-white'
                          : 'bg-white border border-[#EDE8F5] text-slate-600'
                      }`}
                    >
                      {d === 'Extremely Hard' ? 'Extrem.' : d === 'Very Hard' ? 'V. Hard' : d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Questions</label>
                <div className="grid grid-cols-5 gap-1">
                  {[5, 10, 15, 20, 25].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-[#7C3AED] text-white'
                          : 'bg-white border border-[#EDE8F5] text-slate-600'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegenerateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegenerateModalOpen(false);
                    handleGenerate();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
