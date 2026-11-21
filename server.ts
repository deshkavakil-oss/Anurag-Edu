import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import {
  withGeminiRetry,
  extractGroundingLinks,
  extractJsonSafely,
  FRIENDLY_AI_OVERLOAD_ERROR,
  Type,
} from './server/gemini.ts';
import { attachQuizBattleServer } from './server/quizBattle.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));

// Sliding-window in-memory rate limiter for /api/*
const apiHits = new Map<string, number[]>();
app.use('/api', (req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 60;
  const recent = (apiHits.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (recent.length >= maxRequests) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    return;
  }
  recent.push(now);
  apiHits.set(ip, recent);
  next();
});

function hasSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

app.get('/api/health', (_req, res) => {
  const geminiReady = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  res.json({
    ok: true,
    platform: 'ANURAG EDUCATION CENTER',
    geminiConfigured: geminiReady,
    smtpConfigured: hasSmtpConfigured(),
    officialEmail: 'anurag706879@gmail.com',
  });
});

function handleAiError(res: express.Response, err: unknown) {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const code = e.status ?? e.statusCode ?? 500;
  if (e.message === 'GEMINI_API_KEY_MISSING') {
    res.status(503).json({
      error: 'AI service key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.',
      hindiError: FRIENDLY_AI_OVERLOAD_ERROR,
      retryable: false,
    });
    return;
  }
  if (code === 401 || code === 403 || code === 400) {
    res.status(code).json({
      error: 'Unable to authenticate or process the AI request. Please check server API configuration.',
      hindiError: FRIENDLY_AI_OVERLOAD_ERROR,
      retryable: false,
    });
    return;
  }
  res.status(503).json({
    error: FRIENDLY_AI_OVERLOAD_ERROR,
    hindiError: FRIENDLY_AI_OVERLOAD_ERROR,
    retryable: true,
  });
}

// 1. AI Student Teacher (Structured 10-part academic response + Grounding + Personal Memory)
app.post('/api/ai/teacher', async (req, res) => {
  try {
    const {
      question,
      subject = 'General Studies',
      exam = 'SSC CHSL',
      language = 'English',
      memoryContext = '',
      history = [],
      useSearchGrounding = true,
      attachmentBase64,
      attachmentMimeType,
    } = req.body as {
      question: string;
      subject?: string;
      exam?: string;
      language?: string;
      memoryContext?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      useSearchGrounding?: boolean;
      attachmentBase64?: string;
      attachmentMimeType?: string;
    };

    if (!question || typeof question !== 'string' || question.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid educational question.' });
      return;
    }

    const systemInstruction = `You are the Senior Academic Mentor at ANURAG EDUCATION CENTER (AEC India).
Respond strictly in "${language}" (if Bilingual, provide clear English with Hindi explanations; if Simple Hindi, use easy Devanagari Hindi).
Target Subject: ${subject}. Target Examination: ${exam}.
Student Personal Learning Memory: ${memoryContext || 'No prior history provided.'}

Format EVERY complete educational answer cleanly with these exact 10 numbered markdown sections:
1. Direct Answer
2. Simple Explanation
3. Detailed Explanation
4. Step-by-Step Solution
5. Practical Examples
6. Important Facts
7. Exam-Oriented Points
8. Related MCQs (include 2 practice MCQs with answer key & brief explanation)
9. Further Reading
10. Verified References & Source Guidance (only cite genuine official portals like ncert.nic.in, ssc.gov.in, indiacode.nic.in, sci.gov.in, pib.gov.in; never fabricate URLs or case citations).`;

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Student' : 'AEC Teacher'}: ${m.content.slice(0, 1200)}`)
          .join('\n\n')
      : '';

    const fullPrompt = historyText
      ? `Previous Conversation Context:\n${historyText}\n\nNew Student Question:\n${question.trim()}`
      : question.trim();

    const contents =
      attachmentBase64 && attachmentMimeType
        ? {
            parts: [
              { inlineData: { mimeType: attachmentMimeType, data: attachmentBase64 } },
              { text: fullPrompt },
            ],
          }
        : fullPrompt;

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          ...(useSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
        },
      })
    );

    const sourceLinks = extractGroundingLinks(response);
    res.json({
      answer: response.text || 'Unable to generate an answer right now.',
      sourceLinks,
    });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 2. Photo Question Solver (Extract text first OR Solve with image + edited text)
