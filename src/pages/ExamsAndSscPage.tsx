import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { EXAM_CATEGORIES, INDIAN_EXAMS, type ExamDefinition } from '../data/exams';
import { SSC_CHSL_SUBJECTS, type SscChslSubject, type SscChslTopic } from '../data/sscChsl';
import type { AppRoute } from './HomePage';

interface ExamsAndSscPageProps {
  mode: 'exams' | 'ssc-chsl';
  initialExamId?: string;
  onNavigate: (route: AppRoute, param?: string) => void;
}

export function ExamsAndSscPage({ mode, initialExamId, onNavigate }: ExamsAndSscPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExamDefinition['category']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExam, setActiveExam] = useState<ExamDefinition>(
    INDIAN_EXAMS.find((e) => e.id === initialExamId) || INDIAN_EXAMS[0]
  );

  // SSC CHSL interactive state
  const [activeSubject, setActiveSubject] = useState<SscChslSubject>(SSC_CHSL_SUBJECTS[0]);
  const [activeChapter, setActiveChapter] = useState<SscChslTopic>(SSC_CHSL_SUBJECTS[0].chapters[0]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialExamId) {
      const found = INDIAN_EXAMS.find((e) => e.id === initialExamId);
      if (found) {
        setActiveExam(found);
        setSelectedCategory(found.category);
      }
    }
  }, [initialExamId]);

  const handleSelectSubject = (sub: SscChslSubject) => {
    setActiveSubject(sub);
    setActiveChapter(sub.chapters[0]);
    setSelectedAnswers({});
  };

  if (mode === 'ssc-chsl') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* SSC CHSL Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Flagship Preparation Portal · Staff Selection Commission
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              SSC CHSL – Complete Online Preparation Centre
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Structured Tier-I &amp; Tier-II mastery across all 10 core subjects with bilingual titles, chapter concepts, memory tricks, rapid revision capsules, and Previous Year / Practice MCQs.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>10 Subjects · {SSC_CHSL_SUBJECTS.reduce((a, s) => a + s.chapters.length, 0)} Chapters</span>
              <span>·</span>
              <span>Negative Marking: -0.50 (Tier-I)</span>
              <span>·</span>
              <a
                href="https://ssc.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1D4ED8] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Official SSC Portal (ssc.gov.in) <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('mock-tests')}
              className="px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
            >
              Take Timed SSC CHSL Mock
            </button>
            <button
              onClick={() => onNavigate('ai-teacher')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Ask AI Teacher
            </button>
          </div>
        </div>

        {/* Subject Navigator + Chapter Study Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 pb-1">
                10 SSC CHSL Subjects
              </p>
              <div className="space-y-1">
                {SSC_CHSL_SUBJECTS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      activeSubject.id === sub.id
                        ? 'bg-[#0B1F3A] text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{sub.name}</p>
                      <p
                        className={`text-xs ${
                          activeSubject.id === sub.id ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {sub.hindiName}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums opacity-80">{sub.chapters.length} ch</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-6">
            {/* Subject Header & Chapter Selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {activeSubject.name} ({activeSubject.hindiName})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeSubject.weightageNote}</p>
                </div>
                <button
                  onClick={() => onNavigate('exams', 'ssc-chsl')}
                  className="text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
                >
                  View Full Tier-I/II Exam Pattern
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeSubject.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChapter(ch);
                      setSelectedAnswers({});
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      activeChapter.id === ch.id
                        ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Study Capsule */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{activeChapter.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Structured Notes, Short Tricks &amp; Revision Points</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1D4ED8]" /> Core Syllabus Concepts
                </h4>
                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed list-disc pl-5">
                  {activeChapter.keyConcepts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Exam Memory Trick &amp; Formula Shortcut
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{activeChapter.shortTrick}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1D4ED8]" /> High-Yield Revision Points
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                  {activeChapter.revisionPoints.map((rp) => (
                    <li key={rp}>{rp}</li>
                  ))}
                </ul>
              </div>

              {/* Chapter Interactive Questions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chapter Practice &amp; PYQ Check ({activeChapter.importantQuestions.length} Questions)
                </h4>
                <div className="space-y-4">
                  {activeChapter.importantQuestions.map((q, qIdx) => {
                    const key = `${activeChapter.id}-${qIdx}`;
                    const picked = selectedAnswers[key];
                    const answered = picked !== undefined;
                    return (
                      <div key={key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Q{qIdx + 1}. {q.q}
                          </p>
                          <span className="text-xs font-mono text-slate-500 shrink-0">{q.type}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctIndex;
                            const isSelected = picked === oIdx;
                            let cls =
                              'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
                            if (answered) {
                              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                              else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                            }
                            return (
                              <button
                                key={opt}
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [key]: oIdx }))}
                                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${cls}`}
                              >
                                <span>{opt}</span>
                                {answered && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                {answered && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                        {answered && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Government Exam Preparation Centre (All 7 categories & 22 Indian exams)
  const filteredExams = INDIAN_EXAMS.filter((ex) => {
    const catOk = selectedCategory === 'All' || ex.category === selectedCategory;
    const textOk =
      !searchQuery.trim() ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.conductingBody.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.introduction.toLowerCase().includes(searchQuery.toLowerCase());
    return catOk && textOk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Government Exam Preparation Centre
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            22 Major Indian Competitive Examinations
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Verified exam patterns, negative marking rules, syllabus highlights, official admit card/result portals, and sample MCQs.
          </p>
        </div>
        <button
          onClick={() => onNavigate('ssc-chsl')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] shrink-0"
        >
          Open SSC CHSL 10-Subject Portal <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              selectedCategory === 'All'
                ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            All ({INDIAN_EXAMS.length})
          </button>
          {EXAM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
                selectedCategory === cat
                  ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SSC, RRB, IBPS, UPSC, NDA..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Exam List */}
        <div className="lg:col-span-4 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filteredExams.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setActiveExam(ex);
                setSelectedAnswers({});
              }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                activeExam.id === ex.id
                  ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{ex.name}</h3>
                <span className={`text-xs ${activeExam.id === ex.id ? 'text-blue-200' : 'text-slate-500'}`}>
                  {ex.category}
                </span>
              </div>
              <p className={`text-xs mt-1 line-clamp-1 ${activeExam.id === ex.id ? 'text-slate-300' : 'text-slate-500'}`}>
                {ex.conductingBody}
              </p>
            </button>
          ))}
        </div>

        {/* Right Detailed Exam View */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs text-[#1D4ED8] dark:text-blue-400 font-medium">
                {activeExam.category} · {activeExam.conductingBody}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeExam.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Last Verified: {activeExam.lastVerified}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate('mock-tests')}
                className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700"
              >
                Start {activeExam.name} Mock Test
              </button>
              <button
                onClick={() => onNavigate('study-planner')}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                Generate Study Plan
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeExam.introduction}</p>

          {/* Quantitative Pattern Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500">Questions</p>
              <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">{activeExam.totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">{activeExam.durationMinutes} min</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Correct Mark</p>
              <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">+{activeExam.marksPerCorrect}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Negative Marking</p>
              <p className="text-base font-bold tabular-nums text-red-700 dark:text-red-400">
                {activeExam.negativeMarking > 0 ? `-${activeExam.negativeMarking}` : 'None'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Eligibility &amp; Pattern</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{activeExam.eligibility}</p>
              <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-medium">{activeExam.patternSummary}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Selection Process</h3>
              <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {activeExam.selectionProcess.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Syllabus Highlights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Section-Wise Syllabus</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeExam.syllabusHighlights.map((sec) => (
                <div key={sec.section} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-[#0B1F3A] dark:text-blue-300">{sec.section}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sec.topics.join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Official Links */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Official Portals &amp; Notices</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{activeExam.importantDatesNote}</p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              <a href={activeExam.officialSite} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1">
                Official Website <ExternalLink className="w-3 h-3" />
              </a>
              <a href={activeExam.admitCardUrl} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1">
                Admit Card Portal <ExternalLink className="w-3 h-3" />
              </a>
              <a href={activeExam.resultUrl} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1">
                Results Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Sample Questions */}
          {activeExam.sampleQuestions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Verified Practice &amp; PYQ Sample Questions
              </h3>
              {activeExam.sampleQuestions.map((sq, idx) => {
                const picked = selectedAnswers[sq.id];
                const answered = picked !== undefined;
                return (
                  <div key={sq.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Q{idx + 1}. {sq.question}
                      </p>
                      <span className="text-xs text-slate-500 shrink-0">
                        {sq.sourceType === 'pyq' ? sq.yearNote || 'PYQ' : 'Curated'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sq.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === sq.correctIndex;
                        const isSelected = picked === oIdx;
                        let cls = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800';
                        if (answered) {
                          if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                          else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                        }
                        return (
                          <button
                            key={opt}
                            onClick={() => setSelectedAnswers((prev) => ({ ...prev, [sq.id]: oIdx }))}
                            className={`text-left px-3 py-2 rounded-lg border text-xs ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                        Explanation: {sq.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
