import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store.js'
import worlds from '../game/worlds.js'

export default function JavaChallenge({ challengeId }) {
  const worldId = useGame((s) => s.worldId)
  const caseState = useGame((s) => s.caseState)
  const setCaseState = useGame((s) => s.setCaseState)
  const completeWorld = useGame((s) => s.completeWorld)
  const recordChallenge = useGame((s) => s.recordChallenge)

  const world = worldId ? (worlds[worldId] || null) : null
  const topic = world?.topic

  // "Chosen challenge" either comes from a past solve (caseState.savedChallenge)
  // or from the currently active one we are displaying in the editor.
  const savedChallenge = caseState?.savedChallenge ?? null
  const preferredId = savedChallenge?.id || challengeId || null

  const [challenge, setChallenge] = useState(savedChallenge || null)
  const [activeChallengeId, setActiveChallengeId] = useState(preferredId)
  const [code, setCode] = useState(savedChallenge?.starterCode || '')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [compileErrors, setCompileErrors] = useState('')
  const [deck, setDeck] = useState(null)
  const [deckError, setDeckError] = useState('')
  const inFlightRef = useRef(false)

  // Fetch the deck once per fair stop. Aborting the previous request means a
  // late response can never overwrite the next chapter's deck.
  useEffect(() => {
    if (!topic) return
    const controller = new AbortController()
    setDeck(null)
    setDeckError('')
    setOutput('')
    setError('')
    setCompileErrors('')
    fetch(`/api/challenges?topic=${encodeURIComponent(topic)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then((d) => {
        if (controller.signal.aborted) return
        if (d.status === 'ok' && Array.isArray(d.challenges) && d.challenges.length) {
          setDeck(d.challenges)
        } else {
          setDeck([])
          setDeckError('No challenges available for this fair stop.')
        }
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        setDeck([])
        setDeckError('Failed to load challenge deck: ' + (e.message || 'network error'))
        setError('Failed to load challenge deck.')
      })
    return () => controller.abort()
  }, [topic])

  // Pick exactly one active challenge whenever the deck loads, the chapter
  // changes, or the current challenge is solved. Setting the id and the object
  // together keeps them in sync; the early return makes the effect idempotent.
  useEffect(() => {
    if (!deck || !topic) return
    const seen = caseState?.solved ?? []
    const activeInDeck = !!(challenge && deck.some((c) => c.id === challenge.id))
    if (activeInDeck && !seen.includes(challenge.id)) return

    const preferred = preferredId
      ? deck.find((c) => c.id === preferredId && !seen.includes(c.id))
      : null
    const next =
      preferred ||
      deck.find((c) => !seen.includes(c.id)) ||
      (activeInDeck ? null : deck[0])

    if (!next || next.id === challenge?.id) return
    setActiveChallengeId(next.id)
    setChallenge(next)
    setCode(next.starterCode || '')
    setError('')
    setCompileErrors('')
  }, [deck, topic, challenge?.id, caseState?.solved, preferredId])

  const compileCheck = () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError('')
    setOutput('')
    setCompileErrors('')
    fetch('/api/challenge/compile_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'ok') {
          setOutput('Build clean — no compile errors.')
        } else {
          setOutput(`Build failed: ${d.message || 'compilation error'}.`)
          const errors = Array.isArray(d.errors)
            ? d.errors
                .map(
                  (e) =>
                    `${e.line || '?'}${e.column ? ':' + e.column : ''}: ${
                      e.message || e
                    }`,
                )
                .join('\n')
            : String(d.errors || d.message || '')
          setCompileErrors(errors)
        }
      })
      .catch((e) => {
        setOutput('Network error — the judge did not reply.')
        setError(e.message)
      })
      .finally(() => {
        inFlightRef.current = false
        setLoading(false)
      })
  }

  const submitCode = () => {
    const solvedId = activeChallengeId || challenge?.id
    if (!code.trim() || !solvedId || inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError('')
    setOutput('')
    setCompileErrors('')
    fetch('/api/challenge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge_id: solvedId,
        language: 'java',
        code,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        // Only a real accepted verdict may advance the case. Server/validation
        // errors and wrong answers must never be treated as success.
        const accepted = d.status === 'accepted'

        if (accepted) {
          // Read the live store so a duplicate/rapid response cannot award the
          // same challenge twice from a stale render closure.
          const solvedNow = useGame.getState().caseState?.solved ?? []
          if (!solvedNow.includes(solvedId)) {
            recordChallenge(solvedId)
            const rewards = challenge
              ? { xp: challenge.xpReward || 0, coins: challenge.coinReward || 0 }
              : { xp: 0, coins: 0 }
            setCaseState((prev = {}) => ({
              ...prev,
              xp: (prev.xp || 0) + rewards.xp,
              coins: (prev.coins || 0) + rewards.coins,
            }))
            // The first accepted challenge closes this fair stop and unlocks
            // the next one. completeWorld() is itself idempotent.
            completeWorld(worldId)
          }
          // Build a readable human summary from whatever the judge sent back.
          const cases =
            (d.cases && d.cases.length)
              ? d.cases
              : []
          const verdictLine = cases.length
            ? cases.map((c) => `${'Case ' + c.index + ':'} ${c.verdict}`).join('\n')
            : `Verdict: ${d.status || 'accepted'}`
          const timeLine = d.timeMs ? `\nTime: ${d.timeMs} ms` : ''
          setOutput(
            `Verdict: ${d.status || 'accepted'}${timeLine}\nPassed: ${
              d.passed ?? '?'
            }/${d.total ?? '?'}${timeLine ? '' : '\n'}` +
            (verdictLine ? '\n' + verdictLine : '') +
            (d.explanation ? '\n\n' + d.explanation : ''),
          )
        } else {
          const verdictLine =
            d.cases && d.cases.length
              ? d.cases
                  .map(
                    (c) =>
                      `Case ${c.index}: ${c.verdict}${
                        c.hidden ? ' (hidden)' : ''
                      }${
                        !c.hidden && c.expected !== undefined
                          ? ` — expected ${c.expected}, got ${c.actual}`
                          : ''
                      }`,
                  )
                  .join('\n')
              : ''
          const compileDetail =
            d.compile && d.compile.ok === false && d.compile.errors
              ? `\n\n${d.compile.errors}`
              : ''
          setOutput(
            `Verdict: ${d.status || 'wrong answer'}\nPassed: ${
              d.passed ?? '?'
            }/${d.total ?? '?'}${d.timeMs ? `\nTime: ${d.timeMs} ms` : ''}${
              verdictLine ? '\n' + verdictLine : ''
            }${d.message ? '\n' + d.message : ''}${compileDetail}`,
          )
        }
      })
      .catch((e) => {
        setOutput('Network error — the judge did not reply.')
        setError(e.message)
      })
      .finally(() => {
        inFlightRef.current = false
        setLoading(false)
      })
  }

  const title =
    challenge?.title ||
    (caseState?.currentChallengeTitle ||
      'Loading challenge…')
  const difficulty = challenge?.difficulty || caseState?.challengeDifficulty || '?'
  const rewards =
    challenge
      ? { xp: challenge.xpReward, coins: challenge.coinReward }
      : { xp: 0, coins: 0 }

  const isSolved = !!(caseState?.solved && caseState.solved.includes(activeChallengeId || challenge?.id))

  return (
    <section className="nex-challenge" data-testid="challenge" aria-label="Java challenge">
      {!challenge || deck === null || deck.length === 0 ? (
        <p className="nex-challenge-empty">
          {deckError
            ? deckError
            : deck === null
              ? 'Loading exhibit records…'
              : error || 'No challenge loaded yet.'}
        </p>
      ) : (
        <>
          <header className="nex-challenge-head">
            <div className="nex-challenge-heading">
              <p className="nex-challenge-kicker">
                {world ? world.name : 'Case record'} <span>/ Java challenge</span>
              </p>
              <h3 className="nex-challenge-title">
                {isSolved ? 'Replay · ' : ''}{title}
              </h3>
              <p className="nex-challenge-statement">
                {challenge?.statement || caseState?.challengeStatement || 'No statement yet.'}
              </p>
            </div>

            <div className="nex-challenge-meta">
              <span className={`nex-chip is-${difficulty.toLowerCase()}`}>{difficulty}</span>
              <span className="nex-rewards">
                <strong>{rewards.coins}</strong> coins
                <span>·</span>
                <strong>{rewards.xp}</strong> XP
              </span>
            </div>
          </header>

          {challenge?.statement && (
            <div className="nex-brief">
              {challenge.inputFormat && (
                <div className="nex-brief-row">
                  <span>Input</span>
                  <code>{challenge.inputFormat}</code>
                </div>
              )}
              {challenge.outputFormat && (
                <div className="nex-brief-row">
                  <span>Output</span>
                  <code>{challenge.outputFormat}</code>
                </div>
              )}
            </div>
          )}

          {(challenge?.sampleTests?.length > 0 || challenge?.hints?.length > 0) && (
            <div className="nex-info-grid">
              {challenge?.sampleTests?.length > 0 && (
                <div className="nex-block is-samples">
                  <h4 className="nex-block-title">Sample tests</h4>
                  {challenge.sampleTests.map((t, i) => (
                    <div className="nex-sample" key={i}>
                      <div className="nex-sample-label">Sample {i + 1}</div>
                      <pre className="nex-code-block">{`Input:
${t.stdin}
Output:
${t.expectedOutput}`}</pre>
                    </div>
                  ))}
                </div>
              )}

              {challenge?.hints?.length > 0 && (
                <div className="nex-block is-hints">
                  <h4 className="nex-block-title">Hints</h4>
                  <ul className="nex-hint-list">
                    {challenge.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="nex-editor">
            <div className="nex-editor-bar">
              <span className="nex-editor-file">Main.java</span>
              <span className="nex-editor-lang">Java 17</span>
            </div>
            <textarea
              className="nex-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// ${challenge?.statement || 'Enter Java code here'}`}
              rows={12}
              spellCheck={false}
            />
          </div>

          {compileErrors && (
            <pre className="nex-compile-errors">{compileErrors}</pre>
          )}

          <div className="nex-actions">
            <button
              type="button"
              onClick={compileCheck}
              disabled={loading || !code.trim()}
              className="nex-btn nex-secondary"
            >
              {loading ? 'Compiling…' : 'Compile check'}
            </button>
            <button
              type="button"
              onClick={submitCode}
              disabled={loading || !code.trim()}
              className="nex-btn nex-primary"
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>

          <pre className="nex-console" aria-live="polite">
            {output || 'Compile or submit code to see results here.'}
          </pre>

          {error && <p className="nex-error">Error: {error}</p>}
        </>
      )}
    </section>
  )
}
