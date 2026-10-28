/**
 * SmartEducate Teacher AI Service
 * Pedagogical Content Creation Engine for Educators
 * Supports: Assignments, Homework, Quizzes, Tests, Lesson Plans,
 * Question Sets, Answer Keys, and Teaching Materials across English, Somali, and Arabic.
 * Reuses the canonical curriculum (canonicalCurriculum.ts).
 */

import {
  AiTeacherDifficulty,
  TeacherMaterialType,
  GeneratedTeacherMaterial,
  AssignmentQuestion,
  TeacherAssessmentItem,
} from '../types/education';
import {
  CANONICAL_FACULTIES,
  CANONICAL_SCHOOL_GRADES,
} from '../data/canonicalCurriculum';
import { splitTextIntoSpeakableChunks } from './voiceService';

export interface TeacherAiGenerationParams {
  contentType: TeacherMaterialType;
  gradeOrLevel: string;
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: AiTeacherDifficulty;
  language: 'English' | 'Somali' | 'Arabic';
  durationMinutes?: number;
  totalMarks?: number;
  questionType?: 'Multiple Choice' | 'True / False' | 'Short Answer' | 'Long Answer' | 'Mixed';
  additionalInstructions?: string;
  classroomId?: string;
  teacherId?: string;
  teacherName?: string;
}

export type TeacherRequestIntent = 'generate_material' | 'conversational_question';

export interface ParsedTeacherRequest {
  intent: TeacherRequestIntent;
  contentType?: TeacherMaterialType;
  gradeOrLevel?: string;
  subject?: string;
  topic?: string;
  questionCount?: number;
  difficulty?: AiTeacherDifficulty;
  language?: 'English' | 'Somali' | 'Arabic';
  questionType?: 'Multiple Choice' | 'True / False' | 'Short Answer' | 'Long Answer' | 'Mixed';
}

/**
 * Intelligent natural language parser for teacher prompts
 */
