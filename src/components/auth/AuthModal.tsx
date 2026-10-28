import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService, UserAccountProfile } from '../../services/authService';
import { UserRole } from '../../types/student';
import { useI18n } from '../../i18n/I18nContext';
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserAccountProfile) => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const { t, isRTL } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessNotice(null);
    }
  }, [isOpen, initialMode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsLoading(false);
  };

  const mapFirebaseError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled in your Firebase project console yet. Please enable Email/Password under Authentication > Sign-in method in Firebase Console, or use Google sign-in.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in instead.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please verify your credentials.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completion.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      default:
        return err?.message || 'Authentication error. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await authService.sendPasswordReset(email.trim());
        setSuccessNotice('Password reset email sent! Please check your inbox.');
      } catch (err: any) {
        setErrorMsg(mapFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your password confirmation.');
        return;
      }

      setIsLoading(true);
      try {
        const profile = await authService.registerWithEmail(
          email.trim(),
          password,
          fullName.trim() || (selectedRole === 'teacher' ? 'Instructor' : 'Student'),
          selectedRole
        );
        resetForm();
        onSuccess(profile);
        onClose();
      } catch (err: any) {
        setErrorMsg(mapFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign in mode
      setIsLoading(true);
      try {
        const profile = await authService.signInWithEmail(email.trim(), password);
        if (profile) {
          resetForm();
          onSuccess(profile);
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(mapFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const profile = await authService.signInWithGoogle(selectedRole);
      resetForm();
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={
        mode === 'signup'
          ? 'Create SmartEducate Account'
          : mode === 'forgot'
          ? 'Reset Your Password'
          : 'Sign In to SmartEducate'
      }
      description={
        mode === 'signup'
          ? 'Register as a Student or Teacher with persistent cloud synchronization'
          : mode === 'forgot'
          ? 'Enter your email to receive a password reset link'
          : 'Access your coursework, lectures, and classroom discussions'
      }
    >
      <div className="space-y-4 text-start">
        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Success notification */}
        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{successNotice}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Sign-up Full Name */}
          {mode === 'signup' && (
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Marcus Vance or Nimco Nuura"
              leftIcon={<User className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              required
            />
          )}

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@university.edu"
            leftIcon={<Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            required
            autoFocus
          />

          {/* Password (for signin and signup) */}
          {mode !== 'forgot' && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              required
            />
          )}

          {/* Confirm Password (for signup) */}
          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              leftIcon={<Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              required
            />
          )}

          {/* Role selection on Signup */}
          {mode === 'signup' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Type (Permanent Role)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedRole === 'student'
                      ? 'border-[#7C3AED] dark:border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedRole === 'teacher'
                      ? 'border-[#7C3AED] dark:border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Teacher / Instructor</span>
                </button>
              </div>
            </div>
          )}

          {/* Forgot password link in signin mode */}
          {mode === 'signin' && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('forgot');
                }}
                className="text-xs font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : mode === 'signup' ? (
              <span className="flex items-center gap-2">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            ) : mode === 'forgot' ? (
              <span>Send Password Reset</span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Alternative Google Sign In */}
        {mode !== 'forgot' && (
          <>
            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* Mode Switch Footers */}
        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signup');
                }}
                className="font-bold text-[#7C3AED] dark:text-purple-400 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signin');
                }}
                className="font-bold text-[#7C3AED] dark:text-purple-400 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signin');
                }}
                className="font-bold text-[#7C3AED] dark:text-purple-400 hover:underline cursor-pointer"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
