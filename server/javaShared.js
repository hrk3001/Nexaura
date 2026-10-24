// ================================================================
// Nexaura — shared Java challenge factory + judge-facing helpers.
//
// One shape for every Java coding challenge; validated at creation so bad
// registry data fails fast. Hidden tests never leave this process: the API
// layer sends only redacted copies (verdict fields, no stdin/expected).
// ================================================================

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const TOPICS = ['array', 'linked-list', 'stack-queue', 'tree', 'graph', 'dynamic-programming']

// Public (browser-visible) shape of one test case: verdict data only.
function publicTest(t, i) {
  return { index: i + 1, hidden: !!t.hidden }
}

// Strip stdin/expected from every test before sending a challenge to a client.
function publicChallenge(c) {
  return {
    id: c.id,
    topic: c.topic,
    subtopic: c.subtopic,
    title: c.title,
    difficulty: c.difficulty,
    timeLimitSec: c.timeLimitSec,
    xpReward: c.xpReward,
    coinReward: c.coinReward,
    statement: c.statement,
    inputFormat: c.inputFormat,
    outputFormat: c.outputFormat,
    starterCode: c.starterCode,
    hints: [...c.hints],
    tests: c.tests.map(publicTest), // sample cases carry no stdin/expected here
    sampleTests: c.tests
      .filter((t) => !t.hidden)
      .map((t) => ({ stdin: t.stdin, expectedOutput: t.expectedOutput })),
    hiddenCount: c.tests.filter((t) => t.hidden).length,
    totalTests: c.tests.length,
  }
}

// Wrap a student's submission so a missing main() or class declaration is a
// clean compile error instead of a judge crash.
function wrapForJudge(code) {
  return String(code ?? '').slice(0, 64 * 1024)
}

function makeJavaChallenge({
  id,
  topic,
  subtopic,
  title,
  difficulty = 'Easy',
  timeLimitSec, // required: 60–120, drives the client countdown AND run timeout
  xpReward = 100,
  coinReward = 25,
  statement,
  inputFormat,
  outputFormat,
  starterCode,
  hints = [],
  solutionSketch = '',
  tests,
}) {
  if (!id || typeof id !== 'string') throw new Error('challenge needs an id')
  if (!TOPICS.includes(topic)) throw new Error(`"${id}": unknown topic "${topic}"`)
  if (!subtopic || typeof subtopic !== 'string') throw new Error(`"${id}": needs a subtopic`)
  if (!title || typeof title !== 'string') throw new Error(`"${id}": needs a title`)
  if (!DIFFICULTIES.includes(difficulty)) throw new Error(`"${id}": difficulty must be Easy/Medium/Hard`)
  if (!Number.isFinite(timeLimitSec) || timeLimitSec < 60 || timeLimitSec > 120) {
    throw new Error(`"${id}": timeLimitSec must be 60–120`)
  }
  if (!Number.isFinite(xpReward) || xpReward < 0) throw new Error(`"${id}": xpReward must be >= 0`)
  if (!Number.isFinite(coinReward) || coinReward < 0) throw new Error(`"${id}": coinReward must be >= 0`)
  if (!statement || typeof statement !== 'string') throw new Error(`"${id}": needs a statement`)
  if (!inputFormat || typeof inputFormat !== 'string') throw new Error(`"${id}": needs inputFormat`)
  if (!outputFormat || typeof outputFormat !== 'string') throw new Error(`"${id}": needs outputFormat`)
  if (!starterCode || typeof starterCode !== 'string') throw new Error(`"${id}": needs starterCode`)
  if (!Array.isArray(tests) || tests.length === 0) throw new Error(`"${id}": needs at least one test`)
  for (const t of tests) {
    if (typeof t.stdin !== 'string' || typeof t.expectedOutput !== 'string') {
      throw new Error(`"${id}": every test needs stdin + expectedOutput strings`)
    }
  }
  if (!tests.some((t) => !t.hidden)) throw new Error(`"${id}": needs at least one sample (visible) test`)
  if (tests.filter((t) => t.hidden).length < 2) throw new Error(`"${id}": needs at least two hidden tests`)
  if (new Set(tests.map((t) => t.stdin + '|' + t.expectedOutput)).size !== tests.length) {
    throw new Error(`"${id}": duplicate test cases`)
  }
  return Object.freeze({
    id, topic, subtopic, title, difficulty, timeLimitSec, xpReward, coinReward,
    statement, inputFormat, outputFormat, starterCode,
    hints: Object.freeze([...hints]), solutionSketch,
    tests: Object.freeze(tests.map((t) => Object.freeze({ stdin: t.stdin, expectedOutput: t.expectedOutput, hidden: !!t.hidden }))),
  })
}

module.exports = { makeJavaChallenge, publicChallenge, wrapForJudge, DIFFICULTIES, TOPICS }
