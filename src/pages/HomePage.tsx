import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Briefcase,
  CheckSquare,
  Compass,
  FileText,
  FolderOpen,
  Globe,
  Landmark,
  Layers,
  MessageSquare,
  Scale,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';

export type AppRoute =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'ai-teacher'
  | 'exams'
  | 'ssc-chsl'
  | 'mock-tests'
  | 'quiz-battle'
  | 'public-qa'
  | 'current-affairs'
  | 'study-planner'
  | 'education-system'
  | 'legal-centre'
  | 'legal-blogs'
  | 'blog-generator'
  | 'research'
  | 'files'
  | 'notes'
  | 'career'
  | 'scholarships'
  | 'alerts-videos'
  | 'community'
  | 'interview'
  | 'parent-progress'
  | 'admin'
  | 'info-about'
  | 'info-contact'
  | 'info-privacy'
  | 'info-terms'
  | 'info-disclaimer'
  | 'info-help';

interface HomePageProps {
  onNavigate: (route: AppRoute, param?: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user, isVerified } = useAuth();

  const examTracks = [
    { name: 'SSC CHSL', desc: 'Complete 10-subject preparation portal, Tier-I & II syllabus, tricks & PYQs', route: 'ssc-chsl' as AppRoute },
    { name: 'SSC CGL', desc: 'Quantitative Abilities, English, Reasoning, GA & Computer modules', route: 'exams' as AppRoute, param: 'ssc-cgl' },
    { name: 'Railway (RRB)', desc: 'NTPC, Group D, ALP, Technician & Railway JE CBT preparation', route: 'exams' as AppRoute, param: 'rrb-ntpc' },
    { name: 'Banking (IBPS/SBI)', desc: 'Prelims, Mains, Banking Awareness & RBI Grade B analytics', route: 'exams' as AppRoute, param: 'ibps-po' },
    { name: 'UPSC & State PSC', desc: 'GS I–IV, Prelims CSAT, BPSC, UPPSC, WBCS & JPSC tracks', route: 'exams' as AppRoute, param: 'upsc-cse' },
    { name: 'Police, Defence & TET', desc: 'NDA, CDS, AFCAT, Agniveer, Police SI, CTET, CUET & UGC NET', route: 'exams' as AppRoute, param: 'nda-cds' },
  ];

  const workspacePillars = [
    { icon: Bot, title: 'AI Student Teacher', desc: '10-step structured answers in Hindi, English & Bilingual with personal memory, photo solver & voice.', route: 'ai-teacher' as AppRoute },
    { icon: CheckSquare, title: 'Mock Test Engine', desc: 'Daily 10/25/50 MCQs, full-length timed tests with exam-accurate negative marking & weakness analytics.', route: 'mock-tests' as AppRoute },
    { icon: Scale, title: 'Legal Education Centre', desc: '26 Indian law subjects, BNS/BNSS/BSA vs IPC/CrPC/IEA comparator & 105+ legal blog articles.', route: 'legal-centre' as AppRoute },
    { icon: Search, title: 'Research & Source Finder', desc: 'Grounded academic papers, NCERT/UGC PDFs, PIB news & India Code statutory citations.', route: 'research' as AppRoute },
    { icon: MessageSquare, title: 'Public Q&A Library', desc: 'Consent-based peer knowledge sharing with anonymous posting, bookmarks & community discussion.', route: 'public-qa' as AppRoute },
    { icon: FolderOpen, title: 'Digital File Library & Notes', desc: 'Upload PDFs/DOCX/images, generate AI summaries, flashcards, and 30/60/90-day study plans.', route: 'files' as AppRoute },
  ];

