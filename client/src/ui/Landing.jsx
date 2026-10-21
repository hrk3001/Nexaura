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
          The Algorithm Kingdom's influence spreads through every realm. Memories are being rewritten, and Nox of the Lower Post has vanished into the Array Forest. As the Cipher Detective, you must walk the scene, break their accounts, and reconstruct the order they tried to erase.
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