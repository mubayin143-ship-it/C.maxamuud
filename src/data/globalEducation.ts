/**
 * SmartEducate Canonical Global Education Catalog
 * Single source of truth for global universities, subjects,
 * international teachers, and verified classrooms.
 * Fully supports Africa, Europe, North America, South America,
 * Asia, Middle East, and Australia/Oceania.
 */

import { CANONICAL_FACULTIES, CANONICAL_TOP_LANGUAGES } from './canonicalCurriculum';
import {
  GlobalTeacher,
  GlobalUniversity,
  GlobalClassroom,
  HomeworkHelpRequest,
  ClassroomStudentItem,
  ClassroomAssignment,
  ClassroomAnnouncement,
  CurriculumFaculty,
  CurriculumSubjectItem,
  CurriculumCourse,
  CurriculumSearchResult,
} from '../types/education';

export const GLOBAL_UNIVERSITIES: GlobalUniversity[] = [
  // Europe
  {
    id: 'uni-oxford',
    name: 'University of Oxford',
    country: 'United Kingdom',
    city: 'Oxford',
    continent: 'Europe',
    verificationStatus: 'accredited',
    faculties: ['Mathematical, Physical & Life Sciences', 'Medical Sciences', 'Humanities', 'Social Sciences'],
    courseCount: 380,
  },
  {
    id: 'uni-sorbonne',
    name: 'Sorbonne University',
    country: 'France',
    city: 'Paris',
    continent: 'Europe',
    verificationStatus: 'accredited',
    faculties: ['Sciences & Engineering', 'Medicine', 'Arts and Humanities'],
    courseCount: 260,
  },
  {
    id: 'uni-eth',
    name: 'ETH Zurich',
    country: 'Switzerland',
    city: 'Zurich',
    continent: 'Europe',
    verificationStatus: 'accredited',
    faculties: ['Computer Science', 'Mechanical & Process Engineering', 'Architecture', 'Physics'],
    courseCount: 290,
  },

  // North America
  {
    id: 'uni-harvard',
    name: 'Harvard University',
    country: 'United States',
    city: 'Cambridge, MA',
    continent: 'North America',
    verificationStatus: 'accredited',
    faculties: ['Engineering & Applied Sciences', 'Business', 'Law', 'Medicine', 'Arts & Sciences'],
    courseCount: 420,
  },
  {
    id: 'uni-toronto',
    name: 'University of Toronto',
    country: 'Canada',
    city: 'Toronto',
    continent: 'North America',
    verificationStatus: 'accredited',
    faculties: ['Arts & Science', 'Applied Science & Engineering', 'Management', 'Medicine'],
    courseCount: 340,
  },

  // Africa
  {
    id: 'uni-cairo',
    name: 'Cairo University',
    country: 'Egypt',
    city: 'Giza',
    continent: 'Africa',
    verificationStatus: 'accredited',
    faculties: ['Faculty of Medicine', 'Faculty of Engineering', 'Faculty of Computers & AI', 'Faculty of Law'],
    courseCount: 290,
  },
  {
    id: 'uni-nairobi',
    name: 'University of Nairobi',
    country: 'Kenya',
    city: 'Nairobi',
    continent: 'Africa',
    verificationStatus: 'accredited',
    faculties: ['Science and Technology', 'Health Sciences', 'Business and Management Sciences', 'Education'],
    courseCount: 210,
  },
  {
    id: 'uni-uct',
    name: 'University of Cape Town',
    country: 'South Africa',
    city: 'Cape Town',
    continent: 'Africa',
    verificationStatus: 'accredited',
    faculties: ['Commerce', 'Engineering & Built Environment', 'Health Sciences', 'Humanities'],
    courseCount: 250,
  },
  {
    id: 'uni-snu',
    name: 'Somali National University',
    country: 'Somalia',
    city: 'Mogadishu',
    continent: 'Africa',
    verificationStatus: 'accredited',
    faculties: ['Computer Science & IT', 'Medicine & Health Sciences', 'Economics & Management', 'Education'],
    courseCount: 140,
  },
  {
    id: 'uni-simad',
    name: 'SIMAD University',
    country: 'Somalia',
    city: 'Mogadishu',
    continent: 'Africa',
    verificationStatus: 'verified',
    faculties: ['Computing & IT', 'Management Sciences', 'Engineering', 'Law'],
    courseCount: 120,
  },

  // South America
  {
    id: 'uni-usp',
    name: 'University of São Paulo (USP)',
    country: 'Brazil',
    city: 'São Paulo',
    continent: 'South America',
    verificationStatus: 'accredited',
    faculties: ['Polytechnic School of Engineering', 'Medicine', 'Economics & Administration', 'Exact Sciences'],
    courseCount: 310,
  },
  {
    id: 'uni-uba',
    name: 'University of Buenos Aires',
    country: 'Argentina',
    city: 'Buenos Aires',
    continent: 'South America',
    verificationStatus: 'verified',
    faculties: ['Engineering', 'Economic Sciences', 'Medicine', 'Law'],
    courseCount: 220,
  },

  // Asia
  {
    id: 'uni-tokyo',
    name: 'University of Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    continent: 'Asia',
    verificationStatus: 'accredited',
    faculties: ['Engineering', 'Science', 'Information Science & Technology', 'Economics'],
    courseCount: 310,
  },
  {
    id: 'uni-nus',
    name: 'National University of Singapore (NUS)',
    country: 'Singapore',
    city: 'Singapore',
    continent: 'Asia',
    verificationStatus: 'accredited',
    faculties: ['Computing', 'Business', 'Engineering', 'Science'],
    courseCount: 330,
  },

  // Middle East
  {
    id: 'uni-ksu',
    name: 'King Saud University',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    continent: 'Middle East',
    verificationStatus: 'accredited',
    faculties: ['Computer & Information Sciences', 'Engineering', 'Medicine', 'Business'],
    courseCount: 280,
  },
  {
    id: 'uni-aub',
    name: 'American University of Beirut',
    country: 'Lebanon',
    city: 'Beirut',
    continent: 'Middle East',
    verificationStatus: 'verified',
    faculties: ['Engineering & Architecture', 'Arts & Sciences', 'Health Sciences', 'Business'],
    courseCount: 190,
  },

  // Australia / Oceania
  {
    id: 'uni-melb',
    name: 'University of Melbourne',
    country: 'Australia',
    city: 'Melbourne',
    continent: 'Australia/Oceania',
    verificationStatus: 'accredited',
    faculties: ['Engineering and IT', 'Medicine, Dentistry & Health', 'Business and Economics', 'Science'],
    courseCount: 360,
  },
  {
    id: 'uni-sydney',
    name: 'University of Sydney',
    country: 'Australia',
    city: 'Sydney',
    continent: 'Australia/Oceania',
    verificationStatus: 'registered',
    faculties: ['Engineering', 'Medicine and Health', 'Business School', 'Arts and Social Sciences'],
    courseCount: 300,
  },
];

