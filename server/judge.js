// ================================================================
// Nexaura Java judge — isolated sandbox execution.
//
// SECURITY MODEL
//  - Student code NEVER runs inside this (Express) process. Every submission
//    is compiled and executed in a fresh, short-lived `javac`/`java` child
//    process tree in a throwaway temp directory.
//  - JVM flags cap heap memory (-Xmx) so runaway allocations die instead of
//    exhausting the host.
//  - A wall-clock timer kills every run, so infinite loops always terminate.
//  - A SecurityManager policy denies network sockets and file writes, and
//    only allows reads of the JDK and the submission's own directory.
//  - Output and input are size-capped; temp dirs are deleted after every run.
//  - The judge holds no shared mutable state, so a crashing submission cannot
//    corrupt the server. All failures surface as structured verdicts.
// ================================================================
const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

const JAVA = 'java'
const JAVAC = 'javac'

// Hard limits (wall-clock, so they hold regardless of what the code does)
const COMPILE_TIMEOUT_MS = 25_000
const COMPILE_HEAP_MB = 256
const RUN_HEAP_MB = 128
const PER_TEST_TIMEOUT_MS = 5_000 // wall clock per test case (includes JVM start)
const OUTPUT_LIMIT = 8 * 1024 * 1024 // 8 MB captured stdout per process
const INPUT_LIMIT = 8 * 1024 * 1024 // 8 MB max stdin per test case
const STDERR_LIMIT = 16 * 1024
const TOTAL_BUDGET_MS = 120_000 // whole-submission watchdog

// One shared policy file, created lazily in the OS temp dir.
// Deliberately minimal and path-free: expanding ${user.dir}/${java.home} would
// embed raw Windows backslashes, which the policy parser rejects as escapes.
// Classpath loading and stdin/stdout are JVM-privileged and need no entries,
// so with nothing granted below every file and socket operation is denied.
let policyFile = null
function getPolicyFile() {
  if (policyFile) return policyFile
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexaura-policy-'))
  policyFile = path.join(dir, 'nexaura.policy')
  fs.writeFileSync(policyFile, [
    'grant {',
    '  permission java.util.PropertyPermission "*", "read";',
    '  permission java.lang.RuntimePermission "exitVM.*";',
    // NOTE: no java.net.SocketPermission at all -> network access denied.
    //       no java.io.FilePermission at all      -> file access denied.
    '};',
    '',
  ].join('\n'))
  return policyFile
}

function hardKill(proc) {
  // Kill the whole child tree; taskkill /T is the reliable way on Windows.
  try {
    if (process.platform === 'win32') {
      if (proc.pid) spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true })
    } else {
      proc.kill('SIGKILL')
    }
  } catch { /* already dead */ }
}

function trimmed(s) {
  s = String(s)
  return s.length > 300 ? s.slice(0, 300) + '…' : s
}

// Spawn a process with wall-clock kill, output caps and full result capture.
function runProcess(cmd, args, { cwd, input, timeoutMs }) {
  return new Promise((resolve) => {
    let settled = false
    let timedOut = false
    let outSize = 0
    let errSize = 0
    let out = ''
    let err = ''
    let outTruncated = false

    // Strip env vars that silently inject options into every JVM we start.
    const env = { ...process.env }
    delete env.JAVA_TOOL_OPTIONS
    delete env._JAVA_OPTIONS

    const proc = spawn(cmd, args, { cwd, windowsHide: true, env })

    const timer = setTimeout(() => {
      timedOut = true
      hardKill(proc)
    }, timeoutMs)

    proc.stdout.on('data', (d) => {
      if (outSize >= OUTPUT_LIMIT) { outTruncated = true; return }
      outSize += d.length
      out += d
      if (outSize >= OUTPUT_LIMIT) { outTruncated = true; hardKill(proc) }
    })
    proc.stderr.on('data', (d) => {
      if (errSize >= STDERR_LIMIT) return
      errSize += d.length
      err += d
    })
    // A child that exits without reading all stdin triggers EPIPE here;
    // swallow it so the judge (and the server) never crash on it.
    proc.stdin.on('error', () => {})
    proc.on('error', (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: false, spawnError: e.message, stdout: '', stderr: '', timedOut: false, truncated: false })
    })
    proc.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: true, code, stdout: out, stderr: err, timedOut, truncated: outTruncated })
    })

    if (input != null) {
      proc.stdin.write(String(input).slice(0, INPUT_LIMIT))
    }
    proc.stdin.end()
  })
}

// Filter JVM startup noise out of stderr so students see THEIR errors.
function cleanStderr(s) {
  return s
    .split(/\r?\n/)
    .filter((l) => !/^WARNING:/.test(l) && !/^Note:/.test(l) && !/^Picked up /.test(l))
    .join('\n')
    .trim()
}

// Strip the sandbox temp dir from compiler/runtime messages so students see
// paths like "Main.java:5: error: ..." instead of absolute temp paths.
function normalizePath(s, dir) {
  return s
    .split(/\r?\n/)
    .map((l) => l.split(dir).join('').replace(/^[\\/]+/, ''))
    .join('\n')
}

// javac phase -> { ok, errors }
async function compile(dir) {
  const r = await runProcess(
    JAVAC,
    ['-encoding', 'UTF-8', '-J-Xmx' + COMPILE_HEAP_MB + 'm', '-d', '.', 'Main.java'],
    { cwd: dir, timeoutMs: COMPILE_TIMEOUT_MS }
  )
  if (r.spawnError) return { ok: false, spawnError: r.spawnError }
  if (r.timedOut) return { ok: false, errors: 'Compilation timed out.' }
  if (r.code !== 0) {
    return { ok: false, errors: normalizePath(cleanStderr(r.stderr) || 'Compilation failed.', dir) }
  }
  return { ok: true }
}

