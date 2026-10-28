/**
 * SmartEducate User, Role & Access Control State Context
 * Single source of truth for in-memory and persisted role, student profile,
 * teacher preview state, and role switching.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  StudentAcademicProfile,
  StudentCourseItem,
  StudentPersonalInfo,
  StudentProfile,
  StudentUniversityInfo,
  TeacherProfile,
  UserRole,
  ViewMode,
  createInitialTeacherProfile,
} from '../types/student';
import {
  GlobalClassroom,
  ClassroomAnnouncement,
  TimetableEntry,
  GeneratedTeacherMaterial,
  StudentCertificate,
  ClassroomStudentItem,
} from '../types/education';
import { GLOBAL_CLASSROOMS } from '../data/globalEducation';
import {
  loadCanonicalStudentProfile,
  resetCanonicalStudentProfile,
  saveCanonicalStudentProfile,
  loadCanonicalEnrolledClassrooms,
  saveCanonicalEnrolledClassrooms,
} from './storage';
import { authService, UserAccountProfile } from '../services/authService';
import { collection, query, where, getDocs, getDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { classroomCallService } from '../services/classroomCallService';
import { coTeacherService } from '../services/coTeacherService';

const INITIAL_CERTIFICATES: StudentCertificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'SE-2026-9042',
    studentName: 'Nimco Nuura',
    studentEmail: 'nimco.nuura@university.edu',
    courseTitle: 'Calculus & Linear Algebra (MATH-101)',
    classroomCode: 'MATH-101',
    achievement: 'Distinction — 96% Final Score',
    issueDate: 'October 2026',
    instructorName: 'Prof. Marcus Vance',
    institutionOrTutor: 'University of Oxford',
    status: 'approved',
    teacherSignatureStamp: true,
    issuedAt: '2026-10-01',
  },
  {
    id: 'cert-2',
    certificateNumber: 'SE-2026-9043',
    studentName: 'Ahmed Farah',
    studentEmail: 'ahmed.f@university.edu',
    courseTitle: 'Calculus & Linear Algebra (MATH-101)',
    classroomCode: 'MATH-101',
    achievement: 'Merit — 88% Final Score',
    issueDate: 'October 2026',
    instructorName: 'Prof. Marcus Vance',
    institutionOrTutor: 'University of Oxford',
    status: 'pending_review',
    teacherSignatureStamp: false,
  },
  {
    id: 'cert-3',
    certificateNumber: 'SE-2026-9044',
    studentName: 'Lucas Silva',
    studentEmail: 'lucas.s@usp.br',
    courseTitle: 'Calculus & Linear Algebra (MATH-101)',
    classroomCode: 'MATH-101',
    achievement: 'Completed Coursework — 78% Final Score',
    issueDate: 'October 2026',
    instructorName: 'Prof. Marcus Vance',
    institutionOrTutor: 'University of Oxford',
    status: 'pending_review',
    teacherSignatureStamp: false,
  },
];

export interface SyncEnrollmentResult {
  success: boolean;
  message: string;
  alreadyExisted?: boolean;
  classroom?: GlobalClassroom;
}

export interface StudentContextType {
  profile: StudentProfile;
  actualRole: UserRole;
  viewMode: ViewMode;
  availableRoles: UserRole[];
  teacherProfile: TeacherProfile;
  isStudentPreview: boolean;
  hasTeacherAccess: boolean;
  teacherClassrooms: GlobalClassroom[];
  activeClassroomId: string;
  setActiveClassroomId: (id: string) => void;
  createTeacherClassroom: (classroom: Omit<GlobalClassroom, 'id'>) => Promise<GlobalClassroom>;
  fetchTeacherClassrooms: (uid: string) => Promise<GlobalClassroom[]>;
  refreshTeacherClassrooms: () => Promise<GlobalClassroom[]>;
  refreshCoTeacherCounts: () => Promise<void>;
  fetchStudentEnrolledClassrooms: (uid: string) => Promise<GlobalClassroom[]>;
  enrolledClassrooms: GlobalClassroom[];
  enrollInClassroom: (classroom: GlobalClassroom) => Promise<boolean>;
  syncOrRepairEnrollment: (classroomOrCode: GlobalClassroom | string) => Promise<SyncEnrollmentResult>;
  activeClassroomRoster: ClassroomStudentItem[];
  isRosterLoading: boolean;
  rosterError: string | null;
  refreshActiveRoster: () => Promise<void>;
  announcements: Record<string, ClassroomAnnouncement[]>;
  postAnnouncement: (classroomId: string, content: string) => void;
  setRole: (role: UserRole) => void;
  switchViewMode: (mode: ViewMode) => void;
  updatePersonalInfo: (data: Partial<StudentPersonalInfo>) => void;
  updateUniversityInfo: (data: Partial<StudentUniversityInfo>) => void;
  updateAcademicProfile: (data: Partial<StudentAcademicProfile>) => void;
  updateTeacherProfile: (data: Partial<TeacherProfile>) => void;
  setCourses: (courses: StudentCourseItem[]) => void;
  setCurrentStep: (stepNumber: number) => void;
  setVoicePreference: (voice: 'female' | 'male') => void;
  setAiTutorLanguage: (lang: string) => void;
  resetProfile: () => void;
  isLoading: boolean;
  // Phase 09 Extensions
  timetableEntries: TimetableEntry[];
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  removeTimetableEntry: (id: string) => void;
  studentCertificates: StudentCertificate[];
  approveCertificate: (certId: string) => void;
  issueCertificate: (certId: string) => void;
  generatedMaterials: GeneratedTeacherMaterial[];
  addGeneratedMaterial: (mat: GeneratedTeacherMaterial) => void;
  // Real Firebase Authentication Extensions
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  userAccount: UserAccountProfile | null;
  signOutUser: () => Promise<void>;
  applyAuthenticatedProfile: (userAccount: UserAccountProfile) => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(loadCanonicalStudentProfile);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(createInitialTeacherProfile);
  const [teacherClassrooms, setTeacherClassrooms] = useState<GlobalClassroom[]>([]);
  const [activeClassroomId, setActiveClassroomId] = useState<string>('');
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<GlobalClassroom[]>([]);
  const activeAuthUidRef = useRef<string | null>(null);
  const [announcements, setAnnouncements] = useState<Record<string, ClassroomAnnouncement[]>>({
    'cls-101': [
      {
        id: 'ann-1',
        author: 'Prof. Marcus Vance',
        date: 'Yesterday at 10:30 AM',
        content: 'Welcome everyone! Problem Set 1 will be posted on Thursday. Please review Chapter 2 on linear vector spaces.',
      },
    ],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Timetable is initially empty as required by Phase 09 specification
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [studentCertificates, setStudentCertificates] = useState<StudentCertificate[]>(INITIAL_CERTIFICATES);
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedTeacherMaterial[]>([]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [userAccount, setUserAccount] = useState<UserAccountProfile | null>(null);

  const fetchTeacherClassrooms = useCallback(async (uid: string): Promise<GlobalClassroom[]> => {
    try {
      // 1. Query classrooms where user is the primary instructor
      const qOwned = query(collection(db, 'classrooms'), where('instructorId', '==', uid));
      // 2. Query classrooms where user is an authorized co-teacher
      const qCoTeacher = query(collection(db, 'classrooms'), where('coTeacherIds', 'array-contains', uid));

      const [snapOwned, snapCoTeacher] = await Promise.all([
        getDocs(qOwned).catch((e) => {
          console.warn('Error querying owned classrooms:', e);
          return { docs: [] };
        }),
        getDocs(qCoTeacher).catch((e) => {
          console.warn('Error querying co-taught classrooms:', e);
          return { docs: [] };
        }),
      ]);

      const docMap = new Map<string, { data: any; isOwner: boolean }>();
      snapOwned.docs.forEach((d) => docMap.set(d.id, { data: d.data(), isOwner: true }));
      snapCoTeacher.docs.forEach((d) => {
        if (!docMap.has(d.id)) {
          docMap.set(d.id, { data: d.data(), isOwner: false });
        }
      });

      const list: GlobalClassroom[] = await Promise.all(
        Array.from(docMap.entries()).map(async ([docId, item]) => {
          const data = item.data;
          const classroomId = data.id || docId;
          let realCount = 0;
          try {
            const enrollmentsSnap = await getDocs(collection(db, 'classrooms', classroomId, 'enrollments'));
            realCount = enrollmentsSnap.size;
          } catch (e) {
            console.warn('Could not load enrollments count for classroom', classroomId, e);
            realCount = typeof data.enrolledStudents === 'number' ? data.enrolledStudents : 0;
          }
          const isOwner = data.instructorId === uid || item.isOwner;
          return {
            id: classroomId,
            code: data.code || 'CODE',
            title: data.title || 'Untitled Classroom',
            subject: data.subject || 'General Education',
            instructorName: data.instructorName || 'Instructor',
            institution: data.institution || 'SmartEducate Global',
            category: data.category || 'university',
            enrolledStudents: realCount,
            status: data.status || 'active',
            instructorId: data.instructorId || uid,
            coTeacherIds: Array.isArray(data.coTeacherIds) ? data.coTeacherIds : [],
            isCoTeacher: !isOwner,
          };
        })
      );

      setTeacherClassrooms(list);
      let targetClassroomId = '';
      if (list.length > 0) {
        setActiveClassroomId((prev) => {
          const matched = prev && list.some((c) => c.id === prev) ? prev : list[0].id;
          targetClassroomId = matched;
          return matched;
        });
      } else {
        setActiveClassroomId('');
      }

      // Synchronize live co-teacher and pending invitation counts
      const effectiveClassroomId = targetClassroomId || (list.length > 0 ? list[0].id : '');
      const userEmail = auth.currentUser?.email || '';
      if (effectiveClassroomId || userEmail || uid) {
        coTeacherService
          .getCoTeacherCounts(effectiveClassroomId, userEmail, uid)
          .then((counts) => {
            setTeacherProfile((prev) => ({
              ...prev,
              coTeachersCount: counts.coTeachersCount,
              pendingCoTeachersCount: counts.pendingInvites,
            }));
          })
          .catch(() => {});
      }

      return list;
    } catch (err) {
      console.warn('Error loading teacher classrooms from Firestore:', err);
      setTeacherClassrooms([]);
      setActiveClassroomId('');
      return [];
    }
  }, []);

  const refreshTeacherClassrooms = useCallback(async (): Promise<GlobalClassroom[]> => {
    const uid = auth.currentUser?.uid || userAccount?.id;
    if (!uid) return [];
    return fetchTeacherClassrooms(uid);
  }, [fetchTeacherClassrooms, userAccount?.id]);

  const refreshCoTeacherCounts = useCallback(async (): Promise<void> => {
    const uid = auth.currentUser?.uid || userAccount?.id || '';
    const email = auth.currentUser?.email || userAccount?.email || '';
    if (!activeClassroomId && !email && !uid) return;
    try {
      const counts = await coTeacherService.getCoTeacherCounts(activeClassroomId, email, uid);
      setTeacherProfile((prev) => ({
        ...prev,
        coTeachersCount: counts.coTeachersCount,
        pendingCoTeachersCount: counts.pendingInvites,
      }));
    } catch (e) {
      console.warn('Could not refresh co-teacher counts:', e);
    }
  }, [activeClassroomId, userAccount?.id, userAccount?.email]);

  /**
   * Authoritatively discovers and loads all classrooms where the student
   * has an enrollment record (/classrooms/{classroomId}/enrollments/{uid}) in Firestore.
   */
  const fetchStudentEnrolledClassrooms = useCallback(async (uid: string): Promise<GlobalClassroom[]> => {
    if (!uid) return [];
    try {
      const classroomsSnap = await getDocs(collection(db, 'classrooms'));
      if (classroomsSnap.empty) {
        return [];
      }

      const results = await Promise.all(
        classroomsSnap.docs.map(async (cDoc) => {
          try {
            const enrollmentRef = doc(db, 'classrooms', cDoc.id, 'enrollments', uid);
            const enrollmentSnap = await getDoc(enrollmentRef);
            if (enrollmentSnap.exists()) {
              const data = cDoc.data();
              let count = typeof data.enrolledStudents === 'number' ? data.enrolledStudents : 0;
              try {
                const enrollSnap = await getDocs(collection(db, 'classrooms', cDoc.id, 'enrollments'));
                count = enrollSnap.size;
              } catch (e) {
                // Fallback to field count
              }
              const cls: GlobalClassroom = {
                id: cDoc.id,
                code: data.code || 'CODE',
                title: data.title || 'Classroom',
                subject: data.subject || 'General Education',
                instructorName: data.instructorName || 'Instructor',
                institution: data.institution || 'SmartEducate Global',
                category: data.category || 'university',
                enrolledStudents: count,
                status: data.status || 'active',
                instructorId: data.instructorId || '',
              };
              return cls;
            }
          } catch (err) {
            console.warn(`Error checking enrollment for classroom ${cDoc.id}:`, err);
          }
          return null;
        })
      );

      const verifiedClassrooms = results.filter((c): c is GlobalClassroom => c !== null);
      return verifiedClassrooms;
    } catch (err) {
      console.warn('Error fetching student enrolled classrooms from Firestore:', err);
      return [];
    }
  }, []);

  const applyAuthenticatedProfile = useCallback((acc: UserAccountProfile) => {
    setUserAccount(acc);
    setIsAuthenticated(true);
    const isTeacher = acc.role === 'teacher' || acc.role === 'lecturer';
    setProfile((prev) => ({
      ...prev,
      id: acc.id,
      role: acc.role,
      actualRole: acc.role,
      viewMode: acc.viewMode || (isTeacher ? 'teacher' : 'student'),
      availableRoles: isTeacher ? ['teacher', 'student'] : ['student'],
      personalInfo: {
        ...prev.personalInfo,
        fullName: acc.fullName || prev.personalInfo.fullName,
        email: acc.email || prev.personalInfo.email,
      },
    }));
    if (isTeacher) {
      setTeacherProfile((prev) => ({
        ...prev,
        id: acc.id,
        name: acc.fullName || prev.name,
        email: acc.email || prev.email,
        coTeachersCount: 0,
        pendingCoTeachersCount: 0,
        activeClassroomId: '',
      }));
    }
  }, []);

  const signOutUser = useCallback(async () => {
    activeAuthUidRef.current = null;
    await authService.signOut();
    setIsAuthenticated(false);
    setUserAccount(null);
    setTeacherClassrooms([]);
    setActiveClassroomId('');
    setEnrolledClassrooms([]);
    resetCanonicalStudentProfile();
    classroomCallService.clearIncomingListeners();
  }, []);

  // Sync auth state with Firebase Auth on mount
  useEffect(() => {
    const unsub = authService.onAuthStateChanged(async (firebaseUser) => {
      const currentUid = firebaseUser ? firebaseUser.uid : null;
      activeAuthUidRef.current = currentUid;

      if (firebaseUser) {
        const uid = firebaseUser.uid;

        // 1. Initial hydration from user-scoped localStorage cache (fast initial UI render)
        const cached = loadCanonicalEnrolledClassrooms(uid);
        if (activeAuthUidRef.current === uid && cached.length > 0) {
          setEnrolledClassrooms(cached);
        }

        // 2. Fetch authenticated profile from Firestore
        const acc = await authService.getUserProfile(uid, firebaseUser.email || '');
        if (activeAuthUidRef.current !== uid) return; // Prevent race conditions

        if (acc) {
          applyAuthenticatedProfile(acc);
          if (acc.role === 'teacher' || acc.role === 'lecturer') {
            await fetchTeacherClassrooms(uid);
          } else {
            setTeacherClassrooms([]);
            setActiveClassroomId('');
          }
        } else {
          const fallbackAcc: UserAccountProfile = {
            id: uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'Learner',
            role: 'student',
            viewMode: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          applyAuthenticatedProfile(fallbackAcc);
          setTeacherClassrooms([]);
          setActiveClassroomId('');
        }

        if (activeAuthUidRef.current !== uid) return; // Prevent race conditions

        // 3. Authoritative backend enrollment hydration from Firestore
        try {
          const authoritativeEnrolled = await fetchStudentEnrolledClassrooms(uid);
          if (activeAuthUidRef.current === uid) {
            setEnrolledClassrooms(authoritativeEnrolled);
            saveCanonicalEnrolledClassrooms(authoritativeEnrolled, uid);

            if (authoritativeEnrolled.length > 0) {
              setActiveClassroomId((prev) =>
                prev && authoritativeEnrolled.some((c) => c.id === prev) ? prev : authoritativeEnrolled[0].id
              );
            }
          }
        } catch (fetchErr) {
          console.warn('Error during authoritative enrollment hydration:', fetchErr);
        }
      } else {
        // Unauthenticated or explicitly signed out
        setIsAuthenticated(false);
        setUserAccount(null);
        setTeacherClassrooms([]);
        setActiveClassroomId('');
        setEnrolledClassrooms([]);
        classroomCallService.clearIncomingListeners();
      }
      setIsAuthChecking(false);
    });

    return () => unsub();
  }, [applyAuthenticatedProfile, fetchTeacherClassrooms, fetchStudentEnrolledClassrooms]);

  // Synchronize state changes to the single canonical storage key
  useEffect(() => {
    saveCanonicalStudentProfile(profile);
  }, [profile]);

  const actualRole: UserRole = profile.actualRole || profile.role || 'student';
  const viewMode: ViewMode = profile.viewMode || (actualRole === 'lecturer' || actualRole === 'teacher' ? 'teacher' : 'student');
  const availableRoles: UserRole[] = profile.availableRoles || (actualRole === 'lecturer' || actualRole === 'teacher' ? ['teacher', 'student'] : ['student']);

  const isTeacherRole = actualRole === 'teacher' || actualRole === 'lecturer';
  const hasTeacherAccess = isTeacherRole || availableRoles.includes('teacher');
  const isStudentPreview = hasTeacherAccess && viewMode === 'student';

  const createTeacherClassroom = useCallback(
    async (classroomData: Omit<GlobalClassroom, 'id'>): Promise<GlobalClassroom> => {
      const newClassroom: GlobalClassroom = {
        ...classroomData,
        id: 'cls-' + Date.now().toString(36),
        enrolledStudents: typeof classroomData.enrolledStudents === 'number' ? classroomData.enrolledStudents : 0,
      };

      setTeacherClassrooms((prev) => [newClassroom, ...prev]);
      setActiveClassroomId(newClassroom.id);

      // Persist to Firestore: server-side rules verify isTeacher() and instructorId
      if (auth.currentUser) {
        try {
          const classroomDoc = doc(db, 'classrooms', newClassroom.id);
          await setDoc(classroomDoc, {
            id: newClassroom.id,
            code: newClassroom.code,
            title: newClassroom.title,
            subject: newClassroom.subject || 'General Education',
            instructorId: auth.currentUser.uid,
            instructorName: newClassroom.instructorName || auth.currentUser.displayName || 'Instructor',
            institution: newClassroom.institution || 'SmartEducate Global',
            category: newClassroom.category || 'university',
            enrolledStudents: newClassroom.enrolledStudents || 0,
            status: newClassroom.status || 'active',
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Server-side Firestore error saving classroom:', err);
          handleFirestoreError(err, OperationType.WRITE, `classrooms/${newClassroom.id}`);
          throw err;
        }
      }

      return newClassroom;
    },
    []
  );

  const [activeClassroomRoster, setActiveClassroomRoster] = useState<ClassroomStudentItem[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const refreshActiveRoster = useCallback(async () => {
    if (!activeClassroomId || !auth.currentUser) {
      setActiveClassroomRoster([]);
      return;
    }
    setIsRosterLoading(true);
    setRosterError(null);
    try {
      const snap = await getDocs(collection(db, 'classrooms', activeClassroomId, 'enrollments'));
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
      setActiveClassroomRoster(students);
      setTeacherClassrooms((prev) =>
        prev.map((c) => (c.id === activeClassroomId ? { ...c, enrolledStudents: snap.size } : c))
      );
    } catch (err) {
      console.warn('Error refreshing classroom roster:', err);
      setRosterError('Failed to refresh roster records');
    } finally {
      setIsRosterLoading(false);
    }
  }, [activeClassroomId]);

  // Real-time synchronization of active classroom enrollments
  useEffect(() => {
    if (!activeClassroomId || !auth.currentUser) {
      setActiveClassroomRoster([]);
      setIsRosterLoading(false);
      setRosterError(null);
      return;
    }

    const isTeacher =
      userAccount?.role === 'teacher' ||
      userAccount?.role === 'lecturer' ||
      profile.actualRole === 'teacher';
    if (!isTeacher) return;

    setIsRosterLoading(true);
    setRosterError(null);

    const enrollmentsCol = collection(db, 'classrooms', activeClassroomId, 'enrollments');
    const unsub = onSnapshot(
      enrollmentsCol,
      (snapshot) => {
        const students: ClassroomStudentItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.studentId || d.id,
            name: data.studentName || 'Student',
            email: data.studentEmail || '',
            enrolledDate: data.enrolledDate || 'Recently',
            status: (data.status as 'active' | 'pending') || 'active',
          };
        });
        setActiveClassroomRoster(students);
        setIsRosterLoading(false);
        setRosterError(null);

        // Update count for active classroom in teacherClassrooms
        setTeacherClassrooms((prev) =>
          prev.map((c) => (c.id === activeClassroomId ? { ...c, enrolledStudents: snapshot.size } : c))
        );
      },
      (err) => {
        console.warn('Error in roster snapshot listener:', err);
        setIsRosterLoading(false);
        setRosterError('Failed to load real-time roster');
      }
    );

    return () => unsub();
  }, [activeClassroomId, userAccount?.role, profile.actualRole]);

  const syncOrRepairEnrollment = useCallback(
    async (classroomOrCode: GlobalClassroom | string): Promise<SyncEnrollmentResult> => {
      // 1. Auth check
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          message: 'Please sign in to your student account to sync enrollment with Firestore.',
        };
      }

      // 2. Role and Teacher-Preview check (Requirement 5)
      const currentActualRole = profile.actualRole || userAccount?.role || profile.role;
      const isTeacher =
        currentActualRole === 'teacher' ||
        currentActualRole === 'lecturer' ||
        isStudentPreview ||
        (profile.availableRoles && profile.availableRoles.includes('teacher'));

      if (isTeacher) {
        return {
          success: false,
          message:
            "You are currently signed in with a Teacher account (or using Teacher student preview). To record student enrollment on the teacher roster, please sign out and sign in using the student's separate account.",
        };
      }

      // 3. Resolve the real Firestore classroom document by ID or verified code (Requirement 3)
      let targetCode = '';
      let targetId = '';

      if (typeof classroomOrCode === 'string') {
        targetCode = classroomOrCode.trim().toUpperCase();
      } else {
        targetCode = (classroomOrCode.code || '').trim().toUpperCase();
        targetId = classroomOrCode.id || '';
      }

      let realClassroomId = '';
      let realClassroomData: GlobalClassroom | null = null;

      // First try by ID if it exists
      if (targetId) {
        try {
          const docSnap = await getDoc(doc(db, 'classrooms', targetId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            realClassroomId = docSnap.id;
            realClassroomData = {
              id: docSnap.id,
              code: data.code || targetCode,
              title: data.title || (typeof classroomOrCode === 'object' ? classroomOrCode.title : 'Classroom'),
              subject: data.subject || (typeof classroomOrCode === 'object' ? classroomOrCode.subject : 'General Education'),
              instructorName: data.instructorName || (typeof classroomOrCode === 'object' ? classroomOrCode.instructorName : 'Instructor'),
              institution: data.institution || (typeof classroomOrCode === 'object' ? classroomOrCode.institution : 'SmartEducate Global'),
              category: data.category || (typeof classroomOrCode === 'object' ? classroomOrCode.category : 'university'),
              enrolledStudents: typeof data.enrolledStudents === 'number' ? data.enrolledStudents : 0,
              status: data.status || 'active',
            };
          }
        } catch (idErr) {
          console.warn('Could not fetch classroom by ID:', idErr);
        }
      }

      // If not resolved by ID and we have targetCode, query collection('classrooms') by code
      if (!realClassroomId && targetCode) {
        try {
          const q = query(collection(db, 'classrooms'), where('code', '==', targetCode));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const firstDoc = snap.docs[0];
            const data = firstDoc.data();
            realClassroomId = firstDoc.id;
            realClassroomData = {
              id: firstDoc.id,
              code: data.code || targetCode,
              title: data.title || (typeof classroomOrCode === 'object' ? classroomOrCode.title : 'Classroom'),
              subject: data.subject || (typeof classroomOrCode === 'object' ? classroomOrCode.subject : 'General Education'),
              instructorName: data.instructorName || (typeof classroomOrCode === 'object' ? classroomOrCode.instructorName : 'Instructor'),
              institution: data.institution || (typeof classroomOrCode === 'object' ? classroomOrCode.institution : 'SmartEducate Global'),
              category: data.category || (typeof classroomOrCode === 'object' ? classroomOrCode.category : 'university'),
              enrolledStudents: typeof data.enrolledStudents === 'number' ? data.enrolledStudents : 0,
              status: data.status || 'active',
            };
          }
        } catch (queryErr) {
          console.error('Failed to query classroom by code:', queryErr);
          return {
            success: false,
            message: 'Failed to connect to Firestore to resolve classroom. Please check your network connection.',
          };
        }
      }

      if (!realClassroomId || !realClassroomData) {
        return {
          success: false,
          message: `Classroom "${targetCode || targetId}" was not found in Firestore cloud database. Please verify the classroom code with your teacher.`,
        };
      }

      // 4. Idempotent check & creation (Requirement 4)
      const enrollmentDocRef = doc(db, 'classrooms', realClassroomId, 'enrollments', user.uid);
      let alreadyExisted = false;

      try {
        const existingSnap = await getDoc(enrollmentDocRef);
        if (existingSnap.exists()) {
          alreadyExisted = true;
        } else {
          const enrollmentData = {
            id: user.uid,
            classroomId: realClassroomId,
            studentId: user.uid,
            studentName: (user.displayName || userAccount?.fullName || profile.personalInfo.fullName || 'Student').slice(0, 128),
            studentEmail: (user.email || profile.personalInfo.email || '').slice(0, 256),
            enrolledDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          await setDoc(enrollmentDocRef, enrollmentData);
        }
      } catch (err: any) {
        console.error('Error writing enrollment document to Firestore:', err);
        return {
          success: false,
          message: `Firestore enrollment sync failed: ${err?.message || 'Permission or network error'}. Enrollment was not saved to Firestore.`,
        };
      }

      // 5. Update local state and canonical storage with authoritative classroom data
      setEnrolledClassrooms((prev) => {
        const filtered = prev.filter(
          (c) => c.id !== realClassroomId && c.code.trim().toUpperCase() !== realClassroomData!.code.trim().toUpperCase()
        );
        const updated = [
          {
            ...realClassroomData!,
            enrolledStudents: (realClassroomData!.enrolledStudents || 0) + (alreadyExisted ? 0 : 1),
          },
          ...filtered,
        ];
        saveCanonicalEnrolledClassrooms(updated, user.uid);
        return updated;
      });

      return {
        success: true,
        alreadyExisted,
        classroom: realClassroomData,
        message: alreadyExisted
          ? `Enrollment for ${realClassroomData.code} is already verified and active in Firestore.`
          : `Enrollment for ${realClassroomData.code} successfully synced to Firestore! You now appear on the teacher roster.`,
      };
    },
    [userAccount, profile.actualRole, profile.role, isStudentPreview, profile.availableRoles, profile.personalInfo]
  );

  const enrollInClassroom = useCallback(
    async (classroom: GlobalClassroom): Promise<boolean> => {
      const res = await syncOrRepairEnrollment(classroom);
      if (!res.success) {
        throw new Error(res.message);
      }
      return true;
    },
    [syncOrRepairEnrollment]
  );

  const postAnnouncement = useCallback(
    (classroomId: string, content: string) => {
      const newAnn: ClassroomAnnouncement = {
        id: 'ann-' + Date.now().toString(36),
        author: teacherProfile.name || 'Instructor',
        date: 'Just now',
        content,
      };
      setAnnouncements((prev) => ({
        ...prev,
        [classroomId]: [newAnn, ...(prev[classroomId] || [])],
      }));
    },
    [teacherProfile.name]
  );

  const setRole = useCallback((newRole: UserRole) => {
    setProfile((prev) => {
      const currentActual = prev.actualRole || prev.role;
      const isCurrentlyTeacher = currentActual === 'teacher' || currentActual === 'lecturer';
      // Security guard: If user is a student, forbid escalating role to teacher/lecturer
      if (!isCurrentlyTeacher && (newRole === 'teacher' || newRole === 'lecturer')) {
        console.warn('[Security Guard] Unauthorized role escalation attempt blocked.');
        return prev;
      }

      const isTeacher = newRole === 'teacher' || newRole === 'lecturer';
      return {
        ...prev,
        role: newRole,
        actualRole: newRole,
        viewMode: isTeacher ? 'teacher' : 'student',
        availableRoles: isTeacher ? ['teacher', 'student'] : ['student'],
      };
    });
  }, []);

  const switchViewMode = useCallback((mode: ViewMode) => {
    // Only users with teacher permissions can toggle view modes (e.g. previewing student view)
    setProfile((prev) => {
      const currentActual = prev.actualRole || prev.role;
      const isTeacher = currentActual === 'teacher' || currentActual === 'lecturer';
      if (!isTeacher) {
        console.warn('[Security Guard] Student cannot switch to teacher dashboard view.');
        return prev; // Deny unauthorized view switching
      }

      if (prev.id && !prev.id.startsWith('student_draft_')) {
        authService.updateViewMode(prev.id, mode).catch(() => {});
      }

      return {
        ...prev,
        viewMode: mode,
      };
    });
  }, []);

  const updatePersonalInfo = useCallback((data: Partial<StudentPersonalInfo>) => {
    setProfile((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        ...data,
      },
    }));
  }, []);

  const updateUniversityInfo = useCallback((data: Partial<StudentUniversityInfo>) => {
    setProfile((prev) => ({
      ...prev,
      universityInfo: {
        ...prev.universityInfo,
        ...data,
      },
    }));
  }, []);

  const updateAcademicProfile = useCallback((data: Partial<StudentAcademicProfile>) => {
    setProfile((prev) => ({
      ...prev,
      academicProfile: {
        ...prev.academicProfile,
        ...data,
      },
    }));
  }, []);

  const updateTeacherProfile = useCallback((data: Partial<TeacherProfile>) => {
    setTeacherProfile((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  const setCourses = useCallback((courses: StudentCourseItem[]) => {
    setProfile((prev) => ({
      ...prev,
      courses,
    }));
  }, []);

  const setCurrentStep = useCallback((stepNumber: number) => {
    setProfile((prev) => ({
      ...prev,
      currentOnboardingStep: Math.min(Math.max(stepNumber, 1), 5),
    }));
  }, []);

  const setVoicePreference = useCallback((voice: 'female' | 'male') => {
    setProfile((prev) => ({
      ...prev,
      voicePreference: voice,
    }));
  }, []);

  const setAiTutorLanguage = useCallback((lang: string) => {
    setProfile((prev) => ({
      ...prev,
      aiTutorLanguage: lang,
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setIsLoading(true);
    const fresh = resetCanonicalStudentProfile();
    setProfile(fresh);
    setTeacherProfile(createInitialTeacherProfile());
    setTeacherClassrooms([]);
    setActiveClassroomId('');
    setEnrolledClassrooms([]);
    setTimetableEntries([]);
    setStudentCertificates(INITIAL_CERTIFICATES);
    setGeneratedMaterials([]);
    setTimeout(() => {
      setIsLoading(false);
    }, 250);
  }, []);

  const addTimetableEntry = useCallback((entryData: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
      ...entryData,
      id: 'tt-' + Date.now().toString(36),
    };
    setTimetableEntries((prev) => [...prev, newEntry]);
  }, []);

  const removeTimetableEntry = useCallback((id: string) => {
    setTimetableEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const approveCertificate = useCallback((certId: string) => {
    setStudentCertificates((prev) =>
      prev.map((c) => (c.id === certId ? { ...c, status: 'approved', teacherSignatureStamp: true } : c))
    );
  }, []);

  const issueCertificate = useCallback((certId: string) => {
    setStudentCertificates((prev) =>
      prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: 'issued',
              teacherSignatureStamp: true,
              issuedAt: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );
  }, []);

  const addGeneratedMaterial = useCallback((mat: GeneratedTeacherMaterial) => {
    setGeneratedMaterials((prev) => [mat, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
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
      fetchTeacherClassrooms,
      refreshTeacherClassrooms,
      refreshCoTeacherCounts,
      fetchStudentEnrolledClassrooms,
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
      setCourses,
      setCurrentStep,
      setVoicePreference,
      setAiTutorLanguage,
      resetProfile,
      isLoading,
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
    }),
    [
      profile,
      actualRole,
      viewMode,
      availableRoles,
      teacherProfile,
      isStudentPreview,
      hasTeacherAccess,
      teacherClassrooms,
      activeClassroomId,
      createTeacherClassroom,
      fetchTeacherClassrooms,
      refreshTeacherClassrooms,
      refreshCoTeacherCounts,
      fetchStudentEnrolledClassrooms,
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
      setCourses,
      setCurrentStep,
      setVoicePreference,
      resetProfile,
      isLoading,
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
    ]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