app.post('/api/ai/photo-solve', async (req, res) => {
  try {
    const { mode = 'extract', imageBase64, mimeType = 'image/jpeg', extractedText = '', language = 'English' } = req.body as {
      mode?: 'extract' | 'solve';
      imageBase64?: string;
      mimeType?: string;
      extractedText?: string;
      language?: string;
    };

    if (mode === 'extract') {
      if (!imageBase64) {
        res.status(400).json({ error: 'Image data is required for text extraction.' });
        return;
      }
      const response = await withGeminiRetry((ai, model) =>
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              {
                text: 'Transcribe the exact question, mathematical equations, and options visible in this image cleanly in plain text. If any diagram is present, briefly describe the labeled geometry/values. Output only the extracted question text.',
              },
            ],
          },
        })
      );
      res.json({ extractedText: (response.text || '').trim() });
      return;
    }

    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType, data: imageBase64 } });
    }
    parts.push({
      text: `Solve this student question step-by-step in ${language}. Student-verified question text:\n${extractedText}\n\nProvide: 1) Final Answer, 2) Step-by-Step Working, 3) Formula/Concept Used, 4) Exam Shortcut Trick if applicable.`,
    });

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: { parts },
      })
    );
    res.json({ solution: response.text || '' });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 3. AI Practice MCQ Generator (explicitly labeled as AI Practice)