export function parseTeacherPrompt(rawPrompt: string): ParsedTeacherRequest {
  const text = rawPrompt.trim();
  const lower = text.toLowerCase();

  // 0. Intent detection: Distinguish conversational educational inquiries from material creation requests
  const isExplanationOrInquiry =
    /^(explain|teach\s+me|what\s+is|what\s+are|how\s+does|how\s+do|why\s+is|why\s+does|why\s+do|describe|clarify|compare|differentiate|define|give\s+examples|sharax|ii\s+sharax|waa\s+maxay|sidee|maxaa|اشرح|ما\s+هو|ما\s+هي|كيف|قارن|علل|وضح)\b/i.test(lower);

  const hasMaterialKeywords =
    /\b(quiz|kedis|اختبار قصير|exam|imtixaan|امتحان|homework|shaqada guriga|واجب|assignment|layli|تكليف|lesson plan|qorshe cashar|qorshaha casharka|خطة درس|answer key|marking rubric|rubric|question set|problem set|xidhmada su'aalo|مجموعة أسئلة|study material|agabka casharka|مادة تعليمية)\b/i.test(lower) ||
    (/\b(test|tests)\b/i.test(lower) && !isExplanationOrInquiry);

  const hasQuestionCount = /\b\d{1,2}\s*(questions?|problems?|su'aal|suaal|أسئلة|سؤال|mcqs?)\b/i.test(lower);
  const hasCreationAction = /\b(generate|create|prepare|make|build|qor|samee|diyaari|أنشئ|اصنع|أعد|جهّز)\b/i.test(lower);

  const isMaterialGeneration = isExplanationOrInquiry
    ? (hasCreationAction && (hasMaterialKeywords || hasQuestionCount))
    : (hasMaterialKeywords || hasQuestionCount || (hasCreationAction && (lower.includes('questions') || lower.includes('plan') || lower.includes('quiz'))));

  const result: ParsedTeacherRequest = {
    intent: isMaterialGeneration ? 'generate_material' : 'conversational_question',
  };

  // 1. Content Type detection
  if (lower.includes('lesson plan') || lower.includes('lesson') || lower.includes('qorshaha casharka') || lower.includes('خطة درس')) {
    result.contentType = 'lesson_plan';
  } else if (lower.includes('teaching material') || lower.includes('study material') || lower.includes('lecture notes') || lower.includes('qoraalka casharka') || lower.includes('مادة تعليمية')) {
    result.contentType = 'teaching_material';
  } else if (lower.includes('answer key') || lower.includes('marking rubric') || lower.includes('jawaabaha') || lower.includes('نموذج إجابة')) {
    result.contentType = 'answer_key';
  } else if (lower.includes('question set') || lower.includes('problem set') || lower.includes('su\'aalo') || lower.includes('مجموعة أسئلة')) {
    result.contentType = 'question_set';
  } else if (lower.includes('quiz') || lower.includes('kedis') || lower.includes('اختبار قصير')) {
    result.contentType = 'quiz';
  } else if (lower.includes('test') || lower.includes('exam') || lower.includes('imtixaan') || lower.includes('امتحان') || lower.includes('اختبار')) {
    result.contentType = 'test';
  } else if (lower.includes('homework') || lower.includes('home work') || lower.includes('shaqada guriga') || lower.includes('واجب منزلي')) {
    result.contentType = 'homework';
  } else if (lower.includes('assignment') || lower.includes('layli') || lower.includes('exercise') || lower.includes('تكليف')) {
    result.contentType = 'assignment';
  }

  // 2. Grade / Level detection
  const gradeMatch = lower.match(/grade\s*([1-9]|1[0-2])\b/i) || lower.match(/fasalka\s*([1-9]|1[0-2])\b/i) || lower.match(/الصف\s*([1-9]|1[0-2])\b/i);
  if (gradeMatch) {
    result.gradeOrLevel = `Grade ${gradeMatch[1]}`;
  } else if (lower.includes('university') || lower.includes('undergraduate') || lower.includes('college') || lower.includes('jaamacad') || lower.includes('جامع')) {
    result.gradeOrLevel = 'University';
  } else if (lower.includes('high school') || lower.includes('secondary') || lower.includes('dugsiga sare') || lower.includes('ثانوي')) {
    result.gradeOrLevel = 'Grade 10';
  } else if (lower.includes('middle school') || lower.includes('dhexe') || lower.includes('متوسط')) {
    result.gradeOrLevel = 'Grade 8';
  } else if (lower.includes('primary') || lower.includes('hoose') || lower.includes('ابتدائي')) {
    result.gradeOrLevel = 'Grade 4';
  } else if (lower.includes('beginner') || lower.includes('aasaasi') || lower.includes('مبتدئ')) {
    result.gradeOrLevel = 'Beginner';
  } else if (lower.includes('intermediate') || lower.includes('dhexdhexaad') || lower.includes('متوسط المستوى')) {
    result.gradeOrLevel = 'Intermediate';
  } else if (lower.includes('advanced') || lower.includes('heer sare') || lower.includes('متقدم')) {
    result.gradeOrLevel = 'Advanced';
  }

  // 3. Subject detection using Canonical Curriculum subjects
  if (lower.includes('math') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('geometry') || lower.includes('xisaab') || lower.includes('رياضيات')) {
    result.subject = 'Mathematics';
  } else if (lower.includes('physic') || lower.includes('fiisigis') || lower.includes('فيزياء')) {
    result.subject = 'Physics';
  } else if (lower.includes('biolog') || lower.includes('noolaha') || lower.includes('أحياء') || lower.includes('احياء')) {
    result.subject = 'Biology';
  } else if (lower.includes('chemist') || lower.includes('kimistari') || lower.includes('كيمياء')) {
    result.subject = 'Chemistry';
  } else if (lower.includes('python') || lower.includes('programming') || lower.includes('computer science') || lower.includes('coding') || lower.includes('barnaamij') || lower.includes('برمجة') || lower.includes('حاسوب')) {
    result.subject = 'Computer Science';
  } else if (lower.includes('economic') || lower.includes('dhaqaale') || lower.includes('اقتصاد')) {
    result.subject = 'Economics';
  } else if (lower.includes('accounting') || lower.includes('xisaabaad') || lower.includes('محاسبة')) {
    result.subject = 'Accounting';
  } else if (lower.includes('english') || lower.includes('ingiriis') || lower.includes('إنجليزي')) {
    result.subject = 'English';
  } else if (lower.includes('arabic') || lower.includes('carabi') || lower.includes('عربي')) {
    result.subject = 'Arabic';
  } else if (lower.includes('somali') || lower.includes('soomaali') || lower.includes('صومالي')) {
    result.subject = 'Somali';
  } else if (lower.includes('engineering') || lower.includes('injineer') || lower.includes('هندسة')) {
    result.subject = 'Engineering';
  } else if (lower.includes('psycholog') || lower.includes('cilminafsi') || lower.includes('علم النفس')) {
    result.subject = 'Psychology';
  }

  // 4. Topic extraction
  if (lower.includes('photosynthesis') || lower.includes('fotosinteesis') || lower.includes('البناء الضوئي')) {
    result.topic = 'Photosynthesis';
    if (!result.subject) result.subject = 'Biology';
  } else if (lower.includes('electricity') || lower.includes('koronto') || lower.includes('كهرباء') || lower.includes('circuits')) {
    result.topic = 'Electricity & Circuits';
    if (!result.subject) result.subject = 'Physics';
  } else if (lower.includes('linear equation') || lower.includes('isbarbardhigyada') || lower.includes('معادلات خطية')) {
    result.topic = 'Linear Equations';
    if (!result.subject) result.subject = 'Mathematics';
  } else if (lower.includes('algebra') || lower.includes('aljebra') || lower.includes('جبر')) {
    result.topic = 'Algebra';
    if (!result.subject) result.subject = 'Mathematics';
  } else if (lower.includes('python') || lower.includes('functions') || lower.includes('loops') || lower.includes('data structures')) {
    result.topic = lower.includes('data structure') ? 'Data Structures & Algorithms' : 'Python Fundamentals';
    if (!result.subject) result.subject = 'Computer Science';
  } else if (lower.includes('macroeconomic') || lower.includes('microeconomic') || lower.includes('inflation') || lower.includes('gdp')) {
    result.topic = lower.includes('macro') ? 'Macroeconomics' : 'Microeconomics & Market Structures';
    if (!result.subject) result.subject = 'Economics';
  } else if (lower.includes('pythagorean') || lower.includes('triangle')) {
    result.topic = 'Pythagorean Theorem & Geometry';
    if (!result.subject) result.subject = 'Mathematics';
  } else if (lower.includes('cell division') || lower.includes('mitosis') || lower.includes('meiosis')) {
    result.topic = 'Cell Division & Mitosis';
    if (!result.subject) result.subject = 'Biology';
  } else if (lower.includes('newton') || lower.includes('forces') || lower.includes('motion')) {
    result.topic = "Newton's Laws of Motion";
    if (!result.subject) result.subject = 'Physics';
  }

  // Dynamic topic extraction fallback for phrases like "about...", "on...", "covering..."
  if (!result.topic) {
    const topicMatch = text.match(/(?:about|on|covering|topic|mawduuca|ku saabsan|عن|حول)\s+([^,.;]+)/i);
    if (topicMatch && topicMatch[1]) {
      const extracted = topicMatch[1].trim();
      if (!/^(easy|medium|hard|questions|\d+|very|extremely)/i.test(extracted)) {
        result.topic = extracted;
      }
    }
  }

  // 5. Question count detection
  const qMatch = lower.match(/(\d{1,2})[\s-]*(questions?|qs|problems?|su'aal|suaal|أسئلة|سؤال)\b/i);
  if (qMatch) {
    const num = parseInt(qMatch[1], 10);
    if (num > 0 && num <= 50) {
      result.questionCount = num;
    }
  }

  // 6. Difficulty detection (MUST map exactly to the 5 approved difficulties)
  if (lower.includes('extremely hard') || lower.includes('aad u adag') || lower.includes('صعب للغاية')) {
    result.difficulty = 'Extremely Hard';
  } else if (lower.includes('very hard') || lower.includes('si weyn u adag') || lower.includes('صعب جدا')) {
    result.difficulty = 'Very Hard';
  } else if (lower.includes('hard') || lower.includes('adag') || lower.includes('صعب')) {
    result.difficulty = 'Hard';
  } else if (lower.includes('easy') || lower.includes('fudud') || lower.includes('سهل')) {
    result.difficulty = 'Easy';
  } else if (lower.includes('medium') || lower.includes('moderate') || lower.includes('dhexdhexaad') || lower.includes('متوسط')) {
    result.difficulty = 'Medium';
  }

  // 7. Language detection
  if (/[\u0600-\u06FF]/.test(text)) {
    result.language = 'Arabic';
  } else if (
    lower.includes('in somali') ||
    lower.includes('somali language') ||
    lower.includes('af-soomaali') ||
    lower.includes('soomaali ahaan') ||
    /\b(sharax|ii\s+sharax|magac-u-yaal|tusaalooyin|fasalka|kedis|layli|imtixaan)\b/i.test(lower)
  ) {
    result.language = 'Somali';
  } else if (lower.includes('in arabic') || lower.includes('arabic language') || lower.includes('bil-carabi') || lower.includes('باللغة العربية') || lower.includes('بالعربية')) {
    result.language = 'Arabic';
  } else if (lower.includes('in english') || lower.includes('english language') || lower.includes('ingiriisi')) {
    result.language = 'English';
  }

  return result;
}

/**
 * Pedagogical Content Generator (Canonical curriculum-grounded engine)
 */
export async function generateTeacherContent(
  params: TeacherAiGenerationParams
): Promise<GeneratedTeacherMaterial> {
  const {
    contentType,
    gradeOrLevel,
    subject,
    topic,
    questionCount,
    difficulty,
    language,
    durationMinutes = contentType === 'quiz' ? 20 : contentType === 'test' ? 60 : 45,
    totalMarks = questionCount * 5,
    questionType = 'Mixed',
    additionalInstructions = '',
    classroomId,
    teacherId,
    teacherName,
  } = params;

  const typeDisplayNames: Record<TeacherMaterialType, { en: string; so: string; ar: string }> = {
    assignment: { en: 'Assignment', so: 'Layli', ar: 'تكليف دراسي' },
    homework: { en: 'Homework Problem Set', so: 'Shaqada Guriga', ar: 'واجب منزلي' },
    quiz: { en: 'Quiz Assessment', so: 'Kedis', ar: 'اختبار قصير' },
    test: { en: 'Comprehensive Test', so: 'Imtixaan', ar: 'امتحان شامل' },
    lesson_plan: { en: 'Structured Lesson Plan', so: 'Qorshaha Casharka', ar: 'خطة درس تعليمية' },
    question_set: { en: 'Question & Practice Set', so: 'Xidhmada Su\'aalaha', ar: 'مجموعة أسئلة تدريبية' },
    answer_key: { en: 'Answer Key & Rubric', so: 'Furaha Jawaabaha & Miisaanka', ar: 'نموذج إجابة وسلم تنقيط' },
    teaching_material: { en: 'Teaching & Lecture Material', so: 'Qoraalka Casharka & Agabka', ar: 'مادة تعليمية وملاحظات' },
    grading_support: { en: 'Grading Support', so: 'Taageerada Qiimaynta', ar: 'دليل التصحيح' },
  };

  const currentTypeTitle = typeDisplayNames[contentType]?.[language === 'Arabic' ? 'ar' : language === 'Somali' ? 'so' : 'en'] || 'Material';

  const title =
    language === 'Arabic'
      ? `${subject} — ${topic} (${gradeOrLevel}) · ${currentTypeTitle}`
      : language === 'Somali'
      ? `${subject} — ${topic} (${gradeOrLevel}) · ${currentTypeTitle}`
      : `${gradeOrLevel} ${subject}: ${topic} · ${currentTypeTitle}`;

  // Content generation dispatch
  let questionsBody = '';
  let answerKeyBody = '';
  let markingSchemeBody = '';
  let rubricList: string[] = [];
  let learningObjectives: string[] = [];
  let structuredQuestions: AssignmentQuestion[] | undefined = undefined;

  if (contentType === 'lesson_plan') {
    const lp = generateLessonPlanContent(params);
    questionsBody = lp.content;
    answerKeyBody = lp.pedagogicalObjectives;
    markingSchemeBody = lp.teacherNotes;
    learningObjectives = lp.objectivesList;
  } else if (contentType === 'teaching_material') {
    const tm = generateTeachingMaterialContent(params);
    questionsBody = tm.content;
    answerKeyBody = tm.conceptsKey;
    markingSchemeBody = tm.guidanceNotes;
    learningObjectives = tm.objectivesList;
  } else {
    const qData = generateAssessmentQuestions(params);
    questionsBody = qData.questions;
    answerKeyBody = qData.answerKey;
    markingSchemeBody = qData.markingScheme;
    rubricList = qData.rubric;
    learningObjectives = qData.objectives;
    structuredQuestions = qData.structuredQuestions;
  }

  const generatedId = `mat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: generatedId,
    type: contentType,
    title,
    subject,
    gradeOrLevel,
    topic,
    difficulty,
    questionCount,
    content: questionsBody,
    answerKey: answerKeyBody,
    markingScheme: markingSchemeBody,
    gradingRubric: rubricList,
    createdAt: new Date().toLocaleDateString(language === 'Arabic' ? 'ar-EG' : language === 'Somali' ? 'so-SO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    language,
    classroomId,
    teacherId,
    teacherName,
    durationMinutes,
    totalMarks,
    questionType,
    learningObjectives,
    structuredQuestions,
  };
}

/**
 * Question generator for assessments, assignments, homework, tests, quizzes, and question sets
 */
function generateAssessmentQuestions(params: TeacherAiGenerationParams) {
  const { subject, topic, gradeOrLevel, difficulty, questionCount, language, totalMarks = questionCount * 5 } = params;
  const ptsPerQ = Math.max(1, Math.round(totalMarks / questionCount));

  const questions: string[] = [];
  const answers: string[] = [];
  const markingCriteria: string[] = [];
  const structuredQuestions: AssignmentQuestion[] = [];

  for (let i = 1; i <= questionCount; i++) {
    const isMcq = i % 3 === 1 && (params.questionType === 'Multiple Choice' || params.questionType === 'Mixed');
    const isTrueFalse = i % 4 === 0 && (params.questionType === 'True / False' || params.questionType === 'Mixed');
    const qId = `q_gen_${i}_${Date.now().toString(36)}`;

    if (language === 'Arabic') {
      if (isMcq) {
        const prompt = `في موضوع ${topic}، أي من العبارات التالية صحيحة؟`;
        const options = [
          'أ) الخيار الأول: التعريف المبدئي للظاهرة',
          'ب) الخيار الثاني: التطبيق العملي للمعادلة والمبدأ الأساسي',
          'ج) الخيار الثالث: المتغير التابع عند ثبوت المعاملات',
          'د) الخيار الرابع: لا توجد إجابة صحيحة',
        ];
        questions.push(
          `${i}. [${ptsPerQ} درجات] ${prompt}\n   ${options.join('\n   ')}`
        );
        answers.push(`السؤال ${i}: الإجابة الصحيحة هي (ب). التفسير: يتفق مع المبدأ الأساسي في ${topic}.`);
        structuredQuestions.push({
          id: qId,
          type: 'multiple_choice',
          prompt,
          options,
          correctAnswer: 'ب',
          expectedAnswer: 'الخيار الثاني (ب): التطبيق العملي للمعادلة والمبدأ الأساسي',
          points: ptsPerQ,
          explanation: `يتفق مع المبدأ الأساسي في ${topic}.`,
          subjectDomain: 'general',
        });
      } else if (isTrueFalse) {
        const prompt = `صح أم خطأ: تطبيق ${topic} في مستوى (${gradeOrLevel}) يتطلب دائماً ثبات المتغير المستقل.`;
        questions.push(`${i}. [${ptsPerQ} درجات] ${prompt}`);
        answers.push(`السؤال ${i}: خطأ. التعليل: يعتمد ذلك على شروط التجربة والبيئة الفيزيائية أو الرياضية.`);
        structuredQuestions.push({
          id: qId,
          type: 'true_false',
          prompt,
          correctAnswer: 'خطأ',
          expectedAnswer: 'خطأ. يعتمد ذلك على شروط التجربة والبيئة الفيزيائية أو الرياضية.',
          points: ptsPerQ,
          explanation: 'المتغير المستقل لا يشترط ثباته في جميع التطبيقات التجريبية والرياضية.',
          subjectDomain: 'general',
        });
      } else {
        const prompt = `وضح خطوات حل مسألة ${topic} بالتفصيل: احسب الناتج النهائي عند تطبيق المعامل ${(i * 2) + 3}، مع تبيين خطوات الاشتقاق والقوانين المستخدمة.`;
        questions.push(`${i}. [${ptsPerQ} درجات] ${prompt}`);
        answers.push(
          `السؤال ${i}: خطوات الحل:\n   1. كتابة القانون العام لـ ${topic} (درجتان)\n   2. التعويض بالمعطيات بدقة: x = ${(i * 2) + 3} (درجة ونصف)\n   3. النتيجة النهائية المحددة مع الوحدات: ${(i * 5.4).toFixed(1)} (درجة ونصف).`
        );
        structuredQuestions.push({
          id: qId,
          type: 'problem_solving',
          prompt,
          correctAnswer: `${(i * 5.4).toFixed(1)}`,
          expectedAnswer: `كتابة القانون وتطبيق المعامل ${(i * 2) + 3} للوصول للناتج ${(i * 5.4).toFixed(1)} مع الوحدات.`,
          points: ptsPerQ,
          explanation: 'تطبيق مباشر للقوانين الفيزيائية/الرياضية الخاصة بالموضوع.',
          subjectDomain: subject.toLowerCase().includes('math') ? 'math' : 'physics',
          rubricCriteria: [
            { criterion: 'كتابة القانون والمنهجية', description: 'اختيار القانون المناسب', points: Math.round(ptsPerQ * 0.4) },
            { criterion: 'التعويض والحسابات', description: 'دقة الحساب الرياضي', points: Math.round(ptsPerQ * 0.4) },
            { criterion: 'الناتج والوحدات', description: 'صحة الناتج والوحدات', points: Math.max(1, ptsPerQ - Math.round(ptsPerQ * 0.8)) },
          ],
        });
      }
      markingCriteria.push(`السؤال ${i}: ${ptsPerQ} درجات (60% للخطوات المنهجية، 40% للدقة الحسابية والوحدات)`);
    } else if (language === 'Somali') {
      if (isMcq) {
        const prompt = `Mawduuca ${topic}, kee baa ah bayaanka saxda ah?`;
        const options = [
          'B) Doorkeeda koowaad: Qeexidda guud ee mawduuca',
          'T) Doorkeeda labaad: Xallinta xisaabeed ee heerka ku habboon',
          'J) Doorkeeda saddexaad: Isbeddelka ku yimaada natiijada',
          'X) Dhammaan waa sax',
        ];
        questions.push(`${i}. [${ptsPerQ} Dhibcood] ${prompt}\n   ${options.join('\n   ')}`);
        answers.push(`Su'aasha ${i}: Jawaabta saxda ah waa (T). Faahfaahin: Waxay waafaqsan tahay qaanuunka rasmiga ah ee ${topic}.`);
        structuredQuestions.push({
          id: qId,
          type: 'multiple_choice',
          prompt,
          options,
          correctAnswer: 'T',
          expectedAnswer: 'T) Doorkeeda labaad: Xallinta xisaabeed ee heerka ku habboon',
          points: ptsPerQ,
          explanation: `Waxay waafaqsan tahay qaanuunka rasmiga ah ee ${topic}.`,
          subjectDomain: 'general',
        });
      } else if (isTrueFalse) {
        const prompt = `Sax mise Khalad: Fahamka ${topic} ee heerka (${gradeOrLevel}) wuxuu u baahan yahay tillaabooyin go'an oo aan isbeddelin.`;
        questions.push(`${i}. [${ptsPerQ} Dhibcood] ${prompt}`);
        answers.push(`Su'aasha ${i}: Sax. Sharaxaad: Dhammaan ardayda waa inay raacaan habka caadiga ah ee xallinta.`);
        structuredQuestions.push({
          id: qId,
          type: 'true_false',
          prompt,
          correctAnswer: 'Sax',
          expectedAnswer: 'Sax. Dhammaan ardayda waa inay raacaan habka caadiga ah ee xallinta.',
          points: ptsPerQ,
          explanation: 'Habka tillaabo-tallaabada ah wuxuu xaqiijinayaa saxnaanta natiijada.',
          subjectDomain: 'general',
        });
      } else {
        const prompt = `Xisaabi oo caddee tillaabooyinka xallinta ${topic}: Haddii qiimaha bilowgu yahay ${(i * 3) + 2}, keen natiijada kama dambaysta ah adigoo sharraxaya habka aad u martay.`;
        questions.push(`${i}. [${ptsPerQ} Dhibcood] ${prompt}`);
        answers.push(
          `Su'aasha ${i}: Tillaabooyinka xallinta:\n   1. Qorista qaacidada saxda ah ee ${topic} (2 dhibcood)\n   2. Beddelidda tirooyinka: ${(i * 3) + 2} (1.5 dhibcood)\n   3. Natiijada ugu dambaysa oo buuxda: ${(i * 4.5).toFixed(1)} (1.5 dhibcood).`
        );
        structuredQuestions.push({
          id: qId,
          type: 'problem_solving',
          prompt,
          correctAnswer: `${(i * 4.5).toFixed(1)}`,
          expectedAnswer: `Qaacidada tooska ah iyo xisaabinta qiimaha ${(i * 4.5).toFixed(1)}.`,
          points: ptsPerQ,
          explanation: `Qaanuunka aasaasiga ah ee ${topic}.`,
          subjectDomain: subject.toLowerCase().includes('math') ? 'math' : 'physics',
        });
      }
      markingCriteria.push(`Su'aasha ${i}: ${ptsPerQ} dhibcood (Fahamka habka 60%, saxnaanta xisaabta 40%)`);
    } else {
      // English
      if (isMcq) {
        const prompt = `In ${topic} (${gradeOrLevel} level), which of the following statements is conceptually correct?`;
        const options = [
          'A) The rate of change remains invariant regardless of the boundary condition.',
          'B) The primary governing relation demonstrates direct proportionality under standard conditions.',
          'C) The inverse factor eliminates all higher-order coefficients.',
          'D) None of the above.',
        ];
        questions.push(`${i}. [${ptsPerQ} pts] ${prompt}\n   ${options.join('\n   ')}`);
        answers.push(`Question ${i}: Correct Option: (B)\nExplanation: According to the core principles of ${topic}, direct proportionality holds under standard parameters.`);
        structuredQuestions.push({
          id: qId,
          type: 'multiple_choice',
          prompt,
          options,
          correctAnswer: 'B',
          expectedAnswer: 'B) The primary governing relation demonstrates direct proportionality under standard conditions.',
          points: ptsPerQ,
          explanation: `According to the core principles of ${topic}, direct proportionality holds under standard conditions.`,
          subjectDomain: 'general',
        });
      } else if (isTrueFalse) {
        const prompt = `True or False: In ${gradeOrLevel} ${subject}, solving a multi-step ${topic} problem requires verifying domain constraints prior to finalizing the solution.`;
        questions.push(`${i}. [${ptsPerQ} pts] ${prompt}`);
        answers.push(`Question ${i}: True.\nExplanation: Verifying domain and boundary constraints is necessary to prevent extraneous solutions.`);
        structuredQuestions.push({
          id: qId,
          type: 'true_false',
          prompt,
          correctAnswer: 'True',
          expectedAnswer: 'True. Verifying domain and boundary constraints prevents extraneous results.',
          points: ptsPerQ,
          explanation: 'Verifying domain constraints is essential to guarantee left-hand and right-hand side balance.',
          subjectDomain: 'general',
        });
      } else {
        const prompt = `Solve the foundational problem in ${topic}:\nGiven initial variable parameter ${(i + 2)}x - ${(i * 3)} = ${(i * 4) + 12}.\n(a) Isolate the variable showing inverse steps.\n(b) State the exact solution for x.`;
        const ansVal = ((i * 7 + 12) / (i + 2)).toFixed(2);
        questions.push(`${i}. [${ptsPerQ} pts] ${prompt}`);
        answers.push(
          `Question ${i}: Detailed Solution:\n   (a) Add ${(i * 3)} to both sides: ${(i + 2)}x = ${(i * 7) + 12}.\n   (b) Divide by ${(i + 2)}: x = ${ansVal}.`
        );
        structuredQuestions.push({
          id: qId,
          type: 'problem_solving',
          prompt,
          correctAnswer: `x = ${ansVal}`,
          expectedAnswer: `x = ${ansVal}. Steps: ${(i + 2)}x = ${(i * 7) + 12} => x = ${ansVal}.`,
          points: ptsPerQ,
          explanation: 'Expand, combine constants, and apply balanced division.',
          subjectDomain: subject.toLowerCase().includes('math') ? 'math' : 'physics',
          rubricCriteria: [
            { criterion: 'Algebraic Isolation', description: 'Perform inverse operations to isolate x', points: Math.round(ptsPerQ * 0.5) },
            { criterion: 'Accurate Calculation', description: `Compute x = ${ansVal}`, points: ptsPerQ - Math.round(ptsPerQ * 0.5) },
          ],
        });
      }
      markingCriteria.push(`Question ${i}: ${ptsPerQ} Points total (Method: 40%, Computation/Argument: 40%, Accuracy & Units: 20%)`);
    }
  }

  const headerInstructions =
    language === 'Arabic'
      ? `تعليمات للطلاب:\n1. أجب عن جميع الأسئلة (${questionCount} أسئلة) بوضوح ودقة.\n2. اكتب خطوات الحل الرياضي أو التفسير العلمي بالتفصيل لنيل كامل الدرجات.\n3. تأكد من كتابة الوحدات والرموز الاصطلاحية الصحيحة.\n4. زمن الإنجاز المقترح: ${params.durationMinutes || 45} دقيقة.`
      : language === 'Somali'
      ? `TUSMOOYINKA ARDAYDA:\n1. Ka jawaab dhammaan ${questionCount}-ka su'aalood adigoo qoraya tillaabooyinka.\n2. Muuji qaaciddada iyo xisaabinta si aad u hesho dhibcaha buuxa.\n3. Hubi unugyada iyo qoraalka saxda ah.\n4. Wakhtiga loo qoondeeyay: ${params.durationMinutes || 45} daqiiqo.`
      : `STUDENT INSTRUCTIONS:\n1. Answer all ${questionCount} questions thoroughly within the allotted time (${params.durationMinutes || 45} mins).\n2. Clearly document all derivations, formulas, and reasoning steps for maximum partial credit.\n3. Label all numerical results with appropriate units and significant figures.\n4. Review your submission prior to turning it in.`;

  const rubric = [
    language === 'Arabic'
      ? 'الفهم النظري والمفاهيمي (40%): الاستدلال الصحيح واختيار القوانين الملائمة'
      : language === 'Somali'
      ? 'Fahamka Aragtiyeed (40%): Doorashada saxda ah ee xeerarka iyo qaaciidooyinka'
      : 'Conceptual Mastery (40%): Accurate formula selection and theoretical framing',
    language === 'Arabic'
      ? 'خطوات الحل والمنهجية (40%): التحويلات السليمة والتسلسل المنطقي'
      : language === 'Somali'
      ? 'Tillaabooyinka Xallinta (40%): Isku-dubaridka iyo habka xisaabinta'
      : 'Procedural Rigor (40%): Clear algorithmic derivations and algebraic transformations',
    language === 'Arabic'
      ? 'الدقة النهائية والوحدات (20%): صحة الناتج النهائي وتدوين الوحدات'
      : language === 'Somali'
      ? 'Natiijada Kama Dambaysta ah (20%): Saxnaanta jawaabta iyo unugyada'
      : 'Precision & Units (20%): Evaluated answer correctness and metric unit designations',
  ];

  const objectives = [
    `Master foundational principles of ${topic} aligned with ${gradeOrLevel} curriculum`,
    `Apply critical problem-solving and structured deductive steps`,
    `Demonstrate fluency in academic terminology and procedural derivations`,
  ];

  return {
    questions: `${headerInstructions}\n\n──────────────────────────────\n\n${questions.join('\n\n')}`,
    answerKey: answers.join('\n\n'),
    markingScheme: `──────────────────────────────\nMARKING SCHEME & POINT DISTRIBUTION (Total: ${totalMarks} Marks)\n──────────────────────────────\n\n${markingCriteria.join('\n')}`,
    rubric,
    objectives,
    structuredQuestions,
  };
}

/**
 * Lesson plan generator
 */
function generateLessonPlanContent(params: TeacherAiGenerationParams) {
  const { gradeOrLevel, subject, topic, difficulty, language, durationMinutes = 60 } = params;

  if (language === 'Arabic') {
    return {
      content: `خطة الدرس الأكاديمية: ${topic}
المستوى: ${gradeOrLevel} | المادة: ${subject} | المدة: ${durationMinutes} دقيقة | مستوى الصعوبة: ${difficulty}

1. الأهداف التعليمية (Learning Objectives):
   - أن يفهم الطالب المفهوم الأساسي لـ ${topic} بدقة علمية.
   - أن يحل الطالب تدريبات تطبيقية متنوعة في مستوى ${gradeOrLevel}.
   - أن يربط الطالب بين النظرية العلمية والتطبيقات اليومية.

2. التهيئة والتمهيد (Starter / Hook - 10 دقائق):
   - سؤال استثاري على السبورة لربط الدرس بالخبرات السابقة.
   - مناقشة موجزة مع الطلاب حول دور ${topic} وأهميته.

3. التدريس المباشر (Direct Instruction - 20 دقيقة):
   - شرح المفاهيم المحورية والمصطلحات الدقيقة.
   - استعراض نموذج توضيحي خطوة بخطوة مع الطلاب.

4. الممارسة الموجهة (Guided Practice - 15 دقيقة):
   - عمل جماعي في ثنائيات لحل تمرينين تطبيقيين مع إشراف المعلم وتصحيح المفاهيم الخاطئة.

5. الممارسة المستقلة (Independent Practice - 10 دقائق):
   - حل مسألة فردية لتقييم استيعاب كل طالب.

6. الغلق وتذكرة الخروج (Plenary / Exit Ticket - 5 دقائق):
   - تلخيص النقاط الجوهرية وتسليم بطاقة إجابة سريعة.`,
      pedagogicalObjectives: `النتائج المرجوة:
1. تحقيق نسبة إتقان لا تقل عن 85% بين الطلاب.
2. تدوين الملاحظات التمايزية لدعم الطلاب الذين يحتاجون تعزيزاً.`,
      teacherNotes: `ملاحظات المعلم والمواد المطلوبة:
- بطاقات تدريبية للأنشطة الثنائية
- جهاز عرض تفاعلي أو سبورة تعليمية
- التمايز: توفير أسئلة إضافية للطلاب المتقدمين، ودليل خطوات للطلاب المتعثرين.`,
      objectivesList: [`استيعاب مفاهيم ${topic}`, `تطبيق عملي فردي وثنائي`, `تقييم ختامي عبر تذكرة الخروج`],
    };
  }

  if (language === 'Somali') {
    return {
      content: `QORSHAHA CASHARKA: ${topic}
Heerka: ${gradeOrLevel} | Maaddada: ${subject} | Wakhtiga: ${durationMinutes} Daqiiqo | Adkaanta: ${difficulty}

1. YOOLALKA WAXBARASHADA:
   - In ardaydu si cad u qeexaan una fahmaan ${topic}.
   - Inay xalliyaan tusaalooyin la taaban karo oo heerka ${gradeOrLevel} ah.
   - Inay si madaxbannaan u muujiyaan fahamkooda.

2. BILAABIDDA CASHARKA & DHIIRRIGELIN (10 Daqiiqo):
   - Su'aal kicinaysa maanka oo lagu bilaabo casharka si loo xusuusto casharkii hore.
   - Hordhac kooban oo ku saabsan sababta ${topic} muhiimka u yahay.

3. BARID TOOS AH OO MACALLINKU HOGGAAMINAYO (20 Daqiiqo):
   - Sharraxaadda fikradaha muhiimka ah iyo qawaaniinta.
   - Xallinta laba tusaale oo tallaabo-tallaabo ah.

4. TABABAR WADA-JIR AH (15 Daqiiqo):
   - Ardayda oo laba-laba u wada shaqaynaya si ay u dhammaystiraan layliyo tijaabo ah.

5. SHAQO MADAXBANNAAN (10 Daqiiqo):
   - Arday kasta oo xallinaya su'aal gaar ah si loo ogaado heerka fahamka.

6. SOO KOOBID & TIKIDH BIXITAAN (5 Daqiiqo):
   - Dib u eegid degdeg ah iyo jawaab-celin kooban.`,
      pedagogicalObjectives: `Yoolalka Barbaarinta:
1. In ugu yaraan 85% ardaydu gaadhaan faham buuxa.
2. Diyaarinta agab kala duwan oo taageeraya ardayda caawinta u baahan.`,
      teacherNotes: `Xusuus-qorka Macallinka:
- Waraaqaha layliga ee laba-laba loogu talagalay
- Taageero gaar ah oo la siinayo ardayda degdegga ah iyo kuwa u baahan caddayn dheeraad ah.`,
      objectivesList: [`Fahamka buuxa ee ${topic}`, `Xallinta layliyada heerka ${gradeOrLevel}`, `Qiimaynta shaqada madaxbannaan`],
    };
  }

  // English Default Lesson Plan
  return {
    content: `STANDARDIZED PEDAGOGICAL LESSON PLAN: ${topic.toUpperCase()}
Grade Level: ${gradeOrLevel} | Discipline: ${subject} | Target Duration: ${durationMinutes} Minutes | Complexity: ${difficulty}

1. CURRICULAR LEARNING OUTCOMES:
   - Students will formulate and explain the key operational principles of ${topic}.
   - Students will execute procedural solutions to problem scenarios with systematic accuracy.
   - Students will critique common edge-case misconceptions and defend their answers.

2. ANTICIPATORY STARTER / HOOK (10 Minutes):
   - Display a provocative inquiry problem on the board connecting real-world phenomena to ${topic}.
   - Facilitate a 3-minute peer Think-Pair-Share check to activate prior schema.

3. DIRECT INSTRUCTION / MODELING (20 Minutes):
   - Instructor presents core vocabulary, structural mechanisms, and statutory rules.
   - 'I Do': Live walk-through of an exemplar problem with clear metacognitive narration.
   - Explicit callout of two prevalent errors to avoid during problem setup.

4. GUIDED COLLABORATIVE PRACTICE (15 Minutes):
   - 'We Do': Paired problem set where partners verify intermediate working steps.
   - Instructor conducts formative scans across the room, providing on-the-fly scaffolding.

5. INDEPENDENT MASTERY EXERCISE (10 Minutes):
   - 'You Do': Individual exercise without assistance to verify unassisted mastery.
   - Differentiated extension prompt prepared for rapid finishers.

6. CLOSURE & FORMATIVE EXIT TICKET (5 Minutes):
   - Students submit a 1-problem Exit Ticket assessing today's primary objective.
   - Homework assignment and follow-up reading assigned for next session.`,
    pedagogicalObjectives: `CORE PEDAGOGICAL TARGETS & BENCHMARKS:
1. Target: >= 85% cohort success threshold on the independent exit ticket.
2. Differentiation: Tiered scaffolds for striving learners (step checklist); extension challenge for advanced learners.
3. Formative Alignment: Immediate insight into tomorrow's starter problem focus.`,
    teacherNotes: `INSTRUCTOR RESOURCE REQUIREMENTS & ADVICE:
- Whiteboard / interactive display markers.
- Handout: 2-page guided worksheet with space for working steps and annotations.
- Misconception Watch: Students frequently confuse directional signs or formula constants in ${topic}; prompt verbal explanation of each transition step.`,
    objectivesList: [
      `Articulate foundational mechanics of ${topic}`,
      `Execute multi-step problem solving with peer and independent verification`,
      `Evaluate intermediate constraints through exit-ticket demonstration`,
    ],
  };
}

/**
 * Teaching Material & Study Notes Generator
 */
function generateTeachingMaterialContent(params: TeacherAiGenerationParams) {
  const { gradeOrLevel, subject, topic, difficulty, language } = params;

  if (language === 'Arabic') {
    return {
      content: `المادة التعليمية وملاحظات المحاضرة: ${topic}
المستوى: ${gradeOrLevel} | المادة: ${subject} | درجة الصعوبة: ${difficulty}

أولاً: ملخص المفهوم الرئيسي:
يُعد موضوع ${topic} من الركائز الأساسية في منهاج ${subject} لمستوى ${gradeOrLevel}. يتناول هذا المبحث العلاقات الرياضية أو العلمية التي تحكم التفاعل والتحول في الأنظمة المحددة.

ثانياً: المصطلحات والمفاهيم الجوهرية:
1. المفهوم الأولي: القاعدة العامة المنظمة للعملية.
2. المتغيرات والمحددات: الشروط الواجب توفرها لانطباق النموذج.
3. وحدات القياس والمعايير المعتمدة دولياً.

ثالثاً: مثال تطبيقي محلول بالتفصيل:
- المسألة: تطبيق القواعد العامة لـ ${topic} على نموذج افتراضي.
- خطوات الحل:
  1. استخراج المعطيات وحصر المجاهيل.
  2. تطبيق المعادلة الرئيسية ذات الصلة.
  3. استخراج القيمة العددية وكتابة التعليل المناسب.

رابعاً: أخطاء شائعة ينبغي تجنبها:
- الخلط بين المعاملات الثابتة والمتغيرات المستقلة.
- إهمال التحقق من صحة الناتج بالتعويض العكسي.`,
      conceptsKey: `ملخص المفاهيم والروابط الأساسية:
- ربط درس ${topic} بالفصول اللاحقة في منهاج ${subject}.
- مراجع تدريبية إضافية في المكتبة الرقمية لـ SmartEducate.`,
      guidanceNotes: `إرشادات للمدرس:
- يُنصح بتوزيع هذه المذكرة قبل بدء المحاضرة بيوم واحد لتشجيع القراءة المسبقة.
- استعن بالرسوم البيانية التوضيحية لترسيخ الفهم.`,
      objectivesList: [`استيعاب المفاهيم النظرية`, `مراجعة المسائل النموذجية`, `تجنب الأخطاء الشائعة`],
    };
  }

  if (language === 'Somali') {
    return {
      content: `AGABKA WAXBARASHADA & XUSUUS-QORKA CASHARKA: ${topic}
Heerka: ${gradeOrLevel} | Maaddada: ${subject} | Adkaanta: ${difficulty}

1. QODOBADA WAAWEYN EE CASHARKA:
   Mawduuca ${topic} waa saldhig muhiim u ah barashada ${subject} ee heerka ${gradeOrLevel}. Wuxuu ardayda siinayaa aasaas adag oo ku saabsan sida loo fahmo loona xalliyo dhibaatooyinka la xiriira.

2. ERAY-BIXINTA & QEEXIDDAHA MUHIIMKA AH:
   - Qeexidda Koowaad: Xeerka aasaasiga ah ee lagu hago mawduucan.
   - Doorsoomayaasha: Qaybaha isbeddelaya ee xisaabinta ama falanqaynta.
   - Natiijada la filayo: Heerka saxnaanta ee looga baahan yahay ardayga.

3. TUSAALE LA SHARRAXAY OO DHAMMAYSATIRAN:
   - Su'aasha: Xallinta tusaale toos ah oo ku saabsan ${topic}.
   - Tallaabooyinka:
     1. Kala saaridda xogta la hayo iyo waxa la doonayo.
     2. Adeegsiga qaacidada saxda ah.
     3. Keenidda jawaabta kama dambaysta ah.

4. KHALADAADKA CAADIGA AH EE LA ISKA ILAALIYO:
   - Isku-darka unugyada kala duwan.
   - Ka boodidda tillaabooyinka muhiimka ah ee xallinta.`,
      conceptsKey: `Fureha Fikradaha:
- Isku xirka ${topic} iyo casharrada xiga.
- Su'aalo dheeraad ah oo ardaydu ku celcelin karaan.`,
      guidanceNotes: `Hoggaanka Macallinka:
- U qaybi ardayda qoraalkan ka hor inta aan la gelin casharka.
- Diiradda saar tusaalooyinka la taaban karo.`,
      objectivesList: [`Fahamka qoraalka casharka`, `Raacitaanka tusaalooyinka xallisan`, `Iska ilaalinta khaladaadka`],
    };
  }

  // English Default Teaching Material
  return {
    content: `INSTRUCTOR LECTURE & STUDY NOTES: ${topic.toUpperCase()}
Academic Level: ${gradeOrLevel} | Course Area: ${subject} | Target Rigor: ${difficulty}

I. EXECUTIVE CONCEPTUAL OVERVIEW:
   ${topic} serves as a pillar within the ${gradeOrLevel} ${subject} syllabus. Mastery establishes conceptual continuity toward advanced coursework. Students must cultivate both abstract appreciation and practical computational dexterity.

II. ESSENTIAL THEORETICAL PRINCIPLES & FORMALISMS:
   1. Principle of Conservation / Boundary Invariance: Systems obeying ${topic} principles maintain equilibrium unless acted on by external vectors.
   2. Governing Metric Relations: Fundamental formulas describe exact quantitative interactions across independent and dependent factors.
   3. Operational Conditions: Valid under standard laboratory / classroom boundary approximations.

III. ANNOTATED WORKED EXEMPLAR FOR CLASSROOM DEMONSTRATION:
   Problem Formulation:
   Evaluate the behavior of a standard system governed by ${topic} parameters under test condition Alpha.
   Step-by-Step Derivation:
   - Step 1: Explicitly identify and tabulate known parameters and required unknowns.
   - Step 2: Establish the core canonical relation without intermediate rounding.
   - Step 3: Transform equation algebraically to isolate target variable.
   - Step 4: Substitute quantitative constants and compute final scalar with metric units.

IV. PEDAGOGICAL WARNINGS & FREQUENT STUDENT PITFALLS:
   - Pitfall A: Premature rounding in intermediate calculations resulting in compounding error.
   - Pitfall B: Omitting dimensional analysis checks before declaring the final result.
   - Pitfall C: Confusing cause-and-effect dependencies between correlated factors.`,
    conceptsKey: `CORE FORMULA COMPENDIUM & DEFINITIONS:
- Primary Metric: F_net = standard governing summation.
- Cross-Domain Utility: Directly interfaces with subsequent units in ${subject}.`,
    guidanceNotes: `INSTRUCTOR DELIVERY RECOMMENDATIONS:
- Distribute this reference document via the classroom study material portal prior to lecture.
- Encourage students to annotate the worked exemplar during interactive classroom problem sessions.`,
    objectivesList: [
      `Conceptual foundation of ${topic}`,
      `Methodological mastery through annotated exemplars`,
      `Proactive avoidance of classical student misconceptions`,
    ],
  };
}

/**
 * Helper to extract core problem prompts from raw content or structured questions
 */
function extractCoreQuestions(content: string, limit = 2): string[] {
  if (!content) return [];
  const lines = content.split('\n');
  const found: string[] = [];
  let currentPrompt = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(Question\s*\d+|Q\d+|السؤال\s*\d+|Su'aal\s*\d+|\d+\.)/i.test(trimmed)) {
      if (currentPrompt) {
        found.push(currentPrompt.slice(0, 160).trim());
        if (found.length >= limit) break;
      }
      currentPrompt = trimmed.replace(/^[^:]+:\s*/, '');
    } else if (
      currentPrompt &&
      trimmed &&
      !trimmed.startsWith('==') &&
      !trimmed.startsWith('STUDENT') &&
      !trimmed.startsWith('تعليمات') &&
      !trimmed.startsWith('TUSMOOYINKA')
    ) {
      if (currentPrompt.length < 130) {
        currentPrompt += ' ' + trimmed;
      }
    }
  }
  if (currentPrompt && found.length < limit) {
    found.push(currentPrompt.slice(0, 160).trim());
  }
  return found;
}

