
import { useGame } from '../game/store.js'
import { getAllWorlds } from '../game/worlds.js'

const worldIcons = {
  arrays: '🌲',
  linked: '🌿',
  stack: '⚡',
  tree: '👑',
  graph: '🌐',
  dp: '🔮',
}

export default function WorldMap() {
  const selectWorld = useGame((s) => s.selectWorld)
  const worlds = Object.values(getAllWorlds())

  return (
    <main style={{
      minHeight: '100vh',
      padding: '64px 24px',
      background: 'radial-gradient(ellipse at top, #17102d, #070913 65%)',
      color: '#e8eaf6',
      fontFamily: 'Oxanium, sans-serif',
    }}>
      <header style={{
        maxWidth: 1100,
        margin: '0 auto 42px',
        textAlign: 'center',
      }}>
        <p style={{
          color: '#a78bfa',
          letterSpacing: 4,
          fontSize: 12,
        }}>
          THE ALGORITHM KINGDOM
        </p>

        <h1 style={{
          fontFamily: 'MedievalSharp, cursive',
          fontSize: 'clamp(34px, 6vw, 58px)',
          margin: '16px 0',
        }}>
          Choose Your Realm
        </h1>

        <p style={{ color: '#a8acc5', lineHeight: 1.7 }}>
          Six worlds. Six algorithmic mysteries. Your investigation begins here.
        </p>
      </header>

      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
      }}>
        {worlds.map((world, index) => {
          const locked = !world.unlocked
          const colors = world.gradient || ['#8b5cf6', '#6d28d9']

          return (
            <button
              key={world.id}
              disabled={locked}
              onClick={() => selectWorld(world.id)}
              style={{
                textAlign: 'left',
                padding: 24,
                minHeight: 220,
                borderRadius: 16,
                border: `1px solid ${
                  locked ? 'rgba(148,163,184,.12)' : `${colors[0]}88`
                }`,
                background: locked
                  ? 'rgba(15,18,32,.65)'
                  : 'linear-gradient(145deg, rgba(30,27,55,.95), rgba(12,15,30,.98))',
                color: locked ? '#69718a' : '#f3f0ff',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.6 : 1,
                transition: 'transform .2s, border-color .2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!locked) e.currentTarget.style.transform = 'translateY(-5px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 34 }}>
                  {worldIcons[world.id] || '✨'}
                </span>

                <span style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  color: locked ? '#7d8499' : colors[0],
                }}>
                  {locked ? '🔒 LOCKED' : world.completed ? '✓ COMPLETED' : 'AVAILABLE'}
                </span>
              </div>

              <h2 style={{
                fontSize: 20,
                marginBottom: 10,
                color: locked ? '#9298aa' : colors[0],
              }}>
                {world.name}
              </h2>

              <p style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: locked ? '#737b91' : '#b7bdd3',
              }}>
                {world.description}
              </p>

              <p style={{
                marginTop: 18,
                fontSize: 11,
                letterSpacing: 1,
                color: '#9ca3bd',
              }}>
                {locked ? 'Complete previous investigations to unlock' : `BOSS: ${world.boss}`}
              </p>
            </button>
          )
        })}
      </section>
    </main>
  )
}
