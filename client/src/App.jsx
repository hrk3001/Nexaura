import { useEffect } from 'react'
import { useGame } from './game/store.js'
import Landing from './ui/Landing.jsx'
import Intro from './ui/Intro.jsx'
import WorldMap from './ui/WorldMap.jsx'
import JavaChallenge from './ui/JavaChallenge.jsx'
import Dialogue from './ui/Dialogue.jsx'
import Scene from './three/Scene.jsx'
import worlds from './game/worlds.js'

export default function App() {
  const view = useGame((state) => state.view)
  const init = useGame((state) => state.init)
  const worldId = useGame((state) => state.worldId)
  const caseState = useGame((state) => state.caseState)

  useEffect(() => {
    init()
  }, [init])

  if (view === 'loading') {
    return (
      <main style={{ padding: 40 }} data-testid="loading">
        Entering the Algorithm Kingdom...
      </main>
    )
  }

  if (view === 'landing') return <Landing />

  if (view === 'intro') return <Intro />

  if (view === 'map') {
    return (
      <main>
        <WorldMap />
        <Dialogue />
      </main>
    )
  }

  if (view === 'game') {
    const { closed, total } = useGame.getState().progress()
    const world = worldId ? (worlds[worldId] || null) : null
    return (
      <main
        data-testid="game"
        style={{
          minHeight: '100vh',
          position: 'relative',
          background: 'var(--bg0)',
          color: 'var(--tx)',
        }}
      >
        <Scene worldId={worldId} caseState={caseState} />
        <header
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
            zIndex: 3,
            color: 'var(--tx)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => useGame.getState().goMap()}
              className="nex-btn"
              style={{
                padding: '8px 14px',
                border: '1px solid rgba(148,170,255,.2)',
                background: 'rgba(6,10,22,.75)',
                borderRadius: 12,
                color: 'var(--tx)',
                fontSize: 13,
                fontWeight: 700,
                pointerEvents: 'auto',
              }}
            >
              ← Case map
            </button>
            <div className="hudchip" style={{ pointerEvents: 'auto' }}>
              Realms closed <strong>{closed}</strong>/{total}
            </div>
          </div>

          <div
            className="hudchip"
            style={{ pointerEvents: 'auto', textAlign: 'right' }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: 'var(--gold)',
              }}
            >
              Crown
            </span>
            <strong style={{ color: 'var(--gold)' }}>
              {(caseState?.coins ?? 0).toLocaleString()}
            </strong>
            <br />
            <span
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: 'var(--em)',
              }}
            >
              XP
            </span>
            <strong style={{ color: 'var(--em)' }}>
              {(caseState?.xp ?? 0).toLocaleString()}
            </strong>
          </div>
        </header>

        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--disp)',
            color: 'rgba(232,236,248,.75)',
            letterSpacing: 4,
            fontSize: 14,
            textTransform: 'uppercase',
            textShadow: '0 2px 8px #000',
            zIndex: 3,
            pointerEvents: 'none',
          }}
          data-testid="game-world-name"
        >
          {world ? world.name : worldId}
        </div>

        <JavaChallenge />
        <Dialogue />
      </main>
    )
  }

  return (
    <main style={{ padding: 32 }}>
      <h2>Nexaura</h2>
      <p>Unknown screen: {String(view)}</p>
      <button
        onClick={() => useGame.getState().goLanding()}
        className="nex-btn nex-primary"
        style={{ marginTop: 16 }}
      >
        Return to start
      </button>
    </main>
  )
}