/**
 * Helper to extract core answers and reasoning from answer key text
 */
function extractCoreAnswers(answerKey: string, limit = 2): string[] {
  if (!answerKey) return [];
  const lines = answerKey.split('\n');
  const found: string[] = [];
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(Question\s*\d+|Q\d+|السؤال\s*\d+|Su'aal\s*\d+|\d+\.)/i.test(trimmed)) {
      if (current) {
        found.push(current.slice(0, 140).trim());
        if (found.length >= limit) break;
      }
      current = trimmed;
    } else if (current && trimmed && !trimmed.startsWith('==')) {
      if (current.length < 120) {
        current += ' ' + trimmed;
      }
    }
  }
  if (current && found.length < limit) {
    found.push(current.slice(0, 140).trim());
  }
  return found;
}

/**
 * Generates an authoritative educational explanation for natural voice readout.
 * Speaks the pedagogical reasoning behind the displayed material, actual questions, answers, and rubrics.
 */
export function generateEducationalVoiceExplanation(params: {
  material: GeneratedTeacherMaterial;
  tab: 'questions' | 'answers' | 'marking';
  language?: 'English' | 'Somali' | 'Arabic';
}): string {
  const { material, tab } = params;
  const lang = params.language || material.language || 'English';
  const topic = material.topic;
  const subject = material.subject;
  const grade = material.gradeOrLevel;
  const count = material.questionCount || 10;
  const diff = material.difficulty || 'Medium';

  const extractedQuestions = extractCoreQuestions(material.content, 2);
  const extractedAnswers = extractCoreAnswers(material.answerKey || '', 2);

  if (lang === 'Arabic') {
    if (tab === 'questions') {
      const qText = extractedQuestions.length > 0
        ? ` من أبرز الأسئلة المتضمنة: ${extractedQuestions.map((q, i) => `المسألة ${i + 1}: ${q}`).join('، ')}.`
        : '';
      return `مرحباً بكم. إليكم الشرح التربوي للأسئلة والتكليف الدراسي في مادة ${subject} لمستوى ${grade} حول موضوع ${topic}. تم إعداد هذا التكليف بمستوى صعوبة ${diff} ليغطي ${count} أسئلة منهجية.${qText} ينبغي على الطلاب التركيز على فهم المفاهيم الأساسية، والحرص على كتابة خطوات الحل الرياضية والفيزيائية بتسلسل دقيق مع ذكر الوحدات المناسبة.`;
    } else if (tab === 'answers') {
      const aText = extractedAnswers.length > 0
        ? ` فيما يلي أبرز نماذج الحلول المعتمدة: ${extractedAnswers.map((a, i) => `الإجابة ${i + 1}: ${a}`).join('، ')}.`
        : '';
      return `نموذج الإجابة المعتمد لموضوع ${topic} في مادة ${subject}.${aText} يوضح هذا الدليل الحلول النموذجية والخطوات المنهجية التي تضمن وصول الطالب للنتيجة الدقيقة. عند المراجعة، قارن إجابة الطالب بالتعليل الرياضي أو العلمي الموضح لكل سؤال، مع التأكد من سلامة الفرضيات والمصطلحات المستخدمة.`;
    } else {
      return `دليل ومعايير التصحيح لموضوع ${topic}. مجموع الدرجات ${material.totalMarks || count * 10} درجة. يتم توزيع الدرجات بناءً على ثلاثة محاور رئيسية: الاستيعاب المفاهيمي وصحة القوانين بنسبة أربعين بالمئة، خطوات الحل والاشتقاق الرياضي بنسبة أربعين بالمئة، والدقة الحسابية مع الوحدات بنسبة عشرين بالمئة. نوصي بمنح درجات جزئية عندما تكون المنهجية صحيحة.`;
    }
  }

  if (lang === 'Somali') {
    if (tab === 'questions') {
      const qText = extractedQuestions.length > 0
        ? ` Su'aalaha ugu muhiimsan waxaa ka mid ah: ${extractedQuestions.map((q, i) => `Su'aasha ${i + 1}aad: ${q}`).join('. ')}.`
        : '';
      return `Kusoo dhowow sharraxaadda baraha ee layligan ${subject} ee fasalka ${grade}, mawduuca ${topic}. Shaqadan waxbarasho waxaa loo diyaariyay heerka adkaanta ${diff}, waxayna ka kooban tahay ${count} su'aalood.${qText} Waxaa muhiim ah in ardaydu raacaan habka xallinta tillaabo-tallaabada ah oo ay caddeeyaan dhammaan unugyada iyo qaanuunada la adeegsaday.`;
    } else if (tab === 'answers') {
      const aText = extractedAnswers.length > 0
        ? ` Xallinta muhiimka ah: ${extractedAnswers.map((a, i) => `Qaybta ${i + 1}aad: ${a}`).join('. ')}.`
        : '';
      return `Furaha jawaabaha saxda ah ee maaddada ${subject}, mawduuca ${topic}.${aText} Halkan waxaa ku qoran dariiqada rasmiga ah ee su'aal kasta loo furfuray iyo sababta ka dambaysa natiijada saxda ah. Hubi in ardaygu keenay tillaabooyinka muhiimka ah ka hor inta aan la eegin lambarka kama dambaysta ah.`;
    } else {
      return `Miisaanka dhibcaha iyo hagaha saxidda ee ${topic}. Dhibcaha guud waa ${material.totalMarks || count * 10}. Dhibcaha waxaa loo qaybiyay saddex heer: Fahamka fikradda guud afartan boqolkiiba, tillaabooyinka xallinta afartan boqolkiiba, iyo saxnaanta natiijada labaatan boqolkiiba. Sii dhibco qayb ah haddii habka xallintu saxan yahay.`;
    }
  }

  // English (Default)
  if (tab === 'questions') {
    const qText = extractedQuestions.length > 0
      ? ` Primary questions include: ${extractedQuestions.map((q, i) => `Problem ${i + 1}: ${q}`).join('. ')}.`
      : '';
    return `Welcome. Here is the pedagogical walkthrough for this ${grade} ${subject} assignment on ${topic}. Structured at a ${diff} difficulty level across ${count} assessment problems, these questions evaluate both core theoretical comprehension and step-by-step analytical execution.${qText} Students should be reminded to clearly state their working steps, derivations, and final unit designations.`;
  } else if (tab === 'answers') {
    const aText = extractedAnswers.length > 0
      ? ` Key model solutions include: ${extractedAnswers.map((a, i) => `Item ${i + 1}: ${a}`).join('. ')}.`
      : '';
    return `Official Instructor Solution Guide for ${subject}: ${topic}.${aText} Each question incorporates the governing theorem, inverse transformations, and full algebraic or conceptual reasoning. When reviewing student work, verify that their intermediate working establishes the correct logical progression rather than just checking the final numerical value.`;
  } else {
    return `Assessment Rubric and Scoring Guide for ${topic}. Total marks: ${material.totalMarks || count * 10}. Grades are structured across three criteria: Conceptual understanding and formula selection earns forty percent, step-by-step execution and derivation earns forty percent, and final precision with dimensional accuracy earns twenty percent. Award partial credit whenever sound linear methodology is demonstrated.`;
  }
}

