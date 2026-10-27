import { useGame } from '../game/store.js'
import worlds, { CASE, WORLD_ORDER } from '../game/worlds.js'

// The timeline is built only from facts the six stops already reveal.
const TIMELINE = [
  ['8:05', 'Maya signs in at the fair and sets up Table 7.'],
  ['8:12', 'Wristband A17 drops out of the ride queue chain.'],
  ['8:18', "Mr. Rao's master card opens the fair office. No exit is logged."],
  ['8:20', "A second sign-in appears under Maya's badge, in a different hand."],
  ['8:26', 'A handcart marked "MAYA — DO NOT MOVE" rolls down the printing-booth road.'],
  ['8:40', "A notebook-sized parcel is set on the judges' table."],
  ['8:55', 'Case closed.'],
]

const gold = '#f5c453'
const cyan = '#5eead4'

export default function Finale() {
  const caseState = useGame((s) => s.caseState)
  const setView = useGame((s) => s.setView)

  const xp = caseState?.xp ?? 0
  const coins = caseState?.coins ?? 0
  const solved = (caseState?.solved ?? []).length
  const closed = caseState?.closedRealms ?? 0
  const total = caseState?.closedRealmsTotal ?? WORLD_ORDER.length

  return (
    <main
      data-testid="finale"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        background: 'radial-gradient(1200px 600px at 50% -10%, #0b2a3a 0%, #030a14 60%)',
        color: '#e6f1f7',
        padding: '48px 20px 64px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ letterSpacing: 3, fontSize: 12, fontWeight: 800, color: cyan }}>
          NEXAURA {'·'} CASE FILE 001 {'·'} CLOSED
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', margin: '10px 0 6px', lineHeight: 1.1 }}>
          {CASE.title}: solved
        </h1>
        <p style={{ color: '#9fb6c4', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          {CASE.location} {'·'} judging was due at {CASE.deadline} {'·'} Detective {CASE.detective}
        </p>

        <section
          style={{
            marginTop: 28,
            padding: 20,
            borderRadius: 16,
            border: `1px solid ${gold}`,
            background: 'rgba(245,196,83,.07)',
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, color: gold }}>THE ANSWER</div>
          <p style={{ fontSize: 18, lineHeight: 1.65, margin: '8px 0 0' }}>
            Nobody stole {CASE.owner}'s notebook to hurt her. Dev took it to copy her formula, and
            {' '}{CASE.organiser} moved it to the judges' table before the fair opened to keep it safe.
            The forged 8:20 sign-in, the missing wristband and the open office door were all pieces
            of the same quiet shuffle. The last page, in Dev's handwriting, says it plainly:
            {' '}<em>"I only needed the formula."</em> The notebook is back with {CASE.owner}, safe.
          </p>
        </section>

        <h2 style={{ fontSize: 20, margin: '32px 0 12px' }}>The timeline</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderLeft: `2px solid ${cyan}` }}>
          {TIMELINE.map(([time, text]) => (
            <li key={time} style={{ display: 'flex', gap: 14, padding: '8px 0 8px 16px' }}>
              <strong style={{ minWidth: 48, color: time === '8:55' ? gold : cyan, fontFamily: 'var(--mono, monospace)' }}>
                {time}
              </strong>
              <span style={{ lineHeight: 1.55 }}>{text}</span>
            </li>
          ))}
        </ol>

        <h2 style={{ fontSize: 20, margin: '32px 0 12px' }}>What each stop revealed</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {WORLD_ORDER.map((id, i) => {
            const w = worlds[id]
            if (!w) return null
            return (
              <div
                key={id}
                style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.03)' }}
              >
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: cyan, fontWeight: 800 }}>
                  {String(i + 1).padStart(2, '0')} {'·'} {String(w.subject || '').toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, margin: '4px 0' }}>{w.name}</div>
                <div style={{ fontSize: 13.5, color: '#9fb6c4', lineHeight: 1.5 }}>{w.clue}</div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,.12)',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span><strong style={{ color: gold, fontSize: 20 }}>{closed}/{total}</strong> stops cleared</span>
          <span><strong style={{ color: cyan, fontSize: 20 }}>{solved}</strong> challenges solved</span>
          <span><strong style={{ color: gold, fontSize: 20 }}>{coins.toLocaleString()}</strong> coins</span>
          <span><strong style={{ color: cyan, fontSize: 20 }}>{xp.toLocaleString()}</strong> XP</span>
        </div>

        <p style={{ color: '#9fb6c4', margin: '24px 0 0', lineHeight: 1.6 }}>
          {CASE.detective}: "Every record was a smaller piece of the same timeline. Thank you for
          reading them in order, detective."
        </p>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="nex-btn nex-primary" onClick={() => setView('map')}>
            Back to case map
          </button>
          <button type="button" className="nex-btn nex-secondary" onClick={() => setView('landing')}>
            Main menu
          </button>
        </div>
      </div>
    </main>
  )
}