export const SCHOOL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const SCHOOL_SUBJECTS = [
  'Mathematics',
  'General Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English Language',
  'Social Studies',
  'History & Geography',
  'Computer Studies',
];

export const GLOBAL_LEARNING_LANGUAGES = CANONICAL_TOP_LANGUAGES.map((l) => l.name);

export const PROGRAMMING_BASIC_CATALOG = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'HTML & CSS',
  'SQL',
  'Web Development',
  'Programming Fundamentals',
];

export const PROGRAMMING_ADV_CATALOG = [
  'Android Development',
  'iOS Development',
  'Advanced Web Development',
  'Backend Development',
  'Frontend Development',
  'Full-Stack Development',
  'Mobile Development',
  'Cloud Development (AWS / GCP)',
  'Software Engineering',
  'AI / Machine Learning',
  'Data Science',
  'Cybersecurity & Ethical Hacking',
];

export const PROFESSIONAL_SKILLS_CATALOG = [
  'Business',
  'Accounting',
  'Marketing',
  'Graphic Design',
  'Digital Marketing',
  'Communication',
  'Leadership',
  'Project Management',
  'Data Analysis',
  'Entrepreneurship',
  'Career Skills',
];

export const VOCATIONAL_TECHNICAL_CATALOG = [
  'Aviation & Flight Operations',
  'Airport Ground Operations & Dispatch',
  'Maritime & Port Logistics',
  'Ship Navigation & Marine Engineering',
  'Automotive Mechanics & EV Systems',
  'Vehicle Diagnostics & Hybrid Powertrains',
  'Electrical Installation & Maintenance',
  'Mechanical Fitting & Machining',
  'Heavy Machinery & Logistics Management',
];

export const MEDICAL_SCIENCES_CATALOG = [
  'Human Anatomy & Physiology',
  'Clinical Medicine Foundations',
  'Nursing Principles & Patient Care',
  'Pharmacology & Medication Safety',
  'Pathology & Disease Mechanisms',
  'Medical Terminology & Documentation',
  'Emergency Care & First Response',
];

/**
 * Phase 09 Canonical Re-exports from single source of truth (canonicalCurriculum.ts)
 */
export {
  CANONICAL_SCHOOL_GRADES,
  CANONICAL_POPULAR_SUBJECTS,
  CANONICAL_TOP_10_SUBJECTS,
  CANONICAL_TOP_LANGUAGES,
  CANONICAL_FACULTIES,
  TEACHER_AZ_SPECIALIZATIONS,
  TEACHER_SPECIALIZATIONS_A_TO_Z,
} from './canonicalCurriculum';
export type { TopLanguageItem, CanonicalPopularSubjectItem } from './canonicalCurriculum';

/**
 * Phase 09 Teacher Types
 */
export interface TeacherTypeItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
}

export const CANONICAL_TEACHER_TYPES: TeacherTypeItem[] = [
  { id: 'school', title: 'School Teacher (Grades 1–12)', desc: 'Primary, middle, or high school institutional educator', badge: 'K-12' },
  { id: 'university', title: 'University / College Teacher', desc: 'Faculty lecturer, professor, or academic researcher', badge: 'Higher Ed' },
  { id: 'independent', title: 'Independent Teacher', desc: 'Teaches independent classes and courses under own brand', badge: 'Independent' },
  { id: 'private_tutor', title: 'Private Tutor (1-on-1 & Small Groups)', desc: 'Dedicated personalized coaching and homework assistance', badge: '1-on-1' },
  { id: 'part_time_tutor', title: 'Part-Time Tutor', desc: 'Evening and weekend specialized tutoring alongside other work', badge: 'Part-Time' },
  { id: 'full_time_tutor', title: 'Full-Time Professional Tutor', desc: 'Full-time dedicated tutoring practice across subjects', badge: 'Full-Time' },
  { id: 'adult_educator', title: 'Adult Educator & Lifelong Learning', desc: 'Teaches mature students, career changers, and out-of-school youth', badge: 'Adult' },
  { id: 'professional_trainer', title: 'Professional & Corporate Trainer', desc: 'Workplace skills, technical certifications, and executive mentoring', badge: 'Corporate' },
  { id: 'subject_specialist', title: 'Subject Specialist', desc: 'Deep focus on one academic discipline (e.g. Advanced Calculus or Aviation)', badge: 'Specialist' },
  { id: 'online_teacher', title: 'Online / Remote Teacher', desc: 'Conducts interactive live classes and digital cohorts globally', badge: 'Online' },
];

/**
 * Phase 09 & 10 Canonical Progressive Learning Levels
 * Beginner -> Intermediate -> Advanced -> Higher/Specialized -> University -> Postgraduate -> Professional -> Adult/Lifelong
 */
export const CANONICAL_PROGRESSIVE_LEVELS: string[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Higher / Specialized',
  'University',
  'Postgraduate',
  'Professional',
  'Adult / Lifelong Learning',
];

/**
 * Phase 09 Teaching Level Options
 */
export const CANONICAL_TEACHING_LEVELS: string[] = [
  'Grades 1–5 (Primary)',
  'Grades 6–8 (Middle School)',
  'Grades 9–12 (High School)',
  'Beginner / Foundations',
  'Intermediate',
  'Advanced / Honors',
  'Higher / Specialized',
  'University Undergraduate',
  'University Postgraduate',
  'Professional & Corporate',
  'Adult & Lifelong Learning',
];

/**
 * Phase 09 Student Learning Goals
 */
export interface LearningGoalItem {
  id: string;
  title: string;
  desc: string;
}