/**
 * Generates an authoritative voice explanation for an assessment in TeacherAssessmentsScreen
 */
export function generateAssessmentVoiceExplanation(
  assessment: TeacherAssessmentItem,
  language?: 'English' | 'Somali' | 'Arabic',
  tab: 'questions' | 'answers' | 'rubric' = 'questions'
): string {
  const lang = language || assessment.language || 'English';
  const topic = assessment.courseTopic || assessment.subject;
  const questions = assessment.questions || [];
  const qSummaries = questions.slice(0, 2).map((q, idx) => `Question ${idx + 1}: ${q.prompt}`);
  const aSummaries = questions.slice(0, 2).map((q, idx) => `Q${idx + 1}: ${q.expectedAnswer || q.correctAnswer}`);

  if (lang === 'Arabic') {
    if (tab === 'answers') {
      const aText = aSummaries.length > 0 ? ` الإجابات النموذجية: ${aSummaries.join('، ')}.` : '';
      return `نموذج الإجابة لتقييم ${assessment.title}.${aText} ينبغي على المعلم التحقق من صحة خطوات الحل واستخدام الرموز والوحدات العلمية الدقيقة.`;
    }
    const qText = qSummaries.length > 0 ? ` يتضمن التقييم: ${qSummaries.join('، ')}.` : '';
    return `شرح تقييم ${assessment.title} في مادة ${assessment.subject}. يحتوي على ${assessment.totalQuestions} أسئلة بمجموع ${assessment.totalPoints} درجة.${qText} الهدف هو قياس استيعاب الطلاب المفاهيمي والدقة الحسابية.`;
  }

  if (lang === 'Somali') {
    if (tab === 'answers') {
      const aText = aSummaries.length > 0 ? ` Jawaabaha saxda ah: ${aSummaries.join('. ')}.` : '';
      return `Furaha jawaabaha ee qiimeynta ${assessment.title}.${aText} Hubi in ardaygu keenay tillaabooyinka muhiimka ah.`;
    }
    const qText = qSummaries.length > 0 ? ` Waxaa ka mid ah: ${qSummaries.join('. ')}.` : '';
    return `Sharraxaadda qiimeynta ${assessment.title} ee maaddada ${assessment.subject}. Waxay ka kooban tahay ${assessment.totalQuestions} su'aalood oo wadartoodu tahay ${assessment.totalPoints} dhibcood.${qText} Ujeeddadu waa in la cabbiro fahamka ardayda iyo habka xallinta.`;
  }

  // English
  if (tab === 'answers') {
    const aText = aSummaries.length > 0 ? ` Model solutions: ${aSummaries.join('. ')}.` : '';
    return `Model answer key for ${assessment.title}.${aText} Instructors should verify that students showed their derivations and included proper dimensional units.`;
  }
  const qText = qSummaries.length > 0 ? ` Sample questions: ${qSummaries.join('. ')}.` : '';
  return `Pedagogical overview for ${assessment.title} in ${assessment.subject}. Consisting of ${assessment.totalQuestions} questions for a total of ${assessment.totalPoints} points.${qText} This assessment is calibrated to test both core theoretical foundations and analytical execution.`;
}

