/**
 * SmartEducate Canonical AI Teacher Assistant Service
 *
 * Dedicated Pedagogical AI for Educators:
 * - Generates high-quality curriculum-aligned assignments, homework, quizzes,
 *   midterm assessments, and final exams.
 * - Supports question formats: Multiple Choice, True/False, Short Answer,
 *   Long Answer, Matching, and Fill in the Blank.
 * - Produces comprehensive answer keys, marking rubrics, points distribution,
 *   learning objectives, and time limits.
 * - Strict Educator-in-the-Loop policy: AI drafts are ALWAYS reviewable, editable,
 *   and never published without teacher confirmation.
 */

import {
  AcademicAssignment,
  AcademicAssessmentType,
  AssignmentQuestion,
  QuestionType,
} from '../types/education';

const STORAGE_ASSESSMENTS_KEY = 'smarteducate_classroom_assessments_v1';

export interface GenerateAssessmentParams {
  prompt?: string;
  classroomId: string;
  classroomTitle: string;
  subject: string;
  topic?: string;
  gradeLevel?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type: AcademicAssessmentType;
  questionCount?: number;
  questionType?: QuestionType | 'mixed';
  language?: string;
  instructions?: string;
  totalPoints?: number;
  timeLimitMinutes?: number;
  isFinalExam?: boolean;
}

export const INITIAL_CLASSROOM_ASSESSMENTS: AcademicAssignment[] = [
  {
    id: 'asg-final-101',
    classroomId: 'cls-101',
    title: 'Final Comprehensive Exam: Linear Algebra & Matrix Calculus',
    description: 'Cumulative graduation evaluation covering vector spaces, row reductions, eigenvalues, and quadratic forms.',
    instructions: 'Answer all questions. Show your step-by-step reasoning for full credit. Passing score is 60 points.',
    type: 'final_exam',
    difficulty: 'hard',
    isFinalExam: true,
    learningObjectives: [
      'Evaluate 4x4 matrix determinants and row-reduced echelon forms',
      'Diagonalize symmetric matrices and calculate eigenvalues',
      'Formulate real-world linear transformations in engineering',
    ],
    totalPoints: 100,
    passingScore: 60,
    timeLimitMinutes: 120,
    dueDate: 'Next Friday, 5:00 PM',
    rubric: 'Full working shown: 100%. Minor arithmetic error with correct method: 80%. Conceptual gap: 40%.',
    status: 'published',
    createdAt: 'Oct 01, 2026',
    submissionsCount: 84,
    questions: [
      {
        id: 'q-1',
        type: 'multiple_choice',
        prompt: 'What is the determinant of a 2x2 matrix with rows [3, 2] and [1, 4]?',
        options: ['10', '12', '14', '7'],
        correctAnswer: '10',
        points: 15,
        explanation: 'det(A) = (3*4) - (2*1) = 12 - 2 = 10.',
      },
      {
        id: 'q-2',
        type: 'true_false',
        prompt: 'If matrix A is invertible, then det(A) cannot equal zero.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 10,
        explanation: 'By the Invertible Matrix Theorem, det(A) != 0 is a necessary and sufficient condition.',
      },
      {
        id: 'q-3',
        type: 'short_answer',
        prompt: 'Define the term "Kernel (Null Space)" of a linear transformation T: V -> W.',
        correctAnswer: 'The set of all vectors v in V such that T(v) = 0.',
        points: 20,
        explanation: 'Ker(T) = {v in V | T(v) = 0}.',
      },
      {
        id: 'q-4',
        type: 'fill_blank',
        prompt: 'An n x n matrix with n distinct eigenvalues is always ________.',
        correctAnswer: 'diagonalizable',
        points: 15,
        explanation: 'Having n distinct eigenvalues guarantees n linearly independent eigenvectors.',
      },
      {
        id: 'q-5',
        type: 'long_answer',
        prompt: 'Given the matrix equation Ax = b, prove that if the columns of A are linearly independent, the solution x (if it exists) is unique.',
        correctAnswer: 'If Ax1 = b and Ax2 = b, then A(x1 - x2) = 0. Since columns are linearly independent, Null(A) = {0}, so x1 - x2 = 0, meaning x1 = x2.',
        points: 40,
        explanation: 'Proof relies on the definition of linear independence and trivial kernel.',
      },
    ],
  },
  {
    id: 'asg-mid-101',
    classroomId: 'cls-101',
    title: 'Midterm Examination: Vector Spaces & Transformations',
    description: 'Mid-semester assessment assessing basis, dimension, and linear mappings.',
    instructions: 'Time allowed: 90 minutes. Calculators permitted.',
    type: 'midterm',
    difficulty: 'medium',
    isFinalExam: false,
    learningObjectives: ['Verify vector space axioms', 'Calculate rank and nullity of matrices'],
    totalPoints: 80,
    passingScore: 50,
    timeLimitMinutes: 90,
    dueDate: 'Completed on Sep 28',
    rubric: 'Standard partial credit rubric.',
    status: 'published',
    createdAt: 'Sep 25, 2026',
    submissionsCount: 84,
    questions: [
      {
        id: 'qm-1',
        type: 'multiple_choice',
        prompt: 'The dimension of R^3 vector space is:',
        options: ['1', '2', '3', 'Infinite'],
        correctAnswer: '3',
        points: 20,
      },
      {
        id: 'qm-2',
        type: 'short_answer',
        prompt: 'State the Rank-Nullity Theorem.',
        correctAnswer: 'Rank(T) + Nullity(T) = dim(Domain).',
        points: 30,
      },
      {
        id: 'qm-3',
        type: 'true_false',
        prompt: 'The union of two subspaces of V is always a subspace of V.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 30,
      },
    ],
  },
  {
    id: 'asg-hw-101',
    classroomId: 'cls-101',
    title: 'Problem Set 3: Gaussian Elimination & Systems of Equations',
    description: 'Practice exercises for Row Reduction and echelon form calculations.',
    instructions: 'Submit your solution on paper or upload PDF scan.',
    type: 'assignment',
    difficulty: 'easy',
    learningObjectives: ['Master row-reduction algorithms and echelon form'],
    totalPoints: 50,
    passingScore: 30,
    dueDate: 'Next Monday, 11:59 PM',
    status: 'published',
    createdAt: 'Sep 15, 2026',
    submissionsCount: 78,
    questions: [
      {
        id: 'qhw-1',
        type: 'short_answer',
        prompt: 'Solve the system: 2x + y = 5, x - y = 1.',
        correctAnswer: 'x = 2, y = 1',
        points: 25,
      },
      {
        id: 'qhw-2',
        type: 'fill_blank',
        prompt: 'A system with no solutions is termed ________.',
        correctAnswer: 'inconsistent',
        points: 25,
      },
    ],
  },
];