// Exact-ish output comparison, the way standard judges do it:
// per-line trailing whitespace trimmed, trailing blank lines dropped.
function normalizeOutput(s) {
  const lines = String(s).split(/\r?\n/).map((l) => l.replace(/[ \t]+$/, ''))
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

function judgeOneCase(result, expected) {
  if (result.timedOut) return 'time_limit_exceeded'
  if (result.truncated) return 'output_limit'
  if (result.code !== 0) return 'runtime_error'
  return normalizeOutput(result.stdout) === normalizeOutput(expected) ? 'passed' : 'wrong_answer'
}

// Run a compiled Main against one test case.
async function runCase(dir, test, timeLimitMs) {
  const r = await runProcess(
    JAVA,
    [
      '-Djava.security.manager',
      '-Djava.security.policy==' + getPolicyFile(),
      '-Xmx' + RUN_HEAP_MB + 'm',
      '-XX:+UseSerialGC',
      '-Dfile.encoding=UTF-8',
      '-cp', '.',
      'Main',
    ],
    { cwd: dir, input: test.stdin, timeoutMs: timeLimitMs || PER_TEST_TIMEOUT_MS }
  )
  const stderr = normalizePath(cleanStderr(r.stderr), dir)
  return {
    verdict: r.spawnError ? 'runtime_error' : judgeOneCase(r, test.expectedOutput),
    stdout: r.stdout,
    stderr,
    truncated: r.truncated,
    spawnError: r.spawnError,
  }
}

// ===== Public API =================================================

/**
 * Compile + run student Java against a list of test cases.
 * @param {string} code    student source (must define `public class Main`)
 * @param {Array<{stdin: string, expectedOutput: string, hidden?: boolean}>} tests
 * @param {{timeLimitMs?: number}} opts
 * @returns {{ verdict, passed, total, timeMs, compile, cases, message }}
 */
async function runJava(code, tests, opts = {}) {
  const started = Date.now()
  const dir = path.join(os.tmpdir(), 'nexaura-judge-' + crypto.randomBytes(6).toString('hex'))
  const timeLimitMs = Math.min(Math.max(opts.timeLimitMs || PER_TEST_TIMEOUT_MS, 1000), 30_000)

  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'Main.java'), code)

    // ---- compile ----
    const comp = await compile(dir)
    if (!comp.ok) {
      return {
        verdict: 'compilation_error',
        passed: 0,
        total: tests.length,
        timeMs: Date.now() - started,
        compile: { ok: false, errors: comp.spawnError ? 'Judge could not start javac: ' + comp.spawnError : comp.errors },
        cases: [],
        message: 'Compilation Error — fix the errors below and try again.',
      }
    }

    // ---- run cases (a fatal verdict ends the run; the rest are skipped) ----
    const cases = []
    let verdict = 'accepted'
    let finalStderr = ''
    const deadline = Date.now() + TOTAL_BUDGET_MS
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i]
      if (verdict !== 'accepted' && verdict !== 'wrong_answer') {
        // a fatal verdict already decided the outcome; mark the rest skipped
        cases.push({ index: i + 1, hidden: !!t.hidden, verdict: 'skipped' })
        continue
      }
      if (deadline - Date.now() <= 0) {
        cases.push({ index: i + 1, hidden: !!t.hidden, verdict: 'time_limit_exceeded' })
        if (verdict === 'accepted') verdict = 'time_limit_exceeded'
        continue
      }
      const res = await runCase(dir, t, timeLimitMs)
      const v = res.verdict
      const entry = { index: i + 1, hidden: !!t.hidden, verdict: v }
      if (v !== 'passed') {
        entry.expected = trimmed(t.expectedOutput)
        entry.actual = trimmed(res.stdout)
        if (v === 'runtime_error') {
          entry.error = trimmed(res.stderr || 'The program exited with an error.')
          finalStderr = res.stderr || ''
        }
        if (v === 'time_limit_exceeded') entry.error = `Exceeded ${timeLimitMs} ms — possible infinite loop or too slow.`
        if (v === 'output_limit') entry.error = 'Printed too much output.'
        if (verdict === 'accepted') verdict = v === 'output_limit' ? 'runtime_error' : v
      }
      cases.push(entry)
    }

    const passed = cases.filter((c) => c.verdict === 'passed').length
    const messages = {
      accepted: `All ${tests.length} tests passed.`,
      wrong_answer: `Wrong Answer — ${passed}/${tests.length} tests passed. Check the failing case.`,
      runtime_error: `Runtime Error — ${passed}/${tests.length} tests passed. See the error output.`,
      time_limit_exceeded: 'Time Limit Exceeded — infinite loop or an algorithm that is too slow.',
      compilation_error: 'Compilation Error.',
    }
    return {
      verdict,
      passed,
      total: tests.length,
      timeMs: Date.now() - started,
      compile: { ok: true, errors: '' },
      cases,
      stderr: finalStderr,
      message: messages[verdict] || 'Done.',
    }
  } finally {
    // Always clean the sandbox directory, even on failure.
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* best effort */ }
  }
}

/** Compile-only check (no execution). */
async function compileCheck(code) {
  const dir = path.join(os.tmpdir(), 'nexaura-judge-' + crypto.randomBytes(6).toString('hex'))
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'Main.java'), code)
    const comp = await compile(dir)
    return { status: comp.ok ? 'ok' : 'compilation_error', errors: comp.errors || [] }
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* best effort */ }
  }
}

module.exports = { runJava, compileCheck }
