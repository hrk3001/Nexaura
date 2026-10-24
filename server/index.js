const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const { runJava, compileCheck } = require('./judge.js');
const { publicChallenge, wrapForJudge } = require('./javaShared.js');
const {
  ARRAY_JAVA_CHALLENGES,
  LINKED_LIST_JAVA_CHALLENGES,
  STACK_QUEUE_JAVA_CHALLENGES,
  TREE_JAVA_CHALLENGES,
  GRAPH_JAVA_CHALLENGES,
  DP_JAVA_CHALLENGES,
} = require('./javaChallenges.js');

// One ordered catalog for all six worlds. Hidden tests stay server-side only.
const CHALLENGE_DECKS = {
  array: ARRAY_JAVA_CHALLENGES,
  'linked-list': LINKED_LIST_JAVA_CHALLENGES,
  'stack-queue': STACK_QUEUE_JAVA_CHALLENGES,
  tree: TREE_JAVA_CHALLENGES,
  graph: GRAPH_JAVA_CHALLENGES,
  'dynamic-programming': DP_JAVA_CHALLENGES,
};

const JAVA_CHALLENGES = new Map(
  Object.values(CHALLENGE_DECKS).flat().map((c) => [c.id, c])
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Nexaura game server running' }));

// Serve the built client at root so localhost:5000 opens the game directly.
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ===== Persistent player progress (MongoDB via mongoose) =====
const MONGODB_URI = process.env.MONGODB_URI || '';

const worldStatSchema = new mongoose.Schema({
  bestScore: { type: Number, default: 0 },
  arrayChallengesCompleted: { type: Number, default: 0 },
}, { _id: false });

const progressSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  arrayChallengesCompleted: { type: Number, default: 0 },
  worlds: { type: Map, of: worldStatSchema },
  // Investigation state: collected evidence, completed worlds, solved
  // challenges and seen dialogue. Stored as Mixed so the client's case model
  // can evolve without a migration.
  caseState: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { collection: 'progresses' });

const Progress = mongoose.model('Progress', progressSchema);

const PROGRESS_DEFAULTS = { xp: 0, coins: 0, bestScore: 0, arrayChallengesCompleted: 0 };

// ===== Case-state merge (monotonic) =====
// A save can never erase evidence or completed challenges: arrays are unioned
// and per-world evidence lists are unioned. This is what makes replaying a
// solved challenge reward-free on every device, not just in one tab.
const CASE_ARRAYS = ['solvedChallenges', 'completedWorlds', 'seenDialogue'];

function uniqueStrings(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((v) => typeof v === 'string' && v.length <= 120))];
}

function normalizeCaseState(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const key of CASE_ARRAYS) out[key] = uniqueStrings(src[key]);
  out.evidence = {};
  const evidence = src.evidence && typeof src.evidence === 'object' ? src.evidence : {};
  for (const [worldId, ids] of Object.entries(evidence)) {
    if (!validWorldId(worldId)) continue;
    out.evidence[worldId] = uniqueStrings(ids);
  }
  out.chapter = Number.isFinite(Number(src.chapter)) ? Math.max(0, Math.floor(Number(src.chapter))) : 0;
  return out;
}

function mergeCaseState(prev, incoming) {
  const a = normalizeCaseState(prev);
  const b = normalizeCaseState(incoming);
  const merged = {};
  for (const key of CASE_ARRAYS) merged[key] = [...new Set([...a[key], ...b[key]])];
  merged.evidence = { ...a.evidence };
  for (const [worldId, ids] of Object.entries(b.evidence)) {
    merged.evidence[worldId] = [...new Set([...(merged.evidence[worldId] || []), ...ids])];
  }
  merged.chapter = Math.max(a.chapter, b.chapter);
  return merged;
}
let dbReady = false;

// Mongoose Map fields can come back as Map or POJO depending on lean(); normalize.
function normalizeWorlds(worlds) {
  if (!worlds) return {};
  const obj = worlds instanceof Map ? Object.fromEntries(worlds) : worlds;
  const out = {};
  for (const [id, s] of Object.entries(obj)) {
    out[id] = { bestScore: s?.bestScore || 0, arrayChallengesCompleted: s?.arrayChallengesCompleted || 0 };
  }
  return out;
}

function validWorldId(id) {
  return typeof id === 'string' && /^[-\w]+$/.test(id) ? id : null;
}

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 })
    .then(() => { dbReady = true; console.log('✅ MongoDB connected'); })
    .catch((err) => console.error('⚠️ MongoDB unreachable — progress endpoints return 503 until it is:', err.message));
} else {
  console.warn('⚠️ MONGODB_URI not set — progress endpoints serve ephemeral in-memory data (dev only)');
}

