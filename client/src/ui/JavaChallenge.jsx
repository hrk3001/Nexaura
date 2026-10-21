import { useEffect, useState } from 'react'
import { useGame } from '../game/store.js'
import worlds from '../game/worlds.js'

const BAD_VERDICTS = new Set([
  'compilation_error',
  'wrong_answer',
  'runtime_error',
  'time_limit_exceeded',
])

function statusKind(status) {
  if (typeof status !== 'string') return { label: status, ok: false }
  if (status === 'accepted') return { label: 'accepted', ok: true }
  return { label: status, ok: !BAD_VERDICTS.has(status) }
}

export default function JavaChallenge({ challengeId }) {
  const worldId = useGame((s) => s.worldId)
  const caseState = useGame((s) => s.caseState)
  const setCaseState = useGame((s) => s.setCaseState)
  const completeWorld = useGame((s) => s.completeWorld)
  const recordChallenge = useGame((s) => s.recordChallenge)

  const world = worldId ? (worlds[worldId] || null) : null
  const topic = world?.topic

  // "Chosen challenge" either comes from a past solve (caseState.currentChallenge)
  // or from the currently active one we are displaying in the editor.
  const savedChallenge = caseState?.savedChallenge ?? null

  const [challenge, setChallenge] = useState(savedChallenge || null)
  const [activeChallengeId, setActiveChallengeId] = useState(
    savedChallenge?.id || challengeId || null,
  )
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [compileErrors, setCompileErrors] = useState('')

  // When a world is selected, pick the first not-yet-solved proc in that realm.
  useEffect(() => {
    if (!challenge || !worldId || !topic) return
    const seen = caseState?.solved ?? []
    const isSolved = seen.includes(challenge.id)
    if (!isSolved) return
    // Advance to the next proc in the realm when the current one is solved
    // and there isn't already a fresh active one loaded.
    const next = challengeQueue.find((c) => !seen.includes(c.id))
    if (!next) return
    setActiveChallengeId(next.id)
    setChallenge(next)
    setCode(next.starterCode || '')
  }, [challenge?.id, worldId, topic, caseState?.solved, savedChallenge?.id])

  // The challenge deck for this world is fetched once and cached in state, so
  // we can show the list of procs a watcher could unlock and quickly pick the
  // next unsolved one when a solve happens without a full reload.
  const [deck, setDeck] = useState(null)

  useEffect(() => {
    if (!topic) return
    let cancelled = false
    fetch(`/api/challenges?topic=${encodeURIComponent(topic)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.status === 'ok' && Array.isArray(d.challenges)) {
          setDeck(d.challenges)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load challenge deck.')
      })
    return () => {
      cancelled = true
    }
  }, [topic])

  // Seed the active challenge from the deck the moment we have a topic and no
  // active challenge yet (fresh world visit / fresh install).
  useEffect(() => {
    if (!challenge || !deck) return
    const seen = caseState?.solved ?? []
    const unsolved = deck.filter((c) => !seen.includes(c.id))
    const next = unsolved[0] || deck[0]
    if (next && next.id !== challenge.id) {
      setActiveChallengeId(next.id)
      setChallenge(next)
    }
    if (!code.trim() && next) {
      setCode(next.starterCode || '')
    }
  }, [deck, code, challenge?.id, worldId])

  // Load a single challenge by id when the active id changes (this covers the
  // first visit to a realm AND the "next unsolved" transition above).
  useEffect(() => {
    if (!activeChallengeId) return
    let cancelled = false
    const pickFromDeck = () => {
      const found = deck?.find((c) => c.id === activeChallengeId)
      if (found) {
        setChallenge(found)
        const seen = caseState?.solved ?? []
        if (!seen.includes(found.id)) setCode(found.starterCode || '')
      }
    }
    pickFromDeck()
    return () => {
      cancelled = true
    }
  }, [activeChallengeId, deck])

  const compileCheck = () => {
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
        setLoading(false)
        if (d.status === 'ok') {
          setOutput('Build clean — no compile errors.')
        } else {
          setOutput(`Build failed: ${d.message || 'compilation error'}.`)
          setCompileErrors(
            (d.errors || [])
              .map(
                (e) =>
                  `${e.line || '?'}${e.column ? ':' + e.column : ''}: ${
                    e.message || e
                  }`,
              )
              .join('\n') || d.message,
          )
        }
      })
      .catch((e) => {
        setLoading(false)
        setOutput('Network error — the judge did not reply.')
        setError(e.message)
      })
  }

  const submitCode = () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setCompileErrors('')
    fetch('/api/challenge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge_id: activeChallengeId || challenge?.id,
        language: 'java',
        code,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setLoading(false)
        const kind = statusKind(d.status)
        setVerb(d.status || '')

        if (kind.ok) {
          // Save the solved challenge id so it cannot be claimed twice, and
          // persist the submit response (case results) beside it so the UI can
          // show them on the next view without a fresh fetch.
          setChallenge((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              saved: true,
            }
          })
          recordChallenge(activeChallengeId || challenge?.id)
          // Accept the rewards the challenge itself declares (the real server
          // sends only redacted test verdicts; the rewards live on the challenge
          // object we loaded from /api/challenges?topic=…).
          const rewards =
            (challenge && { xp: challenge.xpReward, coins: challenge.coinReward }) ||
            { xp: 0, coins: 0 }
          setCaseState((prev = {}) => ({
            ...prev,
            xp: (prev.xp || 0) + rewards.xp,
            coins: (prev.coins || 0) + rewards.coins,
          }))
          // Completing the realm happens when the FIRST proc in the realm is
          // accepted — that is what "closes" the realm and unlocks the next.
          const seen = (caseState?.solved ?? []).concat(activeChallengeId || challenge?.id)
          setCaseState((prev = {}) => ({ ...prev, solved: seen }))
          // Close the realm once the first proc in it is accepted.
          completeWorld(worldId)
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
                      }`,
                  )
                  .join('\n')
              : ''
          setOutput(
            `Verdict: ${d.status || 'wrong answer'}\nPassed: ${
              d.passed ?? '?'
            }/${d.total ?? '?'}${d.timeMs ? `\nTime: ${d.timeMs} ms` : ''}${
              verdictLine ? '\n' + verdictLine : ''
            }${d.message ? '\n' + d.message : ''}`,
          )
        }
      })
      .catch((e) => {
        setLoading(false)
        setOutput('Network error — the judge did not reply.')
        setError(e.message)
      })
  }

  // Reset the editor when the active challenge id changes (first visit + advance).
  useEffect(() => {
    if (activeChallengeId && (!code.trim() || challenge?.id !== activeChallengeId)) {
      // Only prefill if the editor is empty or we switched challenges.
      const target = challenge || deck?.find((c) => c.id === activeChallengeId)
      if (target) {
        setCode(target.starterCode || '')
      }
    }
  }, [activeChallengeId, challenge, deck, code])

  const hasCaseState = !!(caseState && (caseState.currentWorld || caseState.xp != null))

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

  return (
    <div
      className="fcard"
      style={{ marginBottom: 20, maxWidth: '100%' }}
    >
      {!challenge || deck === null ? (
        <p style={{ color: 'var(--tx2)', fontSize: 14 }}>
          {loading ? 'Loading challenge deck…' : error || 'No challenge loaded yet.'}
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3 style={{ fontSize: 19, marginBottom: 8 }}>
                {isSolved ? 'Replay' : ''}Java Challenge: {title}
              </h3>
              <p style={{ color: 'var(--tx2)', fontSize: 13.5, lineHeight: 1.6 }}>
                {challenge?.statement || caseState?.challengeStatement || 'No statement yet.'}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <span
                className="chip"
                style={{
                  border: `1px solid ${
                    difficulty === 'Hard'
                      ? 'rgba(248,113,113,.5)'
                      : difficulty === 'Medium'
                      ? 'rgba(245,196,83,.5)'
                      : 'rgba(245,196,83,.45)'
                  }`,
                  color:
                    difficulty === 'Hard'
                      ? '#f87171'
                      : difficulty === 'Medium'
                      ? '#fbbf24'
                      : '#34d399',
                }}
              >
                {difficulty}
              </span>
              <span style={{ color: 'var(--tx2)', fontSize: 13, lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--gold)' }}>{rewards.coins}</strong> crown ·{' '}
                <strong style={{ color: 'var(--em)' }}>{rewards.xp}</strong> xp
              </span>
            </div>
          </div>

          {challenge?.statement && (
            <div
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 12,
                margin: '10px 0',
                fontSize: 13.5,
                color: 'var(--tx2)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: 'var(--tx)', marginBottom: 6, fontWeight: 700 }}>
                {challenge.inputFormat && (
                  <><strong style={{ fontFamily: 'var(--mono)' }}>Input:</strong> {challenge.inputFormat}<br /></>
                )}
                {challenge.outputFormat && (
                  <><strong style={{ fontFamily: 'var(--mono)' }}>Output:</strong> {challenge.outputFormat}</>
                )}
              </div>
            </div>
          )}

          <div className="editor-wrap">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// ${challenge?.statement || 'Enter Java code here'}`}
              rows={12}
              style={{
                width: '100%',
                padding: 10,
                margin: '10px 0',
                borderRadius: 4,
                border: '1px solid var(--line)',
                background: 'rgba(255,255,255,.05)',
                color: 'var(--tx)',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>

          {compileErrors && (
            <pre
              style={{
                background: 'rgba(248,113,113,.08)',
                border: '1px solid rgba(248,113,113,.4)',
                borderRadius: 8,
                padding: 10,
                margin: '10px 0',
                color: 'var(--red)',
                fontFamily: 'var(--mono)',
                fontSize: 12.5,
                whiteSpace: 'pre-wrap',
                maxHeight: 160,
                overflow: 'auto',
              }}
            >
              {compileErrors}
            </pre>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={compileCheck}
              disabled={loading || !code.trim()}
              style={{
                flex: '1 1 40%',
                padding: '8px 16px',
                background: loading || !code.trim() ? 'var(--line)' : 'var(--accent)',
                color:
                  loading || !code.trim() ? 'var(--tx)' : 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                minWidth: 120,
              }}
            >
              {loading ? 'Compiling…' : 'Compile check'}
            </button>
            <button
              onClick={submitCode}
              disabled={loading || !code.trim()}
              style={{
                flex: '1 1 40%',
                padding: '8px 16px',
                background: code.trim() ? 'var(--accent)' : 'var(--line)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                minWidth: 120,
              }}
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: 'rgba(255,255,255,.05)',
              borderRadius: 4,
              border: '1px solid var(--line)',
              color: 'var(--tx)',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              maxHeight: 160,
              overflow: 'auto',
            }}
          >
            {output || 'Compile or submit code to see results here.'}
          </div>

          {error && (
            <div
              style={{
                marginTop: 8,
                color: 'var(--red)',
                fontSize: 12,
              }}
            >
              Error: {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
