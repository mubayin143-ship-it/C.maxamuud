/**
 * SmartEducate Canonical Global Education Types
 * Defines the core models for global teacher discovery, subjects,
 * international institutions, classrooms, and AI tutoring.
 */

export type LearningCategory = 'school' | 'language' | 'programming' | 'university' | 'skills' | 'vocational' | 'medical';

export interface GlobalTeacher {
  id: string;
  name: string;
  title: string;
  category: LearningCategory;
  subject: string;
  level: string; // e.g., "Grade 10", "Advanced", "Full-Stack", "Undergraduate"
  language: string; // Teaching language e.g. "English", "Arabic", "French"
  country: string; // Country of origin or institution
  rating: number; // e.g. 4.9
  reviewCount: number;
  availability: string; // e.g. "Available today", "Weekends"
  pricingType: 'free' | 'paid';
  priceDisplay?: string; // e.g. "$15/hr" or "Free"
  bio: string;
  isVerified: boolean;
  institutionName?: string;
}

export type UniversityVerificationStatus = 'accredited' | 'verified' | 'registered' | 'not_verified';

export interface GlobalUniversity {
  id: string;
  name: string;
  country: string;
  city: string;
  continent?: string;
  verificationStatus: UniversityVerificationStatus;
  faculties: string[];
  courseCount: number;
}

export interface GlobalClassroom {
  id: string;
  code: string;
  title: string;
  instructorName: string;
  institution: string;
  subject: string;
  category: LearningCategory;
  enrolledStudents: number;
  status?: 'active' | 'completed';
  instructorId?: string;
  coTeacherIds?: string[];
  isCoTeacher?: boolean;
  coTeacherRole?: string;
}

export interface ClassroomStudentItem {
  id: string;
  name: string;
  email: string;
  enrolledDate: string;
  status: 'active' | 'pending';
}

export interface ClassroomAssignment {
  id: string;
  title: string;
  dueDate: string;
  instructions: string;
  submissionsCount: number;
}

export interface ClassroomAnnouncement {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface HomeworkHelpRequest {
  id: string;
  question: string;
  subject: string;
  answerSummary: string;
  explanationSteps: string[];
  keyConcept: string;
  practiceTip: string;
  greeting?: string;
  realWorldExample?: string;
  practiceQuestionSample?: string;
  formulaOrCode?: string;
  timestamp?: string;
  mode?: 'concept' | 'solve' | 'practice' | 'revision' | 'explanation' | 'simpler' | 'examples';
}

export type AiLearningMode = 'concept' | 'solve' | 'practice' | 'revision';
export type ConceptDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export type RevisionType = 'recent' | 'concepts' | 'exam' | 'quick';

export interface PracticeQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  subject?: string;
}

export interface RevisionTopicItem {
  id: string;
  title: string;
  subject: string;
  keyConcept: string;
  keyPoints: string[];
  commonMistakes: string[];
  summaryFormulaOrQuote: string;
}

/**
 * Phase 09 Canonical Timetable Entry Model
 */
export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:30 AM"
  title: string;     // e.g. "Calculus & Linear Algebra"
  roomOrLink: string;// e.g. "Lecture Hall 3" or "Live Online"
  classroomId?: string;
}

/**
 * Phase 09 AI Teacher Material Types & Locked Difficulties
 */
export type AiTeacherDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Extremely Hard';

export type TeacherMaterialType =
  | 'assignment'
  | 'homework'
  | 'quiz'
  | 'test'
  | 'lesson_plan'
  | 'question_set'
  | 'answer_key'
  | 'teaching_material'
  | 'grading_support';

export interface GeneratedTeacherMaterial {
  id: string;
  type: TeacherMaterialType;
  title: string;
  subject: string;
  gradeOrLevel: string;
  topic: string;
  difficulty: AiTeacherDifficulty;
  questionCount: number;
  content: string;
  answerKey?: string;
  gradingRubric?: string[];
  createdAt: string;
  language?: 'English' | 'Somali' | 'Arabic';
  classroomId?: string;
  teacherId?: string;
  teacherName?: string;
  durationMinutes?: number;
  totalMarks?: number;
  questionType?: string;
  markingScheme?: string;
  learningObjectives?: string[];
  structuredQuestions?: AssignmentQuestion[];
}

/**
 * Phase 09 AI Test Analysis Models
 */
export interface StudentTestResult {
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  status: 'passed' | 'failed' | 'distinction';
  weakAreas: string[];
  strongAreas: string[];
  eligibleForCertificate: boolean;
}

export interface TestAnalysisReport {
  testId: string;
  testTitle: string;
  classroomName: string;
  date: string;
  averageScore: number;
  passRate: number;
  totalStudents: number;
  results: StudentTestResult[];
  overallWeakAreas: string[];
  overallStrongAreas: string[];
  summaryNote: string;
}

/**
 * Phase 09 Official Certificate Model
 */
export interface StudentCertificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentEmail?: string;
  courseTitle: string;
  classroomCode: string;
  achievement: string; // e.g. "Completed with Distinction - 94%"
  issueDate: string;
  instructorName: string;
  institutionOrTutor: string;
  status: 'pending_review' | 'approved' | 'issued';
  teacherSignatureStamp: boolean;
  issuedAt?: string;
}

/**
 * Phase 09 Canonical Curriculum & Discovery Models
 * Supports scalable hierarchy: Faculty/Category -> Subject -> Course -> Topic -> Level
 */
export interface CurriculumCourse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  topics: string[];
  levels?: string[];
}

