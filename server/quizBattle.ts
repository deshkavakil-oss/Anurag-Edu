import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { withGeminiRetry, extractJsonSafely, Type } from './gemini.ts';

interface BattlePlayer {
  id: string;
  name: string;
  score: number;
  answeredCurrent: boolean;
  ws: WebSocket;
}

interface BattleQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface BattleRoom {
  code: string;
  hostId: string;
  subject: string;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  players: Map<string, BattlePlayer>;
  questions: BattleQuestion[];
  currentIndex: number;
  timer: ReturnType<typeof setTimeout> | null;
  questionStartedAt: number;
}

const FALLBACK_BATTLE_BANK: Record<string, BattleQuestion[]> = {
  'SSC CHSL Mixed': [
    {
      question: 'Which Article of the Indian Constitution deals with the Right to Equality before Law?',
      options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
      correctIndex: 0,
      explanation: 'Article 14 guarantees equality before law and equal protection of the laws within the territory of India.',
    },
    {
      question: 'The Battle of Plassey was fought in which year?',
      options: ['1757', '1764', '1857', '1761'],
      correctIndex: 0,
      explanation: 'The Battle of Plassey took place on 23 June 1757 between the British East India Company and Siraj-ud-Daulah.',
    },
    {
      question: 'If 20% of A is equal to 30% of B, then A : B is:',
      options: ['2 : 3', '3 : 2', '4 : 5', '5 : 4'],
      correctIndex: 1,
      explanation: '0.20A = 0.30B implies A/B = 30/20 = 3/2.',
    },
    {
      question: 'Which is the longest river flowing entirely within India?',
      options: ['Brahmaputra', 'Godavari', 'Indus', 'Sutlej'],
      correctIndex: 1,
      explanation: 'Godavari (1,465 km) is the longest river originating and flowing entirely within India.',
    },
    {
      question: 'Which shortcut key in MS Excel opens the Save As dialog box?',
      options: ['F5', 'F12', 'Ctrl + H', 'Alt + F4'],
      correctIndex: 1,
      explanation: 'F12 opens the Save As dialog box in MS Office applications.',
    },
  ],
};

const rooms = new Map<string, BattleRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoom(room: BattleRoom) {
  return {
    code: room.code,
    hostId: room.hostId,
    subject: room.subject,
    difficulty: room.difficulty,
    status: room.status,
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      answeredCurrent: p.answeredCurrent,
    })),
  };
}

function broadcast(room: BattleRoom, payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  for (const player of room.players.values()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(raw);
    }
  }
}

async function generateBattleQuestions(subject: string, difficulty: string): Promise<BattleQuestion[]> {
  try {
    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Create 5 multiple-choice competitive exam questions in English on "${subject}" at "${difficulty}" difficulty for Indian students.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      })
    );
    const parsed = extractJsonSafely<BattleQuestion[]>(response.text, []);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 5);
    }
  } catch {
    // Fallback to curated verified questions if Gemini is temporarily busy
  }
  return FALLBACK_BATTLE_BANK['SSC CHSL Mixed'];
}

function advanceQuestion(room: BattleRoom) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  const prevQ = room.questions[room.currentIndex];
  if (room.currentIndex >= 0 && prevQ) {
    broadcast(room, {
      type: 'question:reveal',
      correctIndex: prevQ.correctIndex,
      explanation: prevQ.explanation,
      room: serializeRoom(room),
    });
  }

  room.currentIndex += 1;
  if (room.currentIndex >= room.questions.length) {
    room.status = 'finished';
    broadcast(room, {
      type: 'match:finished',
      room: serializeRoom(room),
    });
    return;
  }

  for (const p of room.players.values()) {
    p.answeredCurrent = false;
  }
  const q = room.questions[room.currentIndex];
  room.questionStartedAt = Date.now();
  broadcast(room, {
    type: 'question:next',
    index: room.currentIndex,
    question: q.question,
    options: q.options,
    timeLimitSec: 20,
    room: serializeRoom(room),
  });

  room.timer = setTimeout(() => {
    advanceQuestion(room);
  }, 20000);
}