export const CANONICAL_LEARNING_GOALS: LearningGoalItem[] = [
  { id: 'foundations', title: 'Master Foundations & Core Concepts', desc: 'Build rock-solid fundamentals and overcome learning hurdles' },
  { id: 'exam_prep', title: 'Exam & Test Preparation', desc: 'Target top scores in national exams, SAT, ACT, finals, or GCSEs' },
  { id: 'homework_help', title: 'Homework & Assignment Help', desc: 'Get step-by-step guidance on problem sets and daily assignments' },
  { id: 'higher_learning', title: 'Deep Academic & University Study', desc: 'Advanced research, university coursework, and theoretical depth' },
  { id: 'professional_skills', title: 'Career & Practical Job Skills', desc: 'Industry certifications, coding skills, and workplace readiness' },
];

/**
 * Multi-Facet Search Engine for Student Curriculum & Learning Discovery
 */
export function searchCurriculumCatalogue(rawQuery: string): CurriculumSearchResult {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return { faculties: [], subjects: [], courses: [], topics: [], teachers: [], classes: [] };
  }

  const tokens = query.split(/\s+/).filter(Boolean);

  // 1. Search Faculties
  const matchedFaculties = CANONICAL_FACULTIES.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query) ||
      (tokens.length > 1 && tokens.every((tok) => f.name.toLowerCase().includes(tok) || f.description.toLowerCase().includes(tok)))
  );

  // 2. Search Subjects, Courses & Topics
  const matchedSubjects: CurriculumSubjectItem[] = [];
  const matchedCourses: { course: string; subject: string; facultyId: string }[] = [];
  const matchedTopics: { topic: string; subject: string; facultyId: string }[] = [];

  for (const faculty of CANONICAL_FACULTIES) {
    for (const subj of faculty.subjects) {
      const subjHay = `${subj.name} ${subj.description || ''} ${subj.levels.join(' ')} ${subj.topics.join(' ')} ${faculty.name}`.toLowerCase();
      const subjMatch = subjHay.includes(query) || (tokens.length > 1 && tokens.every((tok) => subjHay.includes(tok)));

      if (subjMatch) {
        matchedSubjects.push(subj);
      }

      // Check courses
      if (subj.courses) {
        for (const c of subj.courses) {
          const courseHay = `${c.name} ${c.description || ''} ${c.topics?.join(' ') || ''} ${subj.name}`.toLowerCase();
          if (courseHay.includes(query) || (tokens.length > 1 && tokens.every((tok) => courseHay.includes(tok)))) {
            matchedCourses.push({
              course: c.name,
              subject: subj.name,
              facultyId: faculty.id,
            });
            if (!matchedSubjects.some((s) => s.id === subj.id)) {
              matchedSubjects.push(subj);
            }
            // Intelligently surface the topics under this matched course
            if (c.topics) {
              for (const ct of c.topics) {
                if (!matchedTopics.some((item) => item.topic === ct && item.subject === subj.name)) {
                  matchedTopics.push({
                    topic: ct,
                    subject: subj.name,
                    facultyId: faculty.id,
                  });
                }
              }
            }
          }
        }
      }

      // Check topics
      for (const t of subj.topics) {
        const topicHay = `${t} ${subj.name}`.toLowerCase();
        if (topicHay.includes(query) || (tokens.length > 1 && tokens.every((tok) => topicHay.includes(tok)))) {
          if (!matchedTopics.some((item) => item.topic === t && item.subject === subj.name)) {
            matchedTopics.push({
              topic: t,
              subject: subj.name,
              facultyId: faculty.id,
            });
          }
          if (!matchedSubjects.some((s) => s.id === subj.id)) {
            matchedSubjects.push(subj);
          }
        }
      }
    }
  }

  // 3. Search Matching Teachers
  const matchedTeachers = GLOBAL_TEACHERS.filter((teacher) => {
    const hay = `${teacher.name} ${teacher.title} ${teacher.subject} ${teacher.level} ${teacher.bio} ${teacher.language} ${teacher.country} ${teacher.institutionName || ''}`.toLowerCase();
    if (hay.includes(query)) return true;
    if (tokens.length > 1 && tokens.every((tok) => hay.includes(tok))) return true;

    // Cross-match if query specifies a grade (e.g. "Grade 8") and subject (e.g. "Algebra" or "Math")
    const isGrade8 = query.includes('grade 8') || (query.includes('grade') && query.includes('8'));
    if (isGrade8 && (teacher.level.toLowerCase().includes('grade 8') || teacher.title.toLowerCase().includes('grade 8') || teacher.subject.toLowerCase().includes('grade 8'))) {
      if (query.includes('math') || query.includes('algebra') || query.includes('linear')) {
        if (hay.includes('math') || hay.includes('algebra') || hay.includes('equations')) return true;
      }
    }

    return false;
  });

  // 4. Search Matching Classes
  const matchedClasses = GLOBAL_CLASSROOMS.filter((cls) => {
    const hay = `${cls.code} ${cls.title} ${cls.instructorName} ${cls.institution} ${cls.subject}`.toLowerCase();
    if (hay.includes(query)) return true;
    if (tokens.length > 1 && tokens.every((tok) => hay.includes(tok))) return true;

    // Specific grade/subject cross-match
    if ((query.includes('grade 8') || (query.includes('grade') && query.includes('8'))) && (query.includes('math') || query.includes('algebra'))) {
      if (cls.code === 'GRADE8-MATH' || cls.title.toLowerCase().includes('grade 8')) return true;
    }

    return false;
  });

  return {
    faculties: matchedFaculties,
    subjects: matchedSubjects,
    courses: matchedCourses,
    topics: matchedTopics,
    teachers: matchedTeachers,
    classes: matchedClasses,
  };
}

