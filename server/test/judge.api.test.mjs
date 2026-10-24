// Integration test: Java judge endpoints on the real Express server.
// Run: node test/judge.api.test.mjs   (boots the server on :5057, no MongoDB needed)
import assert from 'node:assert'
import { spawn } from 'node:child_process'

const PORT = 5057
const BASE = `http://127.0.0.1:${PORT}`

// 1) boot the server as its own process (exactly how it runs in production)
const server = spawn(process.execPath, ['index.js'], {
  cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let serverLog = ''
server.stdout.on('data', (d) => { serverLog += d })
server.stderr.on('data', (d) => { serverLog += d })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitReady(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`)
      if (r.ok) return
    } catch { /* not up yet */ }
    await sleep(300)
  }
  throw new Error('server did not start:\n' + serverLog)
}
await waitReady()
console.log('server up on :' + PORT + ' ... OK')

const post = (path, body) =>
  fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const json = (r) => r.json()

// ---- 2) challenge catalog is public but redacted ----
{
  const r = await json(await fetch(`${BASE}/api/challenges?topic=linked-list`))
  assert.strictEqual(r.status, 'ok')
  assert.ok(r.challenges.length >= 10, 'linked-list deck served')
  const c = r.challenges[0]
  assert.ok(c.statement && c.starterCode && c.sampleTests, 'public fields present')
  for (const ch of r.challenges) {
    assert.strictEqual(ch.tests.filter((t) => t.stdin !== undefined).length, 0, 'no hidden stdin leaked in tests[]')
    assert.ok(ch.hiddenCount >= 2, 'hidden count reported')
  }
  console.log(`2. catalog redacted: ${r.challenges.length} linked-list challenges, no hidden test data ... OK`)
}

// ---- 3) accepted submission completes the challenge ----
{
  const code = [
    'import java.io.*;',
    'import java.util.*;',
    'public class Main {',
    '  public static void main(String[] a) throws IOException {',
    '    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
    '    int n = Integer.parseInt(br.readLine().trim());',
    '    long[] v = new long[n];',
    '    StringTokenizer st = new StringTokenizer(br.readLine());',
    '    long best = Long.MIN_VALUE;',
    '    for (int i = 0; i < n; i++) { v[i] = Long.parseLong(st.nextToken()); best = Math.max(best, v[i]); }',
    '    System.out.println(best);',
    '  }',
    '}',
  ].join('\n')
  const r = await json(await post('/api/challenge/submit', { challenge_id: 'java-array-max', language: 'java', code }))
  assert.strictEqual(r.status, 'accepted', 'expected accepted, got: ' + JSON.stringify(r).slice(0, 400))
  assert.strictEqual(r.solved, true)
  assert.strictEqual(r.passed, r.total)
  console.log(`3. accepted submission: ${r.passed}/${r.total} tests, ${r.timeMs}ms ... OK`)
}

// ---- 4) wrong answer reports failing sample case (with data) but hides hidden ----
{
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-max', language: 'java',
    code: 'public class Main { public static void main(String[] a) { System.out.println(0); } }',
  }))
  assert.strictEqual(r.status, 'wrong_answer')
  assert.strictEqual(r.solved, false)
  assert.ok(r.passed < r.total)
  const sample = r.cases.find((c) => !c.hidden)
  assert.ok(sample && sample.expected !== undefined && sample.actual !== undefined, 'sample failure shows expected/actual')
  const hidden = r.cases.filter((c) => c.hidden)
  assert.ok(hidden.length >= 2, 'hidden cases present')
  for (const h of hidden) {
    assert.strictEqual(h.expected, undefined, 'hidden expected leaked!')
    assert.strictEqual(h.actual, undefined, 'hidden actual leaked!')
    assert.strictEqual(h.error, undefined, 'hidden error leaked!')
  }
  console.log(`4. wrong answer: sample diff shown, ${hidden.length} hidden cases redacted ... OK`)
}

// ---- 5) compile error returns javac diagnostics ----
{
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-min', language: 'java',
    code: 'public class Main { public static void main(String[] a) { int x = ; } }',
  }))
  assert.strictEqual(r.status, 'compilation_error')
  assert.strictEqual(r.solved, false)
  assert.match(r.compile.errors, /error:/, 'javac diagnostics present')
  console.log('5. compile error returns javac diagnostics ... OK')
}

// ---- 6) runtime error captured safely ----
{
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-min', language: 'java',
    code: 'public class Main { public static void main(String[] a) { System.out.println(1 / 0); } }',
  }))
  assert.strictEqual(r.status, 'runtime_error')
  assert.strictEqual(r.solved, false)
  console.log('6. runtime error captured ... OK')
}

// ---- 7) infinite loop dies at the wall-clock limit (TLE), server survives ----
{
  const t0 = Date.now()
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-min', language: 'java',
    code: 'public class Main { public static void main(String[] a) { while (true) {} } }',
  }))
  const wall = Date.now() - t0
  assert.strictEqual(r.status, 'time_limit_exceeded')
  assert.strictEqual(r.solved, false)
  assert.ok(wall < 30000, 'TLE bounded (took ' + wall + 'ms)')
  console.log(`7. infinite loop -> time_limit_exceeded in ${wall}ms, server alive ... OK`)
}

// ---- 8) network access from student code is blocked ----
{
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-min', language: 'java',
    code: 'public class Main { public static void main(String[] a) throws Exception { new java.net.Socket("example.com", 80); } }',
  }))
  assert.strictEqual(r.status, 'runtime_error', 'socket must be denied')
  console.log('8. network access denied by sandbox policy ... OK')
}

// ---- 9) file write from student code is blocked ----
{
  const r = await json(await post('/api/challenge/submit', {
    challenge_id: 'java-array-min', language: 'java',
    code: 'public class Main { public static void main(String[] a) throws Exception { new java.io.FileWriter("evil.txt").write("x"); } }',
  }))
  assert.strictEqual(r.status, 'runtime_error', 'file write must be denied')
  console.log('9. file-system writes denied by sandbox policy ... OK')
}

// ---- 10) unknown challenge / bad language / empty code -> 400 ----
{
  const r1 = await post('/api/challenge/submit', { challenge_id: 'nope', language: 'java', code: 'class Main {}' })
  assert.strictEqual(r1.status, 400)
  const r2 = await post('/api/challenge/submit', { challenge_id: 'java-array-min', language: 'python3', code: 'print(1)' })
  assert.strictEqual(r2.status, 400)
  const r3 = await post('/api/challenge/submit', { challenge_id: 'java-array-min', language: 'java', code: '   ' })
  assert.strictEqual(r3.status, 400)
  console.log('10. invalid submissions rejected with 400 ... OK')
}

// ---- 11) compile_check endpoint ----
{
  const ok = await json(await post('/api/challenge/compile_check', { code: 'public class Main { int x; }' }))
  assert.strictEqual(ok.status, 'ok')
  const bad = await json(await post('/api/challenge/compile_check', { code: 'public class Main { int }' }))
  assert.strictEqual(bad.status, 'compilation_error')
  console.log('11. compile_check: ok + compilation_error ... OK')
}

server.kill()
await sleep(300)
console.log('\nAll Java judge API tests passed ✅')
process.exit(0)
