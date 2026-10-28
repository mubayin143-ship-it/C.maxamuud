/**
 * SmartEducate Classroom Chat & Communication Modal
 * Supports classroom group discussion, direct teacher-student 1:1 messaging,
 * voice note recording/playback, delivery receipts, timestamps, and permissions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Play,
  Pause,
  Check,
  CheckCheck,
  Lock,
  Unlock,
  Users,
  User,
  Shield,
  Volume2,
  ChevronLeft,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Phone,
  PhoneCall,
  Video,
  VideoOff,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { CallDiagnosticsPanel } from './CallDiagnosticsPanel';
import {
  ChatMessage,
  ClassroomChatSettings,
  ClassroomChatPermissionMode,
  MessageSenderRole,
  ChatVoiceNote,
} from '../../types/chat';
import {
  CallSession,
  CallType,
  CallParticipant,
} from '../../types/call';
import {
  classroomChatService,
} from '../../services/classroomChatService';
import { classroomCallService } from '../../services/classroomCallService';
import { SAMPLE_CLASSROOM_STUDENTS } from '../../data/globalEducation';
import { GlobalClassroom, ClassroomStudentItem } from '../../types/education';
import { useI18n } from '../../i18n/I18nContext';
import { auth, db } from '../../services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

interface ClassroomChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  isTeacher: boolean;
  currentUserId?: string;
  currentUserName?: string;
  rosterStudents?: ClassroomStudentItem[];
}

// Subcomponent: Voice Note Player with audio playback, progress & wave animation
const VoiceNoteBubble: React.FC<{
  voiceNote: ChatVoiceNote;
  isOwn: boolean;
}> = ({ voiceNote, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceNote.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [voiceNote.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Audio playback error:', e);
          setIsPlaying(false);
        });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const waveform = voiceNote.waveform || [30, 50, 75, 90, 60, 40, 70, 85, 95, 60, 40, 30];

  return (
    <div className="flex items-center gap-2.5 py-1 px-1 min-w-[200px] sm:min-w-[240px]">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isOwn
            ? 'bg-white text-[#7C3AED] hover:bg-purple-50'
            : 'bg-[#7C3AED] text-white hover:bg-purple-700'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ms-0.5" />}
      </button>

      {/* Waveform Visualizer & Timer */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-0.5 h-6">
          {waveform.map((val, idx) => {
            const progress = (currentTime / Math.max(1, voiceNote.durationSeconds)) * waveform.length;
            const isPassed = idx <= progress;
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(20, val)}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? isOwn
                      ? 'bg-white'
                      : 'bg-[#7C3AED]'
                    : isOwn
                    ? 'bg-purple-200/60'
                    : 'bg-slate-300'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(voiceNote.durationSeconds)}</span>
        </div>
      </div>
    </div>
  );
};