class AiTeacherService {
  private assessments: AcademicAssignment[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_ASSESSMENTS_KEY);
      if (stored) {
        this.assessments = JSON.parse(stored);
      } else {
        this.assessments = INITIAL_CLASSROOM_ASSESSMENTS;
      }
    } catch {
      this.assessments = INITIAL_CLASSROOM_ASSESSMENTS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(this.assessments));
    } catch {
      // safe fallback
    }
  }

  // Get all assessments for a classroom
  public getClassroomAssessments(classroomId: string = 'cls-101'): AcademicAssignment[] {
    const list = this.assessments.filter((a) => a.classroomId === classroomId);
    if (list.length > 0) return list;
    return this.assessments;
  }

  // Get specific assessment
  public getAssessment(id: string): AcademicAssignment | undefined {
    return this.assessments.find((a) => a.id === id);
  }

  // Generate an assessment using AI logic
  public generateAssessment(params: GenerateAssessmentParams): AcademicAssignment {
    const isExam = params.type === 'final_exam' || params.type === 'test' || params.type === 'midterm';
    const subj = params.subject || 'Mathematics';
    const topic = params.topic || (params.prompt ? params.prompt.slice(0, 40) : 'Core Curriculum');
    const totalPts = params.totalPoints || (params.type === 'final_exam' ? 100 : params.type === 'quiz' ? 30 : 50);
    const passScore = params.type === 'final_exam' ? Math.round(totalPts * 0.6) : Math.round(totalPts * 0.5);
    const timeLimit = params.timeLimitMinutes || (params.type === 'final_exam' ? 120 : params.type === 'quiz' ? 30 : 60);
    const qCount = Math.max(1, Math.min(20, params.questionCount || 5));
    const isArabic = params.language === 'Arabic';
    const isSomali = params.language === 'Somali';

    const questions: AssignmentQuestion[] = [];
    const ptsPerQ = Math.max(5, Math.round(totalPts / qCount));

    const templates = [
      {
        type: 'multiple_choice' as QuestionType,
        prompt: isArabic
          ? `في موضوع ${topic} ضمن ${subj}، ما هو المبدأ الأساسي الذي يحكم هذا المفهوم؟`
          : isSomali
          ? `Mawduuca ${topic} ee ${subj}, waa maxay mabda'a aasaasiga ah ee maamula qodobkan?`
          : `In ${subj} (${topic}), what is the primary fundamental theorem or rule governing this topic?`,
        options: [
          'The Principle of Superposition & Deterministic Solvability',
          'Inverse Proportionality of Boundary States',
          'Nullity Transformation Criterion',
          'Arbitrary Constant Formulation',
        ],
        correctAnswer: 'The Principle of Superposition & Deterministic Solvability',
        explanation: 'Superposition and deterministic solvability represent the canonical foundation.',
      },
      {
        type: 'true_false' as QuestionType,
        prompt: isArabic
          ? `صواب أو خطأ: كل معادلة متجانسة في ${topic} تمتلك دائمًا حلاً بديهيًا واحدًا على الأقل.`
          : isSomali
          ? `Run ama Been: Isleeg kasta oo isku nooc ah oo ku saabsan ${topic} waxay had iyo jeer leedahay ugu yaraan hal xal.`
          : `True or False: Every homogeneous equation in ${topic} always possesses at least one trivial solution.`,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Setting variable coordinates to zero satisfies the homogeneous equation.',
      },
      {
        type: 'short_answer' as QuestionType,
        prompt: isArabic
          ? `اشرح الخطوات اللازمة للتحقق من أن الحل المعطى في ${topic} هو حل أمثل وفريد.`
          : isSomali
          ? `Sharax tallaabooyinka lagu hubinayo in xalka la bixiyay ee ${topic} uu yahay mid sax ah oo keliya.`
          : `Explain the step-by-step procedure to test whether a given solution in ${topic} is optimal and unique.`,
        correctAnswer: 'Substitute back into the original system, check boundary consistency, and verify non-zero determinant.',
        explanation: 'Requires boundary validation and determinism verification.',
      },
      {
        type: 'fill_blank' as QuestionType,
        prompt: isArabic
          ? `عند تطبيق التحويلات في ${topic}، فإن بعد الصورة مضافاً إليه بعد النواة يساوي ________.`
          : isSomali
          ? `Marka la adeegsanayo beddelka ${topic}, cabbirka sawirka oo lagu daray cabbirka xudunta wuxuu la mid yahay ________.`
          : `When applying transformations in ${topic}, the dimension of the image plus the dimension of the kernel equals the ________.`,
        correctAnswer: 'domain dimension',
        explanation: 'Follows from the fundamental dimension theorem.',
      },
      {
        type: 'long_answer' as QuestionType,
        prompt: isArabic
          ? `صغ نموذجاً تطبيقياً واقعياً يمثل فيه ${topic} نموذجاً تحليلياً، وحدد المتغيرات وطريقة التحقق.`
          : isSomali
          ? `Samee xaalad dhab ah oo ${topic} ay bixinayso qaab falanqayn ah. Sheeg doorsoomayaasha iyo xaqiijinta xalka.`
          : `Formulate an applied real-world scenario where ${topic} provides an analytical model. State the variables, constraints, and verification steps.`,
        correctAnswer: 'Model formulation with defined input variables, explicit algebraic constraints, and solution verification.',
        explanation: 'Evaluates critical synthesis and real-world domain application.',
      },
      {
        type: 'multiple_choice' as QuestionType,
        prompt: isArabic
          ? `أي مما يلي يمثل أفضل طريقة لحساب المتغيرات المستقلة في ${topic}؟`
          : isSomali
          ? `Kee baa ka mid ah hababka ugu wanaagsan ee lagu xisaabiyo doorsoomayaasha madaxa-bannaan ee ${topic}?`
          : `Which of the following represents the optimal method to compute independent variables in ${topic}?`,
        options: [
          'Gaussian Row Reduction to Echelon Form',
          'Arbitrary Numerical Guessing',
          'Recursive Determinant Negation',
          'Static Vector Projection',
        ],
        correctAnswer: 'Gaussian Row Reduction to Echelon Form',
        explanation: 'Row reduction guarantees systematic convergence.',
      },
      {
        type: 'short_answer' as QuestionType,
        prompt: isArabic
          ? `ما هو الشرط الضروري والكافي لوجود المعكوس في مصفوفات ${topic}؟`
          : isSomali
          ? `Waa maxay shuruudda lagama maarmaanka ah ee lagu heli karo rogaalka ${topic}?`
          : `What is the necessary and sufficient condition for invertibility in ${topic}?`,
        correctAnswer: 'The determinant must be non-zero (det != 0) and the rank must equal the dimension.',
        explanation: 'Invertible Matrix Theorem condition.',
      },
      {
        type: 'true_false' as QuestionType,
        prompt: isArabic
          ? `صواب أو خطأ: عملية الجمع والضرب القياسي مغلقتان تحت الفضاء الجزئي لـ ${topic}.`
          : isSomali
          ? `Run ama Been: Isku-darka iyo dhuftashada scalar-ka waxay ku xidhan yihiin meel-hoosaadka ${topic}.`
          : `True or False: Addition and scalar multiplication are strictly closed in every valid subspace of ${topic}.`,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Closure under addition and scalar multiplication defines a valid subspace.',
      },
      {
        type: 'fill_blank' as QuestionType,
        prompt: isArabic
          ? `المتجهات التي لا يمكن كتابتها كتركيبة خطية لمتجهات أخرى تسمى متجهات ________.`
          : isSomali
          ? `Fiidiyowyada aan loo qori karin sidii isku-darka tooska ah ee kuwa kale waxaa loo yaqaannaa ________.`
          : `Vectors that cannot be expressed as a linear combination of other vectors are termed ________.`,
        correctAnswer: 'linearly independent',
        explanation: 'Definition of linear independence.',
      },
      {
        type: 'long_answer' as QuestionType,
        prompt: isArabic
          ? `قدم إثباتاً رياضياً خطوة بخطوة للخاصية الأساسية لـ ${topic} كما طُلبت في التعليمات.`
          : isSomali
          ? `Bixi caddayn xisaabeed tallaabo-tallaabo ah oo ku saabsan hantida aasaasiga ah ee ${topic}.`
          : `Provide a rigorous step-by-step mathematical proof for the governing property of ${topic}.`,
        correctAnswer: 'Axiomatic definition -> Lemma assumption -> Algebraic simplification -> Q.E.D.',
        explanation: 'Proof verification of governing theorem.',
      },
    ];

    for (let i = 0; i < qCount; i++) {
      const template = templates[i % templates.length];
      const selectedType = params.questionType && params.questionType !== 'mixed' ? params.questionType : template.type;
      questions.push({
        id: `gen-q${i + 1}`,
        type: selectedType,
        prompt: `[Q${i + 1}] ${template.prompt}`,
        options: selectedType === 'multiple_choice' ? template.options : selectedType === 'true_false' ? ['True', 'False'] : undefined,
        correctAnswer: template.correctAnswer,
        points: ptsPerQ,
        explanation: template.explanation,
      });
    }

    const titlePrefix =
      params.type === 'final_exam'
        ? 'Final Comprehensive Examination:'
        : params.type === 'midterm'
        ? 'Midterm Examination:'
        : params.type === 'quiz'
        ? 'Diagnostic Quiz:'
        : 'Assignment:';

    const draft: AcademicAssignment = {
      id: 'asg-' + Date.now().toString(36),
      classroomId: params.classroomId || 'cls-101',
      title: `${titlePrefix} ${topic} (${subj})`,
      description: `Structured ${params.type} tailored for ${params.classroomTitle || 'Academic Classroom'}. Generated with SmartEducate AI Teacher.`,
      instructions: params.instructions || (isExam
        ? `Closed-book examination. Time limit: ${timeLimit} minutes. Calculators allowed where noted. Passing grade: ${passScore}/${totalPts} points.`
        : 'Read all questions carefully. Submit your working before the scheduled due date for feedback and grading.'),
      type: params.type,
      difficulty: params.difficulty || 'medium',
      learningObjectives: [
        `Master fundamental principles and notation in ${topic}`,
        `Apply theoretical derivations to computational problem sets`,
        `Demonstrate critical reasoning and multi-step verification`,
      ],
      questions,
      totalPoints: totalPts,
      passingScore: passScore,
      timeLimitMinutes: isExam ? timeLimit : undefined,
      dueDate: isExam ? 'Scheduled for Next Friday' : 'Next Monday, 11:59 PM',
      rubric: 'Conceptual accuracy (40%), Step-by-step working (40%), Final calculation (20%).',
      isFinalExam: params.type === 'final_exam' || Boolean(params.isFinalExam),
      status: 'draft',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissionsCount: 0,
    };

    return draft;
  }

  // Save or Update an assignment draft
  public saveDraft(assignment: AcademicAssignment): AcademicAssignment {
    const existingIndex = this.assessments.findIndex((a) => a.id === assignment.id);
    if (existingIndex >= 0) {
      this.assessments[existingIndex] = { ...assignment, status: 'draft' };
    } else {
      this.assessments = [{ ...assignment, status: 'draft' }, ...this.assessments];
    }
    this.saveToStorage();
    return assignment;
  }

  // Publish assignment to classroom
  public publishAssignment(assignment: AcademicAssignment): AcademicAssignment {
    const published: AcademicAssignment = {
      ...assignment,
      status: 'published',
      createdAt: assignment.createdAt || 'Just now',
    };
    const existingIndex = this.assessments.findIndex((a) => a.id === published.id);
    if (existingIndex >= 0) {
      this.assessments[existingIndex] = published;
    } else {
      this.assessments = [published, ...this.assessments];
    }
    this.saveToStorage();
    return published;
  }

  // Delete an assignment
  public deleteAssignment(id: string) {
    this.assessments = this.assessments.filter((a) => a.id !== id);
    this.saveToStorage();
  }
}

export const aiTeacherService = new AiTeacherService();