/**
 * Builds sequential speech sections for reading the complete intended AI response.
 * Divides the entire content into ordered, natural chunks at sentence and question boundaries.
 * Reads all questions, solutions, and rubric criteria without truncating.
 */
export function buildCompleteEducationalSpeechSections(params: {
  material: GeneratedTeacherMaterial;
  tab: 'questions' | 'answers' | 'marking';
  language?: 'English' | 'Somali' | 'Arabic';
  customContent?: string;
  customAnswerKey?: string;
  customMarkingScheme?: string;
}): string[] {
  const { material, tab } = params;
  const lang = params.language || material.language || 'English';
  const topic = material.topic;
  const subject = material.subject;
  const grade = material.gradeOrLevel;
  const count = material.questionCount || 10;
  const diff = material.difficulty || 'Medium';
  const totalMarks = material.totalMarks || count * 10;

  let intro = '';
  let bodyText = '';

  if (lang === 'Arabic') {
    if (tab === 'questions') {
      intro = `مرحباً بكم في معلم SmartEducate الذكي. إليكم التكليف الدراسي الكامل في مادة ${subject} لمستوى ${grade} حول موضوع ${topic}. مستوى الصعوبة: ${diff}، ويتضمن ${count} أسئلة بمجموع ${totalMarks} درجة.`;
      bodyText = params.customContent || material.content || '';
    } else if (tab === 'answers') {
      intro = `دليل الحلول والنموذج الرسمي المعتمد لموضوع ${topic} في مادة ${subject}. يوضح هذا الدليل الحلول المنهجية الكاملة لكافة الأسئلة.`;
      bodyText = params.customAnswerKey || material.answerKey || '';
    } else {
      intro = `دليل ومعايير تصحيح التكليف وسلم الدرجات لموضوع ${topic}. المجموع الكلي: ${totalMarks} درجة.`;
      bodyText = params.customMarkingScheme || material.markingScheme || '';
    }
  } else if (lang === 'Somali') {
    if (tab === 'questions') {
      intro = `Ku soo dhowow SmartEducate AI Teacher. Halkan waxaa ku qoran layligan oo dhammaystiran ee maaddada ${subject}, fasalka ${grade}, mawduuca ${topic}. Heerka adkaanta waa ${diff}, wuxuuna ka kooban yahay ${count} su'aalood oo wadartoodu tahay ${totalMarks} dhibcood.`;
      bodyText = params.customContent || material.content || '';
    } else if (tab === 'answers') {
      intro = `Furaha jawaabaha rasmiga ah iyo xallinta tillaabo-tallaabada ah ee maaddada ${subject}, mawduuca ${topic}.`;
      bodyText = params.customAnswerKey || material.answerKey || '';
    } else {
      intro = `Hagaha saxidda iyo miisaanka dhibcaha ee mawduuca ${topic}. Dhibcaha guud waa ${totalMarks}.`;
      bodyText = params.customMarkingScheme || material.markingScheme || '';
    }
  } else {
    // English
    if (tab === 'questions') {
      intro = `Welcome to SmartEducate AI Teacher. Here is the complete ${grade} ${subject} assignment on ${topic}. Calibrated at a ${diff} difficulty level across ${count} assessment problems for a total of ${totalMarks} marks.`;
      bodyText = params.customContent || material.content || '';
    } else if (tab === 'answers') {
      intro = `Official Instructor Solution Guide and Pedagogical Explanations for ${subject}: ${topic}. Detailed step-by-step working for all questions.`;
      bodyText = params.customAnswerKey || material.answerKey || '';
    } else {
      intro = `Assessment Rubric and Scoring Guide for ${topic}. Total marks: ${totalMarks}. Grading criteria breakdown.`;
      bodyText = params.customMarkingScheme || material.markingScheme || '';
    }
  }

  const bodyChunks = splitTextIntoSpeakableChunks(bodyText, 260);
  return [intro, ...bodyChunks];
}

