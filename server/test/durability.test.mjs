// Durability test: proves progress really survives an API restart AND a
// database restart, on disk (no in-process shortcuts).
//
// Run: node test/durability.test.mjs
//
// 1. start a MongoDB instance backed by a temporary dbPath on disk
// 2. boot server/index.js as a CHILD PROCESS, save a case, read it back
// 3. kill that process, boot a brand-new one against the same database
// 4. assert the case comes back byte-identical
// 5. stop mongod, restart it on the same dbPath, boot the API again
// 6. assert the case is still there (data lived on disk, not in memory)
import assert from 'node:assert'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoMemoryServer } from 'mongodb-memory-server'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SERVER = path.join(HERE, '..', 'index.js')
const PORT = Number(process.env.TEST_PORT || 5072)
const BASE = `http://127.0.0.1:${PORT}`
const DB_PATH = path.join(os.tmpdir(), `nexaura-durability-${process.pid}-${Date.now()}`)
fs.mkdirSync(DB_PATH, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function startMongo() {
  return MongoMemoryServer.create({ instance: { dbPath: DB_PATH, storageEngine: 'wiredTiger' } })
}

function startServer(uri) {
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, MONGODB_URI: uri, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => { log += d })
  child.stderr.on('data', (d) => { log += d })
  child.log = () => log
  return child
}

async function stopServer(child) {
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill()
  await Promise.race([exited, sleep(8000)])
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/api/health`)
      await sleep(250) // still listening — wait for the port to free up
    } catch {
      return // connection refused: the API is gone
    }
  }
  throw new Error('API process did not stop listening on ' + PORT)
}

async function waitReady(child) {
  const deadline = Date.now() + 60000
  let last = 'no response yet'
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('server exited early:\n' + child.log())
    try {
      const res = await fetch(`${BASE}/api/progress?player=ready-probe`)
      if (res.ok) return
      last = `${res.status} ${await res.text()}`
    } catch (e) {
      last = e.message + ' code=' + (e.cause && e.cause.code) + ' cause=' + (e.cause && e.cause.message)
    }
    await sleep(400)
  }
  throw new Error(`server did not become ready (${last}):\n` + child.log())
}

const get = async (player) => (await fetch(`${BASE}/api/progress?player=${player}`)).json()
const post = async (player, body) =>
  (await fetch(`${BASE}/api/progress?player=${player}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })).json()

const PLAYER = 'durability-player'
const SAVE = {
  xp: 1234,
  coins: 56,
  score: 900,
  arrayChallengesCompleted: 4,
  worldId: 'array-forest',
  worldBestScore: 777,
  worldChallenges: 4,
  caseState: {
    solvedChallenges: ['java-array-max', 'java-array-window'],
    completedWorlds: [],
    seenDialogue: ['prologue', 'intro:array-forest'],
    evidence: { 'array-forest': ['ev:array-forest:clue:timestamps'] },
    chapter: 2,
  },
}

let mongod = await startMongo()
let saved
let server = startServer(mongod.getUri('nexaura'))
try {
  // ---- 1. save through a real HTTP request ----
  await waitReady(server)
  const write = await post(PLAYER, SAVE)
  assert.strictEqual(write.status, 'ok')
  saved = write.progress
  assert.strictEqual(saved.xp, 1234)
  console.log('1. save accepted by the API on a disk-backed MongoDB ... OK')

  // ---- 2. restart the API process (not just the connection) ----
  await stopServer(server)
  server = startServer(mongod.getUri('nexaura'))
  await waitReady(server)
  const afterApiRestart = await get(PLAYER)
  assert.deepStrictEqual(afterApiRestart.progress, saved, 'identical state after API restart')
  console.log('2. new API process reads the same case back ... OK')

  // ---- 3. restart the database too ----
  await stopServer(server)
  await mongod.stop({ doCleanup: false })
  mongod = await startMongo()
  server = startServer(mongod.getUri('nexaura'))
  await waitReady(server)
  const afterDbRestart = await get(PLAYER)
  assert.deepStrictEqual(afterDbRestart.progress, saved, 'identical state after database restart')
  console.log('3. new database process reads the same case back from disk ... OK')

  // ---- 4. a lower later save still cannot erase discoveries ----
  const lower = await post(PLAYER, { xp: 1, coins: 1, score: 0, arrayChallengesCompleted: 0, caseState: {} })
  assert.strictEqual(lower.progress.xp, 1, 'xp follows the latest save')
  assert.deepStrictEqual(
    lower.progress.caseState.solvedChallenges.sort(),
    ['java-array-max', 'java-array-window'],
    'solved challenges survive a save that omits them'
  )
  assert.deepStrictEqual(
    lower.progress.caseState.evidence['array-forest'],
    ['ev:array-forest:clue:timestamps'],
    'evidence survives a save that omits it'
  )
  assert.strictEqual(lower.progress.caseState.chapter, 2, 'chapter never regresses')
  console.log('4. persisted case state remains monotonic after restart ... OK')
} finally {
  await stopServer(server)
  await mongod.stop({ doCleanup: false })
  fs.rmSync(DB_PATH, { recursive: true, force: true })
}

console.log('\nAll persistence-durability tests passed ✅')
process.exit(0)
