import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AlertTriangle,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  LEGAL_BLOGS_100,
  LEGAL_BLOG_CATEGORIES,
  type LegalBlogItem,
} from '../data/legalBlogs100';
import {
  CRIMINAL_LAW_COMPARISONS,
  LEGAL_DISCLAIMER,
  LEGAL_MODULES,
} from '../data/legalEducation';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface LegalPortalPageProps {
  mode: 'legal-centre' | 'legal-blogs' | 'blog-generator';
  onNavigate: (route: AppRoute) => void;
}

interface FirestoreBlogDoc {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  slug: string;
  category: string;
  language: string;
  status: 'draft' | 'published';
  content: string;
  references?: { title: string; uri: string }[];
  createdAt?: { seconds?: number };
}

export function LegalPortalPage({ mode, onNavigate }: LegalPortalPageProps) {
  const { user, profile, isVerified, isAdmin, awardXp } = useAuth();

  // Legal Centre state
  const [lawSearch, setLawSearch] = useState('');
  const [selectedActId, setSelectedActId] = useState(LEGAL_MODULES[0].id);

  // Legal Blogs Library state
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategory, setBlogCategory] = useState<'All' | LegalBlogItem['category']>('All');
  const [readingBlog, setReadingBlog] = useState<LegalBlogItem | null>(null);
  const [readingDynamicBlog, setReadingDynamicBlog] = useState<FirestoreBlogDoc | null>(null);
  const [publishedFirestoreBlogs, setPublishedFirestoreBlogs] = useState<FirestoreBlogDoc[]>([]);
  const [myDraftBlogs, setMyDraftBlogs] = useState<FirestoreBlogDoc[]>([]);

  // AI Blog Generator state
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState<string>('BNS');
  const [genLanguage, setGenLanguage] = useState<string>('English');
  const [genLength, setGenLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [genAudience, setGenAudience] = useState('Law Students, Judiciary & Competitive Aspirants');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedRefs, setGeneratedRefs] = useState<{ title: string; uri: string }[]>([]);
  const [blogToast, setBlogToast] = useState('');

  useEffect(() => {
    const getTs = (d?: { seconds?: number }) => d?.seconds ?? 0;

    const unsubPub = onSnapshot(
      query(collection(db, 'blogs'), where('status', '==', 'published')),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<FirestoreBlogDoc, 'id'>) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setPublishedFirestoreBlogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blogs')
    );

    let unsubMine = () => {};
    if (user && isVerified) {
      unsubMine = onSnapshot(
        query(collection(db, 'blogs'), where('authorId', '==', user.uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<FirestoreBlogDoc, 'id'>) }))
            .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
          setMyDraftBlogs(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'blogs')
      );
    }

    return () => {
      unsubPub();
      unsubMine();
    };
  }, [user, isVerified]);

  const showToast = (msg: string) => {
    setBlogToast(msg);
    setTimeout(() => setBlogToast(''), 3500);
  };

  if (mode === 'legal-centre') {
    const filteredModules = LEGAL_MODULES.filter(
      (m) =>
        !lawSearch.trim() ||
        m.title.toLowerCase().includes(lawSearch.toLowerCase()) ||
        m.summary.toLowerCase().includes(lawSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(lawSearch.toLowerCase())
    );
    const activeModule = LEGAL_MODULES.find((m) => m.id === selectedActId) || LEGAL_MODULES[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
                Indian Legal Education Centre · BNS / BNSS / BSA &amp; Constitutional Studies
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Scale className="w-7 h-7 text-[#1D4ED8]" /> 26 Indian Law Modules &amp; Judiciary Prep
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate('legal-blogs')}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
              >
                Explore 105+ Legal Blogs
              </button>
              <button
                onClick={() => onNavigate('blog-generator')}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                AI Legal Blog Studio
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{LEGAL_DISCLAIMER}</span>
          </div>
        </div>

        {/* Criminal Law Transition Table: IPC/CrPC/IEA vs BNS/BNSS/BSA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            IPC / CrPC / IEA vs Bharatiya Nyaya Sanhita (BNS), BNSS &amp; BSA (Effective 1 July 2024)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Subject / Offence</th>
                  <th className="py-2.5 pr-4 font-semibold">Repealed Legacy Code</th>
                  <th className="py-2.5 pr-4 font-semibold">New Criminal Law (In Force)</th>
                  <th className="py-2.5 font-semibold">Key Statutory Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {CRIMINAL_LAW_COMPARISONS.map((row) => (
                  <tr key={row.topic}>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{row.topic}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{row.oldLaw}</td>
                    <td className="py-3 pr-4 font-medium text-[#1D4ED8] dark:text-blue-400">{row.newLaw}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{row.keyChange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All 26 Modules Browser */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={lawSearch}
                onChange={(e) => setLawSearch(e.target.value)}
                placeholder="Search 26 law subjects (Constitution, BNS, RTI, Cyber, Family)..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedActId(mod.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    activeModule.id === mod.id
                      ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8]'
                  }`}
                >
                  <p className="text-sm font-semibold">{mod.title}</p>
                  <p className={`text-xs mt-0.5 ${activeModule.id === mod.id ? 'text-blue-200' : 'text-slate-500'}`}>
                    {mod.category} · {mod.statusNote}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 h-fit">
            <div>
              <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">
                {activeModule.category} · {activeModule.statusNote}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeModule.title}</h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeModule.summary}</p>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Key Statutory Provisions &amp; Exam Focus
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                {activeModule.keyProvisions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <a
                href={activeModule.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1 font-medium"
              >
                Verify Official Bare Act: {activeModule.officialSourceName} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex gap-4">
                <a href="https://www.sci.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:underline">
                  Supreme Court of India
                </a>
                <a href="https://ecourts.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:underline">
                  eCourts Portal
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'legal-blogs') {
    const filteredBlogs = LEGAL_BLOGS_100.filter((b) => {
      const catOk = blogCategory === 'All' || b.category === blogCategory;
      const textOk =
        !blogSearch.trim() ||
        b.title.toLowerCase().includes(blogSearch.toLowerCase()) ||
        b.provisions.toLowerCase().includes(blogSearch.toLowerCase()) ||
        b.category.toLowerCase().includes(blogSearch.toLowerCase());
      return catOk && textOk;
    });

    const filteredPublishedDynamic = publishedFirestoreBlogs.filter((b) => {
      const catOk = blogCategory === 'All' || b.category === blogCategory;
      const textOk = !blogSearch.trim() || b.title.toLowerCase().includes(blogSearch.toLowerCase());
      return catOk && textOk;
    });

    if (readingBlog) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <button
            onClick={() => setReadingBlog(null)}
            className="text-xs font-medium text-[#1D4ED8] hover:underline no-print"
          >
            ← Back to 105+ Legal Blogs Library
          </button>
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs text-[#1D4ED8] dark:text-blue-400 font-medium">
                {readingBlog.category} · {readingBlog.provisions} · Published {readingBlog.createdAt}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{readingBlog.title}</h1>
              <div className="flex gap-3 pt-1 no-print">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
              </div>
            </div>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Introduction</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{readingBlog.introduction}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Detailed Legal Explanation</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{readingBlog.detailedExplanation}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Practical Indian Illustration</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{readingBlog.examples}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Conclusion</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{readingBlog.conclusion}</p>
            </section>
            <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Official Statutory References</p>
              <div className="flex flex-wrap gap-4">
                {readingBlog.references.map((ref) => (
                  <a
                    key={ref.url + ref.label}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1D4ED8] hover:underline inline-flex items-center gap-1"
                  >
                    {ref.label} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 pt-2">{LEGAL_DISCLAIMER}</p>
            </section>
          </article>
        </div>
      );
    }

    if (readingDynamicBlog) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <button
            onClick={() => setReadingDynamicBlog(null)}
            className="text-xs font-medium text-[#1D4ED8] hover:underline no-print"
          >
            ← Back to Legal Blogs Library
          </button>
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-4">
            <p className="text-xs text-[#1D4ED8] font-medium">
              {readingDynamicBlog.category} · By {readingDynamicBlog.authorName} · {readingDynamicBlog.language}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{readingDynamicBlog.title}</h1>
            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {readingDynamicBlog.content}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 pt-4 border-t border-slate-200 dark:border-slate-800">
              {LEGAL_DISCLAIMER}
            </p>
          </article>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Indian Legal Blog Repository
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              {LEGAL_BLOGS_100.length + publishedFirestoreBlogs.length}+ Curated &amp; Admin-Published Legal Articles
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Covering BNS, BNSS, BSA, Constitutional, Criminal, Civil, Cyber, Family, Property, Consumer, Labour &amp; Judiciary preparation across 14 categories.
            </p>
          </div>
          <button
            onClick={() => onNavigate('blog-generator')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Open AI Blog Generator
          </button>
        </div>

        {/* Search & 14 Category Filter */}
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              placeholder="Search legal articles, sections (e.g. Zero FIR, Sec 63 BSA, Art 21)..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBlogCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                blogCategory === 'All'
                  ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              All Categories ({LEGAL_BLOGS_100.length})
            </button>
            {LEGAL_BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setBlogCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  blogCategory === cat
                    ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Admin-Published Firestore Blogs */}
        {filteredPublishedDynamic.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Newly Published Platform Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublishedDynamic.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setReadingDynamicBlog(b)}
                  className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 hover:border-[#1D4ED8] space-y-2"
                >
                  <p className="text-xs text-[#1D4ED8] font-medium">{b.category} · {b.language}</p>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-slate-500">By {b.authorName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 105 Curated Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlogs.map((b) => (
            <button
              key={b.id}
              onClick={() => setReadingBlog(b)}
              className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8] transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">
                  {b.category} · {b.provisions}
                </p>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{b.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{b.introduction}</p>
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#1D4ED8]" /> Read Full Guide
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // AI Blog Generator Studio
  const handleGenerateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;
    setGenLoading(true);
    setGenError('');
    try {
      const resp = await fetch('/api/ai/blog-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic.trim(),
          category: genCategory,
          language: genLanguage,
          length: genLength,
          audience: genAudience,
        }),
      });
      const data = (await resp.json()) as {
        title?: string;
        content?: string;
        references?: { title: string; uri: string }[];
        hindiError?: string;
      };
      if (!resp.ok || !data.content) {
        setGenError(
          data.hindiError ||
            'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें।'
        );
        return;
      }
      setGeneratedTitle(data.title || genTopic.trim());
      setGeneratedContent(data.content);
      setGeneratedRefs(data.references || []);
      if (user && isVerified) await awardXp(15);
    } catch {
      setGenError('Network error while generating blog draft.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleSaveBlog = async (status: 'draft' | 'published') => {
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    if (!generatedTitle.trim() || !generatedContent.trim()) return;
    const effectiveStatus = status === 'published' && isAdmin ? 'published' : 'draft';
    const slug = `${generatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}-${Date.now()}`;
    try {
      await addDoc(collection(db, 'blogs'), {
        authorId: user.uid,
        authorName: profile?.fullName || user.displayName || 'AEC Student',
        title: generatedTitle.trim().slice(0, 200),
        slug,
        category: genCategory,
        language: genLanguage,
        status: effectiveStatus,
        content: generatedContent.slice(0, 39000),
        references: generatedRefs.slice(0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(
        effectiveStatus === 'published'
          ? 'Blog published to the public Legal Blogs library!'
          : 'Saved as Draft in My Blogs. Only Admins can publish globally.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'blogs');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Academic &amp; Legal Writing Studio
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            AI Legal &amp; Academic Blog Generator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Generate structured educational drafts with official India Code / PIB grounding. Student articles save privately as drafts; Administrators review and publish to the public library.
          </p>
        </div>
        <button
          onClick={() => onNavigate('legal-blogs')}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium shrink-0"
        >
          Browse 105+ Blogs
        </button>
      </div>

      {blogToast && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          {blogToast}
        </div>
      )}

      {genError && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
          {genError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleGenerateBlog} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 h-fit">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Topic / Legal Question</label>
            <input required value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="e.g., Zero FIR and e-FIR under Section 173 BNSS" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select value={genCategory} onChange={(e) => setGenCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
              {LEGAL_BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Language</label>
              <select value={genLanguage} onChange={(e) => setGenLanguage(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bilingual">Bilingual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Length</label>
              <select value={genLength} onChange={(e) => setGenLength(e.target.value as 'short' | 'medium' | 'detailed')} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                <option value="short">Short (~500w)</option>
                <option value="medium">Medium (~900w)</option>
                <option value="detailed">Detailed (~1400w)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Target Audience</label>
            <input value={genAudience} onChange={(e) => setGenAudience(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <button
            type="submit"
            disabled={genLoading}
            className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
          >
            {genLoading ? 'Generating Grounded Draft...' : 'Generate Article'}
          </button>
        </form>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1D4ED8]" /> Article Editor &amp; Preview
            </h2>
            {!generatedContent ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                Enter a legal or academic topic on the left to generate a structured draft with verified references.
              </p>
            ) : (
              <>
                <input
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base font-semibold"
                />
                <textarea
                  rows={14}
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-sm leading-relaxed"
                />
                {generatedRefs.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-600 dark:text-slate-400">Grounded Sources:</p>
                    <div className="flex flex-wrap gap-3">
                      {generatedRefs.map((r) => (
                        <a key={r.uri} href={r.uri} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline">
                          {r.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-2 no-print">
                  <button
                    onClick={() => handleSaveBlog('draft')}
                    className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
                  >
                    Save as Draft in My Blogs
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleSaveBlog('published')}
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
                    >
                      Publish Directly (Admin)
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {/* My Saved Blogs */}
          {user && isVerified && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                My Saved Blog Drafts ({myDraftBlogs.length})
              </h3>
              {myDraftBlogs.length === 0 ? (
                <p className="text-xs text-slate-500">You have not saved any blog drafts yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myDraftBlogs.map((d) => (
                    <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{d.title}</p>
                        <p className="text-xs text-slate-500">
                          {d.category} · {d.language} · Status: {d.status.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setGeneratedTitle(d.title);
                            setGeneratedContent(d.content);
                          }}
                          className="text-xs text-[#1D4ED8] hover:underline"
                        >
                          Load in Editor
                        </button>
                        {isAdmin && d.status === 'draft' && (
                          <button
                            onClick={() => updateDoc(doc(db, 'blogs', d.id), { status: 'published', updatedAt: serverTimestamp() })}
                            className="text-xs text-emerald-700 hover:underline font-medium"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