export const GLOBAL_TEACHERS: GlobalTeacher[] = [
  // School
  {
    id: 't-dr-ahmed-phys',
    name: 'Dr. Ahmed Osman',
    title: 'Senior Physics & Mathematics Teacher',
    category: 'school',
    subject: 'Physics & Mathematics',
    level: 'High School & University',
    language: 'English / Arabic',
    country: 'Egypt / UK',
    rating: 5.0,
    reviewCount: 168,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$22/hr',
    bio: 'Experienced physics teacher and math tutor covering Newtonian mechanics, thermodynamics, electromagnetism, and algebra.',
    isVerified: true,
  },
  {
    id: 't-sarah-math',
    name: 'Sarah Ahmed',
    title: 'Senior Mathematics Instructor',
    category: 'school',
    subject: 'Mathematics',
    level: 'Grade 10',
    language: 'English',
    country: 'United Kingdom',
    rating: 4.9,
    reviewCount: 142,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Passionate math educator specializing in algebra, geometry, and international GCSE/SAT prep.',
    isVerified: true,
  },
  {
    id: 't-bilal-grade8',
    name: 'Bilal Osman',
    title: 'Middle School & Grade 8 Mathematics Specialist',
    category: 'school',
    subject: 'Grade 8 Mathematics',
    level: 'Grade 8',
    language: 'English / Somali',
    country: 'Somalia',
    rating: 4.9,
    reviewCount: 118,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Specialized in Grade 8 linear equations, pre-algebra foundations, and national exam readiness.',
    isVerified: true,
  },
  {
    id: 't-turkish-emre',
    name: 'Emre Yılmaz',
    title: 'Turkish Language Specialist & TÖMER Coach',
    category: 'language',
    subject: 'Turkish Language',
    level: 'Beginner to Advanced (A1–C2)',
    language: 'Turkish / English',
    country: 'Turkey',
    rating: 4.9,
    reviewCount: 164,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Native Turkish educator specializing in vowel harmony, agglutinative grammar, TÖMER exam prep, and daily conversational fluency.',
    isVerified: true,
  },
  {
    id: 't-russian-elena',
    name: 'Elena Petrova',
    title: 'Russian Language & Literature Instructor',
    category: 'language',
    subject: 'Russian Language',
    level: 'Beginner to Advanced',
    language: 'Russian / English',
    country: 'Kazakhstan',
    rating: 4.9,
    reviewCount: 132,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$18/hr',
    bio: 'Certified Russian teacher explaining Cyrillic, 6 grammatical cases, verbs of motion, and conversational dialogue.',
    isVerified: true,
  },
  {
    id: 't-urdu-zainab',
    name: 'Dr. Zainab Tariq',
    title: 'Urdu Language & Classical Literature Specialist',
    category: 'language',
    subject: 'Urdu Language',
    level: 'All Levels',
    language: 'Urdu / English',
    country: 'Pakistan',
    rating: 5.0,
    reviewCount: 147,
    availability: 'Daily sessions',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Nastaliq handwriting, Urdu grammatical syntax, South Asian literary history, and spoken Urdu communication.',
    isVerified: true,
  },
  {
    id: 't-swahili-juma',
    name: 'Juma Mwangi',
    title: 'Kiswahili Sanifu & East African Language Teacher',
    category: 'language',
    subject: 'Swahili Language',
    level: 'Beginner to Advanced',
    language: 'Swahili / English',
    country: 'Kenya / Tanzania',
    rating: 4.9,
    reviewCount: 98,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Patient guidance in Bantu noun classes, Swahili verb prefixes, everyday marketplace conversation, and East African literature.',
    isVerified: true,
  },
  {
    id: 't-german-lukas',
    name: 'Lukas Weber',
    title: 'German Language Specialist & Goethe C2 Coach',
    category: 'language',
    subject: 'German Language',
    level: 'Goethe A1–C2',
    language: 'German / English',
    country: 'Germany',
    rating: 4.9,
    reviewCount: 180,
    availability: 'Weekdays',
    pricingType: 'paid',
    priceDisplay: '$20/hr',
    bio: 'Systematic approach to German case endings, word order rules, Goethe-Institut exam preparation, and professional German.',
    isVerified: true,
  },
  {
    id: 't-aviation-tariq',
    name: 'Capt. Tariq Al-Mansoor',
    title: 'Commercial Airline Pilot & Aviation Ground Instructor',
    category: 'vocational',
    subject: 'Aviation & Aircraft Engineering',
    level: 'Ground School & CPL',
    language: 'English / Arabic',
    country: 'UAE / UK',
    rating: 5.0,
    reviewCount: 112,
    availability: 'Weekends & Evenings',
    pricingType: 'paid',
    priceDisplay: '$28/hr',
    bio: 'Commercial pilot and aviation ground instructor covering flight planning, aerodynamics, aircraft systems, and ICAO airport operations.',
    isVerified: true,
    institutionName: 'Aviation Academy & Flight Operations',
  },
  {
    id: 't-maritime-hersi',
    name: 'Capt. Mohamed Hersi',
    title: 'Master Mariner & Marine Navigation Specialist',
    category: 'vocational',
    subject: 'Maritime & Marine Navigation',
    level: 'Cadet to Master Mariner',
    language: 'English / Somali',
    country: 'Somalia / Netherlands',
    rating: 4.9,
    reviewCount: 89,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$24/hr',
    bio: 'Deck officer and master mariner teaching COLREGs, ship stability, marine navigation systems (ECDIS/ARPA), and port terminal logistics.',
    isVerified: true,
  },
  {
    id: 't-auto-marcus',
    name: 'Marcus Vance',
    title: 'Automotive Master Technician & EV Specialist',
    category: 'vocational',
    subject: 'Automotive Engineering & EV Technology',
    level: 'Apprentice to Master Tech',
    language: 'English',
    country: 'United States',
    rating: 4.9,
    reviewCount: 135,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Internal combustion engine mechanics, OBD-II oscilloscope diagnostics, and high-voltage electric vehicle battery systems.',
    isVerified: true,
  },
  {
    id: 't-mary-english',
    name: 'Mary Gallagher',
    title: 'English Grammar & Composition Coach',
    category: 'language',
    subject: 'English Grammar',
    level: 'All Levels',
    language: 'English',
    country: 'Ireland',
    rating: 5.0,
    reviewCount: 185,
    availability: 'Daily slots',
    pricingType: 'paid',
    priceDisplay: '$16/hr',
    bio: 'Master syntax, sentence structure, punctuation, and academic writing with interactive guidance.',
    isVerified: true,
  },
  {
    id: 't-eng-khalid-aircraft',
    name: 'Eng. Khalid Al-Mansoor',
    title: 'Aeronautical Engineer & Aircraft Systems Instructor',
    category: 'vocational',
    subject: 'Aircraft Engineering',
    level: 'College & Professional',
    language: 'English / Arabic',
    country: 'UAE / UK',
    rating: 4.9,
    reviewCount: 94,
    availability: 'Weekends & Evenings',
    pricingType: 'paid',
    priceDisplay: '$26/hr',
    bio: 'Commercial aircraft propulsion, aerodynamic lift profiles, and avionics maintenance specialist.',
    isVerified: true,
  },
  {
    id: 't-prof-farah-econ',
    name: 'Prof. Farah Aden',
    title: 'Economics & Financial Accounting Lecturer',
    category: 'skills',
    subject: 'Economics & Accounting',
    level: 'University & Professional',
    language: 'English / Somali',
    country: 'Somalia',
    rating: 4.8,
    reviewCount: 132,
    availability: 'Available this week',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Micro & macroeconomics, double-entry financial accounting, and international trade analysis.',
    isVerified: true,
  },
  {
    id: 't-ustadh-law',
    name: 'Dr. Tariq Al-Nuaimi',
    title: 'Constitutional & Commercial Law Specialist',
    category: 'skills',
    subject: 'Law & Legal Studies',
    level: 'Undergraduate & Bar Prep',
    language: 'Arabic / English',
    country: 'Egypt',
    rating: 4.9,
    reviewCount: 88,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$20/hr',
    bio: 'Clear legal case analysis, contract law frameworks, and statutory interpretation methods.',
    isVerified: true,
  },
  {
    id: 't-david-phys',
    name: 'Dr. David Chen',
    title: 'Secondary Physics Specialist',
    category: 'school',
    subject: 'Physics',
    level: 'Grade 12',
    language: 'English',
    country: 'Canada',
    rating: 4.8,
    reviewCount: 98,
    availability: 'Mon - Thu',
    pricingType: 'paid',
    priceDisplay: '$18/hr',
    bio: '12 years teaching Newtonian mechanics, electromagnetism, and exam problem solving.',
    isVerified: true,
  },
  {
    id: 't-mariam-bio',
    name: 'Mariam Al-Mansoor',
    title: 'Biology & Chemistry Teacher',
    category: 'school',
    subject: 'Biology',
    level: 'Grade 9',
    language: 'Arabic / English',
    country: 'Egypt',
    rating: 4.9,
    reviewCount: 84,
    availability: 'Available this week',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Making life sciences interactive and intuitive through diagrams, experiments, and friendly coaching.',
    isVerified: true,
  },

  // Languages
  {
    id: 't-elena-spanish',
    name: 'Elena Rodriguez',
    title: 'Certified DELE Spanish Tutor',
    category: 'language',
    subject: 'Spanish',
    level: 'Basic',
    language: 'Spanish',
    country: 'Spain',
    rating: 5.0,
    reviewCount: 210,
    availability: 'Daily slots',
    pricingType: 'paid',
    priceDisplay: '$15/hr',
    bio: 'Native speaker with 8+ years teaching practical pronunciation, daily dialogue, and grammar fundamentals.',
    isVerified: true,
  },
  {
    id: 't-tariq-arabic',
    name: 'Ustadh Tariq Hashim',
    title: 'Classical & Modern Arabic Instructor',
    category: 'language',
    subject: 'Arabic',
    level: 'Basic & Advanced',
    language: 'Arabic',
    country: 'Jordan',
    rating: 4.9,
    reviewCount: 175,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Clear, patient instruction in Arabic reading, handwriting, grammar (Nahw), and literature.',
    isVerified: true,
  },
  {
    id: 't-julien-french',
    name: 'Julien Mercier',
    title: 'Alliance Française Certified Coach',
    category: 'language',
    subject: 'French',
    level: 'Advanced',
    language: 'French',
    country: 'France',
    rating: 4.8,
    reviewCount: 64,
    availability: 'Weekends',
    pricingType: 'paid',
    priceDisplay: '$20/hr',
    bio: 'Focus on natural French conversation, business meetings, and academic essay composition.',
    isVerified: true,
  },
  {
    id: 't-matteo-italian',
    name: 'Matteo Rossi',
    title: 'Certified CILS Italian Language Instructor',
    category: 'language',
    subject: 'Italian Language',
    level: 'Beginner to Advanced (A1–C2)',
    language: 'Italian / English',
    country: 'Italy',
    rating: 4.9,
    reviewCount: 88,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$18/hr',
    bio: 'Native Italian teacher specializing in grammar, conversation, cultural immersion, and CILS exam preparation.',
    isVerified: true,
  },
  {
    id: 't-yoko-japanese',
    name: 'Yoko Tanaka',
    title: 'Japanese Language & JLPT Specialist',
    category: 'language',
    subject: 'Japanese Language',
    level: 'JLPT N5–N1 & Conversational',
    language: 'Japanese / English',
    country: 'Japan',
    rating: 5.0,
    reviewCount: 124,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$22/hr',
    bio: 'Hiragana, Katakana, Kanji, conversational fluency, Japanese business etiquette, and JLPT preparation.',
    isVerified: true,
  },

  // Programming
  {
    id: 't-alex-python',
    name: 'Alex Rivera',
    title: 'Lead Software Engineer & Mentor',
    category: 'programming',
    subject: 'Python',
    level: 'Basic',
    language: 'English',
    country: 'United States',
    rating: 4.9,
    reviewCount: 310,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Learn Python coding from scratch with hands-on exercises, algorithms, and clean code principles.',
    isVerified: true,
  },
  {
    id: 't-amina-fullstack',
    name: 'Amina Noor',
    title: 'Senior Full-Stack Architect',
    category: 'programming',
    subject: 'Full-Stack Development',
    level: 'Advanced',
    language: 'English',
    country: 'Kenya',
    rating: 5.0,
    reviewCount: 156,
    availability: 'Mon - Fri',
    pricingType: 'paid',
    priceDisplay: '$22/hr',
    bio: 'Hands-on React, Node.js, TypeScript, cloud deployments, and production software patterns.',
    isVerified: true,
  },
  {
    id: 't-kenji-mobile',
    name: 'Kenji Sato',
    title: 'Mobile Development Specialist',
    category: 'programming',
    subject: 'Android & iOS Development',
    level: 'Advanced',
    language: 'English',
    country: 'Japan',
    rating: 4.9,
    reviewCount: 88,
    availability: 'Evenings',
    pricingType: 'paid',
    priceDisplay: '$25/hr',
    bio: 'Building real cross-platform mobile apps published directly to the Play Store and App Store.',
    isVerified: true,
  },

  // University
  {
    id: 't-dr-marcus-cs',
    name: 'Prof. Marcus Vance',
    title: 'Computer Science Department Chair',
    category: 'university',
    subject: 'Data Structures & Algorithms',
    level: 'Undergraduate',
    language: 'English',
    country: 'United Kingdom',
    rating: 4.9,
    reviewCount: 195,
    availability: 'Office hours',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'University lecturer explaining asymptotic complexity, graph algorithms, and dynamic programming.',
    isVerified: true,
    institutionName: 'University of Oxford',
  },
  {
    id: 't-dr-fatima-med',
    name: 'Dr. Fatima Zahra',
    title: 'Clinical Faculty & Medical Tutor',
    category: 'university',
    subject: 'Anatomy & Physiology',
    level: 'Medical Degree',
    language: 'Arabic / English',
    country: 'Egypt',
    rating: 4.9,
    reviewCount: 130,
    availability: 'Available this week',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'High-yield clinical case reviews, cardiovascular physiology, and international board exam prep.',
    isVerified: true,
    institutionName: 'Cairo University',
  },
  {
    id: 't-dr-layla-psych',
    name: 'Dr. Layla Mahmoud',
    title: 'Cognitive Psychology & Behavioral Science Lecturer',
    category: 'university',
    subject: 'Psychology',
    level: 'Undergraduate & Postgraduate',
    language: 'English / Arabic',
    country: 'Egypt / UK',
    rating: 4.9,
    reviewCount: 148,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Cognitive neuroscience, human behavior analysis, memory & developmental psychology, and research methodology.',
    isVerified: true,
    institutionName: 'Behavioral Sciences Institute / University of Oxford',
  },
  {
    id: 't-dr-hodan-dev',
    name: 'Dr. Hodan Osman',
    title: 'Senior Policy Analyst & Development Studies Specialist',
    category: 'university',
    subject: 'Development Studies & Public Policy',
    level: 'University & Professional',
    language: 'English / Somali / Arabic',
    country: 'Kenya / Somalia / UK',
    rating: 4.9,
    reviewCount: 164,
    availability: 'Available today',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Expert in Socio-Economic Research, Project Cycle Management (PCM), Enterprise Development, Governance, and Organizational Development.',
    isVerified: true,
    institutionName: 'Institute of Development Studies & Public Policy',
  },

  // Professional Skills
  {
    id: 't-clara-pm',
    name: 'Clara Lindqvist',
    title: 'Agile & Business Leadership Coach',
    category: 'skills',
    subject: 'Leadership & Business',
    level: 'Professional',
    language: 'English',
    country: 'Sweden',
    rating: 4.8,
    reviewCount: 92,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$20/hr',
    bio: 'Practical sprint planning, stakeholder communication, and Agile team delivery frameworks.',
    isVerified: true,
  },
  {
    id: 't-samir-data',
    name: 'Samir Bakri',
    title: 'Data & Analytics Specialist',
    category: 'skills',
    subject: 'Data & Analytics',
    level: 'Professional',
    language: 'English / Arabic',
    country: 'United Arab Emirates',
    rating: 4.9,
    reviewCount: 114,
    availability: 'Weekends',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Turning business data into actionable dashboards using SQL, Excel, and Power BI.',
    isVerified: true,
  },

  // Vocational & Technical Trades (Aviation, Maritime, Automotive)
  {
    id: 't-capt-hassan-aviation',
    name: 'Capt. Hassan Warsame',
    title: 'Chief Flight Instructor & Airport Operations Specialist',
    category: 'vocational',
    subject: 'Aviation & Flight Operations',
    level: 'Professional Certification',
    language: 'English / Somali',
    country: 'Somalia / UAE',
    rating: 4.9,
    reviewCount: 88,
    availability: 'Available today',
    pricingType: 'paid',
    priceDisplay: '$25/hr',
    bio: 'Commercial pilot and aviation ground instructor covering flight planning, aerodynamics, and ICAO airport operations.',
    isVerified: true,
    institutionName: 'Aviation Academy & Private Tuition',
  },
  {
    id: 't-eng-marcus-maritime',
    name: 'Eng. Marcus Lind',
    title: 'Senior Marine Engineer & Port Logistics Officer',
    category: 'vocational',
    subject: 'Maritime & Port Logistics',
    level: 'Technical Certification',
    language: 'English',
    country: 'Netherlands',
    rating: 4.8,
    reviewCount: 76,
    availability: 'Evenings & Weekends',
    pricingType: 'paid',
    priceDisplay: '$22/hr',
    bio: 'Harbor logistics, container cargo flows, and ship auxiliary propulsion systems specialist.',
    isVerified: true,
  },
  {
    id: 't-tariq-automotive',
    name: 'Tariq Al-Masri',
    title: 'Master Automotive Technician & EV Specialist',
    category: 'vocational',
    subject: 'Automotive Mechanics & EV Systems',
    level: 'Advanced Technical',
    language: 'Arabic / English',
    country: 'Jordan',
    rating: 4.9,
    reviewCount: 104,
    availability: 'Available this week',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Practical vehicle diagnostics, CAN-bus troubleshooting, and electric vehicle battery systems.',
    isVerified: true,
  },

  // Medical & Health Sciences
  {
    id: 't-dr-yasmin-med',
    name: 'Dr. Yasmin Jama',
    title: 'Consultant Physician & Clinical Tutor',
    category: 'medical',
    subject: 'Clinical Medicine Foundations',
    level: 'Clinical Prep',
    language: 'English / Somali',
    country: 'United Kingdom',
    rating: 5.0,
    reviewCount: 162,
    availability: 'Office hours',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Evidence-based internal medicine, OSCE patient examination techniques, and USMLE/PLAB preparation.',
    isVerified: true,
    institutionName: 'King’s College London / Private Tutoring',
  },
  {
    id: 't-sarah-nursing',
    name: 'Sarah O’Connor, RN',
    title: 'Critical Care Nurse Specialist & Clinical Educator',
    category: 'medical',
    subject: 'Nursing Principles & Patient Care',
    level: 'Foundation & Clinical',
    language: 'English',
    country: 'Ireland',
    rating: 4.9,
    reviewCount: 94,
    availability: 'Weekends',
    pricingType: 'paid',
    priceDisplay: '$16/hr',
    bio: 'Patient triage, medication administration safety, vital signs interpretation, and clinical nursing skills.',
    isVerified: true,
  },

  // Independent Private Tutors (Grades 1-12 & Adult Education)
  {
    id: 't-ind-halima-tutor',
    name: 'Halima Osman',
    title: 'Independent Private Tutor (Grades 1–12 & Adult Literacy)',
    category: 'school',
    subject: 'English & Mathematics Tutoring',
    level: 'Grades 1–8 & Adult Learners',
    language: 'Somali / English',
    country: 'Somalia',
    rating: 4.9,
    reviewCount: 125,
    availability: 'Daily sessions',
    pricingType: 'free',
    priceDisplay: 'Free',
    bio: 'Dedicated independent tutor offering patient 1-on-1 tuition for primary students, out-of-school youth, and adult learners.',
    isVerified: true,
    institutionName: 'Independent Private Tuition',
  },
];