export interface CurriculumSubjectItem {
  id: string;
  name: string;
  facultyId: string;
  levels: string[];
  topics: string[];
  courses?: CurriculumCourse[];
  learningGoals?: string[];
  description?: string;
  isPopular?: boolean;
}

export interface CurriculumFaculty {
  id: string;
  name: string;
  description: string;
  color: string;
  iconName: string;
  isPopular?: boolean;
  subjects: CurriculumSubjectItem[];
}

export interface CurriculumSearchResult {
  faculties: CurriculumFaculty[];
  subjects: CurriculumSubjectItem[];
  courses: { course: string; subject: string; facultyId: string }[];
  topics: { topic: string; subject: string; facultyId: string }[];
  teachers: GlobalTeacher[];
  classes: GlobalClassroom[];
}

/**
 * Phase 09 Academic Grading & Certification Types
 */
export interface GradingWeights {
  assignments: number;
  quizzes: number;
  midterm: number;
  finalExam: number;
  attendance: number;
}

export interface CoTeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
  joinedDate: string;
}

export interface StudentAcademicRecord {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  classroomId: string;
  assignmentsScore: number;
  quizzesScore: number;
  midtermScore: number;
  finalExamScore: number;
  attendanceRate: number;
  weightedScore: number;
  letterGrade: string;
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  isGraduated: boolean;
  graduationDate?: string;
  certificateId?: string;
}

export interface IssuedCertificate {
  id: string;
  verificationCode: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  finalScore: number;
  letterGrade: string;
  completionDate: string;
  teacherName: string;
  teacherTitle: string;
  teacherSignatureText: string;
  institutionName: string;
  stampText: string;
  isDeliveredToStudent: boolean;
  issuedAt: string;
}

/**
 * Phase 09 AI Teacher Assessment & Assignment Types
 */
export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'problem_solving'
  | 'matching'
  | 'fill_blank';

export type AcademicAssessmentType =
  | 'homework'
  | 'assignment'
  | 'quiz'
  | 'test'
  | 'practice_assessment'
  | 'midterm'
  | 'final_exam'
  | 'lesson_plan'
  | 'practice_set';

export interface RubricCriterionItem {
  id?: string;
  criterion: string;
  description: string;
  points: number;
  weight?: number; // e.g. 1.0
}

export interface AssignmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  expectedAnswer?: string;
  points: number;
  explanation?: string;
  markingGuidance?: string;
  acceptableAlternatives?: string[];
  rubricCriteria?: RubricCriterionItem[];
  subjectDomain?: 'math' | 'physics' | 'chemistry' | 'programming' | 'language' | 'humanities' | 'general';
}

export interface AcademicAssignment {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  instructions: string;
  type: AcademicAssessmentType;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' | 'extremely_hard';
  isFinalExam?: boolean;
  learningObjectives?: string[];
  totalPoints: number;
  passingScore?: number;
  timeLimitMinutes?: number;
  dueDate: string;
  rubric?: string;
  status: 'draft' | 'published';
  createdAt: string;
  submissionsCount?: number;
  questions: AssignmentQuestion[];
}

export type SubmissionGradingStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_submission'
  | 'submitted'
  | 'grading'
  | 'ai_evaluated'
  | 'graded'
  | 'needs_review'
  | 'grading_failed'
  | 'revision_requested';

export interface StudentQuestionAnswer {
  questionId: string;
  questionNumber: number;
  questionPrompt: string;
  questionType?: QuestionType;
  studentAnswer: string;
  expectedAnswer: string;
  pointsPossible: number;
  pointsAwarded?: number;
  aiSuggestedScore?: number;
  aiNotes?: string;
  teacherNotes?: string;
  isDeterministic?: boolean;
  isCorrect?: boolean | 'partial';
  acceptableAlternatives?: string[];
  rubricBreakdown?: {
    criterion: string;
    pointsAwarded: number;
    pointsPossible: number;
    feedback?: string;
  }[];
}

export interface StudentSubmissionItem {
  id: string;
  assessmentId: string;
  classroomId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  submittedAt?: string;
  startedAt?: string;
  timeSpentSeconds?: number;
  status: SubmissionGradingStatus;
  answers: StudentQuestionAnswer[];
  totalPointsPossible: number;
  scoreAwarded?: number; // Teacher confirmed score
  percentageScore?: number;
  letterGrade?: string;
  aiSuggestedScore?: number;
  aiSuggestedPercentage?: number;
  aiSuggestedLetterGrade?: string;
  aiConfidence?: number; // e.g. 94%
  needsTeacherReview?: boolean;
  lowConfidenceReason?: string;
  aiAnalysis?: {
    strengths: string[];
    improvements: string[];
    rubricAlignment: string;
    suggestedFeedback: string;
  };
  teacherFeedback?: string;
  teacherApprovedAt?: string;
  lastReminderSentAt?: string;
  isLate?: boolean;
}

export interface TeacherAssessmentItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  classroomId: string;
  classroomName: string;
  type: 'assignment' | 'homework' | 'quiz' | 'test' | 'practice_assessment';
  difficulty?: AiTeacherDifficulty;
  durationMinutes?: number;
  language?: 'English' | 'Somali' | 'Arabic';
  instructions?: string;
  totalQuestions: number;
  totalPoints: number;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  status: 'active' | 'in_review' | 'completed' | 'draft';
  dueDate: string;
  createdAt: string;
  questions?: AssignmentQuestion[];
  answerKey?: string;
  gradingRubric?: string[] | RubricCriterionItem[];
  courseTopic?: string;
  teacherId?: string;
  teacherName?: string;
}


