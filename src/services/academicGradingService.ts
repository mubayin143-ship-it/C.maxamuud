/**
 * SmartEducate Canonical Academic Grading & Certification Service
 *
 * Single Source of Truth for:
 * - Student academic point aggregation and grade calculations
 * - Configurable grading weights (Assignments, Quizzes, Midterm, Final Exam, Attendance)
 * - Final Exam tracking & pass/fail evaluation
 * - Graduation & Course Completion status
 * - Official Certificate Generation with Unique IDs, QR/Verification codes,
 *   custom teacher signature, and institutional academic stamp
 * - Certificate delivery to student accounts & public verification
 * - Co-teacher roster & pending invitations management
 */

import {
  GradingWeights,
  IssuedCertificate,
  StudentAcademicRecord,
  CoTeacherItem,
  ClassroomStudentItem,
} from '../types/education';
import { SAMPLE_CLASSROOM_STUDENTS } from '../data/globalEducation';

const STORAGE_ACADEMIC_RECORDS = 'smarteducate_academic_records_v1';
const STORAGE_CERTIFICATES = 'smarteducate_certificates_v1';
const STORAGE_GRADING_WEIGHTS = 'smarteducate_grading_weights_v1';
const STORAGE_CO_TEACHERS = 'smarteducate_co_teachers_v1';

export const DEFAULT_GRADING_WEIGHTS: GradingWeights = {
  assignments: 20,
  quizzes: 10,
  midterm: 20,
  finalExam: 40,
  attendance: 10,
};

export const INITIAL_CO_TEACHERS: CoTeacherItem[] = [
  {
    id: 'ct-1',
    name: 'Dr. Amina Noor',
    email: 'amina.noor@university.edu',
    role: 'Co-Lecturer (Linear Systems)',
    status: 'active',
    joinedDate: 'Sep 12, 2026',
  },
  {
    id: 'ct-2',
    name: 'Tariq Mansoor',
    email: 'tariq.m@globaltech.edu',
    role: 'Teaching Assistant',
    status: 'pending',
    joinedDate: 'Invited 2 days ago',
  },
  {
    id: 'ct-3',
    name: 'Prof. David K.',
    email: 'david.k@oxford.ac.uk',
    role: 'Guest Lecturer',
    status: 'pending',
    joinedDate: 'Invited 5 days ago',
  },
  {
    id: 'ct-4',
    name: 'Hassan Abdi',
    email: 'hassan.abdi@snu.edu.so',
    role: 'Lab Coordinator',
    status: 'pending',
    joinedDate: 'Invited yesterday',
  },
];

export const INITIAL_STUDENT_RECORDS: StudentAcademicRecord[] = [
  {
    studentId: 'st-1',
    studentName: 'Nimco Nuura',
    studentEmail: 'nimco.nuura@university.edu',
    classroomId: 'cls-101',
    assignmentsScore: 92,
    quizzesScore: 94,
    midtermScore: 88,
    finalExamScore: 91,
    attendanceRate: 98,
    weightedScore: 91.8,
    letterGrade: 'A',
    status: 'PASSED',
    isGraduated: true,
    graduationDate: 'Oct 02, 2026',
    certificateId: 'SE-2026-MATH101-000184',
  },
  {
    studentId: 'st-2',
    studentName: 'Ahmed Farah',
    studentEmail: 'ahmed.f@university.edu',
    classroomId: 'cls-101',
    assignmentsScore: 85,
    quizzesScore: 90,
    midtermScore: 78,
    finalExamScore: 88,
    attendanceRate: 95,
    weightedScore: 85.3,
    letterGrade: 'B+',
    status: 'PASSED',
    isGraduated: false, // Ready for graduation review!
  },
  {
    studentId: 'st-3',
    studentName: 'Lucas Silva',
    studentEmail: 'lucas.s@usp.br',
    classroomId: 'cls-101',
    assignmentsScore: 78,
    quizzesScore: 82,
    midtermScore: 74,
    finalExamScore: 80,
    attendanceRate: 90,
    weightedScore: 78.6,
    letterGrade: 'B',
    status: 'PASSED',
    isGraduated: false, // Ready for graduation review!
  },
  {
    studentId: 'st-4',
    studentName: 'Elena Rostova',
    studentEmail: 'elena.r@oxford.ac.uk',
    classroomId: 'cls-101',
    assignmentsScore: 96,
    quizzesScore: 98,
    midtermScore: 94,
    finalExamScore: 97,
    attendanceRate: 100,
    weightedScore: 96.6,
    letterGrade: 'A+',
    status: 'PASSED',
    isGraduated: false, // Ready for graduation review!
  },
  {
    studentId: 'st-5',
    studentName: 'Khadija Ali',
    studentEmail: 'khadija.ali@snu.edu.so',
    classroomId: 'cls-101',
    assignmentsScore: 70,
    quizzesScore: 68,
    midtermScore: 65,
    finalExamScore: 72,
    attendanceRate: 85,
    weightedScore: 69.1,
    letterGrade: 'C',
    status: 'PASSED',
    isGraduated: false,
  },
  {
    studentId: 'st-6',
    studentName: 'Chen Wei',
    studentEmail: 'chen.wei@tsinghua.edu.cn',
    classroomId: 'cls-101',
    assignmentsScore: 55,
    quizzesScore: 60,
    midtermScore: 50,
    finalExamScore: 58,
    attendanceRate: 75,
    weightedScore: 57.7,
    letterGrade: 'D',
    status: 'IN_PROGRESS',
    isGraduated: false,
  },
];

