import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { AecLogo } from './components/AecLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallBanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AiTeacherPage } from './pages/AiTeacherPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamsAndSscPage } from './pages/ExamsAndSscPage';
import { HomePage, type AppRoute } from './pages/HomePage';
import { InfoAndAdminPage } from './pages/InfoAndAdminPage';
import { LegalPortalPage } from './pages/LegalPortalPage';
import { MockTestAndBattlePage } from './pages/MockTestAndBattlePage';
import { OpportunitiesAndGuidancePage } from './pages/OpportunitiesAndGuidancePage';
import { PublicQaAndCommunityPage } from './pages/PublicQaAndCommunityPage';
import { WorkspaceToolsPage } from './pages/WorkspaceToolsPage';

const ECOSYSTEM_DIRECTORY: { group: string; items: { label: string; route: AppRoute }[] }[] = [
  {
    group: 'Core Learning & Exams',
    items: [
      { label: 'Student Dashboard', route: 'dashboard' },
      { label: 'AI Student Teacher', route: 'ai-teacher' },
      { label: 'SSC CHSL Complete Portal', route: 'ssc-chsl' },
      { label: 'All 22 Government Exams', route: 'exams' },
      { label: 'Timed Mock Test Engine', route: 'mock-tests' },
      { label: 'Live WebSocket Quiz Battle', route: 'quiz-battle' },
    ],
  },
  {
    group: 'Legal & Academic Research',
    items: [
      { label: 'Indian Legal Education Centre (26 Acts)', route: 'legal-centre' },
      { label: '105+ Legal Blogs Library', route: 'legal-blogs' },
      { label: 'AI Legal & Academic Blog Studio', route: 'blog-generator' },
      { label: 'Research & Source Finder', route: 'research' },
      { label: 'Current Affairs Centre', route: 'current-affairs' },
      { label: 'Complete Indian Education System', route: 'education-system' },
    ],
  },
  {
    group: 'Study Vault & Opportunities',
    items: [
      { label: 'Digital File Library & AI Analyzer', route: 'files' },
      { label: 'Study Notes & Flip Flashcards', route: 'notes' },
      { label: 'Smart Study Planner (30/60/90d)', route: 'study-planner' },
      { label: 'Public Student Q&A Library', route: 'public-qa' },
      { label: 'Verified Student Community', route: 'community' },
      { label: 'Career Guidance Engine', route: 'career' },
      { label: 'AI Interview & Viva Practice', route: 'interview' },
      { label: 'Scholarship Finder', route: 'scholarships' },
      { label: 'Govt Alerts & Video Portals', route: 'alerts-videos' },
      { label: 'Parent Progress Dashboard', route: 'parent-progress' },
    ],
  },
];

