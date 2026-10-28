/**
 * SmartEducate — Global University & Education Platform
 * Educate-Inspired Progressive UX Architecture (Step 04)
 *
 * Screen 1: SmartEducate Landing / Welcome (Approved — 100% UNCHANGED)
 * Screen 2: Approved Role Selection ("I am...") (Approved — 100% UNCHANGED)
 * Screen 3: Progressive Student Setup (4 Global Steps — 100% UNCHANGED)
 * Screen 4: Student Home (3 Primary Actions: Homework, Join Classroom, Find a Teacher)
 * Screen 5: Homework (SmartEducate AI Learning Assistant)
 * Screen 6: Join Classroom (Classroom Code Entry)
 * Screen 7: Find a Teacher (Step-by-Step Progressive Discovery Flow)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { StudentProvider, useStudent } from './state/StudentContext';
import { ThemeProvider } from './state/ThemeContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav, NavItem } from './components/ui/BottomNav';
import { SelectionCard } from './components/ui/SelectionCard';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { AiHomeworkScreen } from './components/homework/AiHomeworkScreen';
import { PremiumScreen } from './components/premium/PremiumScreen';
import { SettingsMenuDrawer } from './components/navigation/SettingsMenuDrawer';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { TeacherHomeScreen } from './components/teacher/TeacherHomeScreen';
import { TeacherAiScreen } from './components/teacher/TeacherAiScreen';
import { voiceService } from './services/voiceService';
import { TeacherAssessmentsScreen } from './components/teacher/TeacherAssessmentsScreen';
import { aiGradingService } from './services/aiGradingService';
import { AiTeacherModal } from './components/teacher/AiTeacherModal';
import { TestAnalysisModal } from './components/teacher/TestAnalysisModal';
import { CertificateModal } from './components/teacher/CertificateModal';
import { TimetableModal } from './components/teacher/TimetableModal';
import { AttendanceModal } from './components/teacher/AttendanceModal';
import { FeesModal } from './components/teacher/FeesModal';
import { AskDoubtModal } from './components/teacher/AskDoubtModal';
import { CoTeachersModal } from './components/teacher/CoTeachersModal';
import { ClassroomWhiteboard } from './components/whiteboard/ClassroomWhiteboard';
import { WhiteboardViewerModal } from './components/whiteboard/WhiteboardViewerModal';
import { whiteboardSyncService } from './services/whiteboardSyncService';
import { liveSessionService, LiveLectureSession, LiveConnectionState } from './services/liveSessionService';
import { WhiteboardSession } from './types/whiteboard';
import { studyMaterialService, ClassroomStudyMaterial, StudyMaterialDownloadPermission } from './services/studyMaterialService';
import { ClassroomRecordingModal } from './components/recording/ClassroomRecordingModal';
import { ClassroomChatModal } from './components/chat/ClassroomChatModal';
import { classroomChatService } from './services/classroomChatService';
import { classroomCallService } from './services/classroomCallService';
import { ClassroomCallOverlay } from './components/chat/ClassroomCallOverlay';
import { CallSession } from './types/call';
import { StudentProgressChart } from './components/student/StudentProgressChart';
import { AssessmentAlertBanner } from './components/student/AssessmentAlertBanner';
import { AuthModal } from './components/auth/AuthModal';
import { UserAccountProfile } from './services/authService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './services/firebase';
import { UserRole } from './types/student';
import {
  GlobalTeacher,
  GlobalUniversity,
  GlobalClassroom,
  HomeworkHelpRequest,
  LearningCategory,
  UniversityVerificationStatus,
  CurriculumFaculty,
  CurriculumSubjectItem,
  CurriculumCourse,
  CurriculumSearchResult,
} from './types/education';
import {
  GLOBAL_UNIVERSITIES,
  GLOBAL_LEARNING_LANGUAGES,
  PROGRAMMING_BASIC_CATALOG,
  PROGRAMMING_ADV_CATALOG,
  PROFESSIONAL_SKILLS_CATALOG,
  VOCATIONAL_TECHNICAL_CATALOG,
  MEDICAL_SCIENCES_CATALOG,
  GLOBAL_TEACHERS,
  GLOBAL_CLASSROOMS,
  SAMPLE_CLASSROOM_STUDENTS,
  CANONICAL_FACULTIES,
  CANONICAL_SCHOOL_GRADES,
  CANONICAL_TOP_LANGUAGES,
  TopLanguageItem,
  CANONICAL_POPULAR_SUBJECTS,
  CANONICAL_TOP_10_SUBJECTS,
  searchCurriculumCatalogue,
  TEACHER_AZ_SPECIALIZATIONS,
  CANONICAL_TEACHER_TYPES,
  CANONICAL_TEACHING_LEVELS,
  CANONICAL_PROGRESSIVE_LEVELS,
  CANONICAL_LEARNING_GOALS,
} from './data/globalEducation';
import {
  GraduationCap,
  BookOpenCheck,
  Building2,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  User,
  Search,
  BookOpen,
  Calendar,
  FileCheck,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  Camera,
  Paperclip,
  Star,
  Award,
  Code2,
  Languages,
  School,
  Briefcase,
  Compass,
  CheckCircle2,
  Send,
  Eye,
  EyeOff,
  Download,
  Lock,
  ArrowLeftRight,
  Plus,
  Pen,
  Copy,
  Share2,
  Video,
  FileText,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
  X,
  Home,
  PlayCircle,
  ClipboardCheck,
  Headphones,
  CheckSquare,
  Calculator,
  Layers,
  Plane,
  Anchor,
  Car,
  Atom,
  Brain,
  Cpu,
  Activity,
  Leaf,
  Scale,
  Globe,
  Wrench,
  Palette,
  Radio,
  BookMarked,
  FlaskConical,
  Dna,
  DollarSign,
  TrendingUp,
  Volume2,
  VolumeX,
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const STUDY_AREAS = [
  { id: 'cs', label: 'Computer Science & IT', defaultDept: 'Software Engineering' },
  { id: 'med', label: 'Medicine & Health Sciences', defaultDept: 'General Medicine' },
  { id: 'biz', label: 'Business & Economics', defaultDept: 'Business Administration' },
  { id: 'eng', label: 'Engineering & Technology', defaultDept: 'Civil Engineering' },
  { id: 'edu', label: 'Education & Humanities', defaultDept: 'Curriculum & Instruction' },
  { id: 'law', label: 'Law & Sharia', defaultDept: 'Comparative Jurisprudence' },
];

type ScreenType =
  | 'landing'
  | 'roles'
  | 'student_setup'
  | 'student_home'
  | 'homework'
  | 'join_classroom'
  | 'my_classrooms'
  | 'find_teacher'
  | 'teacher_setup'
  | 'teacher_home'
  | 'teacher_ai'
  | 'teacher_assessments'
  | 'teacher_classroom_detail'
  | 'profile'
  | 'premium';

type TeacherFlowStep =
  | 'categories'
  | 'select_subject'
  | 'select_course'
  | 'select_level'
  | 'select_topic'
  | 'select_goal'
  | 'school_grade'
  | 'language_track'
  | 'programming_track'
  | 'university_search'
  | 'university_faculty'
  | 'skills_track'
  | 'vocational_track'
  | 'medical_track'
  | 'results';

const getFacultyIcon = (facultyId: string) => {
  switch (facultyId) {
    case 'languages':
      return <Languages className="w-6 h-6 stroke-[1.9]" />;
    case 'school':
      return <School className="w-6 h-6 stroke-[1.9]" />;
    case 'math':
      return <Calculator className="w-6 h-6 stroke-[1.9]" />;
    case 'sciences':
      return <Atom className="w-6 h-6 stroke-[1.9]" />;
    case 'computing':
      return <Code2 className="w-6 h-6 stroke-[1.9]" />;
    case 'engineering':
      return <Cpu className="w-6 h-6 stroke-[1.9]" />;
    case 'medical':
      return <Activity className="w-6 h-6 stroke-[1.9]" />;
    case 'business':
      return <Briefcase className="w-6 h-6 stroke-[1.9]" />;
    case 'social_sciences':
      return <Users className="w-6 h-6 stroke-[1.9]" />;
    case 'humanities':
      return <BookOpen className="w-6 h-6 stroke-[1.9]" />;
    case 'arts_design':
      return <Palette className="w-6 h-6 stroke-[1.9]" />;
    case 'law':
      return <Scale className="w-6 h-6 stroke-[1.9]" />;
    case 'education_teaching':
      return <GraduationCap className="w-6 h-6 stroke-[1.9]" />;
    case 'agriculture':
      return <Leaf className="w-6 h-6 stroke-[1.9]" />;
    case 'aviation':
      return <Plane className="w-6 h-6 stroke-[1.9]" />;
    case 'maritime_shipping':
      return <Anchor className="w-6 h-6 stroke-[1.9]" />;
    case 'automotive_vehicles':
      return <Car className="w-6 h-6 stroke-[1.9]" />;
    case 'architecture_construction':
      return <Building2 className="w-6 h-6 stroke-[1.9]" />;
    case 'media_communication':
      return <Radio className="w-6 h-6 stroke-[1.9]" />;
    case 'environment_earth':
      return <Globe className="w-6 h-6 stroke-[1.9]" />;
    case 'psychology':
      return <Brain className="w-6 h-6 stroke-[1.9]" />;
    case 'vocational_skills':
      return <Wrench className="w-6 h-6 stroke-[1.9]" />;
    case 'adult_learning':
      return <BookMarked className="w-6 h-6 stroke-[1.9]" />;
    case 'higher_education':
      return <GraduationCap className="w-6 h-6 stroke-[1.9]" />;
    case 'research_academic':
      return <FileCheck className="w-6 h-6 stroke-[1.9]" />;
    default:
      return <BookOpen className="w-6 h-6 stroke-[1.9]" />;
  }
};

const getPopularSubjectIcon = (iconName: string) => {
  switch (iconName) {
    case 'Calculator':
      return <Calculator className="w-5 h-5 stroke-[2]" />;
    case 'BookOpen':
      return <BookOpen className="w-5 h-5 stroke-[2]" />;
    case 'Code2':
      return <Code2 className="w-5 h-5 stroke-[2]" />;
    case 'Atom':
      return <Atom className="w-5 h-5 stroke-[2]" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 stroke-[2]" />;
    case 'FlaskConical':
      return <FlaskConical className="w-5 h-5 stroke-[2]" />;
    case 'Dna':
      return <Dna className="w-5 h-5 stroke-[2]" />;
    case 'Briefcase':
      return <Briefcase className="w-5 h-5 stroke-[2]" />;
    case 'DollarSign':
      return <DollarSign className="w-5 h-5 stroke-[2]" />;
    case 'TrendingUp':
      return <TrendingUp className="w-5 h-5 stroke-[2]" />;
    case 'Cpu':
      return <Cpu className="w-5 h-5 stroke-[2]" />;
    default:
      return <BookOpen className="w-5 h-5 stroke-[2]" />;
  }
};

const AppContent: React.FC = () => {
  const { t, isRTL } = useI18n();
  const {
    profile,
    actualRole,
    viewMode,
    availableRoles,
    teacherProfile,
    isStudentPreview,
    hasTeacherAccess,
    teacherClassrooms,
    activeClassroomId,
    setActiveClassroomId,
    createTeacherClassroom,
    refreshTeacherClassrooms,
    refreshCoTeacherCounts,
    enrolledClassrooms,
    enrollInClassroom,
    syncOrRepairEnrollment,
    activeClassroomRoster,
    isRosterLoading,
    rosterError,
    refreshActiveRoster,
    announcements,
    postAnnouncement,
    setRole,
    switchViewMode,
    updatePersonalInfo,
    updateUniversityInfo,
    updateAcademicProfile,
    updateTeacherProfile,
    resetProfile,
    timetableEntries,
    addTimetableEntry,
    removeTimetableEntry,
    studentCertificates,
    approveCertificate,
    issueCertificate,
    generatedMaterials,
    addGeneratedMaterial,
    isAuthenticated,
    isAuthChecking,
    userAccount,
    signOutUser,
    applyAuthenticatedProfile,
  } = useStudent();

  const isTeacherRole = actualRole === 'lecturer' || actualRole === 'teacher';

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('screen') as ScreenType | null;
        if (s) return s;
      } catch (e) {}
    }
    return 'landing';
  });
  const [setupStep, setSetupStep] = useState<number>(1); // 1 to 4

  // Real Authentication Dialog States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const handleAuthSuccess = (account: UserAccountProfile) => {
    applyAuthenticatedProfile(account);
    const isTeacher = account.role === 'teacher' || account.role === 'lecturer';
    if (isTeacher) {
      setCurrentScreen('teacher_home');
    } else {
      setCurrentScreen('student_home');
    }
  };

  // Automatically navigate to dashboard when authenticated on reload or sign-in
  useEffect(() => {
    if (!isAuthChecking && isAuthenticated && userAccount) {
      if (currentScreen === 'landing') {
        const isTeacher = userAccount.role === 'teacher' || userAccount.role === 'lecturer';
        setCurrentScreen(isTeacher ? 'teacher_home' : 'student_home');
      }
    }
  }, [isAuthChecking, isAuthenticated, userAccount, currentScreen]);

  // Dialogs
  const [isNextStepNoticeOpen, setIsNextStepNoticeOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isNoClassCodeOpen, setIsNoClassCodeOpen] = useState(false);
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<GlobalTeacher | null>(null);
  const [sessionRequestedNotice, setSessionRequestedNotice] = useState(false);

  // Setup Form States
  const [emailInput, setEmailInput] = useState('');
  const [fullName, setFullName] = useState(profile.personalInfo.fullName || '');
  const [universityName, setUniversityName] = useState(
    profile.universityInfo.universityName || GLOBAL_UNIVERSITIES[0].name
  );
  const [uniSearch, setUniSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState(profile.universityInfo.facultyOrCollege || STUDY_AREAS[0].label);
  const [department, setDepartment] = useState(profile.universityInfo.department || STUDY_AREAS[0].defaultDept);
  const [yearOfStudy, setYearOfStudy] = useState(
    profile.academicProfile.currentYearOfStudy ? String(profile.academicProfile.currentYearOfStudy) : '1'
  );

  // Teacher Setup States (Step 04)
  const [teacherSetupStep, setTeacherSetupStep] = useState<number>(1);
  const [teacherNameInput, setTeacherNameInput] = useState(
    teacherProfile.name && teacherProfile.name !== 'Professor / Instructor' ? teacherProfile.name : ''
  );
  const [teacherInstitutionInput, setTeacherInstitutionInput] = useState(
    teacherProfile.institution || GLOBAL_UNIVERSITIES[0].name
  );
  const [teacherInstSearch, setTeacherInstSearch] = useState('');
  const [teacherSubjectInput, setTeacherSubjectInput] = useState(
    teacherProfile.subjects?.[0] || 'Mathematics'
  );

  // Teacher Modals & Classroom UI States
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('Computer Science');
  const [newClassCustomCode, setNewClassCustomCode] = useState('');

  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDue, setNewAssignmentDue] = useState('Next Monday, 11:59 PM');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isStudyMaterialModalOpen, setIsStudyMaterialModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLiveSessionModalOpen, setIsLiveSessionModalOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isInviteCoTeacherModalOpen, setIsInviteCoTeacherModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // New test or quiz alert banner & toast for the student dashboard
  const [publishedAssessmentAlert, setPublishedAssessmentAlert] = useState<{
    id: string;
    title: string;
    type: 'test' | 'quiz';
    subject: string;
    classroomName?: string;
    teacherName?: string;
    dueDate?: string;
    totalQuestions?: number;
  } | null>(null);
  const [showAssessmentToast, setShowAssessmentToast] = useState(false);
  const toastTimeoutRef = useRef<any>(null);

  // Listen for new test/quiz published by an instructor and check for active unviewed tests
  useEffect(() => {
    const handleAssessmentPublished = (e: Event) => {
      const customEvent = e as CustomEvent;
      const asm = customEvent.detail;
      if (!asm) return;

      const isTestOrQuiz =
        asm.type === 'test' ||
        asm.type === 'quiz' ||
        /\b(test|quiz|imtixaan|kedis|امتحان|اختبار)\b/i.test(asm.title || '');

      if (isTestOrQuiz) {
        const alertData = {
          id: asm.id,
          title: asm.title,
          type: (asm.type === 'quiz' || /quiz|kedis/i.test(asm.title) ? 'quiz' : 'test') as 'test' | 'quiz',
          subject: asm.subject || 'General Education',
          classroomName: asm.classroomName,
          teacherName: asm.teacherName,
          dueDate: asm.dueDate,
          totalQuestions: asm.totalQuestions,
        };
        setPublishedAssessmentAlert(alertData);
        setShowAssessmentToast(true);

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setShowAssessmentToast(false);
        }, 7000);
      }
    };

    window.addEventListener('smarteducate:assessment-published', handleAssessmentPublished);

    // Initial check on load: if an active test or quiz exists and has not been dismissed
    try {
      const dismissedIds: string[] = JSON.parse(
        localStorage.getItem('smarteducate_dismissed_test_alerts') || '[]'
      );
      const latestTestOrQuiz = aiGradingService.getLatestActiveTestOrQuiz();
      if (latestTestOrQuiz && !dismissedIds.includes(latestTestOrQuiz.id)) {
        setPublishedAssessmentAlert({
          id: latestTestOrQuiz.id,
          title: latestTestOrQuiz.title,
          type: (latestTestOrQuiz.type === 'quiz' || /quiz|kedis/i.test(latestTestOrQuiz.title) ? 'quiz' : 'test') as 'test' | 'quiz',
          subject: latestTestOrQuiz.subject || 'General Education',
          classroomName: latestTestOrQuiz.classroomName,
          teacherName: latestTestOrQuiz.teacherName,
          dueDate: latestTestOrQuiz.dueDate,
          totalQuestions: latestTestOrQuiz.totalQuestions,
        });
      }
    } catch {
      // safe ignore
    }

    return () => {
      window.removeEventListener('smarteducate:assessment-published', handleAssessmentPublished);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleDismissAssessmentAlert = (alertId: string) => {
    setPublishedAssessmentAlert(null);
    setShowAssessmentToast(false);
    try {
      const dismissedIds: string[] = JSON.parse(
        localStorage.getItem('smarteducate_dismissed_test_alerts') || '[]'
      );
      if (!dismissedIds.includes(alertId)) {
        dismissedIds.push(alertId);
        localStorage.setItem('smarteducate_dismissed_test_alerts', JSON.stringify(dismissedIds));
      }
    } catch {
      // safe ignore
    }
  };

  const handleOpenPublishedAssessment = (alertId: string) => {
    handleDismissAssessmentAlert(alertId);
    setIsTestModalOpen(true);
  };

  // Synchronize unread notifications count across announcements, assignments & deadlines
  useEffect(() => {
    try {
      const stored = localStorage.getItem('smarteducate_read_notifications_v1');
      const readSet = stored ? new Set(JSON.parse(stored)) : new Set<string>();
      let total = 0;
      // Announcements
      const annList = Object.values(announcements).flat();
      if (annList.length === 0) {
        if (!readSet.has('ann-cls-101-default')) total += 1;
      } else {
        annList.forEach((a) => {
          if (!readSet.has(`ann-${a.id}`)) total += 1;
        });
      }
      // Assessments & Deadlines
      const asms = aiGradingService.getAssessments();
      asms.forEach((asm) => {
        if (!readSet.has(`asm-${asm.id}`)) total += 1;
        if (asm.dueDate && !readSet.has(`deadline-${asm.id}`)) total += 1;
      });
      if (!readSet.has('notice-term-exam')) total += 1;
      if (!readSet.has('notice-tuition-schedule')) total += 1;
      setUnreadNotifCount(total);
    } catch {}
  }, [announcements, isNotificationsDrawerOpen]);

  // Phase 09 Modal States
  const [isAiTeacherModalOpen, setIsAiTeacherModalOpen] = useState(false);
  const [isTestAnalysisModalOpen, setIsTestAnalysisModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isFeesModalOpen, setIsFeesModalOpen] = useState(false);
  const [isAskDoubtModalOpen, setIsAskDoubtModalOpen] = useState(false);

  // Independent Teacher Onboarding States (Section 7 & 12)
  const [teacherTypeChoice, setTeacherTypeChoice] = useState<'institutional' | 'independent'>('institutional');
  const [independentTutoringScope, setIndependentTutoringScope] = useState('Private Tuition (Grades 1–12 & Adult Learners)');

  const [announcementText, setAnnouncementText] = useState('');
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [liveSessionClassroomId, setLiveSessionClassroomId] = useState<string>('');
  const [activeLiveLectureSession, setActiveLiveLectureSession] = useState<LiveLectureSession | null>(null);
  const [enrolledLiveSessions, setEnrolledLiveSessions] = useState<LiveLectureSession[]>([]);
  const [isStartingLiveClass, setIsStartingLiveClass] = useState(false);
  const [isJoiningLiveLecture, setIsJoiningLiveLecture] = useState(false);
  const [joinLiveLectureError, setJoinLiveLectureError] = useState<string | null>(null);
  const [liveSessionError, setLiveSessionError] = useState<string | null>(null);
  const [liveMediaStream, setLiveMediaStream] = useState<MediaStream | null>(null);
  const [liveRemoteMediaStream, setLiveRemoteMediaStream] = useState<MediaStream | null>(null);
  const [liveConnectionState, setLiveConnectionState] = useState<LiveConnectionState>('IDLE');
  const [liveConnectionDetail, setLiveConnectionDetail] = useState<string | null>(null);
  const [isLiveAudioBlocked, setIsLiveAudioBlocked] = useState(false);
  const teacherBroadcastCleanupRef = useRef<(() => void) | null>(null);
  const studentLiveCleanupRef = useRef<(() => void) | null>(null);
  const remoteLiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isLiveCameraOff, setIsLiveCameraOff] = useState(false);
  const [isLiveMicMuted, setIsLiveMicMuted] = useState(false);

  // Hook remote audio element to live remote stream
  useEffect(() => {
    if (remoteLiveAudioRef.current && liveRemoteMediaStream) {
      if (remoteLiveAudioRef.current.srcObject !== liveRemoteMediaStream) {
        remoteLiveAudioRef.current.srcObject = liveRemoteMediaStream;
      }
      remoteLiveAudioRef.current
        .play()
        .then(() => setIsLiveAudioBlocked(false))
        .catch((err) => {
          console.warn('Live remote audio autoplay blocked:', err);
          setIsLiveAudioBlocked(true);
        });
    }
  }, [liveRemoteMediaStream]);

  const handleStartLiveClass = async () => {
    if (isStartingLiveClass) return;
    const targetClassroom =
      teacherActiveClassroom ||
      teacherClassrooms[0] ||
      (activeClassroom?.id ? activeClassroom : null);
    if (!targetClassroom) {
      setIsCreateClassModalOpen(true);
      return;
    }
    setIsStartingLiveClass(true);
    setLiveSessionError(null);
    setLiveSessionClassroomId(targetClassroom.id);
    setActiveClassroomId(targetClassroom.id);

    let acquiredStream: MediaStream | null = null;
    try {
      // Reuse canonical media pipeline from classroomCallService
      const mediaResult = await classroomCallService.acquireMedia('video');
      if (mediaResult.stream) {
        acquiredStream = mediaResult.stream;
        setLiveMediaStream(mediaResult.stream);
        liveSessionService.setLocalStream(mediaResult.stream);
        setIsLiveCameraOff(false);
        setIsLiveMicMuted(false);

        // Start teacher WebRTC broadcast pipeline for remote students
        if (teacherBroadcastCleanupRef.current) {
          teacherBroadcastCleanupRef.current();
        }
        const bCleanup = liveSessionService.startBroadcastMedia(
          targetClassroom.id,
          auth.currentUser?.uid || 'teacher_1',
          mediaResult.stream
        );
        teacherBroadcastCleanupRef.current = bCleanup;
      } else {
        setLiveSessionError(mediaResult.error || 'Camera or microphone permission required for live streaming.');
      }
    } catch (err: any) {
      console.warn('Microphone/Camera permission prompt note:', err?.message || err);
      setLiveSessionError('Camera access unavailable. Interactive Whiteboard broadcast mode active.');
    } finally {
      setIsStartingLiveClass(false);
      setLiveSessionActive(true);
      setLiveClassActiveTab('video');
      setIsLiveSessionModalOpen(true);

      const teacherDisplayName =
        targetClassroom.instructorName || teacherProfile.name || 'Instructor';
      const lectureSession = await liveSessionService.startLiveLecture({
        classroomId: targetClassroom.id,
        title: targetClassroom.title,
        subject: targetClassroom.subject,
        teacherId: auth.currentUser?.uid || 'teacher_1',
        teacherName: teacherDisplayName,
        hasVideo: Boolean(acquiredStream && !isLiveCameraOff),
        hasAudio: Boolean(acquiredStream && !isLiveMicMuted),
        activeTab: 'video',
      });
      setActiveLiveLectureSession(lectureSession);
    }
  };

  const handleToggleLiveCamera = () => {
    if (liveMediaStream) {
      const vTracks = liveMediaStream.getVideoTracks();
      const nextState = !isLiveCameraOff;
      vTracks.forEach((t) => {
        t.enabled = !nextState;
      });
      setIsLiveCameraOff(nextState);
      const classId = liveSessionClassroomId || activeClassroomId || teacherActiveClassroom?.id;
      if (classId) {
        liveSessionService.updateMediaState(classId, { hasVideo: !nextState });
      }
    }
  };

  const handleToggleLiveMic = () => {
    if (liveMediaStream) {
      const aTracks = liveMediaStream.getAudioTracks();
      const nextState = !isLiveMicMuted;
      aTracks.forEach((t) => {
        t.enabled = !nextState;
      });
      setIsLiveMicMuted(nextState);
      const classId = liveSessionClassroomId || activeClassroomId || teacherActiveClassroom?.id;
      if (classId) {
        liveSessionService.updateMediaState(classId, { hasAudio: !nextState });
      }
    }
  };

  const handleEndLiveClass = async () => {
    if (teacherBroadcastCleanupRef.current) {
      teacherBroadcastCleanupRef.current();
      teacherBroadcastCleanupRef.current = null;
    }
    if (liveMediaStream) {
      try {
        liveMediaStream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('Error stopping media tracks:', e);
      }
      setLiveMediaStream(null);
      liveSessionService.setLocalStream(null);
    }
    const currentClassId = liveSessionClassroomId || activeClassroomId || teacherActiveClassroom?.id;
    if (currentClassId) {
      await liveSessionService.endLiveLecture(currentClassId);
    }
    setLiveSessionActive(false);
    setActiveLiveLectureSession(null);
    setLiveSessionClassroomId('');
    setIsLiveSessionModalOpen(false);
    setLiveSessionError(null);
  };

  const handleStudentJoinLiveLecture = async (targetSession: LiveLectureSession) => {
    if (isJoiningLiveLecture) return;
    setIsJoiningLiveLecture(true);
    setJoinLiveLectureError(null);

    try {
      const isEnrolled = enrolledClassrooms.some((c) => c.id === targetSession.classroomId);
      if (!isEnrolled && !isStudentPreview) {
        setJoinLiveLectureError('You must be enrolled in this classroom to join the live lecture.');
        return;
      }

      // Clean up previous student live connection if any
      if (studentLiveCleanupRef.current) {
        studentLiveCleanupRef.current();
        studentLiveCleanupRef.current = null;
      }

      setActiveClassroomId(targetSession.classroomId);
      setLiveSessionClassroomId(targetSession.classroomId);
      setLiveSessionActive(true);
      setActiveLiveLectureSession(targetSession);
      setLiveClassActiveTab('video');
      setIsLiveSessionModalOpen(true);

      // Check if local stream is available (e.g. single-device teacher preview)
      const localShared = liveSessionService.getLocalStream();
      if (localShared && isStudentPreview) {
        setLiveRemoteMediaStream(localShared);
        setLiveConnectionState('CONNECTED');
        return;
      }

      // Establish real WebRTC peer connection to receive teacher stream
      const studentUid = auth.currentUser?.uid || profile.id || `st_${Date.now()}`;
      const studentName = profile.personalInfo?.fullName || userAccount?.fullName || 'Student';

      const cleanup = liveSessionService.joinLiveStream({
        classroomId: targetSession.classroomId,
        studentUid,
        studentName,
        teacherUid: targetSession.teacherId,
        onRemoteStream: (stream) => {
          setLiveRemoteMediaStream(stream);
        },
        onStateChange: (state, detail) => {
          setLiveConnectionState(state);
          setLiveConnectionDetail(detail || null);
          if (state === 'SESSION_ENDED') {
            setLiveRemoteMediaStream(null);
          }
        },
      });
      studentLiveCleanupRef.current = cleanup;
    } catch (err: any) {
      console.warn('Student join live lecture error:', err);
      setJoinLiveLectureError('Could not join live lecture. Please retry.');
      setLiveConnectionState('CONNECTION_FAILED');
    } finally {
      setIsJoiningLiveLecture(false);
    }
  };

  const handleStudentLeaveLiveLecture = () => {
    if (studentLiveCleanupRef.current) {
      studentLiveCleanupRef.current();
      studentLiveCleanupRef.current = null;
    }
    setLiveRemoteMediaStream(null);
    setLiveConnectionState('IDLE');
    setLiveConnectionDetail(null);
    setIsLiveSessionModalOpen(false);
  };

  const [studentRosterFilter, setStudentRosterFilter] = useState('');
  const [activeClassroomTab, setActiveClassroomTab] = useState<'roster' | 'announcements' | 'assignments'>('roster');

  const isTeacherChatMode = (viewMode === 'teacher' || isTeacherRole) && !isStudentPreview;

  // 1. Teacher classroom selection (preserved exactly)
  const teacherActiveClassroom =
    teacherClassrooms.find((c) => c.id === activeClassroomId) || teacherClassrooms[0] || null;

  // 2. Student classroom selection from actual enrolledClassrooms list
  const studentActiveClassroom =
    enrolledClassrooms.find(
      (c) =>
        c.id === activeClassroomId ||
        (c.code && activeClassroomId && c.code.trim().toUpperCase() === activeClassroomId.trim().toUpperCase())
    ) ||
    enrolledClassrooms[0] ||
    null;

  // 3. Resolved active classroom for Chat
  const activeChatClassroom = isTeacherChatMode
    ? teacherActiveClassroom
    : (studentActiveClassroom || (isStudentPreview ? teacherActiveClassroom : null));

  // 4. General active classroom for classroom-scoped screens
  const activeClassroom = isTeacherChatMode
    ? teacherActiveClassroom
    : (studentActiveClassroom || teacherActiveClassroom);

  // State for guidance when student has no enrolled classrooms to chat in
  const [isNoEnrolledChatNoticeOpen, setIsNoEnrolledChatNoticeOpen] = useState(false);

  const handleStudentOpenChat = () => {
    if (!isTeacherChatMode && enrolledClassrooms.length === 0) {
      setIsNoEnrolledChatNoticeOpen(true);
      return;
    }
    if (!isTeacherChatMode && !activeClassroomId && enrolledClassrooms.length > 0) {
      setActiveClassroomId(enrolledClassrooms[0].id);
    }
    setIsChatModalOpen(true);
  };

  // Live Class & Whiteboard States
  const [liveClassActiveTab, setLiveClassActiveTab] = useState<'video' | 'whiteboard'>('video');
  const [selectedWhiteboardMaterial, setSelectedWhiteboardMaterial] = useState<ClassroomStudyMaterial | null>(null);
  const [classroomStudyMaterials, setClassroomStudyMaterials] = useState<ClassroomStudyMaterial[]>([]);

  // Keep classroom study materials in sync
  useEffect(() => {
    if (activeClassroom?.id) {
      setClassroomStudyMaterials(studyMaterialService.getMaterials(activeClassroom.id));
    }
  }, [activeClassroom?.id, isStudyMaterialModalOpen]);

  // Real-time synchronization of authoritative Live Class sessions across all enrolled classrooms for students
  useEffect(() => {
    const enrolledIds = enrolledClassrooms.map((c) => c.id).filter(Boolean);
    if (enrolledIds.length === 0) {
      setEnrolledLiveSessions([]);
      if (viewMode === 'student' || isStudentPreview) {
        setLiveSessionActive(false);
        setActiveLiveLectureSession(null);
      }
      return;
    }

    const unsub = liveSessionService.subscribeEnrolledClassrooms(enrolledIds, (activeList) => {
      setEnrolledLiveSessions(activeList);
      if (activeList.length > 0) {
        const primary = activeList[0];
        setActiveLiveLectureSession(primary);
        setLiveSessionActive(true);
        setLiveSessionClassroomId(primary.classroomId);
      } else if (viewMode === 'student' || isStudentPreview) {
        setLiveSessionActive(false);
        setActiveLiveLectureSession(null);
      }
    });

    return () => unsub();
  }, [enrolledClassrooms, viewMode, isStudentPreview]);

  // Real-time live status for teacher view
  useEffect(() => {
    if (viewMode === 'teacher' && !isStudentPreview && teacherActiveClassroom?.id) {
      const unsub = liveSessionService.subscribeClassroom(teacherActiveClassroom.id, (sess) => {
        if (sess && sess.status === 'active') {
          setLiveSessionActive(true);
          setActiveLiveLectureSession(sess);
          setLiveSessionClassroomId(sess.classroomId);
        } else if (!isStartingLiveClass && !liveMediaStream) {
          if (liveSessionClassroomId === teacherActiveClassroom.id) {
            setLiveSessionActive(false);
            setActiveLiveLectureSession(null);
          }
        }
      });
      return () => unsub();
    }
  }, [viewMode, isStudentPreview, teacherActiveClassroom?.id, liveSessionClassroomId, liveMediaStream, isStartingLiveClass]);

  // Classroom Chat Unread Count Tracking for Student & Teacher
  const [studentUnreadChatCount, setStudentUnreadChatCount] = useState(0);

  // Automatically open Classroom Chat when launched in a standalone tab via ?openChat=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const screenParam = params.get('screen') as ScreenType | null;
        if (screenParam) {
          setCurrentScreen(screenParam);
          if (screenParam === 'teacher_home') {
            switchViewMode('teacher');
          }
        }
        if (params.get('openChat') === 'true' || window.location.hash === '#classroom-chat') {
          if (!isTeacherChatMode && enrolledClassrooms.length === 0) {
            setIsNoEnrolledChatNoticeOpen(true);
          } else {
            setIsChatModalOpen(true);
          }
        }
      } catch (e) {}
    }
  }, [isTeacherChatMode, enrolledClassrooms.length]);

  useEffect(() => {
    const targetChatClass = isTeacherChatMode ? teacherActiveClassroom : studentActiveClassroom;
    if (targetChatClass?.id) {
      setStudentUnreadChatCount(classroomChatService.getUnreadCount(targetChatClass.id, isTeacherChatMode ? 'teacher' : 'student'));
      const unsub = classroomChatService.subscribe(targetChatClass.id, () => {
        setStudentUnreadChatCount(classroomChatService.getUnreadCount(targetChatClass.id, isTeacherChatMode ? 'teacher' : 'student'));
      });
      return () => unsub();
    }
  }, [isTeacherChatMode, teacherActiveClassroom?.id, studentActiveClassroom?.id]);

  useEffect(() => {
    const targetChatClass = isTeacherChatMode ? teacherActiveClassroom : studentActiveClassroom;
    if (targetChatClass?.id) {
      setStudentUnreadChatCount(classroomChatService.getUnreadCount(targetChatClass.id, isTeacherChatMode ? 'teacher' : 'student'));
    }
  }, [isChatModalOpen, isTeacherChatMode, teacherActiveClassroom?.id, studentActiveClassroom?.id]);

  // WebRTC Call Session State & App-level Incoming Call Listener
  const [globalCallSession, setGlobalCallSession] = useState<CallSession | null>(null);

  useEffect(() => {
    const unsub = classroomCallService.subscribe((sess) => {
      setGlobalCallSession(sess);
    });
    return () => unsub();
  }, []);

  // App-level WebRTC Incoming Call Listener across all member classrooms
  useEffect(() => {
    if (!auth.currentUser) {
      classroomCallService.clearIncomingListeners();
      return;
    }
    const allClassroomIds = Array.from(
      new Set(
        [
          ...teacherClassrooms.map((c) => c.id),
          ...enrolledClassrooms.map((c) => c.id),
          activeClassroomId,
        ].filter(Boolean)
      )
    );
    if (allClassroomIds.length > 0) {
      classroomCallService.listenForIncomingCalls(auth.currentUser.uid, allClassroomIds);
    } else {
      classroomCallService.clearIncomingListeners();
    }
  }, [auth.currentUser?.uid, teacherClassrooms, enrolledClassrooms, activeClassroomId]);

  // Study Material Management & Permission States
  const [selectedDocumentMaterial, setSelectedDocumentMaterial] = useState<ClassroomStudyMaterial | null>(null);
  const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);
  const [uploadMaterialTitle, setUploadMaterialTitle] = useState('');
  const [uploadMaterialType, setUploadMaterialType] = useState('PDF Document');
  const [uploadMaterialSize, setUploadMaterialSize] = useState('3.2 MB');
  const [uploadMaterialPermission, setUploadMaterialPermission] = useState<StudyMaterialDownloadPermission>('allow_download');
  const [uploadMaterialContent, setUploadMaterialContent] = useState('');
  const [materialActionNotice, setMaterialActionNotice] = useState<string | null>(null);

  const showMaterialNotice = (msg: string) => {
    setMaterialActionNotice(msg);
    setTimeout(() => {
      setMaterialActionNotice((current) => (current === msg ? null : current));
    }, 4000);
  };

  const handleUpdateMaterialPermission = (materialId: string, newPermission: StudyMaterialDownloadPermission) => {
    if (!activeClassroom?.id) return;
    const updated = studyMaterialService.updateMaterialPermission(activeClassroom.id, materialId, newPermission);
    setClassroomStudyMaterials(updated);
    if (selectedWhiteboardMaterial && selectedWhiteboardMaterial.id === materialId) {
      setSelectedWhiteboardMaterial({ ...selectedWhiteboardMaterial, downloadPermission: newPermission });
    }
    if (selectedDocumentMaterial && selectedDocumentMaterial.id === materialId) {
      setSelectedDocumentMaterial({ ...selectedDocumentMaterial, downloadPermission: newPermission });
    }
    const permLabel =
      newPermission === 'allow_download'
        ? t('teacher.material.permission.allowDownload')
        : newPermission === 'view_only'
        ? t('teacher.material.permission.viewOnly')
        : t('teacher.material.permission.downloadDisabled');
    showMaterialNotice(t('teacher.material.changePermissionSuccess', { perm: permLabel }));
  };

  const handleDownloadMaterialFile = (mat: ClassroomStudyMaterial) => {
    const isTeacher = viewMode === 'teacher' && !isStudentPreview;
    if (!isTeacher && mat.downloadPermission !== 'allow_download') {
      return;
    }
    showMaterialNotice(t('teacher.material.downloadStarted', { title: mat.title }));
    const fileText =
      mat.contentPreview ||
      `${mat.title}\nClass: ${activeClassroom?.title}\nType: ${mat.type}\nSize: ${mat.size}\nDate: ${new Date(mat.createdAt).toLocaleDateString()}`;
    const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mat.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadSubmitMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassroom?.id || !uploadMaterialTitle.trim()) return;
    studyMaterialService.addMaterial(activeClassroom.id, {
      title: uploadMaterialTitle.trim(),
      type: uploadMaterialType,
      size: uploadMaterialSize.trim() || '2.8 MB',
      downloadPermission: uploadMaterialPermission,
      contentPreview: uploadMaterialContent.trim() || undefined,
    });
    setClassroomStudyMaterials(studyMaterialService.getMaterials(activeClassroom.id));
    setIsUploadMaterialModalOpen(false);
    setUploadMaterialTitle('');
    setUploadMaterialContent('');
    setUploadMaterialPermission('allow_download');
    showMaterialNotice('New study material published with student permissions!');
  };

  const bottomNavItems: readonly NavItem[] = [
    {
      id: 'home',
      label: t('nav.home'),
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'premium',
      label: t('nav.premium'),
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: t('nav.profile'),
      icon: <User className="w-5 h-5" />,
    },
  ];

  const handleBottomNavChange = (id: string) => {
    if (id === 'home') {
      if (viewMode === 'teacher' && !isStudentPreview) {
        setCurrentScreen('teacher_home');
      } else {
        setCurrentScreen('student_home');
      }
    } else if (id === 'premium') {
      setCurrentScreen('premium');
    } else if (id === 'profile') {
      setCurrentScreen('profile');
    }
  };

  const getActiveBottomNavId = (): string => {
    if (currentScreen === 'teacher_home' || currentScreen === 'student_home') {
      return 'home';
    }
    if (currentScreen === 'premium') {
      return 'premium';
    }
    if (currentScreen === 'profile') {
      return 'profile';
    }
    return '';
  };

  // Join Classroom State
  const [classCodeInput, setClassCodeInput] = useState('');
  const [classCodeError, setClassCodeError] = useState<string | null>(null);
  const [classCodeNotice, setClassCodeNotice] = useState<string | null>(null);
  const [isPreviewLocallyEnrolled, setIsPreviewLocallyEnrolled] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isEnrollingClassroom, setIsEnrollingClassroom] = useState(false);
  const [previewClassroom, setPreviewClassroom] = useState<GlobalClassroom | null>(null);
  const [enrolledClassroom, setEnrolledClassroom] = useState<GlobalClassroom | null>(null);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [syncingClassroomId, setSyncingClassroomId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{
    classroomId: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Find a Teacher Progressive Flow State
  const [teacherStep, setTeacherStep] = useState<TeacherFlowStep>('categories');
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedLangLevel, setSelectedLangLevel] = useState<'basic' | 'adv'>('basic');
  const [selectedProgLevel, setSelectedProgLevel] = useState<'basic' | 'adv'>('basic');
  const [selectedSubTopic, setSelectedSubTopic] = useState<string>('');
  const [selectedUniForDrilldown, setSelectedUniForDrilldown] = useState<GlobalUniversity | null>(null);
  const [uniFilterQuery, setUniFilterQuery] = useState('');

  // Phase 09 Canonical Student Learning Discovery States
  const [curriculumSearchQuery, setCurriculumSearchQuery] = useState('');
  const [selectedCurriculumFaculty, setSelectedCurriculumFaculty] = useState<CurriculumFaculty | null>(null);
  const [selectedCurriculumSubject, setSelectedCurriculumSubject] = useState<CurriculumSubjectItem | null>(null);
  const [selectedCurriculumCourse, setSelectedCurriculumCourse] = useState<CurriculumCourse | null>(null);
  const [selectedCurriculumLevel, setSelectedCurriculumLevel] = useState<string>('Grades 6–8 (Middle School)');
  const [selectedCurriculumTopic, setSelectedCurriculumTopic] = useState<string>('');
  const [selectedLearningGoal, setSelectedLearningGoal] = useState<string>('Master Foundations & Core Concepts');
  const [selectedLanguageTrack, setSelectedLanguageTrack] = useState<TopLanguageItem | null>(null);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [isCourseOverviewOpen, setIsCourseOverviewOpen] = useState(false);
  const [resultsTeacherSearch, setResultsTeacherSearch] = useState('');
  const [resultsTeacherLetter, setResultsTeacherLetter] = useState('ALL');
  const [showAllTeachersInResults, setShowAllTeachersInResults] = useState(false);
  const [teacherSortBy, setTeacherSortBy] = useState<'rating' | 'reviews' | 'recommended' | 'name'>('recommended');

  // Phase 09 Canonical Teacher A-Z Expertise & Discovery States
  const [teacherAzSearch, setTeacherAzSearch] = useState('');
  const [teacherAzLetterFilter, setTeacherAzLetterFilter] = useState('ALL');
  const [selectedTeacherSpecializations, setSelectedTeacherSpecializations] = useState<string[]>([
    'Mathematics & Statistics',
    'Algebra & Linear Systems',
  ]);
  const [teacherTitleInput, setTeacherTitleInput] = useState('');
  const [selectedTeachingLevels, setSelectedTeachingLevels] = useState<string[]>([
    'Grades 6–8 (Middle School)',
    'Grades 9–12 (High School)',
  ]);
  const [selectedTeacherType, setSelectedTeacherType] = useState<string>('school');

  // Landing "See what's inside" Bottom Sheet State
  const [isInsideSheetOpen, setIsInsideSheetOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInsideSheetOpen) {
        setIsInsideSheetOpen(false);
      }
    };
    if (isInsideSheetOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isInsideSheetOpen]);

  // Teacher-Only Access Guard for Teacher AI Studio & Assessments (Phase 12 & 13)
  useEffect(() => {
    if (currentScreen === 'teacher_ai' || currentScreen === 'teacher_assessments') {
      if (!hasTeacherAccess && viewMode !== 'teacher') {
        setCurrentScreen('student_home');
      }
    }
  }, [currentScreen, hasTeacherAccess, viewMode]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const currentRole = profile.role || 'student';

  // Section 1 & 3: Approved Primary Role Options (Student / Teacher Only)
  const roleOptions: Array<{
    id: UserRole;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'student',
      title: t('role.student.title'),
      desc: t('role.student.desc'),
      icon: <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.9]" />,
    },
    {
      id: 'teacher',
      title: t('role.teacher.title'),
      desc: t('role.teacher.desc'),
      icon: <BookOpenCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.9]" />,
    },
  ];

  const handleRoleSelect = (roleId: UserRole) => {
    setRole(roleId);
  };

  const handleRoleContinue = () => {
    if (currentRole === 'student') {
      // Guide student directly into progressive discovery: "What would you like me to help you learn?"
      setCurriculumSearchQuery('');
      setSelectedCurriculumFaculty(null);
      setSelectedCurriculumSubject(null);
      setSelectedCurriculumTopic('');
      setSelectedTeacherDetail(null);
      setTeacherStep('categories');
      setCurrentScreen('find_teacher');
    } else if (currentRole === 'lecturer' || currentRole === 'teacher') {
      if (teacherProfile.name && teacherProfile.name !== 'Professor / Instructor') {
        setCurrentScreen('teacher_home');
      } else {
        setTeacherSetupStep(1);
        setCurrentScreen('teacher_setup');
      }
    } else {
      setIsNextStepNoticeOpen(true);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      updatePersonalInfo({ email: emailInput });
    }
    setIsEmailModalOpen(false);
    setCurrentScreen('roles');
  };

  // Step 1: Name
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updatePersonalInfo({ fullName: fullName.trim() });
    setSetupStep(2);
  };

  // Step 2: Global University
  const handleStep2Continue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUni = universityName.trim() || uniSearch.trim() || GLOBAL_UNIVERSITIES[0].name;
    updateUniversityInfo({ universityName: finalUni });
    setUniversityName(finalUni);
    setSetupStep(3);
  };

  // Step 3: Area of Study
  const handleStep3Continue = (e: React.FormEvent) => {
    e.preventDefault();
    updateUniversityInfo({
      facultyOrCollege: selectedArea,
      department: department.trim() || selectedArea,
    });
    setSetupStep(4);
  };

  // Step 4: Year of Study
  const handleStep4Continue = () => {
    const yr = parseInt(yearOfStudy, 10) || 1;
    updateAcademicProfile({ currentYearOfStudy: yr });
    setCurrentScreen('student_home');
  };

  // Clear, Precise Back Navigation System
  const handleHeaderBack = () => {
    if (currentScreen === 'teacher_classroom_detail') {
      setCurrentScreen('teacher_home');
    } else if (currentScreen === 'teacher_home') {
      setCurrentScreen('roles');
    } else if (currentScreen === 'teacher_setup') {
      if (teacherSetupStep > 1) {
        setTeacherSetupStep((prev) => prev - 1);
      } else {
        setCurrentScreen('roles');
      }
    } else if (currentScreen === 'find_teacher') {
      if (teacherStep === 'results') {
        setTeacherStep('select_goal');
      } else if (teacherStep === 'select_goal') {
        if (selectedLanguageTrack) {
          setTeacherStep('language_track');
        } else {
          setTeacherStep('select_topic');
        }
      } else if (teacherStep === 'select_topic') {
        if (selectedCurriculumCourse) {
          setTeacherStep('select_course');
        } else if (selectedCurriculumSubject?.courses && selectedCurriculumSubject.courses.length > 0) {
          setTeacherStep('select_course');
        } else if (selectedGrade) {
          setTeacherStep('select_subject');
        } else {
          setTeacherStep('select_level');
        }
      } else if (teacherStep === 'select_course') {
        if (selectedGrade) {
          setTeacherStep('select_subject');
        } else {
          setTeacherStep('select_level');
        }
      } else if (teacherStep === 'select_level') {
        setTeacherStep('select_subject');
      } else if (teacherStep === 'select_subject') {
        if (selectedGrade && selectedCurriculumFaculty?.id === 'school') {
          setTeacherStep('school_grade');
        } else {
          setTeacherStep('categories');
        }
      } else if (teacherStep === 'school_grade' || teacherStep === 'language_track') {
        setTeacherStep('categories');
      } else if (teacherStep !== 'categories') {
        setTeacherStep('categories');
      } else {
        if (profile.onboardingStatus === 'completed') {
          setCurrentScreen('student_home');
        } else {
          setCurrentScreen('roles');
        }
      }
    } else if (currentScreen === 'teacher_ai' || currentScreen === 'teacher_assessments') {
      setCurrentScreen('teacher_home');
    } else if (currentScreen === 'profile' || currentScreen === 'premium') {
      if (viewMode === 'teacher' && !isStudentPreview) {
        setCurrentScreen('teacher_home');
      } else {
        setCurrentScreen('student_home');
      }
    } else if (currentScreen === 'homework' || currentScreen === 'join_classroom' || currentScreen === 'my_classrooms') {
      setCurrentScreen('student_home');
    } else if (currentScreen === 'student_home') {
      if (isStudentPreview) {
        switchViewMode('teacher');
        setCurrentScreen('teacher_home');
      } else {
        setCurrentScreen('student_setup');
        setSetupStep(4);
      }
    } else if (currentScreen === 'student_setup') {
      if (setupStep > 1) {
        setSetupStep((prev) => prev - 1);
      } else {
        setCurrentScreen('roles');
      }
    } else if (currentScreen === 'roles') {
      setCurrentScreen('landing');
    }
  };

  const handleLogout = async () => {
    setIsSettingsDrawerOpen(false);
    await signOutUser();
    resetProfile();
    setCurrentScreen('landing');
  };

  // Teacher Experience & Role Switch Handlers (Step 04)
  const handleSwitchToStudentView = () => {
    switchViewMode('student');
    setCurrentScreen('student_home');
    setIsSettingsDrawerOpen(false);
  };

  const handleReturnToTeacherDashboard = () => {
    switchViewMode('teacher');
    setCurrentScreen('teacher_home');
    setIsSettingsDrawerOpen(false);
  };

  const handleBecomeTeacher = () => {
    setRole('lecturer');
    setTeacherSetupStep(1);
    setCurrentScreen('teacher_setup');
    setIsSettingsDrawerOpen(false);
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 2500);
  };

  // Teacher Setup Step Handlers (Phase 09 A-Z Expertise & Discovery)
  const handleTeacherStep1Continue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!teacherNameInput.trim()) return;
    setTeacherSetupStep(2);
  };

  const handleTeacherStep2Continue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTeacherSetupStep(3);
  };

  const handleTeacherSetupComplete = () => {
    const finalName = teacherNameInput.trim() || 'Educator';
    const primarySubject = selectedTeacherSpecializations[0] || 'Mathematics';
    const isInst = selectedTeacherType === 'school' || selectedTeacherType === 'university';

    updateTeacherProfile({
      name: finalName,
      subjects: selectedTeacherSpecializations.length > 0 ? selectedTeacherSpecializations : ['Mathematics'],
      teachingLevels: selectedTeachingLevels.length > 0 ? selectedTeachingLevels : ['Grades 6–8 (Middle School)'],
      teacherType: isInst ? 'institutional' : 'independent',
      tutoringScope: teacherTitleInput.trim() || (isInst ? 'Institutional Classroom' : 'Independent Tutoring & Mentorship'),
      isVerified: true,
    });
    setTeacherSubjectInput(primarySubject);

    setCurrentScreen('teacher_home');
  };

  const handleTeacherStep3Continue = (subj: string) => {
    if (!selectedTeacherSpecializations.includes(subj)) {
      setSelectedTeacherSpecializations((prev) => [...prev, subj]);
    }
    handleTeacherSetupComplete();
  };

  const handleCreateClassroomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const cleanSubj = newClassSubject.trim() || 'General';
    const prefix = cleanSubj.slice(0, 3).toUpperCase();
    const randNum = Math.floor(100 + Math.random() * 899);
    const code = newClassCustomCode.trim() ? newClassCustomCode.trim().toUpperCase() : `${prefix}-${randNum}`;

    try {
      const created = await createTeacherClassroom({
        code,
        title: newClassName.trim(),
        instructorName: teacherProfile.name || userAccount?.fullName || 'Instructor',
        institution: teacherProfile.institution || universityName || 'Global University',
        subject: cleanSubj,
        category: 'university',
        enrolledStudents: 0,
      });

      setIsCreateClassModalOpen(false);
      setNewClassName('');
      setNewClassCustomCode('');
      setActiveClassroomId(created.id);
    } catch (err) {
      console.error('Error creating classroom:', err);
    }
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentTitle.trim() || !activeClassroom) return;
    setIsCreateAssignmentModalOpen(false);
    setNewAssignmentTitle('');
    setNewAssignmentDesc('');
  };

  const handlePostAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim() || !activeClassroom) return;
    postAnnouncement(activeClassroom.id, announcementText.trim());
    setAnnouncementText('');
  };

  // Join Classroom Verification & Preview Execution
  const handleVerifyClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = classCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsVerifyingCode(true);
    setClassCodeError(null);
    setClassCodeNotice(null);
    setIsPreviewLocallyEnrolled(false);
    setPreviewClassroom(null);
    setEnrolledClassroom(null);
    setEnrollSuccessMessage(null);

    try {
      let foundClass: GlobalClassroom | null = null;

      // 1. First, check if the current user has created this classroom locally in state
      const localMatch = teacherClassrooms.find((c) => c.code.trim().toUpperCase() === cleanCode);
      if (localMatch) {
        foundClass = localMatch;
      }

      // 2. Query the real canonical Firestore "/classrooms" collection
      if (!foundClass) {
        try {
          const classroomsRef = collection(db, 'classrooms');
          const codeQuery = query(classroomsRef, where('code', '==', cleanCode));
          const snapshot = await getDocs(codeQuery);

          if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            foundClass = {
              id: docData.id || snapshot.docs[0].id,
              code: docData.code || cleanCode,
              title: docData.title || 'Classroom',
              subject: docData.subject || 'General Education',
              instructorName: docData.instructorName || 'Instructor',
              institution: docData.institution || 'SmartEducate Global',
              category: docData.category || 'university',
              enrolledStudents: typeof docData.enrolledStudents === 'number' ? docData.enrolledStudents : 0,
              status: docData.status || 'active',
            };
          }
        } catch (firestoreErr) {
          console.warn('Firestore query error searching classroom code:', firestoreErr);
          // If unauthenticated or network error, let error be handled below if not found
        }
      }

      // 3. Fallback to global catalog for unauthenticated or sample classrooms
      if (!foundClass) {
        const catalogMatch = GLOBAL_CLASSROOMS.find((c) => c.code.trim().toUpperCase() === cleanCode);
        if (catalogMatch) {
          foundClass = catalogMatch;
        }
      }

      // Check results
      if (!foundClass) {
        setClassCodeError(t('classroom.invalidCode'));
        setPreviewClassroom(null);
        setIsPreviewLocallyEnrolled(false);
        setClassCodeNotice(null);
      } else if (foundClass.status && foundClass.status !== 'active') {
        setClassCodeError(t('classroom.inactiveCode'));
        setPreviewClassroom(null);
        setIsPreviewLocallyEnrolled(false);
        setClassCodeNotice(null);
      } else if (enrolledClassrooms.some((c) => c.code.trim().toUpperCase() === cleanCode)) {
        setIsPreviewLocallyEnrolled(true);
        setClassCodeNotice(
          'This classroom is already saved in your local list. Click "Sync / Repair Cloud Enrollment" below to record or verify your enrollment in Firestore.'
        );
        setClassCodeError(null);
        setPreviewClassroom(foundClass);
      } else {
        setIsPreviewLocallyEnrolled(false);
        setClassCodeNotice(null);
        setClassCodeError(null);
        setPreviewClassroom(foundClass);
      }
    } catch (err) {
      console.error('Error verifying classroom code:', err);
      setClassCodeError(t('classroom.lookupFailed'));
      setPreviewClassroom(null);
      setIsPreviewLocallyEnrolled(false);
      setClassCodeNotice(null);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleRepairEnrollment = async (targetClass: GlobalClassroom) => {
    const classKey = targetClass.id || targetClass.code;
    setSyncingClassroomId(classKey);
    setSyncFeedback(null);
    setClassCodeError(null);
    try {
      const res = await syncOrRepairEnrollment(targetClass);
      if (res.success) {
        setSyncFeedback({
          classroomId: classKey,
          type: 'success',
          message: res.message,
        });
        if (previewClassroom?.code.trim().toUpperCase() === targetClass.code.trim().toUpperCase()) {
          setEnrollSuccessMessage(res.message);
          setEnrolledClassroom(res.classroom || targetClass);
          setPreviewClassroom(null);
          setClassCodeInput('');
          setIsPreviewLocallyEnrolled(false);
          setClassCodeNotice(null);
        }
      } else {
        setSyncFeedback({
          classroomId: classKey,
          type: 'error',
          message: res.message,
        });
        if (previewClassroom?.code.trim().toUpperCase() === targetClass.code.trim().toUpperCase()) {
          setClassCodeError(res.message);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to sync enrollment with Firestore.';
      setSyncFeedback({
        classroomId: classKey,
        type: 'error',
        message: errMsg,
      });
      if (previewClassroom?.code.trim().toUpperCase() === targetClass.code.trim().toUpperCase()) {
        setClassCodeError(errMsg);
      }
    } finally {
      setSyncingClassroomId(null);
    }
  };

  const handleConfirmJoin = async () => {
    if (!previewClassroom) return;
    if (!auth.currentUser) {
      setClassCodeError('Please sign in to your student account to enroll in this classroom.');
      return;
    }
    setIsEnrollingClassroom(true);
    setClassCodeError(null);
    try {
      const res = await syncOrRepairEnrollment(previewClassroom);
      if (res.success) {
        setEnrollSuccessMessage(res.message);
        setEnrolledClassroom(res.classroom || previewClassroom);
        setPreviewClassroom(null);
        setClassCodeInput('');
        setIsPreviewLocallyEnrolled(false);
        setClassCodeNotice(null);
      } else {
        setClassCodeError(res.message);
      }
    } catch (err: any) {
      console.error('Failed to enroll in classroom:', err);
      if (err?.message === 'UNAUTHENTICATED') {
        setClassCodeError('Please sign in to your student account to enroll in this classroom.');
      } else {
        setClassCodeError(err?.message || 'Failed to complete enrollment. Please check your network connection and try again.');
      }
    } finally {
      setIsEnrollingClassroom(false);
    }
  };

  // Teacher Discovery Handlers
  const handleSelectCategory = (cat: LearningCategory) => {
    setSelectedCategory(cat);
    if (cat === 'school') setTeacherStep('school_grade');
    else if (cat === 'language') setTeacherStep('language_track');
    else if (cat === 'programming') setTeacherStep('programming_track');
    else if (cat === 'university') setTeacherStep('university_search');
    else if (cat === 'skills') setTeacherStep('skills_track');
    else if (cat === 'vocational') setTeacherStep('vocational_track');
    else if (cat === 'medical') setTeacherStep('medical_track');
  };

  const handleSelectVocationalTopic = (topic: string) => {
    setSelectedSubTopic(topic);
    setTeacherStep('results');
  };

  const handleSelectMedicalTopic = (topic: string) => {
    setSelectedSubTopic(topic);
    setTeacherStep('results');
  };

  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
    setSelectedSubTopic(`Grade ${grade}`);
    setTeacherStep('results');
  };

  const handleSelectLangChoice = (lang: string) => {
    setSelectedSubTopic(`${lang} (${selectedLangLevel === 'basic' ? 'Basic' : 'Advanced'})`);
    setTeacherStep('results');
  };

  const handleSelectProgTopic = (topic: string) => {
    setSelectedSubTopic(topic);
    setTeacherStep('results');
  };

  const handleSelectSkillsTopic = (topic: string) => {
    setSelectedSubTopic(topic);
    setTeacherStep('results');
  };

  const handleSelectUniversity = (uni: GlobalUniversity) => {
    setSelectedUniForDrilldown(uni);
    setSelectedSubTopic(uni.name);
    setTeacherStep('university_faculty');
  };

  const handleSelectFacultyDrilldown = (faculty: string) => {
    if (selectedUniForDrilldown) {
      setSelectedSubTopic(`${selectedUniForDrilldown.name} · ${faculty}`);
    }
    setTeacherStep('results');
  };

  // Filtered Global Universities for Onboarding
  const filteredUniversities = GLOBAL_UNIVERSITIES.filter((u) =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.country.toLowerCase().includes(uniSearch.toLowerCase())
  );

  // Filtered Teachers for the current discovery selection with A–Z and Query Filtering
  const baseTeachers = showAllTeachersInResults
    ? GLOBAL_TEACHERS
    : GLOBAL_TEACHERS.filter((t) => {
        if (selectedCurriculumSubject) {
          const subjMatch =
            t.subject.toLowerCase().includes(selectedCurriculumSubject.name.toLowerCase()) ||
            selectedCurriculumSubject.name.toLowerCase().includes(t.subject.toLowerCase()) ||
            (selectedCurriculumTopic && t.bio.toLowerCase().includes(selectedCurriculumTopic.toLowerCase())) ||
            (selectedCurriculumTopic && t.subject.toLowerCase().includes(selectedCurriculumTopic.toLowerCase()));
          if (subjMatch) return true;
        }
        if (selectedCurriculumFaculty) {
          const facMatch = selectedCurriculumFaculty.subjects.some((s) =>
            t.subject.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(t.subject.toLowerCase()) ||
            t.bio.toLowerCase().includes(s.name.toLowerCase())
          );
          if (facMatch) return true;
        }
        if (selectedCategory) {
          if (t.category === selectedCategory) return true;
        }
        if (!selectedCategory && !selectedCurriculumSubject && !selectedCurriculumFaculty) {
          return true;
        }
        return false;
      });

  const availableTeachersPool = baseTeachers.length > 0 ? baseTeachers : GLOBAL_TEACHERS;

  const filteredTeachers = availableTeachersPool.filter((t) => {
    const cleanQuery = resultsTeacherSearch.trim().toLowerCase();
    const matchesQuery =
      !cleanQuery ||
      t.name.toLowerCase().includes(cleanQuery) ||
      t.title.toLowerCase().includes(cleanQuery) ||
      t.subject.toLowerCase().includes(cleanQuery) ||
      t.level.toLowerCase().includes(cleanQuery) ||
      t.country.toLowerCase().includes(cleanQuery) ||
      t.language.toLowerCase().includes(cleanQuery) ||
      t.bio.toLowerCase().includes(cleanQuery);

    const cleanName = t.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Capt\.|Eng\.)\s*/, '').trim();
    const matchesLetter =
      resultsTeacherLetter === 'ALL' ||
      cleanName.toUpperCase().startsWith(resultsTeacherLetter) ||
      t.name.toUpperCase().startsWith(resultsTeacherLetter);

    return matchesQuery && matchesLetter;
  });

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      if (teacherSortBy === 'rating') {
        // Highest rating first (5.0 -> 1.0). Secondary tie-breaker: reviewCount descending
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      if (teacherSortBy === 'reviews') {
        // Most reviews first (168 -> 0). Secondary tie-breaker: rating descending
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return b.rating - a.rating;
      }
      if (teacherSortBy === 'name') {
        const cleanA = a.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Capt\.|Eng\.)\s*/, '').trim();
        const cleanB = b.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Capt\.|Eng\.)\s*/, '').trim();
        return cleanA.localeCompare(cleanB);
      }
      // 'recommended' / default: preserve curriculum relevance match order
      return 0;
    });
  }, [filteredTeachers, teacherSortBy]);

  const getRoleDisplayName = (roleId: UserRole): string => {
    switch (roleId) {
      case 'student':
        return t('role.student.title');
      case 'lecturer':
      case 'teacher':
        return t('role.lecturer.title');
      case 'university':
        return t('role.university.title');
      case 'admin':
        return t('role.admin.title');
      default:
        return t('role.student.title');
    }
  };

  const getVerificationBadge = (status: UniversityVerificationStatus) => {
    switch (status) {
      case 'accredited':
        return { text: t('common.accredited'), bg: 'bg-emerald-100 text-emerald-800' };
      case 'verified':
        return { text: t('common.verified'), bg: 'bg-blue-100 text-blue-800' };
      case 'registered':
        return { text: t('common.registered'), bg: 'bg-purple-100 text-[#7C3AED]' };
      case 'not_verified':
      default:
        return { text: t('common.notVerified'), bg: 'bg-slate-100 text-slate-600' };
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6FD] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shadow-md animate-pulse mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-[#7C3AED] dark:text-purple-400">
          <div className="w-4 h-4 border-2 border-[#7C3AED] dark:border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wide">Initializing SmartEducate...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6FD] dark:bg-[#0B0F19] text-[#1E1B4B] dark:text-slate-100 selection:bg-[#EDE9FE] selection:text-[#7C3AED] dark:selection:bg-purple-900/40 dark:selection:text-purple-200">
      {/* Teacher Preview Banner (Active when Teacher is previewing Student interface) */}
      {isStudentPreview && (
        <div className="bg-[#7C3AED] text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold sticky top-0 z-50 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 shrink-0 text-purple-200" />
            <span className="font-bold">{t('teacher.previewModeBanner')}</span>
            <span className="hidden sm:inline text-purple-200 font-normal">
              — {t('teacher.previewNotice')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReturnToTeacherDashboard}
            className="px-3 py-1 bg-white dark:bg-slate-800 text-[#7C3AED] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700 font-bold rounded-lg text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>{t('teacher.exitPreview')}</span>
          </button>
        </div>
      )}

      {/* Top App Header (Hidden on AI Tutor, Teacher Home, and Teacher AI Studio which provide specialized headers) */}
      {currentScreen !== 'homework' && currentScreen !== 'teacher_home' && currentScreen !== 'teacher_ai' && (
        <Header
          showBack={currentScreen !== 'landing' && currentScreen !== 'student_home'}
          showMenu={currentScreen === 'student_home'}
          onMenu={() => setIsSettingsDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
          unreadNotificationsCount={unreadNotifCount}
          onBack={handleHeaderBack}
          subtitle={
            currentScreen === 'profile'
              ? t('profile.title')
              : currentScreen === 'premium'
              ? t('nav.premium')
              : undefined
          }
          rightAction={
            currentScreen === 'landing' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                }}
                className="h-9 px-3.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Sign In
              </button>
            ) : currentScreen === 'student_home' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isStudentPreview ? (
                  <button
                    type="button"
                    onClick={handleReturnToTeacherDashboard}
                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title={t('teacher.exitPreview')}
                    aria-label={t('teacher.exitPreview')}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('teacher.exitPreview')}</span>
                  </button>
                ) : hasTeacherAccess ? (
                  <button
                    type="button"
                    onClick={() => {
                      switchViewMode('teacher');
                      setCurrentScreen('teacher_home');
                    }}
                    className="h-9 px-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title={t('teacher.viewTeacherDashboard')}
                    aria-label={t('teacher.viewTeacherDashboard')}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('teacher.viewTeacherDashboard')}</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setCurrentScreen('roles')}
                  className="w-9 h-9 rounded-xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title={t('teacher.switchRole')}
                  aria-label={t('teacher.switchRole')}
                >
                  <ArrowLeftRight className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentScreen === 'teacher_classroom_detail' ? (
              <button
                type="button"
                onClick={handleSwitchToStudentView}
                className="h-9 px-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t('teacher.viewAsStudent')}
                aria-label={t('teacher.viewAsStudent')}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden xs:inline">{t('teacher.viewAsStudent')}</span>
              </button>
            ) : hasTeacherAccess && isStudentPreview ? (
              <button
                type="button"
                onClick={handleReturnToTeacherDashboard}
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t('teacher.exitPreview')}
                aria-label={t('teacher.exitPreview')}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('teacher.exitPreview')}</span>
              </button>
            ) : undefined
          }
        />
      )}

      <main className={`flex-1 flex flex-col ${currentScreen === 'homework' ? 'min-h-0' : 'justify-center'}`}>
        {/* ============================================================== */}
        {/* SCREEN 1: SMARTEDUCATE LANDING / WELCOME (APPROVED - UNCHANGED) */}
        {/* ============================================================== */}
        {currentScreen === 'landing' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-between min-h-[calc(100vh-140px)]">
            <div className="text-start space-y-4 sm:space-y-6 pt-4 sm:pt-8">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 shadow-2xs">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-bold tracking-wide">SmartEducate</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100 leading-[1.15] text-balance whitespace-pre-line">
                {t('landing.headline')}
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed max-w-md">
                {t('landing.subtitle')}
              </p>
            </div>

            <div className="space-y-4 pt-10 sm:pt-14 pb-2">
              <div className="w-full rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-[0_4px_20px_rgba(20,10,50,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3.5 text-center">
                {/* Email Sign In CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
                >
                  <Mail className="w-5 h-5 text-white" />
                  <span>Sign In with Email</span>
                </button>

                {/* Create Free Account CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full h-12 rounded-2xl border-2 border-[#7C3AED] dark:border-purple-500 text-[#7C3AED] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 active:bg-purple-100 dark:active:bg-purple-900/60 text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Create Account (Student or Teacher)</span>
                </button>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <GoogleIcon className="w-4 h-4" />
                  </div>
                  <span>{t('landing.continueGoogle')}</span>
                </button>

                <div className="text-center pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <span>{t('landing.alreadyAccount')} </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setIsAuthModalOpen(true);
                    }}
                    className="font-bold text-[#7C3AED] dark:text-purple-400 hover:text-[#6D28D9] dark:hover:text-purple-300 underline decoration-[#DDD6FE] dark:decoration-purple-900 underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 rounded-sm"
                  >
                    {t('landing.useEmail')}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-sm">
                <button
                  type="button"
                  onClick={() => setIsInsideSheetOpen(true)}
                  className="font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors py-2 px-3 rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
                >
                  {t('landing.preview')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: APPROVED ROLE SELECTION ("I am...") (APPROVED)      */}
        {/* ============================================================== */}
        {currentScreen === 'roles' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
            <div className="text-start space-y-1 px-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                {t('roleSelect.heading')}
              </h1>
              <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                {t('roleSelect.subtitle')}
              </p>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              {roleOptions.map((role) => (
                <SelectionCard
                  key={role.id}
                  title={role.title}
                  description={role.desc}
                  icon={role.icon}
                  isSelected={currentRole === role.id}
                  onSelect={() => handleRoleSelect(role.id)}
                />
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleRoleContinue}
                className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-lg sm:text-xl font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
              >
                <span>{t('common.continue')}</span>
                <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: PROGRESSIVE STUDENT SETUP (GLOBAL EDUCATION)        */}
        {/* ============================================================== */}
        {currentScreen === 'student_setup' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
            {/* Minimal Educate-Style Progress Indicator */}
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                <span>{t('setup.progress', { current: String(setupStep), total: '4' })}</span>
                <span className="text-[#7C3AED] dark:text-purple-400">{Math.round((setupStep / 4) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
                  style={{ width: `${(setupStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Who are you? */}
            {setupStep === 1 && (
              <form onSubmit={handleStep1Continue} className="space-y-6 text-start">
                <div className="space-y-1 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    {t('setup.step1.title')}
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    {t('setup.step1.subtitle')}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
                  <Input
                    label={t('setup.step1.label')}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('setup.step1.placeholder')}
                    leftIcon={<User className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                    rightIcon={
                      fullName.trim() ? (
                        <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                      ) : undefined
                    }
                    autoFocus
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!fullName.trim()}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg sm:text-xl font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Which university do you attend? (Global Universities) */}
            {setupStep === 2 && (
              <div className="space-y-6 text-start">
                <div className="space-y-1 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    {t('setup.step2.title')}
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    {t('setup.step2.subtitle')}
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={uniSearch}
                    onChange={(e) => {
                      setUniSearch(e.target.value);
                      if (e.target.value) setUniversityName(e.target.value);
                    }}
                    placeholder={t('setup.step2.searchPlaceholder')}
                    className="w-full h-13 sm:h-14 rounded-2xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 ps-11 pe-4 text-base text-[#1E1B4B] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-3 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-2xs"
                  />
                </div>

                <div className="rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-2 max-h-72 overflow-y-auto">
                  {filteredUniversities.map((uni) => {
                    const isSelected = universityName === uni.name;
                    return (
                      <div
                        key={uni.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setUniversityName(uni.name);
                          setUniSearch(uni.name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            setUniversityName(uni.name);
                            setUniSearch(uni.name);
                          }
                        }}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer select-none text-start ${
                          isSelected
                            ? 'bg-[#FAF8FE] dark:bg-purple-950/40 border-2 border-[#7C3AED] dark:border-purple-500 text-[#7C3AED] dark:text-purple-300 font-bold shadow-2xs'
                            : 'bg-white dark:bg-slate-900 hover:bg-[#FAF8FE] dark:hover:bg-slate-800 border border-transparent text-[#1E1B4B] dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Building2
                            className={`w-5 h-5 shrink-0 ${
                              isSelected ? 'text-[#7C3AED] dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="text-base truncate block">{uni.name}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {uni.city}, {uni.country}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white'
                              : 'border-2 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}

                  {filteredUniversities.length === 0 && uniSearch && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setUniversityName(uniSearch)}
                      className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 font-semibold text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>Use: "{uniSearch}"</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleStep2Continue()}
                    disabled={!universityName && !uniSearch}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg sm:text-xl font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: What are you studying? */}
            {setupStep === 3 && (
              <form onSubmit={handleStep3Continue} className="space-y-6 text-start">
                <div className="space-y-1 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    {t('setup.step3.title')}
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    {t('setup.step3.subtitle')}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
                    {t('setup.step3.facultyLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STUDY_AREAS.map((area) => {
                      const isSelected = selectedArea === area.label;
                      return (
                        <div
                          key={area.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => {
                            setSelectedArea(area.label);
                            setDepartment(area.defaultDept);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              setSelectedArea(area.label);
                              setDepartment(area.defaultDept);
                            }
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none text-start flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#FAF8FE] dark:bg-purple-950/40 border-2 border-[#7C3AED] dark:border-purple-500 shadow-2xs font-bold text-[#7C3AED] dark:text-purple-300'
                              : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:border-[#DDD6FE] dark:hover:border-purple-800 text-[#1E1B4B] dark:text-slate-200'
                          }`}
                        >
                          <span className="text-sm sm:text-base leading-snug">{area.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#7C3AED] text-white'
                                : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3">
                  <Input
                    label={t('setup.step3.departmentLabel')}
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={t('setup.step3.departmentPlaceholder')}
                    leftIcon={<BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-lg sm:text-xl font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: What year are you in? */}
            {setupStep === 4 && (
              <div className="space-y-6 text-start">
                <div className="space-y-1 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    {t('setup.step4.title')}
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    {t('setup.step4.subtitle')}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: '1', title: t('setup.year1'), desc: 'First academic year' },
                    { id: '2', title: t('setup.year2'), desc: 'Second academic year' },
                    { id: '3', title: t('setup.year3'), desc: 'Third academic year' },
                    { id: '4', title: t('setup.year4'), desc: 'Fourth academic year' },
                    { id: '5', title: t('setup.year5'), desc: 'Fifth year / Postgraduate' },
                  ].map((yr) => {
                    const isSelected = yearOfStudy === yr.id;
                    return (
                      <div
                        key={yr.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setYearOfStudy(yr.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') setYearOfStudy(yr.id);
                        }}
                        className={`w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer select-none text-start flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#FAF8FE] dark:bg-purple-950/40 border-2 border-[#7C3AED] dark:border-purple-500 shadow-[0_4px_16px_rgba(124,58,237,0.08)]'
                            : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:border-[#DDD6FE] dark:hover:border-purple-800 shadow-[0_2px_8px_rgba(20,10,50,0.02)]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg ${
                              isSelected
                                ? 'bg-[#EDE9FE] dark:bg-purple-900/50 text-[#7C3AED] dark:text-purple-300'
                                : 'bg-[#F5F2FA] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {yr.id}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100">{yr.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{yr.desc}</p>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white shadow-xs'
                              : 'border-2 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStep4Continue}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-lg sm:text-xl font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 4: STUDENT HOME (EDUCATE-STYLE STUDENT DASHBOARD)       */}
        {/* ============================================================== */}
        {currentScreen === 'student_home' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6 text-start pb-28 animate-fadeIn">
            {/* B2. Compact Friendly Welcome Area */}
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                  {t('home.greeting', { name: fullName ? fullName.split(' ')[0] : 'Nimco' })} 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {universityName || 'Somali National University'} · {selectedArea || 'Business & Economics'} · Year {yearOfStudy || 1}
                </p>
              </div>

              {hasTeacherAccess && !isStudentPreview && (
                <button
                  type="button"
                  onClick={() => {
                    switchViewMode('teacher');
                    setCurrentScreen('teacher_home');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                  title={t('teacher.viewTeacherDashboard')}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden xs:inline">Teacher</span>
                </button>
              )}
            </div>

            {/* Floating Toast Notification for Newly Published Test or Quiz */}
            {showAssessmentToast && publishedAssessmentAlert && (
              <div
                role="status"
                aria-live="polite"
                className="fixed top-5 end-4 sm:end-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-2xl shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-start">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {publishedAssessmentAlert.type === 'quiz' ? 'New Quiz Published' : 'New Test Published'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAssessmentToast(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Close notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                    {publishedAssessmentAlert.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {publishedAssessmentAlert.classroomName || publishedAssessmentAlert.subject}
                    {publishedAssessmentAlert.dueDate ? ` · Due ${publishedAssessmentAlert.dueDate}` : ''}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenPublishedAssessment(publishedAssessmentAlert.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      {publishedAssessmentAlert.type === 'quiz' ? 'Start Quiz' : 'View Test'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssessmentToast(false)}
                      className="px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Small Alert Banner in Student Dashboard for Published Test or Quiz */}
            {publishedAssessmentAlert && (
              <AssessmentAlertBanner
                alert={publishedAssessmentAlert}
                onDismiss={handleDismissAssessmentAlert}
                onOpen={handleOpenPublishedAssessment}
              />
            )}

            {/* B3. Primary Student Action Grid (3x3 Educate Style) */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* ROW 1 */}
                {/* 1. Live Class */}
                <button
                  type="button"
                  onClick={() => {
                    if (enrolledClassrooms.length > 0) {
                      setCurrentScreen('my_classrooms');
                    } else {
                      setCurrentScreen('join_classroom');
                    }
                  }}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-rose-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-rose-600 transition-colors">
                    {t('student.action.liveClass')}
                  </span>
                </button>

                {/* 2. Recording */}
                <button
                  type="button"
                  onClick={() => setIsRecordingModalOpen(true)}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                    {t('student.action.recording')}
                  </span>
                </button>

                {/* 3. Study Material */}
                <button
                  type="button"
                  onClick={() => setIsStudyMaterialModalOpen(true)}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    {t('student.action.studyMaterial')}
                  </span>
                </button>

                {/* ROW 2 */}
                {/* 4. Test */}
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-amber-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                    {t('student.action.test')}
                  </span>
                </button>

                {/* 5. Chat */}
                <button
                  type="button"
                  onClick={handleStudentOpenChat}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-sky-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs relative"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs relative">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    {studentUnreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                        {studentUnreadChatCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-sky-600 transition-colors">
                    {t('student.action.chat')}
                  </span>
                </button>

                {/* 6. Homework */}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('homework')}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-[#7C3AED] hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-[#7C3AED] transition-colors">
                    {t('student.action.homework')}
                  </span>
                </button>

                {/* ROW 3 */}
                {/* 7. Ask Doubt */}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('homework')}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-fuchsia-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-fuchsia-600 transition-colors">
                    {t('student.action.askDoubt')}
                  </span>
                </button>

                {/* 8. Help */}
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(true)}
                  className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-teal-300 hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-200 group-hover:text-teal-600 transition-colors">
                    {t('student.action.help')}
                  </span>
                </button>

                {/* 9. AI Tutor */}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('homework')}
                  className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50/70 to-purple-100/50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-[#7C3AED] hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-[#7C3AED] dark:text-purple-300">
                    {t('student.action.aiTutor')}
                  </span>
                </button>
              </div>
            </div>

            {/* Student Academic Progress & Test Results Chart (Recharts) */}
            <StudentProgressChart
              onOpenTestModal={() => setIsTestModalOpen(true)}
            />

            {/* B5. Join Classroom & B6. Find a Teacher (Educate Style Compact Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Join Classroom */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCurrentScreen('join_classroom')}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors truncate">
                      {t('home.action.classroom.title')}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {t('home.action.classroom.desc')}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              {/* Find a Teacher */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setTeacherStep('categories');
                  setCurrentScreen('find_teacher');
                }}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 group-hover:text-[#7C3AED] dark:group-hover:text-purple-400 transition-colors truncate">
                      {t('home.action.teacher.title')}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {t('home.action.teacher.desc')}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* B7. My Classrooms Access Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('classroom.myClassrooms')}
                </span>
                <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 cursor-pointer" onClick={() => setCurrentScreen('my_classrooms')}>
                  View all ({enrolledClassrooms.length})
                </span>
              </div>

              {enrolledClassrooms.length > 0 ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentScreen('my_classrooms')}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <BookOpenCheck className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                          {enrolledClassrooms[0]?.title}
                        </h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 shrink-0">
                          {enrolledClassrooms[0]?.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {enrolledClassrooms[0]?.instructorName} · {enrolledClassrooms[0]?.subject}
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>No classrooms yet. Join a classroom to see your courses.</span>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('join_classroom')}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-bold text-xs transition-colors shrink-0"
                  >
                    Join a Classroom
                  </button>
                </div>
              )}
            </div>

            {/* B8. Authoritative Real-Time LIVE CLASSES Section (Step 01F) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('student.liveClasses.title')}</span>
                </span>
                {enrolledLiveSessions.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase flex items-center gap-1 shadow-2xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>{enrolledLiveSessions.length} Active Stream{enrolledLiveSessions.length > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>

              {joinLiveLectureError && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{joinLiveLectureError}</span>
                </div>
              )}

              {(() => {
                const liveNowSession =
                  enrolledLiveSessions[0] ||
                  (liveSessionActive && activeLiveLectureSession?.status === 'active'
                    ? activeLiveLectureSession
                    : null);
                const liveNowClassroom =
                  enrolledClassrooms.find((c) => c.id === liveNowSession?.classroomId) ||
                  enrolledClassrooms[0];

                if (liveNowSession && liveNowSession.status === 'active') {
                  // A. LIVE NOW CARD: Real-time broadcast active
                  return (
                    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-rose-50/20 to-purple-50/30 dark:from-slate-900 dark:via-rose-950/20 dark:to-purple-950/20 border-2 border-rose-300 dark:border-rose-800 shadow-md space-y-3.5 animate-in fade-in duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                            <Video className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 animate-ping" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>LIVE NOW</span>
                              </span>
                              <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                                {liveNowSession.title || liveNowClassroom?.title}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                              {liveNowSession.teacherName || liveNowClassroom?.instructorName || 'Instructor'} · Live Lecture & Whiteboard Stream
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                              <span>{liveNowClassroom?.subject || 'Interactive Stream'}</span>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Audio & Whiteboard Synced
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-rose-100/80 dark:border-rose-900/40 flex-wrap">
                        <button
                          type="button"
                          disabled={isJoiningLiveLecture}
                          onClick={() => handleStudentJoinLiveLecture(liveNowSession)}
                          className="flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                        >
                          {isJoiningLiveLecture ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Joining Stream...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              <span>Join Live Lecture</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveClassroomId(liveNowSession.classroomId);
                            setLiveSessionClassroomId(liveNowSession.classroomId);
                            setLiveClassActiveTab('whiteboard');
                            setIsLiveSessionModalOpen(true);
                          }}
                          className="py-2.5 px-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          title="Open live lecture notes on the AI whiteboard"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          <span>Open Live Whiteboard</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // B. ACCURATE NON-LIVE CARD: When no lecture is currently broadcasting
                if (enrolledClassrooms.length > 0) {
                  return (
                    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                                {enrolledClassrooms[0]?.title}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                {t('student.liveClasses.classEnded') || 'Scheduled'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              {enrolledClassrooms[0]?.instructorName} · Next session scheduled in timetable
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-[#F0EBF8] dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsTimetableModalOpen(true)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          {t('student.liveClasses.attendance')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = enrolledClassrooms[0]?.id;
                            if (targetId) setActiveClassroomId(targetId);
                            setLiveClassActiveTab('whiteboard');
                            setIsLiveSessionModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          <span>View Whiteboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = enrolledClassrooms[0]?.id;
                            if (targetId) setActiveClassroomId(targetId);
                            setIsChatModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>Classroom Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 text-center py-5">
                    {t('student.liveClasses.empty')}
                  </div>
                );
              })()}
            </div>

            {/* B9. WEEKLY TIME TABLE Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('student.timetable.title')}
              </span>

              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                      {t('student.timetable.empty')}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Sync your lectures, office hours and exams
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  {t('student.timetable.setup')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 5: HOMEWORK = SMARTEDUCATE AI LEARNING ASSISTANT (STEP 07) */}
        {/* ============================================================== */}
        {currentScreen === 'homework' && (
          <AiHomeworkScreen onBack={() => setCurrentScreen('student_home')} />
        )}

        {/* ============================================================== */}
        {/* SCREEN 6: JOIN CLASSROOM (VALIDATION, PREVIEW & JOIN FLOW)     */}
        {/* ============================================================== */}
        {currentScreen === 'join_classroom' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-start">
            <div className="space-y-1 px-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                {t('classroom.title')}
              </h1>
              <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                {t('classroom.subtitle')}
              </p>
            </div>

            {/* Validation / Entry Form */}
            <form onSubmit={handleVerifyClassCode} className="space-y-4">
              <div className="rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3">
                <Input
                  label={t('classroom.inputLabel')}
                  type="text"
                  value={classCodeInput}
                  onChange={(e) => {
                    setClassCodeInput(e.target.value);
                    if (classCodeError) setClassCodeError(null);
                  }}
                  placeholder={t('classroom.inputPlaceholder')}
                  leftIcon={<Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 px-1">{t('classroom.sampleHint')}</p>
              </div>

              {/* Notice Banner (e.g. Existing Local Classroom) */}
              {classCodeNotice && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{classCodeNotice}</span>
                </div>
              )}

              {/* Error Message Display on INVALID CODE */}
              {classCodeError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{classCodeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!classCodeInput.trim() || isVerifyingCode}
                className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>{t('classroom.verifyCode')}</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* CLASSROOM PREVIEW CARD (When Valid Code is Verified) */}
            {previewClassroom && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#7C3AED]/30 dark:border-purple-500/40 shadow-[0_6px_24px_rgba(124,58,237,0.08)] space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 uppercase tracking-wider">
                    {t('classroom.previewTitle')}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#7C3AED] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-md">
                    {previewClassroom.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100">
                    {previewClassroom.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Instructor: {previewClassroom.instructorName} · {previewClassroom.institution}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0EBF8] dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{previewClassroom.subject}</span>
                  <span>{previewClassroom.enrolledStudents ?? 0} students enrolled</span>
                </div>

                {isPreviewLocallyEnrolled && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#7C3AED] dark:text-purple-300 text-xs font-semibold flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      This classroom is saved in your local storage. Click below to verify or create your active enrollment document in Firestore so you appear on the teacher's roster.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={isEnrollingClassroom}
                  className="w-full h-14 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base font-bold shadow-[0_6px_20px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isEnrollingClassroom ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isPreviewLocallyEnrolled ? 'Syncing Enrollment...' : 'Enrolling in Classroom...'}</span>
                    </>
                  ) : isPreviewLocallyEnrolled ? (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Sync / Repair Cloud Enrollment</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{t('classroom.button')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ENROLLED CLASSROOM SUCCESS CONFIRMATION */}
            {enrolledClassroom && (
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{enrollSuccessMessage || t('classroom.joinedSuccess')}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/80 text-[#1E1B4B] dark:text-slate-100 space-y-1.5">
                  <span className="text-xs font-mono font-bold text-[#7C3AED] dark:text-purple-300 bg-[#EDE9FE] dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
                    {enrolledClassroom.code}
                  </span>
                  <h3 className="text-lg font-bold">{enrolledClassroom.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instructor: {enrolledClassroom.instructorName} · {enrolledClassroom.institution}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('my_classrooms')}
                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{t('classroom.viewMyClassrooms')}</span>
                    <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('student_home')}
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Student Home
                  </button>
                </div>
              </div>
            )}

            {/* Action: I don't have a classroom code */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsNoClassCodeOpen(true)}
                className="text-sm font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline cursor-pointer"
              >
                {t('classroom.noCode')}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: MY CLASSROOMS (ENROLLED CLASSROOMS DASHBOARD)          */}
        {/* ============================================================== */}
        {currentScreen === 'my_classrooms' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-start">
            <div className="space-y-1 px-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                {t('classroom.myClassrooms')}
              </h1>
              <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                {t('classroom.myClassroomsSubtitle')}
              </p>
            </div>

            {enrolledClassrooms.length > 0 ? (
              <div className="space-y-3.5">
                {enrolledClassrooms.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-[0_4px_16px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-[#7C3AED] dark:text-purple-300 bg-[#EDE9FE] dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full inline-block mb-1">
                          {cls.code}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                          {cls.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {cls.instructorName} · {cls.institution}
                        </p>
                      </div>
                      {enrolledLiveSessions.some((s) => s.classroomId === cls.id) ? (
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-600 text-white shrink-0 flex items-center gap-1.5 shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                          {cls.status === 'completed' ? 'Completed' : t('classroom.activeStatus')}
                        </span>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[#F0EBF8] dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{cls.subject}</span>
                        <span className="text-slate-500 dark:text-slate-400">{cls.enrolledStudents ?? 0} students</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        {enrolledLiveSessions.some((s) => s.classroomId === cls.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              const sess = enrolledLiveSessions.find((s) => s.classroomId === cls.id);
                              if (sess) handleStudentJoinLiveLecture(sess);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Live Lecture</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveClassroomId(cls.id);
                            setLiveSessionClassroomId(cls.id);
                            setLiveClassActiveTab('whiteboard');
                            setIsLiveSessionModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 active:bg-purple-200 text-[#7C3AED] dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          <span>Live Whiteboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveClassroomId(cls.id);
                            setIsChatModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 active:bg-teal-200 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>Classroom Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRepairEnrollment(cls)}
                          disabled={syncingClassroomId === (cls.id || cls.code)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 active:bg-purple-200 text-[#7C3AED] dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {syncingClassroomId === (cls.id || cls.code) ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Syncing...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Sync / Repair Cloud Enrollment</span>
                            </>
                          )}
                        </button>
                      </div>

                      {syncFeedback && (syncFeedback.classroomId === cls.id || syncFeedback.classroomId === cls.code) && (
                        <div
                          className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                            syncFeedback.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {syncFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-relaxed font-medium">{syncFeedback.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100">
                  {t('classroom.noEnrolledTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t('classroom.noEnrolledDesc')}
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setClassCodeInput('');
                      setClassCodeError(null);
                      setPreviewClassroom(null);
                      setCurrentScreen('join_classroom');
                    }}
                  >
                    {t('classroom.button')}
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setClassCodeInput('');
                  setClassCodeError(null);
                  setPreviewClassroom(null);
                  setEnrolledClassroom(null);
                  setCurrentScreen('join_classroom');
                }}
                className="w-full h-14 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base font-bold shadow-[0_8px_24px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{t('classroom.joinAnother')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('student_home')}
                className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer text-center"
              >
                Back to Student Home
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 7: STUDENT PROGRESSIVE DISCOVERY (CURRICULUM & TEACHERS) */}
        {/* ============================================================== */}
        {currentScreen === 'find_teacher' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-start">
            {/* Top Navigation & Direct Dashboard Shortcut */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EDE8F5] dark:border-slate-800">
              <button
                type="button"
                onClick={handleHeaderBack}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <ArrowIcon className="w-4 h-4" />
                <span>{teacherStep === 'categories' ? t('common.back') : 'Previous Step'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('student_home')}
                className="px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                Skip to Dashboard
              </button>
            </div>

            {/* STEP 1: Categories & Prominent Universal Learning Search */}
            {teacherStep === 'categories' && (
              <div className="space-y-6">
                <div className="space-y-1.5 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    What would you like me to help you learn?
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    Search any course, subject, or topic across our broad global educational catalogue.
                  </p>
                </div>

                {/* Section 7: Prominent Search Feature */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={curriculumSearchQuery}
                    onChange={(e) => setCurriculumSearchQuery(e.target.value)}
                    placeholder="Search what you want to learn (e.g. Algebra, Grade 8 Mathematics, English, Physics, Python...)"
                    className="w-full h-14 ps-12 pe-10 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] dark:focus:border-purple-400 focus:ring-3 focus:ring-[#7C3AED]/20 text-[#1E1B4B] dark:text-slate-100 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs outline-none transition-all"
                  />
                  {curriculumSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCurriculumSearchQuery('')}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Example Quick Search Suggestions */}
                {!curriculumSearchQuery && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <span className="text-slate-400 font-semibold shrink-0 ps-1">Try:</span>
                    {[
                      'Grade 8 Algebra',
                      'Python',
                      'Physics',
                      'Turkish',
                      'Aircraft Engineering',
                      'Marine Navigation',
                      'Accounting',
                      'Medicine',
                      'Psychology',
                      'Economics',
                    ].map((exampleTerm) => (
                      <button
                        key={exampleTerm}
                        type="button"
                        onClick={() => setCurriculumSearchQuery(exampleTerm)}
                        className="px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 border border-[#EDE8F5] hover:border-[#7C3AED] text-slate-600 hover:text-[#7C3AED] font-semibold shrink-0 shadow-2xs transition-all cursor-pointer"
                      >
                        {exampleTerm}
                      </button>
                    ))}
                  </div>
                )}

                {/* Real-time Multi-Facet Search Results */}
                {curriculumSearchQuery.trim() ? (
                  (() => {
                    const searchRes = searchCurriculumCatalogue(curriculumSearchQuery);
                    const hasMatches =
                      searchRes.subjects.length > 0 ||
                      searchRes.courses.length > 0 ||
                      searchRes.topics.length > 0 ||
                      searchRes.faculties.length > 0 ||
                      searchRes.teachers.length > 0 ||
                      searchRes.classes.length > 0;

                    if (!hasMatches) {
                      return (
                        <div className="p-8 rounded-3xl bg-white border border-[#EDE8F5] text-center space-y-3">
                          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                          <h3 className="text-base font-bold text-[#1E1B4B]">
                            No exact matches found for "{curriculumSearchQuery}"
                          </h3>
                          <p className="text-xs text-slate-500">
                            Try searching common subjects like "Algebra", "Grade 8 Mathematics", "Physics", "Python", "Turkish", "Aircraft Engineering", or "Marine Navigation".
                          </p>
                          <button
                            type="button"
                            onClick={() => setCurriculumSearchQuery('')}
                            className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                          >
                            Clear search and browse faculties
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* 1. Matching Subjects */}
                        {searchRes.subjects.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              Subjects ({searchRes.subjects.length})
                            </h4>
                            <div className="space-y-2">
                              {searchRes.subjects.map((subj) => (
                                <div
                                  key={subj.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    const fac = CANONICAL_FACULTIES.find((f) => f.id === subj.facultyId) || CANONICAL_FACULTIES[0];
                                    setSelectedCurriculumFaculty(fac);
                                    setSelectedCurriculumSubject(subj);
                                    setSelectedSubTopic(subj.name);
                                    if (subj.facultyId === 'languages') {
                                      const matchedLang =
                                        CANONICAL_TOP_LANGUAGES.find((l) => subj.name.toLowerCase().includes(l.name.toLowerCase())) ||
                                        CANONICAL_TOP_LANGUAGES.find((l) => subj.id.toLowerCase().includes(l.id.toLowerCase())) ||
                                        CANONICAL_TOP_LANGUAGES[0];
                                      setSelectedLanguageTrack(matchedLang);
                                      setTeacherStep('language_track');
                                    } else {
                                      setTeacherStep('select_level');
                                    }
                                  }}
                                  className="p-4 rounded-2xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                                        {subj.name}
                                      </span>
                                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] font-semibold">
                                        {subj.facultyId.toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{subj.description}</p>
                                  </div>
                                  <ArrowIcon className="w-4 h-4 text-slate-400 group-hover:text-[#7C3AED] transition-colors shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Matching Courses */}
                        {searchRes.courses.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              Courses ({searchRes.courses.length})
                            </h4>
                            <div className="space-y-2">
                              {searchRes.courses.map((item, idx) => (
                                <div
                                  key={idx}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    const fac = CANONICAL_FACULTIES.find((f) => f.id === item.facultyId) || CANONICAL_FACULTIES[0];
                                    const subj = fac.subjects.find((s) => s.name === item.subject) || fac.subjects[0];
                                    const crs = subj.courses?.find((c) => c.name.toLowerCase() === item.course.toLowerCase()) || null;
                                    setSelectedCurriculumFaculty(fac);
                                    setSelectedCurriculumSubject(subj);
                                    setSelectedCurriculumCourse(crs);
                                    setSelectedCurriculumTopic(item.course);
                                    setSelectedSubTopic(item.course);
                                    setTeacherStep('select_goal');
                                  }}
                                  className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                >
                                  <div>
                                    <h5 className="text-sm font-bold text-[#1E1B4B] group-hover:text-[#7C3AED]">
                                      {item.course}
                                    </h5>
                                    <p className="text-xs text-slate-500">Course under {item.subject}</p>
                                  </div>
                                  <ArrowIcon className="w-4 h-4 text-slate-400 group-hover:text-[#7C3AED] shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Matching Topics */}
                        {searchRes.topics.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              Topics ({searchRes.topics.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {searchRes.topics.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const fac = CANONICAL_FACULTIES.find((f) => f.id === item.facultyId) || CANONICAL_FACULTIES[0];
                                    const subj = fac.subjects.find((s) => s.name === item.subject) || fac.subjects[0];
                                    const crs = subj.courses?.find((c) => c.topics?.includes(item.topic)) || null;
                                    setSelectedCurriculumFaculty(fac);
                                    setSelectedCurriculumSubject(subj);
                                    setSelectedCurriculumCourse(crs);
                                    setSelectedCurriculumTopic(item.topic);
                                    setSelectedSubTopic(item.topic);
                                    setTeacherStep('select_goal');
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-purple-50/80 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-[#1E1B4B] hover:text-[#7C3AED] transition-colors cursor-pointer text-start flex items-center gap-1.5"
                                >
                                  <span>{item.topic}</span>
                                  <span className="text-slate-400 text-[10px]">({item.subject})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Matching Teachers */}
                        {searchRes.teachers.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              Teachers ({searchRes.teachers.length})
                            </h4>
                            <div className="space-y-2">
                              {searchRes.teachers.slice(0, 4).map((teacher) => (
                                <div
                                  key={teacher.id}
                                  className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] flex items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] font-bold flex items-center justify-center shrink-0">
                                      {teacher.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Capt\.|Eng\.)\s*/, '')[0] || teacher.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h5 className="text-sm font-bold text-[#1E1B4B] truncate">{teacher.name}</h5>
                                        {teacher.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                      </div>
                                      <p className="text-xs text-slate-500 truncate">{teacher.subject} · {teacher.level}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED]">
                                      {teacher.priceDisplay}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedTeacherDetail(teacher)}
                                    >
                                      View Profile
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Matching Classes */}
                        {searchRes.classes.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              Classes & Cohorts ({searchRes.classes.length})
                            </h4>
                            <div className="space-y-2">
                              {searchRes.classes.slice(0, 3).map((cls) => (
                                <div
                                  key={cls.id}
                                  className="p-3.5 rounded-2xl bg-white border border-[#EDE8F5] flex items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                                        {cls.code}
                                      </span>
                                      <h5 className="text-sm font-bold text-[#1E1B4B]">{cls.title}</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Instructor: {cls.instructorName} · {cls.institution}</p>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      setClassCodeInput(cls.code);
                                      setCurrentScreen('join_classroom');
                                    }}
                                  >
                                    Join Class
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Section 7 & 10: Popular / Recommended Ordering & 25 Faculties */
                  <div className="space-y-6">
                    {/* Primary Dedicated Highlights: Languages & School Education (Sections 4 & 5) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          const langFac = CANONICAL_FACULTIES.find((f) => f.id === 'languages') || CANONICAL_FACULTIES[0];
                          setSelectedCurriculumFaculty(langFac);
                          setTeacherStep('language_track');
                        }}
                        className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all text-start cursor-pointer group flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Languages className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                                Languages
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                Top 10 First
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                              Learn a language from beginner to advanced.
                            </p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                          <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const schoolFac = CANONICAL_FACULTIES.find((f) => f.id === 'school') || CANONICAL_FACULTIES[1];
                          setSelectedCurriculumFaculty(schoolFac);
                          setTeacherStep('school_grade');
                        }}
                        className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all text-start cursor-pointer group flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <School className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                                School Education
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                Grades 1–12
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                              Primary, middle & high school curriculum progression.
                            </p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                          <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </button>
                    </div>

                    {/* Section 3: Clearly Visible "Popular Subjects" / "Top Subjects" (Top 10) */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Popular Subjects
                          </h3>
                          <p className="text-xs text-slate-400">Top 10 globally in-demand subject areas</p>
                        </div>
                        <span className="text-xs text-[#7C3AED] font-semibold">
                          Curated Top 10
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {CANONICAL_TOP_10_SUBJECTS.map((item, idx) => (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const fac = CANONICAL_FACULTIES.find((f) => f.id === item.facultyId) || CANONICAL_FACULTIES[0];
                              const subj = fac.subjects.find((s) => s.id === item.subjectId) || fac.subjects[0];
                              setSelectedCurriculumFaculty(fac);
                              setSelectedCurriculumSubject(subj);
                              setSelectedSubTopic(item.name);
                              if (subj.courses && subj.courses.length > 0) {
                                setTeacherStep('select_course');
                              } else {
                                setTeacherStep('select_topic');
                              }
                            }}
                            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all text-start cursor-pointer group flex items-center justify-between gap-3 select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 transition-colors">
                                {getPopularSubjectIcon(item.iconName)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-mono font-bold text-slate-400">
                                    {idx + 1}.
                                  </span>
                                  <h4 className="text-sm font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors truncate">
                                    {item.name}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <ArrowIcon className="w-4 h-4 text-slate-300 group-hover:text-[#7C3AED] transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All 25 Canonical Faculties */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Browse by Faculty & Area
                        </span>
                        <span className="text-xs text-[#7C3AED] font-semibold">
                          {CANONICAL_FACULTIES.length} Disciplines
                        </span>
                      </div>

                      <div className="space-y-3">
                        {CANONICAL_FACULTIES.map((fac) => (
                          <div
                            key={fac.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedCurriculumFaculty(fac);
                              if (fac.id === 'school') {
                                setTeacherStep('school_grade');
                              } else if (fac.id === 'languages') {
                                setTeacherStep('language_track');
                              } else {
                                setTeacherStep('select_subject');
                              }
                            }}
                            className="w-full p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-[0_2px_8px_rgba(20,10,50,0.02)] transition-all cursor-pointer flex items-center justify-between gap-4 select-none group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 transition-colors">
                                {getFacultyIcon(fac.id)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                                  {fac.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 truncate">{fac.description}</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                              <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DEDICATED PATHWAY: School Education — Grades 1–12 (Section 5) */}
            {teacherStep === 'school_grade' && (
              <div className="space-y-6">
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                      School Education Pathway
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Grades 1–12
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Select Your School Grade
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Choose your current grade level to view curriculum-aligned school subjects, homework support, and verified teachers.
                  </p>
                </div>

                {/* Grades 1–12 Interactive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {CANONICAL_SCHOOL_GRADES.map((gradeStr, idx) => {
                    const gradeNum = idx + 1;
                    const isPrimary = gradeNum <= 5;
                    const isMiddle = gradeNum >= 6 && gradeNum <= 8;
                    const stageLabel = isPrimary ? 'Primary' : isMiddle ? 'Middle School' : 'High School';
                    const isSelected = selectedGrade === gradeNum;

                    return (
                      <button
                        key={gradeStr}
                        type="button"
                        onClick={() => {
                          setSelectedGrade(gradeNum);
                          setSelectedCurriculumLevel(gradeStr);
                          const schoolFac = CANONICAL_FACULTIES.find((f) => f.id === 'school') || CANONICAL_FACULTIES[1];
                          setSelectedCurriculumFaculty(schoolFac);
                          setSelectedSubTopic(gradeStr);
                          setTeacherStep('select_subject');
                        }}
                        className={`p-4 rounded-2xl border text-start transition-all cursor-pointer group flex flex-col justify-between min-h-[96px] ${
                          isSelected
                            ? 'bg-[#FAF8FE] border-2 border-[#7C3AED] shadow-xs'
                            : 'bg-white border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPrimary ? 'bg-emerald-50 text-emerald-700' : isMiddle ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-[#7C3AED]'
                          }`}>
                            {stageLabel}
                          </span>
                          <ArrowIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#7C3AED] transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors mt-2">
                            {gradeStr}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Explore subjects & teachers</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Tip */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                  <School className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold">Comprehensive Grades 1–12 Syllabus:</span> Selecting a grade personalizes your subject choices (Mathematics, English, Sciences, Biology, Chemistry, Physics, History, Geography, Business, and more).
                  </div>
                </div>
              </div>
            )}

            {/* DEDICATED CATEGORY: Languages (Section 6) */}
            {teacherStep === 'language_track' && (
              <div className="space-y-6">
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                      Languages Hub
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Top 10 & Global Tongues
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Languages
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Learn a language from beginner to advanced.
                  </p>
                </div>

                {/* Language Search */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    placeholder="Search any language (e.g. Turkish, Russian, Urdu, Swahili, German, Italian...)"
                    className="w-full h-13 ps-12 pe-10 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-sm sm:text-base placeholder:text-slate-400 shadow-2xs outline-none transition-all"
                  />
                  {languageSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLanguageSearchQuery('')}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Top 10 Prominent Languages Grid (Section 6: Prominent in Initial Area) */}
                <div className="space-y-3">
                  {(() => {
                    const filteredLanguages = CANONICAL_TOP_LANGUAGES.filter((l) => {
                      if (!languageSearchQuery.trim()) return true;
                      const q = languageSearchQuery.toLowerCase();
                      return l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
                    });
                    const visibleLanguages = (languageSearchQuery.trim() || showAllLanguages) ? filteredLanguages : filteredLanguages.slice(0, 10);

                    return (
                      <>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {languageSearchQuery.trim()
                              ? `Matching Languages (${filteredLanguages.length})`
                              : showAllLanguages
                              ? `All Languages (${filteredLanguages.length})`
                              : `Top 10 Languages`}
                          </span>
                          <span className="text-xs text-[#7C3AED] font-semibold">
                            {showAllLanguages || languageSearchQuery.trim() ? `${filteredLanguages.length} Available` : '10 Featured First'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {visibleLanguages.map((lang, idx) => {
                            const isSelected = selectedLanguageTrack?.id === lang.id;
                            return (
                              <div
                                key={lang.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setSelectedLanguageTrack(lang);
                                  const langFac = CANONICAL_FACULTIES.find((f) => f.id === 'languages') || CANONICAL_FACULTIES[0];
                                  setSelectedCurriculumFaculty(langFac);
                                  const matchedSubj = langFac.subjects.find((s) => s.name.toLowerCase().includes(lang.name.toLowerCase())) || langFac.subjects[0];
                                  setSelectedCurriculumSubject(matchedSubj);
                                  setSelectedSubTopic(lang.name + ' Language');
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer text-start flex items-start justify-between gap-3 group ${
                                  isSelected
                                    ? 'bg-[#FAF8FE] border-2 border-[#7C3AED] shadow-xs'
                                    : 'bg-white border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <span className="text-2xl shrink-0 leading-none">{lang.flag}</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-mono font-bold text-slate-400">{idx + 1}.</span>
                                      <h4 className="text-base font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                                        {lang.name}
                                      </h4>
                                      <span className="text-xs text-slate-400 font-medium">({lang.nativeName})</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lang.description}</p>
                                  </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isSelected ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#7C3AED] group-hover:text-white'
                                }`}>
                                  <ArrowIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {!languageSearchQuery.trim() && (
                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => setShowAllLanguages((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              <span>
                                {showAllLanguages
                                  ? 'Show Top 10 Languages Only'
                                  : `View All Languages (${CANONICAL_TOP_LANGUAGES.length})`}
                              </span>
                              <ArrowIcon className={`w-3.5 h-3.5 transition-transform ${showAllLanguages ? '-rotate-90' : 'rotate-90'}`} />
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Dedicated Language Tracks & Levels when a language is selected (Section 6) */}
                {selectedLanguageTrack && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#7C3AED]/30 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{selectedLanguageTrack.flag}</span>
                        <div>
                          <h3 className="text-lg font-extrabold text-[#1E1B4B]">
                            {selectedLanguageTrack.name} Learning Modules
                          </h3>
                          <p className="text-xs text-slate-500">Select your target skill or proficiency track</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLanguageTrack(null)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Change Language
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Beginner',
                        'Intermediate',
                        'Advanced',
                        'Conversation',
                        'Grammar',
                        'Reading',
                        'Writing',
                        'Listening',
                        'Speaking',
                        'Vocabulary',
                        'Business',
                        'Academic',
                      ].map((track) => (
                        <button
                          key={track}
                          type="button"
                          onClick={() => {
                            setSelectedCurriculumTopic(`${selectedLanguageTrack.name} (${track})`);
                            setSelectedCurriculumLevel(track);
                            setSelectedSubTopic(`${selectedLanguageTrack.name} ${track}`);
                            setTeacherStep('select_goal');
                          }}
                          className="p-3 rounded-xl bg-purple-50/70 hover:bg-[#7C3AED] text-slate-800 hover:text-white border border-purple-200/70 transition-all text-start cursor-pointer group"
                        >
                          <span className="text-xs font-bold block">{track}</span>
                          <span className="text-[10px] text-purple-700 group-hover:text-purple-100 transition-colors">Start learning</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: Progressive Selection — Course (Section 3) */}
            {teacherStep === 'select_course' && selectedCurriculumSubject && (
              <div className="space-y-6">
                <div className="space-y-1 px-1">
                  <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                    {selectedCurriculumFaculty?.name} · {selectedCurriculumSubject.name}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Select Your Structured Course
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Choose a dedicated course sequence or browse all syllabus topics.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option to browse all topics */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurriculumCourse(null);
                      setTeacherStep('select_topic');
                    }}
                    className="w-full p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-start transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm sm:text-base font-bold text-[#7C3AED]">
                        Explore All {selectedCurriculumSubject.name} Topics
                      </span>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Browse individual concepts, modules, and exam problem types
                      </p>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-[#7C3AED]" />
                  </button>

                  {/* Structured Courses */}
                  {selectedCurriculumSubject.courses?.map((course) => (
                    <div
                      key={course.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedCurriculumCourse(course);
                        setSelectedCurriculumTopic(course.name);
                        setSelectedSubTopic(course.name);
                        setTeacherStep('select_topic');
                      }}
                      className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-[0_2px_8px_rgba(20,10,50,0.02)] transition-all cursor-pointer flex items-center justify-between gap-4 select-none group"
                    >
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                          {course.name}
                        </h4>
                        {course.description && (
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{course.description}</p>
                        )}
                        {course.topics && course.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {course.topics.map((t, idx) => (
                              <span key={idx} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowIcon className="w-5 h-5 text-slate-400 group-hover:text-[#7C3AED] transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Progressive Selection — Subject */}
            {teacherStep === 'select_subject' && selectedCurriculumFaculty && (
              <div className="space-y-6">
                <div className="space-y-1 px-1">
                  <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                    {selectedCurriculumFaculty.name} {selectedGrade ? `· Grade ${selectedGrade}` : ''}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Select Your Specific Subject
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Choose the exact subject you want to master.
                  </p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    let displayedSubjects = selectedCurriculumFaculty.subjects;
                    if (selectedCurriculumFaculty.id === 'school' && selectedGrade) {
                      if (selectedGrade <= 5) {
                        displayedSubjects = selectedCurriculumFaculty.subjects.filter((s) =>
                          ['sch_math', 'sch_english', 'sch_science', 'sch_social_studies', 'sch_religious', 'sch_art_pe'].includes(s.id)
                        );
                      } else if (selectedGrade <= 8) {
                        displayedSubjects = selectedCurriculumFaculty.subjects.filter((s) =>
                          ['sch_math', 'sch_english', 'sch_science', 'sch_computer', 'sch_geography', 'sch_history', 'sch_social_studies', 'sch_religious', 'sch_art_pe'].includes(s.id)
                        );
                      } else {
                        displayedSubjects = selectedCurriculumFaculty.subjects.filter((s) =>
                          ['sch_math', 'sch_english', 'sch_biology', 'sch_chemistry', 'sch_physics', 'sch_computer', 'sch_geography', 'sch_history', 'sch_economics_biz', 'sch_accounting', 'sch_religious', 'sch_art_pe'].includes(s.id)
                        );
                      }
                      if (displayedSubjects.length === 0) {
                        displayedSubjects = selectedCurriculumFaculty.subjects;
                      }
                    }

                    return displayedSubjects.map((subj) => (
                      <div
                        key={subj.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedCurriculumSubject(subj);
                          setSelectedSubTopic(subj.name);
                          if (selectedGrade) {
                            if (subj.courses && subj.courses.length > 0) {
                              setTeacherStep('select_course');
                            } else {
                              setTeacherStep('select_topic');
                            }
                          } else {
                            setTeacherStep('select_level');
                          }
                        }}
                        className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-[0_2px_8px_rgba(20,10,50,0.02)] transition-all cursor-pointer flex items-center justify-between gap-4 select-none group"
                      >
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                            {subj.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subj.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {subj.levels.slice(0, 3).map((lvl, idx) => (
                              <span key={idx} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {lvl}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ArrowIcon className="w-5 h-5 text-slate-400 group-hover:text-[#7C3AED] transition-colors shrink-0" />
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* STEP: Progressive Selection — Topic */}
            {teacherStep === 'select_topic' && selectedCurriculumSubject && (
              <div className="space-y-6">
                <div className="space-y-1 px-1">
                  <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                    {selectedCurriculumSubject.name} {selectedCurriculumCourse ? `· ${selectedCurriculumCourse.name}` : ''}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Choose a Specific Topic
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Focus on a particular concept or choose comprehensive learning.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const topicName = selectedCurriculumCourse ? `Complete ${selectedCurriculumCourse.name}` : `Complete ${selectedCurriculumSubject.name} Curriculum`;
                      setSelectedCurriculumTopic(topicName);
                      setSelectedSubTopic(selectedCurriculumCourse?.name || selectedCurriculumSubject.name);
                      setTeacherStep('select_goal');
                    }}
                    className="w-full p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-start transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm sm:text-base font-bold text-[#7C3AED]">
                        {selectedCurriculumCourse ? `Complete ${selectedCurriculumCourse.name}` : `Complete ${selectedCurriculumSubject.name} Curriculum`}
                      </span>
                      <p className="text-xs text-purple-700 mt-0.5">Comprehensive coverage across all standard syllabus modules</p>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-[#7C3AED]" />
                  </button>

                  {((selectedCurriculumCourse?.topics && selectedCurriculumCourse.topics.length > 0)
                    ? selectedCurriculumCourse.topics
                    : selectedCurriculumSubject.topics
                  ).map((top) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => {
                        setSelectedCurriculumTopic(top);
                        setSelectedSubTopic(top);
                        setTeacherStep('select_goal');
                      }}
                      className="w-full p-4 rounded-2xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] text-start transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-sm sm:text-base font-bold text-[#1E1B4B]">{top}</span>
                      <ArrowIcon className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP: Progressive Selection — Level / Academic Stage */}
            {teacherStep === 'select_level' && (
              <div className="space-y-6">
                <div className="space-y-1 px-1">
                  <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                    {selectedCurriculumSubject?.name || 'Academic Stage'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Select Your Learning Level
                  </h1>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed">
                    Progressive learning from beginner to university and lifelong learning.
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedCurriculumSubject?.levels && selectedCurriculumSubject.levels.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                        Recommended for {selectedCurriculumSubject.name}
                      </h3>
                      <div className="space-y-2">
                        {selectedCurriculumSubject.levels.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setSelectedCurriculumLevel(lvl);
                              if (selectedCurriculumSubject?.courses && selectedCurriculumSubject.courses.length > 0) {
                                setTeacherStep('select_course');
                              } else {
                                setTeacherStep('select_topic');
                              }
                            }}
                            className={`w-full p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              selectedCurriculumLevel === lvl
                                ? 'bg-[#FAF8FE] border-2 border-[#7C3AED] shadow-xs'
                                : 'bg-white border-[#EDE8F5] hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-sm sm:text-base font-bold text-[#1E1B4B]">{lvl}</span>
                            <ArrowIcon className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                      Progressive Academic Ladder
                    </h3>
                    <div className="space-y-2">
                      {CANONICAL_PROGRESSIVE_LEVELS.filter((lvl) => !selectedCurriculumSubject?.levels?.includes(lvl)).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setSelectedCurriculumLevel(lvl);
                            if (selectedCurriculumSubject?.courses && selectedCurriculumSubject.courses.length > 0) {
                              setTeacherStep('select_course');
                            } else {
                              setTeacherStep('select_topic');
                            }
                          }}
                          className={`w-full p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            selectedCurriculumLevel === lvl
                              ? 'bg-[#FAF8FE] border-2 border-[#7C3AED] shadow-xs'
                              : 'bg-white border-[#EDE8F5] hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm sm:text-base font-bold text-[#1E1B4B]">{lvl}</span>
                          <ArrowIcon className="w-4 h-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Progressive Selection — Choose Action: Learn, Find a Teacher, Join a Class, View Course */}
            {teacherStep === 'select_goal' && (
              <div className="space-y-6">
                <div className="space-y-2 px-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] font-bold">
                      {selectedCurriculumFaculty?.name || 'Curriculum'}
                    </span>
                    {selectedCurriculumSubject && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {selectedCurriculumSubject.name}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {selectedCurriculumLevel}
                    </span>
                    {selectedCurriculumTopic && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        {selectedCurriculumTopic}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    What would you like to do next?
                  </h1>
                  <p className="text-sm sm:text-base text-[#64748B] font-medium leading-relaxed">
                    Choose how you want to learn {selectedCurriculumTopic || selectedSubTopic || 'this subject'}.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* 1. Learn */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setCurrentScreen('homework');
                    }}
                    className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer text-start flex items-start justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                            Learn
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED]">
                            Interactive AI Tutor
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          Start guided interactive learning immediately with step-by-step breakdowns, key formulas, and practice exercises.
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-1">
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* 2. Find a Teacher */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setResultsTeacherSearch('');
                      setTeacherStep('results');
                    }}
                    className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer text-start flex items-start justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                            Find a Teacher
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Verified Educators
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          Connect with certified teachers and dedicated tutors specializing in this syllabus for 1-on-1 coaching or small groups.
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-1">
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* 3. Join a Class */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const matched = GLOBAL_CLASSROOMS.find((cls) =>
                        cls.subject.toLowerCase().includes((selectedCurriculumSubject?.name || '').toLowerCase()) ||
                        cls.title.toLowerCase().includes((selectedCurriculumTopic || selectedSubTopic || '').toLowerCase())
                      );
                      if (matched) {
                        setClassCodeInput(matched.code);
                      }
                      setCurrentScreen('join_classroom');
                    }}
                    className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer text-start flex items-start justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <School className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                            Join a Class
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            Active Cohorts
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          Enroll in live classrooms, attend scheduled lectures, and work on assignments together with peers.
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-1">
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* 4. View Course */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsCourseOverviewOpen(true)}
                    className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#7C3AED] hover:bg-[#FAF8FE] shadow-2xs transition-all cursor-pointer text-start flex items-start justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                            View Course
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            Syllabus & Modules
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          Inspect the full course curriculum structure, topic syllabus, prerequisites, and learning outcomes.
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F5F2FA] group-hover:bg-[#7C3AED] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors mt-1">
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                {/* Target Learning Goal Preference */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Target Learning Goal
                    </span>
                    <span className="text-xs text-[#7C3AED] font-semibold">{selectedLearningGoal}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CANONICAL_LEARNING_GOALS.map((goal) => {
                      const isSelected = selectedLearningGoal === goal.title;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setSelectedLearningGoal(goal.title)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white shadow-2xs'
                              : 'bg-white border border-[#EDE8F5] text-slate-600 hover:bg-purple-50'
                          }`}
                        >
                          {goal.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Section 9 — Find a Teacher Results */}
            {teacherStep === 'results' && (
              <div className="space-y-6">
                <div className="space-y-2 px-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED]">
                      {selectedCurriculumSubject?.name || selectedSubTopic || 'Global Curriculum'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {selectedCurriculumLevel}
                    </span>
                    {selectedCurriculumTopic && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700">
                        {selectedCurriculumTopic}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                    Matched Verified Teachers ({sortedTeachers.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Instructors specialized in your chosen curriculum area and learning goal.
                  </p>
                </div>

                {/* Section 8: Search Teacher & A-Z Discovery */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={resultsTeacherSearch}
                      onChange={(e) => setResultsTeacherSearch(e.target.value)}
                      placeholder="Search teacher (e.g. Dr Ahmed, Math teacher, Physics, Python tutor...)"
                      className="w-full h-11 ps-10 pe-9 rounded-xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-xs sm:text-sm text-[#1E1B4B] placeholder:text-slate-400 shadow-2xs outline-none transition-all"
                    />
                    {resultsTeacherSearch && (
                      <button
                        type="button"
                        onClick={() => setResultsTeacherSearch('')}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* A-Z Discovery Bar */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setResultsTeacherLetter(letter)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                          resultsTeacherLetter === letter
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-[#EDE8F5] hover:bg-purple-50'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  {/* Section 8B: Teacher Sorting Controls (Rating & Review Count) */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EDE8F5] shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ArrowUpDown className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
                        <span>{t('teachers.sort.label') || 'Sort by'}:</span>
                        {teacherSortBy === 'rating' && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{t('teachers.sort.rating') || 'Highest Rated (5.0 → 1.0)'}</span>
                          </span>
                        )}
                        {teacherSortBy === 'reviews' && (
                          <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#7C3AED]" />
                            <span>{t('teachers.sort.reviews') || 'Most Reviews'}</span>
                          </span>
                        )}
                        {teacherSortBy === 'recommended' && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {t('teachers.sort.recommended') || 'Recommended'}
                          </span>
                        )}
                        {teacherSortBy === 'name' && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {t('teachers.sort.name') || 'Name (A–Z)'}
                          </span>
                        )}
                      </div>

                      {/* Accessible Mobile Dropdown */}
                      <div className="sm:hidden w-full xs:w-auto">
                        <select
                          value={teacherSortBy}
                          onChange={(e) => setTeacherSortBy(e.target.value as any)}
                          aria-label="Sort verified teachers by rating, review count, or name"
                          className="w-full xs:w-auto h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                        >
                          <option value="recommended">{t('teachers.sort.recommended') || 'Recommended'}</option>
                          <option value="rating">{t('teachers.sort.rating') || 'Highest Rated (Rating)'}</option>
                          <option value="reviews">{t('teachers.sort.reviews') || 'Most Reviews (Count)'}</option>
                          <option value="name">{t('teachers.sort.name') || 'Name (A–Z)'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Segmented Button Controls (Instant one-tap sorting) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar" role="group" aria-label="Sort verified teachers">
                      <button
                        type="button"
                        onClick={() => setTeacherSortBy('rating')}
                        aria-pressed={teacherSortBy === 'rating'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                          teacherSortBy === 'rating'
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-[#7C3AED]'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${teacherSortBy === 'rating' ? 'fill-amber-300 text-amber-300' : 'fill-amber-400 text-amber-500'}`} />
                        <span>{t('teachers.sort.rating') || 'Highest Rated'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeacherSortBy('reviews')}
                        aria-pressed={teacherSortBy === 'reviews'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                          teacherSortBy === 'reviews'
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-[#7C3AED]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('teachers.sort.reviews') || 'Most Reviews'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeacherSortBy('recommended')}
                        aria-pressed={teacherSortBy === 'recommended'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                          teacherSortBy === 'recommended'
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-[#7C3AED]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('teachers.sort.recommended') || 'Recommended'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeacherSortBy('name')}
                        aria-pressed={teacherSortBy === 'name'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                          teacherSortBy === 'name'
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-[#7C3AED]'
                        }`}
                      >
                        <span>{t('teachers.sort.name') || 'Name (A–Z)'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="text-slate-500 font-medium">
                      Showing {sortedTeachers.length} verified educators
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllTeachersInResults((prev) => !prev)}
                      className="font-bold text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      {showAllTeachersInResults ? 'Filter by My Selected Subject' : 'Browse All Teachers A–Z'}
                    </button>
                  </div>
                </div>

                {sortedTeachers.length === 0 && (
                  <div className="p-8 rounded-3xl bg-white border border-[#EDE8F5] text-center space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-[#1E1B4B]">
                      No teachers matched your current filter
                    </h3>
                    <p className="text-xs text-slate-500">
                      Try selecting "ALL" letters, clearing your search query, or browsing all educators.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setResultsTeacherSearch('');
                        setResultsTeacherLetter('ALL');
                        setShowAllTeachersInResults(true);
                        setTeacherSortBy('recommended');
                      }}
                      className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      Reset filters & show all verified teachers
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  {sortedTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="p-5 rounded-3xl bg-white border border-[#EDE8F5] hover:border-[#DDD6FE] shadow-[0_2px_8px_rgba(20,10,50,0.02)] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] font-extrabold flex items-center justify-center shrink-0 text-base">
                            {teacher.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/, '')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B]">{teacher.name}</h3>
                              {teacher.isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{teacher.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{teacher.country} · {teacher.language}</p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            teacher.pricingType === 'free'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-[#7C3AED]'
                          }`}
                        >
                          {teacher.priceDisplay}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                        <span className="bg-[#F5F2FA] px-2.5 py-1 rounded-lg font-medium">
                          {teacher.subject}
                        </span>
                        <span className="bg-[#F5F2FA] px-2.5 py-1 rounded-lg">
                          {teacher.level}
                        </span>
                        <span className="bg-[#F5F2FA] px-2.5 py-1 rounded-lg">
                          {teacher.availability}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {teacher.bio}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F1ECF8] text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors ${
                            teacherSortBy === 'rating' ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300 font-bold' : ''
                          }`}>
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span>{teacher.rating.toFixed(1)}</span>
                          </div>
                          <span className={`transition-colors px-1.5 py-0.5 rounded-md ${
                            teacherSortBy === 'reviews' ? 'bg-purple-100 text-[#7C3AED] ring-1 ring-purple-300 font-bold' : 'text-slate-500 font-normal'
                          }`}>
                            ({teacher.reviewCount} reviews)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeacherDetail(teacher)}
                          >
                            View Teacher
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacherDetail(teacher);
                              setSessionRequestedNotice(true);
                            }}
                          >
                            Choose Teacher
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section 14: Finish Discovery and Enter Student Dashboard */}
                <div className="pt-4 border-t border-[#EDE8F5] space-y-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('student_home')}
                    className="w-full h-14 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Student Dashboard</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    Your curriculum selections and teachers have been bookmarked in My Learning.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER PROGRESSIVE ONBOARDING (A-Z EXPERTISE & TYPES) */}
        {/* ============================================================== */}
        {currentScreen === 'teacher_setup' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Top Navigation & Progress Bar */}
            <div className="space-y-3 pb-2 border-b border-[#EDE8F5] dark:border-slate-800">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleHeaderBack}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors cursor-pointer"
                >
                  <ArrowIcon className="w-4 h-4" />
                  <span>{teacherSetupStep === 1 ? 'Back to Roles' : 'Previous Step'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-400">
                    Step {teacherSetupStep} of 3
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {teacherSetupStep === 1 ? 'Expertise' : teacherSetupStep === 2 ? 'Levels' : 'Teacher Type'}
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 overflow-hidden">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
                  style={{ width: `${(teacherSetupStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Section 10 — What do you teach? (A-Z Search & Multi-Selection) */}
            {teacherSetupStep === 1 && (
              <form onSubmit={handleTeacherStep1Continue} className="space-y-6 text-start">
                <div className="space-y-1.5 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    What do you teach?
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    Search and select your areas of educational expertise from A to Z. You can choose multiple subjects.
                  </p>
                </div>

                {/* Teacher Profile Name & Title First */}
                <div className="rounded-3xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4">
                  <Input
                    label="Teacher Full Name & Title"
                    type="text"
                    value={teacherNameInput}
                    onChange={(e) => setTeacherNameInput(e.target.value)}
                    placeholder="e.g. Dr. Sarah Adams, Prof. Hassan"
                    leftIcon={<BookOpenCheck className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                    rightIcon={
                      teacherNameInput.trim() ? (
                        <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                      ) : undefined
                    }
                    required
                  />

                  <Input
                    label="Professional Headline / Subject Focus"
                    type="text"
                    value={teacherTitleInput}
                    onChange={(e) => setTeacherTitleInput(e.target.value)}
                    placeholder="e.g. High School Mathematics Teacher & Private Tutor"
                    leftIcon={<Award className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                  />
                </div>

                {/* Selected Expertise Badges */}
                {selectedTeacherSpecializations.length > 0 && (
                  <div className="space-y-2 px-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Selected Expertise ({selectedTeacherSpecializations.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherSpecializations([])}
                        className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacherSpecializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100/90 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTeacherSpecializations((prev) => prev.filter((s) => s !== spec))
                            }
                            className="hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 10: Search Subjects & Specializations */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={teacherAzSearch}
                      onChange={(e) => setTeacherAzSearch(e.target.value)}
                      placeholder="Search subjects, specializations, courses A–Z..."
                      className="w-full h-13 ps-12 pe-10 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs outline-none transition-all"
                    />
                    {teacherAzSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherAzSearch('')}
                        className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* A-Z Letter Filter Bar */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                    {['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setTeacherAzLetterFilter(letter)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                          teacherAzLetterFilter === letter
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#EDE8F5] dark:border-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  {/* Filtered A-Z List */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pe-1">
                    {TEACHER_AZ_SPECIALIZATIONS.filter((spec) => {
                      const matchQuery =
                        !teacherAzSearch.trim() ||
                        spec.toLowerCase().includes(teacherAzSearch.toLowerCase());
                      const matchLetter =
                        teacherAzLetterFilter === 'ALL' ||
                        spec.toUpperCase().startsWith(teacherAzLetterFilter);
                      return matchQuery && matchLetter;
                    }).map((spec) => {
                      const isSelected = selectedTeacherSpecializations.includes(spec);
                      return (
                        <div
                          key={spec}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTeacherSpecializations((prev) =>
                                prev.filter((s) => s !== spec)
                              );
                            } else {
                              setSelectedTeacherSpecializations((prev) => [...prev, spec]);
                            }
                          }}
                          className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer text-start flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#FAF8FE] dark:bg-purple-950/20 border-2 border-[#7C3AED] dark:border-purple-500 text-[#7C3AED] dark:text-purple-300 shadow-2xs font-bold'
                              : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 text-[#1E1B4B] dark:text-slate-200 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-sm font-semibold">{spec}</span>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                                : 'border-slate-300 dark:border-slate-600 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!teacherNameInput.trim() || selectedTeacherSpecializations.length === 0}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Teaching Level</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Section 5 & 17 — Teaching Level Selection */}
            {teacherSetupStep === 2 && (
              <div className="space-y-6 text-start">
                <div className="space-y-1.5 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    What levels do you teach?
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    Select all the grades, stages, or academic levels you instruct.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {CANONICAL_TEACHING_LEVELS.map((lvl) => {
                    const isSelected = selectedTeachingLevels.includes(lvl);
                    return (
                      <div
                        key={lvl}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTeachingLevels((prev) => prev.filter((l) => l !== lvl));
                          } else {
                            setSelectedTeachingLevels((prev) => [...prev, lvl]);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#FAF8FE] dark:bg-purple-950/20 border-2 border-[#7C3AED] dark:border-purple-500 shadow-2xs font-bold text-[#1E1B4B] dark:text-slate-100'
                            : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-sm sm:text-base font-semibold">{lvl}</span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'border-slate-300 dark:border-slate-600 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={selectedTeachingLevels.length === 0}
                    onClick={() => setTeacherSetupStep(3)}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Teacher Type</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Section 11 — Teacher Type Selection */}
            {teacherSetupStep === 3 && (
              <div className="space-y-6 text-start">
                <div className="space-y-1.5 px-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-slate-100">
                    What type of teacher are you?
                  </h1>
                  <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                    Select your teaching practice model or institutional affiliation.
                  </p>
                </div>

                <div className="space-y-3">
                  {CANONICAL_TEACHER_TYPES.map((type) => {
                    const isSelected = selectedTeacherType === type.id;
                    return (
                      <div
                        key={type.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTeacherType(type.id)}
                        className={`w-full p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-[#FAF8FE] dark:bg-purple-950/20 border-2 border-[#7C3AED] dark:border-purple-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-[#EDE8F5] dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-slate-100">
                              {type.title}
                            </h4>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300">
                              {type.badge}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{type.desc}</p>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'border-slate-300 dark:border-slate-600 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section 12: Finish and enter Teacher Dashboard */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTeacherSetupComplete}
                    className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Complete & Enter Teacher Dashboard</span>
                    <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER HOME (APPROVED EDUCATE INSTRUCTOR DASHBOARD)   */}
        {/* ============================================================== */}
        {currentScreen === 'teacher_home' && (
          <TeacherHomeScreen
            teacherProfile={teacherProfile}
            activeClassroom={activeClassroom}
            teacherClassrooms={teacherClassrooms}
            onSelectClassroom={(id) => setActiveClassroomId(id)}
            onCreateClassroom={() => setIsCreateClassModalOpen(true)}
            onOpenSettingsMenu={() => setIsSettingsDrawerOpen(true)}
            onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
            onViewAsStudent={handleSwitchToStudentView}
            onSwitchRole={() => setCurrentScreen('roles')}
            onLogout={handleLogout}
            onOpenRoster={() => {
              setActiveClassroomTab('roster');
              setCurrentScreen('teacher_classroom_detail');
            }}
            onOpenInviteCoTeacher={() => setIsInviteCoTeacherModalOpen(true)}
            onOpenLiveClass={() => {
              if (!liveSessionActive) {
                handleStartLiveClass();
              } else {
                setLiveClassActiveTab('video');
                setIsLiveSessionModalOpen(true);
              }
            }}
            onOpenWhiteboard={() => {
              const targetClassroom = teacherActiveClassroom || teacherClassrooms[0];
              if (targetClassroom) {
                setLiveSessionClassroomId(targetClassroom.id);
                setActiveClassroomId(targetClassroom.id);
              }
              setLiveClassActiveTab('whiteboard');
              setIsLiveSessionModalOpen(true);
            }}
            onOpenRecording={() => setIsRecordingModalOpen(true)}
            onOpenFees={() => setIsFeesModalOpen(true)}
            onOpenStudyMaterial={() => setIsStudyMaterialModalOpen(true)}
            onOpenTest={() => setCurrentScreen('teacher_assessments')}
            onOpenChat={() => setIsChatModalOpen(true)}
            onOpenHomework={() => setIsCreateAssignmentModalOpen(true)}
            onOpenAskDoubt={() => setIsAskDoubtModalOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenAiTeacher={() => {
              voiceService.unlockAudioSession();
              setCurrentScreen('teacher_ai');
            }}
            onOpenCertificates={() => setIsCertificateModalOpen(true)}
            onOpenAttendance={() => setIsAttendanceModalOpen(true)}
            onViewClassroomDetail={() => setCurrentScreen('teacher_classroom_detail')}
            onOpenTimetableSetup={() => setIsTimetableModalOpen(true)}
            timetableEntries={timetableEntries}
            liveSessionActive={liveSessionActive}
            isStartingLiveSession={isStartingLiveClass}
            liveSessionError={liveSessionError}
            onToggleLiveSession={liveSessionActive ? handleEndLiveClass : handleStartLiveClass}
            onCopyCode={handleCopyCode}
            copiedCodeToast={copiedCodeToast}
          />
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER CLASSROOM DETAIL & ROSTER                      */}
        {/* ============================================================== */}
        {currentScreen === 'teacher_classroom_detail' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-start">
            {activeClassroom ? (
              <>
                {/* Top Classroom Overview Box */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-6 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 uppercase tracking-wider">
                        {t('teacher.classroomDetails')}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-slate-100">
                        {activeClassroom.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {activeClassroom.institution} · {activeClassroom.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setLiveClassActiveTab('whiteboard');
                          setIsLiveSessionModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Open Live Whiteboard"
                      >
                        <Pen className="w-4 h-4" />
                        <span>Open Live Whiteboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChatModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Open Classroom Chat"
                      >
                        <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activeClassroom.code)}
                        className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{activeClassroom.code}</span>
                      </button>
                    </div>
                  </div>

                  {/* Roster & Quick Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F0EBF8] dark:border-slate-800">
                    <div className="p-3 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 text-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Enrolled Students</span>
                      <span className="text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100">
                        {activeClassroom.enrolledStudents ?? 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF8FE] dark:bg-slate-800/60 text-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Status</span>
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </div>

                  {/* Action Bar: Open Live Whiteboard */}
                  <div className="pt-3 border-t border-[#F0EBF8] dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                        <Pen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 block truncate">Live Teaching Whiteboard</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">AI handwriting beautification, Arabic RTL & student sync</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLiveClassActiveTab('whiteboard');
                        setIsLiveSessionModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Pen className="w-3.5 h-3.5" />
                      <span>Open Live Whiteboard</span>
                    </button>
                  </div>

                  {/* Action Bar: Open Classroom Chat */}
                  <div className="pt-3 border-t border-[#F0EBF8] dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 block truncate">Classroom Discussion & Chat</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">Live class group & 1:1 direct messages</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChatModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tabs Selector */}
                <div className="flex rounded-2xl bg-[#EDE9FE]/50 dark:bg-purple-950/40 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveClassroomTab('roster')}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeClassroomTab === 'roster'
                        ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400'
                    }`}
                  >
                    Students Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveClassroomTab('announcements')}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeClassroomTab === 'announcements'
                        ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400'
                    }`}
                  >
                    Announcements
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveClassroomTab('assignments')}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeClassroomTab === 'assignments'
                        ? 'bg-white dark:bg-slate-900 text-[#7C3AED] dark:text-purple-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400'
                    }`}
                  >
                    Assignments
                  </button>
                </div>

                {/* Tab 1: Students Roster */}
                {activeClassroomTab === 'roster' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={studentRosterFilter}
                        onChange={(e) => setStudentRosterFilter(e.target.value)}
                        placeholder="Search student by name or email..."
                        className="w-full h-12 ps-12 pe-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 focus:border-[#7C3AED] dark:focus:border-purple-400 text-sm text-[#1E1B4B] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs outline-none"
                      />
                    </div>

                    <div className="space-y-2.5">
                      {isRosterLoading ? (
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-center space-y-3">
                          <Loader2 className="w-6 h-6 text-[#7C3AED] dark:text-purple-400 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">Loading enrolled students...</p>
                        </div>
                      ) : rosterError ? (
                        <div className="p-6 rounded-2xl bg-red-50 dark:bg-rose-950/60 border border-red-200 dark:border-rose-800 text-center space-y-2">
                          <p className="text-xs font-bold text-red-700 dark:text-rose-300">{rosterError}</p>
                          <Button variant="outline" size="sm" onClick={refreshActiveRoster}>
                            Retry
                          </Button>
                        </div>
                      ) : activeClassroomRoster.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center mx-auto">
                            <Users className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">No students enrolled yet</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Share classroom code <strong className="font-mono text-[#7C3AED] dark:text-purple-300">{activeClassroom.code}</strong> with your students so they can join this classroom.
                          </p>
                        </div>
                      ) : (
                        (() => {
                          const filtered = activeClassroomRoster.filter(
                            (st) =>
                              !studentRosterFilter.trim() ||
                              st.name.toLowerCase().includes(studentRosterFilter.toLowerCase()) ||
                              st.email.toLowerCase().includes(studentRosterFilter.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-center space-y-2">
                                <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">No students match your search</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Try searching with a different name or email address.</p>
                              </div>
                            );
                          }
                          return filtered.map((st) => (
                            <div
                              key={st.id}
                              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(20,10,50,0.02)]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 font-bold flex items-center justify-center shrink-0">
                                  {st.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">{st.name}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{st.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden xs:inline">
                                  Joined {st.enrolledDate}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  {st.status}
                                </span>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </div>
                )}

            {/* Tab 2: Announcements */}
            {activeClassroomTab === 'announcements' && (
              <div className="space-y-4">
                <form onSubmit={handlePostAnnouncementSubmit} className="space-y-3">
                  <div className="rounded-2xl border border-[#EDE8F5] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                    <textarea
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder={t('teacher.announcementPlaceholder')}
                      rows={3}
                      className="w-full text-sm text-[#1E1B4B] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none bg-transparent"
                    />
                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!announcementText.trim()}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('teacher.postAnnouncement')}</span>
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="space-y-3">
                  {(announcements[activeClassroom.id] || []).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-[#7C3AED] dark:text-purple-400">{ann.author}</span>
                        <span>{ann.date}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Assignments */}
            {activeClassroomTab === 'assignments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">Course Assignments</h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateAssignmentModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Assignment</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">Problem Set 1: Vector Spaces & Proofs</h4>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        Due in 4 days
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete exercises 1.2 to 1.8 from Chapter 2. Show all step-by-step reasoning.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EBF8] dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        18 submissions received (12 graded)
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('teacher_assessments')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Grade Submissions</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

              </>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 text-center space-y-4">
                <BookOpen className="w-10 h-10 text-[#7C3AED] dark:text-purple-400 mx-auto" />
                <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-slate-100">No Active Classroom Selected</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please create a classroom from your Teacher Dashboard.</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentScreen('teacher_home')}
                  className="mx-auto"
                >
                  Return to Dashboard
                </Button>
              </div>
            )}

            {/* Return Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentScreen('teacher_home')}
                className="w-full"
              >
                <span>Back to Teacher Dashboard</span>
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER AI CONTENT CREATION STUDIO (PHASE 12)           */}
        {/* ============================================================== */}
        {currentScreen === 'teacher_ai' && (
          <TeacherAiScreen
            onBack={() => setCurrentScreen('teacher_home')}
            activeClassroom={activeClassroom}
            teacherClassrooms={teacherClassrooms}
            shouldPlayWelcome={true}
            onPublishToClassroom={(mat, classId, due) => {
              addGeneratedMaterial(mat);
              setNewAssignmentTitle(mat.title);
              setNewAssignmentDue(due);
              setNewAssignmentDesc(mat.content);
              const effectiveType =
                mat.type === 'quiz' || mat.type === 'test'
                  ? mat.type
                  : (mat as any).contentType === 'quiz' || (mat as any).contentType === 'test'
                  ? (mat as any).contentType
                  : /quiz/i.test(mat.title)
                  ? 'quiz'
                  : /test|exam/i.test(mat.title)
                  ? 'test'
                  : 'assignment';
              aiGradingService.registerPublishedAssignment(
                mat.title,
                mat.subject,
                mat.gradeOrLevel,
                classId,
                activeClassroom?.title || 'Classroom',
                mat.questionCount || 10,
                due,
                mat.structuredQuestions,
                mat.answerKey,
                mat.gradingRubric,
                undefined,
                effectiveType
              );
            }}
          />
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER AI GRADING & ASSESSMENTS (PHASE 13)            */}
        {/* ============================================================== */}
        {currentScreen === 'teacher_assessments' && (
          <TeacherAssessmentsScreen
            onBack={() => setCurrentScreen('teacher_home')}
            activeClassroom={activeClassroom}
            teacherClassrooms={teacherClassrooms}
            currentUserId={auth.currentUser?.uid || userAccount?.id || 'teacher_1'}
          />
        )}

        {/* ============================================================== */}
        {/* SCREEN: TEACHER & STUDENT PROFILE / ACCOUNT (EDUCATE STYLE)   */}
        {/* ============================================================== */}
        {currentScreen === 'profile' && (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-start pb-28 animate-fadeIn">
            {/* Compact Educate-Style Profile Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-[0_4px_20px_rgba(20,10,50,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] dark:from-purple-950 dark:to-indigo-950 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center font-extrabold text-xl shadow-2xs shrink-0">
                  {((isTeacherRole ? teacherProfile.name : fullName) || 'AM')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] dark:text-slate-100 break-words">
                      {(isTeacherRole ? teacherProfile.name : fullName) || 'Abdulqaadir maxamud abdi'}
                    </h2>
                    {isTeacherRole && (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0" title={t('teacher.badgeVerified')}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold">
                    {isTeacherRole ? 'Lecturer / Teacher' : 'Student'}
                    {isStudentPreview ? ' (Preview Mode)' : ''}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium break-words">
                    {(isTeacherRole ? teacherProfile.institution : universityName) || 'Global University & Education'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium break-words">
                    {(isTeacherRole ? teacherProfile.subjects?.[0] : selectedArea) || 'Computer Science & Software'}
                    {!isTeacherRole && yearOfStudy ? ` · Year ${yearOfStudy}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* A2. YOUR ROLE Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('profile.yourRole')}
              </span>
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-2 shadow-2xs space-y-1">
                {hasTeacherAccess ? (
                  viewMode === 'teacher' ? (
                    <button
                      type="button"
                      onClick={handleSwitchToStudentView}
                      className="w-full p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-between font-bold text-sm transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shadow-2xs">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div className="text-start">
                          <span className="block">{t('teacher.viewAsStudent')}</span>
                          <span className="text-xs font-normal text-purple-600 dark:text-purple-400">Experience student interface live</span>
                        </div>
                      </div>
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReturnToTeacherDashboard}
                      className="w-full p-4 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-between font-bold text-sm transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="text-start">
                          <span className="block">{t('teacher.backToTeacher')}</span>
                          <span className="text-xs font-normal text-purple-100">Exit preview & return to dashboard</span>
                        </div>
                      </div>
                      <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleBecomeTeacher}
                    className="w-full p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-between font-bold text-sm transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shadow-2xs">
                        <BookOpenCheck className="w-4 h-4" />
                      </div>
                      <div className="text-start">
                        <span className="block">Switch to Lecturer / Teacher Mode</span>
                        <span className="text-xs font-normal text-purple-600 dark:text-purple-400">Create classes & conduct live lectures</span>
                      </div>
                    </div>
                    <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* A3. YOUR CLASSROOMS Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('profile.yourClassrooms')}
              </span>
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('my_classrooms')}
                  className="w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-bold text-sm text-[#1E1B4B] dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shadow-2xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <span className="block">{t('classroom.myClassrooms')}</span>
                      <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                        {isTeacherRole
                          ? `${teacherClassrooms.length} teaching classroom${teacherClassrooms.length !== 1 ? 's' : ''}`
                          : `${enrolledClassrooms.length} enrolled classroom${enrolledClassrooms.length !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-xs font-bold">
                      {isTeacherRole ? teacherClassrooms.length : enrolledClassrooms.length}
                    </span>
                    <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              </div>
            </div>

            {/* A4. ROLE Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('profile.roleSwitch')}
              </span>
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('roles')}
                  className="w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-bold text-sm text-[#1E1B4B] dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <span className="block">{t('profile.chooseAnotherRole')}</span>
                      <span className="text-xs font-normal text-slate-400 dark:text-slate-500">Switch between Student, Teacher, or Parent</span>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* A5. HELP & SUPPORT Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('profile.helpSupport')}
              </span>
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(true)}
                  className="w-full p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-bold text-sm text-[#1E1B4B] dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <span className="block">{t('profile.helpSupport')}</span>
                      <span className="text-xs font-normal text-slate-400 dark:text-slate-500">Guides, FAQs, and support channels</span>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* A6. ACCOUNT / LOGOUT Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {t('profile.account')}
              </span>
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 p-2 shadow-2xs">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-between font-bold text-sm transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <span className="block">{t('profile.logout')}</span>
                      <span className="text-xs font-normal text-rose-400 dark:text-rose-500">Sign out of SmartEducate</span>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: SMARTEDUCATE PREMIUM (EDUCATE STYLE)                  */}
        {/* ============================================================== */}
        {currentScreen === 'premium' && (
          <PremiumScreen
            onBack={() => {
              if (viewMode === 'teacher' && !isStudentPreview) {
                setCurrentScreen('teacher_home');
              } else {
                setCurrentScreen('student_home');
              }
            }}
            isTeacherRole={isTeacherRole}
          />
        )}
      </main>

      {/* Shared Canonical Persistent Bottom Navigation (HOME | PREMIUM | PROFILE) */}
      {(currentScreen === 'teacher_home' ||
        currentScreen === 'student_home' ||
        currentScreen === 'profile' ||
        currentScreen === 'premium') && (
        <BottomNav
          items={bottomNavItems}
          activeId={getActiveBottomNavId()}
          onChange={handleBottomNavChange}
        />
      )}

      {/* Subtle Footnote (Hidden on mobile navigation and focused screens) */}
      {currentScreen !== 'homework' &&
        currentScreen !== 'teacher_home' &&
        currentScreen !== 'student_home' &&
        currentScreen !== 'profile' &&
        currentScreen !== 'premium' && (
          <Footer />
        )}

      {/* Teacher Profile Detail Modal */}
      {selectedTeacherDetail && (
        <Modal
          isOpen={Boolean(selectedTeacherDetail)}
          onClose={() => {
            setSelectedTeacherDetail(null);
            setSessionRequestedNotice(false);
          }}
          title={selectedTeacherDetail.name}
          description={selectedTeacherDetail.title}
          footer={
            <div className="flex items-center justify-between w-full pt-2">
              <span className="text-sm font-bold text-[#7C3AED]">
                {selectedTeacherDetail.priceDisplay}
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSessionRequestedNotice(true)}
              >
                {sessionRequestedNotice ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  t('common.join')
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-start text-sm text-slate-700">
            <p className="leading-relaxed">{selectedTeacherDetail.bio}</p>

            <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-bold text-[#1E1B4B]">{selectedTeacherDetail.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Language:</span>
                <span className="font-bold text-[#1E1B4B]">{selectedTeacherDetail.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Availability:</span>
                <span className="font-bold text-emerald-700">{selectedTeacherDetail.availability}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Country:</span>
                <span className="font-bold text-[#1E1B4B]">{selectedTeacherDetail.country}</span>
              </div>
            </div>

            {sessionRequestedNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Joined session with {selectedTeacherDetail.name}!</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* "I don't have a classroom code" Guidance Modal */}
      <Modal
        isOpen={isNoClassCodeOpen}
        onClose={() => setIsNoClassCodeOpen(false)}
        title={t('classroom.noCodeTitle')}
        description={t('classroom.noCodeDesc')}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsNoClassCodeOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsNoClassCodeOpen(false);
                setTeacherStep('categories');
                setCurrentScreen('find_teacher');
              }}
            >
              {t('home.action.teacher.title')}
            </Button>
          </div>
        }
      >
        <div className="p-4 rounded-2xl bg-[#F8F6FD] border border-[#EDE8F5] text-sm text-[#475569] space-y-2">
          <p>• Your classroom code is generated and shared by your teacher, university lecturer, or school administrator.</p>
          <p>• Ask your teacher for their 6-character classroom code (e.g. <strong>WSC-6666</strong>).</p>
          <p>• You can also discover open teachers and public learning programs anytime in "Find a Teacher".</p>
        </div>
      </Modal>

      {/* Student Has No Enrolled Classrooms - Chat Guidance Modal */}
      <Modal
        isOpen={isNoEnrolledChatNoticeOpen}
        onClose={() => setIsNoEnrolledChatNoticeOpen(false)}
        title="Join a Classroom to Access Chat"
        description="Classroom discussion & direct messaging require active enrollment"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsNoEnrolledChatNoticeOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsNoEnrolledChatNoticeOpen(false);
                setClassCodeInput('');
                setClassCodeError(null);
                setPreviewClassroom(null);
                setCurrentScreen('join_classroom');
              }}
            >
              {t('classroom.button')}
            </Button>
          </div>
        }
      >
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F6FD] border border-[#EDE8F5] text-sm text-[#475569] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#1E1B4B]">No Active Classroom Enrollment</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Classroom chat connects you directly with your instructor and classmates for study discussions and 1:1 question support.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#EDE8F5] text-xs text-slate-600 space-y-1">
            <p>• To access chat, please join a classroom using the code provided by your teacher (e.g. <strong>WSC-6666</strong>).</p>
            <p>• Once enrolled, your classroom discussions, voice notes, and messages will appear here automatically.</p>
          </div>
        </div>
      </Modal>

      {/* Educate-Style Dedicated Hamburger Settings Drawer */}
      <SettingsMenuDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        onOpenClassroomSettings={() => setCurrentScreen('my_classrooms')}
        onOpenProfile={() => setCurrentScreen('profile')}
        onOpenPremium={() => setCurrentScreen('premium')}
        onOpenCreateClassroom={() => setIsCreateClassModalOpen(true)}
        onInviteCoTeacher={() => setIsInviteCoTeacherModalOpen(true)}
        onViewAsStudent={handleSwitchToStudentView}
        onOpenTutorial={() => setIsTutorialModalOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onOpenContactUs={() => setIsHelpModalOpen(true)}
        onDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
        onLogout={handleLogout}
        isTeacherRole={isTeacherRole}
      />

      {/* Slide-in Classroom Notifications, Announcements & Deadlines Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        announcements={announcements}
        activeClassroom={activeClassroom}
        enrolledClassrooms={enrolledClassrooms}
        teacherClassrooms={teacherClassrooms}
        onOpenClassroomChat={(classroomId) => {
          if (classroomId) setActiveClassroomId(classroomId);
          setIsChatModalOpen(true);
        }}
        onOpenAssessment={(assessmentId) => {
          if (assessmentId) {
            handleOpenPublishedAssessment(assessmentId);
          } else {
            setIsTestModalOpen(true);
          }
        }}
        onNavigateToScreen={(screen) => setCurrentScreen(screen as any)}
      />

      {/* Tutorial / "How my classroom works" Modal */}
      <Modal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        title={t('settings.item.howItWorks')}
        footer={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsTutorialModalOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-3 text-start text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            SmartEducate brings together lectures, live classroom attendance, syllabus materials, and diagnostic testing into one mobile-first workspace.
          </p>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-purple-900 space-y-1.5">
            <h4 className="font-bold text-xs text-[#7C3AED]">Key Capabilities:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>One-tap live audio/video sessions with automatic attendance records</li>
              <li>Syllabus notes, lecture PDFs, and slide decks sharing</li>
              <li>Automated quizzes with diagnostic scoring</li>
              <li>AI Learning Assistant for real-time homework guidance</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Canonical Co-Teachers Management Modal */}
      <CoTeachersModal
        isOpen={isInviteCoTeacherModalOpen}
        onClose={() => setIsInviteCoTeacherModalOpen(false)}
        activeClassroom={teacherActiveClassroom || activeClassroom}
        teacherProfile={teacherProfile}
        onRefreshClassrooms={() => {
          refreshTeacherClassrooms();
          refreshCoTeacherCounts();
        }}
        onCountsUpdated={(counts) => {
          updateTeacherProfile({
            coTeachersCount: counts.coTeachersCount,
            pendingCoTeachersCount: counts.pendingInvites,
          });
        }}
      />

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title={t('settings.item.privacyPolicy')}
        footer={
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPrivacyModalOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-2.5 text-start text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            SmartEducate protects all learner and instructor telemetry using industry-standard encryption protocols.
          </p>
          <p>
            Student grades, chat queries, and assessment submissions remain strictly private to authorized university classroom participants.
          </p>
        </div>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title={t('settings.item.termsConditions')}
        footer={
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsTermsModalOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-2.5 text-start text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            By accessing SmartEducate, instructors and students agree to uphold academic integrity, respectful classroom dialogue, and lawful use of copyrighted academic materials.
          </p>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title={t('settings.item.deleteAccount')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDeleteAccountModalOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsDeleteAccountModalOpen(false);
                handleLogout();
              }}
              className="!bg-rose-600 hover:!bg-rose-700 !border-rose-600 text-white"
            >
              {t('settings.item.deleteAccount')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-start text-xs sm:text-sm text-slate-600">
          <p className="text-rose-600 font-bold">
            Are you sure you want to permanently delete your SmartEducate account?
          </p>
          <p>
            All enrolled classroom records, test scores, homework submissions, and profile customizations will be permanently cleared from this device.
          </p>
        </div>
      </Modal>

      {/* Create Classroom Modal Dialog */}
      <Modal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        title={t('teacher.createClassModalTitle')}
        description={t('teacher.createClassModalDesc')}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCreateClassModalOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateClassroomSubmit}
              disabled={!newClassName.trim()}
            >
              {t('teacher.createClassroom')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateClassroomSubmit} className="space-y-4 text-start">
          <Input
            label="Classroom Title"
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder={t('teacher.classNamePlaceholder')}
            leftIcon={<BookOpen className="w-5 h-5" />}
            autoFocus
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Subject Area
            </label>
            <select
              value={newClassSubject}
              onChange={(e) => setNewClassSubject(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-sm shadow-2xs outline-none"
            >
              <option value="Computer Science">Computer Science & IT</option>
              <option value="Mathematics">Mathematics & Statistics</option>
              <option value="Medicine">Medicine & Health Sciences</option>
              <option value="Engineering">Engineering & Technology</option>
              <option value="Business">Business & Economics</option>
              <option value="Languages">Languages & Literature</option>
              <option value="General Curriculum">General Curriculum</option>
            </select>
          </div>

          <Input
            label="Custom Classroom Code (Optional)"
            type="text"
            value={newClassCustomCode}
            onChange={(e) => setNewClassCustomCode(e.target.value.toUpperCase())}
            placeholder="e.g. CS-301 (Auto-generated if blank)"
            leftIcon={<Users className="w-5 h-5" />}
          />
        </form>
      </Modal>

      {/* Create Assignment Modal Dialog */}
      <Modal
        isOpen={isCreateAssignmentModalOpen}
        onClose={() => setIsCreateAssignmentModalOpen(false)}
        title={t('teacher.createAssignment')}
        description={`Publish an assignment or homework problem set for ${activeClassroom?.title || 'your classroom'}`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCreateAssignmentModalOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateAssignmentSubmit}
              disabled={!newAssignmentTitle.trim()}
            >
              Publish Assignment
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4 text-start">
          <Input
            label={t('teacher.assignmentTitle')}
            type="text"
            value={newAssignmentTitle}
            onChange={(e) => setNewAssignmentTitle(e.target.value)}
            placeholder="e.g. Problem Set 2: Derivatives & Limits"
            leftIcon={<FileText className="w-5 h-5" />}
            autoFocus
            required
          />

          <Input
            label={t('teacher.assignmentDue')}
            type="text"
            value={newAssignmentDue}
            onChange={(e) => setNewAssignmentDue(e.target.value)}
            placeholder="e.g. Next Monday at 11:59 PM"
            leftIcon={<Calendar className="w-5 h-5" />}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              {t('teacher.assignmentDesc')}
            </label>
            <textarea
              value={newAssignmentDesc}
              onChange={(e) => setNewAssignmentDesc(e.target.value)}
              placeholder="Enter instructions, questions, or textbook reading pages..."
              rows={3}
              className="w-full p-4 rounded-2xl bg-white border border-[#EDE8F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#1E1B4B] text-sm shadow-2xs outline-none resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Timetable / Schedule Modal Dialog (Dynamic Phase 09 Component) */}
      <TimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        activeClassroom={activeClassroom}
        timetableEntries={timetableEntries}
        onAddEntry={addTimetableEntry}
        onRemoveEntry={removeTimetableEntry}
      />

      {/* AI Teacher Material Generation Studio */}
      <AiTeacherModal
        isOpen={isAiTeacherModalOpen}
        onClose={() => setIsAiTeacherModalOpen(false)}
        activeClassroom={activeClassroom}
        onSaveToAssignments={(asg) => {
          setNewAssignmentTitle(asg.title);
          setNewAssignmentDue(asg.dueDate);
          setNewAssignmentDesc(asg.instructions);
          setIsCreateAssignmentModalOpen(true);
        }}
        onMaterialCreated={(mat) => {
          addGeneratedMaterial(mat);
        }}
      />

      {/* AI Test Analysis & Cohort Performance */}
      <TestAnalysisModal
        isOpen={isTestAnalysisModalOpen}
        onClose={() => setIsTestAnalysisModalOpen(false)}
        activeClassroom={activeClassroom}
        onOpenCertificates={() => {
          setIsCertificateModalOpen(true);
        }}
      />

      {/* Student Certificates & Academic Credentials */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        activeClassroom={activeClassroom}
        teacherProfile={teacherProfile}
        certificates={studentCertificates}
        onApproveCertificate={approveCertificate}
        onIssueCertificate={issueCertificate}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        activeClassroom={activeClassroom}
        students={activeClassroomRoster}
      />

      {/* Fees Modal */}
      <FeesModal
        isOpen={isFeesModalOpen}
        onClose={() => setIsFeesModalOpen(false)}
        activeClassroom={activeClassroom}
        students={activeClassroomRoster}
      />

      {/* Ask Doubt Modal */}
      <AskDoubtModal
        isOpen={isAskDoubtModalOpen}
        onClose={() => setIsAskDoubtModalOpen(false)}
        activeClassroom={activeClassroom}
      />

      {/* Study Material & Resources Modal Dialog */}
      <Modal
        isOpen={isStudyMaterialModalOpen}
        onClose={() => setIsStudyMaterialModalOpen(false)}
        title={t('teacher.material.title')}
        description={`${t('teacher.material.subtitle')} · ${activeClassroom?.title || 'Classroom'}`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {classroomStudyMaterials.length} files shared
            </span>
            <div className="flex items-center gap-2">
              {viewMode === 'teacher' && !isStudentPreview && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsUploadMaterialModalOpen(true)}
                    className="bg-[#7C3AED] hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 me-1.5" />
                    <span>Upload Material</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsStudyMaterialModalOpen(false);
                      setLiveClassActiveTab('whiteboard');
                      setIsLiveSessionModalOpen(true);
                    }}
                    className="text-[#7C3AED] border-purple-200 hover:bg-purple-50"
                  >
                    <Pen className="w-3.5 h-3.5 me-1.5" />
                    <span>Open Whiteboard</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsStudyMaterialModalOpen(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 text-start">
          {/* Action Notice Alert */}
          {materialActionNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {materialActionNotice}
              </span>
              <button
                type="button"
                onClick={() => setMaterialActionNotice(null)}
                className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Instructor Permission Guidance Banner */}
          {viewMode === 'teacher' && !isStudentPreview && (
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs text-purple-900 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>
                  <strong>Download Permission Controls:</strong> Set student access to View Only, Allow Download, or Download Disabled for each material.
                </span>
              </div>
            </div>
          )}

          {/* Material Cards List */}
          <div className="space-y-3">
            {classroomStudyMaterials.map((mat) => {
              const perm = mat.downloadPermission || 'allow_download';
              const isTeacher = viewMode === 'teacher' && !isStudentPreview;
              const canStudentDownload = perm === 'allow_download';
              const isStudentViewOnly = perm === 'view_only';
              const isStudentDisabled = perm === 'download_disabled';

              return (
                <div
                  key={mat.id}
                  onClick={() => {
                    if (mat.isWhiteboard) {
                      setSelectedWhiteboardMaterial(mat);
                    } else {
                      setSelectedDocumentMaterial(mat);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer ${
                    mat.isWhiteboard
                      ? 'bg-purple-50/40 border-purple-200 hover:border-purple-400 hover:bg-purple-50/70 shadow-2xs'
                      : 'bg-[#FAF8FE] border-[#EDE8F5] hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                >
                  {/* Left: Icon & Title & Meta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        mat.isWhiteboard
                          ? 'bg-purple-100 text-[#7C3AED]'
                          : mat.type.includes('PDF')
                          ? 'bg-rose-100 text-rose-600'
                          : mat.type.includes('Slides')
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}
                    >
                      {mat.isWhiteboard ? (
                        <Pen className="w-5 h-5 stroke-[2.2]" />
                      ) : mat.type.includes('PDF') ? (
                        <FileText className="w-5 h-5" />
                      ) : mat.type.includes('Slides') ? (
                        <Layers className="w-5 h-5" />
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#1E1B4B] truncate">
                          {mat.title}
                        </h4>
                        {mat.isWhiteboard && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] shrink-0">
                            Whiteboard
                          </span>
                        )}

                        {/* Student / Universal Permission Badge */}
                        {perm === 'allow_download' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Allow Download</span>
                          </span>
                        )}
                        {perm === 'view_only' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px] shrink-0">
                            <Eye className="w-3 h-3 text-sky-600" />
                            <span>View Only</span>
                          </span>
                        )}
                        {perm === 'download_disabled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] shrink-0">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Download Disabled</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {mat.type} · {mat.size}
                        {mat.pageCount ? ` · ${mat.pageCount} Pages` : ''} · {mat.downloads}
                      </p>
                    </div>
                  </div>

                  {/* Right: Controls & Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0 flex-wrap justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Teacher: Permission Switcher */}
                    {isTeacher && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 px-1 hidden lg:inline">
                          Access:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateMaterialPermission(mat.id, 'view_only')}
                          title="View Only: Students can open & view in browser, but cannot download"
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            perm === 'view_only'
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          View Only
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMaterialPermission(mat.id, 'allow_download')}
                          title="Allow Download: Students can view and download"
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            perm === 'allow_download'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Allow Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMaterialPermission(mat.id, 'download_disabled')}
                          title="Download Disabled: Download controls disabled for students"
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            perm === 'download_disabled'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Disabled
                        </button>
                      </div>
                    )}

                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (mat.isWhiteboard) {
                          setSelectedWhiteboardMaterial(mat);
                        } else {
                          setSelectedDocumentMaterial(mat);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold border border-purple-200 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {/* Download Button (Teacher: Always available | Student: Respects Permission) */}
                    {isTeacher ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadMaterialFile(mat)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1 transition-all"
                        title="Download file copy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    ) : canStudentDownload ? (
                      /* Student with Allow Download */
                      <button
                        type="button"
                        onClick={() => handleDownloadMaterialFile(mat)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    ) : isStudentDisabled ? (
                      /* Student with Download Disabled */
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-amber-50/50 text-amber-700/60 text-xs font-bold border border-amber-200 flex items-center gap-1 opacity-60 cursor-not-allowed"
                        title="Download has been disabled by your instructor"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Disabled</span>
                      </button>
                    ) : null /* If isStudentViewOnly, download button is hidden! */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Saved Whiteboard Lecture Notes Viewer Modal */}
      <WhiteboardViewerModal
        isOpen={!!selectedWhiteboardMaterial}
        onClose={() => setSelectedWhiteboardMaterial(null)}
        material={selectedWhiteboardMaterial}
        isTeacher={viewMode === 'teacher' && !isStudentPreview}
        onPermissionChange={handleUpdateMaterialPermission}
      />

      {/* Regular Course Document / Study Material Viewer Modal */}
      <Modal
        isOpen={!!selectedDocumentMaterial}
        onClose={() => setSelectedDocumentMaterial(null)}
        title={selectedDocumentMaterial?.title || 'Course Material'}
        description={`${selectedDocumentMaterial?.type} · ${selectedDocumentMaterial?.size} · Shared with ${activeClassroom?.title || 'Classroom'}`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Uploaded: {selectedDocumentMaterial ? new Date(selectedDocumentMaterial.createdAt).toLocaleDateString() : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Student View Only notice */}
              {!(viewMode === 'teacher' && !isStudentPreview) &&
                selectedDocumentMaterial?.downloadPermission === 'view_only' && (
                  <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold flex items-center gap-1.5 border border-sky-200">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Only (Download Restricted)</span>
                  </span>
                )}

              {/* Student Download Disabled notice */}
              {!(viewMode === 'teacher' && !isStudentPreview) &&
                selectedDocumentMaterial?.downloadPermission === 'download_disabled' && (
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold flex items-center gap-1.5 border border-amber-200 opacity-60 cursor-not-allowed"
                    title="Download has been disabled by your instructor"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Download Disabled</span>
                  </button>
                )}

              {/* Active Download button if Teacher or Allowed Student */}
              {(viewMode === 'teacher' && !isStudentPreview
                ? true
                : selectedDocumentMaterial?.downloadPermission === 'allow_download') && (
                <button
                  type="button"
                  onClick={() => selectedDocumentMaterial && handleDownloadMaterialFile(selectedDocumentMaterial)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDocumentMaterial(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-start">
          {/* Permission Status Banner */}
          <div className="p-3.5 rounded-2xl border flex items-center justify-between flex-wrap gap-2 text-xs bg-[#FAF8FE] border-[#EDE8F5]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E1B4B]">Access Permission:</span>
              {selectedDocumentMaterial?.downloadPermission === 'allow_download' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Allow Download (Students can view & download)
                </span>
              )}
              {selectedDocumentMaterial?.downloadPermission === 'view_only' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]">
                  <Eye className="w-3 h-3 text-sky-600" />
                  View Only (Students can read in browser; download restricted)
                </span>
              )}
              {selectedDocumentMaterial?.downloadPermission === 'download_disabled' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Download Disabled (Download controls locked for students)
                </span>
              )}
            </div>

            {/* Teacher permission switcher in reader */}
            {viewMode === 'teacher' && !isStudentPreview && selectedDocumentMaterial && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold px-1">Change:</span>
                {(['view_only', 'allow_download', 'download_disabled'] as StudyMaterialDownloadPermission[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleUpdateMaterialPermission(selectedDocumentMaterial.id, p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedDocumentMaterial.downloadPermission === p
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p === 'view_only' && 'View Only'}
                    {p === 'allow_download' && 'Allow Download'}
                    {p === 'download_disabled' && 'Disabled'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Academic Document Reader Preview Surface */}
          <div className="p-5 rounded-2xl bg-white border border-[#EDE8F5] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-bold text-[#1E1B4B] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Document Content Preview
              </span>
              <span className="text-slate-400">Format: {selectedDocumentMaterial?.type}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
              {selectedDocumentMaterial?.contentPreview ||
                'This course material is prepared and published by the instructor for enrolled students.'}
            </div>
          </div>
        </div>
      </Modal>

      {/* Teacher: Upload New Study Material Modal */}
      <Modal
        isOpen={isUploadMaterialModalOpen}
        onClose={() => setIsUploadMaterialModalOpen(false)}
        title={t('teacher.material.uploadTitle')}
        description={t('teacher.material.uploadDesc')}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsUploadMaterialModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleUploadSubmitMaterial}
              className="bg-[#7C3AED] hover:bg-purple-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 me-1.5 inline" />
              <span>Publish Material</span>
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmitMaterial} className="space-y-4 text-start">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E1B4B]">Resource Title</label>
            <input
              type="text"
              required
              value={uploadMaterialTitle}
              onChange={(e) => setUploadMaterialTitle(e.target.value)}
              placeholder="e.g. Chapter 3: Eigenvalues & Vector Systems"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 font-medium"
            />
          </div>

          {/* Type & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E1B4B]">Material Type</label>
              <select
                value={uploadMaterialType}
                onChange={(e) => setUploadMaterialType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 font-medium bg-white"
              >
                <option value="PDF Document">PDF Document</option>
                <option value="Presentation Slides">Presentation Slides</option>
                <option value="Course Workbook">Course Workbook</option>
                <option value="Video Lecture">Video Lecture</option>
                <option value="Audio Recording">Audio Recording</option>
                <option value="Reference Notes">Reference Notes</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E1B4B]">Estimated File Size</label>
              <input
                type="text"
                value={uploadMaterialSize}
                onChange={(e) => setUploadMaterialSize(e.target.value)}
                placeholder="e.g. 2.4 MB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 font-medium"
              />
            </div>
          </div>

          {/* Content Summary / Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E1B4B]">Content Summary / Lecture Notes</label>
            <textarea
              rows={3}
              value={uploadMaterialContent}
              onChange={(e) => setUploadMaterialContent(e.target.value)}
              placeholder="Provide key notes, topics covered, or syllabus alignment for this resource..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 font-medium resize-none"
            />
          </div>

          {/* Student Download Permission Selector (Required) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
              <span>Student Download Permission</span>
              <span className="text-[11px] font-normal text-slate-400">(Required)</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* View Only */}
              <div
                onClick={() => setUploadMaterialPermission('view_only')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  uploadMaterialPermission === 'view_only'
                    ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    uploadMaterialPermission === 'view_only'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E1B4B]">View Only</h4>
                    {uploadMaterialPermission === 'view_only' && (
                      <Check className="w-4 h-4 text-sky-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Students can open and view the material in the browser, but cannot download it.
                  </p>
                </div>
              </div>

              {/* Allow Download */}
              <div
                onClick={() => setUploadMaterialPermission('allow_download')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  uploadMaterialPermission === 'allow_download'
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    uploadMaterialPermission === 'allow_download'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Allow Download</h4>
                    {uploadMaterialPermission === 'allow_download' && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Students can view and download the material file to their local device.
                  </p>
                </div>
              </div>

              {/* Download Disabled */}
              <div
                onClick={() => setUploadMaterialPermission('download_disabled')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  uploadMaterialPermission === 'download_disabled'
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    uploadMaterialPermission === 'download_disabled'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Download Disabled</h4>
                    {uploadMaterialPermission === 'download_disabled' && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Students can view the document, but all download and export controls are disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Help & Support Modal Dialog */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title={t('profile.helpSupport')}
        description="SmartEducate academic guidance, platform FAQs, and instructor support"
        footer={
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsHelpModalOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-3.5 text-start">
          <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE8F5] space-y-2">
            <div className="flex items-center gap-3 text-[#7C3AED]">
              <Sparkles className="w-5 h-5" />
              <h4 className="text-sm font-bold text-[#1E1B4B]">24/7 AI Homework Tutor</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Have doubts on course concepts or need help breaking down problems step-by-step? Ask the conversational AI Tutor with voice in English, Somali, or Arabic.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setCurrentScreen('homework');
                }}
              >
                <span>{t('student.action.aiTutor')}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-1.5">
            <div className="flex items-center gap-2.5 text-indigo-600">
              <BookOpen className="w-4 h-4" />
              <h4 className="text-sm font-bold text-[#1E1B4B]">Classroom Access & Joining</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your instructor provides a 6-character code (e.g. <span className="font-mono font-bold text-[#7C3AED]">CALC101</span>). Tap "Join Classroom" to preview course details and enroll instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-1.5">
            <div className="flex items-center gap-2.5 text-teal-600">
              <GraduationCap className="w-4 h-4" />
              <h4 className="text-sm font-bold text-[#1E1B4B]">Instructor & Advisor Office Hours</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct consultation hours are scheduled on Wednesdays and Fridays. Review your weekly timetable or join live class sessions for real-time Q&A.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs text-slate-500">
            <span className="font-bold text-slate-700 block">Platform Support Channel</span>
            <p>Email: support@smarteducate.app · Hours: 8:00 AM – 8:00 PM EAT</p>
          </div>
        </div>
      </Modal>

      {/* Classroom Lecture Recordings Modal Dialog */}
      <ClassroomRecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        activeClassroom={activeClassroom}
        isTeacher={viewMode === 'teacher' && !isStudentPreview}
      />

      {/* Tests & Assessments Modal Dialog */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={t('student.action.test')}
        description={`${activeClassroom?.title || 'Classroom'} · Tests & Online Assessments`}
        footer={
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsTestModalOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-3 text-start">
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-700 uppercase tracking-wide">Active Assessment</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Due in 3 days</span>
            </div>
            <h4 className="text-sm font-bold text-[#1E1B4B]">Quiz 2: Matrix Inverses, Rank & Determinants</h4>
            <p className="text-xs text-slate-600">
              15 Multiple Choice & Computational Questions · 30 Minutes time limit · 1 Attempt allowed.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Weighted 10% of final grade</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE8F5] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Upcoming Midterm</span>
              <span className="text-slate-400">Scheduled Oct 18</span>
            </div>
            <h4 className="text-sm font-bold text-[#1E1B4B]">Midterm Examination: Linear Algebra Foundations</h4>
            <p className="text-xs text-slate-500">40 Questions · Comprehensive review across chapters 1 through 4.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-bold text-emerald-900 truncate">Quiz 1: Vector Spaces</h4>
              </div>
              <p className="text-xs text-emerald-700">Completed Sep 20 · Graded</p>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs shrink-0">
              94% (A)
            </div>
          </div>
        </div>
      </Modal>

      {/* Real Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Classroom Chat & Communication Modal Dialog */}
      <ClassroomChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        activeClassroom={activeChatClassroom}
        isTeacher={isTeacherChatMode}
        currentUserId={auth.currentUser?.uid || userAccount?.id || (isTeacherChatMode ? 'teacher_1' : 'st-1')}
        currentUserName={
          userAccount?.fullName ||
          auth.currentUser?.displayName ||
          (isTeacherChatMode
            ? (activeChatClassroom?.instructorName || 'Instructor')
            : (profile.personalInfo.fullName || 'Student'))
        }
        rosterStudents={activeClassroomRoster}
      />

      {/* App-level WebRTC Audio & Video Call Overlay */}
      {globalCallSession && globalCallSession.status !== 'idle' && (
        <ClassroomCallOverlay
          session={globalCallSession}
          isTeacher={isTeacherChatMode}
          onClose={() => classroomCallService.endCall()}
        />
      )}

      {/* Live Class Session Modal Dialog */}
      <Modal
        isOpen={isLiveSessionModalOpen}
        onClose={() => {
          if (viewMode === 'teacher' && !isStudentPreview) {
            setIsLiveSessionModalOpen(false);
          } else {
            handleStudentLeaveLiveLecture();
          }
        }}
        title={liveClassActiveTab === 'whiteboard' ? 'Live Teaching Whiteboard' : t('student.liveClasses.title')}
        description={`${
          activeLiveLectureSession?.teacherName ||
          activeClassroom?.instructorName ||
          teacherActiveClassroom?.instructorName ||
          teacherProfile.name ||
          'Instructor'
        } · ${
          liveClassActiveTab === 'whiteboard'
            ? 'Interactive AI Whiteboard & Real-Time Sync'
            : 'Live Lecture & Whiteboard Stream'
        }`}
        maxWidth={liveClassActiveTab === 'whiteboard' ? 'full' : 'lg'}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                (viewMode === 'teacher' && liveSessionActive) || (viewMode !== 'teacher' && liveConnectionState === 'CONNECTED')
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400'
              }`} />
              <span>
                {viewMode === 'teacher' && !isStudentPreview
                  ? (liveSessionActive ? 'Live Broadcast Active' : 'Attendance Recorded')
                  : liveConnectionState === 'CONNECTED'
                  ? 'Connected to Live Lecture'
                  : liveConnectionState === 'CONNECTING_MEDIA' || liveConnectionState === 'JOINING'
                  ? 'Connecting Stream...'
                  : liveConnectionState === 'SESSION_ENDED'
                  ? 'Session Ended'
                  : liveSessionActive
                  ? 'Live Session Available'
                  : 'Attendance Recorded'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsRecordingModalOpen(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Radio className="w-3.5 h-3.5 me-1.5" />
                <span>{t('teacher.action.recording')}</span>
              </Button>
              {viewMode === 'teacher' && !isStudentPreview && liveSessionActive ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleEndLiveClass}
                  className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                >
                  End Live Session
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleStudentLeaveLiveLecture}
                >
                  {viewMode === 'teacher' && !isStudentPreview ? 'Close View' : 'Leave Session'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-start">
          {/* Hidden dedicated audio element for remote stream playback */}
          <audio ref={remoteLiveAudioRef} autoPlay playsInline />

          {/* Autoplay unblock notice if browser restricted audio */}
          {isLiveAudioBlocked && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-between text-xs text-amber-900 gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Biraawsarku wuxuu hakiyay codka tooska ah (Browser paused audio autoplay).</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  remoteLiveAudioRef.current?.play().then(() => setIsLiveAudioBlocked(false)).catch(() => {});
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold cursor-pointer shrink-0"
              >
                Taabo si codku u shaqeeyo (Unmute)
              </button>
            </div>
          )}

          {/* Live Session Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F4F1FA] border border-[#EDE8F5]">
            <button
              type="button"
              onClick={() => setLiveClassActiveTab('video')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                liveClassActiveTab === 'video'
                  ? 'bg-white text-[#1E1B4B] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-4 h-4 text-rose-500" />
              <span>{t('whiteboard.tab.video') || 'Live Video Stream'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLiveClassActiveTab('whiteboard')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                liveClassActiveTab === 'whiteboard'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#7C3AED]'
              }`}
            >
              <Pen className="w-4 h-4" />
              <span>{t('whiteboard.tab.whiteboard') || 'Interactive Whiteboard'}</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-purple-100 text-[#7C3AED] group-hover:bg-purple-200">
                {viewMode === 'teacher' && !isStudentPreview ? 'Teacher' : 'Live'}
              </span>
            </button>
          </div>

          {/* TAB 1: Live Video Stream */}
          {liveClassActiveTab === 'video' && (
            <div className="space-y-4">
              {/* Video Feed Surface */}
              <div className="relative rounded-2xl bg-slate-900 aspect-video flex flex-col justify-between p-3 sm:p-4 overflow-hidden shadow-inner text-white">
                {viewMode === 'teacher' && !isStudentPreview ? (
                  liveMediaStream && !isLiveCameraOff ? (
                    <video
                      ref={(el) => {
                        if (el && liveMediaStream && el.srcObject !== liveMediaStream) {
                          el.srcObject = liveMediaStream;
                          el.play().catch((err) => console.warn('Teacher camera play warning:', err));
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null
                ) : (
                  liveRemoteMediaStream && liveConnectionState === 'CONNECTED' && !isLiveCameraOff && activeLiveLectureSession?.hasVideo !== false ? (
                    <video
                      ref={(el) => {
                        if (el && liveRemoteMediaStream && el.srcObject !== liveRemoteMediaStream) {
                          el.srcObject = liveRemoteMediaStream;
                          el.play().catch((err) => console.warn('Student remote video play warning:', err));
                        }
                      }}
                      autoPlay
                      playsInline
                      muted={false}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null
                )}

                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE STREAM
                  </span>
                  <span className="text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {viewMode === 'teacher' && !isStudentPreview
                      ? (liveSessionActive ? 'Broadcasting Live' : 'Ready')
                      : liveConnectionState === 'CONNECTED'
                      ? 'Connected to Live Lecture'
                      : liveConnectionState === 'CONNECTING_MEDIA' || liveConnectionState === 'JOINING'
                      ? 'Connecting Media...'
                      : liveConnectionState === 'SESSION_ENDED'
                      ? 'Session Ended'
                      : liveSessionActive
                      ? 'Live Session Active'
                      : 'Ready'}
                  </span>
                </div>

                {/* Camera / Stream State Overlay */}
                {isStartingLiveClass ? (
                  <div className="text-center space-y-2 my-auto z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                    <p className="text-xs text-purple-200 font-semibold">Initializing camera and microphone stream...</p>
                  </div>
                ) : (viewMode !== 'teacher' || isStudentPreview) && (liveConnectionState === 'JOINING' || liveConnectionState === 'CONNECTING_MEDIA') ? (
                  <div className="text-center space-y-2 my-auto z-10 px-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                    <p className="text-xs text-purple-200 font-semibold">Isku xirayaa muuqaalka macallinka... (Connecting to live teacher stream...)</p>
                    <p className="text-[11px] text-purple-300/80">Establishing encrypted WebRTC media connection</p>
                  </div>
                ) : (viewMode !== 'teacher' || isStudentPreview) && liveConnectionState === 'CONNECTION_FAILED' ? (
                  <div className="text-center space-y-2 my-auto z-10 px-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-amber-200 max-w-sm mx-auto">{liveConnectionDetail || 'Xiriirka muuqaalka tooska ah ma suurtagelin (Live connection failed).'}</p>
                    <button
                      type="button"
                      onClick={() => activeLiveLectureSession && handleStudentJoinLiveLecture(activeLiveLectureSession)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Isku-day Mar Kale (Retry Connection)</span>
                    </button>
                  </div>
                ) : (viewMode !== 'teacher' || isStudentPreview) && liveConnectionState === 'SESSION_ENDED' ? (
                  <div className="text-center space-y-2 my-auto z-10 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <VideoOff className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-purple-200 font-semibold">Macallinku wuu soo gabagabeeyay duruska tooska ah (Live lecture has ended).</p>
                  </div>
                ) : liveSessionError && !liveMediaStream && viewMode === 'teacher' ? (
                  <div className="text-center space-y-2 my-auto z-10 px-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-amber-200 max-w-sm mx-auto">{liveSessionError}</p>
                    <button
                      type="button"
                      onClick={handleStartLiveClass}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Grant Camera Permission & Retry</span>
                    </button>
                  </div>
                ) : (viewMode === 'teacher' && (!liveMediaStream || isLiveCameraOff)) ||
                  ((viewMode !== 'teacher' || isStudentPreview) && (isLiveCameraOff || activeLiveLectureSession?.hasVideo === false || !liveRemoteMediaStream)) ? (
                  <div className="text-center space-y-2 my-auto z-10 px-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-white/40 flex items-center justify-center mx-auto text-xl font-extrabold shadow-xl text-white">
                      {(
                        activeLiveLectureSession?.teacherName ||
                        activeClassroom?.instructorName ||
                        teacherActiveClassroom?.instructorName ||
                        teacherProfile.name ||
                        'Instructor'
                      )
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-base font-extrabold text-white drop-shadow-xs">
                        {activeLiveLectureSession?.teacherName ||
                          activeClassroom?.instructorName ||
                          teacherActiveClassroom?.instructorName ||
                          teacherProfile.name ||
                          'Instructor'}
                      </h4>
                      <p className="text-xs text-purple-200">
                        {isLiveCameraOff || activeLiveLectureSession?.hasVideo === false
                          ? 'Kaamiradu waa dansan tahay · Codka oo kaliya ayaa socda (Camera Off · Audio Stream Active)'
                          : liveSessionActive
                          ? 'Durus Toos ah & Sabuurad Wadaag ah (Live Lecture & Whiteboard Stream)'
                          : 'Durus Toos ah'}
                      </p>
                    </div>
                    {viewMode === 'teacher' && !isStudentPreview && !liveMediaStream && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleStartLiveClass}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Turn Camera On</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-xs text-slate-300 z-10 pt-2 border-t border-white/10">
                  <span className="font-semibold truncate max-w-[200px] sm:max-w-none">
                    {activeLiveLectureSession?.title || activeClassroom?.title || teacherActiveClassroom?.title || 'Live Session'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLiveClassActiveTab('whiteboard')}
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-purple-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Pen className="w-3.5 h-3.5" />
                    <span>Open Live Whiteboard</span>
                  </button>
                </div>
              </div>

              {/* Live Media Controls Bar */}
              <div className="p-3 rounded-xl bg-[#FAF8FE] border border-[#EDE8F5] text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    (viewMode === 'teacher' && liveSessionActive) || (viewMode !== 'teacher' && liveConnectionState === 'CONNECTED')
                      ? 'bg-emerald-500 animate-pulse'
                      : liveConnectionState === 'CONNECTING_MEDIA' || liveConnectionState === 'JOINING'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  <span className="font-semibold">
                    {viewMode === 'teacher' && !isStudentPreview
                      ? (liveSessionActive ? 'Live Audio/Video Broadcasting' : 'Ready to Broadcast')
                      : liveConnectionState === 'CONNECTED'
                      ? 'Live Cohort Connected (Receiving Stream)'
                      : liveConnectionState === 'CONNECTING_MEDIA' || liveConnectionState === 'JOINING'
                      ? 'Connecting to Teacher Stream...'
                      : liveConnectionState === 'SESSION_ENDED'
                      ? 'Session Ended by Instructor'
                      : liveSessionActive
                      ? 'Live Session Available'
                      : 'Attendance Session'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'teacher' && !isStudentPreview && liveMediaStream && (
                    <>
                      <button
                        type="button"
                        onClick={handleToggleLiveCamera}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                          isLiveCameraOff
                            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isLiveCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                        <span>{isLiveCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleLiveMic}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                          isLiveMicMuted
                            ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isLiveMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isLiveMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                      </button>
                    </>
                  )}
                  {(viewMode !== 'teacher' || isStudentPreview) && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {liveConnectionState === 'CONNECTED' ? 'WebRTC P2P Active' : liveConnectionState}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Classroom Whiteboard */}
          {liveClassActiveTab === 'whiteboard' && (
            <div className="w-full">
              <ClassroomWhiteboard
                classroomId={
                  liveSessionClassroomId ||
                  activeLiveLectureSession?.classroomId ||
                  activeClassroom?.id ||
                  teacherActiveClassroom?.id ||
                  enrolledClassrooms[0]?.id ||
                  teacherClassrooms[0]?.id ||
                  'cls-math-101'
                }
                classroomTitle={
                  activeLiveLectureSession?.title ||
                  activeClassroom?.title ||
                  teacherActiveClassroom?.title ||
                  enrolledClassrooms[0]?.title ||
                  'Interactive Whiteboard'
                }
                teacherName={
                  activeLiveLectureSession?.teacherName ||
                  activeClassroom?.instructorName ||
                  teacherActiveClassroom?.instructorName ||
                  enrolledClassrooms[0]?.instructorName ||
                  teacherProfile.name ||
                  'Instructor'
                }
                isTeacher={viewMode === 'teacher' && !isStudentPreview}
                onClose={() => setIsLiveSessionModalOpen(false)}
                onSavedToStudyMaterial={() => {
                  const targetId =
                    liveSessionClassroomId ||
                    activeLiveLectureSession?.classroomId ||
                    activeClassroom?.id ||
                    teacherActiveClassroom?.id;
                  if (targetId) {
                    setClassroomStudyMaterials(studyMaterialService.getMaterials(targetId));
                  }
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Email Authentication Modal Dialog */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title={t('landing.emailModalTitle')}
        description={t('landing.emailModalDesc')}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEmailModalOpen(false)}
            >
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (emailInput) {
                  updatePersonalInfo({ email: emailInput });
                }
                setIsEmailModalOpen(false);
                setCurrentScreen('roles');
              }}
            >
              {t('common.continue')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            label={t('landing.enterEmail')}
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={t('landing.emailPlaceholder')}
            leftIcon={<Mail className="w-5 h-5" />}
            autoFocus
          />
        </form>
      </Modal>

      {/* Other Roles Notice Modal Dialog */}
      <Modal
        isOpen={isNextStepNoticeOpen}
        onClose={() => setIsNextStepNoticeOpen(false)}
        title={t('dialog.nextStepTitle', { role: getRoleDisplayName(currentRole) })}
        description={t('dialog.nextStepDesc', { role: getRoleDisplayName(currentRole) })}
        footer={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNextStepNoticeOpen(false)}
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8F7FD] border border-[#EAE6F8]">
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              {t('dialog.nextStepNotice')}
            </p>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 text-xs sm:text-sm font-semibold text-[#7C3AED]">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {t('nav.step1Title')} · {getRoleDisplayName(currentRole)}
            </span>
          </div>
        </div>
      </Modal>

      {/* Course Overview & Syllabus Modal Dialog */}
      <Modal
        isOpen={isCourseOverviewOpen}
        onClose={() => setIsCourseOverviewOpen(false)}
        title={selectedCurriculumCourse?.name || selectedCurriculumSubject?.name || 'Course Overview'}
        description={`${selectedCurriculumSubject?.name || ''} · ${selectedCurriculumLevel}`}
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCourseOverviewOpen(false)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsCourseOverviewOpen(false);
                  setResultsTeacherSearch('');
                  setTeacherStep('results');
                }}
              >
                Find Teachers
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsCourseOverviewOpen(false);
                  setCurrentScreen('homework');
                }}
              >
                Start Learning
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-start">
          <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE8F5]">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Course Description & Objectives
            </h4>
            <p className="text-sm text-[#1E1B4B] mt-1.5 leading-relaxed">
              {selectedCurriculumCourse?.description ||
                selectedCurriculumSubject?.description ||
                'Comprehensive syllabus sequence aligned with global academic standards and structured for conceptual mastery.'}
            </p>
          </div>

          {/* Topics and modules */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Course Syllabus Modules ({((selectedCurriculumCourse?.topics && selectedCurriculumCourse.topics.length > 0) ? selectedCurriculumCourse.topics : (selectedCurriculumSubject?.topics || [])).length} Units)
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {((selectedCurriculumCourse?.topics && selectedCurriculumCourse.topics.length > 0)
                ? selectedCurriculumCourse.topics
                : selectedCurriculumSubject?.topics || []
              ).map((topicItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-[#EDE8F5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-purple-50 text-[#7C3AED] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#1E1B4B]">{topicItem}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Core Unit</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">Verified Learning Pathway:</span> Course syllabus includes interactive homework help, practice tests, and verified teacher office-hour availability.
            </div>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* EDUCATE-STYLE BOTTOM SHEET: "WHAT YOU GET"                     */}
      {/* ============================================================== */}
      {isInsideSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('landing.sheet.title')}
          className="fixed inset-0 z-50 flex flex-col justify-end"
        >
          {/* Dimmed & slightly blurred backdrop (non-interactive landing page) */}
          <div
            onClick={() => setIsInsideSheetOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Bottom Sheet Surface */}
          <div
            className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-[32px] sm:rounded-t-[36px] shadow-[0_-12px_48px_rgba(20,10,50,0.22)] border-t border-x border-[#EDE8F5] px-6 sm:px-8 pt-3 pb-8 sm:pb-10 space-y-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto text-start"
          >
            {/* Top Drag Handle */}
            <div className="flex justify-center pt-1 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Header: "What you get" + subtle close control */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                {t('landing.sheet.title')}
              </h2>
              <button
                type="button"
                onClick={() => setIsInsideSheetOpen(false)}
                aria-label={t('common.close')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Simple Feature Rows */}
            <div className="space-y-4 sm:space-y-5 pt-1">
              {/* Row 1: Live classes in one tap */}
              <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE8F5]/80">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-purple-100/70 text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
                  <Video className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug">
                    {t('landing.sheet.row1.title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                    {t('landing.sheet.row1.subtitle')}
                  </p>
                </div>
              </div>

              {/* Row 2: Study materials in one place */}
              <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#EDE8F5]/80">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug">
                    {t('landing.sheet.row2.title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                    {t('landing.sheet.row2.subtitle')}
                  </p>
                </div>
              </div>

              {/* Row 3: Tests graded instantly */}
              <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-[#EDE8F5]/80">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug">
                    {t('landing.sheet.row3.title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
                    {t('landing.sheet.row3.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsInsideSheetOpen(false);
                  setCurrentScreen('roles');
                }}
                className="w-full h-14 sm:h-15 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-base sm:text-lg font-bold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7C3AED]/40 active:scale-[0.99]"
              >
                <span>{t('landing.sheet.cta')}</span>
                <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <StudentProvider>
          <AppContent />
        </StudentProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
