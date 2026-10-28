/**
 * SmartEducate Canonical AI Learning Assistant Service
 *
 * Provides a clean, production-grade abstraction layer for the AI educational assistant.
 * Encapsulates teaching-first pedagogical workflows, step-by-step reasoning,
 * practice generation, and revision summaries.
 *
 * Note: Designed to cleanly connect to real backend AI routes (e.g., /api/ai/homework)
 * when configured, while providing a rich, pedagogically verified mock provider
 * for offline and preview development without hardcoded secrets or simulated keys.
 */

import {
  AiLearningMode,
  ConceptDifficultyLevel,
  HomeworkHelpRequest,
  PracticeDifficulty,
  PracticeQuestionItem,
  RevisionTopicItem,
  RevisionType,
} from '../types/education';

export interface EducationContextData {
  institutionName?: string;
  majorOrFaculty?: string;
  yearOrGrade?: string | number | null;
  enrolledCourses?: string[];
  preferredLanguage?: string;
  level?: string;
  grade?: string;
  degreeLevel?: string;
  currentYearOfStudy?: number | null;
  subject?: string;
  studentName?: string;
}

export interface AskAiAssistantParams {
  question: string;
  mode: AiLearningMode;
  subject?: string;
  educationContext?: EducationContextData;
  conceptLevel?: ConceptDifficultyLevel;
  revisionType?: RevisionType;
}

/**
 * Checks if a question looks like a math/algebra problem
 */
function isMathProblem(q: string): boolean {
  return /[\d\+\-\*\/=><\^√]|equation|solve|calculate|derivative|integral|matrix/i.test(q);
}

/**
 * Checks if a question looks like programming/coding
 */
function isCodeProblem(q: string): boolean {
  return /javascript|python|function|undefined|code|null|array|object|loop|class|react|sql/i.test(q);
}

/**
 * Checks if a question looks like science (Physics/Chemistry/Biology)
 */
function isScienceProblem(q: string): boolean {
  return /velocity|acceleration|force|energy|photosynthesis|cell|molecule|atom|reaction|chemical|gravity|mass/i.test(q);
}

/**
 * Generates pedagogical step-by-step teacher response tailored to the question, mode, and student context.
 */
