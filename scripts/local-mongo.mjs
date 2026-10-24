#!/usr/bin/env node
// Local, persistent MongoDB for development.
//
// `npm run db` starts a real `mongod` (NOT the in-memory test double) with its
// data files under .data/mongodb, so progress written by the API survives a
// restart. Point the API at it with:
//
//   MONGODB_URI=mongodb://127.0.0.1:27017/nexaura
//
// The mongod executable is resolved from (in order): $MONGOD_BINARY, PATH, a
// mongodb-memory-server binary cache, or by asking mongodb-memory-server to
// download one (it is already a server devDependency).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DB_PATH = process.env.MONGO_DB_PATH || path.join(ROOT, '.data', 'mongodb')
const PORT = process.env.MONGO_PORT || '27017'
const BIND_IP = process.env.MONGO_BIND_IP || '127.0.0.1'

const EXE = process.platform === 'win32' ? 'mongod.exe' : 'mongod'

function onPath(name) {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue
    const candidate = path.join(dir, name)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function cachedBinary() {
  const dirs = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'mongodb-binaries'),
    path.join(os.homedir(), '.cache', 'mongodb-binaries'),
    path.join(ROOT, '.cache', 'mongodb-binaries'),
  ].filter(Boolean)
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    const found = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('mongod') && !f.endsWith('.md5'))
      .map((f) => path.join(dir, f))
      .filter((f) => fs.existsSync(f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    if (found.length) return found[0]
  }
  return null
}

async function resolveMongod() {
  if (process.env.MONGOD_BINARY) return process.env.MONGOD_BINARY
  const fromPath = onPath(EXE)
  if (fromPath) return fromPath
  const cached = cachedBinary()
  if (cached) return cached
  // Last resort: let mongodb-memory-server fetch a real mongod binary.
  const requireFromServer = createRequire(path.join(ROOT, 'server', 'package.json'))
  const { MongoBinary } = requireFromServer('mongodb-memory-server-core')
  console.log('No mongod found; downloading one via mongodb-memory-server …')
  return MongoBinary.getPath({})
}

const binary = await resolveMongod()
fs.mkdirSync(DB_PATH, { recursive: true })

console.log(`mongod:  ${binary}`)
console.log(`dbpath:  ${DB_PATH}`)
console.log(`listen:  mongodb://${BIND_IP}:${PORT}`)
console.log('Stop with Ctrl+C. Data survives restarts.\n')

const child = spawn(
  binary,
  ['--dbpath', DB_PATH, '--port', String(PORT), '--bind_ip', BIND_IP],
  { stdio: 'inherit' }
)

const shutdown = (signal) => {
  if (!child.killed) child.kill(signal)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
child.on('exit', (code, signal) => {
  if (signal) process.exit(0)
  process.exit(code ?? 0)
})
child.on('error', (err) => {
  console.error(`Could not start mongod: ${err.message}`)
  process.exit(1)
})
