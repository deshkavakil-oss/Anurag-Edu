import React, { useState } from 'react';
import { CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES } from '../data/educationSystem';
import { INDIAN_EXAMS } from '../data/exams';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
}

export function AuthPage({ initialMode = 'login', onSuccess }: AuthPageProps) {
  const {
    user,
    isVerified,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    resendVerification,
    refreshVerificationStatus,
    sendResetEmail,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Login / Forgot fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration 11 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [city, setCity] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [selectedExam, setSelectedExam] = useState('SSC CHSL');
  const [preferredLanguage, setPreferredLanguage] = useState<'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual'>('Bilingual');

  const formatAuthError = (err: unknown): string => {
    const code = (err as { code?: string; message?: string })?.code || '';
    const msg = (err as { message?: string })?.message || 'Authentication failed.';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication > Sign-in method). Please enable Email/Password provider there, or use Google Sign-In right now.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered. Please sign in or reset your password.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Incorrect email or password. Please verify and try again.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.';
    }
    return msg;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !city.trim()) {
      setError('Please complete all required student registration fields.');
      return;
    }
    setBusy(true);
    try {
      const res = await registerWithEmail({
        fullName,
        email,
        password,
        state,
        city,
        educationLevel,
        institution,
        course,
        selectedExam,
        preferredLanguage,
      });
      setInfoMsg(res.smtpStatus);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      await loginWithEmail(loginEmail, loginPassword);
      onSuccess();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      await sendResetEmail(loginEmail);
      setInfoMsg('Password reset link sent to your email address. Check your inbox and spam folder.');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  // Unverified user gate
  if (user && !isVerified) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-[#1D4ED8]" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Verify Your Email Address
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A real verification link has been sent to <strong>{user.email}</strong>. Protected personal learning tools (AI Student Teacher, Question History, Mock Tests, Notes, and File Library) unlock immediately once your email is verified.
          </p>
          {infoMsg && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
              {infoMsg}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200">
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                const verified = await refreshVerificationStatus();
                setBusy(false);
                if (verified) {
                  onSuccess();
                } else {
                  setInfoMsg('Still awaiting verification. Click the link in your email inbox, then press Check Verification again.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              I Have Verified — Continue
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await resendVerification();
                  setInfoMsg('Verification email resent! Please check your inbox and spam folder.');
                } catch (err) {
                  setError(formatAuthError(err));
                } finally {
                  setBusy(false);
                }
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Resend Verification Email
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official support: anurag706879@gmail.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              ANURAG EDUCATION CENTER — Student Portal
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              LEARN • RESEARCH • PRACTICE • SUCCEED · Official helpdesk: anurag706879@gmail.com
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setInfoMsg(''); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setInfoMsg(''); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'register' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              New Registration
            </button>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
            Continue with Google (Instant Verified Student Account)
          </button>
        </div>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="px-3 text-xs text-slate-500">or use registered email</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        {infoMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs font-medium text-[#1D4ED8] hover:underline"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
              >
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Send Password Reset Link
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                1. Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                2. Email Address * (Verification link will be sent)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                3. Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                4. Confirm Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                5. State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                6. City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Prayagraj"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                7. Education Level *
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="School (Class 1–10)">School (Class 1–10)</option>
                <option value="Higher Secondary (Class 11–12)">Higher Secondary (Class 11–12)</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Law / Judiciary Aspirant">Law / Judiciary Aspirant</option>
                <option value="Competitive Exam Aspirant">Competitive Exam Aspirant</option>
                <option value="Researcher / Professional">Researcher / Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                8. School or College
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g., University of Delhi"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                9. Course / Stream
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., BA LLB, BSc Maths, Class 12 PCM"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                10. Selected Examination *
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {INDIAN_EXAMS.map((ex) => (
                  <option key={ex.id} value={ex.name}>{ex.name}</option>
                ))}
                <option value="Judiciary (PCS-J) / AIBE">Judiciary (PCS-J) / AIBE</option>
                <option value="Board / University Exams">Board / University Exams</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                11. Preferred Language *
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) =>
                  setPreferredLanguage(e.target.value as 'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual')
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Simple Hindi">Simple Hindi (सरल हिन्दी)</option>
                <option value="Bilingual">Bilingual (English + Hindi)</option>
              </select>
            </div>
            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-6 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
              >
                {busy ? 'Creating Student Account...' : 'Create Student Account & Send Verification Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