export const GLOBAL_CLASSROOMS: GlobalClassroom[] = [
  {
    id: 'cls-101',
    code: 'MATH-101',
    title: 'Calculus & Linear Algebra',
    instructorName: 'Prof. Marcus Vance',
    institution: 'University of Oxford',
    subject: 'Mathematics',
    category: 'university',
    enrolledStudents: 142,
  },
  {
    id: 'cls-204',
    code: 'CS-204',
    title: 'Object-Oriented Programming (Python & Java)',
    instructorName: 'Amina Noor',
    institution: 'Global Tech Academy',
    subject: 'Computer Science',
    category: 'programming',
    enrolledStudents: 98,
  },
  {
    id: 'cls-305',
    code: 'BIO-305',
    title: 'Molecular Genetics & Cell Biology',
    instructorName: 'Dr. Fatima Zahra',
    institution: 'Cairo University',
    subject: 'Biology',
    category: 'university',
    enrolledStudents: 76,
  },
  {
    id: 'cls-410',
    code: 'ENG-410',
    title: 'Advanced Academic Writing & Research Methods',
    instructorName: 'Sarah Ahmed',
    institution: 'International Education Institute',
    subject: 'English & Research',
    category: 'school',
    enrolledStudents: 115,
  },
  {
    id: 'cls-8175243517',
    code: '8175243517',
    title: 'Physics & Applied Mechanics (Grade 12)',
    instructorName: 'Dr. David Chen',
    institution: 'International Science Academy',
    subject: 'Physics',
    category: 'school',
    enrolledStudents: 84,
    status: 'active',
  },
  {
    id: 'cls-av-101',
    code: 'AV-101',
    title: 'Aviation Fundamentals & Flight Principles',
    instructorName: 'Capt. Tariq Al-Mansoor',
    institution: 'International Aviation Flight Academy',
    subject: 'Aviation',
    category: 'vocational',
    enrolledStudents: 52,
    status: 'active',
  },
  {
    id: 'cls-mar-202',
    code: 'MAR-202',
    title: 'Marine Navigation & Ship Operations',
    instructorName: 'Capt. Mohamed Hersi',
    institution: 'Global Maritime & Ocean Institute',
    subject: 'Maritime & Shipping',
    category: 'vocational',
    enrolledStudents: 41,
    status: 'active',
  },
  {
    id: 'cls-auto-301',
    code: 'AUTO-301',
    title: 'Automotive Diagnostics & EV Systems',
    instructorName: 'Marcus Vance',
    institution: 'Modern Automotive Technical Center',
    subject: 'Automotive & Vehicles',
    category: 'vocational',
    enrolledStudents: 68,
    status: 'active',
  },
  {
    id: 'cls-turk-101',
    code: 'TURK-101',
    title: 'Turkish Language & TÖMER Preparation',
    instructorName: 'Emre Yılmaz',
    institution: 'Istanbul Language Academy',
    subject: 'Turkish Language',
    category: 'language',
    enrolledStudents: 64,
    status: 'active',
  },
  {
    id: 'cls-russ-101',
    code: 'RUSS-101',
    title: 'Russian Language & Conversation Studio',
    instructorName: 'Elena Petrova',
    institution: 'Eurasian Language Center',
    subject: 'Russian Language',
    category: 'language',
    enrolledStudents: 48,
    status: 'active',
  },
  {
    id: 'cls-urdu-101',
    code: 'URDU-101',
    title: 'Urdu Language & Classical Poetry',
    instructorName: 'Dr. Zainab Tariq',
    institution: 'National Urdu Academy',
    subject: 'Urdu Language',
    category: 'language',
    enrolledStudents: 55,
    status: 'active',
  },
  {
    id: 'cls-swa-101',
    code: 'SWA-101',
    title: 'Kiswahili Sanifu & East African Studies',
    instructorName: 'Juma Mwangi',
    institution: 'East African Language Institute',
    subject: 'Swahili Language',
    category: 'language',
    enrolledStudents: 72,
    status: 'active',
  },
  {
    id: 'cls-ger-101',
    code: 'GER-101',
    title: 'German Language & Grammar Studio (A1–B2)',
    instructorName: 'Lukas Weber',
    institution: 'Goethe Coaching Center',
    subject: 'German Language',
    category: 'language',
    enrolledStudents: 61,
    status: 'active',
  },
  {
    id: 'cls-gr8-math',
    code: 'GRADE8-MATH',
    title: 'Grade 8 Mathematics & Algebra Studio',
    instructorName: 'Bilal Osman',
    institution: 'SmartEducate Junior Academy',
    subject: 'Grade 8 Mathematics',
    category: 'school',
    enrolledStudents: 88,
    status: 'active',
  },
  {
    id: 'cls-econ-101',
    code: 'ECON-101',
    title: 'Principles of Economics (Micro & Macro)',
    instructorName: 'Prof. Farah Aden',
    institution: 'Global Economics Institute',
    subject: 'Economics',
    category: 'skills',
    enrolledStudents: 95,
    status: 'active',
  },
  {
    id: 'cls-acct-201',
    code: 'ACCT-201',
    title: 'Financial Accounting & Bookkeeping Studio',
    instructorName: 'Prof. Farah Aden',
    institution: 'Business & Finance Academy',
    subject: 'Accounting',
    category: 'skills',
    enrolledStudents: 82,
    status: 'active',
  },
  {
    id: 'cls-med-301',
    code: 'MED-301',
    title: 'Clinical Medicine & Human Anatomy Foundations',
    instructorName: 'Dr. Yasmin Jama',
    institution: 'College of Health Sciences',
    subject: 'Medicine',
    category: 'skills',
    enrolledStudents: 110,
    status: 'active',
  },
  {
    id: 'cls-psych-101',
    code: 'PSYCH-101',
    title: 'Introduction to Psychology & Human Behavior',
    instructorName: 'Dr. Fatima Zahra',
    institution: 'Behavioral Sciences Institute',
    subject: 'Psychology',
    category: 'university',
    enrolledStudents: 74,
    status: 'active',
  },
  {
    id: 'cls-aero-401',
    code: 'AERO-401',
    title: 'Aircraft Engineering & Avionics Systems',
    instructorName: 'Eng. Khalid Al-Mansoor',
    institution: 'International Aviation Academy',
    subject: 'Aircraft Engineering',
    category: 'vocational',
    enrolledStudents: 46,
    status: 'active',
  },
  {
    id: 'cls-dev-401',
    code: 'DEV-401',
    title: 'Development Studies & Public Policy',
    instructorName: 'Dr. Hodan Osman',
    institution: 'Institute of Development Studies',
    subject: 'Development Studies & Public Policy',
    category: 'university',
    enrolledStudents: 38,
    status: 'active',
  },
];

