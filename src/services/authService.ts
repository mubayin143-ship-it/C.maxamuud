import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserRole } from '../types/student';

export interface UserAccountProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  viewMode: 'student' | 'teacher';
  createdAt: string;
  updatedAt: string;
}

/**
 * Saves a validated user profile directly to Firestore (/users/{profile.id}).
 * Ensures identity integrity (caller UID matches document ID) and enforces
 * schema requirements defined in Firestore rules.
 */
export async function saveUserProfile(profile: UserAccountProfile): Promise<UserAccountProfile> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== profile.id) {
    throw new Error('Identity integrity violation: caller UID does not match profile ID.');
  }

  if (!profile.email || !profile.role) {
    throw new Error('Invalid profile data: email and authoritative role are required.');
  }

  const validRoles: UserRole[] = ['student', 'teacher', 'lecturer'];
  if (!validRoles.includes(profile.role)) {
    throw new Error(`Invalid role '${profile.role}'. Must be student, teacher, or lecturer.`);
  }

  const sanitizedProfile: UserAccountProfile = {
    id: profile.id,
    email: profile.email.trim(),
    fullName: profile.fullName.trim() || (profile.role === 'teacher' || profile.role === 'lecturer' ? 'Instructor' : 'Student'),
    role: profile.role,
    viewMode: profile.viewMode || (profile.role === 'teacher' || profile.role === 'lecturer' ? 'teacher' : 'student'),
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userDocRef = doc(db, 'users', sanitizedProfile.id);
  try {
    await setDoc(userDocRef, sanitizedProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${sanitizedProfile.id}`);
  }

  return sanitizedProfile;
}

/**
 * Creates and persists the user's role and initial profile data to Firestore
 * upon successful registration.
 *
 * NOTE: Server-side Firestore security rules verify Teacher privileges for
 * protected operations (such as creating classrooms or uploading materials)
 * by inspecting the authoritative role on the caller's /users/{userId} document,
 * while preventing clients from modifying their role via update rules.
 */
export async function saveUserProfileOnRegistration(
  user: FirebaseUser,
  fullName: string,
  role: UserRole,
  options?: { viewMode?: 'student' | 'teacher' }
): Promise<UserAccountProfile> {
  const isTeacher = role === 'teacher' || role === 'lecturer';
  const profile: UserAccountProfile = {
    id: user.uid,
    email: user.email || '',
    fullName: fullName.trim() || (isTeacher ? 'Professor / Instructor' : 'Student Learner'),
    role,
    viewMode: options?.viewMode || (isTeacher ? 'teacher' : 'student'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveUserProfile(profile);
}

/**
 * Server-side verification helper: Queries Firestore directly to retrieve
 * the authoritative user record and verifies whether the caller possesses
 * genuine Teacher privileges in the database, rather than trusting client state.
 */
export async function verifyTeacherPrivilegesServerSide(uid: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return false;
    }
    const data = snap.data() as UserAccountProfile;
    return data.role === 'teacher' || data.role === 'lecturer';
  } catch (err) {
    console.error('Error verifying teacher privileges server-side:', err);
    return false;
  }
}

export const authService = {
  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  saveUserProfile,
  saveUserProfileOnRegistration,
  verifyTeacherPrivilegesServerSide,

  // Register with email and password
  async registerWithEmail(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<UserAccountProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    // Save profile and role to Firestore upon successful registration
    return saveUserProfileOnRegistration(user, fullName, role);
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<UserAccountProfile | null> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    let profile = await this.getUserProfile(user.uid, user.email || email.trim());
    if (!profile) {
      // First-time profile creation if not yet found in Firestore
      profile = await saveUserProfileOnRegistration(user, user.displayName || 'Learner', 'student');
    }

    return profile;
  },

  // Sign in with Google (pre-configured provider)
  async signInWithGoogle(defaultRole: UserRole = 'student'): Promise<UserAccountProfile> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const existing = await this.getUserProfile(user.uid, user.email || '');
    if (existing) {
      return existing;
    }

    // First-time profile creation for Google user
    return saveUserProfileOnRegistration(user, user.displayName || 'Google User', defaultRole);
  },

  // Send password reset email
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Fetch user profile from Firestore
  async getUserProfile(uid: string, fallbackEmail: string = ''): Promise<UserAccountProfile | null> {
    const userDocRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserAccountProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  // Update view mode (teachers previewing student view)
  async updateViewMode(uid: string, viewMode: 'student' | 'teacher'): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        viewMode,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  },
};
