import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Bookmark,
  Flag,
  MessageCircle,
  Search,
  Send,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface PublicQaAndCommunityPageProps {
  mode: 'public-qa' | 'community';
  onNavigate: (route: AppRoute) => void;
}

interface PublicQuestionDoc {
  id: string;
  authorId: string;
  authorAlias: string;
  isAnonymous: boolean;
  question: string;
  answer: string;
  subject: string;
  exam: string;
  helpfulCount: number;
  reportedCount: number;
  status: string;
  createdAt?: { seconds?: number };
}

interface CommunityPostDoc {
  id: string;
  authorId: string;
  authorAlias: string;
  group: string;
  exam: string;
  title: string;
  body: string;
  helpfulCount: number;
  reportedCount: number;
  status: string;
  createdAt?: { seconds?: number };
}

interface CommentDoc {
  id: string;
  authorAlias: string;
  text: string;
}

const GROUPS = [
  'SSC CHSL & CGL Aspirants',
  'UPSC & State PSC Circle',
  'Law, BNS/BNSS & Judiciary',
  'Railway & Banking Group',
  'Class 10–12 & University Prep',
];

export function PublicQaAndCommunityPage({ mode, onNavigate }: PublicQaAndCommunityPageProps) {
  const { user, profile, isVerified, awardXp } = useAuth();
  const [publicQuestions, setPublicQuestions] = useState<PublicQuestionDoc[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPostDoc[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [activeCommentsId, setActiveCommentsId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentDoc[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [notice, setNotice] = useState('');

  // New Community Post
  const [newGroup, setNewGroup] = useState(GROUPS[0]);
  const [newExam, setNewExam] = useState(profile?.selectedExam || 'SSC CHSL');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [postAnonymous, setPostAnonymous] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  useEffect(() => {
    const getTs = (d?: { seconds?: number }) => d?.seconds ?? 0;

    if (mode === 'public-qa') {
      const unsub = onSnapshot(
        query(collection(db, 'public_questions'), where('status', '==', 'published')),
        (snap) => {
          const rows = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<PublicQuestionDoc, 'id'>) }))
            .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
          setPublicQuestions(rows);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'public_questions')
      );
      return unsub;
    }

    const unsub = onSnapshot(
      query(collection(db, 'community_posts'), where('status', '==', 'published')),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityPostDoc, 'id'>) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setCommunityPosts(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'community_posts')
    );
    return unsub;
  }, [mode]);

  const loadComments = async (parentCol: 'public_questions' | 'community_posts', docId: string) => {
    if (activeCommentsId === docId) {
      setActiveCommentsId(null);
      return;
    }
    setActiveCommentsId(docId);
    try {
      const snap = await getDocs(collection(db, parentCol, docId, 'comments'));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommentDoc, 'id'>) }));
      setCommentsMap((prev) => ({ ...prev, [docId]: list }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `${parentCol}/${docId}/comments`);
    }
  };

  const submitComment = async (parentCol: 'public_questions' | 'community_posts', docId: string) => {
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    if (!commentInput.trim()) return;
    try {
      const alias = profile?.fullName || 'Verified Student';
      await addDoc(collection(db, parentCol, docId, 'comments'), {
        authorId: user.uid,
        authorAlias: alias,
        text: commentInput.trim(),
        createdAt: serverTimestamp(),
      });
      setCommentInput('');
      const snap = await getDocs(collection(db, parentCol, docId, 'comments'));
      setCommentsMap((prev) => ({
        ...prev,
        [docId]: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommentDoc, 'id'>) })),
      }));
      await awardXp(5);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${parentCol}/${docId}/comments`);
    }
  };

  const handleVote = async (
    colName: 'public_questions' | 'community_posts',
    id: string,
    field: 'helpfulCount' | 'reportedCount'
  ) => {
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    try {
      await updateDoc(doc(db, colName, id), {
        [field]: increment(1),
      });
      showNotice(field === 'helpfulCount' ? 'Marked helpful!' : 'Reported for moderator review.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${colName}/${id}`);
    }
  };

  const handleBookmarkQuestion = async (qItem: PublicQuestionDoc) => {
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    try {
      await addDoc(collection(db, 'bookmarks'), {
        userId: user.uid,
        itemType: 'question',
        itemId: qItem.id,
        title: qItem.question.slice(0, 180),
        createdAt: serverTimestamp(),
      });
      showNotice('Question bookmarked to your profile.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookmarks');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await addDoc(collection(db, 'community_posts'), {
        authorId: user.uid,
        authorAlias: postAnonymous ? 'Verified AEC Student' : profile?.fullName || 'AEC Student',
        group: newGroup,
        exam: newExam,
        title: newTitle.trim(),
        body: newBody.trim(),
        helpfulCount: 0,
        reportedCount: 0,
        status: 'published',
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewBody('');
      showNotice('Discussion posted to the student community.');
      await awardXp(10);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'community_posts');
    }
  };

  if (mode === 'public-qa') {
    const subjects = ['All', ...Array.from(new Set(publicQuestions.map((q) => q.subject)))];
    const filtered = publicQuestions.filter((q) => {
      const subOk = filterSubject === 'All' || q.subject === filterSubject;
      const textOk =
        !searchText.trim() ||
        q.question.toLowerCase().includes(searchText.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchText.toLowerCase()) ||
        q.exam.toLowerCase().includes(searchText.toLowerCase());
      return subOk && textOk;
    });

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Consent-Based Shared Knowledge
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Public Student Q&amp;A Library
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Only questions explicitly shared by verified students (with PII stripped) appear here. Ask privately in AI Teacher first, then share if helpful to others.
            </p>
          </div>
          <button
            onClick={() => onNavigate('ai-teacher')}
            className="px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] shrink-0"
          >
            Ask AI Teacher
          </button>
        </div>

        {notice && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            {notice}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search public student questions, topics, or exams..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No public questions match yet. Ask a question in AI Student Teacher and click “Share to Public Q&amp;A” to contribute the first entry!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => (
              <article key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
                <p className="text-xs text-slate-500">
                  Shared by {q.authorAlias} · {q.subject} · {q.exam}
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{q.question}</h2>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {q.answer}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleVote('public_questions', q.id, 'helpfulCount')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({q.helpfulCount})
                  </button>
                  <button
                    onClick={() => loadComments('public_questions', q.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Comments
                  </button>
                  <button
                    onClick={() => handleBookmarkQuestion(q)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Bookmark
                  </button>
                  <button
                    onClick={() => handleVote('public_questions', q.id, 'reportedCount')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-600"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                </div>

                {activeCommentsId === q.id && (
                  <div className="pt-3 space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    {(commentsMap[q.id] || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No comments yet. Add an educational tip or clarification.</p>
                    ) : (
                      (commentsMap[q.id] || []).map((c) => (
                        <div key={c.id} className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{c.authorAlias}: </span>
                          <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                        </div>
                      ))
                    )}
                    <div className="flex gap-2">
                      <input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Write a helpful comment..."
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                      />
                      <button
                        onClick={() => submitComment('public_questions', q.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Moderated Student Community
  const filteredPosts = communityPosts.filter((p) => {
    const grpOk = filterSubject === 'All' || p.group === filterSubject;
    const textOk =
      !searchText.trim() ||
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.body.toLowerCase().includes(searchText.toLowerCase());
    return grpOk && textOk;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Peer Learning Circles
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1D4ED8]" /> Verified Student Community
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Moderated exam discussion groups for verified learners. No fake bots or simulated profiles—every post is authored by a real student.
          </p>
        </div>
        <button
          onClick={() => onNavigate('quiz-battle')}
          className="px-4 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700 shrink-0"
        >
          Join Live Quiz Battle
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Post Composer */}
        <form onSubmit={handleCreatePost} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Start a Study Discussion</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Subject / Exam Group</label>
            <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs">
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Target Exam</label>
            <input value={newExam} onChange={(e) => setNewExam(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Topic Title</label>
            <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Strategy for SSC CHSL Tier-I Time Management" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Question / Notes</label>
            <textarea required rows={4} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Share your doubt, book list, or study tip..." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={postAnonymous} onChange={(e) => setPostAnonymous(e.target.checked)} />
            Post anonymously as Verified AEC Student
          </label>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]">
            <Send className="w-3.5 h-3.5" /> {user && isVerified ? 'Publish Discussion' : 'Sign In to Post'}
          </button>
        </form>

        {/* Community Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search community discussions..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="All">All Groups</option>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500">
              No community threads in this group yet. Start the first academic discussion!
            </div>
          ) : (
            filteredPosts.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <p className="text-xs text-slate-500">
                  {p.authorAlias} · {p.group} · {p.exam}
                </p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{p.body}</p>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleVote('community_posts', p.id, 'helpfulCount')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({p.helpfulCount})
                  </button>
                  <button
                    onClick={() => loadComments('community_posts', p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Replies
                  </button>
                  <button
                    onClick={() => handleVote('community_posts', p.id, 'reportedCount')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                </div>

                {activeCommentsId === p.id && (
                  <div className="pt-3 space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg">
                    {(commentsMap[p.id] || []).map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">{c.authorAlias}: </span>
                        <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add reply..."
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                      />
                      <button
                        onClick={() => submitComment('community_posts', p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