/**
 * Builds sequential speech sections for reading complete assessments in TeacherAssessmentsScreen.
 */
export function buildCompleteAssessmentSpeechSections(
  assessment: TeacherAssessmentItem,
  language?: 'English' | 'Somali' | 'Arabic',
  tab: 'questions' | 'answers' | 'rubric' = 'questions'
): string[] {
  const lang = language || assessment.language || 'English';
  const questions = assessment.questions || [];
  const count = assessment.totalQuestions || questions.length || 0;
  const points = assessment.totalPoints || 0;

  let intro = '';
  const sections: string[] = [];

  if (lang === 'Arabic') {
    if (tab === 'answers') {
      intro = `دليل ونموذج الإجابة لتقييم ${assessment.title} في مادة ${assessment.subject}.`;
      questions.forEach((q, idx) => {
        const promptText = `السؤال ${idx + 1}: ${q.prompt}`;
        const ansText = `الإجابة النموذجية: ${q.expectedAnswer || q.correctAnswer || 'غير محدد'}.`;
        const explText = q.explanation ? ` الشرح: ${q.explanation}` : '';
        sections.push(`${promptText}. ${ansText}${explText}`);
      });
    } else if (tab === 'rubric') {
      intro = `سلم الدرجات ومعايير تصحيح تقييم ${assessment.title}. المجموع: ${points} درجة.`;
      questions.forEach((q, idx) => {
        sections.push(`السؤال ${idx + 1}: مخصص له ${q.points || 1} درجات.`);
      });
    } else {
      intro = `شرح تقييم ${assessment.title} في مادة ${assessment.subject}. يحتوي التقييم على ${count} أسئلة بمجموع ${points} درجة.`;
      questions.forEach((q, idx) => {
        let qStr = `السؤال ${idx + 1} (${q.points || 1} درجات): ${q.prompt}`;
        if (q.options && q.options.length > 0) {
          qStr += `. الخيارات: ${q.options.join('، ')}.`;
        }
        sections.push(qStr);
      });
    }
  } else if (lang === 'Somali') {
    if (tab === 'answers') {
      intro = `Furaha jawaabaha ee qiimeynta ${assessment.title} ee maaddada ${assessment.subject}.`;
      questions.forEach((q, idx) => {
        const promptText = `Su'aasha ${idx + 1}: ${q.prompt}`;
        const ansText = `Jawaabta saxda ah: ${q.expectedAnswer || q.correctAnswer || 'Lama qeexin'}.`;
        const explText = q.explanation ? ` Sharraxaad: ${q.explanation}` : '';
        sections.push(`${promptText}. ${ansText}${explText}`);
      });
    } else if (tab === 'rubric') {
      intro = `Miisaanka dhibcaha ee qiimeynta ${assessment.title}. Wadarta guud waa ${points} dhibcood.`;
      questions.forEach((q, idx) => {
        sections.push(`Su'aasha ${idx + 1}: Waxay leedahay ${q.points || 1} dhibcood.`);
      });
    } else {
      intro = `Sharraxaadda qiimeynta ${assessment.title} ee maaddada ${assessment.subject}. Waxay ka kooban tahay ${count} su'aalood oo wadartoodu tahay ${points} dhibcood.`;
      questions.forEach((q, idx) => {
        let qStr = `Su'aasha ${idx + 1} (${q.points || 1} dhibcood): ${q.prompt}`;
        if (q.options && q.options.length > 0) {
          qStr += `. Xulashooyinka: ${q.options.join(', ')}.`;
        }
        sections.push(qStr);
      });
    }
  } else {
    // English
    if (tab === 'answers') {
      intro = `Instructor Model Solution Guide for ${assessment.title} in ${assessment.subject}.`;
      questions.forEach((q, idx) => {
        const promptText = `Question ${idx + 1}: ${q.prompt}`;
        const ansText = `Model Solution: ${q.expectedAnswer || q.correctAnswer || 'Not specified'}.`;
        const explText = q.explanation ? ` Explanation: ${q.explanation}` : '';
        sections.push(`${promptText}. ${ansText}${explText}`);
      });
    } else if (tab === 'rubric') {
      intro = `Scoring Rubric for ${assessment.title}. Total points: ${points}.`;
      questions.forEach((q, idx) => {
        sections.push(`Question ${idx + 1}: Weighted at ${q.points || 1} points.`);
      });
    } else {
      intro = `Overview of ${assessment.title} in ${assessment.subject}. Consisting of ${count} questions for a total of ${points} points.`;
      questions.forEach((q, idx) => {
        let qStr = `Question ${idx + 1} (${q.points || 1} points): ${q.prompt}`;
        if (q.options && q.options.length > 0) {
          qStr += `. Options: ${q.options.join(', ')}.`;
        }
        sections.push(qStr);
      });
    }
  }

  const allChunks: string[] = [intro];
  for (const s of sections) {
    allChunks.push(...splitTextIntoSpeakableChunks(s, 260));
  }
  return allChunks;
}
