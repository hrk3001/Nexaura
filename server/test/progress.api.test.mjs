// Integration test for /api/progress backed by MongoDB (in-memory instance).
// Run: node test/progress.api.test.mjs  (downloads a mongod binary on first use)
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { MongoMemoryServer } from 'mongodb-memory-server'

const require = createRequire(import.meta.url)
// A dedicated port keeps this test independent of a dev server on :5000.
const PORT = process.env.TEST_PORT || 5059
const BASE = `http://127.0.0.1:${PORT}`

// 1) start ephemeral MongoDB, then boot the server pointed at it
console.log('starting in-memory MongoDB (first run downloads a binary)…')
const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('nexaura')
process.env.PORT = String(PORT)
require('../index.js') // boots Express and connects mongoose

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitReady(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/progress?player=ready-probe`)
      if (r.ok) return
    } catch { /* server not up yet */ }
    await sleep(1000)
  }
  throw new Error('server/DB did not become ready in time')
}
await waitReady()
console.log('server up, MongoDB connected … OK')

const get = async (player) => (await fetch(`${BASE}/api/progress?player=${player}`)).json()
const post = async (player, body) =>
  (await fetch(`${BASE}/api/progress?player=${player}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })).json()

// 2) unknown player -> zeroed defaults (now includes an empty per-world map)
{
  const r = await get('fresh-player')
  assert.strictEqual(r.status, 'ok')
  assert.deepStrictEqual(r.progress, {
    xp: 0,
    coins: 0,
    bestScore: 0,
    arrayChallengesCompleted: 0,
    worlds: {},
    caseState: { solvedChallenges: [], completedWorlds: [], seenDialogue: [], evidence: {}, chapter: 0 },
  })
  console.log('1. unknown player returns zeroed defaults (incl. empty case state) ... OK')
}

// 3) POST then GET round-trip (persistence in MongoDB)
{
  const w = await post('player-a', { xp: 250, coins: 90, score: 4200, arrayChallengesCompleted: 3 })
  assert.strictEqual(w.status, 'ok')
  const r = await get('player-a')
  assert.strictEqual(r.progress.xp, 250)
  assert.strictEqual(r.progress.coins, 90)
  assert.strictEqual(r.progress.bestScore, 4200)
  assert.strictEqual(r.progress.arrayChallengesCompleted, 3)
  console.log('2. POST -> GET round-trip persists in MongoDB ... OK')
}

// 4) max semantics: lower later saves never regress bestScore/completed
{
  await post('player-a', { xp: 300, coins: 95, score: 100, arrayChallengesCompleted: 1 })
  const r = await get('player-a')
  assert.strictEqual(r.progress.bestScore, 4200, 'bestScore keeps the max')
  assert.strictEqual(r.progress.arrayChallengesCompleted, 3, 'completed keeps the max')
  assert.strictEqual(r.progress.xp, 300, 'xp tracks latest')
  console.log('3. bestScore/completed use max-aggregation ... OK')
}

// 4b) investigation case state: persisted, unioned, never erased
{
  const caseState = {
    evidence: { 'array-forest': ['ev:array-forest:clue:timestamps'] },
    solvedChallenges: ['java-array-max'],
    completedWorlds: [],
    seenDialogue: ['prologue', 'intro:array-forest'],
    chapter: 1,
  }
  await post('player-case', { xp: 100, coins: 25, score: 0, arrayChallengesCompleted: 1, caseState })
  let r = await get('player-case')
  assert.deepStrictEqual(r.progress.caseState.solvedChallenges, ['java-array-max'], 'solved challenge persisted')
  assert.deepStrictEqual(
    r.progress.caseState.evidence['array-forest'],
    ['ev:array-forest:clue:timestamps'],
    'evidence persisted'
  )
  assert.strictEqual(r.progress.caseState.chapter, 1)

  // A later save that omits the evidence must not erase it.
  await post('player-case', { xp: 140, coins: 30, score: 0, arrayChallengesCompleted: 2, caseState: { solvedChallenges: ['java-array-min'] } })
  r = await get('player-case')
  assert.strictEqual(r.progress.caseState.solvedChallenges.length, 2, 'solved challenges unioned')
  assert.ok(r.progress.caseState.solvedChallenges.includes('java-array-max'))
  assert.deepStrictEqual(
    r.progress.caseState.evidence['array-forest'],
    ['ev:array-forest:clue:timestamps'],
    'omitted evidence survives a save'
  )

  // New additions merge in; completed worlds persist.
  await post('player-case', {
    xp: 900, coins: 200, score: 0, arrayChallengesCompleted: 4,
    caseState: {
      evidence: { 'array-forest': ['ev:array-forest:code:java-array-max', 'ev:array-forest:clue:timestamps'] },
      completedWorlds: ['array-forest'],
      seenDialogue: ['intro:linked-list-river'],
      chapter: 2,
    },
  })
  r = await get('player-case')
  assert.deepStrictEqual(
    new Set(r.progress.caseState.evidence['array-forest']),
    new Set(['ev:array-forest:clue:timestamps', 'ev:array-forest:code:java-array-max']),
    'evidence unioned without duplicates'
  )
  assert.deepStrictEqual(r.progress.caseState.completedWorlds, ['array-forest'])
  assert.strictEqual(r.progress.caseState.chapter, 2, 'chapter is monotonic')
  console.log('4b. case state: persisted, unioned, monotonic, never erased ... OK')
}