export const INITIAL_CERTIFICATES: IssuedCertificate[] = [
  {
    id: 'SE-2026-MATH101-000184',
    verificationCode: 'VRF-9482-MATH101',
    studentId: 'st-1',
    studentName: 'Nimco Nuura',
    studentEmail: 'nimco.nuura@university.edu',
    courseId: 'cls-101',
    courseTitle: 'Calculus & Linear Algebra',
    subject: 'Mathematics',
    finalScore: 92,
    letterGrade: 'A',
    completionDate: 'October 2, 2026',
    teacherName: 'Prof. Marcus Vance',
    teacherTitle: 'Professor of Mathematics',
    teacherSignatureText: 'Prof. M. Vance, Ph.D.',
    institutionName: 'University of Oxford',
    stampText: 'SmartEducate Academic Registry · Oxford Verified',
    isDeliveredToStudent: true,
    issuedAt: new Date().toISOString(),
  },
];

class AcademicGradingService {
  private records: StudentAcademicRecord[] = [];
  private certificates: IssuedCertificate[] = [];
  private weights: GradingWeights = DEFAULT_GRADING_WEIGHTS;
  private coTeachers: CoTeacherItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedWeights = localStorage.getItem(STORAGE_GRADING_WEIGHTS);
      if (storedWeights) {
        this.weights = JSON.parse(storedWeights);
      } else {
        this.weights = DEFAULT_GRADING_WEIGHTS;
      }

      const storedRecords = localStorage.getItem(STORAGE_ACADEMIC_RECORDS);
      if (storedRecords) {
        this.records = JSON.parse(storedRecords);
      } else {
        this.records = INITIAL_STUDENT_RECORDS;
      }

      const storedCerts = localStorage.getItem(STORAGE_CERTIFICATES);
      if (storedCerts) {
        this.certificates = JSON.parse(storedCerts);
      } else {
        this.certificates = INITIAL_CERTIFICATES;
      }