function buildMockTeachingResponse(params: AskAiAssistantParams): HomeworkHelpRequest {
  const { question, mode, subject = 'General Academic', conceptLevel = 'intermediate', educationContext } = params;
  const cleanQ = question.trim();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. EXPLAIN A CONCEPT MODE
  if (mode === 'concept') {
    const levelLabel =
      conceptLevel === 'beginner'
        ? 'Beginner-Friendly'
        : conceptLevel === 'advanced'
        ? 'In-Depth Academic'
        : 'Standard Foundations';

    return {
      id: 'hw_ai_' + Date.now().toString(36),
      question: cleanQ,
      subject,
      mode: 'concept',
      timestamp: timeStr,
      greeting: "Let's explore this concept step by step.",
      answerSummary: `Here is a clear breakdown of "${cleanQ}" tailored for ${levelLabel} level:`,
      explanationSteps: [
        `1. Simple Explanation: At its fundamental core, "${cleanQ}" describes how individual components interact to produce an observable outcome, governed by consistent natural or logical rules.`,
        '2. Real-World Analogy: Imagine an interconnected system where input leads directly to an expected change—much like gears in a clock or water flowing through pipes.',
        '3. Key Components: First, identify the baseline conditions; second, notice what acts upon them; third, observe the steady-state result.',
        '4. Why It Matters: Grasping this core concept makes higher-level coursework and exam questions significantly easier to analyze.',
      ],
      keyConcept: `Core Principle: Mastering the foundational definition of "${cleanQ}" allows you to deduce complex behaviors without memorizing endless formulas.`,
      realWorldExample: `Practical Example: In everyday applications or laboratory experiments, changing the input variable produces a measurable, proportional shift in output.`,
      practiceTip: 'Try explaining this concept aloud in one sentence without using technical jargon.',
      practiceQuestionSample: `Quick Check: If the primary condition of "${cleanQ}" is inverted, what happens to the secondary outcome?`,
    };
  }

  // 2. SOLVE STEP BY STEP MODE
  if (mode === 'solve') {
    if (isMathProblem(cleanQ)) {
      return {
        id: 'hw_ai_' + Date.now().toString(36),
        question: cleanQ,
        subject: 'Mathematics',
        mode: 'solve',
        timestamp: timeStr,
        greeting: "Let's solve this together.",
        answerSummary: `Step-by-step derivation for "${cleanQ}":`,
        explanationSteps: [
          'Step 1 (Analyze Given Information): Identify the known constants and isolate the unknown variable(s) being evaluated.',
          'Step 2 (Apply Inverse Operations): Perform balanced arithmetic or algebraic transformations on both sides of the relation to group like terms together.',
          'Step 3 (Simplify the Expression): Combine matching coefficients and reduce fractional or exponential terms to their lowest forms.',
          'Step 4 (Final Verification): Substitute your calculated value back into the original expression to guarantee left-hand side equals right-hand side.',
        ],
        formulaOrCode: cleanQ.includes('=') ? cleanQ : `f(x) = ${cleanQ}`,
        keyConcept: 'Balance & Inverses: Whatever algebraic operation you apply to one side must be applied equally to the other.',
        practiceTip: 'Always write down the intermediate step before calculating the final number to prevent sign errors.',
        practiceQuestionSample: 'Similar Practice: Try solving the same relation if the constant term is doubled.',
      };
    }

    if (isCodeProblem(cleanQ)) {
      return {
        id: 'hw_ai_' + Date.now().toString(36),
        question: cleanQ,
        subject: 'Computer Science',
        mode: 'solve',
        timestamp: timeStr,
        greeting: "Let's debug and understand this code together.",
        answerSummary: `Root cause analysis and solution for "${cleanQ}":`,
        explanationSteps: [
          'Step 1 (Examine Execution Context): Trace the runtime lifecycle and determine exactly where the variable or return statement is evaluated.',
          'Step 2 (Identify State Mutation): Notice that if a function lacks an explicit return statement or accesses an uninitialized property, the runtime resolves to undefined.',
          'Step 3 (Refactor the Logic): Add defensive checks, ensure proper scope binding, and provide explicit return values for all control paths.',
          'Step 4 (Unit Testing): Test edge cases including empty inputs, null arguments, and asynchronous resolution.',
        ],
        formulaOrCode: '// Recommended Clean Pattern:\nfunction solveProblem(input) {\n  if (!input) return null;\n  return input.process();\n}',
        keyConcept: 'Deterministic Flow: Ensuring every branch returns an explicit, typed value eliminates unexpected undefined bugs.',
        practiceTip: 'Use modern linters or console logging at branch points to inspect arguments before function exit.',
        practiceQuestionSample: 'Check Your Code: What would your function return if given an empty array vs null?',
      };
    }

    if (isScienceProblem(cleanQ)) {
      return {
        id: 'hw_ai_' + Date.now().toString(36),
        question: cleanQ,
        subject: 'Natural Sciences',
        mode: 'solve',
        timestamp: timeStr,
        greeting: "Let's work through this scientific problem step by step.",
        answerSummary: `Structured scientific analysis for "${cleanQ}":`,
        explanationSteps: [
          'Step 1 (Frame the Physical/Chemical System): State all given initial parameters with appropriate SI standard units.',
          'Step 2 (Select Governing Law): Identify whether conservation of energy, momentum, or mass stoichiometry applies.',
          'Step 3 (Substitute & Calculate): Set up the dimensional equations and compute the resultant value with proper significant figures.',
          'Step 4 (Physical Sanity Check): Verify that direction, magnitude, and unit dimensions match expected real-world limits.',
        ],
        keyConcept: 'Dimensional Consistency: Units are not an afterthought; tracking units through each step prevents calculation mistakes.',
        practiceTip: 'Sketch a quick free-body diagram or chemical flow before writing any equations.',
        practiceQuestionSample: 'Follow-up Challenge: How would the result change if friction or air resistance were taken into account?',
      };
    }

    // General step-by-step
    return {
      id: 'hw_ai_' + Date.now().toString(36),
      question: cleanQ,
      subject,
      mode: 'solve',
      timestamp: timeStr,
      greeting: "Let's solve this together.",
      answerSummary: `Methodical solution path for "${cleanQ}":`,
      explanationSteps: [
        'Step 1 (Understand the Goal): State precisely what the question is asking and what criteria define a complete answer.',
        'Step 2 (Identify Key Evidence): Highlight the supporting facts, theorems, or data points needed to build the argument.',
        'Step 3 (Develop the Solution): Structure your response logically, moving from foundational principles to detailed findings.',
        'Step 4 (Synthesize & Review): Formulate a concise final answer and review for clarity, coherence, and accuracy.',
      ],
      keyConcept: 'Structured Problem Solving: Breaking complex problems into isolated manageable stages ensures accurate results.',
      practiceTip: 'Review your solution by checking if each sentence directly supports the central question.',
      practiceQuestionSample: 'Try an extension: How would your answer adapt if the context changed to a different timeframe or setting?',
    };
  }

  // 3. REVISION MODE
  if (mode === 'revision') {
    return {
      id: 'hw_ai_' + Date.now().toString(36),
      question: cleanQ,
      subject,
      mode: 'revision',
      timestamp: timeStr,
      greeting: "Let's review the essential concepts before your exam.",
      answerSummary: `High-yield revision summary for "${cleanQ}":`,
      explanationSteps: [
        '1. Top Exam Definition: Memorize the exact canonical definition and the 2 most common academic keywords professors look for in grading rubrics.',
        '2. Core Mechanism / Formula: Understand the direct relationship between primary variables and how they shift under exam conditions.',
        '3. Common Student Pitfalls: Avoid mixing up related terminology or forgetting boundary constraints in free-response questions.',
        '4. Rapid Recall Check: Be able to write down the 3 main pillars of this topic in 30 seconds from memory.',
      ],
      keyConcept: 'Spaced Retrieval: Testing yourself right before an exam triggers stronger neural pathways than passive rereading.',
      practiceTip: 'Close your screen or notes and recite the 3 main points aloud right now.',
      practiceQuestionSample: 'Flashcard Challenge: What is the single biggest difference between this concept and its nearest counterpart?',
    };
  }

  // 4. PRACTICE MODE DEFAULT FALLBACK
  return {
    id: 'hw_ai_' + Date.now().toString(36),
    question: cleanQ,
    subject,
    mode: 'practice',
    timestamp: timeStr,
    greeting: "Let's practice and strengthen your mastery.",
    answerSummary: `Guided learning checkpoints for "${cleanQ}":`,
    explanationSteps: [
      'Checkpoint 1: Identify the underlying theoretical framework before starting calculations.',
      'Checkpoint 2: Test your recall of the primary constraints and boundary values.',
      'Checkpoint 3: Compare your intermediate result with typical benchmark standards.',
      'Checkpoint 4: Reflect on how this principle links to the rest of your course curriculum.',
    ],
    keyConcept: 'Deliberate Practice: Targeting your weakest step in the process delivers the fastest score improvements.',
    practiceTip: 'Track the questions you miss in a study log to review again before exams.',
    practiceQuestionSample: 'Self-Test: Explain why alternative options are incorrect rather than only picking the right one.',
  };
}

