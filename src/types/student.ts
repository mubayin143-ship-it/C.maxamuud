/**
 * SmartEducate Canonical Student & Teacher Profile Data Model
 * Single source of truth for user roles, access control,
 * persistent student profile, and teacher shell structure.
 */

export type UserRole = 'student' | 'teacher' | 'lecturer' | 'university' | 'admin';
export type ViewMode = 'student' | 'teacher';

export interface StudentPersonalInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  studentId: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
  nationality?: string;
  nationalIdOrPassport?: string;
}

export interface StudentUniversityInfo {
  universityId: string;
  universityName: string;
  campusName: string;
  facultyOrCollege: string;
  department: string;
  enrollmentYear: number | null;
  expectedGraduationYear: number | null;
}

export type AcademicDegreeLevel = 'bachelor' | 'master' | 'doctorate' | 'diploma' | 'certificate' | '';
export type AcademicStudyMode = 'full_time' | 'part_time' | 'distance' | '';
export type AcademicSemester = 'fall' | 'spring' | 'summer' | 'winter' | '';

export interface StudentAcademicProfile {
  degreeLevel: AcademicDegreeLevel;
  major: string;
  minor?: string;
  studyMode: AcademicStudyMode;
  currentYearOfStudy: number | null; // e.g. Year 1, Year 2, etc.
  currentSemester: AcademicSemester;
  gpa?: number | null;
  academicAdvisor?: string;
}

export interface StudentCourseItem {
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  lecturerName?: string;
  roomOrLocation?: string;
  scheduleDay?: string;
  scheduleTime?: string;
  semesterPeriod?: string;
}

export type StudentOnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface StudentProfile {
  id: string; // Unique student identifier or UUID
  role: UserRole; // Current active role
  actualRole?: UserRole; // True security identity
  viewMode?: ViewMode; // Current visual view mode
  availableRoles?: UserRole[]; // Accessible roles for this user
  onboardingStatus: StudentOnboardingStatus;
  currentOnboardingStep: number; // 1 to 5
  lastUpdated: string; // ISO 8601 string
  personalInfo: StudentPersonalInfo;
  universityInfo: StudentUniversityInfo;
  academicProfile: StudentAcademicProfile;
  courses: StudentCourseItem[];
  voicePreference?: 'female' | 'male';
  aiTutorLanguage?: string;
}

/**
 * Teacher Profile Model Foundation
 */
export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  country: string;
  institution: string;
  subjects: string[];
  curriculum: string;
  teachingLevels: string[];
  qualifications: string[];
  isVerified: boolean;
  activeClassroomId?: string;
  teacherType?: 'institutional' | 'independent';
  tutoringScope?: string;
  coTeachersCount?: number;
  pendingCoTeachersCount?: number;
}

/**
 * Canonical Classroom Model Foundation
 */
export interface CanonicalClassroom {
  id: string;
  code: string;
  name: string;
  subject: string;
  curriculum: string;
  instructorName: string;
  instructorId: string;
  studentCount: number;
  status: 'active' | 'archived';
  scheduleInfo?: string;
}

/**
 * Canonical initial factory function for an empty student profile.
 * Guarantees zero undefined field hazards across the entire application.
 */
export const createInitialStudentProfile = (): StudentProfile => ({
  id: 'student_draft_' + Date.now().toString(36),
  role: 'student',
  actualRole: 'student',
  viewMode: 'student',
  availableRoles: ['student'],
  onboardingStatus: 'not_started',
  currentOnboardingStep: 1,
  lastUpdated: new Date().toISOString(),
  personalInfo: {
    fullName: '',
    email: '',
    phoneNumber: '',
    studentId: '',
    avatarUrl: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    nationalIdOrPassport: '',
  },
  universityInfo: {
    universityId: '',
    universityName: '',
    campusName: '',
    facultyOrCollege: '',
    department: '',
    enrollmentYear: null,
    expectedGraduationYear: null,
  },
  academicProfile: {
    degreeLevel: '',
    major: '',
    minor: '',
    studyMode: '',
    currentYearOfStudy: null,
    currentSemester: '',
    gpa: null,
    academicAdvisor: '',
  },
  courses: [],
  voicePreference: 'female',
});

/**
 * Canonical initial factory for a teacher profile shell.
 */
export const createInitialTeacherProfile = (): TeacherProfile => ({
  id: 'teacher_draft_' + Date.now().toString(36),
  name: 'Professor / Instructor',
  email: '',
  country: 'Global',
  institution: 'Global University & Education',
  subjects: ['Mathematics', 'Computer Science'],
  curriculum: 'International Curriculum',
  teachingLevels: ['Grade 10', 'Grade 11', 'Grade 12', 'Undergraduate'],
  qualifications: ['M.Ed. in Secondary Education', 'Certified Higher Education Lecturer'],
  isVerified: true,
  activeClassroomId: '',
  teacherType: 'institutional',
  tutoringScope: 'Classroom & Coursework',
  coTeachersCount: 0,
  pendingCoTeachersCount: 0,
});
