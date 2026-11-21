import { useEffect, useState } from 'react';
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
  Bell,
  CheckCircle2,
  Mail,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LEGAL_DISCLAIMER } from '../data/legalEducation';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface InfoAndAdminPageProps {
  mode:
    | 'parent-progress'
    | 'admin'
    | 'info-about'
    | 'info-contact'
    | 'info-privacy'
    | 'info-terms'
    | 'info-disclaimer'
    | 'info-help';
  onNavigate: (route: AppRoute) => void;
}

interface ParentSnapshot {
  studentName: string;
  selectedExam: string;
  studyHours: number;
  testsTaken: number;
  averageAccuracy: number;
  weakTopics?: string[];
  enabled: boolean;
}

export function InfoAndAdminPage({ mode, onNavigate }: InfoAndAdminPageProps) {
  const { user, isVerified, isAdmin } = useAuth();

  // Parent Progress state
  const [shareCode, setShareCode] = useState('');
  const [parentData, setParentData] = useState<ParentSnapshot | null>(null);
  const [parentErr, setParentErr] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactMsg, setContactMsg] = useState('');
  const [contactStatus, setContactStatus] = useState('');

  // Admin state
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; selectedExam: string; state: string; xp: number }>>([]);
  const [pendingBlogs, setPendingBlogs] = useState<Array<{ id: string; title: string; authorName: string; category: string; status: string }>>([]);
  const [flaggedQa, setFlaggedQa] = useState<Array<{ id: string; question: string; reportedCount: number; status: string }>>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [sysHealth, setSysHealth] = useState<{ geminiConfigured?: boolean; smtpConfigured?: boolean } | null>(null);
  const [adminToast, setAdminToast] = useState('');

  useEffect(() => {
    if (mode !== 'admin' || !user || !isAdmin) return;

    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setSysHealth(d as { geminiConfigured?: boolean; smtpConfigured?: boolean }))
      .catch(() => {});

    const u1 = onSnapshot(
      collection(db, 'student_profiles'),
      (s) =>
        setStudents(
          s.docs.map((d) => {
            const data = d.data() as { fullName?: string; selectedExam?: string; state?: string; xp?: number };
            return {
              id: d.id,
              fullName: data.fullName || 'Student',
              selectedExam: data.selectedExam || '-',
              state: data.state || '-',
              xp: data.xp || 0,
            };
          })
        ),
      (err) => handleFirestoreError(err, OperationType.LIST, 'student_profiles')
    );

    const u2 = onSnapshot(
      query(collection(db, 'blogs'), where('status', '==', 'draft')),
      (s) =>
        setPendingBlogs(
          s.docs.map((d) => {
            const data = d.data() as { title?: string; authorName?: string; category?: string; status?: string };
            return {
              id: d.id,
              title: data.title || '',
              authorName: data.authorName || '',
              category: data.category || '',
              status: data.status || 'draft',
            };
          })
        ),
      (err) => handleFirestoreError(err, OperationType.LIST, 'blogs')
    );

    const u3 = onSnapshot(
      collection(db, 'public_questions'),
      (s) =>
        setFlaggedQa(
          s.docs
            .map((d) => {
              const data = d.data() as { question?: string; reportedCount?: number; status?: string };
              return {
                id: d.id,
                question: data.question || '',
                reportedCount: data.reportedCount || 0,
                status: data.status || 'published',
              };
            })
            .filter((q) => q.reportedCount > 0 || q.status !== 'published')
        ),
      (err) => handleFirestoreError(err, OperationType.LIST, 'public_questions')
    );

    return () => {
      u1();
      u2();
      u3();
    };
  }, [mode, user, isAdmin]);

  if (mode === 'parent-progress') {
    const handleLookup = async (e: React.FormEvent) => {
      e.preventDefault();
      setParentErr('');
      setParentData(null);
      const code = shareCode.trim();
      if (!code) return;
      try {
        const snap = await getDoc(doc(db, 'parent_progress', code));
        if (!snap.exists()) {
          setParentErr('No progress record found for this share code.');
          return;
        }
        const d = snap.data() as ParentSnapshot;
        if (!d.enabled) {
          setParentErr('Parent sharing is currently disabled by the student.');
          return;
        }
        setParentData(d);
      } catch {
        setParentErr('Unable to load progress snapshot. Check the code shared by the student.');
      }
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Progress Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter the opt-in Student Share Code (e.g., <span className="font-mono">AEC_...</span>) from the student’s dashboard. Only aggregated test accuracy, study hours, and weak-topic areas are displayed—private chats and files stay confidential.
          </p>
          <form onSubmit={handleLookup} className="flex gap-2 pt-2">
            <input
              required
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              placeholder="Enter share code (AEC_...)"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-mono"
            />
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium">
              View Progress
            </button>
          </form>
          {parentErr && <p className="text-xs text-red-600">{parentErr}</p>}
        </div>

        {parentData && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {parentData.studentName} · Target: {parentData.selectedExam}
            </h2>
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950">
              <div>
                <p className="text-xs text-slate-500">Study Hours</p>
                <p className="text-xl font-bold tabular-nums">{parentData.studyHours} h</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tests Taken</p>
                <p className="text-xl font-bold tabular-nums">{parentData.testsTaken}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Average Accuracy</p>
                <p className="text-xl font-bold tabular-nums text-[#1D4ED8]">{parentData.averageAccuracy}%</p>
              </div>
            </div>
            {parentData.weakTopics && parentData.weakTopics.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Topics Needing Revision:</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{parentData.weakTopics.join(' · ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'admin') {
    if (!user || !isVerified || !isAdmin) {
      return (
        <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
          <Shield className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Administrator Access Required</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This control panel is restricted to authorized ANURAG EDUCATION CENTER administrators.
          </p>
          <button onClick={() => onNavigate('home')} className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium">
            Return Home
          </button>
        </div>
      );
    }

    const publishAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await setDoc(doc(db, 'admin_settings', 'announcements'), {
          announcementTitle: annTitle.trim(),
          announcementBody: annBody.trim(),
          updatedAt: serverTimestamp(),
        });
        setAdminToast('Platform announcement published to student dashboards!');
        setAnnTitle('');
        setAnnBody('');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'admin_settings/announcements');
      }
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8]">Platform Governance</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">AEC Admin Control Panel</h1>
          </div>
          {sysHealth && (
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
              <p>Gemini AI API: {sysHealth.geminiConfigured ? 'Configured' : 'Missing Secret'}</p>
              <p>SMTP Mailer: {sysHealth.smtpConfigured ? 'Configured' : 'Firebase Auth Emails Active'}</p>
            </div>
          )}
        </div>

        {adminToast && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">{adminToast}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={publishAnnouncement} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1D4ED8]" /> Publish Official Platform Announcement
            </h2>
            <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <textarea required rows={3} value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Notice details for all students..." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium">
              Publish Banner
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1D4ED8]" /> Registered Student Profiles ({students.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto text-xs">
              {students.map((st) => (
                <div key={st.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{st.fullName} ({st.state})</span>
                  <span className="text-slate-500">{st.selectedExam} · {st.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold">Pending Student Blog Drafts ({pendingBlogs.length})</h2>
            {pendingBlogs.length === 0 ? (
              <p className="text-xs text-slate-500">No pending blog drafts.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {pendingBlogs.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{b.title}</p>
                      <p className="text-slate-500">By {b.authorName} · {b.category}</p>
                    </div>
                    <button
                      onClick={() => updateDoc(doc(db, 'blogs', b.id), { status: 'published', updatedAt: serverTimestamp() })}
                      className="px-3 py-1 rounded bg-emerald-700 text-white font-medium shrink-0"
                    >
                      Approve &amp; Publish
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold">Flagged Public Q&amp;A Moderation ({flaggedQa.length})</h2>
            {flaggedQa.length === 0 ? (
              <p className="text-xs text-slate-500">No reported public Q&amp;As.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {flaggedQa.map((q) => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="truncate">{q.question} ({q.reportedCount} reports)</span>
                    <button
                      onClick={() => updateDoc(doc(db, 'public_questions', q.id), { status: 'removed' })}
                      className="px-3 py-1 rounded bg-red-600 text-white font-medium shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Informational & Legal Policy Pages
  if (mode === 'info-contact') {
    const handleContact = async (e: React.FormEvent) => {
      e.preventDefault();
      setContactStatus('Sending...');
      try {
        const resp = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'anurag706879@gmail.com',
            subject: `AEC Inquiry from ${contactName}`,
            text: `Sender: ${contactName} (${contactEmail})\n\n${contactMsg}`,
          }),
        });
        const data = (await resp.json()) as { sent?: boolean; message?: string };
        if (data.sent) {
          setContactStatus('Message delivered to anurag706879@gmail.com.');
          setContactMsg('');
        } else {
          setContactStatus(
            `SMTP relay is optional and currently not configured on this server. Please email anurag706879@gmail.com directly from your email client.`
          );
        }
      } catch {
        setContactStatus('Please email anurag706879@gmail.com directly for support.');
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contact ANURAG EDUCATION CENTER</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Official Platform Support Email:{' '}
            <a href="mailto:anurag706879@gmail.com" className="text-[#1D4ED8] font-medium hover:underline inline-flex items-center gap-1">
              <Mail className="w-4 h-4" /> anurag706879@gmail.com
            </a>
          </p>
        </div>

        <form onSubmit={handleContact} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Send an Academic or Platform Inquiry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your Full Name" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input required type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Your Email Address" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <textarea required rows={4} value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} placeholder="How can AEC assist you?" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm" />
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]">
            Send Message
          </button>
          {contactStatus && (
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" /> {contactStatus}
            </p>
          )}
        </form>
      </div>
    );
  }

  const infoContent: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
    'info-about': {
      title: 'About ANURAG EDUCATION CENTER (AEC)',
      sections: [
        {
          heading: 'Mission & Academic Vision',
          body: 'ANURAG EDUCATION CENTER (LEARN • RESEARCH • PRACTICE • SUCCEED) is a unified Indian educational ecosystem built for school learners (Class 1–12), college & university scholars, competitive government exam aspirants (SSC CHSL, CGL, RRB, IBPS, UPSC, State PSC, Defence, Police, TET), and law/research learners.',
        },
        {
          heading: 'Authenticity & Zero-Fabrication Commitment',
          body: 'AEC never fabricates student counts, artificial leaderboards, fake court citations, or unverified exam dates. Official statutory texts link to India Code and the Supreme Court of India, while AI practice questions are transparently distinguished from curated PYQs.',
        },
      ],
    },
    'info-privacy': {
      title: 'Student Privacy Policy',
      sections: [
        {
          heading: 'Default Private Learning Vault',
          body: 'All AI Student Teacher questions, personal conversations, uploaded study files, notes, flashcards, and study plans are strictly private to your verified Firebase account. No private academic records are visible to other students unless you explicitly click Share to Public Q&A.',
        },
        {
          heading: 'Zero PII in Public Shares & Parent Snapshots',
          body: 'When sharing a question to the Public Student Q&A Library, your email address, city, and institution are stripped. Opt-in Parent Progress sharing exposes only aggregated test accuracy, study hours, and revision topics.',
        },
      ],
    },
    'info-terms': {
      title: 'Terms & Conditions',
      sections: [
        {
          heading: 'Acceptable Educational Use',
          body: 'AEC is designed strictly for honest academic learning, competitive examination preparation, and legal literacy. Automated scraping, abusive community posts, or unauthorized attempts to bypass platform safeguards are prohibited.',
        },
      ],
    },
    'info-disclaimer': {
      title: 'Academic & Legal Education Disclaimer',
      sections: [
        {
          heading: 'Educational Purpose Notice',
          body: LEGAL_DISCLAIMER,
        },
        {
          heading: 'Official Examination Notifications',
          body: 'Always cross-verify application deadlines, admit cards, and final exam schedules directly on official portals (ssc.gov.in, upsc.gov.in, rrbcdg.gov.in, ibps.in, nta.ac.in, scholarships.gov.in).',
        },
      ],
    },
    'info-help': {
      title: 'Help Centre & Student Guide',
      sections: [
        {
          heading: 'Account Verification & Password Reset',
          body: 'Register using your email address and click the Firebase verification link sent to your inbox (check spam folder if delayed), or use Continue with Google for instant verification.',
        },
        {
          heading: 'Support Contact',
          body: 'For technical or academic support, email ANURAG EDUCATION CENTER at anurag706879@gmail.com.',
        },
      ],
    },
  };

  const page = infoContent[mode] || infoContent['info-about'];
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{page.title}</h1>
        {page.sections.map((sec) => (
          <div key={sec.heading} className="space-y-1.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{sec.heading}</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
