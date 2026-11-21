import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

export interface StudentProfileData {
  userId: string;
  fullName: string;
  photoUrl?: string;
  state: string;
  city: string;
  educationLevel: string;
  institution?: string;
  classOrSemester?: string;
  course?: string;
  selectedExam: string;
  preferredLanguage: 'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual';
  careerGoals?: string;
  subjects?: string[];
  xp: number;
  studyStreak: number;
  badges?: string[];
  customSyllabus?: string;
  updatedAt?: unknown;
}

export interface RegistrationPayload {
  fullName: string;
  email: string;
  password: string;
  state: string;
  city: string;
  educationLevel: string;
  institution: string;
  course: string;
  selectedExam: string;
  preferredLanguage: 'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual';
}

interface AuthContextValue {
  user: User | null;
  profile: StudentProfileData | null;
  loading: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  registerWithEmail: (payload: RegistrationPayload) => Promise<{ verificationSent: boolean; smtpStatus: string }>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  sendResetEmail: (email: string) => Promise<void>;
  saveProfile: (updates: Partial<StudentProfileData>) => Promise<void>;
  awardXp: (points: number, badge?: string) => Promise<void>;
}

const ADMIN_EMAILS = ['deshkavakil@gmail.com', 'anurag706879@gmail.com'];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setIsAdminDoc(false);
        setLoading(false);
        return;
      }

      // Check admin collection marker safely
      try {
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        setIsAdminDoc(adminSnap.exists());
      } catch {
        setIsAdminDoc(false);
      }

      // Ensure user + profile exist for Google Sign-In users
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'AEC Student',
            email: firebaseUser.email || '',
            role: 'student',
            emailVerified: firebaseUser.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        const profileRef = doc(db, 'student_profiles', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            userId: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'AEC Student',
            photoUrl: firebaseUser.photoURL || '',
            state: 'Uttar Pradesh',
            city: 'Lucknow',
            educationLevel: 'Undergraduate',
            institution: '',
            course: '',
            selectedExam: 'SSC CHSL',
            preferredLanguage: 'Bilingual',
            subjects: ['History', 'Geography', 'Mathematics', 'Reasoning', 'Indian Polity', 'English'],
            xp: 50,
            studyStreak: 1,
            badges: ['Verified AEC Member'],
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Initial profile sync warning:', err);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'student_profiles', user.uid);
    const unsub = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as StudentProfileData);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `student_profiles/${user.uid}`);
      }
    );
    return () => unsub();
  }, [user]);

  const registerWithEmail = async (payload: RegistrationPayload) => {
    const cred = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
    await updateProfile(cred.user, { displayName: payload.fullName.trim() });

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      role: 'student',
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'student_profiles', cred.user.uid), {
      userId: cred.user.uid,
      fullName: payload.fullName.trim(),
      state: payload.state,
      city: payload.city,
      educationLevel: payload.educationLevel,
      institution: payload.institution,
      course: payload.course,
      selectedExam: payload.selectedExam,
      preferredLanguage: payload.preferredLanguage,
      subjects: ['History', 'Geography', 'Mathematics', 'Reasoning', 'Indian Polity', 'English'],
      xp: 25,
      studyStreak: 1,
      badges: ['New AEC Scholar'],
      updatedAt: serverTimestamp(),
    });

    await sendEmailVerification(cred.user);

    let smtpStatus = 'Firebase verification email sent. Check your inbox and spam folder.';
    try {
      const resp = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.email.trim(),
          subject: 'Welcome to ANURAG EDUCATION CENTER (AEC) — Confirm Your Email',
          text: `Namaste ${payload.fullName},\n\nWelcome to ANURAG EDUCATION CENTER (AEC).\nPlease click the Firebase verification link sent to your email address to unlock your AI Teacher, Mock Tests, and Study Workspace.\n\nTarget Exam: ${payload.selectedExam}\nOfficial Support: anurag706879@gmail.com\nLEARN • RESEARCH • PRACTICE • SUCCEED`,
        }),
      });
      const emailData = (await resp.json()) as { sent?: boolean; message?: string };
      if (emailData.sent) {
        smtpStatus = 'Both Firebase verification and AEC welcome email were delivered.';
      } else if (emailData.message) {
        smtpStatus = `Firebase verification email sent. Branded SMTP note: ${emailData.message}`;
      }
    } catch {
      // Keep Firebase verification status truthful
    }

    return { verificationSent: true, smtpStatus };
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshVerificationStatus = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updatedUser = auth.currentUser;
    setUser({ ...updatedUser } as User);
    if (updatedUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'users', updatedUser.uid), {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Ignore if rule rejects unchanged
      }
    }
    return updatedUser.emailVerified;
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const saveProfile = async (updates: Partial<StudentProfileData>) => {
    if (!user) throw new Error('Must be signed in');
    const profileRef = doc(db, 'student_profiles', user.uid);
    try {
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_profiles/${user.uid}`);
    }
  };

  const awardXp = async (points: number, badge?: string) => {
    if (!user || !user.emailVerified || !profile) return;
    const nextXp = (profile.xp || 0) + points;
    const existingBadges = Array.isArray(profile.badges) ? profile.badges : [];
    const nextBadges =
      badge && !existingBadges.includes(badge) ? [...existingBadges, badge].slice(0, 50) : existingBadges;
    try {
      await updateDoc(doc(db, 'student_profiles', user.uid), {
        xp: nextXp,
        badges: nextBadges,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Non-critical XP update
    }
  };

  const isVerified = Boolean(user?.emailVerified);
  const isAdmin = Boolean(
    isVerified &&
      (isAdminDoc || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isVerified,
        isAdmin,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        resendVerification,
        refreshVerificationStatus,
        sendResetEmail,
        saveProfile,
        awardXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
