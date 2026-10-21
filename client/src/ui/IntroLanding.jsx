import { useGame } from '../game/store.js'

export default function IntroLanding() {
  const { view, setView } = useGame()

  // When view is 'intro', render the cinematic.
  // Do NOT auto-navigate — stay visible until the user clicks the button.
  if (view !== 'intro') return null

  return (
    <div className="nex-root nex-intro" style={{ '--accent': '#8b5cf6' }}>
      <div className="nex-intro-canvas" />
      <main className="nex-intro-main" style={{ '--accent': '#8b5cf6' }}>
        <div className="nex-intro-title">NEXAURA</div>
        <p className="nex-intro-tagline">
          Every clue has an algorithm. Every algorithm reveals the truth.
        </p>
        <button
          className="nex-btn nex-primary lg"
          onClick={() => setView('map')}
        >
          ENTER THE INVESTIGATION →
        </button>
      </main>
    </div>
  )
}