export const SAMPLE_CLASSROOM_STUDENTS: ClassroomStudentItem[] = [
  { id: 'st-1', name: 'Nimco Nuura', email: 'nimco.nuura@university.edu', enrolledDate: '2 days ago', status: 'active' },
  { id: 'st-2', name: 'Ahmed Farah', email: 'ahmed.f@university.edu', enrolledDate: '1 week ago', status: 'active' },
  { id: 'st-3', name: 'Lucas Silva', email: 'lucas.s@usp.br', enrolledDate: '3 days ago', status: 'active' },
  { id: 'st-4', name: 'Elena Rostova', email: 'elena.r@oxford.ac.uk', enrolledDate: '5 days ago', status: 'active' },
  { id: 'st-5', name: 'Khadija Ali', email: 'khadija.ali@snu.edu.so', enrolledDate: '1 week ago', status: 'active' },
  { id: 'st-6', name: 'Chen Wei', email: 'chen.wei@tsinghua.edu.cn', enrolledDate: '2 weeks ago', status: 'active' },
];

export const INITIAL_TEACHER_CLASSROOMS: GlobalClassroom[] = [
  {
    id: 'cls-101',
    code: 'MATH-101',
    title: 'Calculus & Linear Algebra',
    instructorName: 'Prof. Marcus Vance',
    institution: 'University of Oxford',
    subject: 'Mathematics',
    category: 'university',
    enrolledStudents: 142,
  },
  {
    id: 'cls-204',
    code: 'CS-204',
    title: 'Object-Oriented Programming (Python & Java)',
    instructorName: 'Prof. Marcus Vance',
    institution: 'Global Tech Academy',
    subject: 'Computer Science',
    category: 'programming',
    enrolledStudents: 98,
  },
];