function AppShell() {
  const { user, isVerified, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [route, setRoute] = useState<AppRoute>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (nextRoute: AppRoute, param?: string) => {
    setRoute(nextRoute);
    setRouteParam(param);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as AppRoute;
      if (h) setRoute(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const topNavLinks: { label: string; route: AppRoute }[] = [
    { label: 'Home', route: 'home' },
    { label: 'SSC CHSL', route: 'ssc-chsl' },
    { label: 'AI Teacher', route: 'ai-teacher' },
    { label: 'Mock Tests', route: 'mock-tests' },
    { label: 'Legal Centre', route: 'legal-centre' },
  ];

  const renderPage = () => {
    switch (route) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'auth':
        return <AuthPage onSuccess={() => navigate('dashboard')} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'ai-teacher':
        return <AiTeacherPage onNavigate={navigate} />;
      case 'exams':
        return <ExamsAndSscPage mode="exams" initialExamId={routeParam} onNavigate={navigate} />;
      case 'ssc-chsl':
        return <ExamsAndSscPage mode="ssc-chsl" onNavigate={navigate} />;
      case 'mock-tests':
        return <MockTestAndBattlePage mode="mock-tests" onNavigate={navigate} />;
      case 'quiz-battle':
        return <MockTestAndBattlePage mode="quiz-battle" onNavigate={navigate} />;
      case 'public-qa':
        return <PublicQaAndCommunityPage mode="public-qa" onNavigate={navigate} />;
      case 'community':
        return <PublicQaAndCommunityPage mode="community" onNavigate={navigate} />;
      case 'legal-centre':
        return <LegalPortalPage mode="legal-centre" onNavigate={navigate} />;
      case 'legal-blogs':
        return <LegalPortalPage mode="legal-blogs" onNavigate={navigate} />;
      case 'blog-generator':
        return <LegalPortalPage mode="blog-generator" onNavigate={navigate} />;
      case 'files':
        return <WorkspaceToolsPage mode="files" onNavigate={navigate} />;
      case 'notes':
        return <WorkspaceToolsPage mode="notes" onNavigate={navigate} />;
      case 'study-planner':
        return <WorkspaceToolsPage mode="study-planner" onNavigate={navigate} />;
      case 'education-system':
        return <WorkspaceToolsPage mode="education-system" onNavigate={navigate} />;
      case 'current-affairs':
        return <OpportunitiesAndGuidancePage mode="current-affairs" onNavigate={navigate} />;
      case 'research':
        return <OpportunitiesAndGuidancePage mode="research" onNavigate={navigate} />;
      case 'career':
        return <OpportunitiesAndGuidancePage mode="career" onNavigate={navigate} />;
      case 'interview':
        return <OpportunitiesAndGuidancePage mode="interview" onNavigate={navigate} />;
      case 'scholarships':
        return <OpportunitiesAndGuidancePage mode="scholarships" onNavigate={navigate} />;
      case 'alerts-videos':
        return <OpportunitiesAndGuidancePage mode="alerts-videos" onNavigate={navigate} />;
      case 'parent-progress':
        return <InfoAndAdminPage mode="parent-progress" onNavigate={navigate} />;
      case 'admin':
        return <InfoAndAdminPage mode="admin" onNavigate={navigate} />;
      case 'info-about':
        return <InfoAndAdminPage mode="info-about" onNavigate={navigate} />;
      case 'info-contact':
        return <InfoAndAdminPage mode="info-contact" onNavigate={navigate} />;
      case 'info-privacy':
        return <InfoAndAdminPage mode="info-privacy" onNavigate={navigate} />;
      case 'info-terms':
        return <InfoAndAdminPage mode="info-terms" onNavigate={navigate} />;
      case 'info-disclaimer':
        return <InfoAndAdminPage mode="info-disclaimer" onNavigate={navigate} />;
      case 'info-help':
        return <InfoAndAdminPage mode="info-help" onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 3-Zone Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 text-left shrink-0"
          >
            <AecLogo size={34} />
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap">
                ANURAG EDUCATION CENTER
              </span>
              <span className="block text-[10px] tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">
                LEARN • RESEARCH • PRACTICE • SUCCEED
              </span>
            </div>
          </button>

          {/* Center: 5 Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
            {topNavLinks.map((link) => (
              <button
                key={link.route}
                onClick={() => navigate(link.route)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  route === link.route
                    ? 'text-[#1D4ED8] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0B1F3A] dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right: 1 Primary CTA + Ecosystem Drawer Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate(user && isVerified ? 'dashboard' : 'auth')}
              className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] transition-colors whitespace-nowrap shrink-0"
            >
              {user && isVerified ? 'Dashboard' : 'Student Portal'}
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open All Platform Modules"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Modules</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Full Ecosystem Directory & Workspace Controls */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#1D4ED8]" />
                <span className="text-base font-semibold text-slate-900 dark:text-white">
                  AEC Complete Directory
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close Directory"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <PWAInstallButton />
              {user && (
                <button
                  onClick={async () => {
                    await logout();
                    navigate('home');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 dark:text-red-400"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => navigate('admin')}
                className="w-full text-left px-3.5 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-[#1D4ED8] dark:text-blue-300"
              >
                Open Admin Control Panel
              </button>
            )}

            <div className="space-y-5">
              {ECOSYSTEM_DIRECTORY.map((sec) => (
                <div key={sec.group} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {sec.group}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {sec.items.map((item) => (
                      <button
                        key={item.route}
                        onClick={() => navigate(item.route)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          route === item.route
                            ? 'bg-[#0B1F3A] text-white font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{renderPage()}</main>

      <OfflineIndicator />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-bold text-[#0B1F3A] dark:text-white">
              ANURAG EDUCATION CENTER (AEC)
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              India’s unified AI-powered learning, SSC &amp; competitive exam preparation, legal education, and academic research workspace.
            </p>
            <p className="text-slate-500">
              Official Contact: <a href="mailto:anurag706879@gmail.com" className="text-[#1D4ED8] hover:underline">anurag706879@gmail.com</a>
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white">Academic Portals</p>
            <div className="flex flex-col gap-1.5 text-slate-600 dark:text-slate-400">
              <button onClick={() => navigate('ssc-chsl')} className="text-left hover:text-[#1D4ED8]">SSC CHSL Preparation</button>
              <button onClick={() => navigate('exams')} className="text-left hover:text-[#1D4ED8]">All 22 Govt Exams</button>
              <button onClick={() => navigate('legal-centre')} className="text-left hover:text-[#1D4ED8]">Legal Education (BNS/BNSS/BSA)</button>
              <button onClick={() => navigate('legal-blogs')} className="text-left hover:text-[#1D4ED8]">105+ Legal Blogs</button>
              <button onClick={() => navigate('scholarships')} className="text-left hover:text-[#1D4ED8]">Scholarship Finder</button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white">Information &amp; Policies</p>
            <div className="flex flex-col gap-1.5 text-slate-600 dark:text-slate-400">
              <button onClick={() => navigate('info-about')} className="text-left hover:text-[#1D4ED8]">About Us</button>
              <button onClick={() => navigate('info-contact')} className="text-left hover:text-[#1D4ED8]">Contact Us</button>
              <button onClick={() => navigate('info-privacy')} className="text-left hover:text-[#1D4ED8]">Privacy Policy</button>
              <button onClick={() => navigate('info-terms')} className="text-left hover:text-[#1D4ED8]">Terms &amp; Conditions</button>
              <button onClick={() => navigate('info-disclaimer')} className="text-left hover:text-[#1D4ED8]">Legal &amp; Exam Disclaimer</button>
              <button onClick={() => navigate('info-help')} className="text-left hover:text-[#1D4ED8]">Help Centre</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
