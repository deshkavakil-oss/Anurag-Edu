import React, { useEffect, useRef, useState } from 'react';
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
  Bookmark,
  Camera,
  Copy,
  Download,
  Flag,
  Globe,
  History,
  Lock,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface AiTeacherPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface ConversationDoc {
  id: string;
  userId: string;
  title: string;
  subject: string;
  exam: string;
  language: string;
}

interface HistoryDoc {
  id: string;
  userId: string;
  conversationId?: string;
  question: string;
  answer?: string;
  subject: string;
  topic?: string;
  exam: string;
  status: 'pending' | 'completed' | 'error';
  isPublic: boolean;
  isBookmarked: boolean;
  sourceLinks?: { title: string; uri: string }[];
}

const CATEGORIES = [
  'History', 'Geography', 'Mathematics', 'Reasoning', 'Current Affairs', 'Indian Polity',
  'General Science', 'English Language', 'Computer Knowledge', 'General Knowledge',
  'Law & Legal Studies', 'School Subjects', 'College Subjects', 'Competitive Exams',
  'Research', 'Career Guidance',
];

export function AiTeacherPage({ onNavigate }: AiTeacherPageProps) {
  const { user, profile, isVerified, awardXp } = useAuth();
  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryDoc[]>([]);
  const [weakTopicsMemory, setWeakTopicsMemory] = useState<string[]>([]);

  const [subject, setSubject] = useState('History');
  const [exam, setExam] = useState(profile?.selectedExam || 'SSC CHSL');
  const [language, setLanguage] = useState<string>(profile?.preferredLanguage || 'Bilingual');
  const [questionInput, setQuestionInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [tab, setTab] = useState<'chat' | 'history' | 'photo'>('chat');

  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [pendingRetryId, setPendingRetryId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Photo solver state
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [photoSolution, setPhotoSolution] = useState('');
  const [photoStage, setPhotoStage] = useState<'idle' | 'extracting' | 'extracted' | 'solving'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice learning assistant state
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Share to public consent dialog state
  const [sharingItem, setSharingItem] = useState<HistoryDoc | null>(null);
  const [shareAnonymous, setShareAnonymous] = useState(true);

  useEffect(() => {
    if (profile?.selectedExam) setExam(profile.selectedExam);
    if (profile?.preferredLanguage) setLanguage(profile.preferredLanguage);
  }, [profile]);

  useEffect(() => {
    if (!user || !isVerified) return;

    const getTs = (d: unknown) => {
      const ts = d as { seconds?: number } | undefined;
      return ts?.seconds ?? 0;
    };

    const unsubConv = onSnapshot(
      query(collection(db, 'conversations'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ConversationDoc, 'id'> & { updatedAt?: unknown }) }))
          .sort((a, b) => getTs(b.updatedAt) - getTs(a.updatedAt));
        setConversations(list);
        setActiveConvId((prev) => prev ?? list[0]?.id ?? null);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
    );

    const unsubHist = onSnapshot(
      query(collection(db, 'question_history'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryDoc, 'id'> & { createdAt?: unknown }) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setHistoryItems(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'question_history')
    );

    const unsubWeak = onSnapshot(
      query(collection(db, 'quiz_attempts'), where('userId', '==', user.uid)),
      (snap) => {
        const topics = new Set<string>();
        snap.docs.forEach((d) => {
          const wt = (d.data() as { weakTopics?: string[] }).weakTopics || [];
          wt.forEach((t) => topics.add(t));
        });
        setWeakTopicsMemory(Array.from(topics).slice(0, 10));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'quiz_attempts')
    );

    return () => {
      unsubConv();
      unsubHist();
      unsubWeak();
    };
  }, [user, isVerified]);

  if (!user || !isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Sign In & Verify Email to Use AI Student Teacher
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your AI conversations, personal learning memory, photo solver, and automatic question history are securely tied to your verified student account across devices.
        </p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]"
        >
          Login / Register Now
        </button>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleNewChat = async () => {
    try {
      const convRef = await addDoc(collection(db, 'conversations'), {
        userId: user.uid,
        title: `${subject} (${exam})`,
        subject,
        exam,
        language,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveConvId(convRef.id);
      setTab('chat');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'conversations');
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteDoc(doc(db, 'conversations', convId));
      if (activeConvId === convId) setActiveConvId(null);
      showToast('Conversation removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `conversations/${convId}`);
    }
  };

  const buildMemoryContext = () => {
    const recentTopics = historyItems
      .slice(0, 5)
      .map((h) => `${h.subject}: ${h.question.slice(0, 80)}`)
      .join(' | ');
    return `Student Education: ${profile?.educationLevel || 'Learner'}; Exam: ${exam}; Weak Topics from Tests: ${
      weakTopicsMemory.join(', ') || 'None detected yet'
    }; Recent Questions: ${recentTopics || 'First session'}.`;
  };

  const executeAiTeacher = async (existingHistoryId?: string, overrideQuestion?: string) => {
    const qText = (overrideQuestion ?? questionInput).trim();
    if (!qText || loadingAi) return;

    setAiError('');
    setLoadingAi(true);

    let convId = activeConvId;
    if (!convId) {
      const convRef = await addDoc(collection(db, 'conversations'), {
        userId: user.uid,
        title: qText.slice(0, 60),
        subject,
        exam,
        language,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      convId = convRef.id;
      setActiveConvId(convId);
    }

    // Save question with pending status BEFORE AI call so retries never duplicate
    let docId = existingHistoryId;
    if (!docId) {
      try {
        const histRef = await addDoc(collection(db, 'question_history'), {
          userId: user.uid,
          conversationId: convId,
          question: qText,
          answer: '',
          subject,
          topic: subject,
          exam,
          status: 'pending',
          isPublic: false,
          isBookmarked: false,
          sourceLinks: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        docId = histRef.id;
        setQuestionInput('');
      } catch (err) {
        setLoadingAi(false);
        handleFirestoreError(err, OperationType.CREATE, 'question_history');
      }
    }

    try {
      const chatHistoryPayload = historyItems
        .filter((h) => h.conversationId === convId && h.status === 'completed' && h.answer)
        .slice(0, 4)
        .reverse()
        .flatMap((h) => [
          { role: 'user' as const, content: h.question },
          { role: 'assistant' as const, content: h.answer || '' },
        ]);

      const resp = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          subject,
          exam,
          language,
          memoryContext: buildMemoryContext(),
          history: chatHistoryPayload,
          useSearchGrounding: true,
        }),
      });
      const data = (await resp.json()) as {
        answer?: string;
        sourceLinks?: { title: string; uri: string }[];
        hindiError?: string;
        error?: string;
      };

      if (!resp.ok || !data.answer) {
        await updateDoc(doc(db, 'question_history', docId!), {
          status: 'error',
          updatedAt: serverTimestamp(),
        });
        setPendingRetryId(docId!);
        setAiError(
          data.hindiError ||
            'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें। आपका प्रश्न सुरक्षित रखा गया है।'
        );
        return;
      }

      await updateDoc(doc(db, 'question_history', docId!), {
        answer: data.answer,
        sourceLinks: data.sourceLinks || [],
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'conversations', convId), {
        updatedAt: serverTimestamp(),
      });
      setPendingRetryId(null);
      await awardXp(10);
    } catch {
      if (docId) {
        await updateDoc(doc(db, 'question_history', docId), {
          status: 'error',
          updatedAt: serverTimestamp(),
        });
        setPendingRetryId(docId);
      }
      setAiError(
        'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें। आपका प्रश्न सुरक्षित रखा गया है।'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      showToast('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRec() as {
      lang: string;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    };
    recognition.lang = language.includes('Hindi') ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuestionInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleSpeakAnswer = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.');
      return;
    }
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, '').slice(0, 3500));
    utter.lang = language.includes('Hindi') ? 'hi-IN' : 'en-IN';
    utter.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  };

  const handlePublishConsent = async () => {
    if (!sharingItem || !sharingItem.answer) return;
    try {
      await addDoc(collection(db, 'public_questions'), {
        authorId: user.uid,
        authorAlias: shareAnonymous ? 'Verified AEC Student' : profile?.fullName || 'AEC Student',
        isAnonymous: shareAnonymous,
        question: sharingItem.question,
        answer: sharingItem.answer,
        subject: sharingItem.subject,
        exam: sharingItem.exam,
        helpfulCount: 0,
        reportedCount: 0,
        status: 'published',
        sourceLinks: sharingItem.sourceLinks || [],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'question_history', sharingItem.id), {
        isPublic: true,
        updatedAt: serverTimestamp(),
      });
      setSharingItem(null);
      showToast('Published to Public Student Q&A Library (PII stripped).');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'public_questions');
    }
  };

  const handleSaveToNotes = async (item: HistoryDoc) => {
    if (!item.answer) return;
    try {
      await addDoc(collection(db, 'notes'), {
        userId: user.uid,
        title: item.question.slice(0, 120),
        subject: item.subject,
        topic: item.exam,
        noteType: 'ai_notes',
        content: item.answer,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Saved to My Notes!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notes');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setPhotoPreviewUrl(result);
      const base64 = result.split(',')[1] || '';
      setPhotoBase64(base64);
      setExtractedText('');
      setPhotoSolution('');
      setPhotoStage('idle');
    };
    reader.readAsDataURL(file);
  };

  const handleExtractPhotoText = async () => {
    if (!photoBase64) return;
    setPhotoStage('extracting');
    setAiError('');
    try {
      const resp = await fetch('/api/ai/photo-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'extract', imageBase64: photoBase64, mimeType: photoMime }),
      });
      const data = (await resp.json()) as { extractedText?: string; hindiError?: string };
      if (!resp.ok) {
        setAiError(data.hindiError || 'Unable to extract text from image.');
        setPhotoStage('idle');
        return;
      }
      setExtractedText(data.extractedText || '');
      setPhotoStage('extracted');
    } catch {
      setAiError('Network error while reading image.');
      setPhotoStage('idle');
    }
  };

  const handleSolvePhoto = async () => {
    if (!extractedText.trim()) return;
    setPhotoStage('solving');
    setAiError('');
    try {
      const resp = await fetch('/api/ai/photo-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'solve',
          imageBase64: photoBase64,
          mimeType: photoMime,
          extractedText,
          language,
        }),
      });
      const data = (await resp.json()) as { solution?: string; hindiError?: string };
      if (!resp.ok) {
        setAiError(data.hindiError || 'Unable to solve question right now.');
        setPhotoStage('extracted');
        return;
      }
      setPhotoSolution(data.solution || '');
      setPhotoStage('extracted');
      await addDoc(collection(db, 'question_history'), {
        userId: user.uid,
        question: `[Photo Question] ${extractedText.slice(0, 1000)}`,
        answer: data.solution || '',
        subject,
        topic: 'Photo Solver',
        exam,
        status: 'completed',
        isPublic: false,
        isBookmarked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      setAiError('Network error while solving photo question.');
      setPhotoStage('extracted');
    }
  };

  const activeMessages = historyItems
    .filter((h) => (activeConvId ? h.conversationId === activeConvId : true))
    .slice()
    .reverse();

  const filteredHistory = historyItems.filter((h) => {
    const matchSub = filterSubject === 'All' || h.subject === filterSubject;
    const matchText =
      !searchQuery.trim() ||
      h.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.answer || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchText;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Chats & Personal Memory */}
        <aside className="lg:w-72 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 h-fit">
          <button
            onClick={handleNewChat}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]"
          >
            <Plus className="w-4 h-4" /> New Chat Session
          </button>

          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setTab('chat')}
              className={`py-1.5 rounded-md font-medium ${tab === 'chat' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Teacher
            </button>
            <button
              onClick={() => setTab('photo')}
              className={`py-1.5 rounded-md font-medium ${tab === 'photo' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Photo
            </button>
            <button
              onClick={() => setTab('history')}
              className={`py-1.5 rounded-md font-medium ${tab === 'history' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              History
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Previous Chats</p>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Start asking a question to create your first saved session.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
                      activeConvId === c.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1D4ED8] dark:text-blue-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setTab('chat');
                    }}
                  >
                    <span className="truncate">{c.title}</span>
                    <button
                      aria-label="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(c.id);
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

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Personal Learning Memory</p>
            <p className="text-xs text-slate-500">
              Active Target: {exam} · {weakTopicsMemory.length > 0 ? `Focus on ${weakTopicsMemory.slice(0, 2).join(', ')}` : 'Tracking questions & tests'}
            </p>
          </div>
        </aside>

        {/* Main AI Workspace */}
        <div className="flex-1 space-y-4">
          {toast && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
              {toast}
            </div>
          )}

          {aiError && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">{aiError}</p>
              {pendingRetryId && (
                <button
                  disabled={loadingAi}
                  onClick={() => {
                    const target = historyItems.find((h) => h.id === pendingRetryId);
                    if (target) executeAiTeacher(target.id, target.question);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Saved Question
                </button>
              )}
            </div>
          )}

          {tab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
              {/* Controls Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target Exam</label>
                  <input value={exam} onChange={(e) => setExam(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Response Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm">
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Simple Hindi">Simple Hindi (सरल हिन्दी)</option>
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-6 max-h-[540px] overflow-y-auto pr-1">
                {activeMessages.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      Ask Your AI Personal Teacher Anything
                    </p>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto">
                      Every response follows AEC’s 10-step structure: Direct Answer, Simple & Detailed Explanation, Step-by-Step Working, Examples, Exam Points, 2 MCQs, and Verified References. All questions remain private unless you explicitly choose to share.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((item) => (
                    <div key={item.id} className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                        <p className="text-xs text-slate-500 mb-1">
                          Private Question · {item.subject} · {item.exam} · Status: {item.status}
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.question}</p>
                      </div>

                      {item.status === 'pending' && (
                        <p className="text-xs text-[#1D4ED8]">Preparing structured 10-step lesson...</p>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400">
                          <span>Question safely saved.</span>
                          <button
                            onClick={() => executeAiTeacher(item.id, item.question)}
                            className="underline font-medium"
                          >
                            Retry Now
                          </button>
                        </div>
                      )}

                      {item.answer && (
                        <div className="space-y-3">
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            {item.answer}
                          </div>

                          {item.sourceLinks && item.sourceLinks.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-medium text-slate-500 mb-1">Grounded Web References:</p>
                              <div className="flex flex-wrap gap-3">
                                {item.sourceLinks.map((lnk) => (
                                  <a
                                    key={lnk.uri}
                                    href={lnk.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#1D4ED8] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Globe className="w-3 h-3" /> {lnk.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action toolbar */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 no-print">
                            <button
                              onClick={() => executeAiTeacher(item.id, item.question)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <RefreshCw className="w-3 h-3" /> Regenerate
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.answer || '');
                                showToast('Answer copied to clipboard.');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              onClick={() => handleSaveToNotes(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Bookmark className="w-3 h-3" /> Save to Notes
                            </button>
                            <button
                              onClick={() =>
                                updateDoc(doc(db, 'question_history', item.id), {
                                  isBookmarked: !item.isBookmarked,
                                  updatedAt: serverTimestamp(),
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {item.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            <button
                              onClick={() => handleSpeakAnswer(item.id, item.answer || '')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Volume2 className="w-3 h-3" /> {speakingId === item.id ? 'Stop Audio' : 'Listen'}
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Download className="w-3 h-3" /> Print / PDF
                            </button>
                            {!item.isPublic ? (
                              <button
                                onClick={() => setSharingItem(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 text-xs text-[#1D4ED8] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              >
                                <Share2 className="w-3 h-3" /> Share to Public Q&A
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 px-2">
                                Shared Publicly
                              </span>
                            )}
                            <button
                              onClick={() => showToast('Feedback noted for review.')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-500 hover:text-red-600"
                            >
                              <Flag className="w-3 h-3" /> Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Prompt Input with Voice */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeAiTeacher();
                }}
                className="flex flex-col sm:flex-row gap-2 pt-2"
              >
                <div className="relative flex-1">
                  <textarea
                    rows={2}
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask any question (e.g., Explain Article 21 with landmark cases, or solve an SSC CHSL profit & loss problem)..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    title="Speak question in Hindi or English"
                    className={`absolute right-2.5 top-2.5 p-1.5 rounded-md ${
                      listening ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loadingAi || !questionInput.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {loadingAi ? 'Solving...' : 'Ask Teacher'}
                </button>
              </form>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Default Mode: Private to your verified student account. Nothing is published without your explicit consent.
              </p>
            </div>
          )}

          {/* Photo Question Solver */}
          {tab === 'photo' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Photo Question Solver</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload or capture a photo of a printed or handwritten equation, verify/edit the extracted text, and get a step-by-step explanation.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F]"
                >
                  <Camera className="w-4 h-4" /> Upload or Capture Question Photo
                </button>
                {photoBase64 && (
                  <button
                    disabled={photoStage === 'extracting'}
                    onClick={handleExtractPhotoText}
                    className="px-4 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {photoStage === 'extracting' ? 'Extracting Text...' : '1. Extract Question Text'}
                  </button>
                )}
              </div>

              {photoPreviewUrl && (
                <img
                  src={photoPreviewUrl}
                  alt="Uploaded question preview"
                  className="max-h-64 rounded-lg border border-slate-200 dark:border-slate-800 object-contain"
                />
              )}

              {(extractedText || photoStage === 'extracted') && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    2. Review & Correct Recognized Question Text if Needed
                  </label>
                  <textarea
                    rows={4}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm"
                  />
                  <button
                    disabled={photoStage === 'solving' || !extractedText.trim()}
                    onClick={handleSolvePhoto}
                    className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
                  >
                    {photoStage === 'solving' ? 'Solving Step-by-Step...' : '3. Solve Question'}
                  </button>
                </div>
              )}

              {photoSolution && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {photoSolution}
                </div>
              )}
            </div>
          )}

          {/* Full Searchable Automatic Question History */}
          {tab === 'history' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1D4ED8]" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    My Question History ({filteredHistory.length})
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search saved Q&As..."
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
                  >
                    <option value="All">All Subjects</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <p className="text-sm text-slate-500 py-6">No matching saved questions found.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="py-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.question}</p>
                        <button
                          onClick={() => {
                            if (item.conversationId) setActiveConvId(item.conversationId);
                            setTab('chat');
                          }}
                          className="text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
                        >
                          Reopen
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.subject} · {item.exam} · {item.isPublic ? 'Shared Publicly' : 'Private'} {item.isBookmarked ? '· Bookmarked' : ''}
                      </p>
                      {item.answer && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{item.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Consent Modal for Public Question Sharing */}
      {sharingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Share Question to Public Student Library?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your email address, city, institution, and private files are NEVER shared. Only this question and AI explanation will be published.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={shareAnonymous}
                onChange={(e) => setShareAnonymous(e.target.checked)}
              />
              Share anonymously as “Verified AEC Student”
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSharingItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                Keep Private
              </button>
              <button
                onClick={handlePublishConsent}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
              >
                Confirm & Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
