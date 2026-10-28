import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  AiTeacherDifficulty,
  TeacherMaterialType,
  GeneratedTeacherMaterial,
  GlobalClassroom,
} from '../../types/education';
import {
  Sparkles,
  Check,
  Copy,
  Plus,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  Layers,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';

interface AiTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassroom: GlobalClassroom | null;
  onSaveToAssignments?: (assignment: { title: string; dueDate: string; instructions: string }) => void;
  onMaterialCreated?: (material: GeneratedTeacherMaterial) => void;
}

const DIFFICULTIES: AiTeacherDifficulty[] = [
  'Easy',
  'Medium',
  'Hard',
  'Very Hard',
  'Extremely Hard',
];

const MATERIAL_TYPES: Array<{
  id: TeacherMaterialType;
  title: string;
  icon: React.ReactNode;
}> = [
  { id: 'assignment', title: 'Assignment', icon: <FileText className="w-4 h-4" /> },
  { id: 'homework', title: 'Homework', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'quiz', title: 'Quiz / Test', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'lesson_plan', title: 'Lesson Plan', icon: <Layers className="w-4 h-4" /> },
  { id: 'question_set', title: 'Question Set', icon: <ListOrdered className="w-4 h-4" /> },
  { id: 'answer_key', title: 'Answer Key & Rubric', icon: <Award className="w-4 h-4" /> },
];

