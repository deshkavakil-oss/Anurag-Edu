import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Download,
  ExternalLink,
  FileUp,
  FolderOpen,
  GraduationCap,
  Layers,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EDUCATION_TRACKS, INDIAN_UNIVERSITIES } from '../data/educationSystem';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface WorkspaceToolsPageProps {
  mode: 'files' | 'notes' | 'study-planner' | 'education-system';
  onNavigate: (route: AppRoute) => void;
}

interface FolderDoc {
  id: string;
  name: string;
  subject: string;
}

interface UploadedFileDoc {
  id: string;
  folderId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  subject: string;
  textPreview?: string;
  extractedSummary?: string;
}

interface NoteDoc {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  noteType: 'personal' | 'ai_notes' | 'formula_sheet' | 'revision' | 'flashcards';
  content: string;
}

interface StudyTask {
  id: string;
  dayRange: string;
  subject: string;
  phase: string;
  title: string;
  completed: boolean;
}

interface StudyPlanDoc {
  id: string;
  exam: string;
  examDate: string;
  dailyHours: number;
  durationDays: number;
  weakSubjects?: string[];
  tasks: StudyTask[];
}

export function WorkspaceToolsPage({ mode, onNavigate }: WorkspaceToolsPageProps) {
  const { user, profile, isVerified, saveProfile, awardXp } = useAuth();
  const [toast, setToast] = useState('');

  // Files state
  const [folders, setFolders] = useState<FolderDoc[]>([]);
  const [files, setFiles] = useState<UploadedFileDoc[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeFolderId, setActiveFolderId] = useState('All');
  const [fileSubject, setFileSubject] = useState('General Studies');
  const [activeFile, setActiveFile] = useState<UploadedFileDoc | null>(null);
  const [fileQuestion, setFileQuestion] = useState('');
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [fileAnalysisOut, setFileAnalysisOut] = useState('');
  const [fileUploadBase64, setFileUploadBase64] = useState<Record<string, { b64: string; mime: string }>>({});
  const filePickerRef = useRef<HTMLInputElement>(null);

  // Notes & Flashcards state
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Indian Polity');
  const [noteType, setNoteType] = useState<NoteDoc['noteType']>('personal');
  const [noteContent, setNoteContent] = useState('');
  const [flippedCard, setFlippedCard] = useState<Record<number, boolean>>({});
  const [flashcardViewId, setFlashcardViewId] = useState<string | null>(null);

  // Study Planner state
  const [plans, setPlans] = useState<StudyPlanDoc[]>([]);
  const [planExam, setPlanExam] = useState(profile?.selectedExam || 'SSC CHSL');
  const [planDate, setPlanDate] = useState('2027-03-15');
  const [planHours, setPlanHours] = useState(4);
  const [planDays, setPlanDays] = useState<30 | 60 | 90>(30);
  const [planWeak, setPlanWeak] = useState('Mathematics, English Grammar');
  const [planLevel, setPlanLevel] = useState('Intermediate');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Education System & Syllabus state
  const [tierFilter, setTierFilter] = useState('All');
  const [selectedUniversity, setSelectedUniversity] = useState(INDIAN_UNIVERSITIES[0]);
  const [syllabusText, setSyllabusText] = useState(profile?.customSyllabus || '');

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (profile?.customSyllabus) setSyllabusText(profile.customSyllabus);
  }, [profile]);

  useEffect(() => {
    if (!user || !isVerified) return;
    const getTs = (d: unknown) => ((d as { seconds?: number } | undefined)?.seconds ?? 0);

    if (mode === 'files') {
      const u1 = onSnapshot(
        query(collection(db, 'folders'), where('userId', '==', user.uid)),
        (s) => setFolders(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FolderDoc, 'id'>) }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'folders')
      );
      const u2 = onSnapshot(
        query(collection(db, 'uploaded_files'), where('userId', '==', user.uid)),
        (s) => {
          const list = s.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<UploadedFileDoc, 'id'> & { createdAt?: unknown }) }))
            .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
          setFiles(list);
          localStorage.setItem('aec_offline_files', JSON.stringify(list.slice(0, 20)));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'uploaded_files')
      );
      return () => {
        u1();
        u2();
      };
    }

    if (mode === 'notes') {
      return onSnapshot(
        query(collection(db, 'notes'), where('userId', '==', user.uid)),
        (s) => {
          const list = s.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<NoteDoc, 'id'> & { createdAt?: unknown }) }))
            .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
          setNotes(list);
          localStorage.setItem('aec_offline_notes', JSON.stringify(list.slice(0, 30)));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'notes')
      );
    }

    if (mode === 'study-planner') {
      return onSnapshot(
        query(collection(db, 'study_plans'), where('userId', '==', user.uid)),
        (s) => {
          const list = s.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<StudyPlanDoc, 'id'> & { createdAt?: unknown }) }))
            .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
          setPlans(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'study_plans')
      );
    }
  }, [user, isVerified, mode]);

  if (mode === 'education-system') {
    const filteredTracks = EDUCATION_TRACKS.filter(
      (t) => tierFilter === 'All' || t.tier === tierFilter
    );

    const handleSaveSyllabus = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !isVerified) {
        onNavigate('auth');
        return;
      }
      await saveProfile({
        institution: selectedUniversity,
        customSyllabus: syllabusText.slice(0, 7800),
      });
      showToast('University & custom syllabus saved to your verified profile!');
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            School · Undergraduate · Postgraduate · Skills
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#1D4ED8]" /> Complete Indian Education System
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Structured learning pathways from Class 1–12 NCERT/CBSE/State Boards through UG, PG, Technical &amp; Research degrees.
          </p>
        </div>

        {toast && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            {toast}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {['All', 'School Education', 'Undergraduate', 'Postgraduate', 'Other Education'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
                tierFilter === t
                  ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTracks.map((tr) => (
            <div key={tr.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">{tr.tier}</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tr.title}</h2>
              <p className="text-xs text-slate-500">Boards / Streams: {tr.boardsOrStreams.join(' · ')}</p>
              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                {tr.coreSubjects.map((sub) => (
                  <li key={sub}>{sub}</li>
                ))}
              </ul>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <a
                  href={tr.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  {tr.portalLabel} <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => onNavigate('ai-teacher')}
                  className="text-slate-700 dark:text-slate-300 hover:underline font-medium"
                >
                  Ask AI Teacher about this track →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* College & University Custom Syllabus Uploader */}
        <form onSubmit={handleSaveSyllabus} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            University Syllabus &amp; Semester Focus Saver
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Select Indian University / Board</label>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                {INDIAN_UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Paste Your Course / Semester Syllabus</label>
            <textarea
              rows={5}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste your semester syllabus topics (e.g., Unit 1 Constitutional Law, Unit 2 Law of Torts)..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]">
            {user && isVerified ? 'Save Syllabus to Student Profile' : 'Sign In to Save Syllabus'}
          </button>
        </form>
      </div>
    );
  }

  if (!user || !isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Verified Student Account Required
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your personal file library, AI notes, flashcards, and smart study timetables are privately stored and synced across devices for verified student accounts.
        </p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]"
        >
          Open Login / Registration
        </button>
      </div>
    );
  }

  if (mode === 'files') {
    const handleCreateFolder = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      try {
        await addDoc(collection(db, 'folders'), {
          userId: user.uid,
          name: newFolderName.trim(),
          subject: fileSubject,
          createdAt: serverTimestamp(),
        });
        setNewFolderName('');
        showToast('Folder created.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'folders');
      }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) {
        showToast('Maximum file size is 20 MB.');
        return;
      }

      const isText = f.type.startsWith('text/') || /\.(txt|csv|md|json)$/i.test(f.name);
      const reader = new FileReader();
      reader.onload = async () => {
        const res = String(reader.result || '');
        let textPreview = '';
        if (isText) {
          textPreview = res.slice(0, 40000);
        } else {
          const b64 = res.split(',')[1] || '';
          setFileUploadBase64((prev) => ({
            ...prev,
            [f.name]: { b64, mime: f.type || 'application/pdf' },
          }));
          textPreview = `Uploaded binary file (${f.type || 'document'}), ${(f.size / 1024).toFixed(1)} KB.`;
        }

        try {
          const docRef = await addDoc(collection(db, 'uploaded_files'), {
            userId: user.uid,
            ...(activeFolderId !== 'All' ? { folderId: activeFolderId } : {}),
            name: f.name.slice(0, 190),
            mimeType: f.type || 'application/octet-stream',
            sizeBytes: f.size,
            subject: fileSubject,
            textPreview,
            createdAt: serverTimestamp(),
          });
          setActiveFile({
            id: docRef.id,
            name: f.name,
            mimeType: f.type || 'application/octet-stream',
            sizeBytes: f.size,
            subject: fileSubject,
            textPreview,
          });
          showToast('File added to your Digital Library.');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'uploaded_files');
        }
      };

      if (isText) reader.readAsText(f);
      else reader.readAsDataURL(f);
    };

    const handleAnalyzeFile = async (task: 'summarize' | 'notes' | 'flashcards' | 'qa') => {
      if (!activeFile) return;
      if (task === 'qa' && !fileQuestion.trim()) return;
      setAnalyzingFile(true);
      setFileAnalysisOut('');
      try {
        const cachedBin = fileUploadBase64[activeFile.name];
        const resp = await fetch('/api/ai/document-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: activeFile.name,
            textContent: activeFile.textPreview || '',
            base64Data: cachedBin?.b64,
            mimeType: cachedBin?.mime,
            task,
            question: fileQuestion,
          }),
        });
        const data = (await resp.json()) as { result?: string; hindiError?: string };
        if (!resp.ok || !data.result) {
          setFileAnalysisOut(data.hindiError || 'Unable to analyze this document right now.');
          return;
        }
        setFileAnalysisOut(data.result);
        if (task === 'summarize') {
          await updateDoc(doc(db, 'uploaded_files', activeFile.id), {
            extractedSummary: data.result.slice(0, 14000),
          });
        }
        await awardXp(10);
      } catch {
        setFileAnalysisOut('Network error analyzing document.');
      } finally {
        setAnalyzingFile(false);
      }
    };

    const visibleFiles = files.filter((f) => activeFolderId === 'All' || f.folderId === activeFolderId);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Private Student Vault (Max 20 MB per file)
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-[#1D4ED8]" /> Digital Student File Library &amp; AI Analyzer
            </h1>
          </div>
          <div>
            <input
              ref={filePickerRef}
              type="file"
              accept=".pdf,.txt,.csv,.md,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => filePickerRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
            >
              <FileUp className="w-4 h-4" /> Upload Study File
            </button>
          </div>
        </div>

        {toast && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 space-y-4">
            <form onSubmit={handleCreateFolder} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Folders &amp; Upload Subject</p>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name (e.g., SSC Maths)"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
              />
              <div className="flex gap-2">
                <input
                  value={fileSubject}
                  onChange={(e) => setFileSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium">
                  Add Folder
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFolderId('All')}
                  className={`px-2.5 py-1 rounded text-xs ${activeFolderId === 'All' ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  All Files ({files.length})
                </button>
                {folders.map((fld) => (
                  <button
                    key={fld.id}
                    type="button"
                    onClick={() => setActiveFolderId(fld.id)}
                    className={`px-2.5 py-1 rounded text-xs ${activeFolderId === fld.id ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    {fld.name}
                  </button>
                ))}
              </div>
            </form>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Saved Documents</p>
              {visibleFiles.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">Upload PDFs, TXT notes, CSVs, or study photos to inspect and analyze them.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {visibleFiles.map((fl) => (
                    <div
                      key={fl.id}
                      onClick={() => {
                        setActiveFile(fl);
                        setFileAnalysisOut(fl.extractedSummary || '');
                      }}
                      className={`py-2.5 px-2 rounded cursor-pointer flex items-center justify-between gap-2 ${
                        activeFile?.id === fl.id ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{fl.name}</p>
                        <p className="text-xs text-slate-500">{fl.subject} · {(fl.sizeBytes / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        aria-label="Delete file"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteDoc(doc(db, 'uploaded_files', fl.id));
                          if (activeFile?.id === fl.id) setActiveFile(null);
                        }}
                        className="text-slate-400 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            {!activeFile ? (
              <p className="text-sm text-slate-500 py-12 text-center">
                Select or upload a document to summarize, generate revision notes, create flashcards, or ask Q&amp;A.
              </p>
            ) : (
              <>
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeFile.name}</h2>
                  <p className="text-xs text-slate-500">{activeFile.subject} · {activeFile.mimeType}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={analyzingFile} onClick={() => handleAnalyzeFile('summarize')} className="px-3.5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium disabled:opacity-50">
                    Summarize
                  </button>
                  <button disabled={analyzingFile} onClick={() => handleAnalyzeFile('notes')} className="px-3.5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium disabled:opacity-50">
                    Extract Study Notes
                  </button>
                  <button disabled={analyzingFile} onClick={() => handleAnalyzeFile('flashcards')} className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium disabled:opacity-50">
                    Create Flashcards
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={fileQuestion}
                    onChange={(e) => setFileQuestion(e.target.value)}
                    placeholder="Ask a specific question about this document..."
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                  <button
                    disabled={analyzingFile || !fileQuestion.trim()}
                    onClick={() => handleAnalyzeFile('qa')}
                    className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium disabled:opacity-50"
                  >
                    Ask Doc
                  </button>
                </div>
                {analyzingFile && <p className="text-xs text-[#1D4ED8]">Analyzing document with Gemini...</p>}
                {fileAnalysisOut && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {fileAnalysisOut}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'notes') {
    const handleSaveNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noteTitle.trim() || !noteContent.trim()) return;
      try {
        await addDoc(collection(db, 'notes'), {
          userId: user.uid,
          title: noteTitle.trim(),
          subject: noteSubject,
          noteType,
          content: noteContent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setNoteTitle('');
        setNoteContent('');
        showToast('Saved to Notes & Flashcards (synced across devices).');
        await awardXp(10);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'notes');
      }
    };

    const parseFlashcards = (text: string) => {
      const pairs: { q: string; a: string }[] = [];
      const blocks = text.split(/\n(?=Q:|Question:|\d+\.)/i);
      for (const blk of blocks) {
        const parts = blk.split(/\n(?=A:|Answer:)/i);
        if (parts.length >= 2) {
          pairs.push({
            q: parts[0].replace(/^(Q:|Question:|\d+\.)\s*/i, '').trim(),
            a: parts.slice(1).join(' ').replace(/^(A:|Answer:)\s*/i, '').trim(),
          });
        }
      }
      if (pairs.length === 0) {
        return text
          .split('\n')
          .filter((l) => l.trim().length > 4)
          .slice(0, 8)
          .map((line, i) => ({ q: `Revision Card #${i + 1}`, a: line }));
      }
      return pairs;
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Offline-Cached Revision Vault
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#1D4ED8]" /> Study Notes, Formula Sheets &amp; Flashcards
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium no-print"
          >
            <Download className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
        </div>

        {toast && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveNote} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit no-print">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1D4ED8]" /> Create Study Note / Card
            </h2>
            <input required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title (e.g., Constitutional Amendments)" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} placeholder="Subject" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
              <select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteDoc['noteType'])} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs">
                <option value="personal">Personal Note</option>
                <option value="formula_sheet">Formula Sheet</option>
                <option value="revision">Revision Capsule</option>
                <option value="flashcards">Flashcards (Q:/A:)</option>
              </select>
            </div>
            <textarea required rows={7} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write notes or Q: / A: flashcard pairs..." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs" />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]">
              Save Note
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {notes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
                No notes yet. Create one manually or save any AI Teacher explanation directly to your notes.
              </div>
            ) : (
              notes.map((n) => {
                const isCardMode = flashcardViewId === n.id;
                const cards = isCardMode ? parseFlashcards(n.content) : [];
                return (
                  <div key={n.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#1D4ED8] font-medium">
                          {n.subject} · {n.noteType.replace('_', ' ')}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 no-print">
                        <button
                          onClick={() => {
                            setFlashcardViewId(isCardMode ? null : n.id);
                            setFlippedCard({});
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs"
                        >
                          <Layers className="w-3.5 h-3.5" /> {isCardMode ? 'Text View' : 'Flip Cards'}
                        </button>
                        <button
                          aria-label="Delete note"
                          onClick={() => void deleteDoc(doc(db, 'notes', n.id))}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isCardMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {cards.map((c, cIdx) => {
                          const flipped = Boolean(flippedCard[cIdx]);
                          return (
                            <button
                              key={cIdx}
                              onClick={() => setFlippedCard((p) => ({ ...p, [cIdx]: !p[cIdx] }))}
                              className="text-left p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 min-h-[110px] flex flex-col justify-between"
                            >
                              <p className="text-xs font-mono text-[#1D4ED8]">
                                {flipped ? 'Answer' : 'Question'} (Click to flip)
                              </p>
                              <p className="text-sm text-slate-900 dark:text-white mt-1">
                                {flipped ? c.a : c.q}
                              </p>
                              <RotateCw className="w-3.5 h-3.5 text-slate-400 self-end" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Smart Study Planner (30 / 60 / 90 days)
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingPlan(true);
    setPlanError('');
    try {
      const weakList = planWeak
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const resp = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: planExam,
          examDate: planDate,
          dailyHours: Number(planHours) || 4,
          durationDays: planDays,
          weakSubjects: weakList,
          level: planLevel,
        }),
      });
      const data = (await resp.json()) as {
        tasks?: StudyTask[];
        hindiError?: string;
      };
      if (!resp.ok || !Array.isArray(data.tasks) || data.tasks.length === 0) {
        setPlanError(
          data.hindiError ||
            'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें।'
        );
        return;
      }
      await addDoc(collection(db, 'study_plans'), {
        userId: user.uid,
        exam: planExam,
        examDate: planDate,
        dailyHours: Number(planHours) || 4,
        durationDays: planDays,
        weakSubjects: weakList,
        tasks: data.tasks,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`${planDays}-day smart study timetable saved!`);
      await awardXp(15);
    } catch {
      setPlanError('Network error generating study plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const togglePlanTask = async (plan: StudyPlanDoc, taskId: string) => {
    const nextTasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    try {
      await updateDoc(doc(db, 'study_plans', plan.id), {
        tasks: nextTasks,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `study_plans/${plan.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
          30 / 60 / 90-Day Adaptive Timetables
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#1D4ED8]" /> Smart Study Planner
        </h1>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          {toast}
        </div>
      )}
      {planError && (
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          {planError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleGeneratePlan} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 h-fit">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1D4ED8]" /> Generate Timetable
          </h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Target Examination</label>
            <input value={planExam} onChange={(e) => setPlanExam(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Exam Date</label>
              <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Daily Hours</label>
              <input type="number" min={1} max={16} value={planHours} onChange={(e) => setPlanHours(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Plan Horizon</label>
              <select value={planDays} onChange={(e) => setPlanDays(Number(e.target.value) as 30 | 60 | 90)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs">
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Current Level</label>
              <select value={planLevel} onChange={(e) => setPlanLevel(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Weak Subjects (comma-separated)</label>
            <input value={planWeak} onChange={(e) => setPlanWeak(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs" />
          </div>
          <button
            type="submit"
            disabled={generatingPlan}
            className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
          >
            {generatingPlan ? 'Building Smart Plan...' : `Create ${planDays}-Day Plan`}
          </button>
        </form>

        <div className="lg:col-span-8 space-y-4">
          {plans.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
              Generate your personalized 30, 60, or 90-day study schedule on the left to track daily tasks.
            </div>
          ) : (
            plans.map((pl) => {
              const done = pl.tasks.filter((t) => t.completed).length;
              return (
                <div key={pl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {pl.exam} · {pl.durationDays}-Day Plan ({pl.dailyHours} hrs/day)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Target Date: {pl.examDate} · Progress: {done}/{pl.tasks.length} milestones
                      </p>
                    </div>
                    <button
                      aria-label="Delete study plan"
                      onClick={() => void deleteDoc(doc(db, 'study_plans', pl.id))}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pl.tasks.map((t) => (
                      <label key={t.id} className="py-2.5 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => void togglePlanTask(pl, t.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                            {t.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.dayRange} · {t.subject} · {t.phase}
                          </p>
                        </div>
                        <CheckSquare className={`w-4 h-4 shrink-0 ${t.completed ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
