import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load .env manually (no dotenv package needed) ──
function loadEnv() {
  try {
    const raw = readFileSync(path.join(__dirname, '.env'), 'utf-8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    });
  } catch (_) { /* .env not found — use process.env directly */ }
}
loadEnv();

const app = express();
const port = process.env.PORT || 3000;

// ── Middleware ──
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ── Gemini API proxy ──────────────────────────────────────────────────
// Keeps the API key on the server — never exposed to the browser.
// POST /api/gemini  { feature, payload }
// ─────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  chat: `You are AlignME's AI career advisor — friendly, concise, and expert in job searching, resume writing, interview prep, and career development. Answer in 2-4 short paragraphs unless the user asks for more detail. Do not use markdown headers.`,

  resume_analyze: `You are an expert resume reviewer. Analyze the provided resume text and return:
1. A match score from 0–100
2. Top 5 strengths
3. Top 3 skill gaps or improvements
4. A one-paragraph executive summary
Keep your response structured and concise.`,

  cover_letter: `You are a professional cover letter writer. Write a compelling, personalized cover letter (3 paragraphs, ~250 words) based on the provided job title, company name, and candidate background. Tone: confident, professional, warm. Do not include placeholders — write the full letter.`,

  interview_prep: `You are an expert interview coach. Based on the provided job title and description, generate 8 targeted interview questions with brief answer frameworks. Format: Q: [question] → Framework: [2-3 bullet tips]. Include 2 behavioural, 3 technical, 2 situational, and 1 culture-fit question.`,

  explain_match: `You are AlignME's AI matching engine explainer. In plain, engaging English (3 short paragraphs), explain why the candidate's profile matches or doesn't match a specific job — referencing the 5 dimensions: Technical Skills, Experience Level, Work Style, Culture Fit, and Compensation.`,

  career_roadmap: `You are a senior career strategist. Based on the user's current skills and experience, create a concrete 90-day action plan and a 12-month career milestone roadmap. Be specific and actionable — include learning resources, networking steps, and application targets.`,

  job_analyze: `You are a job description analyst. Parse the provided job description and extract:
1. Must-have skills (bullet list)
2. Nice-to-have skills (bullet list)
3. Experience requirements
4. Red flags or concerns (if any)
5. Company culture signals (2–3 observations)
Keep it concise and scannable.`,
};

app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model  = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured.',
        hint:  'Add your key to .env: GEMINI_API_KEY=<your-key>  (get one free at https://aistudio.google.com/apikey)',
      });
    }

    const { feature = 'chat', payload = {} } = req.body;
    const systemInstruction = SYSTEM_PROMPTS[feature] || SYSTEM_PROMPTS.chat;

    // Build user message from payload
    let userMessage = payload.message || '';
    if (feature === 'resume_analyze' && payload.resume) {
      userMessage = `Please analyze this resume:\n\n${payload.resume}`;
    } else if (feature === 'cover_letter') {
      userMessage = `Job title: ${payload.jobTitle || ''}\nCompany: ${payload.company || ''}\nMy background: ${payload.background || ''}`;
    } else if (feature === 'interview_prep') {
      userMessage = `Job title: ${payload.jobTitle || ''}\nJob description: ${payload.description || ''}`;
    } else if (feature === 'explain_match') {
      userMessage = `Candidate skills: ${payload.skills?.join(', ') || ''}\nExperience: ${payload.experience || ''}\nJob: ${payload.jobTitle || ''} at ${payload.company || ''}\nMatch scores — Skills: ${payload.skillScore || 0}%, Experience: ${payload.expScore || 0}%, Work Style: ${payload.workScore || 0}%, Culture: ${payload.cultureScore || 0}%, Compensation: ${payload.compScore || 0}%`;
    } else if (feature === 'career_roadmap') {
      userMessage = `My skills: ${payload.skills?.join(', ') || ''}\nExperience level: ${payload.experience || ''}\nTarget role: ${payload.targetRole || 'not specified'}\nGoals: ${payload.goals || 'advance in career'}`;
    } else if (feature === 'job_analyze') {
      userMessage = `Please analyze this job description:\n\n${payload.description || ''}`;
    }

    if (!userMessage.trim()) {
      return res.status(400).json({ error: 'No message provided.' });
    }

    // Build request for Gemini
    const geminiBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [],
    };

    // Include conversation history for chat feature
    if (feature === 'chat' && Array.isArray(payload.history)) {
      payload.history.forEach(turn => {
        geminiBody.contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      });
    }
    geminiBody.contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return res.status(geminiRes.status).json({ error: 'Gemini API error', details: errText });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text, feature, model });

  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── EJS view engine (kept for future use) ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Page routes ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Extension-less URLs → /page.html
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.includes('.') || page.startsWith('api')) return next();
  const filePath = path.join(__dirname, 'public', `${page}.html`);
  res.sendFile(filePath, err => { if (err) next(); });
});

// ── Error handlers ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  console.log('404:', req.url);
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── Start ──
app.listen(port, () => {
  console.log(`\n🚀  AlignME running at http://localhost:${port}`);
  console.log(`📁  Static files: ${path.join(__dirname, 'public')}`);
  console.log(`🤖  Gemini API: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' ? '✅ Configured' : '⚠️  Key missing — add to .env'}\n`);
});
