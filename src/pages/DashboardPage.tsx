import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Flame,
  FolderOpen,
  GraduationCap,
  LineChart,
  Share2,
  Shield,
  Target,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES } from '../data/educationSystem';
import { INDIAN_EXAMS } from '../data/exams';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface QuizAttemptRow {
  id: string;
  examId: string;
  subject: string;
  testTitle: string;
  accuracy: number;
  marksObtained: number;
  maxMarks: number;
  timeTakenSeconds: number;
  weakTopics?: string[];
}

interface HistoryRow {
  id: string;
  question: string;
  subject: string;
  exam: string;
  status: string;
}

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  category: string;
  read: boolean;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, profile, isVerified, isAdmin, saveProfile } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttemptRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);
  const [blogsCount, setBlogsCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [announcement, setAnnouncement] = useState<{ title: string; body: string } | null>(null);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editClassSem, setEditClassSem] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editExam, setEditExam] = useState('');
  const [editLanguage, setEditLanguage] = useState<'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual'>('Bilingual');
  const [editGoals, setEditGoals] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Parent Share state
  const [parentShareEnabled, setParentShareEnabled] = useState(false);
  const [parentShareCode, setParentShareCode] = useState('');
  const [parentSaving, setParentSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName || '');
      setEditState(profile.state || 'Uttar Pradesh');
      setEditCity(profile.city || '');
      setEditInstitution(profile.institution || '');
      setEditClassSem(profile.classOrSemester || '');
      setEditCourse(profile.course || '');
      setEditExam(profile.selectedExam || 'SSC CHSL');
      setEditLanguage(profile.preferredLanguage || 'Bilingual');
      setEditGoals(profile.careerGoals || '');
    }
  }, [profile]);

  useEffect(() => {
    getDoc(doc(db, 'admin_settings', 'announcements'))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as { announcementTitle?: string; announcementBody?: string };
          if (d.announcementTitle) {
            setAnnouncement({ title: d.announcementTitle, body: d.announcementBody || '' });
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !isVerified) return;

    const shareCode = `AEC_${user.uid.slice(0, 12)}`;
    setParentShareCode(shareCode);
    getDoc(doc(db, 'parent_progress', shareCode))
      .then((snap) => {
        if (snap.exists()) {
          setParentShareEnabled(Boolean((snap.data() as { enabled?: boolean }).enabled));
        }
      })
      .catch(() => {});

    const getTs = (d: unknown) => {
      const ts = d as { seconds?: number } | undefined;
      return ts?.seconds ?? 0;
    };

    const unsubAttempts = onSnapshot(
      query(collection(db, 'quiz_attempts'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<QuizAttemptRow, 'id'> & { createdAt?: unknown }) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setAttempts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'quiz_attempts')
    );

    const unsubHistory = onSnapshot(
      query(collection(db, 'question_history'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryRow, 'id'> & { createdAt?: unknown }) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setHistory(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'question_history')
    );

    const unsubNotes = onSnapshot(
      query(collection(db, 'notes'), where('userId', '==', user.uid)),
      (snap) => setNotesCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.LIST, 'notes')
    );

    const unsubFiles = onSnapshot(
      query(collection(db, 'uploaded_files'), where('userId', '==', user.uid)),
      (snap) => setFilesCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.LIST, 'uploaded_files')
    );

    const unsubBlogs = onSnapshot(
      query(collection(db, 'blogs'), where('authorId', '==', user.uid)),
      (snap) => setBlogsCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.LIST, 'blogs')
    );

    const unsubNotif = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationRow, 'id'> & { createdAt?: unknown }) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubAttempts();
      unsubHistory();
      unsubNotes();
      unsubFiles();
      unsubBlogs();
      unsubNotif();
    };
  }, [user, isVerified]);

  if (!user || !isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Verified Student Account Required
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in and verify your email address to access your personal dashboard, saved AI answers, mock test analytics, notes, and file library.
        </p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]"
        >
          Open Student Login / Registration
        </button>
      </div>
    );
  }

  // Real calculations from actual Firestore attempts (never invented scores)
  const avgAccuracy =
    attempts.length > 0
      ? Math.round((attempts.reduce((acc, a) => acc + a.accuracy, 0) / attempts.length) * 10) / 10
      : 0;
  const totalStudyMinutes = Math.round(
    attempts.reduce((acc, a) => acc + (a.timeTakenSeconds || 0), 0) / 60
  );

  // Aggregate real weak topics from quiz_attempts
  const weakTopicFreq = new Map<string, number>();
  for (const att of attempts) {
    for (const wt of att.weakTopics || []) {
      weakTopicFreq.set(wt, (weakTopicFreq.get(wt) || 0) + 1);
    }
  }
  const detectedWeakTopics = Array.from(weakTopicFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile({
      fullName: editFullName,
      state: editState,
      city: editCity,
      institution: editInstitution,
      classOrSemester: editClassSem,
      course: editCourse,
      selectedExam: editExam,
      preferredLanguage: editLanguage,
      careerGoals: editGoals,
    });
    setSaveMessage('Profile updated and synced to your account.');
    setEditing(false);
  };

  const toggleParentShare = async () => {
    if (!user || !profile) return;
    setParentSaving(true);
    const nextEnabled = !parentShareEnabled;
    const shareCode = `AEC_${user.uid.slice(0, 12)}`;
    try {
      await setDoc(doc(db, 'parent_progress', shareCode), {
        userId: user.uid,
        studentName: profile.fullName,
        selectedExam: profile.selectedExam,
        studyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
        testsTaken: attempts.length,
        averageAccuracy: avgAccuracy,
        weakTopics: detectedWeakTopics.map(([topic]) => topic),
        enabled: nextEnabled,
        updatedAt: serverTimestamp(),
      });
      setParentShareEnabled(nextEnabled);
      setParentShareCode(shareCode);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parent_progress/${shareCode}`);
    } finally {
      setParentSaving(false);
    }
  };

  const quickNavCards: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; metric: string; route: AppRoute }> = [
    { icon: Bot, label: 'AI Student Teacher', metric: `${history.length} saved Q&As`, route: 'ai-teacher' },
    { icon: Target, label: 'Gov Exam & SSC CHSL', metric: profile?.selectedExam || 'SSC CHSL', route: 'ssc-chsl' },
    { icon: LineChart, label: 'Mock Tests & Analytics', metric: `${attempts.length} completed`, route: 'mock-tests' },
    { icon: BookOpen, label: 'My Notes & Flashcards', metric: `${notesCount} saved notes`, route: 'notes' },
    { icon: FolderOpen, label: 'My Digital File Library', metric: `${filesCount} files`, route: 'files' },
    { icon: Award, label: 'My Blogs & Legal Studio', metric: `${blogsCount} articles`, route: 'blog-generator' },
    { icon: Calendar, label: 'Smart Study Planner', metric: '30/60/90-day plans', route: 'study-planner' },
    { icon: GraduationCap, label: 'Research & Scholarships', metric: 'Verified portals', route: 'research' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Official Announcement Banner from Admin if present */}
      {announcement && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <Bell className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{announcement.body}</p>
          </div>
        </div>
      )}

      {/* Welcome & Student Profile Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <UserCheck className="w-4 h-4" />
            <span>Verified Student Account · {user.email}</span>
            {isAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button onClick={() => onNavigate('admin')} className="text-[#1D4ED8] dark:text-blue-400 underline">
                  Admin Panel
                </button>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
            Welcome back, {profile?.fullName || user.displayName || 'Scholar'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Target: {profile?.selectedExam || 'SSC CHSL'} · {profile?.educationLevel || 'Undergraduate'} · {profile?.city || 'India'}, {profile?.state || ''} · Language: {profile?.preferredLanguage || 'Bilingual'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Study XP</p>
            <p className="text-xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">{profile?.xp ?? 0}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Streak</p>
            <p className="text-xl font-bold tabular-nums text-[#0B1F3A] dark:text-white inline-flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-500" />
              {profile?.studyStreak ?? 1}d
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Test Accuracy</p>
            <p className="text-xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">
              {attempts.length > 0 ? `${avgAccuracy}%` : 'No tests yet'}
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            {editing ? 'Close Profile Editor' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Profile Editor */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Update Student Profile</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
            <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">State</label>
            <select value={editState} onChange={(e) => setEditState(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City</label>
            <input value={editCity} onChange={(e) => setEditCity(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">School / College / University</label>
            <input value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Class / Semester</label>
            <input value={editClassSem} onChange={(e) => setEditClassSem(e.target.value)} placeholder="e.g., Semester 4 / Class 12" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Course</label>
            <input value={editCourse} onChange={(e) => setEditCourse(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Selected Examination</label>
            <select value={editExam} onChange={(e) => setEditExam(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
              {INDIAN_EXAMS.map((ex) => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Preferred Language</label>
            <select value={editLanguage} onChange={(e) => setEditLanguage(e.target.value as 'English' | 'Hindi' | 'Simple Hindi' | 'Bilingual')} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Simple Hindi">Simple Hindi</option>
              <option value="Bilingual">Bilingual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Career Goals</label>
            <input value={editGoals} onChange={(e) => setEditGoals(e.target.value)} placeholder="e.g., SSC ASO / Civil Judge" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]">
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* Quick Workspace Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickNavCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.route)}
              className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8] transition-colors space-y-2"
            >
              <Icon className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{card.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{card.metric}</p>
            </button>
          );
        })}
      </div>

      {/* Real Weakness Detector, Recent History & Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Smart Revision & Weakness Detector
            </h2>
            <button onClick={() => onNavigate('mock-tests')} className="text-xs font-medium text-[#1D4ED8] hover:underline">
              Take Topic Test
            </button>
          </div>
          {attempts.length === 0 ? (
            <div className="py-6 text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <p>No mock test attempts recorded yet. AEC never invents fake weakness scores—complete a 10-question practice test to analyze your real topic accuracy.</p>
              <button
                onClick={() => onNavigate('mock-tests')}
                className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700"
              >
                Start Your First 10-MCQ Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Tests Completed</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{attempts.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Accuracy</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{avgAccuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Practice Time</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{totalStudyMinutes} min</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Topics Requiring Spaced Repetition Revision:
                </p>
                {detectedWeakTopics.length === 0 ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    No weak topics flagged in your recent tests. Keep up consistent revision!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detectedWeakTopics.map(([topic, count]) => (
                      <div key={topic} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-sm">
                        <span className="text-slate-800 dark:text-slate-200">{topic}</span>
                        <span className="text-xs tabular-nums text-amber-700 dark:text-amber-400 font-medium">
                          Missed in {count} test{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Daily Missions & Parent Progress Opt-In */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Daily Learning Missions
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Ask 1 concept question to AI Teacher</span>
                <span className="text-xs font-medium tabular-nums text-[#1D4ED8]">{history.length > 0 ? 'Completed' : 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Complete 1 timed MCQ practice</span>
                <span className="text-xs font-medium tabular-nums text-[#1D4ED8]">{attempts.length > 0 ? 'Completed' : 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Save 1 revision note or flashcard</span>
                <span className="text-xs font-medium tabular-nums text-[#1D4ED8]">{notesCount > 0 ? 'Completed' : 'Pending'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1D4ED8]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Parent Progress Share</h3>
              </div>
              <button
                disabled={parentSaving}
                onClick={toggleParentShare}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  parentShareEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {parentShareEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Share strictly aggregated test accuracy & study hours only—never private AI questions, chats, or files.
            </p>
            {parentShareEnabled && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span>Code: {parentShareCode}</span>
                <button
                  onClick={() => onNavigate('parent-progress')}
                  className="text-[#1D4ED8] inline-flex items-center gap-1 font-sans font-medium"
                >
                  <Share2 className="w-3.5 h-3.5" /> View Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications & Recent Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent AI Question History</h2>
            <button onClick={() => onNavigate('ai-teacher')} className="text-xs font-medium text-[#1D4ED8] hover:underline">
              Open Full History
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Your saved questions and AI explanations will appear here automatically.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="py-2.5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{h.question}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{h.subject} · {h.exam} · {h.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Student Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No unread account alerts right now.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => updateDoc(doc(db, 'notifications', n.id), { read: true })}
                      className="text-xs text-[#1D4ED8] hover:underline whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