app.post('/api/ai/mcq-generate', async (req, res) => {
  try {
    const { exam = 'SSC CHSL', subject = 'History', topic = 'Modern Indian History', count = 10, language = 'English' } =
      req.body as {
        exam?: string;
        subject?: string;
        topic?: string;
        count?: number;
        language?: string;
      };

    const safeCount = Math.min(25, Math.max(5, Number(count) || 10));
    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Generate ${safeCount} high-quality original practice MCQs for ${exam} (${subject} - ${topic}) in ${language}. Every question must have 4 options, 1 correctIndex (0-3), a concise explanation, and a subtopic tag.`,
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
                subtopic: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation', 'subtopic'],
            },
          },
        },
      })
    );

    const questions = extractJsonSafely(response.text, []);
    res.json({ questions, sourceLabel: 'AI-Generated Practice Questions' });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 4. Smart Study Plan Generator
app.post('/api/ai/study-plan', async (req, res) => {
  try {
    const {
      exam = 'SSC CHSL',
      examDate = '',
      dailyHours = 4,
      durationDays = 30,
      subjects = ['Mathematics', 'Reasoning', 'English', 'General Awareness'],
      weakSubjects = ['Mathematics'],
      level = 'Intermediate',
    } = req.body as {
      exam?: string;
      examDate?: string;
      dailyHours?: number;
      durationDays?: number;
      subjects?: string[];
      weakSubjects?: string[];
      level?: string;
    };

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Create a structured ${durationDays}-day smart study timetable for ${exam} (Target Exam Date: ${examDate || 'Upcoming'}, Daily Study Hours: ${dailyHours}, Current Level: ${level}). Subjects: ${subjects.join(', ')}. Weak Subjects needing extra slots: ${weakSubjects.join(', ')}.
Return 14 actionable milestone tasks spanning Study, Revision, Practice, and Mock Test phases.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              dailySchedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slot: { type: Type.STRING },
                    activity: { type: Type.STRING },
                  },
                  required: ['slot', 'activity'],
                },
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    dayRange: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    phase: { type: Type.STRING },
                    title: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'dayRange', 'subject', 'phase', 'title', 'completed'],
                },
              },
            },
            required: ['summary', 'dailySchedule', 'tasks'],
          },
        },
      })
    );

    res.json(extractJsonSafely(response.text, { summary: '', dailySchedule: [], tasks: [] }));
  } catch (err) {
    handleAiError(res, err);
  }
});

// 5. AI Blog Generator
app.post('/api/ai/blog-generate', async (req, res) => {
  try {
    const {
      topic,
      category = 'Legal Awareness',
      language = 'English',
      length = 'medium',
      audience = 'Law & Competitive Exam Students',
    } = req.body as {
      topic: string;
      category?: string;
      language?: string;
      length?: 'short' | 'medium' | 'detailed';
      audience?: string;
    };

    if (!topic || topic.trim().length < 3) {
      res.status(400).json({ error: 'Please provide a blog topic.' });
      return;
    }

    const wordGuide = length === 'short' ? '500 words' : length === 'detailed' ? '1400 words' : '900 words';
    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Write an educational Indian academic/legal article (~${wordGuide}) on "${topic}" in ${language}.
Category: ${category}. Target Audience: ${audience}.
Include: Introduction, Clear Headings, Practical Indian Examples, Relevant Constitutional Articles or Statutory Provisions (BNS/BNSS/BSA/Constitution/Acts where accurate), Verified Official References (India Code, Supreme Court of India, PIB), Conclusion, and an Educational Disclaimer (legal education, not legal advice).
Never fabricate case citations or judgments.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })
    );

    const references = extractGroundingLinks(response);
    res.json({
      title: topic.trim(),
      content: response.text || '',
      references,
    });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 6. Research, Current Affairs, Scholarships & Video Finder (Real Google Search Grounding)
app.post('/api/ai/research-search', async (req, res) => {
  try {
    const { query, mode = 'research' } = req.body as {
      query: string;
      mode?: 'research' | 'current_affairs' | 'scholarships' | 'alerts' | 'videos';
    };

    if (!query || query.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a search query.' });
      return;
    }

    const modePrompt: Record<string, string> = {
      research: `Search for verified academic research papers, NCERT/UGC/government reports, official PDFs, and Supreme Court/India Code legal resources related to: "${query}". Summarize each verified result with publisher, why it is useful for Indian students, and distinguish AI summary from published sources.`,
      current_affairs: `Find the latest verified Indian and international current affairs for competitive exams (SSC, UPSC, Banking, Railway) regarding: "${query}". Include Date, Headline, Short & Detailed Explanation, Exam Relevance, Important Facts, and 2 related MCQs. Prefer official government sources like PIB, RBI, Ministry portals.`,
      scholarships: `Find genuine Indian Central/State Government or recognized university scholarships matching: "${query}". Include Eligibility, Required Documents, Application Process, Official Portal URL (e.g., scholarships.gov.in), and note that students should verify current deadlines on the official portal.`,
      alerts: `Find latest official Indian government job/exam notifications, admit card updates, and result links for: "${query}". Rely strictly on official portals (ssc.gov.in, upsc.gov.in, rrbcdg.gov.in, ibps.in, nta.ac.in). Never mark unverified dates as confirmed.`,
      videos: `Find genuine educational lecture series, NPTEL/SWAYAM/NCERT eVidya/Sansad TV or verified YouTube educational playlists for: "${query}". Never invent URLs; rely strictly on search grounding results.`,
    };

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: modePrompt[mode] || modePrompt.research,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })
    );

    const sources = extractGroundingLinks(response);
    res.json({
      summary: response.text || '',
      sources,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 7. Document Analyzer (Notes, Summary, Flashcards, Q&A)
app.post('/api/ai/document-analyze', async (req, res) => {
  try {
    const { fileName, textContent = '', base64Data, mimeType, task = 'summarize', question = '' } = req.body as {
      fileName: string;
      textContent?: string;
      base64Data?: string;
      mimeType?: string;
      task?: 'summarize' | 'notes' | 'flashcards' | 'qa';
      question?: string;
    };

    const instructionMap: Record<string, string> = {
      summarize: `Provide a clear executive summary, key takeaways, and exam-relevant bullet points from the uploaded file "${fileName}".`,
      notes: `Convert the uploaded document "${fileName}" into structured revision notes with headings, formulas/definitions, and key points.`,
      flashcards: `Create 8 study flashcards (Front Question / Back Answer) based on "${fileName}". Format cleanly with Q: and A: pairs.`,
      qa: `Answer the student's specific question based strictly on "${fileName}": ${question}`,
    };

    const prompt = instructionMap[task] || instructionMap.summarize;
    const contents =
      base64Data && mimeType
        ? {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          }
        : `${prompt}\n\nDocument Content:\n${textContent.slice(0, 28000)}`;

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents,
      })
    );

    res.json({ result: response.text || '' });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 8. AI Interview & Viva Practice