export function attachQuizBattleServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const reqPath = (req.url || '').split('?')[0];
    if (reqPath === '/ws/quiz-battle') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws) => {
    let activeRoomCode: string | null = null;
    let activePlayerId: string | null = null;

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          playerId?: string;
          playerName?: string;
          roomCode?: string;
          subject?: string;
          difficulty?: string;
          optionIndex?: number;
        };

        if (msg.type === 'room:create') {
          const playerId = String(msg.playerId || '').slice(0, 80);
          const playerName = String(msg.playerName || 'Student').slice(0, 60);
          if (!playerId) return;
          const code = generateRoomCode();
          const room: BattleRoom = {
            code,
            hostId: playerId,
            subject: String(msg.subject || 'SSC CHSL Mixed').slice(0, 80),
            difficulty: String(msg.difficulty || 'Moderate').slice(0, 30),
            status: 'waiting',
            players: new Map(),
            questions: [],
            currentIndex: -1,
            timer: null,
            questionStartedAt: 0,
          };
          room.players.set(playerId, { id: playerId, name: playerName, score: 0, answeredCurrent: false, ws });
          rooms.set(code, room);
          activeRoomCode = code;
          activePlayerId = playerId;
          ws.send(JSON.stringify({ type: 'room:state', room: serializeRoom(room) }));
        } else if (msg.type === 'room:join') {
          const code = String(msg.roomCode || '').trim().toUpperCase();
          const playerId = String(msg.playerId || '').slice(0, 80);
          const playerName = String(msg.playerName || 'Student').slice(0, 60);
          const room = rooms.get(code);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room code not found. Verify the 6-character code.' }));
            return;
          }
          if (room.status !== 'waiting') {
            ws.send(JSON.stringify({ type: 'error', message: 'This match has already started.' }));
            return;
          }
          room.players.set(playerId, { id: playerId, name: playerName, score: 0, answeredCurrent: false, ws });
          activeRoomCode = code;
          activePlayerId = playerId;
          broadcast(room, { type: 'room:state', room: serializeRoom(room) });
        } else if (msg.type === 'match:start') {
          if (!activeRoomCode || !activePlayerId) return;
          const room = rooms.get(activeRoomCode);
          if (!room || room.hostId !== activePlayerId || room.status !== 'waiting') return;
          if (room.players.size < 2) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Invite at least 1 other real student using the room code before starting Quiz Battle.',
              })
            );
            return;
          }
          broadcast(room, { type: 'match:preparing', room: serializeRoom(room) });
          room.questions = await generateBattleQuestions(room.subject, room.difficulty);
          room.status = 'active';
          room.currentIndex = -1;
          advanceQuestion(room);
        } else if (msg.type === 'answer:submit') {
          if (!activeRoomCode || !activePlayerId) return;
          const room = rooms.get(activeRoomCode);
          if (!room || room.status !== 'active') return;
          const player = room.players.get(activePlayerId);
          const q = room.questions[room.currentIndex];
          if (!player || !q || player.answeredCurrent) return;
          player.answeredCurrent = true;
          if (msg.optionIndex === q.correctIndex) {
            const elapsedSec = Math.min(20, (Date.now() - room.questionStartedAt) / 1000);
            const speedBonus = Math.max(10, Math.round(100 - elapsedSec * 3));
            player.score += speedBonus;
          }
          broadcast(room, { type: 'room:state', room: serializeRoom(room) });
          const allAnswered = Array.from(room.players.values()).every((p) => p.answeredCurrent);
          if (allAnswered) {
            advanceQuestion(room);
          }
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid battle payload.' }));
      }
    });

    ws.on('close', () => {
      if (activeRoomCode && activePlayerId) {
        const room = rooms.get(activeRoomCode);
        if (room) {
          room.players.delete(activePlayerId);
          if (room.players.size === 0) {
            if (room.timer) clearTimeout(room.timer);
            rooms.delete(activeRoomCode);
          } else {
            if (room.hostId === activePlayerId) {
              const nextHost = room.players.keys().next().value;
              if (nextHost) room.hostId = nextHost;
            }
            broadcast(room, { type: 'room:state', room: serializeRoom(room) });
          }
        }
      }
    });
  });
}
