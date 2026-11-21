import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  Award,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Swords,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_EXAMS, type ExamDefinition } from '../data/exams';
import { SSC_CHSL_SUBJECTS } from '../data/sscChsl';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AppRoute } from './HomePage';

interface MockTestAndBattlePageProps {
  mode: 'mock-tests' | 'quiz-battle';
  onNavigate: (route: AppRoute) => void;
}

interface TestQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel: string;
}

interface PastAttempt {
  id: string;
  testTitle: string;
  examId: string;
  questionSource: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  marksObtained: number;
  maxMarks: number;
  accuracy: number;
  timeTakenSeconds: number;
  weakTopics?: string[];
}

interface BattleRoomState {
  code: string;
  hostId: string;
  subject: string;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  currentIndex: number;
  totalQuestions: number;
  players: { id: string; name: string; score: number; answeredCurrent: boolean }[];
}

export function MockTestAndBattlePage({ mode, onNavigate }: MockTestAndBattlePageProps) {
  const { user, profile, isVerified, awardXp } = useAuth();

  // Mock Test Engine state
  const [selectedExamId, setSelectedExamId] = useState(INDIAN_EXAMS[0].id);
  const [testSource, setTestSource] = useState<'curated' | 'ai_practice'>('curated');
  const [questionCount, setQuestionCount] = useState<10 | 25 | 50>(10);
  const [aiTopic, setAiTopic] = useState('Indian Polity & Modern History');
  const [aiSubject, setAiSubject] = useState('General Awareness');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<'setup' | 'running' | 'result'>('setup');
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [startedAt, setStartedAt] = useState(0);
  const [loadingMcq, setLoadingMcq] = useState(false);
  const [mcqError, setMcqError] = useState('');
  const [pastAttempts, setPastAttempts] = useState<PastAttempt[]>([]);

  // Quiz Battle WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [battleConnected, setBattleConnected] = useState(false);
  const [battleRoom, setBattleRoom] = useState<BattleRoomState | null>(null);
  const [battleSubject, setBattleSubject] = useState('SSC CHSL Mixed');
  const [battleDifficulty, setBattleDifficulty] = useState('Moderate');
  const [joinCode, setJoinCode] = useState('');
  const [battleError, setBattleError] = useState('');
  const [battlePreparing, setBattlePreparing] = useState(false);
  const [currentBattleQ, setCurrentBattleQ] = useState<{
    index: number;
    question: string;
    options: string[];
    timeLimitSec: number;
  } | null>(null);
  const [battlePicked, setBattlePicked] = useState<number | null>(null);
  const [battleReveal, setBattleReveal] = useState<{ correctIndex: number; explanation: string } | null>(null);
  const [battleTimeLeft, setBattleTimeLeft] = useState(20);

  const selectedExam: ExamDefinition =
    INDIAN_EXAMS.find((e) => e.id === selectedExamId) || INDIAN_EXAMS[0];

  useEffect(() => {
    if (!user || !isVerified || mode !== 'mock-tests') return;
    const getTs = (d: unknown) => ((d as { seconds?: number } | undefined)?.seconds ?? 0);
    const unsub = onSnapshot(
      query(collection(db, 'quiz_attempts'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PastAttempt, 'id'> & { createdAt?: unknown }) }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setPastAttempts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'quiz_attempts')
    );
    return unsub;
  }, [user, isVerified, mode]);

  // Mock Test countdown
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Quiz Battle WebSocket lifecycle
  useEffect(() => {
    if (mode !== 'quiz-battle') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/quiz-battle`);
    wsRef.current = ws;

    ws.onopen = () => setBattleConnected(true);
    ws.onclose = () => setBattleConnected(false);
    ws.onerror = () => setBattleError('Real-time connection unavailable. Refresh to reconnect.');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          type: string;
          message?: string;
          room?: BattleRoomState;
          index?: number;
          question?: string;
          options?: string[];
          timeLimitSec?: number;
          correctIndex?: number;
          explanation?: string;
        };

        if (data.type === 'error') {
          setBattleError(data.message || 'Battle error occurred.');
          setBattlePreparing(false);
        } else if (data.type === 'room:state' && data.room) {
          setBattleRoom(data.room);
          setBattleError('');
        } else if (data.type === 'match:preparing') {
          setBattlePreparing(true);
          if (data.room) setBattleRoom(data.room);
        } else if (data.type === 'question:next') {
          setBattlePreparing(false);
          setBattleReveal(null);
          setBattlePicked(null);
          setBattleTimeLeft(data.timeLimitSec || 20);
          if (data.room) setBattleRoom(data.room);
          setCurrentBattleQ({
            index: data.index || 0,
            question: data.question || '',
            options: data.options || [],
            timeLimitSec: data.timeLimitSec || 20,
          });
        } else if (data.type === 'question:reveal') {
          setBattleReveal({
            correctIndex: data.correctIndex ?? 0,
            explanation: data.explanation || '',
          });
          if (data.room) setBattleRoom(data.room);
        } else if (data.type === 'match:finished') {
          if (data.room) setBattleRoom(data.room);
          setBattlePreparing(false);
          if (user && isVerified) {
            void awardXp(20);
          }
        }
      } catch {
        // Ignore malformed WS packets
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'quiz-battle' || !currentBattleQ || battleRoom?.status !== 'active') return;
    const t = setInterval(() => {
      setBattleTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [mode, currentBattleQ, battleRoom?.status]);

  const buildCuratedPool = (exam: ExamDefinition, targetCount: number): TestQuestion[] => {
    const pool: TestQuestion[] = [];
    exam.sampleQuestions.forEach((q) => {
      pool.push({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceLabel: q.sourceType === 'pyq' ? q.yearNote || 'Verified PYQ' : 'Curated Syllabus Bank',
      });
    });

    SSC_CHSL_SUBJECTS.forEach((sub) => {
      sub.chapters.forEach((ch) => {
        ch.importantQuestions.forEach((iq, i) => {
          pool.push({
            id: `${ch.id}-${i}`,
            subject: sub.name,
            topic: ch.title,
            question: iq.q,
            options: iq.options,
            correctIndex: iq.correctIndex,
            explanation: iq.explanation,
            sourceLabel: iq.type === 'PYQ' ? 'Verified PYQ Reference' : 'Curated Practice',
          });
        });
      });
    });

    return pool.slice(0, targetCount);
  };

  const startTest = async () => {
    setMcqError('');
    if (testSource === 'curated') {
      const bank = buildCuratedPool(selectedExam, questionCount);
      setQuestions(bank);
      setAnswers({});
      setCurrentIdx(0);
      setSecondsLeft(bank.length * 60);
      setStartedAt(Date.now());
      setPhase('running');
      return;
    }

    setLoadingMcq(true);
    try {
      const resp = await fetch('/api/ai/mcq-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: selectedExam.name,
          subject: aiSubject,
          topic: aiTopic,
          count: Math.min(25, questionCount),
          language: profile?.preferredLanguage || 'English',
        }),
      });
      const data = (await resp.json()) as {
        questions?: Array<{
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
          subtopic: string;
        }>;
        hindiError?: string;
      };
      if (!resp.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setMcqError(
          data.hindiError ||
            'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें।'
        );
        return;
      }
      const mapped: TestQuestion[] = data.questions.map((q, idx) => ({
        id: `ai-${idx}`,
        subject: aiSubject,
        topic: q.subtopic || aiTopic,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceLabel: 'AI-Generated Practice',
      }));
      setQuestions(mapped);
      setAnswers({});
      setCurrentIdx(0);
      setSecondsLeft(mapped.length * 60);
      setStartedAt(Date.now());
      setPhase('running');
    } catch {
      setMcqError('Network error generating AI practice MCQs.');
    } finally {
      setLoadingMcq(false);
    }
  };

  const finishTest = async () => {
    if (phase === 'result') return;
    setPhase('result');

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const weakSet = new Set<string>();

    questions.forEach((q, idx) => {
      const chosen = answers[idx];
      if (chosen === undefined) {
        unattemptedCount += 1;
      } else if (chosen === q.correctIndex) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
        weakSet.add(`${q.subject}: ${q.topic}`);
      }
    });

    const marksObtained =
      Math.round(
        (correctCount * selectedExam.marksPerCorrect - incorrectCount * selectedExam.negativeMarking) * 100
      ) / 100;
    const maxMarks = questions.length * selectedExam.marksPerCorrect;
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 1000) / 10 : 0;
    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    if (user && isVerified && questions.length > 0) {
      try {
        await addDoc(collection(db, 'quiz_attempts'), {
          userId: user.uid,
          examId: selectedExam.id,
          subject: testSource === 'ai_practice' ? aiSubject : 'Mixed Exam Mock',
          testTitle: `${selectedExam.name} (${questions.length} Qs)`,
          questionSource: testSource === 'ai_practice' ? 'ai_practice' : 'curated',
          totalQuestions: questions.length,
          correctCount,
          incorrectCount,
          unattemptedCount,
          marksObtained,
          maxMarks,
          accuracy,
          timeTakenSeconds,
          weakTopics: Array.from(weakSet).slice(0, 15),
          createdAt: serverTimestamp(),
        });
        await awardXp(15 + correctCount * 2);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'quiz_attempts');
      }
    }
  };

  if (mode === 'quiz-battle') {
    const myId = user?.uid || `guest_${Math.random().toString(36).slice(2, 8)}`;
    const myName = profile?.fullName || user?.displayName || 'AEC Student';

    const sendWs = (payload: Record<string, unknown>) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
      }
    };

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Real-Time WebSocket Multiplayer
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Swords className="w-6 h-6 text-[#1D4ED8]" /> Live Student Quiz Battle
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Compete live with real students using a shared 6-character room code. Speed + accuracy scoring with zero simulated bots.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Socket: {battleConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {battleError && (
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            {battleError}
          </div>
        )}

        {!battleRoom ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Battle Room</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Subject / Exam Focus</label>
                <select value={battleSubject} onChange={(e) => setBattleSubject(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                  <option value="SSC CHSL Mixed">SSC CHSL Mixed</option>
                  <option value="Indian Constitution & BNS">Indian Constitution &amp; BNS</option>
                  <option value="History & Freedom Movement">History &amp; Freedom Movement</option>
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
                <select value={battleDifficulty} onChange={(e) => setBattleDifficulty(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Exam Level">Exam Level</option>
                </select>
              </div>
              <button
                disabled={!battleConnected}
                onClick={() =>
                  sendWs({
                    type: 'room:create',
                    playerId: myId,
                    playerName: myName,
                    subject: battleSubject,
                    difficulty: battleDifficulty,
                  })
                }
                className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
              >
                Create Room &amp; Get Share Code
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Join Friend’s Battle Room</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">6-Character Room Code</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., A7K9P2"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono uppercase tracking-widest"
                />
              </div>
              <button
                disabled={!battleConnected || joinCode.trim().length < 4}
                onClick={() =>
                  sendWs({
                    type: 'room:join',
                    roomCode: joinCode.trim(),
                    playerId: myId,
                    playerName: myName,
                  })
                }
                className="w-full py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Join Live Battle
              </button>
              <p className="text-xs text-slate-500">
                Tip: Open a second browser tab on this device or invite a classmate to test real-time head-to-head play.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 h-fit">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Room Code</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-[#0B1F3A] dark:text-white">
                  {battleRoom.code}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {battleRoom.subject} · {battleRoom.difficulty}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Live Standings ({battleRoom.players.length})
                </p>
                {battleRoom.players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="truncate">
                        {i + 1}. {p.name}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-[#1D4ED8]">{p.score}</span>
                    </div>
                  ))}
              </div>
              {battleRoom.status === 'waiting' && (
                <button
                  disabled={battlePreparing}
                  onClick={() => sendWs({ type: 'match:start' })}
                  className="w-full py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F] disabled:opacity-50"
                >
                  {battlePreparing ? 'Preparing Questions...' : 'Start Battle Match'}
                </button>
              )}
              <button
                onClick={() => {
                  setBattleRoom(null);
                  setCurrentBattleQ(null);
                }}
                className="w-full py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
              >
                Leave Room
              </button>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              {battleRoom.status === 'waiting' && (
                <div className="py-12 text-center space-y-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Waiting for Players in Lobby
                  </p>
                  <p className="text-sm text-slate-500">
                    Share code <span className="font-mono font-bold text-slate-900 dark:text-white">{battleRoom.code}</span> with at least one classmate, then click Start Battle Match.
                  </p>
                </div>
              )}

              {battleRoom.status === 'active' && currentBattleQ && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span>
                      Question {currentBattleQ.index + 1} of {battleRoom.totalQuestions}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#1D4ED8]">
                      {battleTimeLeft}s left
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {currentBattleQ.question}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentBattleQ.options.map((opt, idx) => {
                      let cls = 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800';
                      if (battleReveal) {
                        if (idx === battleReveal.correctIndex) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-medium';
                        else if (idx === battlePicked) cls = 'border-red-500 bg-red-50 dark:bg-red-950/40';
                      } else if (battlePicked === idx) {
                        cls = 'border-[#1D4ED8] bg-blue-50 dark:bg-blue-950/40';
                      }
                      return (
                        <button
                          key={opt}
                          disabled={battlePicked !== null || Boolean(battleReveal)}
                          onClick={() => {
                            setBattlePicked(idx);
                            sendWs({ type: 'answer:submit', optionIndex: idx });
                          }}
                          className={`text-left p-3.5 rounded-lg border text-sm transition-colors ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {battleReveal && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                      {battleReveal.explanation}
                    </p>
                  )}
                </div>
              )}

              {battleRoom.status === 'finished' && (
                <div className="py-10 text-center space-y-4">
                  <Award className="w-10 h-10 text-amber-500 mx-auto" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Battle Finished!</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Winner:{' '}
                    {battleRoom.players.slice().sort((a, b) => b.score - a.score)[0]?.name || 'Champion'} (
                    {battleRoom.players.slice().sort((a, b) => b.score - a.score)[0]?.score || 0} pts)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mock Test Engine UI
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
            Timed Assessment &amp; Negative Marking Engine
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            MCQ, Mock Test &amp; Analytics Centre
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Practice curated/PYQ banks or generate AI practice MCQs (explicitly labeled) with exam-accurate scoring and automatic weak-topic detection.
          </p>
        </div>
        <button
          onClick={() => onNavigate('quiz-battle')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700 shrink-0"
        >
          <Swords className="w-4 h-4" /> Multiplayer Quiz Battle
        </button>
      </div>

      {mcqError && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
          {mcqError}
        </div>
      )}

      {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configure Practice Test</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Exam Marking Scheme</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  {INDIAN_EXAMS.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} (+{ex.marksPerCorrect} / -{ex.negativeMarking})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Question Source</label>
                <select
                  value={testSource}
                  onChange={(e) => setTestSource(e.target.value as 'curated' | 'ai_practice')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="curated">Curated &amp; PYQ Syllabus Bank</option>
                  <option value="ai_practice">AI-Generated Practice Questions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Daily Quiz Size</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value) as 10 | 25 | 50)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value={10}>Daily 10 Questions</option>
                  <option value={25}>Practice 25 Questions</option>
                  <option value={50}>Full Mini-Mock (up to 50)</option>
                </select>
              </div>
              {testSource === 'ai_practice' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                  <input
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            {testSource === 'ai_practice' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Topic Focus for AI Practice</label>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
            )}

            <button
              disabled={loadingMcq}
              onClick={startTest}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#132B4F] disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {loadingMcq ? 'Generating Practice Test...' : 'Start Timed Test'}
            </button>
            {(!user || !isVerified) && (
              <p className="text-xs text-slate-500">
                Sign in with a verified account to save results and weak topics to your dashboard analytics.
              </p>
            )}
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              My Recent Mock History ({pastAttempts.length})
            </h2>
            {pastAttempts.length === 0 ? (
              <p className="text-xs text-slate-500">
                Complete your first timed test to view real accuracy and weak-topic diagnostics here.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {pastAttempts.slice(0, 8).map((att) => (
                  <div key={att.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{att.testTitle}</p>
                      <p className="text-slate-500">
                        {att.questionSource === 'ai_practice' ? 'AI Practice' : 'Curated/PYQ'} ·{' '}
                        {att.correctCount}/{att.totalQuestions} correct
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="font-semibold text-[#1D4ED8]">{att.accuracy}%</p>
                      <p className="text-slate-500">
                        {att.marksObtained}/{att.maxMarks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'running' && questions[currentIdx] && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500">
                {selectedExam.name} · {questions[currentIdx].sourceLabel} · {questions[currentIdx].subject}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Question {currentIdx + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-[#1D4ED8]">
                <Clock className="w-4 h-4" /> {formatTime(secondsLeft)}
              </span>
              <button
                onClick={() => void finishTest()}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132B4F]"
              >
                Submit Test
              </button>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
            {questions[currentIdx].question}
          </h2>

          <div className="space-y-2.5">
            {questions[currentIdx].options.map((opt, idx) => {
              const selected = answers[currentIdx] === idx;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: idx }))}
                  className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'border-[#1D4ED8] bg-blue-50 dark:bg-blue-950/40 font-medium text-slate-900 dark:text-white'
                      : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-7 h-7 rounded text-xs font-mono ${
                    i === currentIdx
                      ? 'bg-[#0B1F3A] text-white'
                      : answers[i] !== undefined
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1);
                else void finishTest();
              }}
              className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-blue-700"
            >
              {currentIdx < questions.length - 1 ? 'Next' : 'Finish & Score'}
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Test Performance Report</h2>
              <button
                onClick={() => setPhase('setup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Take Another Test
              </button>
            </div>
            {(() => {
              let correct = 0;
              let wrong = 0;
              questions.forEach((q, idx) => {
                if (answers[idx] !== undefined) {
                  if (answers[idx] === q.correctIndex) correct += 1;
                  else wrong += 1;
                }
              });
              const marks =
                Math.round((correct * selectedExam.marksPerCorrect - wrong * selectedExam.negativeMarking) * 100) /
                100;
              const acc = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 1000) / 10 : 0;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500">Marks Scored</p>
                    <p className="text-xl font-bold tabular-nums text-[#0B1F3A] dark:text-white">
                      {marks} / {questions.length * selectedExam.marksPerCorrect}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Accuracy</p>
                    <p className="text-xl font-bold tabular-nums text-[#1D4ED8]">{acc}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Correct</p>
                    <p className="text-xl font-bold tabular-nums text-emerald-600">{correct}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Incorrect (-{selectedExam.negativeMarking} each)</p>
                    <p className="text-xl font-bold tabular-nums text-red-600">{wrong}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Q{idx + 1}. {q.question}
                    </p>
                    {userAns === undefined ? (
                      <span className="text-xs text-slate-500 shrink-0">Skipped</span>
                    ) : isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Correct Answer: {q.options[q.correctIndex]}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