/**
 * Built-in Tutor Knowledge Base
 * Generates pedagogical, friendly step-by-step guidance
 * rather than simply dumping raw answers.
 */
export function generateTutorExplanation(
  question: string,
  subject: string,
  mode: 'explanation' | 'simpler' | 'examples' | 'practice' = 'explanation'
): HomeworkHelpRequest {
  const cleanQ = question.trim();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (mode === 'simpler') {
    return {
      id: 'hw_' + Date.now().toString(36),
      question: cleanQ,
      subject: subject || 'General Study',
      mode: 'simpler',
      timestamp: timeStr,
      answerSummary: `In plain, simple language: Here is how to understand "${cleanQ.slice(0, 40)}${cleanQ.length > 40 ? '...' : ''}" without confusing technical terms.`,
      explanationSteps: [
        'Think of this like an everyday real-world situation you already know.',
        'The main rule is simple: when one part increases or changes, the other reacts following a clear pattern.',
        'To solve it, you only need to take two easy steps: first find what you have, then apply the basic rule.',
        'That is all! You now have the right answer without unnecessary complications.',
      ],
      keyConcept: 'Intuitive Understanding: You do not need complicated formulas to grasp the core idea.',
      practiceTip: 'Try explaining this concept to a friend or classmate in your own words.',
    };
  }

  if (mode === 'examples') {
    return {
      id: 'hw_' + Date.now().toString(36),
      question: cleanQ,
      subject: subject || 'General Study',
      mode: 'examples',
      timestamp: timeStr,
      answerSummary: `Here are 2 practical, concrete examples demonstrating how "${cleanQ.slice(0, 40)}${cleanQ.length > 40 ? '...' : ''}" works in practice:`,
      explanationSteps: [
        'Example 1 (Foundational Case): Consider a baseline scenario with small, straightforward numbers. Applying the rule shows exactly where each value goes and why the outcome holds true.',
        'Example 2 (Applied Real-World Case): In professional or exam scenarios, variables may be presented with different labels, but substituting them into the same framework delivers the exact same verified result.',
        'Comparison & Takeaway: Notice how both examples rely on the exact same underlying mechanism.',
      ],
      keyConcept: 'Pattern Recognition: Seeing concrete examples trains your mind to spot identical patterns on upcoming tests.',
      practiceTip: 'Create a third example of your own using numbers or scenarios from your textbook.',
    };
  }

  if (mode === 'practice') {
    return {
      id: 'hw_' + Date.now().toString(36),
      question: cleanQ,
      subject: subject || 'General Study',
      mode: 'practice',
      timestamp: timeStr,
      answerSummary: `Interactive Practice Exercise based on "${cleanQ.slice(0, 40)}${cleanQ.length > 40 ? '...' : ''}":`,
      explanationSteps: [
        'Checkpoint Question 1: What is the first assumption or variable you must isolate before solving?',
        'Hint 1: Look at the given values and remember the fundamental definition in Chapter 1.',
        'Checkpoint Question 2: If the primary variable doubles, how will the final result change?',
        'Self-Check Solution: Verify that your units match and your final calculation is consistent with boundary rules.',
      ],
      keyConcept: 'Active Recall: Testing yourself through guided checkpoints increases long-term retention by over 70%.',
      practiceTip: 'Write down your answers on paper before checking the full solution steps.',
    };
  }

  return {
    id: 'hw_' + Date.now().toString(36),
    question: cleanQ,
    subject: subject || 'General Study',
    mode: 'explanation',
    timestamp: timeStr,
    answerSummary: `Let's break down "${cleanQ.slice(0, 45)}${cleanQ.length > 45 ? '...' : ''}" step by step so you master the underlying concept.`,
    explanationSteps: [
      'Identify the Core Question: Pinpoint exactly what variables, terms, or historical contexts are being analyzed.',
      'Apply the Governing Principle: Connect the problem to the standard formula, theorem, or grammatical rule.',
      'Work Through the Solution: Substitute the given values or construct logical supporting evidence step by step.',
      'Verify Your Result: Check your answer against boundary conditions or logical consistency.',
    ],
    keyConcept: 'Systematic Reasoning: Approaching academic tasks methodically ensures you can tackle any similar problem in future exams.',
    practiceTip: 'Try solving a variation with different numbers or rephrasing the conclusion in your own words to solidify your understanding.',
  };
}

