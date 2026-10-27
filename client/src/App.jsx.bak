import { useEffect, useState } from 'react'
import { useGame } from './game/store.js'
import Intro from './ui/Intro.jsx'
import Landing from './ui/Landing.jsx'
import WorldMap from './ui/WorldMap.jsx'
import JavaChallenge from './ui/JavaChallenge.jsx'
import Dialogue from './ui/Dialogue.jsx'
import Scene from './three/Scene.jsx'
import worlds, { CASE } from './game/worlds.js'

export default function App() {
  const view = useGame((state) => state.view)
  const init = useGame((state) => state.init)
  const worldId = useGame((state) => state.worldId)
  const caseState = useGame((state) => state.caseState)
  const discoverEvidence = useGame((state) => state.discoverEvidence)

  const isArray = worldId === 'arrays'
  const [challengeMode, setChallengeMode] = useState(false)
  const [nearbyId, setNearbyId] = useState(null)
  const [activeEvidenceId, setActiveEvidenceId] = useState(null)
  const explore = isArray && !challengeMode

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    setChallengeMode(false)
    setNearbyId(null)
    setActiveEvidenceId(null)
  }, [worldId])

  if (view === 'loading') {
    return (
      <main className="nex-root nex-loading" data-testid="loading">
        Opening the case file…
      </main>
    )
  }

  if (view === 'landing') return <Landing />
  if (view === 'intro') return <Intro />

  if (view === 'map') {
    return (
      <>
        <WorldMap />
        <Dialogue />
      </>
    )
  }

  if (view === 'game') {
    const { closed, total } = useGame.getState().progress()
    const world = worldId ? (worlds[worldId] || null) : null
    const records = world?.introSpots ?? []
    const evidence = isArray ? (world?.evidence ?? []) : []
    const journal = caseState?.journal ?? []
    const evidenceFound = caseState?.evidence?.length ?? 0
    const nearby = evidence.find((entry) => entry.id === nearbyId) || null
    const activeEvidence = evidence.find((entry) => entry.id === activeEvidenceId) || null

    // The Java challenge opens only after every clue in the fair is logged
    // (or if this stop was already cleared).
    const allEvidenceFound = evidence.length > 0 && evidenceFound >= evidence.length
    const challengeUnlocked = !isArray || allEvidenceFound || !!world?._completed
    const showIri = isArray && explore && allEvidenceFound && !world?._completed && !activeEvidence

    const openEvidence = (id) => {
      const entry = evidence.find((item) => item.id === id)
      if (!entry) return
      document.activeElement?.blur?.()
      setActiveEvidenceId(entry.id)
      discoverEvidence(entry)
    }

    const closeEvidence = () => setActiveEvidenceId(null)

    const toggleMode = () => {
      if (explore && !challengeUnlocked) return
      document.activeElement?.blur?.()
      setActiveEvidenceId(null)
      setNearbyId(null)
      setChallengeMode((current) => !current)
    }

    return (
      <main
        className={`nex-game${explore ? ' is-exploring' : ''}`}
        data-testid="game"
        data-evidence={evidence.map((item) => `${item.id}:${item.position.join(',')}`).join('|')}
      >
        <Scene
          worldId={worldId}
          interactive={explore}
          evidence={evidence}
          nearbyId={nearbyId}
          onNearby={setNearbyId}
          onInspect={openEvidence}
          paused={!!activeEvidenceId}
        />
        <div className="nex-game-scrim" aria-hidden="true" />

        <header className="nex-hud">
          <div className="nex-hud-left">
            <button
              onClick={() => useGame.getState().goMap()}
              className="nex-btn nex-ghost small"
            >
              ← Case map
            </button>
            {isArray && (
              <button
                onClick={toggleMode}
                disabled={explore && !challengeUnlocked}
                title={
                  explore && !challengeUnlocked
                    ? 'Find and inspect every clue to unlock the challenge'
                    : undefined
                }
                style={explore && !challengeUnlocked ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                className="nex-btn nex-ghost small nex-mode-btn"
              >
                {explore
                  ? challengeUnlocked
                    ? 'Open Java challenge'
                    : `Challenge locked · ${evidenceFound}/${evidence.length} clues`
                  : '← Explore the fair'}
              </button>
            )}
            <div className="nex-hud-case">
              <span>Nexaura / Case 001</span>
              <strong>{CASE.title}</strong>
            </div>
          </div>

          <div className="nex-hud-center">
            <p className="nx-kicker">Current stop</p>
            <strong>{world?.name || 'Investigation'}</strong>
            <span>{world?.subject || 'Maple Park Science Fair'}</span>
          </div>

          <div className="nex-hud-stats" aria-label="Investigation status">
            <div className="nex-stat">
              <span>Stops cleared</span>
              <strong>{closed}<em>/{total}</em></strong>
            </div>
            <div className="nex-stat is-coins">
              <span>Coins</span>
              <strong>{(caseState?.coins ?? 0).toLocaleString()}</strong>
            </div>
            <div className="nex-stat is-xp">
              <span>XP</span>
              <strong>{(caseState?.xp ?? 0).toLocaleString()}</strong>
            </div>
          </div>
        </header>

        <div className="nex-game-body">
          <aside className="nex-chapter-rail" aria-label="Chapter briefing">
            <p className="nx-kicker">Chapter briefing</p>
            <h2 className="nex-chapter-title">{world?.name || 'Investigation'}</h2>
            <p className="nex-chapter-subject">{world?.subject || 'Maple Park Science Fair'}</p>

            <div className="nex-rail-section">
              <span>Objective</span>
              <p>{world?.objective || 'Select a fair stop from the case map.'}</p>
            </div>

            <div className="nex-rail-section">
              <span>Records</span>
              <ul className="nex-rail-records">
                {records.map(([label]) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>

            {isArray && (
              <div className="nex-rail-section nex-journal">
                <span>Case journal</span>
                <p className="nex-journal-meta">
                  {evidenceFound} / {evidence.length} evidence logged
                </p>
                {journal.length > 0 ? (
                  <ul className="nex-journal-list">
                    {journal.map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong>
                        <p>{item.clue}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="nex-journal-empty">
                    Walk the fair and inspect glowing evidence with <kbd>E</kbd>.
                  </p>
                )}
              </div>
            )}

            <div className="nex-rail-clue">
              <span>{world?._completed ? 'Lead logged' : 'Case note'}</span>
              <p>
                {world?._completed
                  ? world.clue
                  : 'Solve the exhibit record to log this stop\'s lead.'}
              </p>
            </div>

            <div className="nex-rail-status">
              <span>Stop status</span>
              <strong className={world?._completed ? 'is-cleared' : ''}>
                {world?._completed ? 'CLEARED' : 'IN PROGRESS'}
              </strong>
            </div>
          </aside>

          <section
            className={`nex-challenge-shell${explore ? ' is-hidden' : ''}`}
            aria-label="Java challenge"
            aria-hidden={explore || undefined}
          >
            <JavaChallenge />
          </section>
        </div>

        {explore && (
          <div className="nex-explore-ui">
            <div className="nex-explore-legend" aria-label="Exploration controls">
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span>
              <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> move</span>
              <span><kbd>E</kbd> inspect evidence</span>
            </div>

            {showIri && (
              <div
                role="status"
                style={{
                  position: 'fixed',
                  top: 78,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: 'rgba(8, 16, 32, 0.92)',
                  border: '1px solid rgba(52, 211, 153, 0.6)',
                  color: '#e2e8f0',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                  maxWidth: 'calc(100vw - 32px)',
                }}
              >
                <strong style={{ color: '#34d399', letterSpacing: '0.08em' }}>IRI</strong>
                <span>Evidence logged. Now decode the records.</span>
                <button
                  type="button"
                  className="nex-btn nex-primary small"
                  onClick={toggleMode}
                >
                  Open Java challenge →
                </button>
              </div>
            )}

            {nearby && !activeEvidence ? (
              <div className="nex-interact-prompt" role="status">
                <span>Evidence nearby</span>
                <strong>{nearby.title}</strong>
                <em>Press <kbd>E</kbd> to inspect</em>
              </div>
            ) : !activeEvidence ? (
              <p className="nex-explore-hint">
                {allEvidenceFound
                  ? 'All clues logged.'
                  : `Clues ${evidenceFound}/${evidence.length} · Walk to a glowing evidence marker and press `}
                {allEvidenceFound ? null : <kbd>E</kbd>}
                {allEvidenceFound ? null : '.'}
              </p>
            ) : null}
          </div>
        )}

        {explore && activeEvidence && (
          <section
            className="nex-evidence-panel"
            role="dialog"
            aria-label={`Evidence: ${activeEvidence.title}`}
          >
            <header className="nex-evidence-head">
              <span>Evidence logged</span>
              <button
                type="button"
                className="nex-evidence-close"
                onClick={closeEvidence}
                aria-label="Close evidence"
              >
                ×
              </button>
            </header>
            <h2 className="nex-evidence-title">{activeEvidence.title}</h2>
            <p className="nex-evidence-location">{activeEvidence.location}</p>
            <p className="nex-evidence-detail">{activeEvidence.detail}</p>
            <div className="nex-evidence-clue">
              <span>Case journal updated</span>
              <p>{activeEvidence.clue}</p>
            </div>
            <button
              type="button"
              className="nex-btn nex-primary nex-evidence-continue"
              onClick={closeEvidence}
            >
              Continue investigating
            </button>
          </section>
        )}

        <div className="nex-game-foot" data-testid="game-world-name">
          {world ? `${world.name} — ${world.subject}` : worldId}
        </div>

        <Dialogue />
      </main>
    )
  }

  return (
    <main className="nex-root nex-unknown">
      <h2>Nexaura · The Missing Notebook</h2>
      <p>Unknown screen: {String(view)}</p>
      <button
        onClick={() => useGame.getState().setView('landing')}
        className="nex-btn nex-primary"
        style={{ marginTop: 16 }}
      >
        Return to start
      </button>
    </main>
  )
}