      const storedCoTeachers = localStorage.getItem(STORAGE_CO_TEACHERS);
      if (storedCoTeachers) {
        this.coTeachers = JSON.parse(storedCoTeachers);
      } else {
        this.coTeachers = INITIAL_CO_TEACHERS;
      }
    } catch {
      this.weights = DEFAULT_GRADING_WEIGHTS;
      this.records = INITIAL_STUDENT_RECORDS;
      this.certificates = INITIAL_CERTIFICATES;
      this.coTeachers = INITIAL_CO_TEACHERS;
    }
  }

  private saveRecords() {
    try {
      localStorage.setItem(STORAGE_ACADEMIC_RECORDS, JSON.stringify(this.records));
    } catch {
      // safe fallback
    }
  }

  private saveCertificates() {
    try {
      localStorage.setItem(STORAGE_CERTIFICATES, JSON.stringify(this.certificates));
    } catch {
      // safe fallback
    }
  }

  private saveWeights() {
    try {
      localStorage.setItem(STORAGE_GRADING_WEIGHTS, JSON.stringify(this.weights));
    } catch {
      // safe fallback
    }
  }

  private saveCoTeachers() {
    try {
      localStorage.setItem(STORAGE_CO_TEACHERS, JSON.stringify(this.coTeachers));
    } catch {
      // safe fallback
    }
  }

  // Calculate Weighted Grade & Letter Grade
  public calculateGrade(
    assignments: number,
    quizzes: number,
    midterm: number,
    finalExam: number,
    attendance: number,
    weights: GradingWeights = this.weights
  ): { weightedScore: number; letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'; status: 'PASSED' | 'FAILED' } {
    const totalWeight = weights.assignments + weights.quizzes + weights.midterm + weights.finalExam + weights.attendance;
    const factor = totalWeight > 0 ? 100 / totalWeight : 1;

    const weightedScore = Math.round(
      ((assignments * weights.assignments +
        quizzes * weights.quizzes +
        midterm * weights.midterm +
        finalExam * weights.finalExam +
        attendance * weights.attendance) /
        100) *
        factor *
        10
    ) / 10;

    let letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (weightedScore >= 95) letterGrade = 'A+';
    else if (weightedScore >= 88) letterGrade = 'A';
    else if (weightedScore >= 82) letterGrade = 'B+';
    else if (weightedScore >= 75) letterGrade = 'B';
    else if (weightedScore >= 65) letterGrade = 'C';
    else if (weightedScore >= 55) letterGrade = 'D';
    else letterGrade = 'F';

    // Passing requirement: final exam >= 60% and overall weighted score >= 60%
    const status = finalExam >= 60 && weightedScore >= 60 ? 'PASSED' : 'FAILED';

    return { weightedScore, letterGrade, status };
  }

  // Get all student academic records for a classroom
  public getClassroomRecords(classroomId: string = 'cls-101'): StudentAcademicRecord[] {
    const matched = this.records.filter((r) => r.classroomId === classroomId);
    if (matched.length > 0) return matched;
    return this.records;
  }

  // Get a single student's academic record
  public getStudentRecord(studentId: string, classroomId: string = 'cls-101'): StudentAcademicRecord | undefined {
    return this.records.find((r) => r.studentId === studentId && (r.classroomId === classroomId || !r.classroomId));
  }

  // Get grading weights
  public getWeights(): GradingWeights {
    return { ...this.weights };
  }

  // Update grading weights
  public updateWeights(newWeights: Partial<GradingWeights>) {
    this.weights = { ...this.weights, ...newWeights };
    this.saveWeights();

    // Recalculate all records with new weights
    this.records = this.records.map((rec) => {
      const { weightedScore, letterGrade, status } = this.calculateGrade(
        rec.assignmentsScore,
        rec.quizzesScore,
        rec.midtermScore,
        rec.finalExamScore,
        rec.attendanceRate,
        this.weights
      );
      return {
        ...rec,
        weightedScore,
        letterGrade,
        status: status === 'PASSED' ? 'PASSED' : 'FAILED',
      };
    });
    this.saveRecords();
    return this.weights;
  }

  // Update or record score for student work
  public recordStudentScore(
    studentId: string,
    type: 'assignment' | 'quiz' | 'midterm' | 'final_exam' | 'attendance',
    newScore: number,
    classroomId: string = 'cls-101'
  ): StudentAcademicRecord {
    let rec = this.records.find((r) => r.studentId === studentId);
    if (!rec) {
      const studentBase = SAMPLE_CLASSROOM_STUDENTS.find((s) => s.id === studentId);
      rec = {
        studentId,
        studentName: studentBase?.name || 'Student',
        studentEmail: studentBase?.email || 'student@university.edu',
        classroomId,
        assignmentsScore: 80,
        quizzesScore: 80,
        midtermScore: 80,
        finalExamScore: 80,
        attendanceRate: 90,
        weightedScore: 81,
        letterGrade: 'B',
        status: 'PASSED',
        isGraduated: false,
      };
      this.records.push(rec);
    }

    if (type === 'assignment') rec.assignmentsScore = Math.min(100, Math.max(0, newScore));
    if (type === 'quiz') rec.quizzesScore = Math.min(100, Math.max(0, newScore));
    if (type === 'midterm') rec.midtermScore = Math.min(100, Math.max(0, newScore));
    if (type === 'final_exam') rec.finalExamScore = Math.min(100, Math.max(0, newScore));
    if (type === 'attendance') rec.attendanceRate = Math.min(100, Math.max(0, newScore));

    const { weightedScore, letterGrade, status } = this.calculateGrade(
      rec.assignmentsScore,
      rec.quizzesScore,
      rec.midtermScore,
      rec.finalExamScore,
      rec.attendanceRate,
      this.weights
    );

    rec.weightedScore = weightedScore;
    rec.letterGrade = letterGrade;
    rec.status = status;

    this.saveRecords();
    return rec;
  }

  // Check if student is eligible for graduation/certificate
  public isReadyForGraduation(studentId: string, classroomId: string = 'cls-101'): boolean {
    const rec = this.getStudentRecord(studentId, classroomId);
    if (!rec) return false;
    // Requirements: final exam passed (>=60%), overall weighted score >= 60%
    return rec.finalExamScore >= 60 && rec.weightedScore >= 60;
  }

  // List students who are ready for graduation
  public getGraduationCandidates(classroomId: string = 'cls-101'): StudentAcademicRecord[] {
    return this.getClassroomRecords(classroomId).filter(
      (r) => r.finalExamScore >= 60 && r.weightedScore >= 60 && !r.isGraduated
    );
  }

  // List students who have graduated
  public getGraduatedStudents(classroomId: string = 'cls-101'): StudentAcademicRecord[] {
    return this.getClassroomRecords(classroomId).filter((r) => r.isGraduated);
  }

  // Generate & Issue Certificate
  public issueCertificate(params: {
    studentId: string;
    studentName: string;
    studentEmail?: string;
    courseId: string;
    courseTitle: string;
    subject: string;
    teacherName: string;
    teacherTitle: string;
    teacherSignatureText: string;
    institutionName: string;
    stampText?: string;
  }): IssuedCertificate {
    const rec = this.getStudentRecord(params.studentId, params.courseId);
    const score = rec ? rec.weightedScore : 88;
    const grade = rec ? rec.letterGrade : 'A';

    // Unique Certificate ID: e.g. SE-2026-MATH101-000184
    const courseCodeSlug = params.courseTitle.includes('MATH')
      ? 'MATH101'
      : params.courseTitle.slice(0, 4).toUpperCase();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const certificateId = `SE-2026-${courseCodeSlug}-${randomSuffix}`;
    const verificationCode = `VRF-${Math.floor(1000 + Math.random() * 9000)}-${courseCodeSlug}`;

    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cert: IssuedCertificate = {
      id: certificateId,
      verificationCode,
      studentId: params.studentId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      courseId: params.courseId,
      courseTitle: params.courseTitle,
      subject: params.subject,
      finalScore: score,
      letterGrade: grade,
      completionDate,
      teacherName: params.teacherName || 'Prof. Marcus Vance',
      teacherTitle: params.teacherTitle || 'Classroom Instructor',
      teacherSignatureText: params.teacherSignatureText || `${params.teacherName || 'Prof. Marcus Vance'}, Ph.D.`,
      institutionName: params.institutionName || 'Global University & Education',
      stampText: params.stampText || 'SmartEducate Academic Registry · Official Seal',
      isDeliveredToStudent: true,
      issuedAt: new Date().toISOString(),
    };

    // Update student's graduation status
    if (rec) {
      rec.isGraduated = true;
      rec.graduationDate = completionDate;
      rec.certificateId = cert.id;
      rec.status = 'PASSED';
      this.saveRecords();
    }

    this.certificates = [cert, ...this.certificates.filter((c) => c.id !== cert.id)];
    this.saveCertificates();

    return cert;
  }

  // Get all issued certificates
  public getAllCertificates(): IssuedCertificate[] {
    return [...this.certificates];
  }

  // Get certificates for a student
  public getStudentCertificates(studentId?: string, studentName?: string): IssuedCertificate[] {
    return this.certificates.filter((c) => {
      if (studentId && c.studentId === studentId) return true;
      if (studentName && c.studentName.toLowerCase() === studentName.toLowerCase()) return true;
      return false;
    });
  }

  // Find certificate by Certificate ID or Verification Code
  public verifyCertificate(query: string): IssuedCertificate | undefined {
    const q = query.trim().toUpperCase();
    return this.certificates.find(
      (c) => c.id.toUpperCase() === q || c.verificationCode.toUpperCase() === q
    );
  }

  // Deliver certificate to student
  public deliverCertificateToStudent(certificateId: string) {
    const cert = this.certificates.find((c) => c.id === certificateId);
    if (cert) {
      cert.isDeliveredToStudent = true;
      this.saveCertificates();
    }
    return cert;
  }

  // Co-Teachers
  public getCoTeachers(): CoTeacherItem[] {
    return [...this.coTeachers];
  }

  public inviteCoTeacher(name: string, email: string, role: string = 'Co-Lecturer'): CoTeacherItem {
    const newCoTeacher: CoTeacherItem = {
      id: 'ct-' + Date.now().toString(36),
      name,
      email,
      role,
      status: 'pending',
      joinedDate: 'Invited just now',
    };
    this.coTeachers = [newCoTeacher, ...this.coTeachers];
    this.saveCoTeachers();
    return newCoTeacher;
  }
}

export const academicGradingService = new AcademicGradingService();