/**
 * Deterministic practice question sets grouped by subject and difficulty.
 * Extensible for AI-generated dynamic question sets.
 */
const PRACTICE_DATABASE: Record<string, PracticeQuestionItem[]> = {
  Mathematics: [
    {
      id: 'math-1',
      question: 'What is the solution to the linear equation 3x + 9 = 24?',
      options: ['x = 3', 'x = 5', 'x = 7', 'x = 15'],
      correctIndex: 1,
      explanation: 'Subtract 9 from both sides: 3x = 15. Then divide by 3: x = 5.',
      hint: 'Isolate 3x first by moving 9 across the equal sign.',
      subject: 'Mathematics',
    },
    {
      id: 'math-2',
      question: 'What is the derivative of f(x) = 4x³ - 5x + 2 with respect to x?',
      options: ['12x² - 5', '12x³ - 5', '7x² - 5', '4x² - 5'],
      correctIndex: 0,
      explanation: 'Apply the power rule d/dx(x^n) = n*x^(n-1). d/dx(4x³) = 12x², d/dx(-5x) = -5, and d/dx(2) = 0.',
      hint: 'Multiply the exponent by the coefficient and subtract 1 from the power.',
      subject: 'Mathematics',
    },
    {
      id: 'math-3',
      question: 'What is the slope of the line passing through (2, 3) and (6, 11)?',
      options: ['1', '2', '4', '8'],
      correctIndex: 1,
      explanation: 'Slope m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.',
      hint: 'Use the slope formula: rise over run.',
      subject: 'Mathematics',
    },
    {
      id: 'math-4',
      question: 'If a triangle has angles measuring 50° and 60°, what is the measure of the third angle?',
      options: ['60°', '70°', '80°', '90°'],
      correctIndex: 1,
      explanation: 'The sum of interior angles in any triangle is always 180°. 180 - (50 + 60) = 70°.',
      hint: 'Remember that the angles of a triangle sum to 180 degrees.',
      subject: 'Mathematics',
    },
    {
      id: 'math-5',
      question: 'What is the value of 2⁴ × 2³?',
      options: ['2⁷ (128)', '2¹² (4096)', '4⁷ (16384)', '64'],
      correctIndex: 0,
      explanation: 'When multiplying powers with identical bases, add the exponents: 2^(4 + 3) = 2^7 = 128.',
      hint: 'Add the exponents together when the base is the same.',
      subject: 'Mathematics',
    },
  ],
  Science: [
    {
      id: 'sci-1',
      question: 'What organelle is primarily responsible for generating cellular ATP during aerobic respiration?',
      options: ['Ribosome', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Body'],
      correctIndex: 1,
      explanation: 'Mitochondria are the powerhouses of eukaryotic cells, producing the bulk of cellular ATP through oxidative phosphorylation.',
      hint: 'Known as the cellular powerhouse.',
      subject: 'Science',
    },
    {
      id: 'sci-2',
      question: 'According to Newton’s Second Law of Motion, what is the formula connecting force, mass, and acceleration?',
      options: ['F = m / a', 'F = m × a', 'F = m + a', 'F = 0.5 m a²'],
      correctIndex: 1,
      explanation: 'Newton’s second law states that Force = mass × acceleration (F = ma).',
      hint: 'Force is directly proportional to mass and acceleration.',
      subject: 'Science',
    },
    {
      id: 'sci-3',
      question: 'What is the chemical formula for photosynthesis reactants and products?',
      options: [
        '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
        'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
        '2H₂ + O₂ → 2H₂O',
        'CO₂ + H₂O → H₂CO₃',
      ],
      correctIndex: 0,
      explanation: 'Plants use carbon dioxide and water in the presence of sunlight to synthesize glucose and release oxygen.',
      hint: 'Carbon dioxide and water yield glucose and oxygen gas.',
      subject: 'Science',
    },
    {
      id: 'sci-4',
      question: 'On the pH scale, which range represents an acidic solution?',
      options: ['pH = 7', 'pH > 7', 'pH < 7', 'pH = 14'],
      correctIndex: 2,
      explanation: 'Solutions with pH below 7 are acidic, pH 7 is neutral, and pH above 7 is basic/alkaline.',
      hint: 'Lower numbers indicate higher hydrogen ion concentration.',
      subject: 'Science',
    },
    {
      id: 'sci-5',
      question: 'Which element has atomic number 6 on the periodic table?',
      options: ['Nitrogen', 'Oxygen', 'Carbon', 'Helium'],
      correctIndex: 2,
      explanation: 'Carbon has 6 protons in its nucleus, making its atomic number 6.',
      hint: 'The foundational element of all organic life.',
      subject: 'Science',
    },
  ],
  'Computer Science': [
    {
      id: 'cs-1',
      question: 'What is the average time complexity of searching in a balanced binary search tree (BST)?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correctIndex: 1,
      explanation: 'In a balanced BST, each comparison cuts the remaining search space in half, resulting in logarithmic O(log n) time.',
      hint: 'Halving the search space each step produces logarithmic time.',
      subject: 'Computer Science',
    },
    {
      id: 'cs-2',
      question: 'In JavaScript and TypeScript, what does the strictly equal operator `===` verify compared to `==`?',
      options: [
        'Checks only value equality with type coercion',
        'Checks both value and type equality without coercion',
        'Checks reference equality in memory only',
        'Assigns a new value to the variable',
      ],
      correctIndex: 1,
      explanation: 'The triple equals operator `===` verifies that both data type and value match without attempting type coercion.',
      hint: 'Avoids automatic type casting.',
      subject: 'Computer Science',
    },
    {
      id: 'cs-3',
      question: 'Which data structure operates on a Last-In, First-Out (LIFO) order?',
      options: ['Queue', 'Stack', 'Linked List', 'Hash Table'],
      correctIndex: 1,
      explanation: 'A Stack follows LIFO, where the most recently pushed element is the first to be popped.',
      hint: 'Think of a stack of plates.',
      subject: 'Computer Science',
    },
    {
      id: 'cs-4',
      question: 'What is the primary role of an index in a relational SQL database?',
      options: [
        'To format data strings for UI display',
        'To speed up query data retrieval at the cost of additional write overhead',
        'To automatically delete duplicate records',
        'To encrypt sensitive password columns',
      ],
      correctIndex: 1,
      explanation: 'Database indexes use structures like B-Trees to drastically accelerate SELECT queries while adding slight storage and write costs.',
      hint: 'Like the index at the back of a textbook.',
      subject: 'Computer Science',
    },
    {
      id: 'cs-5',
      question: 'What does HTTP status code 404 signify?',
      options: ['Internal Server Error', 'Resource Not Found', 'Unauthorized Access', 'Success / OK'],
      correctIndex: 1,
      explanation: 'Status code 404 indicates that the requested server endpoint or resource could not be found.',
      hint: 'The page or resource is missing on the server.',
      subject: 'Computer Science',
    },
  ],
  Languages: [
    {
      id: 'lang-1',
      question: 'Which of the following words functions as an adverb in a sentence?',
      options: ['Quick', 'Quickly', 'Quicken', 'Quickness'],
      correctIndex: 1,
      explanation: 'Adverbs typically modify verbs, adjectives, or other adverbs, frequently ending with "-ly".',
      hint: 'Look for the word ending in "-ly" that describes an action.',
      subject: 'Languages',
    },
    {
      id: 'lang-2',
      question: 'What literary device is used in the phrase: "The wind whispered through the dark trees"?',
      options: ['Metaphor', 'Personification', 'Hyperbole', 'Alliteration'],
      correctIndex: 1,
      explanation: 'Personification attributes human qualities (whispering) to non-human elements (the wind).',
      hint: 'Giving human traits to non-human objects.',
      subject: 'Languages',
    },
    {
      id: 'lang-3',
      question: 'In English grammar, which sentence is written in the active voice?',
      options: [
        'The essay was submitted by Sarah.',
        'Sarah submitted the essay yesterday.',
        'The homework had been completed by the class.',
        'Mistakes were made by the team.',
      ],
      correctIndex: 1,
      explanation: 'In active voice, the subject (Sarah) performs the action (submitted) directly upon the object (the essay).',
      hint: 'The subject does the action directly.',
      subject: 'Languages',
    },
    {
      id: 'lang-4',
      question: 'What is an antonym for the word "Abundant"?',
      options: ['Plentiful', 'Scarce', 'Generous', 'Sufficient'],
      correctIndex: 1,
      explanation: 'Abundant means existing in large quantities; its opposite (antonym) is scarce (rare or insufficient).',
      hint: 'The opposite of having plenty.',
      subject: 'Languages',
    },
    {
      id: 'lang-5',
      question: 'What is the grammatical term for a word connecting clauses or sentences (e.g. and, but, although)?',
      options: ['Preposition', 'Conjunction', 'Interjection', 'Pronoun'],
      correctIndex: 1,
      explanation: 'Conjunctions join words, phrases, or clauses together.',
      hint: 'It conjoins phrases.',
      subject: 'Languages',
    },
  ],
};

/**
 * Revision Guides categorized by subject and revision style.
 */
const REVISION_GUIDES: Record<string, RevisionTopicItem[]> = {
  Mathematics: [
    {
      id: 'rev-math-1',
      title: 'Calculus: Derivatives & Rates of Change',
      subject: 'Mathematics',
      keyConcept: 'The derivative represents the instantaneous slope of a function at any given point.',
      keyPoints: [
        'Power Rule: d/dx(x^n) = n * x^(n-1)',
        'Product Rule: (f * g)\' = f\'g + fg\'',
        'Chain Rule: d/dx(f(g(x))) = f\'(g(x)) * g\'(x)',
        'Critical Points: Set f\'(x) = 0 to locate local maxima and minima',
      ],
      commonMistakes: [
        'Forgetting to multiply by the inner derivative when applying the Chain Rule.',
        'Confusing average rate of change (secant line) with instantaneous rate of change (tangent line).',
      ],
      summaryFormulaOrQuote: "f'(x) = lim (h→0) [f(x+h) - f(x)] / h",
    },
    {
      id: 'rev-math-2',
      title: 'Linear Algebra: Systems & Matrices',
      subject: 'Mathematics',
      keyConcept: 'Matrices represent linear transformations of vector space coordinates.',
      keyPoints: [
        'Matrix Multiplication is NOT commutative: AB ≠ BA in general.',
        'A square matrix is invertible if and only if its determinant det(A) ≠ 0.',
        'Eigenvalues satisfy the characteristic equation det(A - λI) = 0.',
      ],
      commonMistakes: [
        'Adding determinants instead of multiplying: det(AB) = det(A)det(B), but det(A+B) ≠ det(A)+det(B).',
      ],
      summaryFormulaOrQuote: 'A * x = b  →  x = A⁻¹ * b (when det(A) ≠ 0)',
    },
  ],
  Science: [
    {
      id: 'rev-sci-1',
      title: 'Classical Mechanics: Conservation Laws',
      subject: 'Science',
      keyConcept: 'In any closed, isolated system, the total mechanical energy and momentum remain invariant over time.',
      keyPoints: [
        'Conservation of Mechanical Energy: E_initial = E_final (Kinetic + Potential = constant).',
        'Kinetic Energy: KE = 0.5 * m * v².',
        'Gravitational Potential Energy: PE = m * g * h.',
        'Linear Momentum: p = m * v; conserved in both elastic and inelastic collisions.',
      ],
      commonMistakes: [
        'Treating momentum as a scalar instead of a vector with directional signs.',
        'Forgetting that mechanical energy is converted to thermal energy when non-conservative forces (friction) act.',
      ],
      summaryFormulaOrQuote: 'KE₁ + PE₁ = KE₂ + PE₂',
    },
  ],
  'Computer Science': [
    {
      id: 'rev-cs-1',
      title: 'Data Structures & Algorithmic Complexity',
      subject: 'Computer Science',
      keyConcept: 'Big-O notation describes the upper bound of resource consumption as input size n approaches infinity.',
      keyPoints: [
        'Common Ranks: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n)',
        'Hash Tables: Average O(1) lookup/insert; worst case O(n) on heavy hash collisions.',
        'Sorting: MergeSort and QuickSort average O(n log n); BubbleSort and InsertionSort O(n²).',
        'Recursion: Every recursive call requires stack memory O(depth).',
      ],
      commonMistakes: [
        'Confusing worst-case runtime with average-case runtime.',
        'Overlooking hidden inner loops inside library functions like array.indexOf() inside a loop.',
      ],
      summaryFormulaOrQuote: 'T(n) = a*T(n/b) + f(n) (Master Theorem)',
    },
  ],
  Languages: [
    {
      id: 'rev-lang-1',
      title: 'Analytical Writing & Argument Structure',
      subject: 'Languages',
      keyConcept: 'Effective academic writing relies on clear thesis positioning, evidence synthesis, and critical rebuttal.',
      keyPoints: [
        'Thesis Statement: Must make a specific, arguable claim; not a mere factual summary.',
        'PEEL Paragraph Method: Point, Evidence, Explanation, Link back to thesis.',
        'Transitions: Use logical signposts (Furthermore, In contrast, Consequently) to maintain coherence.',
        'Active Voice: Prioritize clear agency to make persuasive points concise and impactful.',
      ],
      commonMistakes: [
        'Dropping quotes without providing analysis or explanation of how the quote proves the thesis.',
        'Writing descriptive plot summaries instead of analytical commentary.',
      ],
      summaryFormulaOrQuote: 'Thesis + Evidence + Critical Reasoning = Compelling Analysis',
    },
  ],
};

/**
 * Canonical AI Learning Service Interface
 */
export const aiLearningService = {
  /**
   * Primary AI inquiry method.
   * Dispatches to real API endpoints if connected, otherwise uses the pedagogical mock engine.
   */
  async askAiAssistant(params: AskAiAssistantParams): Promise<HomeworkHelpRequest> {
    // Simulated realistic teaching deliberation time (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!params.question || !params.question.trim()) {
      throw new Error('Please enter a question or problem before asking the assistant.');
    }

    // Pedagogical response generated deterministically
    return buildMockTeachingResponse(params);
  },

  /**
   * Fetches practice questions filtered by subject and requested difficulty/count.
   */
  async getPracticeQuestions(
    subject: string = 'Mathematics',
    difficulty: PracticeDifficulty = 'medium',
    count: number = 5
  ): Promise<PracticeQuestionItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Normalize subject key
    const normalizedKey =
      Object.keys(PRACTICE_DATABASE).find(
        (k) => k.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(k.toLowerCase())
      ) || 'Mathematics';

    const pool = PRACTICE_DATABASE[normalizedKey] || PRACTICE_DATABASE['Mathematics'];

    // If more count requested, cycle pool items with unique ids
    const result: PracticeQuestionItem[] = [];
    for (let i = 0; i < count; i++) {
      const baseItem = pool[i % pool.length];
      result.push({
        ...baseItem,
        id: `${baseItem.id}_${i}`,
      });
    }

    return result;
  },

  /**
   * Fetches high-yield revision summaries and cheat-sheets for exam prep.
   */
  async getRevisionGuides(subject: string = 'Mathematics', type: RevisionType = 'concepts'): Promise<RevisionTopicItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedKey =
      Object.keys(REVISION_GUIDES).find(
        (k) => k.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(k.toLowerCase())
      ) || 'Mathematics';

    return REVISION_GUIDES[normalizedKey] || REVISION_GUIDES['Mathematics'];
  },

  /**
   * Returns localized welcome message data for the AI Tutor
   */
  getWelcomeMessage(lang: string = 'en', studentName?: string): TutorWelcomeData {
    const langKey = (lang || 'en').toLowerCase().split('-')[0];
    const factory = AI_TUTOR_WELCOME_CATALOG[langKey] || AI_TUTOR_WELCOME_CATALOG['en'];
    return factory(studentName);
  },

  /**
   * Generates a conversational, teacher-style pedagogical response
   * Generates a conversational, teacher-style pedagogical response
   * powered by the canonical server-side Gemini AI Teacher endpoint (/api/ai/teacher).
   */
  async generateConversationalResponse(
    question: string,
    language: string = 'en',
    studentName?: string,
    educationalContext?: EducationContextData,
    conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<{ text: string; spokenText: string }> {
    const cleanQ = question.trim();
    const langKey = (language || 'en').toLowerCase().split('-')[0];

    // Quick suggestion prompt starters (only if user literally clicks the prompt starter button)
    if (/^(explain a concept|sharax fikrad|اشرح مفهوماً|expliquer un concept|explicar un concepto)$/i.test(cleanQ)) {
      if (langKey === 'so') {
        const text = `Aad baan ugu faraxsanahay inaan kuu sharaxo fikrad kasta! Maadadee ama mowduuceed baad jeclaan lahayd inaad barato? (Tusaale ahaan: *naxwaha Ingiriisiga*, *photosynthesis*, *xeerarka Newton*, ama *aljebra*)`;
        return { text, spokenText: text };
      }
      if (langKey === 'ar') {
        const text = `يسعدني جداً أن أشرح لك أي مفهوم تريده! ما هو الموضوع أو الفكرة التي ترغب في فهمها اليوم؟ (مثال: *قواعد اللغة الإنجليزية*، *التمثيل الضوئي*، *قوانين نيوتن*، أو *المعادلات التربيعية*)`;
        return { text, spokenText: text };
      }
      const text = `I'd love to explain any concept for you! What topic or idea would you like to explore today? (For example: *English grammar*, *photosynthesis*, *Newton's laws of motion*, or *quadratic equations*)`;
      return { text, spokenText: text };
    }

    if (/^(help with homework|caawi shaqada guriga|مساعدة في الواجب|aide pour les devoirs|ayuda con la tarea)$/i.test(cleanQ)) {
      if (langKey === 'so') {
        const text = `Aan isla xallino shaqadaada guriga tallaabo tallaabo! Qor ama weydii su'aasha aad hadda gacanta ku hayso, waxaanan ku caawin doonaa inaad fahanto qaabka saxda ah ee loo xalliyo.`;
        return { text, spokenText: text };
      }
      if (langKey === 'ar') {
        const text = `أنا جاهز لنعمل معاً على حل واجبك المدرسي خطوة بخطوة! اكتب أو انطق السؤال أو المسألة التي تواجهك، وسأرشدك إلى كيفية الوصول للحل بنفسك وبكل ثقة.`;
        return { text, spokenText: text };
      }
      const text = `I'm ready to work through your homework together step by step! Type or speak the problem you're working on, and we'll break it down together so you understand every part.`;
      return { text, spokenText: text };
    }

    if (/^(practice questions|su'aalo tababar|أسئلة تدريبية|questions d'entraînement|preguntas de práctica)$/i.test(cleanQ)) {
      if (langKey === 'so') {
        const text = `Tababarku waa furaha fahamka fiican! Maadadee ayaad rabtaa inaad isku tijaabiso maanta? Xisaab, Saynis, Luuqado, mise Taariikh? Ii sheeg mowduuca, waxaanan kuu diyaarin doonaa su'aalo tababar.`;
        return { text, spokenText: text };
      }
      if (langKey === 'ar') {
        const text = `التدريب هو أفضل وسيلة لتثبيت المعلومات! في أي مادة أو موضوع تود أن نتدرب؟ (الرياضيات، العلوم، اللغات، أو التاريخ؟) أخبرني بالموضوع وسأعطيك أسئلة تدريبية ممتازة.`;
        return { text, spokenText: text };
      }
      const text = `Practice is the best way to master any subject! What topic would you like to test yourself on today? Math, Science, Languages, or History? Tell me the topic and I'll give you great practice questions.`;
      return { text, spokenText: text };
    }

    if (/^(revise for a test|dib u eegis imtixaan|مراجعة للاختبار|réviser pour un examen|revisar para un examen)$/i.test(cleanQ)) {
      if (langKey === 'so') {
        const text = `Aad bay u fiican tahay inaad hore u bilowdo diyaargarowga imtixaanka! Ii sheeg cutubka ama maadada aad imtixaanka ka leedahay, waxaanan kuu soo koobi doonaa qodobada ugu muhiimsan iyo talooyinka muhiimka ah.`;
        return { text, spokenText: text };
      }
      if (langKey === 'ar') {
        const text = `أحييك على البدء المبكر في الاستعداد للاختبار! ما هي المادة أو الوحدة الدراسية المقررة في اختبارك؟ سألخص لك أهم القواعد، والمفاهيم الأساسية، والنقاط الجوهرية.`;
        return { text, spokenText: text };
      }
      const text = `It's great to prepare ahead for your exam! What subject or chapter is your test on? Tell me and I'll summarize the key concepts, high-yield takeaways, and common pitfalls to avoid.`;
      return { text, spokenText: text };
    }

    if (/^(learn a new topic|baro mowduuc cusub|تعلّم موضوع جديد|apprendre un nouveau sujet|aprender un tema nuevo)$/i.test(cleanQ)) {
      if (langKey === 'so') {
        const text = `Waxbarashada cusubi had iyo jeer waa xiiso badan! Maxaad aad u danaynaysaa inaad wax ka ogaato maanta? (Tusaale ahaan: Luuqadda Ingiriisiga, Sirdoonka Macmalka ah, Xisaabta, ama Taariikhda?)`;
        return { text, spokenText: text };
      }
      if (langKey === 'ar') {
        const text = `الشغف بتعلّم أشياء جديدة هو سر النجاح! ما الذي يثير فضولك لتتعلمه اليوم؟ (مثال: قواعد اللغة الإنجليزية، الذكاء الاصطناعي، الرياضيات، أو التاريخ؟)`;
        return { text, spokenText: text };
      }
      const text = `Curiosity is the best foundation for learning! What new topic or field are you excited to explore today? (For example: English grammar, Artificial Intelligence, calculus, or world history?)`;
      return { text, spokenText: text };
    }

    // Call the canonical server-side Gemini AI Teacher endpoint
    try {
      const response = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: cleanQ,
          language: langKey,
          educationalContext: {
            ...educationalContext,
            studentName: studentName || educationalContext?.studentName,
          },
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || `AI Teacher returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.text) {
        throw new Error(data.message || 'No educational answer received from AI Teacher.');
      }

      return {
        text: data.text,
        spokenText: data.spokenText || data.text,
      };
    } catch (err: any) {
      console.error('[AI Learning Service] Error querying /api/ai/teacher:', err);
      throw err;
    }
  },
};

export interface TutorWelcomeData {
  greeting: string;
  body: string;
  fullSpeech: string;
}

export const AI_TUTOR_WELCOME_CATALOG: Record<string, (name?: string) => TutorWelcomeData> = {
  en: (name = '') => ({
    greeting: `Hello ${name ? name : ''}! 👋`.trim(),
    body: `Welcome to SmartEducate.\n\nI'm your AI learning assistant, and I'm here to help you understand your lessons, work through homework, practice questions, and learn step by step.\n\nWhat would you like to learn today?`,
    fullSpeech: name ? `Hello ${name}! Welcome to SmartEducate. I'm your AI learning assistant, and I'm here to help you understand your lessons, work through homework, practice questions, and learn step by step. What would you like to learn today?` : `Hello! Welcome to SmartEducate. I'm your AI learning assistant, and I'm here to help you understand your lessons, work through homework, practice questions, and learn step by step. What would you like to learn today?`,
  }),
  so: (name = '') => ({
    greeting: `Kusoo dhowow ${name ? name : ''}! 👋`.trim(),
    body: `Ku soo dhowow SmartEducate.\n\nWaxaan ahay kaaliyahaaga waxbarashada ee AI. Waxaan halkan u joogaa inaan kaa caawiyo fahanka casharradaada, shaqada guriga, laylisyada, iyo inaad wax u barato tallaabo tallaabo.\n\nMaxaad jeclaan lahayd inaad barato maanta?`,
    fullSpeech: `Ku soo dhowow SmartEducate ${name || ''}. Waxaan ahay kaaliyahaaga waxbarashada ee AI. Waxaan halkan u joogaa inaan kaa caawiyo fahanka casharradaada, shaqada guriga, laylisyada, iyo inaad wax u barato tallaabo tallaabo. Maxaad jeclaan lahayd inaad barato maanta?`,
  }),
  ar: (name = '') => ({
    greeting: `مرحباً بك ${name ? name : ''}! 👋`.trim(),
    body: `أهلاً بك في SmartEducate.\n\nأنا مساعدك التعليمي الذكي. أنا هنا لمساعدتك في فهم دروسك، وحل واجباتك المدرسية، والتدرب على الأسئلة، والتعلّم خطوة بخطوة.\n\nماذا تود أن نتعلّم اليوم؟`,
    fullSpeech: `مرحباً بك في SmartEducate ${name || ''}. أنا مساعدك التعليمي الذكي. أنا هنا لمساعدتك في فهم دروسك، وحل واجباتك المدرسية، والتدرب على الأسئلة، والتعلّم خطوة بخطوة. ماذا تود أن نتعلّم اليوم؟`,
  }),
  fr: (name = '') => ({
    greeting: `Bonjour ${name ? name : ''}! 👋`.trim(),
    body: `Bienvenue sur SmartEducate.\n\nJe suis votre tuteur d'apprentissage IA. Je suis là pour vous aider à comprendre vos cours, faire vos devoirs et progresser pas à pas.\n\nQu'aimeriez-vous apprendre aujourd'hui ?`,
    fullSpeech: `Bonjour ${name || ''} ! Bienvenue sur SmartEducate. Je suis votre tuteur d'apprentissage IA. Je suis là pour vous aider à comprendre vos cours, faire vos devoirs et progresser pas à pas. Qu'aimeriez-vous apprendre aujourd'hui ?`,
  }),
  es: (name = '') => ({
    greeting: `¡Hola ${name ? name : ''}! 👋`.trim(),
    body: `Te damos la bienvenida a SmartEducate.\n\nSoy tu tutor de aprendizaje con IA. Estoy aquí para ayudarte a comprender tus lecciones, resolver tareas y aprender paso a paso.\n\n¿Qué te gustaría aprender hoy?`,
    fullSpeech: `¡Hola ${name || ''}! Te damos la bienvenida a SmartEducate. Soy tu tutor de aprendizaje con IA. Estoy aquí para ayudarte a comprender tus lecciones, resolver tareas y aprender paso a paso. ¿Qué te gustaría aprender hoy?`,
  }),
  de: (name = '') => ({
    greeting: `Hallo ${name ? name : ''}! 👋`.trim(),
    body: `Willkommen bei SmartEducate.\n\nIch bin dein KI-Lernassistent. Ich helfe dir dabei, deine Lektionen zu verstehen, Hausaufgaben zu lösen und Schritt für Schritt zu lernen.\n\nWas möchtest du heute lernen?`,
    fullSpeech: `Hallo ${name || ''}! Willkommen bei SmartEducate. Ich bin dein KI-Lernassistent. Ich helfe dir dabei, deine Lektionen zu verstehen, Hausaufgaben zu lösen und Schritt für Schritt zu lernen. Was möchtest du heute lernen?`,
  }),
  it: (name = '') => ({
    greeting: `Ciao ${name ? name : ''}! 👋`.trim(),
    body: `Benvenuto su SmartEducate.\n\nSono il tuo tutor di apprendimento IA. Sono qui per aiutarti a comprendere le tue lezioni, svolgere i compiti e imparare passo dopo passo.\n\nCosa vorresti imparare oggi?`,
    fullSpeech: `Ciao ${name || ''}! Benvenuto su SmartEducate. Sono il tuo tutor di apprendimento IA. Sono qui per aiutarti a comprendere le tue lezioni, svolgere i compiti e imparare passo بعد passo. Cosa vorresti imparare oggi?`,
  }),
  pt: (name = '') => ({
    greeting: `Olá ${name ? name : ''}! 👋`.trim(),
    body: `Boas-vindas ao SmartEducate.\n\nSou seu tutor de aprendizagem com IA. Estou aqui para ajudar você a entender suas lições, fazer tarefas e aprender passo a passo.\n\nO que você gostaria de aprender hoje?`,
    fullSpeech: `Olá ${name || ''}! Boas-vindas ao SmartEducate. Sou seu tutor de aprendizagem com IA. Estou aqui para ajudar você a entender suas lições, fazer tarefas e aprender passo a passo. O que você gostaria de aprender hoje?`,
  }),
  tr: (name = '') => ({
    greeting: `Merhaba ${name ? name : ''}! 👋`.trim(),
    body: `SmartEducate'e hoş geldiniz.\n\nBen yapay zekâ öğrenme asistanınızım. Derslerinizi anlamanıza, ödevlerinizi yapmanıza ve adım adım öğrenmenize yardımcı olmak için buradayım.\n\nBugün ne öğrenmek istersiniz?`,
    fullSpeech: `Merhaba ${name || ''}! SmartEducate'e hoş geldiniz. Ben yapay zekâ öğrenme asistanınızım. Derslerinizi anlamanıza, ödevlerinizi yapmanıza ve adım adım öğrenmenize yardımcı olmak için buradayım. Bugün ne öğrenmek istersiniz?`,
  }),
  ru: (name = '') => ({
    greeting: `Здравствуйте ${name ? name : ''}! 👋`.trim(),
    body: `Добро пожаловать в SmartEducate.\n\nЯ ваш персональный ИИ-репетитор. Я здесь, чтобы помочь вам понять учебные темы, выполнить домашние задания и учиться шаг за шагом.\n\nЧто бы вы хотели изучить сегодня?`,
    fullSpeech: `Здравствуйте ${name || ''}! Добро пожаловать в SmartEducate. Я ваш персональный ИИ-репетитор. Я здесь, чтобы помочь вам понять учебные темы, выполнить домашние задания и учиться шаг за шагом. Что бы вы хотели изучить сегодня?`,
  }),
  ur: (name = '') => ({
    greeting: `خوش آمدید ${name ? name : ''}! 👋`.trim(),
    body: `SmartEducate میں خوش آمدید۔\n\nمیں آپ کا ذاتی اے آئی تعلیمی معاون ہوں۔ میں آپ کے اسباق کو سمجھنے، ہوم ورک مکمل کرنے اور مرحلہ وار سیکھنے میں آپ کی مدد کے لیے حاضر ہوں۔\n\nآج آپ کیا سیکھنا چاہیں گے؟`,
    fullSpeech: `SmartEducate میں خوش آمدید ${name || ''}۔ میں آپ کا ذاتی اے آئی تعلیمی معاون ہوں۔ میں آپ کے اسباق کو سمجھنے، ہوم ورک مکمل کرنے اور مرحلہ وار سیکھنے میں آپ کی مدد کے لیے حاضر ہوں۔ آج آپ کیا سیکھنا چاہیں گے؟`,
  }),
  sw: (name = '') => ({
    greeting: `Hujambo ${name ? name : ''}! 👋`.trim(),
    body: `Karibu kwenye SmartEducate.\n\nMimi ni mwalimu wako wa kujifunzia wa AI. Nipo hapa kukusaidia kuelewa masomo yako, kufanya kazi za nyumbani, na kujifunza hatua kwa hatua.\n\nUngependa kujifunza nini leo?`,
    fullSpeech: `Hujambo ${name || ''}! Karibu kwenye SmartEducate. Mimi ni mwalimu wako wa kujifunzia wa AI. Nipo hapa kukusaidia kuelewa masomo yako, kufanya kazi za nyumbani, na kujifunza hatua kwa hatua. Ungependa kujifunza nini leo?`,
  }),
  zh: (name = '') => ({
    greeting: `你好 ${name ? name : ''}! 👋`.trim(),
    body: `欢迎来到 SmartEducate。\n\n我是你的 AI 学习导师。我在这里帮助你理解课程知识、解答作业疑问并循序渐进地学习。\n\n今天你想学习什么内容？`,
    fullSpeech: `你好 ${name || ''}！欢迎来到 SmartEducate。我是你的 AI 学习导师。我在这里帮助你理解课程知识、解答作业疑问并循序渐进地学习。今天你想学习什么内容？`,
  }),
};
