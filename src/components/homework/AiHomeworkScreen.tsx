/**
 * SmartEducate AI Tutor — Canonical Conversational Experience
 *
 * Educate-style conversation screen:
 * - Conversational, warm, student-friendly, and pedagogical
 * - Automatic voice welcome on open (with graceful autoplay block fallback)
 * - Real microphone voice input (SpeechRecognition / webkitSpeechRecognition)
 * - Language-aware speech-to-text (English, Somali, Arabic, Swahili, Turkish, French, etc.)
 * - Explicit microphone states: idle, listening, processing, error
 * - Realistic human-like Male / Female voice selection (prioritizing natural/neural/Google voices)
 * - Clean Listen button for audio playback & instant cancel/stop
 * - Full multi-language support & Arabic RTL compliance
 * - Mobile-first responsive layout (360px, 375px, 390px, 412px)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useStudent } from '../../state/StudentContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../types/i18n';
import { aiLearningService, TutorWelcomeData } from '../../services/aiLearningService';
import { voiceService, getActiveAiTutorVoice } from '../../services/voiceService';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  Target,
  BookOpen,
  Edit3,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AiHomeworkScreenProps {
  onBack: () => void;
}

interface MessageItem {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: string;
  audioText?: string;
}

const STORAGE_AI_LANG_KEY = 'smarteducate_ai_tutor_lang';

export const AiHomeworkScreen: React.FC<AiHomeworkScreenProps> = ({ onBack }) => {
  const { language, setLanguage, isRTL, t } = useI18n();
  const { profile, setVoicePreference, setAiTutorLanguage } = useStudent();

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Student first name for personalized greeting
  const studentName = profile.personalInfo.fullName?.trim()
    ? profile.personalInfo.fullName.split(' ')[0]
    : '';

  // Voice preference (Female / Male)
  const voicePreference = profile.voicePreference || 'female';
  const voicePreferenceRef = useRef(voicePreference);
  voicePreferenceRef.current = voicePreference;
  const languageRef = useRef(language);
  languageRef.current = language;

  // Language change modal state
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Audio playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const hasAutoGreetedRef = useRef(false);

  // Microphone & Speech Recognition state
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const activeRecognitionStopRef = useRef<(() => void) | null>(null);

  // Input & conversation history
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState<MessageItem[]>([]);

  // Welcome data based on active language
  const [welcomeData, setWelcomeData] = useState<TutorWelcomeData>(() =>
    aiLearningService.getWelcomeMessage(language, studentName)
  );

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isThinking]);

  // Update welcome data when language or studentName changes
  useEffect(() => {
    setWelcomeData(aiLearningService.getWelcomeMessage(language, studentName));
  }, [language, studentName]);

  // =========================================================================
  // AUTOMATIC GREETING ON OPEN
  // =========================================================================
  useEffect(() => {
    if (hasAutoGreetedRef.current) return;
    hasAutoGreetedRef.current = true;

    let isMounted = true;

    const playGreeting = async () => {
      // Ensure voices are loaded first
      await voiceService.ensureVoicesLoaded();
      if (!isMounted) return;

      const welcome = aiLearningService.getWelcomeMessage(language, studentName);
      const textToSpeak = welcome.fullSpeech;

      const result = await voiceService.speak(
        textToSpeak,
        {
          gender: voicePreference,
          language,
          onStart: () => {
            if (isMounted) setPlayingMessageId('welcome_msg');
          },
          onEnd: () => {
            if (isMounted) setPlayingMessageId(null);
          },
          onError: () => {
            if (isMounted) setPlayingMessageId(null);
          },
        },
        'welcome_msg'
      );

      if (!isMounted) return;

      if (!result.success && result.blocked) {
        setAutoplayBlocked(true);
      } else if (result.success) {
        setAutoplayBlocked(false);
      }
    };

    // Small delay to allow layout to mount cleanly
    const timer = setTimeout(() => {
      playGreeting();
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
      if (activeRecognitionStopRef.current) {
        try {
          activeRecognitionStopRef.current();
        } catch {
          // safe ignore
        }
      }
    };
  }, []);

  // =========================================================================
  // LANGUAGE CHANGE HANDLER
  // =========================================================================
  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    try {
      localStorage.setItem(STORAGE_AI_LANG_KEY, langCode);
    } catch {
      // Ignore storage errors
    }
    setAiTutorLanguage(langCode);
    setLanguage(langCode);
    setIsLangModalOpen(false);

    // Stop ongoing speech
    voiceService.stop();
    setPlayingMessageId(null);

    const welcome = aiLearningService.getWelcomeMessage(langCode, studentName);
    setWelcomeData(welcome);

    // Speak in new language immediately
    setTimeout(() => {
      voiceService
        .speak(
          welcome.fullSpeech,
          {
            gender: voicePreference,
            language: langCode,
            onStart: () => setPlayingMessageId('welcome_msg'),
            onEnd: () => setPlayingMessageId(null),
            onError: () => setPlayingMessageId(null),
          },
          'welcome_msg'
        )
        .catch(() => {
          setPlayingMessageId(null);
        });
    }, 250);
  };

  // =========================================================================
  // VOICE PREFERENCE TOGGLE (FEMALE / MALE)
  // =========================================================================
  const handleVoicePreferenceChange = (newVoice: 'female' | 'male') => {
    voiceService.stop();
    setVoicePreference(newVoice);
    voicePreferenceRef.current = newVoice;
    setPlayingMessageId(null);
    setAutoplayBlocked(false);
    voiceService.unlockAudioSession();

    // Immediately speak welcome/sample in the newly selected voice so user hears the switch
    const textToSpeak = welcomeData.fullSpeech;
    voiceService
      .speak(
        textToSpeak,
        {
          gender: newVoice,
          language,
          autoplay: true,
          onStart: () => setPlayingMessageId('welcome_msg'),
          onEnd: () => setPlayingMessageId(null),
          onError: () => setPlayingMessageId(null),
        },
        'welcome_msg'
      )
      .catch(() => {
        setPlayingMessageId(null);
      });
  };

  // =========================================================================
  // AUDIO PLAYBACK TOGGLE (LISTEN / STOP)
  // =========================================================================
  const handleToggleAudio = (messageId: string, textToSpeak: string) => {
    if (playingMessageId === messageId) {
      voiceService.stop();
      setPlayingMessageId(null);
      return;
    }

    voiceService.stop();
    setPlayingMessageId(messageId);
    setAutoplayBlocked(false);

    voiceService
      .speak(
        textToSpeak,
        {
          gender: voicePreference,
          language,
          onStart: () => setPlayingMessageId(messageId),
          onEnd: () => setPlayingMessageId(null),
          onError: () => setPlayingMessageId(null),
        },
        messageId
      )
      .then((res) => {
        if (!res.success) {
          setPlayingMessageId(null);
        }
      })
      .catch(() => {
        setPlayingMessageId(null);
      });
  };

  // =========================================================================
  // REAL MICROPHONE VOICE INPUT (STT)
  // =========================================================================
  const handleToggleMic = async () => {
    // If currently listening, stop
    if (micState === 'listening') {
      setMicState('processing');
      if (activeRecognitionStopRef.current) {
        activeRecognitionStopRef.current();
        activeRecognitionStopRef.current = null;
      }
      return;
    }

    // Stop ongoing speech
    voiceService.stop();
    setPlayingMessageId(null);

    // Verify browser support
    if (!voiceService.isSpeechRecognitionSupported()) {
      setMicNotice(
        t('voice.unsupported') || "Voice input isn't supported in this browser. You can type your question instead."
      );
      setMicState('error');
      setTimeout(() => {
        setMicNotice(null);
        setMicState('idle');
      }, 5000);
      return;
    }

    // Request real microphone permission
    setMicNotice(null);
    const perm = await voiceService.requestMicrophonePermission();
    if (!perm.granted) {
      if (perm.error === 'denied') {
        setMicNotice(
          t('voice.micDenied') ||
            'Microphone access is needed for voice input. Please allow microphone access in your browser/device settings.'
        );
      } else {
        setMicNotice('No microphone detected or microphone is unavailable. You can type your question instead.');
      }
      setMicState('error');
      setTimeout(() => {
        setMicNotice(null);
        setMicState('idle');
      }, 5000);
      return;
    }

    // Start language-aware recognition
    const recController = voiceService.startSpeechRecognition(language, {
      onStart: () => {
        setMicState('listening');
        setMicNotice(null);
      },
      onResult: (transcript: string) => {
        setMicState('processing');
        // Place recognized text inside input field for user review before send
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      },
      onEnd: () => {
        setMicState('idle');
        activeRecognitionStopRef.current = null;
      },
      onError: (errorCode: string) => {
        setMicState('error');
        activeRecognitionStopRef.current = null;

        if (errorCode === 'not-allowed') {
          setMicNotice(
            t('voice.micDenied') ||
              'Microphone access is needed for voice input. Please allow microphone access in your browser/device settings.'
          );
        } else if (errorCode === 'no-speech') {
          setMicNotice(t('voice.couldNotHear') || "I couldn't hear you. Please tap the microphone and try again.");
        } else if (errorCode === 'network') {
          setMicNotice('Network recognition error. You can type your question instead.');
        } else {
          setMicNotice('Could not capture audio. Please try again or type your question.');
        }

        setTimeout(() => {
          setMicNotice(null);
          setMicState('idle');
        }, 4000);
      },
    });

    if (recController) {
      activeRecognitionStopRef.current = recController.stop;
    } else {
      setMicState('idle');
    }
  };

  // =========================================================================
  // SEND MESSAGE HANDLER
  // =========================================================================
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isThinking) return;

    // Stop active listening
    if (micState === 'listening' && activeRecognitionStopRef.current) {
      activeRecognitionStopRef.current();
      activeRecognitionStopRef.current = null;
    }
    setMicState('idle');

    // Stop ongoing speech
    voiceService.stop();
    setPlayingMessageId(null);
    voiceService.unlockAudioSession();

    // Append student message
    const studentMsgId = 'std_' + Date.now().toString(36);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newStudentMsg: MessageItem = {
      id: studentMsgId,
      sender: 'student',
      text: textToSend,
      timestamp: nowTime,
    };

    setConversation((prev) => [...prev, newStudentMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await aiLearningService.generateConversationalResponse(
        textToSend,
        language,
        studentName,
        {
          level: profile.academicProfile.degreeLevel
            ? `${profile.academicProfile.degreeLevel} Level (Year ${profile.academicProfile.currentYearOfStudy || 1})`
            : 'Secondary / High School',
          degreeLevel: profile.academicProfile.degreeLevel,
          currentYearOfStudy: profile.academicProfile.currentYearOfStudy,
          majorOrFaculty: profile.academicProfile.major || profile.universityInfo.facultyOrCollege,
          institutionName: profile.universityInfo.universityName,
          enrolledCourses: profile.courses.map((c) => c.courseTitle),
          preferredLanguage: language,
        },
        conversation.slice(-6).map((m) => ({
          role: m.sender === 'student' ? ('user' as const) : ('model' as const),
          text: m.text,
        }))
      );

      const tutorMsgId = 'tutor_' + Date.now().toString(36);
      const newTutorMsg: MessageItem = {
        id: tutorMsgId,
        sender: 'tutor',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioText: response.spokenText,
      };

      setConversation((prev) => [...prev, newTutorMsg]);

      // Automatically speak AI Tutor response with canonical neural voice (Requirement 14)
      const currentPref = voicePreferenceRef.current;
      const currentLang = languageRef.current;
      const textToSpeak = response.spokenText || response.text;

      voiceService.speak(
        textToSpeak,
        {
          gender: currentPref,
          language: currentLang,
          autoplay: true,
          onStart: () => setPlayingMessageId(tutorMsgId),
          onEnd: () => setPlayingMessageId(null),
          onError: () => setPlayingMessageId(null),
        },
        tutorMsgId
      );
    } catch (err: any) {
      const fallbackId = 'err_' + Date.now().toString(36);
      const errorDetail = err?.message || '';
      setConversation((prev) => [
        ...prev,
        {
          id: fallbackId,
          sender: 'tutor',
          text:
            language === 'so'
              ? `Waan ka xumahay, cillad ayaa dhacday: ${errorDetail || 'Fadlan mar kale isku day su’aashaada.'}`
              : language === 'ar'
              ? `عذراً، حدث خطأ: ${errorDetail || 'يُرجى إعادة طرح السؤال مرة أخرى.'}`
              : `I apologize, an error occurred: ${errorDetail || 'Please try asking your question again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Quick Learning Suggestions
  const quickSuggestions = [
    {
      id: 'concept',
      icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
      text:
        language === 'so'
          ? 'Sharax fikrad'
          : language === 'ar'
          ? 'اشرح مفهوماً'
          : 'Explain a concept',
    },
    {
      id: 'homework',
      icon: <Edit3 className="w-4 h-4 text-blue-500" />,
      text:
        language === 'so'
          ? 'Caawi shaqada guriga'
          : language === 'ar'
          ? 'مساعدة في الواجب'
          : 'Help with homework',
    },
    {
      id: 'practice',
      icon: <Target className="w-4 h-4 text-emerald-500" />,
      text:
        language === 'so'
          ? 'Su’aalo tababar'
          : language === 'ar'
          ? 'أسئلة تدريبية'
          : 'Practice questions',
    },
    {
      id: 'revise',
      icon: <BookOpen className="w-4 h-4 text-purple-500" />,
      text:
        language === 'so'
          ? 'Dib u eegis imtixaan'
          : language === 'ar'
          ? 'مراجعة للاختبار'
          : 'Revise for a test',
    },
  ];

  return (
    <div className={`flex flex-col flex-1 h-[100dvh] max-h-[100dvh] max-w-xl mx-auto w-full bg-[#FAF9FD] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-slate-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Conversation Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#F0EBF8] dark:border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Back & Title with Online indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors cursor-pointer"
            aria-label="Back to Student Home"
          >
            <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                SmartEducate AI Tutor
              </h2>
              <span className="relative flex h-2 w-2 shrink-0" title="Online and ready">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {SUPPORTED_LANGUAGES[language]?.nativeName || 'English'} · {voicePreference === 'female' ? 'Female Voice' : 'Male Voice'}
            </p>
          </div>
        </div>

        {/* Right: Compact Language button & Compact Voice selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector Button */}
          <button
            type="button"
            onClick={() => setIsLangModalOpen(true)}
            className="h-8 px-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            aria-label="Change language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px]">{language}</span>
          </button>

          {/* Voice Selector (Female / Male) */}
          <div className="flex items-center rounded-xl bg-[#EDE9FE]/70 dark:bg-purple-950/60 p-0.5 border border-purple-200/50 dark:border-purple-800">
            <button
              type="button"
              onClick={() => handleVoicePreferenceChange('female')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                voicePreference === 'female'
                  ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-label="Choose female voice"
            >
              Female
            </button>
            <button
              type="button"
              onClick={() => handleVoicePreferenceChange('male')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                voicePreference === 'male'
                  ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-label="Choose male voice"
            >
              Male
            </button>
          </div>
        </div>
      </header>

      {/* Conversation Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 text-start">
        {/* EDUCATE-STYLE AI WELCOME MESSAGE CARD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4 animate-fadeIn">
          {/* Avatar and Tutor Badge */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1E1B4B] dark:text-slate-100">SmartEducate AI Tutor</h3>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Personalized Learning</span>
              </div>
            </div>

            {/* Speaking animation badge */}
            {playingMessageId === 'welcome_msg' && (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
                <span>Speaking...</span>
              </span>
            )}
          </div>

          {/* Welcome Message Text */}
          <div className="space-y-3 pt-1">
            <h4 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100">
              {welcomeData.greeting}
            </h4>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {welcomeData.body}
            </p>
          </div>

          {/* Autoplay blocked notification if browser blocked initial speech (Requirement 17 & 18) */}
          {autoplayBlocked && (
            <div className="text-[11px] text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 px-3 py-2 rounded-2xl flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple-400 shrink-0" />
                <span>Tap once to start AI Tutor voice</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAutoplayBlocked(false);
                  voiceService.unlockAudioSession();
                  handleToggleAudio('welcome_msg', welcomeData.fullSpeech);
                }}
                className="px-2.5 py-1 rounded-xl bg-[#7C3AED] text-white text-[10px] font-bold cursor-pointer shrink-0"
              >
                Start Voice
              </button>
            </div>
          )}

          {/* Listen Button at Bottom Right */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => handleToggleAudio('welcome_msg', welcomeData.fullSpeech)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                playingMessageId === 'welcome_msg'
                  ? 'bg-[#7C3AED] text-white animate-pulse'
                  : 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800'
              }`}
              title={playingMessageId === 'welcome_msg' ? 'Stop listening' : 'Listen to welcome message'}
              aria-label={playingMessageId === 'welcome_msg' ? 'Stop listening' : 'Listen to welcome message'}
            >
              {playingMessageId === 'welcome_msg' ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested Topics (Quick Learning Suggestions) */}
        {conversation.length === 0 && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
              Suggested Topics
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSendMessage(item.text)}
                  className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED]/40 text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 flex items-center gap-2 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  {item.icon}
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {conversation.map((msg) => {
          const isStudent = msg.sender === 'student';
          const isTutorPlaying = playingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2 ${
                  isStudent
                    ? 'bg-[#7C3AED] text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-900 text-[#1E1B4B] dark:text-slate-100 border border-[#EDE8F5] dark:border-slate-800 rounded-bl-xs'
                }`}
              >
                {!isStudent && (
                  <div className="flex items-center justify-between gap-2 border-b border-[#F0EBF8] dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple-400" />
                      <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">SmartEducate Tutor</span>
                    </div>

                    {/* Listen Control on Tutor Response */}
                    <button
                      type="button"
                      onClick={() => handleToggleAudio(msg.id, msg.audioText || msg.text)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isTutorPlaying
                          ? 'bg-purple-600 text-white animate-pulse'
                          : 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300'
                      }`}
                      aria-label={isTutorPlaying ? 'Stop playback' : 'Play response audio'}
                    >
                      {isTutorPlaying ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p
                  className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                    isStudent ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.text}
                </p>

                <div
                  className={`text-[10px] text-end font-medium ${
                    isStudent ? 'text-purple-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex items-center gap-2 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 max-w-[200px] shadow-2xs animate-pulse text-start">
            <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 animate-spin" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tutor is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Input Area */}
      <footer className="p-3 sm:p-4 bg-white/95 dark:bg-[#0F172A]/95 border-t border-[#EDE8F5] dark:border-slate-800 backdrop-blur-md shrink-0">
        {/* Active Microphone State Banner */}
        {micState === 'listening' && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-100/90 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-300 text-xs font-bold animate-pulse mb-2 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>🎙️ {t('voice.listening') || 'Listening... Speak now'}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleMic}
              className="text-[11px] underline cursor-pointer hover:text-purple-900 dark:hover:text-purple-200 font-extrabold"
            >
              Done speaking
            </button>
          </div>
        )}

        {micState === 'processing' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200 dark:border-blue-800">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>{t('voice.processing') || 'Processing voice...'}</span>
          </div>
        )}

        {/* Microphone Notice / Error Alert */}
        {micNotice && (
          <div className="mb-2 px-3 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{micNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setMicNotice(null)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Button with Real States */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs ${
              micState === 'listening'
                ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-200'
                : micState === 'processing'
                ? 'bg-blue-500 text-white animate-pulse'
                : micState === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                : 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 active:scale-95'
            }`}
            title={
              micState === 'listening'
                ? 'Stop listening'
                : micState === 'processing'
                ? 'Processing voice'
                : 'Speak to AI Tutor'
            }
            aria-label={
              micState === 'listening'
                ? 'Stop listening'
                : micState === 'processing'
                ? 'Processing voice'
                : 'Speak to AI Tutor'
            }
          >
            {micState === 'listening' ? (
              <MicOff className="w-5 h-5" />
            ) : micState === 'processing' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input Box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'so'
                ? 'Qor ama ku hadal su’aashaada...'
                : language === 'ar'
                ? 'اكتب أو انطق سؤالك...'
                : 'Speak or type your question...'
            }
            className="flex-1 h-11 sm:h-12 px-4 rounded-2xl bg-[#F8F6FD] dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] dark:text-slate-100 text-sm sm:text-base outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="w-11 h-11 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-[0.96]"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* Language Selection Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-[#EDE8F5] dark:border-slate-800 space-y-4 text-start">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#1E1B4B] dark:text-slate-100">Select Language</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred AI Tutor language</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => {
                const isSelected = language === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectLanguage(code as SupportedLanguage)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-[#7C3AED] dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 font-bold shadow-2xs'
                        : 'border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 uppercase block">{info.flagSymbol}</span>
                      <span className="text-xs font-bold block truncate">{info.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">{info.nativeName}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#7C3AED] dark:text-purple-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