export const ClassroomChatModal: React.FC<ClassroomChatModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  isTeacher,
  currentUserId = isTeacher ? 'teacher_1' : 'st-1',
  currentUserName = isTeacher ? (activeClassroom?.instructorName || 'Instructor') : 'Nimco Nuura',
  rosterStudents = [],
}) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<ClassroomChatSettings>({
    permissionMode: 'everyone',
    directMessagesEnabled: true,
  });

  // Effective authenticated UID and display name
  const effectiveUserId = auth.currentUser?.uid || currentUserId || (isTeacher ? 'teacher_1' : 'st-1');
  const effectiveUserName =
    auth.currentUser?.displayName ||
    currentUserName ||
    (isTeacher ? (activeClassroom?.instructorName || 'Instructor') : 'Student');

  // Real-time Firestore enrollment roster and resolved instructor records
  const [liveEnrolledStudents, setLiveEnrolledStudents] = useState<ClassroomStudentItem[]>([]);
  const [resolvedInstructor, setResolvedInstructor] = useState<{ id: string; name: string } | null>(null);
  const [callNotice, setCallNotice] = useState<{
    message: string;
    type: 'error' | 'warning' | 'info';
    isIframe?: boolean;
  } | null>(null);

  // Synchronize canonical classroom details & verified enrollments directly from Firestore
  useEffect(() => {
    if (!isOpen || !activeClassroom?.id) return;

    let isMounted = true;
    let unsubEnrollments: (() => void) | null = null;

    classroomChatService.resolveCanonicalClassroomId(activeClassroom.id).then(async (canonicalId) => {
      if (!isMounted || !canonicalId) return;

      // 1. Resolve Instructor identity from classroom document in Firestore
      try {
        const cDoc = await getDoc(doc(db, 'classrooms', canonicalId));
        if (cDoc.exists() && isMounted) {
          const cData = cDoc.data();
          if (cData.instructorId && cData.instructorId !== 'teacher_1') {
            setResolvedInstructor({
              id: cData.instructorId,
              name: cData.instructorName || activeClassroom.instructorName || 'Instructor',
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching instructor document from Firestore:', e);
      }

      // 2. Real-time enrollments listener
      try {
        if (!auth.currentUser) {
          return;
        }
        const enrollCol = collection(db, 'classrooms', canonicalId, 'enrollments');
        unsubEnrollments = onSnapshot(
          enrollCol,
          (snap) => {
            if (!isMounted) return;
            const students: ClassroomStudentItem[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: data.studentId || d.id,
                name: data.studentName || 'Student',
                email: data.studentEmail || '',
                enrolledDate: data.enrolledDate || 'Recently',
                status: (data.status as 'active' | 'pending') || 'active',
              };
            });
            setLiveEnrolledStudents(students);
          },
          (err) => {
            console.warn('Firestore enrollments onSnapshot notice:', err);
          }
        );
      } catch (e) {
        console.warn('Error subscribing to enrollments in Firestore:', e);
      }
    });

    return () => {
      isMounted = false;
      if (unsubEnrollments) unsubEnrollments();
    };
  }, [isOpen, activeClassroom?.id]);

  // Verified real enrolled students (deduplicated, authentic Firebase UIDs)
  const realEnrolledStudents = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    if (rosterStudents && rosterStudents.length > 0) {
      rosterStudents.forEach((st) => {
        if (st.id && st.id !== 'st-1' && !st.id.startsWith('demo-')) {
          map.set(st.id, { id: st.id, name: st.name });
        }
      });
    }
    liveEnrolledStudents.forEach((st) => {
      if (st.id && st.id !== 'st-1' && !st.id.startsWith('demo-')) {
        map.set(st.id, { id: st.id, name: st.name });
      }
    });
    return Array.from(map.values());
  }, [rosterStudents, liveEnrolledStudents]);

  // Unified direct student list: Only real enrolled students when present; mock sample ONLY if completely empty
  const directStudents = React.useMemo(() => {
    if (realEnrolledStudents.length > 0) {
      return realEnrolledStudents;
    }
    // Only return sample students for offline preview if NO real enrolled students exist
    return SAMPLE_CLASSROOM_STUDENTS.map((sample) => ({
      id: sample.id,
      name: sample.name,
    }));
  }, [realEnrolledStudents]);

  // Active channel: 'group' or a student ID
  const [activeTab, setActiveTab] = useState<'group' | 'direct'>('group');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Keep selectedStudentId valid and prioritize real enrolled students
  useEffect(() => {
    if (realEnrolledStudents.length > 0) {
      if (!realEnrolledStudents.some((s) => s.id === selectedStudentId)) {
        setSelectedStudentId(realEnrolledStudents[0].id);
      }
    } else if (directStudents.length > 0) {
      if (!directStudents.some((s) => s.id === selectedStudentId)) {
        setSelectedStudentId(directStudents[0].id);
      }
    }
  }, [realEnrolledStudents, directStudents, selectedStudentId]);

  // Input states
  const [inputText, setInputText] = useState('');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionRecoveryHint, setPermissionRecoveryHint] = useState<string | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [diagnosedCause, setDiagnosedCause] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const authorizedStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Clean up active recording tracks & timers on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        activeStreamRef.current = null;
      }
      if (authorizedStreamRef.current) {
        authorizedStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        authorizedStreamRef.current = null;
      }
    };
  }, []);

  // Call session state
  const [callSession, setCallSession] = useState<CallSession | null>(null);

  useEffect(() => {
    const unsubscribe = classroomCallService.subscribe((sess) => {
      setCallSession(sess);
    });
    return () => unsubscribe();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync messages and settings with Firestore onSnapshot subscription
  const refreshData = () => {
    if (!activeClassroom?.id) return;
    setMessages(classroomChatService.getMessages(activeClassroom.id));
    setSettings(classroomChatService.getSettings(activeClassroom.id));
  };

  useEffect(() => {
    if (isOpen && activeClassroom?.id) {
      refreshData();
      const unsubscribe = classroomChatService.subscribe(activeClassroom.id, refreshData);
      return () => unsubscribe();
    }
  }, [isOpen, activeClassroom?.id]);

  // Mark messages as read when opening channel
  useEffect(() => {
    if (isOpen && activeClassroom?.id) {
      const channel = activeTab === 'group' ? 'group' : selectedStudentId;
      const role: MessageSenderRole = isTeacher ? 'teacher' : 'student';
      classroomChatService.markMessagesAsRead(activeClassroom.id, role, channel);
    }
  }, [isOpen, activeClassroom?.id, activeTab, selectedStudentId, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab, selectedStudentId, isOpen]);

  if (!isOpen) return null;

  // Determine which student we are chatting with in direct mode
  const currentStudent =
    directStudents.find((s) => s.id === selectedStudentId) ||
    directStudents[0] || { id: 'st-1', name: 'Nimco Nuura' };

  // Filter messages for current channel
  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'group') {
      return !m.recipientId || m.recipientId === 'group';
    } else {
      // Direct thread between teacher and student
      if (isTeacher) {
        return (
          m.recipientId !== 'group' &&
          (m.recipientId === selectedStudentId ||
            m.senderId === selectedStudentId ||
            (selectedStudentId === 'st-1' && (m.recipientId === 'teacher_1' || m.senderId === 'teacher_1')))
        );
      } else {
        // Student view: direct thread with the instructor
        const myIds = [
          effectiveUserId,
          currentUserId,
          auth.currentUser?.uid,
          auth.currentUser?.email,
          'st-1',
        ].filter(Boolean);
        const isFromMe = myIds.includes(m.senderId) && m.recipientId !== 'group';
        const isToMe = myIds.includes(m.recipientId || '') && m.senderRole === 'teacher';
        const isSampleFallback =
          (m.senderId === 'teacher_1' && m.recipientId === 'st-1') ||
          (m.senderId === 'st-1' && m.recipientId === 'teacher_1');
        return isFromMe || isToMe || isSampleFallback;
      }
    }
  });

  // Permissions check
  const isClassroomRestricted = settings.permissionMode === 'teacher_only';
  const canSendInCurrentChannel = isTeacher || !isClassroomRestricted;
  const canCallInCurrentChannel = isTeacher || !isClassroomRestricted;

  // Initiate 1:1 Teacher ↔ Student Voice or Video Call
  const handleStartCall = async (type: CallType) => {
    if (!canCallInCurrentChannel || !activeClassroom?.id) return;

    setCallNotice(null);

    // 1. Must be authenticated with Firebase Auth
    if (!auth.currentUser) {
      setCallNotice({
        message:
          'Fadlan marka hore gal akoonkaaga (Sign In) si aad u isticmaasho wicitaanka tooska ah ee fasalka. (Sign in required for real calls).',
        type: 'warning',
      });
      return;
    }

    const canonicalId = await classroomChatService.resolveCanonicalClassroomId(activeClassroom.id);
    if (!canonicalId) {
      setCallNotice({
        message: 'Lama xallin karo aqoonsiga fasalkan. Fadlan hubi xiriirkaaga internetka.',
        type: 'error',
      });
      return;
    }

    // 2. Caller participant (authenticated Firebase UID)
    const caller: CallParticipant = {
      id: auth.currentUser.uid,
      name: effectiveUserName,
      role: isTeacher ? 'teacher' : 'student',
    };

    // 3. Receiver participant resolution
    let receiver: CallParticipant | null = null;

    if (isTeacher) {
      // Teacher calling Student
      if (realEnrolledStudents.length === 0) {
        setCallNotice({
          message: `Fasalkan weli kuma jiraan arday iska diiwaangelisay. La wadaag koodhka fasalka (${activeClassroom.code}) ardaydaada si ay ugu soo biiraan ka hor inta aadan wicin. (No enrolled students in this classroom yet).`,
          type: 'warning',
        });
        return;
      }

      const targetStudent =
        realEnrolledStudents.find((s) => s.id === selectedStudentId) ||
        realEnrolledStudents[0];

      if (!targetStudent || !targetStudent.id || targetStudent.id === 'st-1') {
        setCallNotice({
          message: 'Fadlan xulo arday dhab ah oo fasalka ku jira si aad u wacdo.',
          type: 'warning',
        });
        return;
      }

      receiver = {
        id: targetStudent.id,
        name: targetStudent.name,
        role: 'student',
      };
    } else {
      // Student calling Teacher
      let teacherId =
        resolvedInstructor?.id ||
        (activeClassroom.instructorId && activeClassroom.instructorId !== 'teacher_1'
          ? activeClassroom.instructorId
          : '');

      if (!teacherId) {
        try {
          const cDoc = await getDoc(doc(db, 'classrooms', canonicalId));
          if (cDoc.exists()) {
            const data = cDoc.data();
            if (data?.instructorId && data.instructorId !== 'teacher_1') {
              teacherId = data.instructorId;
            }
          }
        } catch (e) {
          console.warn('Error reading classroom instructor from Firestore:', e);
        }
      }

      if (!teacherId || teacherId === 'teacher_1') {
        setCallNotice({
          message:
            'Lama helin aqoonsiga macallinka fasalkan Firestore dhexdiisa. Fadlan hubi in macallinku abuuray ama galay fasalkan. (Instructor account not registered for this classroom).',
          type: 'warning',
        });
        return;
      }

      receiver = {
        id: teacherId,
        name: resolvedInstructor?.name || activeClassroom.instructorName || 'Instructor',
        role: 'teacher',
      };
    }

    const res = await classroomCallService.startCall(canonicalId, type, caller, receiver);
    if (!res.success) {
      setCallNotice({
        message: res.error || 'Wicitaanka ma suurtagelin.',
        type: 'error',
        isIframe: typeof window !== 'undefined' && window.self !== window.top,
      });
    }
  };

  // Helper to simulate incoming call from opposite participant for testing & verification
  const handleTestIncomingCall = (type: CallType = 'video') => {
    if (!auth.currentUser || !activeClassroom?.id) return;

    const caller: CallParticipant = {
      id: isTeacher
        ? (realEnrolledStudents[0]?.id || 'student_qa')
        : (resolvedInstructor?.id || 'teacher_qa'),
      name: isTeacher
        ? (realEnrolledStudents[0]?.name || 'Student QA')
        : (resolvedInstructor?.name || activeClassroom.instructorName || 'Instructor QA'),
      role: isTeacher ? 'student' : 'teacher',
    };

    const receiver: CallParticipant = {
      id: auth.currentUser.uid,
      name: effectiveUserName,
      role: isTeacher ? 'teacher' : 'student',
    };

    classroomCallService.simulateIncomingCall(activeClassroom.id, type, caller, receiver);
  };

  // Send Text Message
  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !canSendInCurrentChannel || !activeClassroom?.id) return;

    const teacherRecipientId = activeClassroom.instructorId || 'teacher_1';

    classroomChatService.sendMessage({
      classroomId: activeClassroom.id,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: isTeacher ? 'teacher' : 'student',
      recipientId: activeTab === 'group' ? 'group' : isTeacher ? selectedStudentId : teacherRecipientId,
      type: 'text',
      text: inputText.trim(),
    });

    setInputText('');
  };

  // Helper to generate a safe top-level URL that directly reopens Classroom Chat
  const getStandaloneAppUrl = () => {
    if (typeof window === 'undefined') return '#';
    try {
      const url = new URL('/', window.location.origin);
      url.searchParams.set('openChat', 'true');
      return url.toString();
    } catch {
      return `${window.location.origin}/?openChat=true`;
    }
  };

  // Diagnostic helper for safe environment introspection
  const getMicrophoneDiagnostics = async () => {
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    let permissionsPolicyDisallowed = false;
    try {
      if (typeof document !== 'undefined') {
        const doc = document as any;
        if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
          permissionsPolicyDisallowed = !doc.permissionsPolicy.allowsFeature('microphone');
        } else if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
          permissionsPolicyDisallowed = !doc.featurePolicy.allowsFeature('microphone');
        }
      }
    } catch (e) {}

    let permissionQueryState: string = 'unknown';
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissionQueryState = perm.state;
      }
    } catch (e) {
      permissionQueryState = 'unsupported';
    }

    const info = {
      isSecureContext: typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
      hasMediaDevices: typeof navigator !== 'undefined' && Boolean(navigator?.mediaDevices),
      hasGetUserMedia: typeof navigator !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia),
      hasMediaRecorder: typeof MediaRecorder !== 'undefined',
      inIframe,
      permissionsPolicyDisallowed,
      permissionQueryState,
    };

    // Safe diagnostic log (never logs private conversation or audio payload)
    console.info('[SmartEducate Audio Diagnostic]', info);

    return info;
  };

  const resolveMicrophoneError = (
    err: any,
    info: {
      isSecureContext: boolean;
      hasMediaDevices: boolean;
      hasGetUserMedia: boolean;
      hasMediaRecorder: boolean;
      inIframe: boolean;
      permissionsPolicyDisallowed: boolean;
      permissionQueryState: string;
    }
  ): { hint: string; cause: string } => {
    const errName = err?.name || '';
    const errMsg = (err?.message || '').toLowerCase();

    // Safe diagnostic error logging
    console.warn('[SmartEducate Audio Error Diagnostic]', {
      errorName: errName,
      errorMessage: err?.message,
      isSecureContext: info.isSecureContext,
      inIframe: info.inIframe,
      permissionsPolicyDisallowed: info.permissionsPolicyDisallowed,
      permissionQueryState: info.permissionQueryState,
    });

    if (!info.isSecureContext) {
      return {
        hint: t('chat.micInsecureHelp') || 'Microphone access requires a secure connection (HTTPS).',
        cause: 'insecure_context',
      };
    }

    if (!info.hasMediaDevices || !info.hasGetUserMedia || !info.hasMediaRecorder) {
      return {
        hint: 'Microphone recording is not supported in this browser.',
        cause: 'unsupported_api',
      };
    }

    // Detect iframe Permissions Policy restriction
    if (
      errMsg.includes('permissions policy') ||
      errMsg.includes('disallowed by permissions policy') ||
      errName === 'SecurityError' ||
      (info.inIframe && info.permissionsPolicyDisallowed) ||
      (info.inIframe && info.permissionQueryState === 'prompt' && errName === 'NotAllowedError')
    ) {
      return {
        hint:
          t('chat.micIframeBlockedHelp') ||
          'Microphone is restricted inside this preview frame. Please open the app directly in a full browser tab or standalone window to record voice notes.',
        cause: 'iframe_permissions_policy',
      };
    }

    // Denied by browser site permissions
    if ((errName === 'NotAllowedError' || errName === 'PermissionDeniedError') && info.permissionQueryState === 'denied') {
      return {
        hint:
          t('chat.micBlockedHelp') ||
          'Microphone access is blocked by browser settings. Click the site settings or lock icon in your address bar, change Microphone to Allow, then click Retry.',
        cause: 'browser_settings_denied',
      };
    }

    // OS level block or prompt dismissed
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      if (info.inIframe) {
        return {
          hint:
            t('chat.micIframeBlockedHelp') ||
            'Microphone is restricted inside this preview frame. Please open the app directly in a full browser tab or standalone window to record voice notes.',
          cause: 'iframe_permissions_policy',
        };
      }
      return {
        hint:
          t('chat.micOsBlockedHelp') ||
          'Microphone is blocked by operating system privacy settings. Please allow your browser access in System Settings > Privacy > Microphone, then click Retry.',
        cause: 'os_permissions_blocked',
      };
    }

    if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      return {
        hint:
          t('chat.micNotFoundHelp') ||
          'No microphone device was detected. Please connect a microphone and retry.',
        cause: 'device_not_found',
      };
    }

    if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      return {
        hint:
          t('chat.micBusyHelp') ||
          'Microphone is currently in use by another application. Please close other audio apps and retry.',
        cause: 'device_in_use',
      };
    }

    return {
      hint:
        t('chat.micPermissionHelp') ||
        'Please enable microphone access for this site in your browser to record voice notes.',
      cause: 'unknown_error',
    };
  };

  // Dedicated Handler: Request Microphone Permission on user click
  const handleAllowMicrophone = async () => {
    if (isRequestingPermission) return;
    setIsRequestingPermission(true);
    setRecordingError(null);
    setPermissionRecoveryHint(null);
    setPermissionNotice(null);
    setDiagnosedCause(null);

    const diag = await getMicrophoneDiagnostics();

    // 1. Check secure context
    if (!diag.isSecureContext) {
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
      setPermissionRecoveryHint(t('chat.micInsecureHelp') || 'Microphone access requires a secure connection (HTTPS).');
      setDiagnosedCause('insecure_context');
      setPermissionDenied(true);
      setIsRequestingPermission(false);
      return;
    }

    // 2. Check browser MediaDevices support
    if (!diag.hasMediaDevices || !diag.hasGetUserMedia) {
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
      setPermissionRecoveryHint('Microphone recording is not supported in this browser.');
      setDiagnosedCause('unsupported_api');
      setPermissionDenied(true);
      setIsRequestingPermission(false);
      return;
    }

    try {
      // 3. User click invokes navigator.mediaDevices.getUserMedia({ audio: true })
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 5. Verify that at least one audio track exists and is enabled
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0 || !audioTracks[0].enabled) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
        setPermissionRecoveryHint(t('chat.micNotFoundHelp') || 'No microphone device was detected. Please connect a microphone and retry.');
        setDiagnosedCause('device_not_found');
        setPermissionDenied(true);
        setIsRequestingPermission(false);
        return;
      }

      // 6. Clean up any previous stream to prevent leaks
      if (authorizedStreamRef.current && authorizedStreamRef.current !== stream) {
        authorizedStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
      }

      // 7. Keep the microphone stream available for the existing recording workflow
      // Do NOT immediately stop the stream before the recorder can use it
      authorizedStreamRef.current = stream;

      // 8. Clear permission-denied error and update UI to reflect actual permission result
      setPermissionDenied(false);
      setRecordingError(null);
      setPermissionRecoveryHint(null);
      setDiagnosedCause(null);
      setPermissionNotice(t('chat.micGranted') || 'Microphone enabled! You can now record voice notes.');
    } catch (err: any) {
      if (authorizedStreamRef.current) {
        authorizedStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        authorizedStreamRef.current = null;
      }

      setPermissionDenied(true);
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');

      const resolved = resolveMicrophoneError(err, diag);
      setPermissionRecoveryHint(resolved.hint);
      setDiagnosedCause(resolved.cause);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Start Voice Note Recording with real MediaRecorder & supported MIME type
  const startRecording = async () => {
    if (!canSendInCurrentChannel) return;
    setRecordingError(null);
    setPermissionRecoveryHint(null);
    setPermissionNotice(null);
    setDiagnosedCause(null);

    const diag = await getMicrophoneDiagnostics();

    // 1. Check secure context
    if (!diag.isSecureContext) {
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
      setPermissionRecoveryHint(t('chat.micInsecureHelp') || 'Microphone access requires a secure connection (HTTPS).');
      setDiagnosedCause('insecure_context');
      setPermissionDenied(true);
      return;
    }

    // 2. Check browser support
    if (!diag.hasMediaDevices || !diag.hasGetUserMedia) {
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
      setPermissionRecoveryHint('Microphone recording is not supported in this browser.');
      setDiagnosedCause('unsupported_api');
      setPermissionDenied(true);
      return;
    }

    try {
      // 3. Re-use authorized stream if live, or request fresh stream
      let stream: MediaStream;
      const isAuthorizedLive =
        authorizedStreamRef.current &&
        authorizedStreamRef.current.getAudioTracks().length > 0 &&
        authorizedStreamRef.current.getAudioTracks()[0].readyState === 'live' &&
        authorizedStreamRef.current.getAudioTracks()[0].enabled;

      if (isAuthorizedLive && authorizedStreamRef.current) {
        stream = authorizedStreamRef.current;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const audioTracks = stream.getAudioTracks();
        if (!audioTracks || audioTracks.length === 0 || !audioTracks[0].enabled) {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
          setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
          setPermissionRecoveryHint(t('chat.micNotFoundHelp') || 'No microphone device was detected. Please connect a microphone and retry.');
          setDiagnosedCause('device_not_found');
          setPermissionDenied(true);
          return;
        }

        authorizedStreamRef.current = stream;
      }

      activeStreamRef.current = stream;
      audioChunksRef.current = [];

      // Detect browser-supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Periodic slice to ensure chunks are received reliably
      recorder.start(250);

      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordingError(null);
      setPermissionDenied(false);
      setPermissionRecoveryHint(null);
      setPermissionNotice(null);
      setDiagnosedCause(null);

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        activeStreamRef.current = null;
      }
      if (authorizedStreamRef.current) {
        authorizedStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        authorizedStreamRef.current = null;
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }

      // Exact requirement: "Recording unavailable — microphone permission is required."
      setRecordingError(t('chat.micPermissionDenied') || 'Recording unavailable — microphone permission is required.');
      setPermissionDenied(true);

      const resolved = resolveMicrophoneError(err, diag);
      setPermissionRecoveryHint(resolved.hint);
      setDiagnosedCause(resolved.cause);
    }
  };

  // Stop & Send Voice Note with Real Voice Preservation
  const stopAndSendRecording = () => {
    if (!isRecording) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);

    const duration = Math.max(1, recordingSeconds);
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        // Stop all audio hardware tracks cleanly
        try {
          recorder.stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
        } catch (e) {}
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
          activeStreamRef.current = null;
        }
        if (authorizedStreamRef.current) {
          authorizedStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
          authorizedStreamRef.current = null;
        }

        const effectiveMime = recorder.mimeType || 'audio/webm';
        if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
          setRecordingError('No audio data was captured. Please speak into your microphone.');
          audioChunksRef.current = [];
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: effectiveMime });

        if (blob.size === 0) {
          setRecordingError('No audio data was captured. Please speak into your microphone.');
          audioChunksRef.current = [];
          return;
        }

        // Validate MIME type
        if (!blob.type.startsWith('audio/')) {
          setRecordingError('Invalid audio recording format.');
          audioChunksRef.current = [];
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const audioUrl = reader.result as string;
          if (audioUrl) {
            dispatchVoiceNote(audioUrl, duration);
          }
          audioChunksRef.current = [];
        };
        reader.onerror = () => {
          const objectUrl = URL.createObjectURL(blob);
          dispatchVoiceNote(objectUrl, duration);
          audioChunksRef.current = [];
        };
        reader.readAsDataURL(blob);
      };

      try {
        recorder.stop();
      } catch (e) {
        setRecordingError('Recording ended unexpectedly.');
      }
    } else {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        activeStreamRef.current = null;
      }
      if (authorizedStreamRef.current) {
        authorizedStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        authorizedStreamRef.current = null;
      }
      setRecordingError('Recording ended unexpectedly.');
    }
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      activeStreamRef.current = null;
    }
    if (authorizedStreamRef.current) {
      authorizedStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      authorizedStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const dispatchVoiceNote = (audioUrl: string, durationSeconds: number) => {
    // Generate mock waveform
    const waveform = Array.from({ length: 14 }, () => Math.floor(Math.random() * 60) + 30);

    if (!activeClassroom?.id) return;
    const teacherRecipientId = activeClassroom.instructorId || 'teacher_1';

    classroomChatService.sendMessage({
      classroomId: activeClassroom.id,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: isTeacher ? 'teacher' : 'student',
      recipientId: activeTab === 'group' ? 'group' : isTeacher ? selectedStudentId : teacherRecipientId,
      type: 'voice_note',
      text: `${isTeacher ? 'Instructor' : 'Student'} Voice Note (${durationSeconds}s)`,
      voiceNote: {
        audioUrl,
        durationSeconds,
        waveform,
      },
    });
  };

  // Toggle permission mode (Teacher only)
  const handleTogglePermission = (mode: ClassroomChatPermissionMode) => {
    if (!activeClassroom?.id) return;
    classroomChatService.updateSettings(activeClassroom.id, { permissionMode: mode });
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isRecording) {
          cancelRecording();
        }
        if (authorizedStreamRef.current) {
          authorizedStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
          authorizedStreamRef.current = null;
        }
        if (callSession && callSession.status !== 'idle' && callSession.status !== 'ended' && callSession.status !== 'declined' && callSession.status !== 'rejected') {
          classroomCallService.endCall();
        }
        onClose();
      }}
      title={activeClassroom?.title || 'Classroom Discussion'}
      description={
        !activeClassroom
          ? 'No active classroom selected'
          : activeTab === 'group'
          ? `Classroom Discussion · ${activeClassroom?.instructorName || 'Instructor'}`
          : isTeacher
          ? `Direct Message with ${currentStudent.name}`
          : `Direct Message with ${activeClassroom?.instructorName || 'Instructor'}`
      }
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-medium">
            SmartEducate In-Class Messaging · Private & Encrypted
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isRecording) {
                cancelRecording();
              }
              if (authorizedStreamRef.current) {
                authorizedStreamRef.current.getTracks().forEach((t) => {
                  try {
                    t.stop();
                  } catch (e) {}
                });
                authorizedStreamRef.current = null;
              }
              if (callSession && callSession.status !== 'idle' && callSession.status !== 'ended' && callSession.status !== 'declined' && callSession.status !== 'rejected') {
                classroomCallService.endCall();
              }
              onClose();
            }}
          >
            {t('common.close')}
          </Button>
        </div>
      }
    >
      {!activeClassroom ? (
        <div className="p-8 text-center space-y-3 my-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-[#1E1B4B]">No Active Classroom Selected</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please join or select an active classroom to access classroom discussions, announcements, and direct messaging.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-[520px] -mx-4 -my-2 text-start relative overflow-hidden">
        {/* TOP BAR: Navigation Tabs & 1:1 Call Actions & Teacher Permissions */}
        <div className="px-4 py-2.5 bg-white border-b border-[#EDE8F5] flex items-center justify-between flex-wrap gap-2">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8FE] border border-[#EDE8F5]">
            <button
              type="button"
              onClick={() => setActiveTab('group')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'group'
                  ? 'bg-white text-[#7C3AED] shadow-2xs'
                  : 'text-slate-600 hover:text-[#7C3AED]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('chat.groupChat') || 'Class Group'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'bg-white text-[#7C3AED] shadow-2xs'
                  : 'text-slate-600 hover:text-[#7C3AED]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('chat.directMessages') || 'Direct 1:1'}</span>
            </button>
          </div>

          {/* 1:1 Voice & Video Call Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStartCall('voice')}
              disabled={!canCallInCurrentChannel}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !canCallInCurrentChannel
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-purple-50 text-[#7C3AED] hover:bg-purple-100 border border-purple-200/80 shadow-2xs cursor-pointer'
              }`}
              title={
                !canCallInCurrentChannel
                  ? (t('call.restricted') || 'Calling disabled in announcement mode')
                  : (t('call.startVoiceCall') || 'Start Voice Call')
              }
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('call.voiceCall') || 'Voice Call'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartCall('video')}
              disabled={!canCallInCurrentChannel}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !canCallInCurrentChannel
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-[#7C3AED] text-white hover:bg-purple-700 shadow-2xs cursor-pointer'
              }`}
              title={
                !canCallInCurrentChannel
                  ? (t('call.restricted') || 'Calling disabled in announcement mode')
                  : (t('call.startVideoCall') || 'Start Video Call')
              }
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('call.videoCall') || 'Video Call'}</span>
            </button>
          </div>

          {/* Teacher Permission Controls */}
          {isTeacher ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Permission:</span>
              <button
                type="button"
                onClick={() => handleTogglePermission('everyone')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  settings.permissionMode === 'everyone'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Everyone can send text, voice notes and start calls"
              >
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span>Everyone</span>
              </button>
              <button
                type="button"
                onClick={() => handleTogglePermission('teacher_only')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  settings.permissionMode === 'teacher_only'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Announcement mode: students can only read and listen; student calls disabled"
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Teacher Only</span>
              </button>
            </div>
          ) : (
            settings.permissionMode === 'teacher_only' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                <Lock className="w-3 h-3" />
                <span>Announcement Mode</span>
              </span>
            )
          )}
        </div>

        {/* CALL NOTICE & HARDWARE PERMISSION BANNER */}
        {callNotice && (
          <div
            className={`px-4 py-2.5 border-b text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              callNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  callNotice.type === 'error' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div>
                <p className="font-bold">
                  {callNotice.type === 'error' ? 'Wicitaanka Ma Guulaysan (Call Notice)' : 'Ogeysiis Wicitaan (Notice)'}
                </p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{callNotice.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {callNotice.isIframe && (
                <a
                  href={getStandaloneAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ku Fur Daaqad Cusub</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setCallNotice(null)}
                className="p-1 rounded-md hover:bg-black/5 text-slate-500 cursor-pointer"
                title="Xir ogeysiiska"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SUBHEADER: Direct Tab Contact Indicator & Test Incoming Call */}
        {activeTab === 'direct' && isTeacher && (
          <div className="px-4 py-2 bg-[#FAF8FE] border-b border-[#EDE8F5] flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="font-bold text-slate-500 shrink-0">Direct with:</span>
              {realEnrolledStudents.length === 0 ? (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Weli ma jiraan arday iska diiwaangelisay fasalkan (No enrolled students yet)
                </span>
              ) : (
                directStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedStudentId === st.id
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {st.name}
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => handleTestIncomingCall('video')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shrink-0 cursor-pointer flex items-center gap-1"
              title="Simulate incoming video call from enrolled student for testing"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Test Incoming Call</span>
            </button>
          </div>
        )}

        {activeTab === 'direct' && !isTeacher && (
          <div className="px-4 py-2 bg-[#FAF8FE] border-b border-[#EDE8F5] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Instructor:</span>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{resolvedInstructor?.name || activeClassroom?.instructorName || 'Instructor'}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleTestIncomingCall('video')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shrink-0 cursor-pointer flex items-center gap-1"
              title="Simulate incoming call from instructor for testing"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Test Incoming Call</span>
            </button>
          </div>
        )}

        {/* RESTRICTION NOTICE FOR STUDENTS */}
        {!isTeacher && isClassroomRestricted && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {t('chat.permission.restrictedNotice') ||
                'Chat is currently in announcement mode. Only the instructor can send messages.'}
            </span>
          </div>
        )}

        {/* MESSAGES SCROLL SURFACE */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8FE]/50">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <MessageSquare className="w-8 h-8 stroke-1 text-slate-300" />
              <p className="text-xs">No messages yet in this discussion.</p>
              <p className="text-[11px] text-slate-400">
                Be the first to say hello or ask a question!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOwn =
                (Boolean(auth.currentUser?.uid) && msg.senderId === auth.currentUser?.uid) ||
                (Boolean(effectiveUserId) && msg.senderId === effectiveUserId) ||
                (Boolean(currentUserId) && msg.senderId === currentUserId) ||
                (isTeacher
                  ? msg.senderRole === 'teacher' && (msg.senderId === 'teacher_1' || msg.senderId === activeClassroom?.instructorId)
                  : msg.senderRole === 'student' && (msg.senderId === 'st-1'));

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} space-y-1`}
                >
                  {/* Sender Name & Role Header */}
                  <div className="flex items-center gap-1.5 text-[11px] px-1">
                    <span className="font-bold text-[#1E1B4B]">{msg.senderName}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                        msg.senderRole === 'teacher'
                          ? 'bg-purple-100 text-[#7C3AED]'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {msg.senderRole === 'teacher' ? 'Instructor' : 'Student'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message Bubble (Text or Voice Note) */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs leading-relaxed ${
                      isOwn
                        ? 'bg-[#7C3AED] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-[#EDE8F5] rounded-tl-xs'
                    }`}
                  >
                    {msg.type === 'voice_note' && msg.voiceNote ? (
                      <VoiceNoteBubble voiceNote={msg.voiceNote} isOwn={isOwn} />
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}

                    {/* Footer: Delivery Status for own messages */}
                    {isOwn && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-80">
                        {msg.status === 'read' ? (
                          <span className="flex items-center gap-0.5 text-purple-200">
                            <CheckCheck className="w-3.5 h-3.5 text-purple-200" />
                            <span>Read</span>
                          </span>
                        ) : msg.status === 'delivered' ? (
                          <span className="flex items-center gap-0.5 text-purple-200/80">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-purple-200/80">
                            <Check className="w-3.5 h-3.5" />
                            <span>Sent</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM COMPOSER: Text & Voice Note Recorder */}
        {recordingError && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">
                  {recordingError}
                </p>
                {(permissionRecoveryHint || (permissionDenied && t('chat.micPermissionHelp'))) && (
                  <p className="text-[11px] text-rose-700 mt-0.5 font-normal leading-normal">
                    {permissionRecoveryHint || t('chat.micPermissionHelp')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
              {(diagnosedCause === 'iframe_permissions_policy' || (typeof window !== 'undefined' && window.self !== window.top && permissionDenied)) && (
                <a
                  href={getStandaloneAppUrl()}
                  target="_blank"
                  rel="noopener"
                  className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="Open app directly in a top-level browser tab to grant microphone access"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Standalone Tab</span>
                </a>
              )}
              {permissionDenied && (
                <button
                  type="button"
                  disabled={isRequestingPermission}
                  onClick={handleAllowMicrophone}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title={permissionRecoveryHint ? 'Retry permission after checking browser settings' : 'Request microphone access'}
                >
                  {isRequestingPermission ? (
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Mic className="w-3 h-3" />
                  )}
                  <span>
                    {isRequestingPermission
                      ? 'Requesting...'
                      : permissionRecoveryHint
                      ? (t('chat.micRetryAction') || 'Retry Permission')
                      : (t('chat.micAllowAction') || 'Allow Microphone')}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setRecordingError(null);
                  setPermissionDenied(false);
                  setPermissionRecoveryHint(null);
                  setDiagnosedCause(null);
                }}
                className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM COMPOSER: Permission Granted Success Banner */}
        {permissionNotice && !recordingError && !isRecording && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium text-emerald-900">{permissionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPermissionNotice(null)}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="p-3 bg-white border-t border-[#EDE8F5]">
          {isRecording ? (
            /* Live Audio Recording Panel */
            <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-purple-50 border border-purple-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-600">
                  Recording Voice Note: {recordingSeconds}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  {t('chat.cancelVoice') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('chat.sendVoice') || 'Send Voice Note'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Message Composer */
            <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
              <input
                type="text"
                disabled={!canSendInCurrentChannel}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  !canSendInCurrentChannel
                    ? 'Chat restricted by instructor...'
                    : t('chat.typeMessage') || 'Type a message to the class...'
                }
                className="flex-1 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#1E1B4B] focus:border-[#7C3AED] focus:bg-white outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Voice Note Record Button */}
              <button
                type="button"
                disabled={!canSendInCurrentChannel}
                onClick={startRecording}
                className="h-11 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Record and send a voice note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!canSendInCurrentChannel || !inputText.trim()}
                className="h-11 px-4 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Real-time WebRTC Diagnostics Trace Panel (Stages A-J & Environment Inspect) */}
        <div className="px-4 pb-2">
          <CallDiagnosticsPanel />
        </div>
      </div>
    )}
  </Modal>
  );
};
