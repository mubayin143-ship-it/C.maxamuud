/**
 * SmartEducate Canonical Storage Foundation
 * Single source of truth for localStorage persistence.
 */

import { createInitialStudentProfile, StudentProfile } from '../types/student';

/**
 * The single canonical storage key for the student profile across the entire application.
 * Competing keys are strictly prohibited.
 */
export const CANONICAL_STUDENT_STORAGE_KEY = 'smarteducate_student_profile';

/**
 * Loads student profile from localStorage with schema validation and fallback.
 */
export const loadCanonicalStudentProfile = (): StudentProfile => {
  if (typeof window === 'undefined') {
    return createInitialStudentProfile();
  }

  try {
    const raw = localStorage.getItem(CANONICAL_STUDENT_STORAGE_KEY);
    if (!raw) {
      return createInitialStudentProfile();
    }
    const parsed = JSON.parse(raw);
    
    // Ensure all required sub-objects exist even if loaded from older versions
    const initial = createInitialStudentProfile();
    const primaryRole = parsed.actualRole || parsed.role || 'student';
    return {
      ...initial,
      ...parsed,
      role: primaryRole,
      actualRole: primaryRole,
      viewMode: parsed.viewMode || (primaryRole === 'lecturer' || primaryRole === 'teacher' ? 'teacher' : 'student'),
      availableRoles: Array.isArray(parsed.availableRoles) && parsed.availableRoles.length > 0
        ? parsed.availableRoles
        : (primaryRole === 'lecturer' || primaryRole === 'teacher' ? ['teacher', 'student'] : ['student']),
      personalInfo: { ...initial.personalInfo, ...(parsed.personalInfo || {}) },
      universityInfo: { ...initial.universityInfo, ...(parsed.universityInfo || {}) },
      academicProfile: { ...initial.academicProfile, ...(parsed.academicProfile || {}) },
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
    };
  } catch (error) {
    console.error('Failed to parse canonical student profile from storage:', error);
    return createInitialStudentProfile();
  }
};

/**
 * Saves student profile to localStorage.
 */
export const saveCanonicalStudentProfile = (profile: StudentProfile): void => {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify({
      ...profile,
      lastUpdated: new Date().toISOString(),
    });
    localStorage.setItem(CANONICAL_STUDENT_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save canonical student profile to storage:', error);
  }
};

/**
 * Resets the student profile to canonical initial state and syncs to storage.
 */
export const resetCanonicalStudentProfile = (): StudentProfile => {
  const initial = createInitialStudentProfile();
  saveCanonicalStudentProfile(initial);
  return initial;
};

/**
 * Canonical enrolled classrooms storage key prefix.
 * User-scoped to prevent account collision.
 */
export const CANONICAL_ENROLLED_CLASSROOMS_KEY = 'smarteducate_enrolled_classrooms';

export const loadCanonicalEnrolledClassrooms = (userId?: string): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${CANONICAL_ENROLLED_CLASSROOMS_KEY}_${userId}` : CANONICAL_ENROLLED_CLASSROOMS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load enrolled classrooms from storage:', e);
    return [];
  }
};

export const saveCanonicalEnrolledClassrooms = (classrooms: any[], userId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${CANONICAL_ENROLLED_CLASSROOMS_KEY}_${userId}` : CANONICAL_ENROLLED_CLASSROOMS_KEY;
    localStorage.setItem(key, JSON.stringify(classrooms));
  } catch (e) {
    console.error('Failed to save enrolled classrooms to storage:', e);
  }
};