// Dev fallback so the game works with zero setup; durable storage is MongoDB.
const memoryProgress = new Map();

// GET /api/progress?player=<id>  — load saved progress for Array Forest start
app.get('/api/progress', async (req, res) => {
  const player = String(req.query.player || 'guest');
  if (MONGODB_URI && !dbReady) {
    return res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
  try {
    let progress;
    if (MONGODB_URI) {
      const doc = await Progress.findOne({ playerId: player }).lean();
      progress = doc
        ? { xp: doc.xp, coins: doc.coins, bestScore: doc.bestScore, arrayChallengesCompleted: doc.arrayChallengesCompleted, worlds: normalizeWorlds(doc.worlds), caseState: normalizeCaseState(doc.caseState) }
        : { ...PROGRESS_DEFAULTS, worlds: {}, caseState: normalizeCaseState({}) };
    } else {
      const mem = memoryProgress.get(player);
      progress = mem
        ? { ...mem, worlds: normalizeWorlds(mem.worlds), caseState: normalizeCaseState(mem.caseState) }
        : { ...PROGRESS_DEFAULTS, worlds: {}, caseState: normalizeCaseState({}) };
    }
    res.json({ status: 'ok', player, progress });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/progress?player=<id>  — save progress on meaningful events
app.post('/api/progress', async (req, res) => {
  const player = String(req.query.player || 'guest');
  const body = req.body || {};
  const xp = Number(body.xp), coins = Number(body.coins), score = Number(body.score);
  const completed = Number(body.arrayChallengesCompleted);
  if (!Number.isFinite(xp) || !Number.isFinite(coins) || !Number.isFinite(score) || !Number.isFinite(completed)) {
    return res.status(400).json({ status: 'error', message: 'xp, coins, score, arrayChallengesCompleted (numbers) required' });
  }
  if (MONGODB_URI && !dbReady) {
    return res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
  try {
    const worldId = validWorldId(body.worldId);
    const worldBest = Math.floor(Number(body.worldBestScore) || 0);
    const worldChallenges = Math.floor(Number(body.worldChallenges) || 0);
    const incomingCase = normalizeCaseState(body.caseState);
    let progress;
    if (MONGODB_URI) {
      const current = await Progress.findOne({ playerId: player }).lean();
      const caseState = mergeCaseState(current && current.caseState, incomingCase);
      const update = {
        $set: { xp, coins, caseState },
        $max: { bestScore: Math.floor(score), arrayChallengesCompleted: completed },
      };
      if (worldId) {
        update.$max[`worlds.${worldId}.bestScore`] = worldBest;
        update.$max[`worlds.${worldId}.arrayChallengesCompleted`] = worldChallenges;
      }
      const doc = await Progress.findOneAndUpdate(
        { playerId: player },
        update,
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, lean: true }
      );
      progress = { xp: doc.xp, coins: doc.coins, bestScore: doc.bestScore, arrayChallengesCompleted: doc.arrayChallengesCompleted, worlds: normalizeWorlds(doc.worlds), caseState: normalizeCaseState(doc.caseState) };
    } else {
      const prev = memoryProgress.get(player) || { ...PROGRESS_DEFAULTS, worlds: {} };
      progress = {
        xp, coins,
        bestScore: Math.max(prev.bestScore, Math.floor(score)),
        arrayChallengesCompleted: Math.max(prev.arrayChallengesCompleted, completed),
        worlds: normalizeWorlds(prev.worlds),
        caseState: mergeCaseState(prev.caseState, incomingCase),
      };
      if (worldId) {
        const w = progress.worlds[worldId] || { bestScore: 0, arrayChallengesCompleted: 0 };
        progress.worlds[worldId] = {
          bestScore: Math.max(w.bestScore, worldBest),
          arrayChallengesCompleted: Math.max(w.arrayChallengesCompleted, worldChallenges),
        };
      }
      memoryProgress.set(player, progress);
    }
    res.json({ status: 'ok', player, progress });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Serve the built game UI when it exists (production). In development the
// Vite dev server owns the page and proxies /api here.
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(CLIENT_DIST));
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// ================================================================
// Java challenge API — the ONLY execution path.
//
// Student code is never evaluated here: it is written to a throwaway temp
// directory and compiled/run in fresh child processes by judge.js, with
// wall-clock limits, heap caps and a SecurityManager blocking network and
// file access. A queue caps concurrent judge runs so a flood of submissions
// can never exhaust the server's CPU or memory. Every failure mode returns
// a structured verdict — nothing throws into Express's way.
// ================================================================
const MAX_CODE_BYTES = 64 * 1024; // 64 KB of source is far beyond any solution here
const MAX_CONCURRENT_RUNS = Math.max(1, Math.min(2, Math.max(1, require('os').cpus().length - 1)));
let activeRuns = 0;
const runQueue = [];

function withRunSlot(fn) {
  return new Promise((resolve) => {
    const start = () => {
      activeRuns++;
      fn().then(resolve, resolve).finally(() => {
        activeRuns--;
        const next = runQueue.shift();
        if (next) next();
      });
    };
    if (activeRuns < MAX_CONCURRENT_RUNS) start();
    else runQueue.push(start);
  });
}

function validateSubmit(body) {
  const { challenge_id: challengeId, language, code } = body || {};
  if (!challengeId || !language || typeof code !== 'string' || !code.trim()) {
    return { error: 'challenge_id, language and non-empty code are required' };
  }
  if (language !== 'java') {
    return { error: 'Only java is supported. The browser never executes student code.' };
  }
  if (!JAVA_CHALLENGES.has(challengeId)) {
    return { error: `Unknown challenge "${challengeId}"` };
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return { error: 'Code too large (64 KB limit).' };
  }
  return { challenge: JAVA_CHALLENGES.get(challengeId) };
}

function verdictFor(res, c) {
  // verdict -> HTTP status mapping: client mistakes are 4xx, judge trouble 5xx
  const status =
    c === 'compilation_error' || c === 'wrong_answer' || c === 'runtime_error' ||
    c === 'time_limit_exceeded' || c === 'accepted'
      ? 200
      : 500;
  return res.status(status);
}

// GET /api/challenges?topic=array|linked-list — public challenge data only
// (statement, starter code, sample tests). Hidden tests NEVER leave the server.
app.get('/api/challenges', (req, res) => {
  const topic = String(req.query.topic || '');
  const pool = CHALLENGE_DECKS[topic] || Object.values(CHALLENGE_DECKS).flat();
  res.json({ status: 'ok', challenges: pool.map(publicChallenge) });
});

app.get('/api/challenges/:id', (req, res) => {
  const c = JAVA_CHALLENGES.get(req.params.id);
  if (!c) return res.status(404).json({ status: 'error', message: 'Unknown challenge' });
  res.json({ status: 'ok', challenge: publicChallenge(c) });
});

// POST /api/challenge/submit { challenge_id, language: 'java', code }
// Runs against sample + hidden tests in the isolated sandbox.
app.post('/api/challenge/submit', (req, res) => {
  const v = validateSubmit(req.body);
  if (v.error) return res.status(400).json({ status: 'error', message: v.error });
  const challenge = v.challenge;
  withRunSlot(() => runJava(wrapForJudge(req.body.code), challenge.tests, {
    timeLimitMs: Math.min(challenge.timeLimitSec * 1000, 10_000),
  }))
    .then((result) => {
      // Redact: forward per-case verdicts but never stdin/expected data.
      const cases = (result.cases || []).map((k) => ({
        index: k.index,
        verdict: k.verdict,
        hidden: k.hidden !== false,
        expected: k.hidden ? undefined : k.expected,
        actual: k.hidden ? undefined : k.actual,
        error: k.hidden ? undefined : k.error,
      }));
      verdictFor(res, result.verdict).json({
        status: result.verdict,
        passed: result.passed,
        total: result.total,
        timeMs: result.timeMs,
        compile: result.compile,
        cases,
        message: result.message || '',
        // Only a fully-accepted run completes the gate, so only an accepted
        // repair reveals the approach explanation.
        explanation: result.verdict === 'accepted' ? challenge.solutionSketch || '' : '',
        solved: result.verdict === 'accepted',
      });
    })
    .catch((e) => {
      // Defensive: runJava resolves everything; this is a belt-and-braces net
      // so an unexpected judge bug can never crash the Express process.
      console.error('judge failure:', e);
      res.status(500).json({
        status: 'runtime_error',
        message: 'Judge unavailable — try again in a moment.',
        solved: false,
      });
    });
});

// POST /api/challenge/compile_check { code } — quick syntax check, no execution.
app.post('/api/challenge/compile_check', (req, res) => {
  const code = req.body && typeof req.body.code === 'string' ? req.body.code : '';
  if (!code.trim()) return res.status(400).json({ status: 'error', message: 'code is required' });
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return res.status(400).json({ status: 'error', message: 'Code too large (64 KB limit).' });
  }
  withRunSlot(() => compileCheck(wrapForJudge(code)))
    .then((r) => res.json(r))
    .catch(() => res.status(500).json({ status: 'error', message: 'Compiler unavailable.' }));
});

app.listen(PORT, () => console.log(`🚀 Nexaura real-time coding game server on port ${PORT}`));