app.post('/api/ai/interview-viva', async (req, res) => {
  try {
    const { interviewType = 'SSC / Govt Job Interview', question, answer, language = 'English' } = req.body as {
      interviewType?: string;
      question: string;
      answer: string;
      language?: string;
    };

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Evaluate this student's practice answer for "${interviewType}" in ${language}.
Interviewer Question: ${question}
Student's Answer: ${answer}

Provide:
1. Constructive Evaluation (Clarity, Confidence, Accuracy, Structure)
2. Model High-Scoring Response
3. 3 Specific Improvement Tips
4. Next Follow-up Interview Question.`,
      })
    );

    res.json({ feedback: response.text || '' });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 9. Career Guidance Engine
app.post('/api/ai/career-guidance', async (req, res) => {
  try {
    const { educationLevel, stream, interests, targetExam, state } = req.body as {
      educationLevel?: string;
      stream?: string;
      interests?: string;
      targetExam?: string;
      state?: string;
    };

    const response = await withGeminiRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: `Provide personalized Indian Career & Higher Education Guidance for a student with:
- Education Level: ${educationLevel || 'Undergraduate'}
- Stream / Course: ${stream || 'General'}
- State: ${state || 'India'}
- Interests: ${interests || 'Government Services & Law'}
- Current Target Exam: ${targetExam || 'SSC CHSL'}

Include:
1. Top 4 Suitable Career Tracks in India (Government, Legal, Tech, Academic)
2. Course & Degree Comparison
3. Key Entrance Examinations & Eligibility
4. 12-Month Skill & Preparation Roadmap.`,
      })
    );

    res.json({ guidance: response.text || '' });
  } catch (err) {
    handleAiError(res, err);
  }
});

// 10. Real Transactional Email Sender (Honest delivery reporting)
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text } = req.body as {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
  };

  if (!to || !subject || (!html && !text)) {
    res.status(400).json({ sent: false, error: 'Recipient, subject, and body are required.' });
    return;
  }

  if (!hasSmtpConfigured()) {
    res.status(503).json({
      sent: false,
      configured: false,
      officialSender: 'anurag706879@gmail.com',
      message:
        'Transactional SMTP provider is not configured on the server (SMTP_HOST, SMTP_USER, SMTP_PASS). Firebase Auth verification and password reset emails remain active.',
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'ANURAG EDUCATION CENTER <anurag706879@gmail.com>',
      replyTo: 'anurag706879@gmail.com',
      to,
      subject,
      text: text || '',
      html: html || undefined,
    });

    res.json({
      sent: true,
      configured: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SMTP delivery failed';
    res.status(502).json({
      sent: false,
      configured: true,
      error: msg,
    });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);
  attachQuizBattleServer(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const enableHmr = process.env.ENABLE_VITE_HMR === 'true' && process.env.DISABLE_HMR !== 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: enableHmr ? { server: httpServer } : false,
        hmr: enableHmr,
      },
      appType: 'spa',
    });
    if (!enableHmr) {
      app.get('/@vite/client', (_req, res) => {
        res.type('application/javascript');
        res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== "." && url[0] !== "/")) return url;
  const pathname = url.replace(/[?#].*$/, "");
  const parsed = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (parsed.search ? "&" + parsed.search.slice(1) : "") + (parsed.hash || "");
}
export class ErrorOverlay extends (typeof HTMLElement !== "undefined" ? HTMLElement : Object) {}
`);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ANURAG EDUCATION CENTER server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AEC server:', err);
  process.exit(1);
});
