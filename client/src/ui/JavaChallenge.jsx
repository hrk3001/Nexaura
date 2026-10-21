import { useEffect, useState } from 'react'
import { useGame } from '../game/store.js'

export default function JavaChallenge({ challengeId }) {
  const { caseState, setCaseState } = useGame.getState()
  const [code, setCode] = useState(caseState?.challengeCode || '')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { xp, coins } = caseState || {}

  // Load challenge data from server on mount
  useEffect(() => {
    fetch('/api/challenges/' + challengeId)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'ok' && d.challenge) {
          const challenge = d.challenge
          // Pre-fill the editor with starter code
          if (!code.trim()) {
            setCode(challenge.starterCode || '')
          }
        }
      })
      .catch(e => console.error('Failed to load challenge', e))}, [challengeId])
  

  const compileCode = () => {
    setLoading(true)
    setError('')
    fetch('/api/challenge/compile_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        if (d.status === 'ok') {
          setOutput('✓ Compilation successful')
        } else {
          setOutput('✗ ' + (d.message || 'Compilation error'))
        }
      })
      .catch(e => {
        setLoading(false)
        setOutput('✗ Network error')
        setError(e.message)
      })
  }

  const submitCode = () => {
    setLoading(true)
    setError('')
    setOutput('')
    fetch('/api/challenge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, language: 'java', code })
    })
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        if (d.status === 'ok' && d.verdict === 'accepted') {
          // Update progress - award XP and coins
          const newXp = (xp || 0) + (d.xpReward || 100)
          const newCoins = (coins || 0) + (d.coinReward || 25)
          setCaseState(prev => ({
            ...prev,
            challengeCode: code,
            xp: newXp,
            coins: newCoins,
            cluesFound: (prev.cluesFound || 0) + 1
          }))
          setOutput(`✓ Accepted! +${d.xpReward || 100} XP, +${d.coinReward || 25} coins`)
        } else {
          // Show case results
          const cases = d.cases || []
          let outputText = 'Verdict: ' + d.verdict + '\n'
          outputText += 'Passed: ' + d.passed + '/' + d.total + '\n'
          outputText += 'Time: ' + (d.timeMs || 0) + 'ms\n'
          if (d.message) outputText += 'Message: ' + d.message + '\n'
          // Show first few case details
          cases.slice(0, 3).forEach((_c, _i) => {
            outputText += 'Case ' + _c.index + ': ' + _c.verdict + (_c.hidden ? ' (hidden)' : '') + '\n'
          })
          setOutput(outputText)
        }
      })
      .catch(e => {
        setLoading(false)
        setOutput('✗ Network error')
        setError(e.message)
      })
  }

  // If we have case state with challenge data, pre-fill
  useEffect(() => {
    if (caseState && caseState.currentChallenge === challengeId) {
      // Challenge is active - show the editor
    }
  }, [caseState, challengeId])

  return (
    <div className="fcard" style={{ marginBottom: '20px', maxWidth: '100%' }}>
      <h3>Java Challenge: {caseState?.challengeTitle || 'Loading...'}</h3>
      <p><strong>Difficulty:</strong> {caseState?.challengeDifficulty || '?'}</p>
      <p><strong>Rewards:</strong> {caseState?.xpReward || 0} XP, {caseState?.coinReward || 0} coins</p>

      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder={`// ${caseState?.challengeStatement || 'Enter Java code here'}`}
        rows={12}
        style={{
          width: '100%',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '4px',
          border: '1px solid var(--line)',
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--tx)',
          fontFamily: 'var(--mono)',
          fontSize: '13px',
          resize: 'vertical'
        }}
      />

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={compileCode}
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: loading ? 'var(--line)' : 'var(--accent)',
            color: loading ? 'var(--tx)' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {loading ? 'Compiling…' : 'Compile'}
        </button>
        <button
          onClick={submitCode}
          disabled={loading || !code.trim()}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: code.trim() ? 'var(--panel)' : 'var(--line)',
            color: 'var(--tx)',
            border: 'none',
            borderRadius: '4px',
            cursor: code.trim() ? 'pointer' : 'not-allowed',
            fontWeight: '600'
          }}
        >
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          border: '1px solid var(--line)',
          color: 'var(--tx)',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {output || 'Submit code to run against tests'}
      </div>

      {error && (
        <div style={{ marginTop: '8px', color: 'var(--red)', fontSize: '12px' }}>
          Error: {error}
        </div>
      )}
    </div>
  )
}