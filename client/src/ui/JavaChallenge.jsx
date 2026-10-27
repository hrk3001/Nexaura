import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store.js'
import worlds from '../game/worlds.js'

// How many accepted challenges close this fair stop and unlock the next one.
// Raise it when each stop has 5-6 challenges.
const CLOSE_AFTER = 1

export default function JavaChallenge({ challengeId }) {
  const worldId = useGame((s) => s.worldId)
  const caseState = useGame((s) => s.caseState)
  const setCaseState = useGame((s) => s.setCaseState)
  const completeWorld = useGame((s) => s.completeWorld)
  const recordChallenge = useGame((s) => s.recordChallenge)
  const goMap = useGame((s) => s.goMap)
  const setView = useGame((s) => s.setView)

  const world = worldId ? (worlds[worldId] || null) : null
  const topic = world?.topic

  const savedChallenge = caseState?.savedChallenge ?? null
  const preferredId = savedChallenge?.id || challengeId || null

  const [challenge, setChallenge] = useState(savedChallenge || null)
  const [activeChallengeId, setActiveChallengeId] = useState(preferredId)
  const [code, setCode] = useState(savedChallenge?.starterCode || '')
  const [output, setOutput] = useState('')
  const [verdict, setVerdict] = useState(null) // { ok, title }
  const [beat, setBeat] = useState(null) // story card shown after an accepted answer
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
    setVerdict(null)
    setBeat(null)
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

  // Pick the first challenge ONLY when a deck arrives. Solving a challenge must
  // never swap the question under the player; moving on is the Next button.
  useEffect(() => {
    if (!deck || deck.length === 0) return
    const seen = useGame.getState().caseState?.solved ?? []
    const next =
      (preferredId && deck.find((c) => c.id === preferredId && !seen.includes(c.id))) ||
      deck.find((c) => !seen.includes(c.id)) ||
      deck[0]
    setActiveChallengeId(next.id)
    setChallenge(next)
    setCode(next.starterCode || '')
  }, [deck])

  const openChallenge = (next) => {
    setActiveChallengeId(next.id)
    setChallenge(next)
    setCode(next.starterCode || '')
    setOutput('')
    setVerdict(null)
    setBeat(null)
    setError('')
    setCompileErrors('')
  }

  const compileCheck = () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError('')
    setOutput('')
    setVerdict(null)
    setCompileErrors('')
    fetch('/api/challenge/compile_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'ok') {
          setVerdict({ ok: true, title: 'Build clean' })
          setOutput('Build clean — no compile errors.')
        } else {
          setVerdict({ ok: false, title: 'Build failed' })
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
        setVerdict({ ok: false, title: 'Judge not reachable' })
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
    setVerdict(null)
    setBeat(null)
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
        // Only a real accepted verdict may advance the case.
        const accepted = d.status === 'accepted'

        if (accepted) {
          setVerdict({ ok: true, title: 'Accepted' })
          // Read the live store so a duplicate response cannot award twice.
          const solvedBefore = useGame.getState().caseState?.solved ?? []
          if (!solvedBefore.includes(solvedId)) {
            recordChallenge(solvedId)
            const rewards = challenge
              ? { xp: challenge.xpReward || 0, coins: challenge.coinReward || 0 }
              : { xp: 0, coins: 0 }
            setCaseState((prev = {}) => ({
              ...prev,
              xp: (prev.xp || 0) + rewards.xp,
              coins: (prev.coins || 0) + rewards.coins,
            }))
          }

          const solvedNow = new Set([...solvedBefore, solvedId])
          const doneInStop = deck ? deck.filter((c) => solvedNow.has(c.id)).length : 1
          const realmClosed = doneInStop >= Math.min(CLOSE_AFTER, deck ? deck.length : 1)
          if (realmClosed) completeWorld(worldId) // idempotent

          const nextChallenge = deck ? deck.find((c) => !solvedNow.has(c.id)) || null : null
          const nextWorld = world?.nextWorld ? worlds[world.nextWorld] : null
          setBeat({
            realmClosed,
            nextChallenge,
            line:
              challenge?.successStory ||
              world?.successLine ||
              'The record decodes. Another page of the missing notebook comes back into the light.',
            nextWorldName: nextWorld ? nextWorld.name || nextWorld.title : null,
          })

          const cases = d.cases && d.cases.length ? d.cases : []
          const verdictLine = cases.length
            ? cases.map((c) => `Case ${c.index}: ${c.verdict}`).join('\n')
            : ''
          setOutput(
            `Verdict: ${d.status}\nPassed: ${d.passed ?? '?'}/${d.total ?? '?'}` +
              (d.timeMs ? `\nTime: ${d.timeMs} ms` : '') +
              (verdictLine ? '\n' + verdictLine : '') +
              (d.explanation ? '\n\n' + d.explanation : ''),
          )
        } else {
          setVerdict({
            ok: false,
            title: String(d.status || 'wrong answer').replace(/_/g, ' '),
          })
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
        setVerdict({ ok: false, title: 'Judge not reachable' })
        setOutput('Network error — the judge did not reply.')
        setError(e.message)
      })
      .finally(() => {
        inFlightRef.current = false
        setLoading(false)
      })
  }

  const onEditorKeyDown = (e) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.target
    const s = el.selectionStart
    setCode(code.slice(0, s) + '    ' + code.slice(el.selectionEnd))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + 4
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
      : caseState
      ? { xp: caseState.xpReward || 0, coins: caseState.coinReward || 0 }
      : { xp: 0, coins: 0 }

  const isSolved = !!(caseState?.solved && caseState.solved.includes(activeChallengeId || challenge?.id))
  const position = deck && challenge ? deck.findIndex((c) => c.id === challenge.id) + 1 : 0

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
                {deck.length > 1 && <span>{` · ${position} of ${deck.length}`}</span>}
              </p>
              <h3 className="nex-challenge-title">
                {isSolved ? 'Replay · ' : ''}{title}
              </h3>
              <p className="nex-challenge-statement">
                {challenge?.statement || caseState?.challengeStatement || 'No statement yet.'}
              </p>
            </div>

            <div className="nex-challenge-meta">
              <span className={`nex-chip is-${String(difficulty).toLowerCase()}`}>{difficulty}</span>
              <span className="nex-rewards">
                <strong>{rewards.coins}</strong> coins
                <span>{'·'}</span>
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
              onKeyDown={onEditorKeyDown}
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
              {loading ? 'Working…' : 'Compile check'}
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

          {/* Verdict sits right under the buttons so it is never off-screen. */}
          {verdict && (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                textTransform: 'capitalize',
                color: verdict.ok ? '#34d399' : '#f87171',
                border: `1px solid ${verdict.ok ? 'rgba(52,211,153,.55)' : 'rgba(248,113,113,.55)'}`,
                background: verdict.ok ? 'rgba(52,211,153,.10)' : 'rgba(248,113,113,.10)',
              }}
            >
              {verdict.ok ? '✔ ' : '✖ '}{verdict.title}
            </div>
          )}

          {beat && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(245,196,83,.55)',
                background: 'rgba(245,196,83,.08)',
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: '#f5c453' }}>
                CASE UPDATE
              </div>
              <p style={{ margin: '6px 0 10px', lineHeight: 1.6, fontSize: 14 }}>{beat.line}</p>
              {beat.realmClosed && (
                <p style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 700, color: '#34d399' }}>
                  {beat.nextWorldName
                    ? `Fair stop cleared — ${beat.nextWorldName} is now unlocked.`
                    : 'Fair stop cleared.'}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {beat.nextChallenge && (
                  <button
                    type="button"
                    className="nex-btn nex-primary"
                    onClick={() => openChallenge(beat.nextChallenge)}
                  >
                    {'Next challenge →'}
                  </button>
                )}
                {beat.realmClosed && !world?.nextWorld && (
                  <button type="button" className="nex-btn nex-primary" onClick={() => setView('finale')}>
                    {'Read the final report \u2192'}
                  </button>
                )}
                {beat.realmClosed && (
                  <button type="button" className="nex-btn nex-secondary" onClick={goMap}>
                    {'Back to case map →'}
                  </button>
                )}
              </div>
            </div>
          )}

          <pre className="nex-console" aria-live="polite">
            {output || 'Compile or submit code to see results here.'}
          </pre>

          {error && <p className="nex-error">Error: {error}</p>}
        </>
      )}
    </section>
  )
}
