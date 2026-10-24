// ================================================================
// Correctness of every judge test case, proven with real javac/java.
//
// For each challenge that has a reference solution, the code is compiled
// and executed by the SAME sandbox the game uses (server/judge.js) against
// all sample AND hidden tests. A test case with a wrong expected output
// fails here, so the game never punishes a correct student solution.
//
// Run: node test/solutions.api.test.mjs [challengeIdPrefix]
// ================================================================
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { REFERENCE_SOLUTIONS } from './referenceSolutions.mjs'

const require = createRequire(import.meta.url)
const { runJava } = require('../judge.js')
const registry = require('../javaChallenges.js')

const ALL = [
  ...registry.ARRAY_JAVA_CHALLENGES,
  ...registry.LINKED_LIST_JAVA_CHALLENGES,
  ...registry.STACK_QUEUE_JAVA_CHALLENGES,
  ...registry.TREE_JAVA_CHALLENGES,
  ...registry.GRAPH_JAVA_CHALLENGES,
  ...registry.DP_JAVA_CHALLENGES,
]

const only = process.argv[2] || ''
const selected = ALL.filter((c) => c.id.startsWith(only))

let checked = 0
let skipped = 0
for (const challenge of selected) {
  const code = REFERENCE_SOLUTIONS[challenge.id]
  if (!code) {
    skipped++
    continue
  }
  const result = await runJava(code, challenge.tests, { timeLimitMs: 10_000 })
  assert.strictEqual(
    result.verdict,
    'accepted',
    `${challenge.id}: expected every test to accept, got ${result.verdict}\n` +
      (result.cases || [])
        .filter((c) => c.verdict !== 'passed')
        .map((c) => `  test ${c.index}: ${c.verdict} expected=${JSON.stringify(c.expected)} actual=${JSON.stringify(c.actual)}`)
        .join('\n') +
      (result.compile && result.compile.ok === false ? `\ncompile: ${result.compile.errors}` : '')
  )
  checked++
  console.log(`  ✓ ${challenge.id.padEnd(28)} ${result.passed}/${result.total} tests accepted`)
}

assert.ok(checked > 0, 'no reference solutions matched — check challenge ids')
console.log(`\nJudge test-case verification: ${checked} challenges fully accepted${skipped ? `, ${skipped} skipped (no reference solution)` : ''} ✅`)