// 5) player isolation
{
  const r = await get('player-b')
  assert.strictEqual(r.progress.xp, 0)
  console.log('4. players are isolated ... OK')
}

// 6) invalid payload -> 400
{
  const res = await fetch(`${BASE}/api/progress?player=player-a`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ xp: 'NaN' }),
  })
  assert.strictEqual(res.status, 400)
  console.log('5. invalid payload rejected with 400 ... OK')
}

// 6b) world-scoped stats: separate bests per realm, max-aggregated, no worldId = untouched
{
  await post('player-a', { xp: 300, coins: 95, score: 900, arrayChallengesCompleted: 1, worldId: 'array-forest', worldBestScore: 5000, worldChallenges: 4 })
  let r = await get('player-a')
  assert.strictEqual(r.progress.worlds['array-forest'].bestScore, 5000, 'world best stored')
  assert.strictEqual(r.progress.worlds['array-forest'].arrayChallengesCompleted, 4, 'world challenges stored')
  // a lower later save must not regress the world best
  await post('player-a', { xp: 310, coins: 96, score: 950, arrayChallengesCompleted: 2, worldId: 'array-forest', worldBestScore: 1200, worldChallenges: 2 })
  r = await get('player-a')
  assert.strictEqual(r.progress.worlds['array-forest'].bestScore, 5000, 'world best keeps the max')
  assert.strictEqual(r.progress.worlds['array-forest'].arrayChallengesCompleted, 4, 'world challenges keep the max')
  assert.strictEqual(r.progress.bestScore, 4200, 'global best unchanged by world stats')
  // a save without worldId must not touch world stats
  await post('player-a', { xp: 320, coins: 97, score: 960, arrayChallengesCompleted: 2 })
  r = await get('player-a')
  assert.strictEqual(r.progress.worlds['array-forest'].bestScore, 5000, 'no-worldId save leaves world stats intact')
  // other players unaffected
  const rb = await get('player-b')
  assert.ok(!rb.progress.worlds['array-forest'], 'player-b has no array-forest stats')
  console.log('5b. world-scoped bests: stored, max-aggregated, isolated ... OK')
}

// 7) data lives in MongoDB, not in the process: drop the connection and read
// again from a fresh one. (A full API + database restart with disk persistence
// is proven separately by test/durability.test.mjs.)
{
  const mongoose = require('mongoose')
  await mongoose.disconnect()
  await mongoose.connect(process.env.MONGODB_URI)
  const r = await get('player-a')
  assert.strictEqual(r.progress.bestScore, 4200, 'data survives a fresh database connection')
  assert.strictEqual(r.progress.worlds['array-forest'].bestScore, 5000, 'world stats survive too')
  console.log('6. data survives a dropped + re-established database connection ... OK')
}

await mongooseDisconnect()
await mongod.stop()
console.log('\nAll MongoDB progress API tests passed ✅')
process.exit(0)

function mongooseDisconnect() {
  const mongoose = require('mongoose')
  return mongoose.disconnect()
}
