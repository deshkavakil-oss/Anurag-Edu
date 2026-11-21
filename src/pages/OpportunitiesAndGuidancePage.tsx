import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  Award,
  Bell,
  Bookmark,
  Briefcase,
  Compass,
  ExternalLink,
  Globe,
  Mic,
  Search,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES } from '../data/educationSystem';
import {
  INDIAN_SCHOLARSHIPS,
  OFFICIAL_ALERT_PORTALS,
  OFFICIAL_VIDEO_RESOURCES,
  VERIFIED_CURRENT_AFFAIRS,
} from '../data/opportunities';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface OpportunitiesAndGuidancePageProps {
  mode: 'current-affairs' | 'research' | 'career' | 'scholarships' | 'alerts-videos' | 'interview';
  onNavigate: (route: AppRoute) => void;
}

export function OpportunitiesAndGuidancePage({ mode, onNavigate }: OpportunitiesAndGuidancePageProps) {
  const { user, profile, isVerified, awardXp } = useAuth();
  const [toast, setToast] = useState('');

  // Grounded Search State (Research / Current Affairs / Scholarships / Alerts / Videos)
  const [queryText, setQueryText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    summary: string;
    sources: { title: string; uri: string }[];
    verifiedAt: string;
  } | null>(null);
  const [searchError, setSearchError] = useState('');

  // Current Affairs MCQ state
  const [caAnswers, setCaAnswers] = useState<Record<string, number>>({});

  // Career Guidance state
  const [cgEdu, setCgEdu] = useState(profile?.educationLevel || 'Undergraduate');
  const [cgStream, setCgStream] = useState(profile?.course || 'BA / BSc / Law');
  const [cgState, setCgState] = useState(profile?.state || 'Uttar Pradesh');
  const [cgInterests, setCgInterests] = useState('Government Services, Judiciary & Public Policy');
  const [cgExam, setCgExam] = useState(profile?.selectedExam || 'SSC CHSL');
  const [cgLoading, setCgLoading] = useState(false);
  const [cgOutput, setCgOutput] = useState('');

  // AI Interview / Viva Practice state
  const [ivType, setIvType] = useState('SSC / Govt Job Interview');
  const [ivQuestion, setIvQuestion] = useState('Tell us about your academic background and why you want to serve in Central Government administration.');
  const [ivAnswer, setIvAnswer] = useState('');
  const [ivLang, setIvLang] = useState<string>(profile?.preferredLanguage || 'English');
  const [ivLoading, setIvLoading] = useState(false);
  const [ivFeedback, setIvFeedback] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleBookmark = async (
    itemType: 'scholarship' | 'alert' | 'video' | 'research',
    itemId: string,
    title: string,
    url?: string
  ) => {
    if (!user || !isVerified) {
      onNavigate('auth');
      return;
    }
    try {
      await addDoc(collection(db, 'bookmarks'), {
        userId: user.uid,
        itemType,
        itemId,
        title: title.slice(0, 200),
        ...(url ? { url: url.slice(0, 480) } : {}),
        createdAt: serverTimestamp(),
      });
      showToast('Bookmarked to your student account!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookmarks');
    }
  };

  const runGroundedSearch = async (
    searchMode: 'research' | 'current_affairs' | 'scholarships' | 'alerts' | 'videos',
    overrideQuery?: string
  ) => {
    const q = (overrideQuery ?? queryText).trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const resp = await fetch('/api/ai/research-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mode: searchMode }),
      });
      const data = (await resp.json()) as {
        summary?: string;
        sources?: { title: string; uri: string }[];
        verifiedAt?: string;
        hindiError?: string;
      };
      if (!resp.ok || !data.summary) {
        setSearchError(
          data.hindiError || 'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें।'
        );
        return;
      }
      setSearchResult({
        summary: data.summary,
        sources: data.sources || [],
        verifiedAt: data.verifiedAt || new Date().toISOString(),
      });
      if (user && isVerified) await awardXp(5);
    } catch {
      setSearchError('Network error running grounded search.');
    } finally {
      setSearchLoading(false);
    }
  };

  if (mode === 'current-affairs') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            PIB · RBI · ISRO · Constitutional Governance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-7 h-7 text-[#1D4ED8]" /> Current Affairs &amp; Exam GK Centre
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search live updates (e.g., Union Budget schemes, ISRO missions, RBI repo rate)..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
            <button
              disabled={searchLoading}
              onClick={() => runGroundedSearch('current_affairs')}
              className="px-5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              {searchLoading ? 'Searching PIB/Official...' : 'Live Current Affairs Update'}
            </button>
          </div>
        </div>

        {searchError && (
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900">
            {searchError}
          </div>
        )}

        {searchResult && (
          <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-3">
            <p className="text-xs text-[#1D4ED8] font-medium">
              Live Grounded Update · Verified {new Date(searchResult.verifiedAt).toLocaleString()}
            </p>
            <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {searchResult.summary}
            </div>
            {searchResult.sources.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                {searchResult.sources.map((s) => (
                  <a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1">
                    {s.title} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VERIFIED_CURRENT_AFFAIRS.map((ca) => {
            const picked = caAnswers[ca.id];
            const answered = picked !== undefined;
            return (
              <article key={ca.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
                <p className="text-xs text-slate-500">
                  {ca.category} · Date: {ca.date} · Verified: {ca.lastVerified}
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{ca.headline}</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300">{ca.detailedExplanation}</p>
                <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">{ca.examRelevance}</p>
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {ca.importantFacts.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Practice MCQ: {ca.mcq.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ca.mcq.options.map((opt, idx) => (
                      <button
                        key={opt}
                        onClick={() => setCaAnswers((p) => ({ ...p, [ca.id]: idx }))}
                        className={`text-left px-3 py-1.5 rounded border text-xs ${
                          answered && idx === ca.mcq.correctIndex
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-medium'
                            : answered && picked === idx
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {answered && <p className="text-xs text-slate-600 dark:text-slate-400">{ca.mcq.explanation}</p>}
                </div>
                <a href={ca.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1D4ED8] hover:underline inline-flex items-center gap-1 pt-1">
                  Source: {ca.sourceName} <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'research') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Google Search Grounded Academic Discovery
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-[#1D4ED8]" /> Research &amp; Verified Source Finder
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Find authentic NCERT/UGC study PDFs, academic papers, PIB releases, and Supreme Court/India Code sources. AEC strictly displays real grounding URLs and never fabricates citations.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search academic topic (e.g., Basic Structure Doctrine India, NCERT Polity Class 11 PDF, BNS Section 111)..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
            />
            <button
              disabled={searchLoading || !queryText.trim()}
              onClick={() => runGroundedSearch('research')}
              className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              {searchLoading ? 'Searching Sources...' : 'Find Verified Sources'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {['NCERT Polity Class 11 Official', 'India Code BNS 2023 Bare Act', 'UGC Academic Bank of Credits'].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setQueryText(preset);
                  void runGroundedSearch('research', preset);
                }}
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {toast && <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-900">{toast}</div>}
        {searchError && <div className="p-3.5 rounded-lg bg-amber-50 text-xs text-amber-900">{searchError}</div>}

        {searchResult && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#1D4ED8]">
                AI Research Synthesis · Grounded {new Date(searchResult.verifiedAt).toLocaleString()}
              </p>
              <button
                onClick={() =>
                  handleBookmark('research', `res-${Date.now()}`, queryText, searchResult.sources[0]?.uri)
                }
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-[#1D4ED8]"
              >
                <Bookmark className="w-3.5 h-3.5" /> Bookmark Result
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {searchResult.summary}
            </div>
            {searchResult.sources.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verified Published Source Links ({searchResult.sources.length})
                </p>
                <div className="space-y-1.5">
                  {searchResult.sources.map((s) => (
                    <a
                      key={s.uri}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-[#1D4ED8] hover:underline truncate"
                    >
                      {s.title} — {s.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'career') {
    const handleCareerGuide = async (e: React.FormEvent) => {
      e.preventDefault();
      setCgLoading(true);
      setCgOutput('');
      try {
        const resp = await fetch('/api/ai/career-guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            educationLevel: cgEdu,
            stream: cgStream,
            state: cgState,
            interests: cgInterests,
            targetExam: cgExam,
          }),
        });
        const data = (await resp.json()) as { guidance?: string; hindiError?: string };
        setCgOutput(data.guidance || data.hindiError || 'Unable to generate career roadmap right now.');
      } catch {
        setCgOutput('Network error while generating career roadmap.');
      } finally {
        setCgLoading(false);
      }
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Degree Comparison &amp; Entrance Roadmaps
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#1D4ED8]" /> Career Guidance Engine
            </h1>
          </div>
          <button
            onClick={() => onNavigate('interview')}
            className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700 shrink-0"
          >
            Practice AI Interview / Viva
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCareerGuide} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Education Level</label>
              <input value={cgEdu} onChange={(e) => setCgEdu(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stream / Degree</label>
              <input value={cgStream} onChange={(e) => setCgStream(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">State</label>
              <select value={cgState} onChange={(e) => setCgState(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Interests &amp; Strengths</label>
              <input value={cgInterests} onChange={(e) => setCgInterests(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Target Exam</label>
              <input value={cgExam} onChange={(e) => setCgExam(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <button
              type="submit"
              disabled={cgLoading}
              className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              {cgLoading ? 'Building Roadmap...' : 'Generate Personalized Roadmap'}
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            {!cgOutput ? (
              <p className="text-sm text-slate-500 py-12 text-center">
                Fill your academic background and target goals on the left to receive a tailored 12-month Indian career and entrance roadmap.
              </p>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {cgOutput}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'interview') {
    const handleEvaluate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ivAnswer.trim()) return;
      setIvLoading(true);
      setIvFeedback('');
      try {
        const resp = await fetch('/api/ai/interview-viva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewType: ivType,
            question: ivQuestion,
            answer: ivAnswer,
            language: ivLang,
          }),
        });
        const data = (await resp.json()) as { feedback?: string; hindiError?: string };
        setIvFeedback(data.feedback || data.hindiError || 'Unable to evaluate answer right now.');
        if (user && isVerified && data.feedback) await awardXp(10);
      } catch {
        setIvFeedback('Network error evaluating interview response.');
      } finally {
        setIvLoading(false);
      }
    };

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            UPSC · State PSC · Judiciary · College Viva
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Mic className="w-6 h-6 text-[#1D4ED8]" /> AI Interview &amp; Viva Practice Simulator
          </h1>
        </div>

        <form onSubmit={handleEvaluate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Interview / Viva Track</label>
              <select value={ivType} onChange={(e) => setIvType(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                <option value="SSC / Govt Job Interview">SSC / Central Govt Interview</option>
                <option value="UPSC / State PSC Personality Test">UPSC / State PSC Personality Test</option>
                <option value="Judiciary (PCS-J) / Law Viva">Judiciary (PCS-J) / Law Viva</option>
                <option value="IBPS / SBI PO Bank Interview">IBPS / SBI PO Bank Interview</option>
                <option value="Campus Placement / Technical Viva">Campus Placement / Technical Viva</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Feedback Language</label>
              <select value={ivLang} onChange={(e) => setIvLang(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bilingual">Bilingual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Interviewer Question</label>
            <input value={ivQuestion} onChange={(e) => setIvQuestion(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Your Practice Answer</label>
            <textarea required rows={5} value={ivAnswer} onChange={(e) => setIvAnswer(e.target.value)} placeholder="Type your spoken/written response..." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm" />
          </div>
          <button type="submit" disabled={ivLoading} className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50">
            {ivLoading ? 'Evaluating Response...' : 'Evaluate Answer & Get Model Reply'}
          </button>
        </form>

        {ivFeedback && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed">
            {ivFeedback}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'scholarships') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            NSP · DST INSPIRE · AICTE · State Portals
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-[#1D4ED8]" /> Indian Scholarship Finder
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search live scholarships (e.g., UP Post Matric, Bihar Student Credit Card, UGC Ishan Uday)..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
            <button
              disabled={searchLoading}
              onClick={() => runGroundedSearch('scholarships')}
              className="px-5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              {searchLoading ? 'Searching Portals...' : 'Find Live Schemes'}
            </button>
          </div>
        </div>

        {toast && <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-900">{toast}</div>}
        {searchResult && (
          <div className="bg-white dark:bg-slate-900 border border-blue-200 rounded-xl p-6 space-y-3">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{searchResult.summary}</div>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              {searchResult.sources.map((s) => (
                <a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDIAN_SCHOLARSHIPS.map((sc) => (
            <div key={sc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-[#1D4ED8] font-medium">{sc.type} · Verified {sc.lastVerified}</p>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">{sc.name}</h2>
                  <p className="text-xs text-slate-500">{sc.provider}</p>
                </div>
                <button
                  onClick={() => handleBookmark('scholarship', sc.id, sc.name, sc.officialUrl)}
                  className="text-slate-400 hover:text-[#1D4ED8]"
                  aria-label="Bookmark scholarship"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Eligibility: {sc.eligibility}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Documents: {sc.documents.join(', ')}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{sc.deadlineNote}</p>
              <a href={sc.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline">
                Official Application Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Government Job Alerts & Video Learning Centre
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
          Verified Official Recruitment &amp; Open Courseware
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-[#1D4ED8]" /> Government Alerts &amp; Video Learning Centre
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search official SSC/UPSC/RRB updates or NPTEL/SWAYAM video lectures..."
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
          />
          <button
            disabled={searchLoading}
            onClick={() => runGroundedSearch('alerts')}
            className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
          >
            Check Official Alerts
          </button>
          <button
            disabled={searchLoading}
            onClick={() => runGroundedSearch('videos')}
            className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Find Video Lectures
          </button>
        </div>
      </div>

      {toast && <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-900">{toast}</div>}
      {searchResult && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 rounded-xl p-6 space-y-3">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{searchResult.summary}</div>
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            {searchResult.sources.map((s) => (
              <a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1D4ED8]" /> Official Recruitment, Admit Card &amp; Result Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_ALERT_PORTALS.map((al) => (
            <div key={al.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
              <div className="flex items-start justify-between">
                <p className="text-xs text-[#1D4ED8] font-medium">{al.category}</p>
                <button onClick={() => handleBookmark('alert', al.id, al.body, al.officialUrl)} aria-label="Bookmark portal" className="text-slate-400 hover:text-[#1D4ED8]">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{al.body}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{al.description}</p>
              <a href={al.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline">
                Visit Official Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-[#1D4ED8]" /> Free Official Video Learning Portals (NCERT, SWAYAM, NPTEL, Sansad TV)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFICIAL_VIDEO_RESOURCES.map((v) => (
            <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-xs text-[#1D4ED8] font-medium">{v.subject} · {v.provider}</p>
                <button onClick={() => handleBookmark('video', v.id, v.title, v.url)} aria-label="Bookmark video portal" className="text-slate-400 hover:text-[#1D4ED8]">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{v.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{v.description}</p>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline">
                Watch Official Courseware <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