export const AiTeacherModal: React.FC<AiTeacherModalProps> = ({
  isOpen,
  onClose,
  activeClassroom,
  onSaveToAssignments,
  onMaterialCreated,
}) => {
  const [materialType, setMaterialType] = useState<TeacherMaterialType>('assignment');
  const [difficulty, setDifficulty] = useState<AiTeacherDifficulty>('Medium');
  const [subject, setSubject] = useState(activeClassroom?.subject || 'Mathematics');
  const [gradeOrLevel, setGradeOrLevel] = useState('Grade 8');
  const [topic, setTopic] = useState('Algebra & Linear Equations');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [customPrompt, setCustomPrompt] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedTeacherMaterial | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedToClassToast, setSavedToClassToast] = useState(false);

  const applyTemplate = (
    tmplSubject: string,
    tmplGrade: string,
    tmplTopic: string,
    tmplDiff: AiTeacherDifficulty,
    tmplCount: number,
    tmplType: TeacherMaterialType
  ) => {
    setSubject(tmplSubject);
    setGradeOrLevel(tmplGrade);
    setTopic(tmplTopic);
    setDifficulty(tmplDiff);
    setQuestionCount(tmplCount);
    setMaterialType(tmplType);
    setCustomPrompt(`Prepare a ${tmplGrade} ${tmplSubject} ${tmplType}, ${tmplCount} questions, ${tmplTopic}, ${tmplDiff.toLowerCase()} difficulty.`);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedMaterial(null);
    setSavedToClassToast(false);

    setTimeout(() => {
      const title = `${gradeOrLevel} ${subject}: ${topic} (${difficulty} ${materialType.replace('_', ' ').toUpperCase()})`;
      
      const sampleQuestions = Array.from({ length: questionCount }, (_, i) => {
        const qNum = i + 1;
        if (subject.toLowerCase().includes('math') || topic.toLowerCase().includes('algebra')) {
          return `Question ${qNum} (${qNum * 2} pts): Solve for x in the equation: ${qNum + 2}x - ${(qNum * 3)} = ${qNum * 4 + 10}. Show all intermediate working steps.`;
        } else if (subject.toLowerCase().includes('physic') || subject.toLowerCase().includes('science')) {
          return `Question ${qNum} (${qNum * 2} pts): State the governing law for ${topic} and calculate the resultant force when m = ${qNum * 3}kg and a = ${qNum + 1}.5 m/s².`;
        } else if (subject.toLowerCase().includes('comput') || subject.toLowerCase().includes('prog')) {
          return `Question ${qNum} (${qNum * 2} pts): Write an optimal function in Python/TypeScript to solve ${topic} edge cases where input is an empty array or null.`;
        } else {
          return `Question ${qNum} (${qNum * 2} pts): Analyze the principal factors influencing ${topic} at the ${gradeOrLevel} level. Provide two practical examples.`;
        }
      });

      const sampleAnswerKey = Array.from({ length: questionCount }, (_, i) => {
        const qNum = i + 1;
        return `Ans ${qNum}: Step-by-step derivation: Isolate variable, apply inverse operation -> Solution yields x = ${(i * 2 + 3).toFixed(1)}. Full credit for correct formula + working.`;
      }).join('\n');

      const material: GeneratedTeacherMaterial = {
        id: 'mat_' + Date.now().toString(36),
        type: materialType,
        title,
        subject,
        gradeOrLevel,
        topic,
        difficulty,
        questionCount,
        content: `======================================================
${title.toUpperCase()}
Institution / Course: ${activeClassroom?.title || 'Classroom'}
Difficulty: ${difficulty} | Questions: ${questionCount} | Total Points: ${questionCount * 5}
======================================================

INSTRUCTIONS FOR STUDENTS:
1. Complete all ${questionCount} questions within the allocated period.
2. Show all working steps, derivations, and final unit designations.
3. Submit prior to the posted deadline for teacher grading and feedback.

QUESTIONS:
${sampleQuestions.join('\n\n')}`,
        answerKey: `======================================================
OFFICIAL TEACHER ANSWER KEY & SOLUTION GUIDE
(Teacher Eyes Only - Do Not Distribute to Students)
======================================================
${sampleAnswerKey}`,
        gradingRubric: [
          'Conceptual Understanding & Method (40%): Correct formula identification and logical structuring',
          'Execution & Working (40%): Accurate algebraic transformations or analytical clarity',
          'Final Accuracy & Units (20%): Precision in the final evaluated result',
        ],
        createdAt: new Date().toLocaleDateString(),
      };

      setGeneratedMaterial(material);
      setIsGenerating(false);
      if (onMaterialCreated) {
        onMaterialCreated(material);
      }
    }, 700);
  };

  const handleCopy = () => {
    if (!generatedMaterial) return;
    const fullText = `${generatedMaterial.content}\n\n${generatedMaterial.answerKey || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleSaveToAssignments = () => {
    if (!generatedMaterial) return;
    if (onSaveToAssignments) {
      onSaveToAssignments({
        title: generatedMaterial.title,
        dueDate: 'Next Monday, 11:59 PM',
        instructions: generatedMaterial.content,
      });
    }
    setSavedToClassToast(true);
    setTimeout(() => setSavedToClassToast(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Teacher — Material Generator"
      description={`Pedagogical assistant exclusively for instructors · ${activeClassroom?.title || 'Classroom'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          {!generatedMaterial ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>{isGenerating ? 'Generating...' : 'Generate with AI Teacher'}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={() => setGeneratedMaterial(null)}>
                Edit Parameters
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveToAssignments}
                disabled={savedToClassToast}
                className="gap-2"
              >
                {savedToClassToast ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved to Class!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save to Classroom</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-5 text-start max-h-[70vh] overflow-y-auto px-1 py-1">
        {!generatedMaterial ? (
          <>
            {/* Quick Example Presets */}
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/60 space-y-2">
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider block">
                Quick Template Presets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate('Mathematics', 'Grade 8', 'Algebra & Linear Equations', 'Medium', 15, 'assignment')
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-[#7C3AED] text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Grade 8 Math (15 Qs, Algebra, Medium)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate('Physics', 'Grade 12', 'Newtonian Mechanics & Kinematics', 'Hard', 10, 'quiz')
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-[#7C3AED] text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Grade 12 Physics (10 Qs, Hard Quiz)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate('Computer Science', 'Undergraduate', 'Data Structures & Algorithms', 'Extremely Hard', 8, 'assignment')
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-[#7C3AED] text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Undergrad CS (8 Qs, Extremely Hard)
                </button>
              </div>
            </div>

            {/* Material Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Material Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MATERIAL_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMaterialType(t.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      materialType === t.id
                        ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                        : 'bg-white border-[#EDE8F5] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.icon}
                    <span>{t.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection (LOCKED 5 LEVELS) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Difficulty Level
                </label>
                <span className="text-xs font-bold text-[#7C3AED]">{difficulty}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      difficulty === diff
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-white border border-[#EDE8F5] text-slate-600 hover:bg-purple-50/50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject, Grade & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                required
              />
              <Input
                label="Grade / Level"
                value={gradeOrLevel}
                onChange={(e) => setGradeOrLevel(e.target.value)}
                placeholder="e.g. Grade 8, Undergrad"
                required
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl border border-[#EDE8F5] bg-white px-3 text-sm font-semibold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={25}>25 Questions</option>
                </select>
              </div>
            </div>

            {/* Topic & Specific Goal */}
            <Input
              label="Topic or Learning Concept"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Algebra, Quadratic Formula, Newton's Laws"
              required
            />

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Prompt / Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Include 3 word problems, emphasize step-by-step working, provide an answer key with partial credit guidance."
                rows={2}
                className="w-full p-3 rounded-2xl border border-[#EDE8F5] bg-white text-xs sm:text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </>
        ) : (
          /* GENERATED MATERIAL PREVIEW */
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-xs font-extrabold uppercase">
                    {generatedMaterial.difficulty}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
                    {generatedMaterial.questionCount} Questions
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {generatedMaterial.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Copy full material and answer key"
                  >
                    {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100">
                {generatedMaterial.title}
              </h3>
            </div>

            {/* Material Body Preview */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Assignment Content
              </span>
              <pre className="text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                {generatedMaterial.content}
              </pre>
            </div>

            {/* Answer Key & Solution Guide */}
            {generatedMaterial.answerKey && (
              <div className="p-4 rounded-3xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 space-y-2">
                <div className="flex items-center gap-2 text-[#7C3AED] dark:text-purple-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Official Instructor Answer Key & Rubric</span>
                </div>
                <pre className="text-xs sm:text-sm font-sans text-purple-950 dark:text-purple-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white/90 dark:bg-slate-950 p-4 rounded-2xl border border-purple-100 dark:border-purple-800">
                  {generatedMaterial.answerKey}
                </pre>
              </div>
            )}

            {/* Rubric Breakdown */}
            {generatedMaterial.gradingRubric && (
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-[#EDE8F5] dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Grading Rubric
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {generatedMaterial.gradingRubric.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-purple-400 mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
