import { useGame } from '../game/store.js'

export default function Landing() {
  const { view, setView } = useGame()

  // When view is 'landing', render the case dossier landing page.
  // Do NOT auto-navigate — stay visible until the user clicks the button.
  if (view !== 'landing') return null

  return (
    <div className="nex-root nex-landing" style={{ '--accent': '#8b5cf6' }}>
      <div className="nex-landing-canvas" />
      <main className="nex-landing-main" style={{ '--accent': '#8b5cf6' }}>
        <h1 className="nex-landing-title">The Missing Notebook</h1>
        <p className="nex-landing-tagline">
          A stolen research notebook. A trail of null pointers and infinite
          loops running through the Algorithm Heart. You are Rin the Detective —
          the only one the Heart still trusts with a true order. Start in
          Array Forest and follow the evidence through the other five realms of
          the kingdom, one chain at a time. Each realm's challenge is graded by
          the real Java judge: wrong answers are red, accepted answers close the
          realm and unlock the next.
        </p>
        <div className="nex-landing-cta">
          <button
            className="nex-btn nex-primary lg"
            onClick={() => setView('intro')}
          >
            ENTER THE INVESTIGATION →
          </button>
        </div>
      </main>
    </div>
  )
}