  const secondarySections = [
    { icon: Globe, title: 'Current Affairs Centre', desc: 'Daily, weekly & monthly national, scheme, economy and ISRO updates with PIB verification.', route: 'current-affairs' as AppRoute },
    { icon: BookOpen, title: 'Indian Education System', desc: 'Class 1–12 NCERT/CBSE/ICSE/State Boards, UG, PG & University syllabus uploader.', route: 'education-system' as AppRoute },
    { icon: FileText, title: '100+ Legal Blogs & Generator', desc: '105 curated legal articles across 14 categories plus AI drafting studio saved to your account.', route: 'legal-blogs' as AppRoute },
    { icon: Compass, title: 'Career Guidance', desc: 'Personalized degree comparisons, entrance roadmaps & AI Interview/Viva practice.', route: 'career' as AppRoute },
    { icon: Award, title: 'Scholarship Finder', desc: 'Verified Central, State, NSP & DST INSPIRE schemes with eligibility & document checklists.', route: 'scholarships' as AppRoute },
    { icon: Briefcase, title: 'Govt Alerts & Video Lectures', desc: 'Official SSC/UPSC/RRB/NTA links alongside NPTEL, SWAYAM & NCERT eVidya portals.', route: 'alerts-videos' as AppRoute },
    { icon: Users, title: 'Student Community & Quiz Battle', desc: 'Moderated exam groups plus live WebSocket multiplayer Quiz Battles with real students.', route: 'quiz-battle' as AppRoute },
    { icon: Layers, title: 'Smart Study Planner & Parent Share', desc: 'Automated 30/60/90-day timetables and opt-in parent progress tracking.', route: 'study-planner' as AppRoute },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-widest uppercase text-[#1D4ED8] dark:text-blue-400">
                ANURAG EDUCATION CENTER · AEC INDIA
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight text-balance">
                India’s Complete AI-Powered Education, Exam Prep & Legal Learning Platform
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Register with a verified email, study every SSC CHSL & government exam subject, consult your personal AI Teacher in Hindi or English, practice timed mock tests, explore 26 Indian law modules, and maintain your complete learning record across devices.
              </p>
              <p className="text-xs font-mono tracking-wider text-slate-500 dark:text-slate-400">
                LEARN • RESEARCH • PRACTICE • SUCCEED
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate(user && isVerified ? 'dashboard' : 'auth')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] transition-colors whitespace-nowrap shrink-0"
                >
                  {user && isVerified ? 'Open Student Dashboard' : 'Student Registration & Login'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('ssc-chsl')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Explore SSC CHSL Portal
                </button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <SafeImage
                  src="/src/assets/images/hero_academic_campus_1795280838370.jpg"
                  alt="ANURAG EDUCATION CENTER Indian Academic Library"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Grounded platform capabilities strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">22+ Exams</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">SSC, Railway, Banking, UPSC, State PSC, Defence & TET</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">10 Subjects</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Dedicated SSC CHSL Tier-I & II preparation centre</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">26 Law Acts</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Constitution, BNS, BNSS, BSA & 105+ legal blog guides</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">Bilingual AI</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Hindi & English AI Teacher with saved history & memory</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Government Exam Preparation & SSC CHSL Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Government Exam Preparation Centre
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-1">
              Dedicated Preparation Tracks Across India
            </h2>
          </div>
          <button
            onClick={() => onNavigate('exams')}
            className="text-sm font-medium text-[#1D4ED8] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            View all examinations <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
            <div className="h-56 overflow-hidden">
              <SafeImage
                src="/src/assets/images/ssc_exam_study_1795280840114.jpg"
                alt="SSC CHSL Study Desk and Notes"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Flagship Portal · Verified Official Pattern
                </p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                  SSC CHSL – Complete Online Preparation Centre
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Chapter-wise notes, short tricks, revision capsules, and PYQ MCQs covering History, Geography, Mathematics, Reasoning, Current Affairs, Polity, General Science, Static GK, English & Computer Knowledge.
                </p>
              </div>
              <button
                onClick={() => onNavigate('ssc-chsl')}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] transition-colors"
              >
                Enter SSC CHSL Portal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examTracks.map((track) => (
              <button
                key={track.name}
                onClick={() => onNavigate(track.route, track.param)}
                className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8] dark:hover:border-blue-500 transition-colors flex flex-col justify-between gap-3"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{track.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{track.desc}</p>
                </div>
                <span className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400 inline-flex items-center gap-1">
                  Open preparation page <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Core AI & Academic Learning Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Core Learning Platform
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-1">
            AI Teaching, Assessment, Law & Research
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspacePillars.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => onNavigate(item.route)}
                className="text-left p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8] dark:hover:border-blue-500 transition-colors space-y-3"
              >
                <Icon className="w-6 h-6 text-[#1D4ED8] dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Legal Education & Research Feature Band */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-5 items-stretch">
            <div className="sm:col-span-2 min-h-[180px]">
              <SafeImage
                src="/src/assets/images/legal_constitution_hall_1795280839383.jpg"
                alt="Indian Constitution and Legal Studies"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-3 p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  India Code · Supreme Court · eCourts
                </p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                  Indian Legal Education Centre
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  26 statutory subjects, BNS/BNSS/BSA transition tables, Judiciary & AIBE preparation, and 105+ legal blog articles.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('legal-centre')}
                  className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
                >
                  Open Legal Centre
                </button>
                <button
                  onClick={() => onNavigate('legal-blogs')}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  105+ Legal Blogs
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-5 items-stretch">
            <div className="sm:col-span-2 min-h-[180px]">
              <SafeImage
                src="/src/assets/images/ai_learning_research_1795280839820.jpg"
                alt="Academic Research and Study Workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-3 p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grounded Sources · Verified URLs
                </p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                  Research, Scholarships & Study Workspace
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  Discover real research articles with source URLs, upload PDFs for AI revision notes, and track NSP scholarships.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('research')}
                  className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700"
                >
                  Research Finder
                </button>
                <button
                  onClick={() => onNavigate('scholarships')}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Scholarship Finder
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Complete Ecosystem Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            All Platform Modules
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
            Explore Every Academic & Career Service
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondarySections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.title}
                onClick={() => onNavigate(sec.route)}
                className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1D4ED8] dark:hover:border-blue-500 transition-colors space-y-2.5"
              >
                <Icon className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{sec.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sec.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Privacy & Official Academic Commitment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#0B1F3A] text-white p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs text-blue-300 font-medium">
              <Shield className="w-4 h-4" />
              <span>Student Privacy & Verified Academic Integrity</span>
            </div>
            <h2 className="text-2xl font-semibold">
              Your Questions, Notes & Files Stay Private Unless You Choose to Share
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every student account uses Firebase Authentication and strict Firestore ownership rules. Official support & inquiries: anurag706879@gmail.com
            </p>
          </div>
          <button
            onClick={() => onNavigate(user && isVerified ? 'ai-teacher' : 'auth')}
            className="px-6 py-3 rounded-lg bg-white text-[#0B1F3A] text-sm font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {user && isVerified ? 'Ask AI Teacher Now' : 'Get Started Free'}
          </button>
        </div>
      </section>
    </div>
  );
}
